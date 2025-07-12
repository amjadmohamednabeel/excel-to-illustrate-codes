
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

**Amjad**

---

## Project Info

**URL**: https://lovable.dev/projects/76366ab9-4f65-47f0-9e52-1a6c6f71d0b4

## How Can I Edit This Code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/76366ab9-4f65-47f0-9e52-1a6c6f71d0b4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What Technologies Are Used for This Project?

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library for building user interfaces
- **shadcn-ui** - Modern UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **xlsx** - Excel file parsing
- **qrcode** - QR code generation
- **jsPDF** - PDF generation
- **JSZip** - File compression for downloads

## How Can I Deploy This Project?

Simply open [Lovable](https://lovable.dev/projects/76366ab9-4f65-47f0-9e52-1a6c6f71d0b4) and click on Share → Publish.

## Can I Connect a Custom Domain to My Lovable Project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
