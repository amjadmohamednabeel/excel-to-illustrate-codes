
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExcelRow } from '@/utils/excelParser';

interface PreviewTableProps {
  data: ExcelRow[];
}

const PreviewTable: React.FC<PreviewTableProps> = ({ data }) => {
  if (data.length === 0) {
    return null;
  }

  // Determine column headers from the first row
  const headers = Object.keys(data[0]);
  const limitedData = data.slice(0, 5); // Show only first 5 rows in preview

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Data Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {limitedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header) => (
                  <TableCell key={`${rowIndex}-${header}`}>{row[header]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length > 5 && (
          <div className="px-4 py-2 text-sm text-gray-500 border-t">
            Showing 5 of {data.length} rows
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreviewTable;
