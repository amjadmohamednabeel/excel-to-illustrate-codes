
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { ExcelRow } from '@/utils/excelParser';
import { downloadIllustratorFiles } from '@/utils/qrCodeGenerator';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QRCodeGeneratorProps {
  data: ExcelRow[];
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fileFormat, setFileFormat] = useState<'svg' | 'eps' | 'pdf'>('pdf'); // Default to PDF format
  const [previewPage, setPreviewPage] = useState(0);
  
  const itemsPerPage = 25;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await downloadIllustratorFiles(data, fileFormat);
      toast({
        title: "Success",
        description: `QR codes generated in ${fileFormat.toUpperCase()} format and ready for download`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate QR codes in ${fileFormat.toUpperCase()} format`,
        variant: "destructive",
      });
      console.error("QR code generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  // Navigate preview pages
  const nextPage = () => {
    if (previewPage < totalPages - 1) {
      setPreviewPage(previewPage + 1);
    }
  };
  
  const prevPage = () => {
    if (previewPage > 0) {
      setPreviewPage(previewPage - 1);
    }
  };
  
  // Get items for current preview page
  const getCurrentPageItems = () => {
    const start = previewPage * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Generate QR Codes for Illustrator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={togglePreview} 
            className="mb-2"
          >
            {showPreview ? "Hide Preview" : "Show Layout Preview"}
          </Button>
          
          {showPreview && data.length > 0 && (
            <div className="w-full space-y-2">
              {totalPages > 1 && (
                <div className="flex items-center justify-between mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={prevPage} 
                    disabled={previewPage === 0}
                  >
                    Previous Page
                  </Button>
                  <span className="text-sm">
                    Page {previewPage + 1} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={nextPage} 
                    disabled={previewPage === totalPages - 1}
                  >
                    Next Page
                  </Button>
                </div>
              )}
              
              <div className="overflow-auto max-h-[400px] border rounded p-4 w-full">
                <div className="grid grid-cols-5 gap-2">
                  {getCurrentPageItems().map((row, index) => {
                    const actualIndex = previewPage * itemsPerPage + index;
                    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${actualIndex}`;
                    const qrText = row['QR Code Text'] || row.qrCodeText || serial;
                    
                    return (
                      <div key={index} className="border p-2 flex flex-row justify-between items-center" style={{ width: '120px', height: '80px' }}>
                        <div className="flex flex-col items-center justify-center w-1/2">
                          <div className="text-red-500 text-xs text-left w-full font-bold">{actualIndex + 1}.</div>
                          <div className="text-xs font-bold mt-1 text-center">{serial}</div>
                        </div>
                        <div className="flex justify-center items-center w-1/2">
                          <QRCodeSVG value={qrText} size={40} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center mt-2 text-sm text-gray-500">
                  {data.length > itemsPerPage && (
                    <p>
                      Showing page {previewPage + 1} of {totalPages}. 
                      {totalPages > 1 && ` Full PDF will include ${data.length} items across ${totalPages} pages.`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Choose File Format:</h3>
            <RadioGroup
              value={fileFormat}
              onValueChange={(value) => setFileFormat(value as 'svg' | 'eps' | 'pdf')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="svg" id="svg" />
                <Label htmlFor="svg">SVG Format</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="eps" id="eps" />
                <Label htmlFor="eps">EPS Format</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF Format</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="bg-blue-50 p-3 rounded text-sm">
            <p className="font-medium text-blue-700">Format Details:</p>
            <ul className="list-disc list-inside text-blue-600 mt-1 space-y-1">
              {fileFormat === 'eps' && (
                <>
                  <li>EPS files with 50mm × 30mm boxes</li>
                  <li>QR codes positioned on the right side</li>
                  <li>Serial numbers centered on the left side</li>
                  <li>Includes both individual QR codes and complete layout</li>
                </>
              )}
              {fileFormat === 'pdf' && (
                <>
                  <li>A4 PDF with 5×5 grid (25 QR codes per page)</li>
                  <li>Multiple pages for more than 25 QR codes</li>
                  <li>Each box includes sequential numbering in red</li>
                  <li>Serial numbers displayed next to each QR code</li>
                  <li>50mm × 30mm sticker size as shown in reference</li>
                </>
              )}
              {fileFormat === 'svg' && (
                <>
                  <li>SVG files for easy web usage</li>
                  <li>Individual QR codes in separate files</li>
                  <li>Complete layout in a single SVG file</li>
                </>
              )}
            </ul>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            {fileFormat === 'pdf' ? 
              `You will receive a single PDF file with all ${data.length} QR codes in a 5×5 grid layout${data.length > 25 ? ` across ${totalPages} pages` : ''}.` : 
              'You will receive a ZIP file containing:'}
          </p>
          {fileFormat !== 'pdf' && (
            <ul className="list-disc list-inside text-sm text-gray-500 ml-4">
              <li>Individual QR code {fileFormat.toUpperCase()} files for each row</li>
              <li>A complete layout in {fileFormat.toUpperCase()} format with all QR codes arranged</li>
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || data.length === 0}
          className="w-full"
        >
          {isGenerating ? "Generating..." : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download QR Codes in {fileFormat.toUpperCase()} Format
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QRCodeGenerator;
