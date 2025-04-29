import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExcelRow } from './excelParser';

export const generateQRCodeSVG = (text: string, index: number): string => {
  // Create more professional QR code representation (still placeholder)
  const size = 100;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="white" />
      <rect x="10%" y="10%" width="80%" height="80%" fill="black" />
      <text x="10%" y="20%" font-family="Arial" font-size="10" fill="red" text-anchor="start">
        ${index}.
      </text>
      <text x="25%" y="50%" font-family="Arial" font-size="10" font-weight="bold" text-anchor="start">
        ${text}
      </text>
    </svg>
  `;
  
  return svg;
};

// Generate EPS version of a QR code - Improved for Illustrator compatibility
export const generateQRCodeEPS = (text: string, index: number): string => {
  const size = 300; // Increased size for better visibility
  
  // Create a proper EPS file format that's compatible with Adobe Illustrator
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
%%EndProlog

% QR Code for: ${text}

% White background
1.0 1.0 1.0 setrgbcolor
0 0 ${size} ${size} RF

% Black QR code placeholder
0.0 0.0 0.0 setrgbcolor
${size * 0.1} ${size * 0.1} ${size * 0.8} ${size * 0.8} RF

% Index number in red
1.0 0.0 0.0 setrgbcolor
/Helvetica-Bold 24 SF
${size * 0.1} ${size * 0.9} M
(${index}.) SH

% Serial number text
0.0 0.0 0.0 setrgbcolor
/Helvetica 18 SF
${size * 0.2} ${size * 0.5} M
(${text}) SH

%%EOF
`;
  
  return eps;
};

// Creates an illustrator-ready SVG with multiple QR codes in a grid layout
export const generateIllustratorLayout = (data: ExcelRow[]): string => {
  const qrSize = 120;
  const padding = 10;
  const qrPerRow = 5;
  const rows = Math.ceil(data.length / qrPerRow);
  
  const svgWidth = (qrSize + padding) * qrPerRow + padding;
  const svgHeight = (qrSize + padding) * rows + padding;
  
  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <rect width="100%" height="100%" fill="white" />
  `;
  
  data.forEach((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    
    const col = index % qrPerRow;
    const rowNum = Math.floor(index / qrPerRow);
    
    const x = padding + col * (qrSize + padding);
    const y = padding + rowNum * (qrSize + padding);
    
    svgContent += `
      <g transform="translate(${x}, ${y})">
        <rect width="${qrSize}" height="${qrSize}" fill="white" stroke="lightgray" stroke-width="1" />
        <text x="10" y="20" font-family="Arial" font-size="12" fill="red">
          ${index + 1}.
        </text>
        <text x="50" y="60" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle">
          ${serial}
        </text>
        <image x="60" y="30" width="50" height="50" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" />
      </g>
    `;
  });
  
  svgContent += `</svg>`;
  return svgContent;
};

// Generate a complete layout in EPS format
export const generateEPSLayout = (data: ExcelRow[]): string => {
  const qrSize = 150;
  const padding = 20;
  const qrPerRow = 5;
  const rows = Math.ceil(data.length / qrPerRow);
  
  const pageWidth = (qrSize + padding) * qrPerRow + padding;
  const pageHeight = (qrSize + padding) * rows + padding;
  
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

% White background for entire page
1.0 1.0 1.0 setrgbcolor
0 0 ${pageWidth} ${pageHeight} RF

`;

  // Add each QR code to the layout
  data.forEach((row, index) => {
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    
    const col = index % qrPerRow;
    const rowNum = Math.floor(index / qrPerRow);
    
    const x = padding + col * (qrSize + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (qrSize + padding));
    
    epsContent += `
% QR Code ${index + 1}
GS
  % Cell background
  1.0 1.0 1.0 setrgbcolor
  ${x} ${y} ${qrSize} ${qrSize} RF
  
  % Border
  0.8 0.8 0.8 setrgbcolor
  0.5 setlinewidth
  ${x} ${y} M
  ${qrSize} 0 RL
  0 ${qrSize} RL
  ${-qrSize} 0 RL
  CP
  S
  
  % QR code placeholder
  0.0 0.0 0.0 setrgbcolor
  ${x + qrSize * 0.1} ${y + qrSize * 0.1} ${qrSize * 0.8} ${qrSize * 0.8} RF
  
  % Index number
  1.0 0.0 0.0 setrgbcolor
  /Helvetica-Bold 12 SF
  ${x + 5} ${y + qrSize - 10} M
  (${index + 1}.) SH
  
  % Serial number
  0.0 0.0 0.0 setrgbcolor
  /Helvetica 8 SF
  ${x + qrSize/2} ${y + qrSize/2} M
  (${serial}) SH
GR
`;
  });

  epsContent += `
%%EOF`;

  return epsContent;
};

export const generateIllustratorFile = (data: ExcelRow[], format: 'svg' | 'eps' = 'svg'): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder("qr_codes");
  
  if (!folder) throw new Error("Failed to create zip folder");
  
  // Add individual QR codes
  data.forEach((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    
    if (qrText) {
      if (format === 'svg') {
        const svg = generateQRCodeSVG(qrText, index + 1);
        folder.file(`QR_${serial}.svg`, svg);
      } else {
        const eps = generateQRCodeEPS(qrText, index + 1);
        folder.file(`QR_${serial}.eps`, eps);
      }
    }
  });
  
  // Add a complete layout file
  if (format === 'svg') {
    const layoutSvg = generateIllustratorLayout(data);
    folder.file("complete_layout.svg", layoutSvg);
  } else {
    const layoutEps = generateEPSLayout(data);
    folder.file("complete_layout.eps", layoutEps);
  }
  
  return zip.generateAsync({ type: "blob" });
};

export const downloadIllustratorFiles = async (data: ExcelRow[], format: 'svg' | 'eps' = 'svg'): Promise<void> => {
  try {
    const blob = await generateIllustratorFile(data, format);
    const extension = format === 'svg' ? 'svg' : 'eps';
    saveAs(blob, `qr_codes_for_illustrator_${extension}.zip`);
  } catch (error) {
    console.error(`Failed to generate ${format.toUpperCase()} files:`, error);
    throw error;
  }
};
