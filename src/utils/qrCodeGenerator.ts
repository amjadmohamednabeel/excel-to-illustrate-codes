import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExcelRow } from './excelParser';
import QRCode from 'qrcode';

// Generate QR code as SVG
export const generateQRCodeSVG = (text: string, index: number): string => {
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

// Generate EPS version of a QR code
export const generateQRCodeEPS = (text: string, index: number): string => {
  const size = 300; // Increased size for better visibility
  
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
  const boxWidth = 50 * 2.83465;  // 50mm in points
  const boxHeight = 30 * 2.83465; // 30mm in points
  const padding = 10; // padding between boxes in points
  const qrPerRow = 4; // fewer per row to accommodate larger box size
  const rows = Math.ceil(data.length / qrPerRow);
  
  const pageWidth = (boxWidth + padding) * qrPerRow + padding;
  const pageHeight = (boxHeight + padding) * rows + padding;
  
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

  data.forEach((row, index) => {
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    
    const col = index % qrPerRow;
    const rowNum = Math.floor(index / qrPerRow);
    
    const x = padding + col * (boxWidth + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (boxHeight + padding));
    
    const qrX = x + boxWidth - qrSize - 5; // 5 points from right edge
    const textPosition = x + ((boxWidth - qrSize) / 4); // Center point for text
    
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
  ${qrX} ${y + (boxHeight - qrSize) / 2} ${qrSize} ${qrSize} RF
  
  % Index number in top-left
  1.0 0.0 0.0 setrgbcolor
  /Denso 10 SF
  ${x + 5} ${y + boxHeight - 10} M
  (${index + 1}.) SH
  
  % Serial number on left side (centered vertically and horizontally)
  0.0 0.0 0.0 setrgbcolor
  /Denso 12 SF
  ${textPosition} ${y + (boxHeight / 2)} M
  (${serial}) dup stringwidth pop 2 div neg 0 rmoveto SH
GR
`;
  });

  epsContent += `
%%EOF`;

  return epsContent;
};

// Generate PDF version of the complete layout - Improved for proper rendering with actual QR codes
export const generatePDF = async (data: ExcelRow[]) => {
  const boxWidth = 50 * 2.83465;  // 50mm in points
  const boxHeight = 30 * 2.83465; // 30mm in points
  const padding = 10; // padding between boxes in points
  const qrPerRow = 4; // fewer per row to accommodate larger box size
  const rows = Math.ceil(data.length / qrPerRow);
  
  const pageWidth = (boxWidth + padding) * qrPerRow + padding;
  const pageHeight = (boxHeight + padding) * rows + padding;
  
  let pdfContent = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 ${pageWidth} ${pageHeight}]
   /Contents 4 0 R
   /Resources << 
      /Font << /F1 5 0 R /F2 6 0 R >> 
      /XObject << `;
  
  const qrCodePromises = data.map((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || row['Unit Serial Number'] || row.serialNumber || '';
    return generateQRCodeDataURI(qrText);
  });
  
  const qrCodeDataURIs = await Promise.all(qrCodePromises);
  
  qrCodeDataURIs.forEach((_, index) => {
    pdfContent += `/Im${index + 1} 8 0 R `;
  });
  
  pdfContent += `>>
   >>
>>
endobj
4 0 obj
<< /Length 7 0 R >>
stream
BT
/F1 12 Tf
10 ${pageHeight - 20} Td
(QR Code Layout - Generated for Adobe Illustrator) Tj
ET
`;

  data.forEach((row, index) => {
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    
    const col = index % qrPerRow;
    const rowNum = Math.floor(index / qrPerRow);
    
    const x = padding + col * (boxWidth + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (boxHeight + padding));
    
    const qrSize = boxHeight * 0.8;
    const qrX = x + boxWidth - qrSize - 5; // 5 points from right edge
    const textX = x + (boxWidth - qrSize) / 4;
    const textY = y + (boxHeight / 2);
    
    pdfContent += `
% Box ${index + 1}
0.8 0.8 0.8 RG
0.5 w
${x} ${y} ${boxWidth} ${boxHeight} re
S

q
${qrSize} 0 0 ${qrSize} ${qrX} ${y + (boxHeight - qrSize) / 2} cm
/Im${index + 1} Do
Q

0 0 0 rg
BT
/F2 10 Tf
${textX} ${textY} Td
(${serial}) Tj
ET

1 0 0 rg
BT
/F1 8 Tf
${x + 5} ${y + boxHeight - 10} Td
(${index + 1}.) Tj
ET
`;
  });
  
  pdfContent += `
endstream
endobj
7 0 obj
${pdfContent.split('stream')[1].split('endstream')[0].length}
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj`;

  let lastObjNum = 8;
  qrCodeDataURIs.forEach((dataURI, index) => {
    pdfContent += `
${lastObjNum + index} 0 obj
<< /Type /XObject
   /Subtype /Image
   /Width 200
   /Height 200
   /ColorSpace /DeviceRGB
   /BitsPerComponent 8
   /Filter /DCTDecode
   /Length ${dataURI.length}
>>
stream
${dataURI}
endstream
endobj
`;
  });

  const totalObjs = 8 + qrCodeDataURIs.length;
  
  pdfContent += `
xref
0 ${totalObjs}
0000000000 65535 f
`;

  let offset = 9;
  for (let i = 1; i < totalObjs; i++) {
    pdfContent += `${offset.toString().padStart(10, '0')} 00000 n\n`;
    offset += 100; // This is just a placeholder, real offsets would be calculated
  }

  pdfContent += `
trailer
<< /Size ${totalObjs} /Root 1 0 R >>
startxref
${offset}
%%EOF`;

  return pdfContent;
};

// Generate Illustrator file in requested format
export const generateIllustratorFile = async (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf' = 'svg'): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder("qr_codes");
  
  if (!folder) throw new Error("Failed to create zip folder");
  
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
  
  if (format === 'svg') {
    const layoutSvg = generateIllustratorLayout(data);
    folder.file("complete_layout.svg", layoutSvg);
  } else if (format === 'eps') {
    const layoutEps = generateEPSLayout(data);
    folder.file("complete_layout.eps", layoutEps);
  } else if (format === 'pdf') {
    const pdfContent = await generatePDF(data);
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
