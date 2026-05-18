# OCR Strategy for Scanned / Image-Only PDFs

Use this when `pdftotext` returns empty or garbled output, meaning the PDF has no text layer.

## Detection

```python
import pdfplumber

with pdfplumber.open("<source-folder>/scan.pdf") as pdf:
    page = pdf.pages[0]
    text = page.extract_text()
    if not text or len(text.strip()) < 20:
        print("SCANNED PDF — needs OCR or vision reading")
```

## Strategy 1: Rasterize + Vision (preferred for structured docs)

Rasterize each page at 2x zoom, then inspect the images with available image-reading tooling.
Claude's vision can read printed text, formulas, tables, and diagrams all at once.

```python
import fitz  # PyMuPDF

doc = fitz.open("<source-folder>/scan.pdf")
for i, page in enumerate(doc):
    mat = fitz.Matrix(2, 2)
    pix = page.get_pixmap(matrix=mat)
    out = f"/tmp/scan_page_{i+1}.png"
    pix.save(out)
    print(f"Page {i+1} -> {out}")
```

Then call `view` on each `/tmp/scan_page_N.png` and transcribe the content.
Process 3-5 pages at a time to avoid context overload.

## Strategy 2: pytesseract OCR (fallback for pure text pages)

```python
import pytesseract
from PIL import Image

text = pytesseract.image_to_string(Image.open("/tmp/scan_page_1.png"))
print(text)
```

Note: pytesseract struggles with mathematical notation. Use Strategy 1 for formula-heavy content.

## Strategy 3: Hybrid

For long documents, use Strategy 2 for text-heavy pages and Strategy 1 for pages
with diagrams, tables, or heavy formatting.

## Page count management

For documents > 20 pages, batch process:
- Prioritize pages that match syllabus keywords
- Ask user: "This is a 60-page scanned PDF. Should I process all pages or focus on specific topics?"
