import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { TOOLS, ToolType, PdfFile } from './types.ts';
import {
  FileText, Merge, Split, Minimize2, Lock, Unlock, RotateCw, Grid, Image, Code, Stamp, 
  Home, ChevronRight, Download, ArrowRight, Upload, X, CheckCircle, AlertTriangle, Sun, Moon,
  Trash2, ArrowLeft, ArrowUp
} from 'lucide-react';

// --- Icons Helper ---
const getIcon = (name: string) => {
  const icons: any = { Merge, Split, Minimize2, Lock, Unlock, RotateCw, Grid, Image, Code, Stamp };
  return icons[name] || FileText;
};

// --- Context ---
interface AppState {
  processedFile: PdfFile | null;
  setProcessedFile: (file: PdfFile | null) => void;
}

const AppContext = createContext<AppState>({
  processedFile: null,
  setProcessedFile: () => {},
});

export const useAppState = () => useContext(AppContext);

interface ThemeState {
    isDarkMode: boolean;
    toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeState>({ isDarkMode: true, toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

// --- Components ---

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Updated Backgrounds: Space for Dark, Greenery for Light
  const bgImage = isDarkMode 
    ? "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')"
    : "url('https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2000&auto=format&fit=crop')";

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <div 
        className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'text-slate-100 selection:bg-primary/30' : 'text-slate-800 selection:bg-primary/20'}`}
        style={{ 
            backgroundImage: bgImage, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed' 
        }}
      >
        <div className={`absolute inset-0 pointer-events-none z-0 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-white/40 backdrop-blur-sm'}`}></div>
        
        <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${isDarkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-300 bg-white/80'} backdrop-blur-md`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-primary/90 text-white p-2 rounded-lg shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                <FileText size={24} />
              </div>
              <span className={`text-xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-slate-400' : 'bg-gradient-to-r from-slate-900 to-slate-600'}`}>
                LocalPDF <span className="text-primary text-sm font-medium">Enhanced</span>
              </span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link to="/" className={`hidden md:block text-sm font-medium transition-colors px-3 py-2 rounded-lg ${isDarkMode ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}>All Tools</Link>
              <button 
                onClick={toggleTheme} 
                className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-yellow-300 hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                aria-label="Toggle Theme"
              >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </nav>
          </div>
        </header>
        <main className="relative z-10 flex-grow">
          {children}
        </main>
        <footer className={`border-t py-8 mt-auto backdrop-blur-sm transition-colors duration-300 ${isDarkMode ? 'border-white/10 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-white/60 text-slate-600'}`}>
          <div className="max-w-7xl mx-auto px-4 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} LocalPDF Enhanced. Client-side secure processing.</p>
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
};

const ToolCard: React.FC<{ tool: typeof TOOLS[0] }> = ({ tool }) => {
  const { isDarkMode } = useTheme();
  const Icon = getIcon(tool.icon);
  
  // Card Styles with thick gray border in light mode
  const cardStyles = isDarkMode
    ? "bg-slate-800/40 backdrop-blur-md border-white/10 hover:bg-slate-800/60 text-slate-100"
    : "bg-white/90 backdrop-blur-md border-2 border-slate-300 hover:border-slate-400 hover:bg-white text-slate-900 shadow-lg";

  const iconBg = isDarkMode
    ? "from-slate-700/50 to-slate-800/50 border-white/5"
    : "from-slate-100 to-white border-slate-200";

  return (
    <Link to={`/${tool.id}`} className={`group flex flex-col p-6 rounded-2xl border transition-all duration-300 shadow-lg hover:shadow-2xl hover:border-primary/50 ${cardStyles}`}>
      <div className={`h-14 w-14 rounded-xl bg-gradient-to-br border text-primary flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner ${iconBg}`}>
        <Icon size={28} />
      </div>
      <h3 className={`text-xl font-bold mb-2 group-hover:text-primary transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{tool.name}</h3>
      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tool.description}</p>
    </Link>
  );
};

const HomePage = () => {
  const { setProcessedFile } = useAppState();
  const { isDarkMode } = useTheme();
  useEffect(() => setProcessedFile(null), []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className={`text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text mb-6 tracking-tight ${isDarkMode ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400' : 'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500'}`}>
          Master your PDFs
        </h1>
        <p className={`text-xl max-w-2xl mx-auto font-light ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
          Secure, private, and free. All processing happens in your browser. <br className="hidden md:block"/>No files are uploaded to any server.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
};

// --- Tool Logic Imports ---
import { 
  mergePdfs, rotatePdf, protectPdf, unlockPdf, createPdfFromImages, 
  readFileAsArrayBuffer, organizePdf, compressPdf, watermarkPdf,
  generatePdfThumbnails, checkPdfPassword, convertHtmlToPdf
} from './utils/pdfUtils.ts';
import { PDFDocument } from 'pdf-lib';
import jsPDF from 'jspdf';

// --- Generic Tool Wrapper ---
const ToolPage: React.FC = () => {
  const { pathname } = useLocation();
  const toolId = pathname.substring(1);
  const tool = TOOLS.find(t => t.id === toolId);
  const { processedFile, setProcessedFile } = useAppState();
  const { isDarkMode } = useTheme();
  
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ data: Uint8Array; fileName: string } | null>(null);
  
  // States
  const [password, setPassword] = useState(''); // For Protecting or Unlocking
  const [inputPassword, setInputPassword] = useState(''); // For reading encrypted input
  const [isEncryptedInput, setIsEncryptedInput] = useState(false); // Flag if input needs pass

  const [rotation, setRotation] = useState(0); 
  const [htmlUrl, setHtmlUrl] = useState('');
  const [customFileName, setCustomFileName] = useState('');
  
  // Organize State
  const [pages, setPages] = useState<number[]>([]); 
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [numPages, setNumPages] = useState(0);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);

  // Image to PDF State
  const [imgPageSize, setImgPageSize] = useState<'A4' | 'Letter' | 'Fit'>('A4');
  const [imgOrientation, setImgOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');

  // Watermark State
  const [wmText, setWmText] = useState('Confidential');
  const [wmSize, setWmSize] = useState(48);
  const [wmColor, setWmColor] = useState('#FF0000');
  const [wmOpacity, setWmOpacity] = useState(0.5);
  const [wmPosition, setWmPosition] = useState<'TL' | 'TM' | 'TR' | 'ML' | 'C' | 'MR' | 'BL' | 'BM' | 'BR'>('C');

  // Theme Styles helpers
  const containerClass = isDarkMode 
    ? "bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-2xl"
    : "bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-2xl"; // Added thicker gray line for light mode
    
  const inputClass = isDarkMode
    ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-600 focus:ring-primary"
    : "bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-primary shadow-sm focus:border-primary";
    
  const labelClass = isDarkMode ? "text-slate-300" : "text-slate-700 font-medium";

  useEffect(() => {
    // Reset state on tool change
    setFiles([]);
    setResult(null);
    setPassword('');
    setInputPassword('');
    setIsEncryptedInput(false);
    setRotation(0);
    setHtmlUrl('');
    setCustomFileName('');
    setPages([]);
    setPageThumbnails([]);
    setWmText('Confidential');
    
    // Check if we have a chained file
    if (processedFile) {
      const file = new File([processedFile.data], processedFile.name, { type: processedFile.type }) as File;
      setFiles([file]);
      checkAndLoadPageInfo(file);
      setCustomFileName(processedFile.name.replace('.pdf', '') + '_processed');
    }
  }, [toolId]);

  // Ensure filename is set if files exist (fix for rotate/organize feedback)
  useEffect(() => {
    if (files.length > 0 && !customFileName) {
        let baseName = files[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
        if (toolId === ToolType.Merge) baseName = 'merged';
        else if (toolId === ToolType.ImageToPdf) baseName = 'images';
        setCustomFileName(baseName + '_processed');
    }
  }, [files, toolId]);

  const checkAndLoadPageInfo = async (file: File) => {
      // First check if it's encrypted
      if (file.type === 'application/pdf') {
          const isLocked = await checkPdfPassword(file);
          if (isLocked && toolId !== ToolType.Unlock) {
              setIsEncryptedInput(true);
              return; // Wait for password
          }
      }
      
      if (toolId === ToolType.Organize || toolId === ToolType.Rotate) {
        loadPageInfo(file);
      }
  };

  const handleInputPasswordSubmit = async () => {
      if (!files[0]) return;
      // Try to load info with password
      try {
          const bytes = await readFileAsArrayBuffer(files[0]);
          await PDFDocument.load(bytes, { password: inputPassword } as any);
          // If successful
          setIsEncryptedInput(false);
          if (toolId === ToolType.Organize || toolId === ToolType.Rotate) {
             loadPageInfo(files[0], inputPassword);
          }
      } catch (e) {
          alert("Incorrect password");
      }
  }

  const loadPageInfo = async (file: File, filePassword?: string) => {
    try {
      setLoadingThumbnails(true);
      const bytes = await readFileAsArrayBuffer(file);
      // For logic
      const doc = await PDFDocument.load(bytes, { password: filePassword } as any);
      const count = doc.getPageCount();
      setNumPages(count);
      setPages(Array.from({ length: count }, (_, i) => i));

      // For previews (Organize tool)
      if (toolId === ToolType.Organize) {
          const thumbs = await generatePdfThumbnails(bytes, filePassword);
          setPageThumbnails(thumbs);
      }
    } catch (e) {
      console.error("Error loading PDF info", e);
    } finally {
        setLoadingThumbnails(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = toolId === ToolType.Merge || toolId === ToolType.ImageToPdf ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      
      // For single file tools that need page info
      if ((toolId === ToolType.Organize || toolId === ToolType.Rotate) && updatedFiles.length > 0) {
        checkAndLoadPageInfo(updatedFiles[0]);
      } else if (updatedFiles.length > 0 && updatedFiles[0].type === 'application/pdf' && toolId !== ToolType.Unlock) {
          // Check encryption for other tools too
          const isLocked = await checkPdfPassword(updatedFiles[0]);
          if(isLocked) setIsEncryptedInput(true);
      }
    }
  };

  const processAction = async () => {
    if (isEncryptedInput) {
        alert("Please unlock the file first by entering the password above.");
        return;
    }
    setIsProcessing(true);
    try {
      let outputBytes: Uint8Array | null = null;
      let outputName = customFileName || (files[0] ? files[0].name.replace('.pdf', '') : 'document');
      
      if (!outputName.toLowerCase().endsWith('.pdf')) outputName += '.pdf';

      if (toolId === ToolType.Merge) {
        const fileBuffers = await Promise.all(files.map(f => readFileAsArrayBuffer(f)));
        outputBytes = await mergePdfs(fileBuffers);
      } else if (toolId === ToolType.Protect) {
        if (!password) {
            alert("Please enter a password to protect the file.");
            setIsProcessing(false);
            return;
        }
        const bytes = await readFileAsArrayBuffer(files[0]);
        // Pass both new password and (optional) input file password
        outputBytes = await protectPdf(bytes, password, inputPassword);
      } else if (toolId === ToolType.Unlock) {
        // Unlock doesn't strictly need a password if the file isn't encrypted, but if it is, 
        // the user typically provides it. However, if they want to REMOVE encryption 
        // from a file they opened (maybe with inputPassword), we use that.
        // If the tool prompts for password, use that.
        const passToUse = password || inputPassword;
        const bytes = await readFileAsArrayBuffer(files[0]);
        outputBytes = await unlockPdf(bytes, passToUse);
      } else if (toolId === ToolType.Rotate) {
        const bytes = await readFileAsArrayBuffer(files[0]);
        outputBytes = await rotatePdf(bytes, rotation, inputPassword);
      } else if (toolId === ToolType.Organize) {
        const bytes = await readFileAsArrayBuffer(files[0]);
        outputBytes = await organizePdf(bytes, pages, pageRotations, inputPassword);
      } else if (toolId === ToolType.ImageToPdf) {
        outputBytes = await createPdfFromImages(files, { pageSize: imgPageSize, orientation: imgOrientation });
      } else if (toolId === ToolType.HtmlToPdf) {
         // handleHtmlToPdf handles internal processing and finishProcessing
         await handleHtmlToPdf(outputName);
         return; 
      } else if (toolId === ToolType.Compress) {
        const bytes = await readFileAsArrayBuffer(files[0]);
        outputBytes = await compressPdf(bytes, inputPassword);
      } else if (toolId === ToolType.Watermark) {
          const bytes = await readFileAsArrayBuffer(files[0]);
          outputBytes = await watermarkPdf(bytes, {
              text: wmText, fontSize: wmSize, color: wmColor, opacity: wmOpacity, position: wmPosition
          }, inputPassword);
      }

      if (outputBytes) {
        finishProcessing(outputBytes, outputName);
      }

    } catch (err) {
      // Show actual error message
      alert("Error processing PDF: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHtmlToPdf = async (fileName: string) => {
    if (!htmlUrl) {
        alert("Please enter a URL");
        setIsProcessing(false);
        return;
    }
    try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(htmlUrl);
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Could not fetch website content.");
        const text = await response.text();
        // Pass the original URL to resolve relative paths
        const pdfBytes = await convertHtmlToPdf(text, htmlUrl);
        finishProcessing(pdfBytes, fileName);
    } catch (e) {
        alert("Error converting HTML: " + (e as Error).message);
        setIsProcessing(false);
    }
  }

  const finishProcessing = (data: Uint8Array, fileName: string) => {
    setResult({ data, fileName });
    setProcessedFile({ name: fileName, data, type: 'application/pdf' });
    setIsProcessing(false);
  };

  const downloadFile = () => {
    if (!result) return;
    const blob = new Blob([result.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Render Helpers ---

  const renderOrganizer = () => {
      const movePage = (index: number, direction: -1 | 1) => {
          const newPages = [...pages];
          if (direction === -1 && index > 0) {
              [newPages[index], newPages[index - 1]] = [newPages[index - 1], newPages[index]];
          } else if (direction === 1 && index < newPages.length - 1) {
              [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
          }
          setPages(newPages);
      };
      
      const rotatePage = (index: number) => {
          setPageRotations(prev => {
              const current = prev[index] || 0;
              return { ...prev, [index]: (current + 90) % 360 };
          });
      };

      const removePage = (index: number) => {
          const newPages = pages.filter((_, i) => i !== index);
          setPages(newPages);
      };

      if (loadingThumbnails) return <div className={`text-center p-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading page previews...</div>;

      return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {pages.map((originalPageIndex, displayIndex) => (
                  <div key={displayIndex} className={`${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-100 border-slate-300'} p-2 rounded-lg shadow border flex flex-col items-center group relative transition-colors`}>
                      <div className={`w-full aspect-[1/1.4] ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} mb-3 flex items-center justify-center relative rounded-sm overflow-hidden shadow-sm`}>
                          {pageThumbnails[originalPageIndex] ? (
                               <img 
                                src={pageThumbnails[originalPageIndex]} 
                                className="w-full h-full object-contain transition-transform duration-300"
                                style={{ transform: `rotate(${pageRotations[displayIndex] || 0}deg)` }}
                                alt={`Page ${originalPageIndex + 1}`}
                               />
                          ) : (
                              <span className="text-xs text-slate-500">No Preview</span>
                          )}
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                              {originalPageIndex + 1}
                          </div>
                          
                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => rotatePage(displayIndex)} className="p-1.5 bg-white text-slate-900 rounded-full hover:bg-primary hover:text-white transition-colors" title="Rotate">
                                  <RotateCw size={14} />
                              </button>
                              <button onClick={() => removePage(displayIndex)} className="p-1.5 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors" title="Remove">
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </div>
                      
                      <div className="flex gap-2 w-full justify-center">
                          <button 
                            disabled={displayIndex === 0}
                            onClick={() => movePage(displayIndex, -1)}
                            className={`p-1 rounded ${displayIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                          >
                              <ArrowLeft size={14} className={isDarkMode ? 'text-slate-300' : 'text-slate-700'} />
                          </button>
                          <button 
                             disabled={displayIndex === pages.length - 1}
                             onClick={() => movePage(displayIndex, 1)}
                             className={`p-1 rounded ${displayIndex === pages.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                          >
                              <ArrowRight size={14} className={isDarkMode ? 'text-slate-300' : 'text-slate-700'} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      );
  }

  if (!tool) return null;
  const Icon = getIcon(tool.icon);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className={`inline-flex items-center text-sm mb-8 hover:text-primary transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        <Home size={16} className="mr-2" /> Back to Tools
      </Link>

      <div className={`rounded-3xl p-8 md:p-12 transition-all duration-300 ${containerClass}`}>
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Icon size={32} className="text-primary" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{tool.name}</h1>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tool.description}</p>
          </div>
        </div>

        {/* Input Encryption Password Prompt */}
        {isEncryptedInput && (
            <div className={`mb-8 p-6 rounded-xl border border-yellow-500/30 ${isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                <div className="flex items-center gap-3 text-yellow-500 mb-4">
                    <Lock size={20} />
                    <h3 className="font-bold">This file is password protected</h3>
                </div>
                <div className="flex gap-4">
                    <input 
                        type="password" 
                        placeholder="Enter file password"
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        className={`flex-1 rounded-lg px-4 py-2 outline-none border transition-all ${inputClass}`}
                    />
                    <button onClick={handleInputPasswordSubmit} className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400">
                        Unlock File
                    </button>
                </div>
            </div>
        )}

        {/* Main Interface */}
        {!result ? (
          <div className="space-y-8">
            {/* File Upload Area */}
            {toolId !== ToolType.HtmlToPdf && (
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDarkMode ? 'border-slate-700 hover:border-primary/50 hover:bg-slate-800/50' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}`}>
                <input
                    type="file"
                    id="file-upload"
                    multiple={toolId === ToolType.Merge || toolId === ToolType.ImageToPdf}
                    accept={toolId === ToolType.ImageToPdf ? "image/*" : "application/pdf"}
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                    <div className="bg-slate-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <Upload size={32} />
                    </div>
                    <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {files.length > 0 ? `${files.length} file(s) selected` : "Drop files here or click to upload"}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {toolId === ToolType.ImageToPdf ? "Supports JPG, PNG" : "Supports PDF files"}
                    </p>
                </label>
                {files.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {files.map((f, i) => (
                        <div key={i} className={`text-sm px-3 py-1 rounded-full flex items-center ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-800'}`}>
                        {f.name}
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                setFiles(files.filter((_, idx) => idx !== i));
                            }} 
                            className="ml-2 hover:text-red-400"
                        >
                            <X size={12} />
                        </button>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            )}

            {/* Tool Specific Controls */}
            {files.length > 0 && !isEncryptedInput && (
                <div className="space-y-6 animate-fade-in">
                    
                    {toolId === ToolType.Protect && (
                        <div>
                            <label className={`block mb-2 ${labelClass}`}>Set Password</label>
                            <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter secure password"
                            className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${inputClass}`}
                            />
                        </div>
                    )}

                    {toolId === ToolType.Unlock && (
                        <div>
                             <label className={`block mb-2 ${labelClass}`}>Enter Password to Unlock</label>
                             <p className="text-xs text-slate-500 mb-2">If the file was already unlocked above, leave this blank or re-enter if needed.</p>
                            <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter file password"
                            className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${inputClass}`}
                            />
                        </div>
                    )}

                    {toolId === ToolType.Rotate && (
                        <div className="flex flex-col items-center p-6 rounded-xl border border-dashed border-slate-600/30">
                           <p className={`mb-4 ${labelClass}`}>Rotation: {rotation}°</p>
                           <div className="flex gap-4">
                               <button onClick={() => setRotation((r) => (r - 90) % 360)} className="p-3 bg-slate-700 text-white rounded-lg hover:bg-primary transition-colors"><RotateCw className="scale-x-[-1]" /></button>
                               <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-3 bg-slate-700 text-white rounded-lg hover:bg-primary transition-colors"><RotateCw /></button>
                           </div>
                        </div>
                    )}

                    {toolId === ToolType.Organize && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className={labelClass}>Reorder, Rotate or Delete Pages</label>
                                <span className="text-xs text-slate-500">Drag not supported yet, use arrows</span>
                            </div>
                            {renderOrganizer()}
                        </div>
                    )}

                    {toolId === ToolType.ImageToPdf && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block mb-2 ${labelClass}`}>Page Size</label>
                                <select value={imgPageSize} onChange={(e) => setImgPageSize(e.target.value as any)} className={`w-full rounded-lg px-4 py-2 outline-none border ${inputClass}`}>
                                    <option value="A4">A4</option>
                                    <option value="Letter">Letter</option>
                                    <option value="Fit">Fit to Image</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block mb-2 ${labelClass}`}>Orientation</label>
                                <select value={imgOrientation} onChange={(e) => setImgOrientation(e.target.value as any)} className={`w-full rounded-lg px-4 py-2 outline-none border ${inputClass}`}>
                                    <option value="Portrait">Portrait</option>
                                    <option value="Landscape">Landscape</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {toolId === ToolType.Watermark && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className={`block mb-2 ${labelClass}`}>Watermark Text</label>
                                <input type="text" value={wmText} onChange={(e) => setWmText(e.target.value)} className={`w-full rounded-lg px-4 py-2 outline-none border ${inputClass}`} />
                             </div>
                             <div>
                                <label className={`block mb-2 ${labelClass}`}>Color</label>
                                <input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                             </div>
                             <div>
                                 <label className={`block mb-2 ${labelClass}`}>Size: {wmSize}px</label>
                                 <input type="range" min="10" max="200" value={wmSize} onChange={(e) => setWmSize(Number(e.target.value))} className="w-full" />
                             </div>
                             <div>
                                 <label className={`block mb-2 ${labelClass}`}>Opacity: {wmOpacity}</label>
                                 <input type="range" min="0.1" max="1" step="0.1" value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} className="w-full" />
                             </div>
                             <div className="md:col-span-2">
                                 <label className={`block mb-2 ${labelClass}`}>Position</label>
                                 <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                                     {['TL', 'TM', 'TR', 'ML', 'C', 'MR', 'BL', 'BM', 'BR'].map(pos => (
                                         <button 
                                            key={pos}
                                            onClick={() => setWmPosition(pos as any)}
                                            className={`p-2 rounded border ${wmPosition === pos ? 'bg-primary text-white border-primary' : `${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`}`}
                                         >
                                             •
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         </div>
                    )}
                </div>
            )}

            {toolId === ToolType.HtmlToPdf && (
                 <div className="space-y-4">
                     <div>
                        <label className={`block mb-2 ${labelClass}`}>Website URL (e.g., https://example.com)</label>
                        <input
                        type="url"
                        value={htmlUrl}
                        onChange={(e) => setHtmlUrl(e.target.value)}
                        placeholder="https://example.com"
                        className={`w-full rounded-xl px-4 py-3 outline-none border transition-all ${inputClass}`}
                        />
                         <p className="text-xs text-slate-500 mt-2">Note: Complex sites with logins or dynamic JS might not render perfectly.</p>
                     </div>
                 </div>
            )}

            {/* Filename Input & Process Button */}
            {(files.length > 0 || toolId === ToolType.HtmlToPdf) && !isEncryptedInput && (
                <div className="pt-4 border-t border-slate-500/20">
                     <div className="mb-6">
                        <label className={`block mb-2 text-sm ${labelClass}`}>Output Filename (Optional)</label>
                        <input
                            type="text"
                            value={customFileName}
                            onChange={(e) => setCustomFileName(e.target.value)}
                            placeholder="my-document"
                            className={`w-full rounded-lg px-4 py-2 outline-none border ${inputClass}`}
                        />
                    </div>

                    <button
                        onClick={processAction}
                        disabled={isProcessing}
                        className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                        <span className="animate-pulse">Processing...</span>
                        ) : (
                        <>
                            <span>{tool.name}</span>
                            <ArrowRight size={20} />
                        </>
                        )}
                    </button>
                </div>
            )}
          </div>
        ) : (
          <div className="text-center animate-fade-in space-y-8">
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} />
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Success!</h2>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your file is ready.</p>
            </div>

            <button
              onClick={downloadFile}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-xl shadow-lg shadow-green-600/30 transition-all inline-flex items-center space-x-3 text-lg"
            >
              <Download size={24} />
              <span>Download PDF</span>
            </button>

             {/* Chain Processing Section */}
             <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-300'}`}>
                <h3 className={`text-lg font-medium mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Continue processing with this file:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TOOLS.filter(t => t.id !== toolId).map(t => {
                        const TIcon = getIcon(t.icon);
                        return (
                             <Link 
                                key={t.id} 
                                to={`/${t.id}`}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${isDarkMode ? 'bg-slate-800/50 border-white/5 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                             >
                                 <TIcon size={20} className="text-primary" />
                                 <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.name}</span>
                             </Link>
                        )
                    })}
                </div>
             </div>

            <button
              onClick={() => {
                  setResult(null);
                  setProcessedFile(null);
                  setFiles([]);
              }}
              className={`mt-6 text-sm underline ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- App Root ---
const App = () => {
  const [processedFile, setProcessedFile] = useState<PdfFile | null>(null);

  return (
    <AppContext.Provider value={{ processedFile, setProcessedFile }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:toolId" element={<ToolPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;