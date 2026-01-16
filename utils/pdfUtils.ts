import { PDFDocument, degrees, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

// Access pdfjsLib from window (loaded in index.html)
const getPdfJs = () => (window as any).pdfjsLib;

export const readFileAsArrayBuffer = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

interface ImageToPdfOptions {
    pageSize: 'A4' | 'Letter' | 'Fit';
    orientation: 'Portrait' | 'Landscape';
}

/**
 * Helper to safely load a PDF Document.
 * Centralizes error handling for password/encryption issues.
 */
const loadPdf = async (pdfBytes: Uint8Array, password?: string): Promise<PDFDocument> => {
    try {
        // Only pass password if it's a non-empty string to avoid potential ambiguity
        const options = password ? { password } : undefined;
        return await PDFDocument.load(pdfBytes, options as any);
    } catch (e: any) {
        const msg = (e.message || '').toLowerCase();
        
        // Check for encryption/password errors
        if (msg.includes('encrypted') || msg.includes('password') || msg.includes('security handler')) {
             
             // If a password was provided, verify if it's actually correct using PDF.js
             // PDF.js has broader support for encryption standards than pdf-lib
             if (password) {
                 const pdfjs = getPdfJs();
                 if (pdfjs) {
                     try {
                         // Try to open with PDF.js
                         // We use a clone or the bytes directly. 
                         // Note: We await the promise to ensure we catch the error.
                         const loadingTask = pdfjs.getDocument({ 
                             data: pdfBytes.slice(0), // Clone to avoid buffer detachment issues
                             password: password 
                         });
                         await loadingTask.promise;
                         
                         // If we reached here, PDF.js successfully opened it with the password.
                         // This means the password IS correct, but pdf-lib failed to open it.
                         throw new Error("The password is correct, but this PDF uses an encryption format (likely AES-256 R6) not supported by the editing engine.");
                     } catch (pdfJsErr: any) {
                         // If the error we just threw above was caught, rethrow it
                         if (pdfJsErr.message && pdfJsErr.message.includes('editing engine')) {
                             throw pdfJsErr;
                         }

                         // If PDF.js threw a PasswordException, the password is genuinely wrong
                         if (pdfJsErr.name === 'PasswordException' || (pdfJsErr.message && pdfJsErr.message.includes('Password'))) {
                             throw new Error("Incorrect password. Please double-check your password.");
                         }
                     }
                 }
             }

             // Default fallback message if we couldn't verify or didn't have a password
             throw new Error("Incorrect password or the file is encrypted with an unsupported format.");
        }
        throw e;
    }
};

/**
 * Fallback function to rasterize PDF pages to images and create a new PDF.
 * This effectively removes protection from unsupported formats (like AES-256 R6)
 * at the cost of converting vector data to images.
 */
const rasterizePdf = async (pdfBytes: Uint8Array, password?: string): Promise<Uint8Array> => {
    const pdfjs = getPdfJs();
    if (!pdfjs) throw new Error("PDF engine not initialized.");

    const loadingTask = pdfjs.getDocument({ 
        data: pdfBytes.slice(0), 
        password: password 
    });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    const newPdfDoc = await PDFDocument.create();
    
    // Process pages sequentially
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        // Use a scale of 2.0 for decent quality (approx 144dpi if orig is 72dpi)
        const scale = 2.0; 
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        
        await page.render({ canvasContext: context!, viewport }).promise;
        
        const imgDataUrl = canvas.toDataURL('image/png');
        // Simple base64 decode
        const base64 = imgDataUrl.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let j = 0; j < len; j++) {
            bytes[j] = binaryString.charCodeAt(j);
        }
        
        const embeddedImage = await newPdfDoc.embedPng(bytes);
        
        // Calculate original dimensions
        const { width, height } = embeddedImage.scale(1 / scale);
        
        const newPage = newPdfDoc.addPage([width, height]);
        newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width,
            height,
        });
    }
    
    return await newPdfDoc.save();
};

/**
 * Helper to get a clean, unencrypted Uint8Array of the PDF content.
 * This is used before operations that might fail on encrypted files, or to strip password.
 */
const getCleanPdfBytes = async (pdfBytes: Uint8Array, password?: string): Promise<Uint8Array> => {
    try {
        const srcDoc = await loadPdf(pdfBytes, password);
        const newDoc = await PDFDocument.create();
        const indices = srcDoc.getPageIndices();
        const copiedPages = await newDoc.copyPages(srcDoc, indices);
        copiedPages.forEach(p => newDoc.addPage(p));
        return await newDoc.save();
    } catch (e: any) {
        // Fallback for unlocking unsupported formats
        if (e.message && e.message.includes("editing engine")) {
            return await rasterizePdf(pdfBytes, password);
        }
        throw e;
    }
};

export const createPdfFromImages = async (files: File[], options: ImageToPdfOptions): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  
  for (const file of files) {
    const imageBytes = await readFileAsArrayBuffer(file);
    let image;
    try {
        if (file.type === 'image/jpeg' || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
            image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png' || file.name.endsWith('.png')) {
            image = await pdfDoc.embedPng(imageBytes);
        } else {
            continue; 
        }
    } catch (e) {
        console.warn("Failed to embed image", file.name);
        continue;
    }

    let pageWidth, pageHeight;
    let imgWidth = image.width;
    let imgHeight = image.height;

    // Determine Page Dimensions
    if (options.pageSize === 'Fit') {
        pageWidth = imgWidth;
        pageHeight = imgHeight;
    } else {
        const size = options.pageSize === 'Letter' ? PageSizes.Letter : PageSizes.A4;
        pageWidth = options.orientation === 'Portrait' ? size[0] : size[1];
        pageHeight = options.orientation === 'Portrait' ? size[1] : size[0];

        // Scale image to fit within margins
        const margin = 20;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);
        
        const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight, 1);
        imgWidth *= scale;
        imgHeight *= scale;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Center image
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    page.drawImage(image, { x, y, width: imgWidth, height: imgHeight });
  }
  return await pdfDoc.save();
};

export const mergePdfs = async (files: Uint8Array[]): Promise<Uint8Array> => {
  const mergedPdf = await PDFDocument.create();
  for (const fileBytes of files) {
    // Note: We don't support merging encrypted files without prior unlocking
    // allowing the raw error to propagate is acceptable here as App.tsx handles catching it.
    const pdf = await PDFDocument.load(fileBytes); 
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
};

export const rotatePdf = async (pdfBytes: Uint8Array, rotation: number, password?: string): Promise<Uint8Array> => {
  const pdfDoc = await loadPdf(pdfBytes, password);
  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + rotation));
  });
  return await pdfDoc.save();
};

export const organizePdf = async (pdfBytes: Uint8Array, pageOrder: number[], rotations: Record<number, number>, password?: string): Promise<Uint8Array> => {
  const pdfDoc = await loadPdf(pdfBytes, password);
  const newPdf = await PDFDocument.create();
  
  // pageOrder is 0-indexed indices of original pages
  const copiedPages = await newPdf.copyPages(pdfDoc, pageOrder);
  
  copiedPages.forEach((page, index) => {
    const rotation = rotations[index] || 0;
    if (rotation !== 0) {
      page.setRotation(degrees(page.getRotation().angle + rotation));
    }
    newPdf.addPage(page);
  });

  return await newPdf.save();
};

export const protectPdf = async (pdfBytes: Uint8Array, password: string, oldPassword?: string): Promise<Uint8Array> => {
  // 1. Get a clean version of the PDF (decrypted if it was encrypted)
  const cleanBytes = await getCleanPdfBytes(pdfBytes, oldPassword);

  // 2. Encrypt using @pdfsmaller/pdf-encrypt-lite
  const encryptedBytes = await encryptPDF(cleanBytes, password, password);
  
  if (!encryptedBytes || encryptedBytes.length === 0) {
      throw new Error("Encryption failed: Output is empty.");
  }

  return encryptedBytes;
};

export const unlockPdf = async (pdfBytes: Uint8Array, password: string): Promise<Uint8Array> => {
  // Use getCleanPdfBytes to ensure a completely fresh PDF structure without encryption dictionary
  // This effectively removes the password.
  return await getCleanPdfBytes(pdfBytes, password);
};

export const compressPdf = async (pdfBytes: Uint8Array, password?: string): Promise<Uint8Array> => {
  const pdfDoc = await loadPdf(pdfBytes, password);
  return await pdfDoc.save({ useObjectStreams: false });
};

export const convertHtmlToPdf = async (html: string, baseUrl?: string): Promise<Uint8Array> => {
    // Create an isolated iframe to render HTML
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
        position: "fixed", left: "-9999px", top: "0", width: "1px", height: "1px",
        border: "none", visibility: "hidden", pointerEvents: "none"
    });
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
        document.body.removeChild(iframe);
        throw new Error("Failed to create iframe for HTML rendering");
    }

    try {
        const pageWidthPx = 794; // A4 approx 96dpi
        const pageHeightPx = 1123;
        
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                ${baseUrl ? `<base href="${baseUrl}" />` : ''}
                <style>
                  body { width: ${pageWidthPx}px; margin: 0; padding: 20px; font-family: sans-serif; background: #fff; }
                  * { box-sizing: border-box; }
                  img { max-width: 100%; }
                </style>
              </head>
              <body>${html}</body>
            </html>
        `);
        iframeDoc.close();

        // Wait for potential images/fonts
        await new Promise(r => setTimeout(r, 1000));

        const canvas = await html2canvas(iframeDoc.body, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: pageWidthPx,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

        if (iframe.parentNode) document.body.removeChild(iframe);
        
        return new Uint8Array(pdf.output("arraybuffer"));

    } catch (e: any) {
        if (iframe.parentNode) document.body.removeChild(iframe);
        throw new Error(`Failed to convert HTML: ${e.message}`);
    }
};

interface WatermarkOptions {
    text: string;
    fontSize: number;
    color: string; // Hex
    opacity: number;
    position: 'TL' | 'TM' | 'TR' | 'ML' | 'C' | 'MR' | 'BL' | 'BM' | 'BR';
}

export const watermarkPdf = async (pdfBytes: Uint8Array, options: WatermarkOptions, password?: string): Promise<Uint8Array> => {
    const pdfDoc = await loadPdf(pdfBytes, password);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Hex to RGB
    const r = parseInt(options.color.slice(1, 3), 16) / 255;
    const g = parseInt(options.color.slice(3, 5), 16) / 255;
    const b = parseInt(options.color.slice(5, 7), 16) / 255;

    for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
        const textHeight = options.fontSize; // Approx

        let x = 0;
        let y = 0;
        const margin = 20;

        // Position Logic
        switch (options.position) {
            case 'TL': x = margin; y = height - textHeight - margin; break;
            case 'TM': x = (width - textWidth) / 2; y = height - textHeight - margin; break;
            case 'TR': x = width - textWidth - margin; y = height - textHeight - margin; break;
            case 'ML': x = margin; y = (height - textHeight) / 2; break;
            case 'C':  x = (width - textWidth) / 2; y = (height - textHeight) / 2; break;
            case 'MR': x = width - textWidth - margin; y = (height - textHeight) / 2; break;
            case 'BL': x = margin; y = margin; break;
            case 'BM': x = (width - textWidth) / 2; y = margin; break;
            case 'BR': x = width - textWidth - margin; y = margin; break;
        }

        page.drawText(options.text, {
            x,
            y,
            size: options.fontSize,
            font: font,
            color: rgb(r, g, b),
            opacity: options.opacity,
            rotate: degrees(0),
        });
    }

    return await pdfDoc.save();
};

export const generatePdfThumbnails = async (pdfBytes: Uint8Array, password?: string): Promise<string[]> => {
    const pdfjs = getPdfJs();
    if (!pdfjs) return [];

    try {
        const loadingTask = pdfjs.getDocument({ 
            data: pdfBytes, 
            password: password 
        });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const thumbnails: string[] = [];

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 }); // Scale down for thumbnail
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context!,
                viewport: viewport
            }).promise;

            thumbnails.push(canvas.toDataURL());
        }
        return thumbnails;
    } catch (e) {
        console.error("Thumbnail generation error:", e);
        return [];
    }
};

export const checkPdfPassword = async (file: File): Promise<boolean> => {
    // Quick check if file is encrypted using pdfjs
    const pdfjs = getPdfJs();
    if (!pdfjs) return false;
    const arrayBuffer = await readFileAsArrayBuffer(file);
    try {
        await pdfjs.getDocument({ data: arrayBuffer }).promise;
        return false; // Opened fine, no password
    } catch (e: any) {
        if (e.name === 'PasswordException') {
            return true;
        }
        return false;
    }
}