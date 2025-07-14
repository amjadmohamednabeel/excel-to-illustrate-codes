import React, { useState, useEffect } from "react";
import { ExcelRow } from "@/utils/excelParser";
import ExcelUploader from "@/components/ExcelUploader";
import PreviewTable from "@/components/PreviewTable";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import BarcodeGenerator from "@/components/BarcodeGenerator";
import FontUploader from "@/components/FontUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, BarChart3 } from "lucide-react";
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
  const [generatorType, setGeneratorType] = useState<'qr' | 'barcode'>('qr');

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

  // Clear data when switching between generator types
  const handleTabChange = (value: string) => {
    setGeneratorType(value as 'qr' | 'barcode');
    setExcelData([]); // Clear data when switching tabs
  };

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
            QR Code & Barcode Generator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your Excel file to generate customizable QR codes or barcodes 
            in various formats for professional use.
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          {/* Font Uploader Modal (only show for QR codes) */}
          {showFontUploader && generatorType === 'qr' && (
            <FontUploader 
              onClose={() => setShowFontUploader(false)}
              onFontUploaded={handleFontUploaded}
            />
          )}

          <Tabs value={generatorType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code Generator
              </TabsTrigger>
              <TabsTrigger value="barcode" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Barcode Generator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-blue-700 mb-4">
                  Step 1: Upload Your Excel File
                </h2>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Required columns:</strong> Count, Unit Serial Number, QR Code Text
                  </p>
                </div>
                <ExcelUploader onDataLoaded={handleDataLoaded} validationType="qr" />
              </section>

              {excelData.length > 0 && (
                <>
                  <section>
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">
                      Step 2: Preview Your Data
                    </h2>
                    <PreviewTable data={excelData} />
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">
                      Step 3: Customize and Generate QR Codes
                    </h2>
                    <QRCodeGenerator key={fontUpdateKey} data={excelData} />
                  </section>
                </>
              )}

              {excelData.length === 0 && (
                <section className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
                  <QrCode className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Upload Excel File for QR Codes
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get started by uploading your Excel file with QR code data
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Supports SVG, EPS, and PDF formats</p>
                    <p>• Custom fonts and layouts</p>
                    <p>• Adobe Illustrator compatible</p>
                  </div>
                </section>
              )}
            </TabsContent>

            <TabsContent value="barcode" className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-blue-700 mb-4">
                  Step 1: Upload Your Excel File
                </h2>
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Required columns:</strong> No., Description, GTIN
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Barcode specifications: 36.6×10.6mm, Font: 6.667pt, Box: 50×25mm
                  </p>
                </div>
                <ExcelUploader onDataLoaded={handleDataLoaded} validationType="barcode" />
              </section>

              {excelData.length > 0 && (
                <>
                  <section>
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">
                      Step 2: Preview Your Data
                    </h2>
                    <PreviewTable data={excelData} />
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-blue-700 mb-4">
                      Step 3: Customize and Generate Barcodes
                    </h2>
                    <BarcodeGenerator data={excelData} />
                  </section>
                </>
              )}

              {excelData.length === 0 && (
                <section className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
                  <BarChart3 className="h-16 w-16 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Upload Excel File for Barcodes
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get started by uploading your Excel file with barcode data
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• EAN13 barcode format</p>
                    <p>• Professional layout with centered content</p>
                    <p>• PDF output for printing</p>
                  </div>
                </section>
              )}
            </TabsContent>
          </Tabs>

          {/* Instructions */}
          <section className="mt-12 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              How This Works
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-blue-700 mb-2">QR Code Generator</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Upload Excel with Count, Unit Serial Number, QR Code Text columns</li>
                  <li>Upload custom fonts via File menu (optional)</li>
                  <li>Customize layout, size, colors, and appearance</li>
                  <li>Generate SVG, EPS, or PDF files for Adobe Illustrator</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-green-700 mb-2">Barcode Generator</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Upload Excel with No., Description, GTIN columns</li>
                  <li>Automatic EAN13 barcode generation</li>
                  <li>Professional layout with 50×25mm boxes</li>
                  <li>PDF output optimized for printing</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;