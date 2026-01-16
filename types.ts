export enum ToolType {
  Merge = 'merge',
  Split = 'split',
  Compress = 'compress',
  Protect = 'protect',
  Unlock = 'unlock',
  Rotate = 'rotate',
  Organize = 'organize',
  ImageToPdf = 'image-to-pdf',
  HtmlToPdf = 'html-to-pdf',
  Watermark = 'watermark'
}

export interface PdfFile {
  name: string;
  data: Uint8Array;
  type: string;
}

export const TOOLS = [
  {
    id: ToolType.Unlock,
    name: 'Unlock PDF',
    description: 'Remove passwords and encryption from PDF files.',
    icon: 'Unlock',
  },
  {
    id: ToolType.Protect,
    name: 'Protect PDF',
    description: 'Encrypt your PDF with a password.',
    icon: 'Lock',
  },
  {
    id: ToolType.Compress,
    name: 'Compress PDF',
    description: 'Reduce file size while maintaining quality.',
    icon: 'Minimize2',
  },
  {
    id: ToolType.Organize,
    name: 'Organize PDF',
    description: 'Rearrange, rotate, or delete pages.',
    icon: 'Grid',
  },
  {
    id: ToolType.ImageToPdf,
    name: 'Image to PDF',
    description: 'Convert JPG, PNG images to PDF.',
    icon: 'Image',
  },
  {
    id: ToolType.Merge,
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into a single file.',
    icon: 'Merge',
  },
  {
    id: ToolType.Split,
    name: 'Split PDF',
    description: 'Extract pages or split document into multiple files.',
    icon: 'Split',
  },
  {
    id: ToolType.Rotate,
    name: 'Rotate PDF',
    description: 'Rotate PDF pages permanently.',
    icon: 'RotateCw',
  },
  {
    id: ToolType.Watermark,
    name: 'Watermark',
    description: 'Add text watermarks to your PDF pages.',
    icon: 'Stamp',
  },
  {
    id: ToolType.HtmlToPdf,
    name: 'HTML to PDF',
    description: 'Convert webpages to PDF documents.',
    icon: 'Code',
  },
];