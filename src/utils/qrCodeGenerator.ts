import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExcelRow } from './excelParser';
import * as QRCode from 'qrcode';

// Define a type for custom page size
export type PageSize = 'a4' | 'a3' | 'letter' | 'custom' | { width: number; height: number };

// Define options for QR code generation
export interface GenerationOptions {
  boxWidth: number; // width of each box in mm
  boxHeight: number; // height of each box in mm
  qrCodeSize: number; // size of QR code as a proportion of box height (0 to 1)
  orientation: 'portrait' | 'landscape'; 
  fontSize: number; // font size in points
  pageSize: PageSize; // page size
  fontFamily: string; // font family to use
  boxesPerRow?: number; // optional manual override for boxes per row
  boxesPerColumn?: number; // optional manual override for boxes per column
  countOutsideBox?: boolean; // whether to place count number outside the box
  boxSpacing?: number; // spacing between boxes in mm
  showFooter?: boolean; // whether to show the footer
  customQty?: string; // custom quantity text
  footerFontSize?: number; // footer font size
  // Color options
  boxBorderColor?: string; // color for box border (default: #FF0000 - red)
  countColor?: string; // color for count numbers (default: #FF0000 - red)
  serialColor?: string; // color for serial numbers (default: #000000 - black)
  qrCodeColor?: string; // color for QR code (default: #000000 - black)
  qrCodeBgColor?: string; // background color for QR code (default: #FFFFFF - white)
  footerQtyColor?: string; // color for "Qty. - X each" text (default: #FF0000 - red)
  footerInfoColor?: string; // color for sticker info text (default: #00AA50 - green)
  // New options
  qrCodeTransparentBg?: boolean; // whether to use transparent background for QR code
  qrCodeWidth?: number; // custom width for QR code in mm (overrides qrCodeSize)
  qrCodeHeight?: number; // custom height for QR code in mm (overrides qrCodeSize)
}

// Default options
const defaultOptions: GenerationOptions = {
  boxWidth: 50, // 50mm width
  boxHeight: 30, // 30mm height
  qrCodeSize: 0.6, // QR code size 60% of box height
  orientation: 'portrait',
  fontSize: 9, // 9pt font size
  pageSize: 'a4', // A4 page size
  fontFamily: 'helvetica-bold', // Helvetica Bold font
  countOutsideBox: true, // Default count outside box
  boxSpacing: 10, // Default 10mm spacing between boxes
  showFooter: true, // Default show footer
  footerFontSize: 12, // Default footer font size
  // Default color options
  boxBorderColor: '#FF0000', // Red box border
  countColor: '#FF0000', // Red count numbers
  serialColor: '#000000', // Black serial numbers
  qrCodeColor: '#000000', // Black QR code
  qrCodeBgColor: '#FFFFFF', // White QR code background
  footerQtyColor: '#FF0000', // Red quantity text in footer
  footerInfoColor: '#00AA50', // Green info text in footer
  // Defaults for new options
  qrCodeTransparentBg: false, // Default to non-transparent background
  qrCodeWidth: undefined, // Default to using qrCodeSize
  qrCodeHeight: undefined, // Default to using qrCodeSize
};

// Gets page dimensions in mm based on the page size
const getPageDimensions = (pageSize: PageSize, orientation: 'portrait' | 'landscape'): { width: number; height: number } => {
  let width: number, height: number;
  
  if (typeof pageSize === 'object' && 'width' in pageSize) {
    width = pageSize.width;
    height = pageSize.height;
  } else {
    switch (pageSize) {
      case 'a3':
        width = 297; height = 420;
        break;
      case 'letter':
        width = 215.9; height = 279.4;
        break;
      case 'custom':
        // This should be handled by the caller using the object version
        width = 210; height = 297;
        break;
      case 'a4':
      default:
        width = 210; height = 297;
    }
  }
  
  return orientation === 'portrait' 
    ? { width, height } 
    : { width: height, height: width };
};

// Generate QR code as SVG
export const generateQRCodeSVG = (text: string, index: number, options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  const size = 100;
  
  // Apply transparent background if requested
  const bgFill = opts.qrCodeTransparentBg ? 'transparent' : opts.qrCodeBgColor;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="${bgFill}" />
      <rect x="10%" y="10%" width="80%" height="80%" fill="${opts.qrCodeColor}" />
      <text x="10%" y="20%" font-family="${opts.fontFamily.replace('-bold', '')}" font-size="10" fill="${opts.countColor}" text-anchor="start">
        ${index}.
      </text>
      <text x="25%" y="50%" font-family="${opts.fontFamily.replace('-bold', '')}" font-size="10" font-weight="bold" fill="${opts.serialColor}" text-anchor="start">
        ${text}
      </text>
    </svg>
  `;
  
  return svg;
};

// Generate EPS version of a QR code
export const generateQRCodeEPS = (text: string, index: number, options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  const size = 300; // Increased size for better visibility
  
  const fontName = opts.fontFamily.includes('bold') 
    ? `/${opts.fontFamily === 'denso-bold' ? 'OCR-B-Bold' : 'Helvetica-Bold'} findfont def` 
    : `/${opts.fontFamily === 'denso' ? 'OCR-B' : (opts.fontFamily.charAt(0).toUpperCase() + opts.fontFamily.slice(1))} findfont def`;
  
  // Convert hex colors to RGB for EPS
  const countColorRGB = hexToRGB(opts.countColor || defaultOptions.countColor!);
  const serialColorRGB = hexToRGB(opts.serialColor || defaultOptions.serialColor!);
  const qrColorRGB = hexToRGB(opts.qrCodeColor || defaultOptions.qrCodeColor!);
  const qrBgColorRGB = hexToRGB(opts.qrCodeBgColor || defaultOptions.qrCodeBgColor!);
  
  // Handle transparent background for EPS
  const bgColorCommand = opts.qrCodeTransparentBg ? 
    '% No background fill (transparent)' : 
    `${qrBgColorRGB} SRGB\n${size * 0.1} ${size * 0.1} ${size * 0.8} ${size * 0.8} RF`;
  
  let eps = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${size} ${size}
%%Creator: QR Code Generator
%%Title: QR Code ${index}
%%CreationDate: ${new Date().toISOString()}
%%DocumentData: Clean7Bit
%%EndComments
%%BeginProlog
/M {moveto} def
/L {lineto} def
/RL {rlineto} def
/CP {closepath} def
/F {fill} def
/S {stroke} def
/GS {gsave} def
/GR {grestore} def
/SG {setgray} def
/RF {rectfill} def
/SF {selectfont} def
/SH {show} def
/SRGB {setrgbcolor} def
%%EndProlog

% QR Code for: ${text}

% Font setup - Using selected font
/QR-Font ${fontName}

% Background (may be transparent)
${bgColorCommand}

% QR code placeholder
${qrColorRGB} SRGB
${size * 0.1} ${size * 0.1} ${size * 0.8} ${size * 0.8} RF

% Index number in specified color
${countColorRGB} SRGB
/QR-Font ${opts.fontSize * 2} SF
${size * 0.1} ${size * 0.9} M
(${index}.) SH

% Serial number text in specified color
${serialColorRGB} SRGB
/QR-Font ${opts.fontSize * 2} SF
${size * 0.2} ${size * 0.5} M
(${text}) SH

%%EOF
`;
  
  return eps;
};

// Helper function to convert hex color to RGB format for EPS
const hexToRGB = (hex: string): string => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const bigint = parseInt(hex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
};

// Creates an illustrator-ready SVG with multiple QR codes in a grid layout
export const generateIllustratorLayout = (data: ExcelRow[], options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  const boxHeight = opts.boxHeight;
  
  // Calculate QR code dimensions
  let qrWidth, qrHeight;
  if (opts.qrCodeWidth && opts.qrCodeHeight) {
    // Use custom dimensions if specified
    qrWidth = opts.qrCodeWidth;
    qrHeight = opts.qrCodeHeight;
  } else {
    // Otherwise use the size ratio
    qrWidth = qrHeight = boxHeight * opts.qrCodeSize;
  }
  
  const padding = opts.boxSpacing || 10; // Use boxSpacing for padding
  const boxesPerRow = opts.boxesPerRow || 5; // Default 5 boxes per row
  const rows = Math.ceil(data.length / boxesPerRow);
  
  const svgWidth = (opts.boxWidth + padding) * boxesPerRow + padding;
  const svgHeight = (opts.boxHeight + padding) * rows + padding;
  
  // Apply transparent background if requested
  const qrBgFill = opts.qrCodeTransparentBg ? 'transparent' : opts.qrCodeBgColor;
  
  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <rect width="100%" height="100%" fill="white" />
  `;
  
  data.forEach((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    const count = row['Count'] || row.count || (index + 1).toString();
    
    const col = index % boxesPerRow;
    const rowNum = Math.floor(index / boxesPerRow);
    
    const x = padding + col * (opts.boxWidth + padding);
    const y = padding + rowNum * (opts.boxHeight + padding);
    
    // Draw box with border in the specified color
    svgContent += `
      <g transform="translate(${x}, ${y})">
        <rect width="${opts.boxWidth}" height="${opts.boxHeight}" fill="white" stroke="${opts.boxBorderColor}" stroke-width="0.5" />
    `;
    
    // If count is outside the box, position it to the left of the box in specified color
    if (opts.countOutsideBox) {
      svgContent += `
        <text x="${-5}" y="${opts.boxHeight / 2}" font-family="${opts.fontFamily.includes('denso') ? 'OCR-B, monospace' : opts.fontFamily}" font-size="${opts.fontSize * 1.3}" fill="${opts.countColor}" text-anchor="end" dominant-baseline="middle">
          ${count}.
        </text>
      `;
    }
    
    // Serial number centered in the left half of the box with specified color
    svgContent += `
      <text x="${opts.boxWidth / 4}" y="${opts.boxHeight/2}" font-family="${opts.fontFamily.includes('denso') ? 'OCR-B, monospace' : opts.fontFamily}" font-size="${opts.fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${opts.serialColor}">
        ${serial}
      </text>
    `;
    
    // QR code positioned on the right side, centered vertically with possibly custom dimensions
    svgContent += `
      <image x="${opts.boxWidth * 0.6}" y="${(opts.boxHeight - qrHeight) / 2}" width="${qrWidth}" height="${qrHeight}" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" />
      </g>
    `;
  });
  
  // Only add footer if showFooter is true
  if (opts.showFooter !== false) {
    const footerSize = opts.footerFontSize || defaultOptions.footerFontSize;
    const qtyText = opts.customQty || `${data.length}`;
    
    // Add footer information at the bottom with specified colors
    svgContent += `
      <text x="20" y="${svgHeight - 20}" font-family="${defaultOptions.fontFamily}" font-size="${footerSize}" fill="${opts.footerQtyColor}" text-anchor="start">
        Qty. - ${qtyText} each
      </text>
      
      <text x="${svgWidth - 20}" y="${svgHeight - 30}" font-family="${defaultOptions.fontFamily}" font-size="${footerSize}" fill="${opts.footerInfoColor}" text-anchor="end">
        Serial Number+QR code
      </text>
      <text x="${svgWidth - 20}" y="${svgHeight - 10}" font-family="${defaultOptions.fontFamily}" font-size="${footerSize}" fill="${opts.footerInfoColor}" text-anchor="end">
        Sticker Size - ${opts.boxWidth} x ${opts.boxHeight}mm
      </text>
    `;
  }
  
  svgContent += `</svg>`;
  return svgContent;
};

// Generate a complete layout in EPS format with specific dimensions
export const generateEPSLayout = (data: ExcelRow[], options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  
  const boxWidth = opts.boxWidth * 2.83465;  // Convert mm to points (1mm = 2.83465pts)
  const boxHeight = opts.boxHeight * 2.83465;
  const padding = (opts.boxSpacing || 10) * 2.83465; // Convert spacing to points
  const boxesPerRow = opts.boxesPerRow || 5; // Default 5 boxes per row
  const rows = Math.ceil(data.length / boxesPerRow);
  
  const pageWidth = (boxWidth + padding) * boxesPerRow + padding;
  const pageHeight = (boxHeight + padding) * rows + padding;
  
  // Calculate QR code dimensions
  let qrWidth, qrHeight;
  if (opts.qrCodeWidth && opts.qrCodeHeight) {
    // Use custom dimensions if specified
    qrWidth = opts.qrCodeWidth * 2.83465; // Convert to points
    qrHeight = opts.qrCodeHeight * 2.83465;
  } else {
    // Otherwise use the size ratio
    qrWidth = qrHeight = boxHeight * opts.qrCodeSize;
  }
  
  // Font mapping
  let fontName, boldFontName;
  switch(opts.fontFamily) {
    case 'denso':
      fontName = 'OCR-B';
      boldFontName = 'OCR-B-Bold';
      break;
    case 'denso-bold':
      fontName = 'OCR-B';
      boldFontName = 'OCR-B-Bold';
      break;
    case 'times':
      fontName = 'Times-Roman';
      boldFontName = 'Times-Bold';
      break;
    case 'courier':
      fontName = 'Courier';
      boldFontName = 'Courier-Bold';
      break;
    case 'helvetica':
    case 'helvetica-bold':
    default:
      fontName = 'Helvetica';
      boldFontName = 'Helvetica-Bold';
  }
  
  // Convert hex colors to RGB for EPS
  const boxBorderColorRGB = hexToRGB(opts.boxBorderColor || defaultOptions.boxBorderColor!);
  const countColorRGB = hexToRGB(opts.countColor || defaultOptions.countColor!);
  const serialColorRGB = hexToRGB(opts.serialColor || defaultOptions.serialColor!);
  const qrColorRGB = hexToRGB(opts.qrCodeColor || defaultOptions.qrCodeColor!);
  const qrBgColorRGB = hexToRGB(opts.qrCodeBgColor || defaultOptions.qrCodeBgColor!);
  const footerQtyColorRGB = hexToRGB(opts.footerQtyColor || defaultOptions.footerQtyColor!);
  const footerInfoColorRGB = hexToRGB(opts.footerInfoColor || defaultOptions.footerInfoColor!);
  
  let epsContent = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${pageWidth} ${pageHeight}
%%Creator: QR Code Generator Layout
%%Title: QR Codes Complete Layout
%%CreationDate: ${new Date().toISOString()}
%%DocumentData: Clean7Bit
%%EndComments
%%BeginProlog
/M {moveto} def
/L {lineto} def
/RL {rlineto} def
/CP {closepath} def
/F {fill} def
/S {stroke} def
/GS {gsave} def
/GR {grestore} def
/SG {setgray} def
/RF {rectfill} def
/SF {selectfont} def
/SH {show} def
%%EndProlog

% Font setup
/${fontName} findfont def
/${boldFontName} findfont def

% White background for entire page
1.0 1.0 1.0 setrgbcolor
0 0 ${pageWidth} ${pageHeight} RF

`;

  data.forEach((row, index) => {
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const count = row['Count'] || row.count || (index + 1).toString();
    
    const col = index % boxesPerRow;
    const rowNum = Math.floor(index / boxesPerRow);
    
    const x = padding + col * (boxWidth + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (boxHeight + padding));
    
    const qrX = x + (boxWidth * 0.6); // Move QR code to the right position (60%)
    const textX = x + (boxWidth * 0.25); // Center text in the left half
    
    epsContent += `
% QR Code and Label ${index + 1}
GS
  % Box background and border
  1.0 1.0 1.0 setrgbcolor
  ${x} ${y} ${boxWidth} ${boxHeight} RF
  
  % Apply custom border color
  ${boxBorderColorRGB} setrgbcolor
  0.3 setlinewidth
  ${x} ${y} M
  ${boxWidth} 0 RL
  0 ${boxHeight} RL
  ${-boxWidth} 0 RL
  CP
  S
  
  % QR code on right side (centered vertically) with custom color
  ${qrColorRGB} setrgbcolor
  ${qrX} ${y + (boxHeight - qrHeight) / 2} ${qrWidth} ${qrHeight} RF
  
  % Count number outside the box with custom color
  ${countColorRGB} setrgbcolor
  /${boldFontName} ${opts.fontSize + 2} SF
  ${x - 10} ${y + boxHeight / 2} M
  (${count}.) SH
  
  % Serial number on left side with custom color
  ${serialColorRGB} setrgbcolor
  /${boldFontName} ${opts.fontSize + 2} SF
  ${textX} ${y + (boxHeight / 2)} M
  (${serial}) dup stringwidth pop 2 div neg 0 rmoveto SH
GR
`;
  });

  // Add footer information only if showFooter is true
  if (opts.showFooter !== false) {
    const footerSize = opts.footerFontSize || defaultOptions.footerFontSize;
    const qtyText = opts.customQty || `${data.length}`;
    
    epsContent += `
% Footer information with custom colors
${footerQtyColorRGB} setrgbcolor
/${boldFontName} ${footerSize} SF
20 20 M
(Qty. - ${qtyText} each) SH

${footerInfoColorRGB} setrgbcolor
/${boldFontName} ${footerSize} SF
${pageWidth - 20} 40 M
(Serial Number+QR code) dup stringwidth pop neg 0 rmoveto SH
${pageWidth - 20} 20 M
(Sticker Size - ${opts.boxWidth} x ${opts.boxHeight}mm) dup stringwidth pop neg 0 rmoveto SH
`;
  }

  epsContent += `\n%%EOF`;
  return epsContent;
};

// Generate QR code data URI for embedding in PDF
export const generateQRCodeDataURI = async (text: string, options: Partial<GenerationOptions> = {}): Promise<string> => {
  const opts = { ...defaultOptions, ...options };
  try {
    // Fix the QR code generation with the correct options format
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M' as QRCode.QRCodeErrorCorrectionLevel,
      margin: 1,
      width: 200,
      color: {
        dark: opts.qrCodeColor || defaultOptions.qrCodeColor!,
        light: opts.qrCodeTransparentBg ? '#0000' : (opts.qrCodeBgColor || defaultOptions.qrCodeBgColor!)
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code data URI:', error);
    // Return a placeholder for error cases
    return '';
  }
};

// Calculate layout based on options
const calculateLayout = (options: GenerationOptions) => {
  const pageDims = getPageDimensions(options.pageSize, options.orientation);
  const boxSpacing = options.boxSpacing || 10; // Use box spacing from options
  
  // If manual values are provided, use them
  if (options.boxesPerRow && options.boxesPerColumn) {
    return {
      boxesPerRow: options.boxesPerRow,
      boxesPerColumn: options.boxesPerColumn,
      boxesPerPage: options.boxesPerRow * options.boxesPerColumn,
      horizontalMargin: (pageDims.width - ((options.boxesPerRow * options.boxWidth) + ((options.boxesPerRow - 1) * boxSpacing))) / 2,
      verticalMargin: (pageDims.height - ((options.boxesPerColumn * options.boxHeight) + ((options.boxesPerColumn - 1) * boxSpacing))) / 2
    };
  }
  
  // Otherwise calculate automatically
  const boxesPerRow = Math.floor((pageDims.width - boxSpacing) / (options.boxWidth + boxSpacing));
  const boxesPerColumn = Math.floor((pageDims.height - boxSpacing) / (options.boxHeight + boxSpacing));
  
  return {
    boxesPerRow,
    boxesPerColumn,
    boxesPerPage: boxesPerRow * boxesPerColumn,
    horizontalMargin: (pageDims.width - ((boxesPerRow * options.boxWidth) + ((boxesPerRow - 1) * boxSpacing))) / 2,
    verticalMargin: (pageDims.height - ((boxesPerColumn * options.boxHeight) + ((boxesPerColumn - 1) * boxSpacing))) / 2
  };
};

// Helper function to check if DENSO font is loaded
const isDensoFontLoaded = (): boolean => {
  const densoFontInfo = localStorage.getItem('denso-custom-font');
  return densoFontInfo ? JSON.parse(densoFontInfo).loaded : false;
};

// Helper function to get DENSO font name
const getDensoFontName = (): string => {
  const densoFontInfo = localStorage.getItem('denso-custom-font');
  return densoFontInfo ? JSON.parse(densoFontInfo).name : 'courier';
};

// Helper function to convert font file to base64 for jsPDF
const loadFontAsBase64 = async (fontName: string): Promise<string | null> => {
  try {
    // Try to get font from document.fonts
    const fontFace = Array.from(document.fonts).find(font => font.family === fontName);
    if (!fontFace) return null;
    
    // Get the font URL from CSS
    const fontUrl = fontFace.src;
    if (!fontUrl) return null;
    
    // Fetch the font file and convert to base64
    const response = await fetch(fontUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return base64;
  } catch (error) {
    console.warn('Could not load font as base64:', error);
    return null;
  }
};

// Generate PDF version with improved layout
export const generatePDF = async (data: ExcelRow[], options: Partial<GenerationOptions> = {}) => {
  // Import required libraries dynamically to avoid hydration issues
  const { jsPDF } = await import('jspdf');
  
  // Merge with default options
  const opts: GenerationOptions = { ...defaultOptions, ...options };
  
  // Get page dimensions
  const pageDims = getPageDimensions(opts.pageSize, opts.orientation);
  
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: opts.orientation,
    unit: 'mm',
    format: typeof opts.pageSize === 'object' && 'width' in opts.pageSize ? [opts.pageSize.width, opts.pageSize.height] : opts.pageSize
  });
  
  // Calculate layout
  const layout = calculateLayout(opts);
  const boxSpacing = opts.boxSpacing || 10; // Get spacing between boxes
  
  // Calculate number of pages needed
  const numPages = Math.ceil(data.length / layout.boxesPerPage);
  
  // Function to determine the font to use with DENSO support
  const getFont = async () => {
    if (opts.fontFamily.includes('denso') || opts.fontFamily === 'denso-custom') {
      // Check if custom DENSO font is loaded
      if (isDensoFontLoaded()) {
        try {
          const densoFontName = getDensoFontName();
          console.log(`Attempting to use DENSO font for PDF: ${densoFontName}`);
          
          // Try to load the custom font as base64
          const fontBase64 = await loadFontAsBase64(densoFontName);
          if (fontBase64) {
            // Add the custom font to jsPDF
            pdf.addFileToVFS(`${densoFontName}.ttf`, fontBase64);
            pdf.addFont(`${densoFontName}.ttf`, densoFontName, 'normal');
            return densoFontName;
          }
        } catch (error) {
          console.warn('Could not load custom DENSO font for PDF:', error);
        }
      }
      
      // Check if it's one of the public DENSO fonts
      if (opts.fontFamily.includes('denso-regular') || opts.fontFamily.includes('denso-bold-real') || 
          opts.fontFamily.includes('denso-light') || opts.fontFamily.includes('denso-bold-italic') || 
          opts.fontFamily.includes('denso-light-italic')) {
        try {
          // Map font family to actual font file
          const fontMap: Record<string, string> = {
            'denso-regular': 'DENSO-Regular',
            'denso-bold-real': 'DENSO-Bold',
            'denso-light': 'Denso Light',
            'denso-bold-italic': 'Denso Bold Italic',
            'denso-light-italic': 'Denso Light Italic'
          };
          
          const fontFileName = fontMap[opts.fontFamily] || 'DENSO-Regular';
          console.log(`Attempting to use public DENSO font: ${fontFileName}`);
          
          // Try to load the font from public directory
          const fontResponse = await fetch(`/denso fonts/${fontFileName}.otf`);
          if (fontResponse.ok) {
            const fontArrayBuffer = await fontResponse.arrayBuffer();
            const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontArrayBuffer)));
            
            // Add the font to jsPDF
            pdf.addFileToVFS(`${fontFileName}.ttf`, fontBase64);
            pdf.addFont(`${fontFileName}.ttf`, fontFileName, 'normal');
            return fontFileName;
          }
        } catch (error) {
          console.warn('Could not load public DENSO font for PDF:', error);
        }
      }
      
      return 'courier'; // Fallback to courier
    } else if (opts.fontFamily.includes('times')) {
      return 'times';
    } else if (opts.fontFamily.includes('courier')) {
      return 'courier';
    } else {
      return 'helvetica'; 
    }
  };
  
  const fontStyle = opts.fontFamily.includes('bold') ? 'bold' : 'normal';
  const font = await getFont();
  
  // Convert hex color to RGB array for PDF (0-255 range)
  const hexToRGBArray = (hex: string): [number, number, number] => {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  };
  
  // Parse colors
  const boxBorderColorRGB = hexToRGBArray(opts.boxBorderColor || defaultOptions.boxBorderColor!);
  const countColorRGB = hexToRGBArray(opts.countColor || defaultOptions.countColor!);
  const serialColorRGB = hexToRGBArray(opts.serialColor || defaultOptions.serialColor!);
  const qrCodeColorRGB = hexToRGBArray(opts.qrCodeColor || defaultOptions.qrCodeColor!);
  const qrCodeBgColorRGB = hexToRGBArray(opts.qrCodeBgColor || defaultOptions.qrCodeBgColor!);
  const footerQtyColorRGB = hexToRGBArray(opts.footerQtyColor || defaultOptions.footerQtyColor!);
  const footerInfoColorRGB = hexToRGBArray(opts.footerInfoColor || defaultOptions.footerInfoColor!);

  // Set the font for the PDF
  try {
    pdf.setFont(font, fontStyle);
  } catch (error) {
    console.warn(`Could not set font ${font}, falling back to helvetica:`, error);
    pdf.setFont('helvetica', fontStyle);
  }
  
  // Generate QR codes and add to PDF page by page
  for (let pageNum = 0; pageNum < numPages; pageNum++) {
    // Add a new page after the first page
    if (pageNum > 0) {
      pdf.addPage();
    }
    
    // Calculate the starting and ending indices for this page
    const startIndex = pageNum * layout.boxesPerPage;
    const endIndex = Math.min(startIndex + layout.boxesPerPage, data.length);
    
    // Process items for current page
    const promises = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const row = data[i];
      const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${i}`;
      const qrText = row['QR Code Text'] || row.qrCodeText || serial;
      const count = row['Count'] || row.count || (i + 1).toString();
      
      // Generate QR code with potentially transparent background
      const qrOptions = {
        errorCorrectionLevel: 'M' as QRCode.QRCodeErrorCorrectionLevel,
        margin: 1,
        width: 200,
        color: {
          dark: opts.qrCodeColor || defaultOptions.qrCodeColor!,
          light: opts.qrCodeTransparentBg ? '#0000' : (opts.qrCodeBgColor || defaultOptions.qrCodeBgColor!)
        }
      };
      
      const promise = QRCode.toDataURL(qrText, qrOptions).then(dataUrl => {
        // Calculate position in the grid
        const localIndex = i - startIndex; // Index relative to current page
        const col = localIndex % layout.boxesPerRow;
        const rowNum = Math.floor(localIndex / layout.boxesPerRow);
        
        // Calculate X and Y position for this box, accounting for spacing
        const x = layout.horizontalMargin + (col * (opts.boxWidth + boxSpacing));
        const y = layout.verticalMargin + (rowNum * (opts.boxHeight + boxSpacing));
        
        // Draw box border with specified color
        pdf.setDrawColor(...boxBorderColorRGB); // Box border color
        pdf.setLineWidth(0.2);
        pdf.rect(x, y, opts.boxWidth, opts.boxHeight);
        
        // Add count number in specified color outside the box
        if (opts.countOutsideBox) {
          pdf.setTextColor(...countColorRGB); // Count color
          pdf.setFontSize(10);
          try {
            pdf.setFont(font, 'bold');
          } catch {
            pdf.setFont('helvetica', 'bold');
          }
          pdf.text(`${count}.`, x - 5, y + opts.boxHeight / 2, { align: 'right', baseline: 'middle' });
        }
        
        // Add serial number in specified color in the center of the left half of the box
        pdf.setTextColor(...serialColorRGB); // Serial color
        pdf.setFontSize(opts.fontSize);
        try {
          pdf.setFont(font, fontStyle);
        } catch {
          pdf.setFont('helvetica', fontStyle);
        }
        
        // Center the serial text in the left half of the box
        const textWidth = pdf.getStringUnitWidth(serial) * pdf.getFontSize() / pdf.internal.scaleFactor;
        const leftHalfCenter = x + (opts.boxWidth * 0.25); // Center of the left half (25%)
        const textX = leftHalfCenter - (textWidth / 2);
        const textY = y + (opts.boxHeight / 2); // Centered vertically
        
        pdf.text(serial, textX, textY, { baseline: 'middle' });
        
        // Calculate QR code size and position (right side of box, centered)
        let qrWidth, qrHeight;
        if (opts.qrCodeWidth && opts.qrCodeHeight) {
          qrWidth = opts.qrCodeWidth;
          qrHeight = opts.qrCodeHeight;
        } else {
          qrWidth = qrHeight = opts.boxHeight * opts.qrCodeSize;
        }
        
        const qrX = x + (opts.boxWidth * 0.6); // Positioned at 60% of box width
        const qrY = y + (opts.boxHeight - qrHeight) / 2; // Centered vertically
        
        // Add QR code if we have a data URL
        if (dataUrl) {
          pdf.addImage(dataUrl, 'PNG', qrX, qrY, qrWidth, qrHeight);
        }
      });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
  }
  
  // Only add footer information if showFooter is true
  if (opts.showFooter !== false) {
    const footerSize = opts.footerFontSize || defaultOptions.footerFontSize;
    const qtyText = opts.customQty || `${data.length}`;
    
    for (let i = 0; i < numPages; i++) {
      pdf.setPage(i + 1);
      
      // Add "Qty. - X each" with specified color on the bottom left
      pdf.setFontSize(footerSize);
      pdf.setTextColor(...footerQtyColorRGB); // Qty color
      try {
        pdf.setFont(font, 'bold');
      } catch {
        pdf.setFont('helvetica', 'bold');
      }
      pdf.text(`Qty. - ${qtyText} each`, 20, pageDims.height - 10);
      
      // Add footer information with specified color on the bottom right
      pdf.setTextColor(...footerInfoColorRGB); // Info color
      pdf.text("Serial Number+QR code", pageDims.width - 20, pageDims.height - 20, { align: 'right' });
      pdf.text(`Sticker Size - ${opts.boxWidth} x ${opts.boxHeight}mm`, pageDims.width - 20, pageDims.height - 10, { align: 'right' });
    }
  }
  
  return pdf.output('blob');
};

// Generate the illustrator-ready file in the requested format (EPS or PDF)
export const generateIllustratorFile = async (data: ExcelRow[], format: 'eps' | 'pdf', options: Partial<GenerationOptions> = {}): Promise<Blob> => {
  if (format === 'eps') {
    const epsContent = generateEPSLayout(data, options);
    return new Blob([epsContent], { type: 'application/postscript' });
  } else {
    return generatePDF(data, options);
  }
};

// Main function to download the output files
export const downloadIllustratorFiles = async (data: ExcelRow[], format: 'eps' | 'pdf', options: Partial<GenerationOptions> = {}): Promise<void> => {
  // Generate the file in the selected format
  const fileBlob = await generateIllustratorFile(data, format, options);
  
  // Determine filename with correct extension
  const extension = format.toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `QRCodes_${data.length}_items_${timestamp}.${extension}`;
  
  // Use FileSaver library to trigger download
  saveAs(fileBlob, filename);
};

// Function for packaging all sizes and formats into a single ZIP file
export const generateAllFormatsZip = async (data: ExcelRow[], options: Partial<GenerationOptions> = {}): Promise<void> => {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Generate EPS version
    const epsBlob = await generateIllustratorFile(data, 'eps', options);
    zip.file(`QRCodes_${data.length}_items.eps`, epsBlob);
    
    // Generate PDF version
    const pdfBlob = await generateIllustratorFile(data, 'pdf', options);
    zip.file(`QRCodes_${data.length}_items.pdf`, pdfBlob);
    
    // Generate and save ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `QRCodes_All_Formats_${timestamp}.zip`);
  } catch (error) {
    console.error('Error generating ZIP with multiple formats:', error);
    throw error;
  }
};
