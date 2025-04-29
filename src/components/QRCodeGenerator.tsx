
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { ExcelRow } from '@/utils/excelParser';
import { downloadIllustratorFiles, generateIllustratorLayout } from '@/utils/qrCodeGenerator';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  data: ExcelRow[];
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await downloadIllustratorFiles(data);
      toast({
        title: "Success",
        description: "QR codes generated and ready for download",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR codes for Illustrator",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
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
            <div className="overflow-auto max-h-[400px] border rounded p-4 w-full">
              <div className="grid grid-cols-5 gap-2">
                {data.slice(0, 25).map((row, index) => {
                  const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
                  const qrText = row['QR Code Text'] || row.qrCodeText || '';
                  
                  return (
                    <div key={index} className="border p-2 flex flex-col items-center">
                      <div className="text-red-500 text-xs text-left w-full">{index + 1}.</div>
                      <div className="text-xs font-bold my-1">{serial}</div>
                      <QRCodeSVG value={qrText || serial} size={50} />
                    </div>
                  );
                })}
              </div>
              {data.length > 25 && (
                <div className="text-center mt-2 text-sm text-gray-500">
                  Preview showing first 25 items (of {data.length} total)
                </div>
              )}
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          This will generate SVG QR codes that can be imported into Adobe Illustrator.
          You will receive a ZIP file containing:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-500 ml-4">
          <li>Individual QR code SVG files for each row</li>
          <li>A complete layout SVG with all QR codes arranged in a grid</li>
        </ul>
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
              Download QR Codes for Illustrator
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QRCodeGenerator;
