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

// Generate a complete layout in EPS format with specific dimensions
export const generateEPSLayout = (data: ExcelRow[]): string => {
  // Use 50mm x 30mm box size (converted to points - 1mm = 2.83465 points)
  const boxWidth = 50 * 2.83465;  // 50mm in points
  const boxHeight = 30 * 2.83465; // 30mm in points
  const padding = 10; // padding between boxes in points
  const qrPerRow = 4; // fewer per row to accommodate larger box size
  const rows = Math.ceil(data.length / qrPerRow);
  
  const pageWidth = (boxWidth + padding) * qrPerRow + padding;
  const pageHeight = (boxHeight + padding) * rows + padding;
  
  // QR code dimensions and positioning
  const qrSize = boxHeight * 0.8;
  
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

% Font setup - Using Helvetica as fallback for Denso
/Denso-Font /Helvetica findfont def
/Denso /Helvetica-Bold findfont def

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
    
    const x = padding + col * (boxWidth + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (boxHeight + padding));
    
    // Right side for QR code (centered vertically)
    const qrX = x + boxWidth - qrSize - 5; // 5 points from right edge
    const qrY = y + (boxHeight - qrSize) / 2;
    
    epsContent += `
% QR Code and Label ${index + 1}
GS
  % Box background and border
  1.0 1.0 1.0 setrgbcolor
  ${x} ${y} ${boxWidth} ${boxHeight} RF
  
  0.8 0.8 0.8 setrgbcolor
  0.5 setlinewidth
  ${x} ${y} M
  ${boxWidth} 0 RL
  0 ${boxHeight} RL
  ${-boxWidth} 0 RL
  CP
  S
  
  % QR code on right side (centered vertically)
  0.0 0.0 0.0 setrgbcolor
  ${qrX} ${qrY} ${qrSize} ${qrSize} RF
  
  % Index number in top-left
  1.0 0.0 0.0 setrgbcolor
  /Denso 10 SF
  ${x + 5} ${y + boxHeight - 10} M
  (${index + 1}.) SH
  
  % Serial number on left side (centered vertically and horizontally)
  0.0 0.0 0.0 setrgbcolor
  /Denso 12 SF
  
  % Calculate text width for centering (approximate)
  /serialString (${serial}) def
  /textWidth serialString stringwidth pop def
  
  % Position text in left half, centered
  ${x + ((boxWidth - qrSize) / 4) - (textWidth / 2)} ${y + (boxHeight / 2)} M
  (${serial}) SH
GR
`;
  });

  epsContent += `
%%EOF`;

  return epsContent;
};

// Generate PDF version of the complete layout
export const generatePDF = (data: ExcelRow[]) => {
  // Create PDF using EPS as base, with appropriate headers
  const epsContent = generateEPSLayout(data);
  
  // Convert EPS to PDF format (basic implementation)
  let pdfContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<</Type /Catalog
/Pages 2 0 R>>
endobj
2 0 obj
<</Type /Pages
/Kids [3 0 R]
/Count 1>>
endobj
3 0 obj
<</Type /Page
/Parent 2 0 R
/Resources <</ProcSet [/PDF /Text /ImageB /ImageC /ImageI]>>
/MediaBox [0 0 595.28 841.89]
/Contents 4 0 R>>
endobj
4 0 obj
<</Length 5 0 R>>
stream
${epsContent}
endstream
endobj
5 0 obj
${epsContent.length}
endobj
xref
0 6
0000000000 65535 f
0000000015 00000 n
0000000066 00000 n
0000000123 00000 n
0000000266 00000 n
0000000${(266 + epsContent.length).toString().padStart(6, '0')} 00000 n
trailer
<</Size 6
/Root 1 0 R>>
startxref
${266 + epsContent.length + 20}
%%EOF`;

  return pdfContent;
};

export const generateIllustratorFile = (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf' = 'svg'): Promise<Blob> => {
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
      } else if (format === 'eps') {
        const eps = generateQRCodeEPS(qrText, index + 1);
        folder.file(`QR_${serial}.eps`, eps);
      }
    }
  });
  
  // Add a complete layout file
  if (format === 'svg') {
    const layoutSvg = generateIllustratorLayout(data);
    folder.file("complete_layout.svg", layoutSvg);
  } else if (format === 'eps') {
    const layoutEps = generateEPSLayout(data);
    folder.file("complete_layout.eps", layoutEps);
  } else if (format === 'pdf') {
    const pdfContent = generatePDF(data);
    folder.file("complete_layout.pdf", pdfContent);
  }
  
  return zip.generateAsync({ type: "blob" });
};

export const downloadIllustratorFiles = async (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf' = 'svg'): Promise<void> => {
  try {
    const blob = await generateIllustratorFile(data, format);
    const extension = format === 'svg' ? 'svg' : format === 'eps' ? 'eps' : 'pdf';
    saveAs(blob, `qr_codes_for_illustrator_${extension}.zip`);
  } catch (error) {
    console.error(`Failed to generate ${format.toUpperCase()} files:`, error);
    throw error;
  }
};
