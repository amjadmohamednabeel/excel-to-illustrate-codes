
# Customizable Excel to QR Code Generator

## What It Is Doing

This is a web-based application that converts Excel data into customizable QR codes for professional use. The application is specifically designed for creating QR codes that can be used in Adobe Illustrator and other design software, making it perfect for product labeling, inventory management, and industrial applications.

**Key Features:**
- Upload Excel files with serial numbers and generate corresponding QR codes
- Customize QR code appearance with colors, sizes, and layouts
- Upload and use custom fonts (including industrial fonts like DENSO)
- Export in multiple formats: PDF, SVG, and EPS
- Transparent backgrounds for seamless integration into designs
- Professional-grade output suitable for print and manufacturing

## How It Works

### Step-by-Step Process:

1. **Upload Excel File**: Upload an Excel file containing columns for:
   - Count (quantity)
   - Unit Serial Number
   - QR Code Text (the data to encode)

2. **Data Preview**: The application parses your Excel file and displays a preview table to verify the data is correct.

3. **Font Management**: Upload custom font files through the File menu. The application supports:
   - Standard web fonts (Arial, Helvetica, Times New Roman)
   - Monospace fonts (PT Mono, Courier New)
   - Industrial fonts (DENSO Bold, DENSO Regular)
   - Custom uploaded fonts (.ttf, .otf, .woff formats)

4. **QR Code Customization**: Customize your QR codes with:
   - Size adjustment (width and height)
   - Color selection (foreground and background)
   - Font family and size for labels
   - Layout options and spacing
   - Transparent background toggle

5. **Generation & Export**: Choose your preferred format:
   - **PDF**: Vector format perfect for printing
   - **SVG**: Scalable vector graphics for web use
   - **EPS**: Adobe Illustrator compatible format

### Technical Architecture:

- **Frontend**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui components
- **File Processing**: xlsx library for Excel parsing
- **QR Generation**: qrcode library for QR code creation
- **PDF Generation**: jsPDF for professional PDF output
- **Font Handling**: Dynamic font loading and base64 conversion for PDF embedding

### Use Cases:

- **Manufacturing**: Generate QR codes for product serial numbers
- **Inventory Management**: Create scannable labels for tracking
- **Design Workflows**: Export vector files for Adobe Illustrator
- **Print Production**: Professional-grade output for commercial printing
- **Industrial Applications**: Support for specialized fonts like DENSO

## Created By

**Amjad Mohamed Nabeel**
