import React, { useState, useEffect } from "react";
import { ExcelRow } from "@/utils/excelParser";
import ExcelUploader from "@/components/ExcelUploader";
import PreviewTable from "@/components/PreviewTable";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import FontUploader from "@/components/FontUploader";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

const Index = () => {
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [showFontUploader, setShowFontUploader] = useState(false);
  const [customFontLoaded, setCustomFontLoaded] = useState(false);
  const [fontUpdateKey, setFontUpdateKey] = useState(0);

  const handleDataLoaded = (data: ExcelRow[]) => {
    setExcelData(data);
  };

  const handleFontUploaded = (fontName: string) => {
    setCustomFontLoaded(true);
    setFontUpdateKey(prev => prev + 1);
    console.log('Custom font loaded:', fontName);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'OCR-B';
        src: url('https://fonts.cdnfonts.com/css/libre-barcode-39') format('woff');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=PT+Mono&display=swap';
    document.head.appendChild(link);

    // Check if custom fonts were previously loaded
    const savedFonts = localStorage.getItem('uploaded-fonts');
    if (savedFonts) {
      try {
        const fonts = JSON.parse(savedFonts);
        if (fonts.length > 0) {
          setCustomFontLoaded(true);
        }
      } catch (error) {
        console.error('Error parsing saved fonts:', error);
      }
    }

    // Listen for font upload events
    const handleFontUpload = (event: CustomEvent) => {
      console.log('Font upload event received:', event.detail);
      setCustomFontLoaded(true);
      setFontUpdateKey(prev => prev + 1);
    };

    window.addEventListener('font-uploaded', handleFontUpload as EventListener);
    
    return () => {
      document.head.removeChild(style);
      document.head.removeChild(link);
      window.removeEventListener('font-uploaded', handleFontUpload as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Menu Bar */}
        <div className="mb-6">
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => setShowFontUploader(true)}>
                  Upload Font
                  {customFontLoaded && <span className="ml-2 text-green-600">✓</span>}
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>

        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Customizable Excel to QR Code Generator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your Excel file with serial numbers to generate 
            customizable QR codes in SVG, EPS, or PDF format for Adobe Illustrator.
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Font Uploader Modal */}
          {showFontUploader && (
            <FontUploader 
              onClose={() => setShowFontUploader(false)}
              onFontUploaded={handleFontUploaded}
            />
          )}

          {/* Step 1: Upload Excel File */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4">
              Step 1: Upload Your Excel File
            </h2>
            <ExcelUploader onDataLoaded={handleDataLoaded} />
          </section>

          {/* Step 2: Preview Data */}
          {excelData.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-blue-700 mb-4">
                Step 2: Preview Your Data
              </h2>
              <PreviewTable data={excelData} />
            </section>
          )}

          {/* Step 3: Generate QR Codes */}
          {excelData.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-blue-700 mb-4">
                Step 3: Customize and Generate QR Codes
              </h2>
              <QRCodeGenerator key={fontUpdateKey} data={excelData} />
            </section>
          )}

          {/* Instructions */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              How This Works
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Upload an Excel file with columns for Count, Unit Serial Number, and QR Code Text</li>
              <li>Preview the data to ensure it's been correctly parsed</li>
              <li>Upload your custom font file (optional) via the File menu</li>
              <li>Customize your QR code layout, size, appearance, and colors</li>
              <li>Choose from multiple font options including your uploaded custom fonts</li>
              <li>Set transparent backgrounds and custom dimensions for QR codes</li>
              <li>Choose your preferred file format (PDF, SVG, or EPS)</li>
              <li>Generate and download your files for use in Adobe Illustrator or other design software</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
