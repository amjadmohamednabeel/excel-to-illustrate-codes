
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { ExcelRow } from '@/utils/excelParser';
import { downloadIllustratorFiles } from '@/utils/qrCodeGenerator';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  data: ExcelRow[];
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Display a sample QR code if available
  const sampleQR = data.length > 0 ? data[0]['QR Code Text'] || data[0].qrCodeText : '';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Generate QR Codes for Illustrator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sampleQR && (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-gray-500">Sample QR Code Preview:</p>
            <QRCodeSVG value={sampleQR} size={120} />
            <p className="text-xs text-gray-500 max-w-[200px] truncate">{sampleQR}</p>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2">
          This will generate SVG QR codes that can be imported into Adobe Illustrator.
          You will receive a ZIP file containing all QR codes as separate SVG files.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || data.length === 0}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate QR Codes for Illustrator"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QRCodeGenerator;
