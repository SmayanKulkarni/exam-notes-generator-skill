# Converting Legacy .doc / .ppt Files

LibreOffice (`soffice`) can convert legacy formats from `.doc`/`.ppt` into modern `.docx`/`.pptx`.
Run with `--headless` in automation contexts.

## Convert .doc -> .docx

```python
import subprocess, shutil

result = subprocess.run([
    "soffice", "--headless",
    "--convert-to", "docx",
    "--outdir", "/tmp/converted",
    "<source-folder>/old_notes.doc"
], capture_output=True, text=True)

if result.returncode != 0:
    print("STDERR:", result.stderr)
else:
    print("Converted to: /tmp/converted/old_notes.docx")
```

## Convert .ppt -> .pptx

```python
result = subprocess.run([
    "soffice", "--headless",
    "--convert-to", "pptx",
    "--outdir", "/tmp/converted",
    "<source-folder>/old_slides.ppt"
], capture_output=True, text=True)
```

## After conversion

- Process the converted file at `/tmp/converted/<filename>.docx` or `.pptx` normally.
- Image extraction works the same on the converted file.
- Quality note: some complex layouts may degrade slightly during conversion.
  Flag to the user if content looks truncated.

## Fallback: pandoc

If `soffice` is unavailable:
```bash
pandoc <source-folder>/old_notes.doc -o /tmp/old_notes.md
```
Pandoc handles .doc reasonably well for text but does not preserve images.
