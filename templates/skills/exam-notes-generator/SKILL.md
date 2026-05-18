---
name: exam-notes-generator
description: >
  Use this skill whenever the user wants to generate study notes, revision material, 
  summaries, cheatsheets, flashcards, or any exam-prep content from course material files.
  Triggers on phrases like: "make notes", "create notes", "study notes", "exam notes",
  "summarize my lecture", "notes from slides", "notes from PDF", "notes from this file",
  "prepare me for exam", "revise this topic", "make a cheatsheet", or any request to
  understand and extract structured knowledge from uploaded DOCX, PPTX, PPT, or PDF files.

  This skill MUST be used when:
  - User uploads any course material (lecture slides, textbook chapters, handouts) and
    asks for notes, summaries, or exam prep
  - User provides a syllabus and wants topic-by-topic notes organized to it
  - User asks to "go through" a folder or set of files and create notes
  - All note content must come ONLY from the actual files — never hallucinated or assumed

  Supports: PDF (including scanned/image-based), DOCX, DOC, PPTX, PPT
  Extracts: Text, embedded images (diagrams, charts, figures), tables
  Outputs: Complete, compilable LaTeX (.tex) documents, one per module/unit

  Also triggers on:
  - "solutions for these practice questions"
  - "solve the questions in this file"
  - "generate answers for the practice questions"
---

# Exam Notes Generator

A skill for reading course material files (PDF, DOCX, PPTX) — including embedded images —
and producing accurate, well-structured study notes aligned to a syllabus.

**Golden rule: Every fact in the notes must trace back to a specific file.
If it isn't in the material, it does not go in the notes.**

**Output rule: All notes should be LaTeX-first.**
Use LaTeX-style structure by default: `\section`, `\subsection`, `itemize`, `enumerate`, display equations, and figure/table blocks. Markdown is acceptable only as a transport format; the content should remain directly convertible into a `.tex` document.

---

## Package Surface

This skill is the primary and only user-facing surface for the notes project.

- Canonical skill entry: `.github/docs/skills/exam-notes-generator/SKILL.md`
- Prompt wrapper: `.github/docs/prompts/exam-notes.prompt.md`
- Reference LaTeX template: `.github/reference-notes/template/reference-study-source.tex`

The skill is intentionally standalone:

- It defines how users ask for notes, flashcards, and cheatsheets.
- It defines what source roots are in scope.
- It defines the grounding rule and citation requirement.

---

## Step 0 — Understand the request (Lazy-Prompt Compliant)

**This skill is designed to fire from a single casual prompt.** The user should never need to
specify more than a subject name or folder path. Every parameter below has a default — only ask
if genuinely ambiguous and blocking.

### 0A — Source resolution (auto-detect, no asking)

Resolve source files using these rules in order:

1. **If the user names a subject** (e.g. "ML3", "NLTP", "QPM"): scan the workspace for any
   folder whose name matches or contains those letters. Common patterns:
   - `subjects/<SubjectName>/`
   - `subjects/<SubjectName>/Module N/`
   - `UNIT N/`
   - Any folder with `.pptx`, `.pdf`, or `.docx` files whose names contain the subject keyword.
2. **If the user names a module** (e.g. "Module 5", "Unit 3"): restrict to that subfolder only.
3. **If the user provides an explicit path**: use it directly.
4. **If nothing is specified**: list the top-level folders and ask the user to pick one — this
   is the ONLY case where a clarifying question is acceptable.

Do **not** ask about syllabus, output type, or depth unless the user mentions them first.
Default values:
- Syllabus: **none** — infer structure from folder/filename hierarchy.
- Output type: **study notes** (detailed).
- Depth: **detailed** (exhaustive, not summary).
- Output granularity: **one `.tex` file per module/unit subfolder** (see Step 0C).

### 0B — Request type detection

Before proceeding, classify the request into one of three modes:

| Mode | Trigger phrases | Output format |
|------|----------------|---------------|
| **Study Notes** (default) | "make notes", "study notes", "create notes", "notes from slides" | Standalone `.tex` per module, see Step 4 |
| **Solutions Document** | "solutions", "solve", "answers to practice questions", "answer the questions in" | Q&A `.tex` with question boxes + solution boxes, see Step 0D |
| **Flashcards / Cheatsheet** | "flashcards", "cheatsheet", "revision cards" | See `references/flashcard-format.md` |

### 0C — Per-module standalone output (default for Study Notes mode)

**Default behaviour: produce one `.tex` file per source module/unit subfolder**, not one
monolithic document. Each file must be independently compilable with `pdflatex`.

Naming convention:
```
<subject-slug>-module<N>-complete-study-source.tex
```
Examples: `ml3-module2-complete-study-source.tex`, `nltp-module5-complete-study-source.tex`.

Output directory: derive from workspace root automatically:
- Look for existing `outputs/` directory in workspace root.
- If found, write to `outputs/<subject-slug>/latex/`.
- If not found, create `outputs/<subject-slug>/latex/` under workspace root.
- Extracted images go to `outputs/<subject-slug>/extracted/images/module<N>/`.

**If a module already has an existing `.tex` file in the outputs directory**:
1. Read the existing file's preamble (first 80 lines).
2. Extract: `\newtcolorbox` definitions, color scheme, packages, `\geometry` settings.
3. Use that exact preamble and box definitions in the new file to maintain style consistency.
This is the **Style Inheritance Rule** — every module in a subject must match the others.

### 0D — Solutions Document mode

When the request is for **solutions to practice questions**:

1. Parse the source file (DOCX/PDF) to extract every question. Use XML parsing for DOCX
   (python-docx or direct `word/document.xml` parsing) to capture all paragraph text.
2. Identify question boundaries: numbered headings, "Q.N", question marks, or explicit
   "Module N" section breaks.
3. For each question, produce a `tcolorbox` pair:
   ```latex
   % Question box (gray)
   \begin{tcolorbox}[colback=gray!6,colframe=black!60,breakable,title=\textbf{Question}]
   [question text verbatim]
   \end{tcolorbox}
   % Solution box (blue)
   \begin{tcolorbox}[colback=blue!4,colframe=blue!70,breakable,title=\textbf{Solution}]
   [detailed explanatory solution — NOT bullet fragments]
   \end{tcolorbox}
   ```
4. Every solution must:
   - Open with a conceptual paragraph explaining the relevant theory.
   - Use structured sub-sections (bold labels) for multi-part questions.
   - Include worked arithmetic for any numerical sub-question (show every step).
   - End with a clear conclusion or boxed answer for numerical questions.
5. Output file: `<subject-slug>-practice-questions-solutions.tex` in the same outputs directory.

### 0E — Syllabus (optional, auto-use)

If a syllabus file is present in the workspace root or the subject folder:
- Auto-detect it (look for files named `syllabus`, `curriculum`, `course-outline`, or ending in
  `_syllabus.pdf`/`_curriculum.pdf`).
- If found, use it to validate module coverage and sequence sections.
- If not found, infer structure from folder names and PPTX/PDF filenames. Do not ask.

---

## Step 1 — Inventory all source files

List and stat every uploaded file before reading:

```bash
ls -lh <source-folder>
file <source-folder>/*
```

Then build a coverage map for the full source set before writing notes:

- For every folder, file, slide, and page, record the topic or concept it contributes.
- For every diagram, chart, formula, table, and worked example, decide whether it will be transcribed, summarized, or explicitly called out as missing.
- For every bullet list in the source, preserve the full hierarchy and all sub-bullets unless the same point is already captured verbatim elsewhere.
- Do not shrink a source bullet list into a shorter paraphrase if that removes detail, qualifiers, examples, exceptions, or step ordering.
- For every PDF page, run OCR or rasterized inspection even if the file appears to have a text layer; handwritten notes, screenshots, and embedded figures often live only in the page image.
- For every slide/page image, inspect the rendered image so diagrams are not silently ignored.
- **RIGOROUS OCR REQUIREMENT**: For every PPTX slide and every PDF page, render the page/slide as an image and run OCR on it. Do not rely solely on the text extraction layer. Many slides contain critical theory, formulas, and labels inside diagrams and images that the text layer completely misses. If OCR yields additional content not in the text layer, merge it into the notes.
- If the provided sources look incomplete for an exhaustive output, state that up front instead of pretending completeness.

Build a dispatch plan using the table below:

| Extension          | Reading strategy                              | Image extraction?           |
|--------------------|-----------------------------------------------|-----------------------------|
| `.pdf`             | pypdf text + pdfplumber tables + rasterize    | Yes — see PDF Images section |
| `.docx`            | extract-text (markdown) + python-docx images  | Yes — see DOCX Images section |
| `.doc` (legacy)    | Convert to .docx via LibreOffice first        | Yes after conversion        |
| `.pptx`            | extract-text (slide text) + python-pptx images| Yes — see PPTX Images section |
| `.ppt` (legacy)    | Convert to .pptx via LibreOffice first        | Yes after conversion        |

---

## Step 2 — Read each file

### 2A — PDF Files

**Text extraction (text-based PDFs):**
```python
import pdfplumber

with pdfplumber.open("<source-folder>/lecture.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"\n--- Page {i+1} ---")
        text = page.extract_text()
        if text:
            print(text)
        # Extract tables too
        for table in page.extract_tables():
            print("\n[TABLE]")
            for row in table:
                print(" | ".join(str(c) for c in row if c))
```

**Fallback for scanned/image PDFs** (no text layer):
```bash
# Check if text is extractable
pdftotext <source-folder>/scan.pdf - | head -30
```
If output is empty or garbled → it is a scanned PDF. Use OCR path (see `.github/docs/skills/exam-notes-generator/references/ocr-strategy.md`).

Do not trust the text layer alone. For every PDF page, rasterize the page and run OCR on the rendered image, because equations, handwritten annotations, screenshots, and diagrams may exist only in the rasterized content.

#### PDF Images

Rasterize pages and pass to vision for diagrams, charts, and figures:
```python
import fitz  # PyMuPDF — install: pip install pymupdf --break-system-packages

doc = fitz.open("<source-folder>/lecture.pdf")
for page_num in range(len(doc)):
    page = doc[page_num]
    # Extract embedded images from page
    image_list = page.get_images(full=True)
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        img_bytes = base_image["image"]
        img_ext = base_image["ext"]
        out_path = f"/tmp/pdf_img_p{page_num+1}_{img_index}.{img_ext}"
        with open(out_path, "wb") as f:
            f.write(img_bytes)
        print(f"Saved: {out_path}")  # Then load with vision
```

For full-page rasterization (when image-heavy or layout matters):
```python
mat = fitz.Matrix(2, 2)  # 2x zoom for clarity
pix = page.get_pixmap(matrix=mat)
pix.save(f"/tmp/pdf_page_{page_num+1}.png")
```
Then inspect each `/tmp/pdf_page_N.png` with available image-reading tooling before writing notes.
Use OCR on every rendered page image, not just the pages that look unreadable. If OCR text is poor, keep the page image context in the notes and explicitly mark the uncertainty.

---

### 2B — DOCX Files

**Text + structure:**
```bash
extract-text <source-folder>/notes.docx
```
This emits proper Markdown with headings, bold, lists, and tables preserved.

**Images embedded in the DOCX:**
```python
from docx import Document
import os, shutil

doc = Document("<source-folder>/notes.docx")
out_dir = "/tmp/docx_images"
os.makedirs(out_dir, exist_ok=True)

for i, rel in enumerate(doc.part.rels.values()):
    if "image" in rel.reltype:
        img_part = rel.target_part
        ext = img_part.content_type.split("/")[-1]
        out_path = f"{out_dir}/img_{i}.{ext}"
        with open(out_path, "wb") as f:
            f.write(img_part.blob)
        print(f"Saved: {out_path}")
```
Then inspect each extracted image before writing notes.

**Legacy .doc files** — convert first:
```python
# Use the soffice wrapper (bare soffice hangs in this sandbox)
import subprocess
subprocess.run([
    "soffice",
    "--headless",
    "--convert-to", "docx",
    "--outdir", "/tmp",
    "<source-folder>/old_notes.doc"
], check=True)
# Then read /tmp/old_notes.docx normally
```

---

### 2C — PPTX Files

**Slide text:**
```bash
extract-text <source-folder>/slides.pptx
```
Output format: `## Slide N` headers with all text boxes under each.

**Images embedded in slides (diagrams, charts, photos):**
```python
from pptx import Presentation
from pptx.util import Inches
import os

prs = Presentation("<source-folder>/slides.pptx")
out_dir = "/tmp/pptx_images"
os.makedirs(out_dir, exist_ok=True)

for slide_num, slide in enumerate(prs.slides, 1):
    for shape_num, shape in enumerate(slide.shapes):
        if shape.shape_type == 13:  # MSO_SHAPE_TYPE.PICTURE
            image = shape.image
            ext = image.ext
            out_path = f"{out_dir}/slide{slide_num}_img{shape_num}.{ext}"
            with open(out_path, "wb") as f:
                f.write(image.blob)
            print(f"Saved: {out_path}")
```
Inspect each image with available image-reading tooling before writing notes.

If the slide is itself a screenshot, handwritten annotation, or image-heavy page, treat the rendered slide image as primary source material and OCR it before writing the notes.

If a slide contains a diagram, equation, figure, flowchart, or chart, mention it explicitly in the notes and place it in the same topic section as the text it supports.

**Legacy .ppt files** — convert first (same soffice wrapper as .doc above, `--convert-to pptx`).

---

## Step 3 — Diagram Extraction, Classification, and Embedding

This step is **mandatory**. Diagrams are not decorative — they are primary content. Architecture figures, flowcharts, state-machine diagrams, process flows, labelled graphs, and data-structure trees frequently contain information (labels, transitions, arrows, formulas) that never appears in the text layer. Every significant visual must be extracted, understood, saved, and embedded in the LaTeX output at exactly the right location.

---

### 3A — Extract all images from every source file

Run extraction for all file types as described in Steps 2A–2C. Collect every image into a staging directory, tagged by source file and slide/page number:

```python
import os, shutil, fitz
from pptx import Presentation

def extract_all_images(source_dir, staging_dir="/tmp/all_diagrams"):
    """Extract images from all PDFs and PPTXs in source_dir into staging_dir."""
    os.makedirs(staging_dir, exist_ok=True)

    for fname in os.listdir(source_dir):
        path = os.path.join(source_dir, fname)

        # --- PDF: extract embedded images ---
        if fname.lower().endswith(".pdf"):
            doc = fitz.open(path)
            for page_num, page in enumerate(doc):
                for img_idx, img in enumerate(page.get_images(full=True)):
                    base = doc.extract_image(img[0])
                    out = f"{staging_dir}/{fname}_p{page_num+1}_img{img_idx}.{base['ext']}"
                    with open(out, "wb") as f:
                        f.write(base["image"])
            doc.close()

        # --- PPTX: extract embedded images ---
        elif fname.lower().endswith(".pptx"):
            prs = Presentation(path)
            for s_num, slide in enumerate(prs.slides, 1):
                for sh_num, shape in enumerate(slide.shapes):
                    if shape.shape_type == 13:  # PICTURE
                        blob = shape.image.blob
                        ext = shape.image.ext
                        out = f"{staging_dir}/{fname}_slide{s_num}_img{sh_num}.{ext}"
                        with open(out, "wb") as f:
                            f.write(blob)
```

Also rasterize every **full page/slide** to PNG (zoom=2 for clarity) — some diagrams are composed of multiple shapes and cannot be extracted as a single embedded image:

```python
# Rasterize every PDF page (catches diagrams composed of native PDF shapes)
doc = fitz.open(pdf_path)
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    pix.save(f"{staging_dir}/{fname}_fullpage_p{i+1}.png")
doc.close()
```

---

### 3B — Classify every extracted image

For every image in the staging directory, open it with available image-reading tooling and assign it to one of these categories:

| Category | Description | Keep? |
|----------|-------------|-------|
| **Architecture / Structure** | Block diagrams, system designs, network topologies, model architectures | Always |
| **Algorithm flowchart** | Step-by-step procedure in boxes/diamonds/arrows | Always |
| **Data structure / graph** | Trees, DAGs, grids, finite automata, state machines, parse trees | Always |
| **Mathematical plot** | Function graphs, loss curves, decision boundaries, ROC curves, scatter plots | Always |
| **Process diagram** | Pipeline stages, lifecycle diagrams, sequence diagrams | Always |
| **Comparison table / matrix** | Grids comparing options, confusion matrices, co-occurrence tables | Always |
| **Slide chrome / decoration** | University logos, decorative borders, bullet-point backgrounds | Discard |
| **Duplicate** | Same image already saved from another slide | Discard (keep one) |
| **Unreadable / corrupt** | Completely garbled or 0-byte image | Flag and skip |

**Significance threshold**: An image is significant if it would cause a student to misunderstand or miss a concept if it were absent from the notes. When in doubt, keep it.

Write a triage log entry for every image processed:

```
[KEEP]   fname_slide3_img0.png  -> Architecture: RNN unrolled diagram
[KEEP]   fname_slide7_img1.png  -> Flowchart: BPTT gradient computation
[DISCARD] fname_slide1_img0.png -> Decoration: university logo
[DISCARD] fname_slide3_img2.png -> Duplicate of fname_slide2_img0.png
```

---

### 3C — OCR and annotate every kept diagram

For every image marked KEEP:

1. **Run OCR** on the image to extract any text labels, axis labels, node labels, formula annotations, or captions that are baked into the image:

   ```python
   import subprocess

   def ocr_image(img_path):
       result = subprocess.run(
           ["tesseract", img_path, "stdout"],
           capture_output=True, text=True
       )
       return result.stdout.strip()
   ```

2. **Visually inspect** the image using available image-reading tooling. Read what it shows: what are the boxes/nodes? What do the arrows represent? What do the labels mean in the context of the module topic?

3. **Write a caption sentence** that describes:
   - What the figure shows (not just its name)
   - What concept or process it illustrates
   - Which source file and slide/page it came from

   Example captions:
   > "Figure: RNN unrolled over 4 timesteps, showing how hidden state $h_t$ is passed forward and how the same weight matrices $W_x$, $W_h$, $W_o$ are shared at every step. (Source: Module4-RNN.pptx, Slide 6)"
   
   > "Figure: DP table for Viterbi algorithm applied to 3-word sentence 'Janet will back', showing probability values and backpointer arrows for each tag at each position. (Source: Module5-HMM.pptx, Slides 9-11)"

4. **Map the diagram to its topic section** in the syllabus. The figure must be embedded in the same `\subsection` or `\subsubsection` as the text that explains the concept it shows. Never float a diagram to a general "Figures" appendix.

---

### 3D — Copy and name diagrams for the output

Copy every kept diagram to the output figures directory with a **semantic filename** following the naming convention `m{N}_{topic_slug}.{ext}`:

```python
import shutil, re

def semantic_name(module_num, description, ext):
    slug = re.sub(r"[^a-z0-9]+", "_", description.lower()).strip("_")
    return f"m{module_num}_{slug}.{ext}"

# Example:
# m1_ngram_probability.png
# m2_ppmi_cooccurrence_matrix.png
# m4_lstm_cell_architecture.png
# m5_viterbi_dp_table.png
# m5_cky_parsing_table.png

shutil.copy(src_path, f"/outputs/figures/diagrams/{semantic_name(...)}")
```

**Naming rules**:
- Module number must be present: `m1_`, `m2_`, etc.
- Topic slug must be descriptive enough that the filename alone explains what the figure shows.
- No spaces, no special characters, no generic names like `image1.png` or `slide_fig.png`.
- If two diagrams illustrate the same topic, append `_a`, `_b`: `m4_lstm_cell_a.png`, `m4_lstm_cell_b.png`.

---

### 3E — Embed every diagram in the LaTeX output

For every kept and named diagram, insert the following block in the `.tex` file **immediately after the paragraph that first discusses the concept the diagram illustrates**. Never place it before the paragraph that introduces it, and never defer it to a later section.

```latex
\begin{figure}[H]
    \centering
    \includegraphics[width=0.85\textwidth]{figures/diagrams/mN_topic_slug.png}
    \caption{[Write the full caption from Step 3C here. Include: what it shows,
              what concept it illustrates, and which source file/slide it came from.]}
    \label{fig:mN_topic_slug}
\end{figure}
```

**Width guidelines**:
- Wide diagrams (timelines, pipelines, DP tables): `width=\textwidth`
- Medium diagrams (architecture blocks, flowcharts): `width=0.85\textwidth`
- Tall diagrams (tree structures, vertical flowcharts): `width=0.6\textwidth`
- Small diagrams (icons, simple state machines): `width=0.45\textwidth`

**Placement rules**:
- Place immediately after the introductory paragraph of the concept.
- If the diagram spans multiple concepts, place it at the first concept that references it, then `\ref{fig:label}` it later.
- Never place a diagram in a different `\section` than the text it illustrates.
- Never place a diagram before the text that introduces the concept it shows.
- Never use `[h]`, `[t]`, or `[b]` — always use `[H]` (from the `float` package) to pin the figure exactly where the theory is.

---

### 3F — Diagram completeness checklist

Before finalizing the `.tex` file:

- [ ] Every image file in the staging directory has a triage log entry (KEEP or DISCARD with reason).
- [ ] Every KEEP image has been OCR'd and visually inspected with a caption written.
- [ ] Every KEEP image has been copied to `/outputs/figures/diagrams/` with a semantic filename.
- [ ] Every kept diagram appears in the `.tex` file as a `\begin{figure}[H]` block with `\includegraphics`, `\caption`, and `\label`.
- [ ] Every `\includegraphics` path resolves to an existing file in `/outputs/figures/diagrams/`.
- [ ] No figure is placed in a different section than the text that explains it.
- [ ] Multi-slide diagrams (e.g., a DP table built across 3 slides) are combined into a single figure, or each stage is a separate labelled figure with a cross-reference.
- [ ] Architecture diagrams appear in the architecture/introduction subsection of their topic.
- [ ] Algorithm flowcharts appear in the algorithm description subsection, not in a summary.
- [ ] All figures compile without `!` errors from `pdflatex` (missing file, bad path, etc.).
- [ ] The PDF rendered output shows every figure at legible resolution — if a figure is blurry, re-extract at higher zoom (zoom=3 or zoom=4 in the fitz rasterization).

If any item fails, fix before marking Step 3 complete.

---

## Step 4 — Build notes aligned to the syllabus

Once all files are read and images annotated:

### Structure rules

- **One section per syllabus unit/topic** — use the syllabus numbering if provided.
- **Within each section:**
  - Key concept definitions (bolded term, one-line definition)
  - Formulas/equations (in code blocks or LaTeX if complex)
  - How-to / step-by-step where applicable
  - Diagrams described with `> Figure: ...` blockquotes
  - Tables for comparisons
  - Source attribution: `*(Source: slides.pptx, Slide 12)*`
- Preserve source list structure: if the source uses bullets, nested bullets, numbered steps, or sub-sub points, keep that hierarchy in the notes instead of flattening it into a compact paragraph.
- Prefer a LaTeX chapter layout over a revision-sheet layout. For detailed study-source requests, section depth should reflect the source depth rather than being compressed for brevity.

### Syllabus mapping protocol

For each syllabus topic:
1. Search all extracted content for matching keywords.
2. Extract only the relevant passages — do not copy entire pages verbatim.
3. Synthesize into concise notes in your own words, preserving accuracy.
4. If a syllabus topic has **zero coverage** in the provided files, explicitly note:
   `> No source material found for this topic in the provided files.`
   — Never fill gaps by guessing.

### Completeness checklist

Before returning the final notes, verify all of the following:

- Every source file was read or explicitly marked unreadable.
- Every PDF page was rasterized and OCR-checked, even when a text layer existed.
- Every unit/topic in the syllabus was mapped to one or more source files.
- Every theory concept mentioned in the source files appears in the notes.
- Every mathematical concept, formula, derivation, or equation visible in the source files appears in the notes or is called out as unreadable/missing.
- Every diagram, figure, table, and worked example is mentioned in context.
- No section ends with an unexplained gap, dangling reference, or placeholder.
- Missing coverage is listed explicitly and separately from the main notes.

If any item fails, do one more pass over the sources before finalizing.

### Output format (MANDATORY: Complete LaTeX)

**All notes must be generated as complete, compilable `.tex` (LaTeX) documents.**
This is not a suggestion — it is a hard requirement. Do not generate markdown with LaTeX comments; generate actual LaTeX.

#### Theory Elaboration Standard (CRITICAL)

**NEVER reduce theory to one-line bullet points.** Every concept must be explained in
proper paragraph form with sufficient depth for a student to understand it from the
notes alone. Follow these rules:

1. **Lead with a paragraph**: Before any bullet list, write 2-4 sentences explaining the
   concept in flowing prose. The paragraph must define the term, explain its purpose,
   and state why it matters in the context of the subject.
2. **Use bullets for structure, not as a replacement for explanation**: Bullets should
   enumerate properties, steps, or examples that follow from the paragraph explanation.
   Each bullet should contain a complete sentence or clause, not a fragment.
3. **Expand sub-concepts**: If the source material devotes a slide or section to a
   sub-topic (e.g., "Variants of Algorithm X" or "Categories of Phenomenon Y"), the notes
   must devote at least a paragraph and a structured list to it. Do not compress it into a single bullet.
4. **Connect concepts**: Explain how concepts relate to each other (e.g., how regularization
   prevents overfitting in a statistical model, how the components of an architecture interact,
   how a mathematical definition gives rise to a computational algorithm).
5. **Preserve source depth**: If the source has a 10-slide explanation of a topic, the
   notes must reflect that depth — not a 3-bullet summary.

#### Template Structure

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{amsmath, amssymb}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{geometry}
\usepackage{hyperref}
\usepackage{tcolorbox}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage{float}

\geometry{margin=1in}
\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,
    urlcolor=cyan,
    pdftitle={[Subject] Study Material},
}

% Global spacing for lists
\setlist[itemize]{itemsep=0.6em, topsep=0.5em, parsep=0.2em}
\setlist[enumerate]{itemsep=0.6em, topsep=0.5em, parsep=0.2em}

\title{\textbf{[Subject Name]\ Complete Study Material}}
\author{Generated from course material}
\date{}

\begin{document}

\maketitle
\tableofcontents
\newpage

\section{Module/Unit Name}

\subsection{Topic Name}

% LEAD WITH A PARAGRAPH — never start a subsubsection with only bullets
% The paragraph must define, explain purpose, and state significance.

Here is where the 2-4 sentence explanatory paragraph goes, establishing the concept
before any structured list. This paragraph must be self-contained: a student who
reads only this paragraph should understand what the concept is and why it matters.

\begin{itemize}
    \item \textbf{Key Term}: A complete-sentence definition followed by elaboration.
          Explain not just what it is, but how it works and where it is used.
    \item Nested points (if source material has them):
    \begin{itemize}
        \item Sub-point with full detail, not a fragment.
        \item More detail connecting to the broader concept.
    \end{itemize}
\end{itemize}

\subsubsection{Detailed Subtopic}

Another paragraph introducing this subtopic before any enumeration. The paragraph
should bridge from the parent topic to the specific detail.

\begin{enumerate}
    \item \textbf{Step 1}: Full explanation of the step, not just a label.
    \item \textbf{Step 2}: Full explanation with context.
\end{enumerate}

\begin{tcolorbox}[colback=blue!5!white,colframe=blue!75!black,title=\textbf{Key Concept}]
Important definition or principle from the source material, expanded into a short
paragraph if the source provides enough detail.
\end{tcolorbox}

% EMBED DIAGRAMS — every significant visual from the source gets a figure block
\begin{figure}[H]
    \centering
    \includegraphics[width=0.8\textwidth]{figures/diagrams/m1_topic_diagram.png}
    \caption{Description of the diagram from source material, including what it
             illustrates and which source file it was extracted from.}
    \label{fig:m1_topic}
\end{figure}

\textbf{Formula/Equation:}
\[ \text{Formula or equation exactly as shown in source} \]

\begin{tcolorbox}[colback=green!5!white,colframe=green!75!black,title=\textbf{Worked Numerical}]
\textbf{Given:} [state the given values]
\textbf{Find:} [state what to calculate]
\textbf{Solution:}
\begin{enumerate}
    \item \textbf{Step 1}: [calculation with explanation]
    \item \textbf{Step 2}: [more steps]
\end{enumerate}
\textbf{Answer:} [final result with interpretation]
\end{tcolorbox}

\end{document}
```

#### Quality Checklist

Every output `.tex` file must include:

- [x] `\documentclass` declaration (article, 11pt, a4paper)
- [x] All required packages (amsmath, amssymb, graphicx, hyperref, tcolorbox, enumitem, xcolor, float, geometry)
- [x] Title and `\maketitle`
- [x] `\tableofcontents`
- [x] `\section` for major topics, `\subsection` for sub-topics, `\subsubsection` for detailed breakdowns
- [x] **Theory elaboration**: Every `\subsection` and `\subsubsection` must open with a paragraph of
      explanatory prose (2+ sentences) before any bullet list or enumeration.
- [x] `\begin{itemize}` / `\begin{enumerate}` with proper nesting (no flattening of source structure)
- [x] `\textbf{}` for key terms, `\textit{}` for emphasis
- [x] All equations in proper LaTeX environments (`\[...\]` or `\begin{equation}`)
- [x] `tcolorbox` callouts for key concepts, important principles, and worked numericals
- [x] **Diagram embedding**: Step 3F checklist passed — every significant diagram is extracted, classified,
      OCR-annotated, saved with a semantic name to `/outputs/figures/diagrams/`, and embedded as a
      `\begin{figure}[H]` block with `\includegraphics`, `\caption`, and `\label`, placed in the same
      `\subsection` as the theory it illustrates. No diagram is in an appendix or wrong section.
- [x] **Numerical coverage**: Every distinct numerical type from the source (and any taught but undemonstrated method)
      has at least 3 worked examples total in the output (Step 4A-6 checklist passed).
- [x] **Numerical format**: Every tcolorbox numerical has Given, Find/Objective, numbered Steps with inline formulas,
      Answer, and Interpretation fields. No worked example is missing any of these fields.
- [x] **Numerical numbering**: All worked examples numbered sequentially as "Worked Example N" across the entire
      document — no per-section resets.
- [x] **Color convention**: Source-reproduced numericals use blue tcolorbox; agent-constructed additional examples
      use green tcolorbox.
- [x] **Numerical inventory comment** at the top of the `.tex` file listing all types and example counts.
- [x] Proper spacing using `\setlist` for consistent list item spacing
- [x] Source attribution in comments or caption text
- [x] No markdown syntax (no `**`, no `#`, no `>` blockquotes)
- [x] File compiles cleanly with `pdflatex` or `xelatex` without modification

#### Output location

- Save `.tex` file to: `/outputs/latex/[subject]-[module-range]-complete-study-source.tex`
- Save figures to: `/outputs/figures/` (referenced in the `.tex` via `\includegraphics{figures/...}`)
- After generation, optionally compile to PDF for preview (use provided `compile_latex.sh` script or `pdflatex`)

#### Preservation of source structure (Critical guardrail)

- If the source material has numbered steps, preserve them as `\begin{enumerate}`.
- If the source material has bullet lists with 2+ levels of nesting, preserve the nesting in `\begin{itemize}` and `\begin{enumerate}` blocks.
- If the source material lists exceptions, warnings, or caveats under a main point, include them as sub-items, not as separate paragraphs.
- If the source material has worked examples, format each as a separate `tcolorbox` with all steps and calculations shown.
- **Never compress a multi-line bullet list into a single paragraph.** This loses detail, qualifiers, examples, and learner context.

---

## Step 4A — Numerical Identification, Solving, and Augmentation

This step is **mandatory** for every study-notes generation request. Worked numerical examples are among the highest-value exam content and must be identified from ALL sources — text layers, tables, and images — and augmented with additional solved examples.

---

### 4A-1 — Scan all sources for numerical types

Before writing any numerical examples, build a **Numerical Inventory** by scanning every source file. A "numerical" is any problem where the student is expected to apply a method or formula to specific inputs and produce a concrete result. This includes (but is not limited to):

- **Calculation problems**: Apply a formula to given values and compute a result.
- **Algorithm trace problems**: Execute an algorithm step-by-step on specific input (e.g., sorting, parsing, dynamic programming).
- **Probability / statistics problems**: Compute probabilities, expected values, distributions, entropies, or scores.
- **Optimization problems**: Find minima/maxima, optimal paths, or best assignments.
- **Classification / decision problems**: Classify an input using a trained or given model.
- **Proof / derivation sketches**: Derive a formula result for specific parameter values.

**Scan procedure**:

```python
import re, os

# After extracting text from all modules into files like module1_all.txt ...
# Search all extracted text files for numerical keywords
modules = ["/outputs/extracted/text/module1_all.txt", ...]  # adapt paths

keywords = [
    "example", "given", "calculate", "compute", "find", "solve",
    "solution", "answer", "probability", "distance", "entropy",
    "perplexity", "table", "matrix", "step", "trace", "algorithm",
    "output", "classify", "predict", "optimal", "minimum", "maximum"
]

for path in modules:
    with open(path, "r", errors="replace") as f:
        lines = f.readlines()
    for i, line in enumerate(lines):
        low = line.lower()
        if any(k in low for k in keywords):
            print(f"{os.path.basename(path)}:{i+1}: {line.rstrip()}")
```

Record **the type** (not just the specific numbers) of every numerical found. Two examples of the same algorithm run on different inputs count as the **same type**. Your inventory entry should look like:

```
Type: [Short Name of the numerical type]
Source: [filename, slide N or page N]
Algorithm/Formula: [name of the method used]
Source example count: [how many examples of this type appear in the source]
```

---

### 4A-2 — OCR scan for image-based numericals

Many worked examples in lecture slides exist entirely inside images (screenshots, photos, hand-written tables, embedded figures). The text extraction layer will miss these entirely. You **must** rasterize and OCR every slide and every PDF page.

**Pipeline**:

```python
import fitz, subprocess, os

def pdf_to_pngs(pdf_path, out_dir, zoom=2):
    """Convert every page of a PDF to a PNG at 2x zoom."""
    os.makedirs(out_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    paths = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        p = os.path.join(out_dir, f"page{i+1:03d}.png")
        pix.save(p)
        paths.append(p)
    doc.close()
    return paths

def ocr_image(img_path):
    """Run tesseract OCR on a PNG and return the text."""
    result = subprocess.run(
        ["tesseract", img_path, "stdout"],
        capture_output=True, text=True
    )
    return result.stdout

# Convert every PPTX to PDF first (PPTX -> PDF -> PNG)
def pptx_to_pdf(pptx_path, out_dir):
    subprocess.run([
        "soffice", "--headless", "--convert-to", "pdf",
        "--outdir", out_dir, pptx_path
    ], check=True)
```

**After OCR**, search each page's OCR text for the same keywords listed in 4A-1. For every page that contains numerical keywords:

1. **Read the image visually** (use available image-reading tooling).
2. **Understand the full problem** — multi-page numericals often span 2-5 consecutive slides. Keep reading until the solution is complete.
3. **Record the complete problem** (all given values, the question, all steps, the final answer) in your Numerical Inventory.
4. **Note which slides** form the multi-page numerical so you can reconstruct it accurately.

**Multi-page numerical rule**: If an algorithm trace or worked example begins on slide N and continues on slides N+1, N+2, ..., you must read **all continuation slides** before writing the corresponding `tcolorbox`. Never reproduce only the first slide of a multi-page numerical.

---

### 4A-3 — Deduplicate and classify numerical types

After scanning both text and images, deduplicate your inventory:

- Different numbers / different inputs but the **same method** -> same type.
- Same method applied in a fundamentally different context -> separate type only if the solution procedure differs.

Produce a final classified list:

```
NUMERICAL TYPES FOUND:
[Module N] Type 1: [Name] — N source examples found
[Module N] Type 2: [Name] — N source examples found
...
```

---

### 4A-4 — Write worked examples into the LaTeX notes

For every numerical type:

1. **Transcribe all source examples** (from text or image) as individual `tcolorbox` blocks.
2. **Add a minimum of 2 additional worked examples** constructed using the same method with different inputs.
3. **Number all examples sequentially** across the entire document: "Worked Example 1", "Worked Example 2", etc. Never reset numbering between sections.

#### Rules for additional examples

- The **method/algorithm/formula** must be grounded in the source material — use only what the source teaches.
- The **specific inputs and numbers** for additional examples are newly constructed but must be verifiable by hand.
- Choose inputs that:
  - Are at a similar difficulty level to the source example.
  - Illustrate a different edge case or non-trivial aspect of the method.
  - Cover common exam variations (e.g., if source uses 2x2 matrix, add a 3x3; if source shows the happy path, add one with an unseen/zero-probability case).
- Do not add examples that simplify to trivial cases (all 1s, all 0s, single-element inputs) unless the source itself uses them as illustrations.

#### tcolorbox format for ALL numericals (source and additional)

```latex
% Source example (reproduced from original)
\begin{tcolorbox}[colback=blue!5!white,colframe=blue!75!black,
    title=\textbf{Worked Example N: [Descriptive Title]}]

\textbf{Given}: [All input values, model parameters, or problem setup]

\textbf{Find}: [What the student must calculate or determine]

\textbf{Solution}:
\begin{enumerate}
    \item \textbf{Step 1 label}: [Full explanation of what is computed in this step,
          including the formula used and the intermediate result.]
    \[
        \text{formula} = \text{result}
    \]
    \item \textbf{Step 2 label}: [Next computation, showing all arithmetic.]
    \item ...
\end{enumerate}

\textbf{Answer}: [Final numeric or symbolic result]

\textbf{Interpretation}: [One sentence explaining what this result means in context.]
\end{tcolorbox}

% Additional examples (agent-constructed) use green color:
\begin{tcolorbox}[colback=green!5!white,colframe=green!75!black,
    title=\textbf{Worked Example N+1: [Descriptive Title]}]
...
\end{tcolorbox}
```

**Color convention**:
- `colback=blue!5!white, colframe=blue!75!black` -> reproduced from source material
- `colback=green!5!white, colframe=green!75!black` -> agent-constructed additional example

**Placement**: Every set of worked examples must appear **immediately after the theory section that introduces the method**. Do not batch all numericals at the end of a module. The worked example for method X must follow the `\subsection` explaining method X.

#### Minimum coverage requirement

| Source examples found per type | Minimum in final output |
|-------------------------------|------------------------|
| 0 (type inferred from theory) | 2 constructed examples |
| 1                             | 1 source + 2 constructed = 3 total |
| 2                             | 2 source + 2 constructed = 4 total |
| 3+                            | All source + 2 constructed |

If the source has **zero** worked examples for a taught method (the method is explained but never demonstrated), construct **2 examples from scratch** using the exact method as described in the source theory.

---

### 4A-5 — Verify numerical correctness

Before appending a worked example:

1. **Recompute every arithmetic step by hand or programmatically.** An incorrect worked example in study notes is worse than no example at all.
2. **For algorithm traces** (dynamic programming tables, Viterbi grids, parsing tables, etc.): fill in the full DP/trace table, even if the source only shows partial steps.
3. **Check that intermediate results are consistent**: if step 2 uses the output of step 1, verify the link is numerically correct.
4. If a computation is too complex to verify fully, mark it with a `% TODO: verify` comment in the `.tex` source and note the uncertainty in the tcolorbox.

---

### 4A-6 — Numerical completeness checklist

Before finalizing the `.tex` file, verify:

- [ ] Every distinct numerical type identified in Step 4A-3 has at least 3 worked examples in the output (unless only 1 source example existed, in which case minimum is 3 total).
- [ ] Every worked example has: Given, Find (or Objective), numbered Steps with formulas, Answer, and Interpretation.
- [ ] No multi-page image-based numerical has been split across examples — each tcolorbox represents a complete problem from start to finish.
- [ ] All examples are numbered sequentially (Worked Example 1 through N) without resets.
- [ ] Source examples use blue tcolorbox; agent-constructed examples use green tcolorbox.
- [ ] Every worked example is placed in the same `\subsection` as the theory that teaches the method.
- [ ] Numerical inventory (from 4A-3) is archived as a comment block at the top of the `.tex` file, e.g.:
  ```latex
  % NUMERICAL INVENTORY:
  % Module 1 — Type: N-gram probability (3 source + 2 constructed)
  % Module 1 — Type: Perplexity (2 source + 2 constructed)
  % ...
  ```
- [ ] No worked example contains a step that relies on a formula not taught in the source material.

---

## Step 5 — Output delivery

| User asked for           | What to produce                                      |
|--------------------------|------------------------------------------------------|
| Notes in chat            | Render Markdown directly in conversation             |
| Downloadable `.md` file  | Save as `./outputs/notes.md` in the workspace        |
| Word doc (`.docx`)       | Export after generating markdown (for example with pandoc) |
| Flashcards               | See `.github/docs/skills/exam-notes-generator/references/flashcard-format.md` |
| Cheatsheet (1-2 pages)   | Condense to most testable facts; same output options |

Always state which files were used and which syllabus topics had no matching source material.

---

## Guardrails

- **No hallucination.** If content is not in the files, it does not appear in the notes.
- **No paraphrasing that changes meaning.** Formulas and definitions must be exact.
- **No merging unrelated sources.** Keep attribution per claim when files conflict.
- **Images are mandatory, not optional.** Skipping embedded images risks missing exam content.
- **Scanned PDFs need OCR.** If pdftotext returns empty, do not silently skip — use rasterize + vision or flag to user.
- **Diagrams are primary content, not decoration.** Any figure that illustrates an algorithm, architecture, data structure, mathematical relationship, or process step must be in the notes.
- **Extract both ways.** Always extract images using both the embedded-image API (fitz/python-pptx) AND full-page rasterization. Diagrams built from native PDF/PPTX shapes will not appear in the embedded-image list but will be captured by rasterization.
- **Semantic names only.** Filenames like `image1.png`, `img_0.jpeg`, or `slide3_img2.png` are not acceptable in the output. Every diagram must be renamed to `mN_topic_slug.ext` before being referenced in the `.tex`.
- **No orphan figures.** Every `\includegraphics` in the `.tex` must correspond to a file that actually exists in `/outputs/figures/diagrams/`. Verify file existence before compilation.
- **Captions must explain, not just label.** `\caption{LSTM diagram}` is not acceptable. The caption must state what the figure shows, what it illustrates about the concept, and where it came from.
- **Placement is semantically locked.** A diagram about method X must appear in the `\subsection` explaining method X — never in an introduction, summary, or appendix section.
- **No loose ends.** A study-source request is not complete unless the notes cover all visible theory, math, and figures or explicitly name the gaps.
- **Numericals are mandatory.** Every taught method that can be applied to concrete inputs must have at least 3 worked examples in the output. There is no "theory-only" subsection for a method that has a computable form.
- **No partial multi-page numericals.** If a worked example spans multiple slides/pages, read every continuation slide before writing the tcolorbox. A tcolorbox that shows only the setup but not the solution is not acceptable.
- **Additional examples must use only taught methods.** For agent-constructed examples, the formula/algorithm must be one the source material teaches. The specific inputs are newly chosen but must be independently verifiable.
- **Numerical correctness is non-negotiable.** Verify every arithmetic step before including it. An incorrect worked example is more harmful than a missing one. Use `% TODO: verify` if uncertain and flag explicitly.
- **Never batch numericals at the end.** Worked examples must be co-located with the theory they demonstrate — always immediately after the `\subsection` or `\subsubsection` that introduces the method.
- **Sequential numbering.** "Worked Example N" numbering must be global across the document. If Module 1 ends at Example 16, Module 2 begins at Example 17.

---

## Step 6 — Compile and verify

After writing the `.tex` file:

1. Run **two passes** of `pdflatex` (required for `\tableofcontents` and cross-references):
   ```bash
   pdflatex -interaction=nonstopmode -output-directory <out_dir> <file.tex>
   pdflatex -interaction=nonstopmode -output-directory <out_dir> <file.tex>
   ```
2. Check the `.log` file for `!` lines (fatal errors). Zero `!` lines is the acceptance criterion.
3. If errors exist, fix them before declaring completion. Common causes:
   - Missing `\includegraphics` target (image file not copied to figures dir)
   - Unbalanced `\begin{tcolorbox}` / `\end{tcolorbox}`
   - Unicode characters in text — replace with LaTeX equivalents (`\textendash`, `\textemdash`, etc.)
   - Missing package (add to preamble)
4. Report the final page count and error count to the user.

---

## Reference files

- `.github/docs/skills/exam-notes-generator/references/ocr-strategy.md` — How to handle scanned/image-only PDFs
- `.github/docs/skills/exam-notes-generator/references/flashcard-format.md` — Q&A flashcard output format
- `.github/docs/skills/exam-notes-generator/references/soffice-convert.md` — Converting legacy .doc / .ppt files safely
- `.github/reference-notes/template/reference-study-source.tex` — **Reference LaTeX template (bundled with this skill). This is the quality and formatting standard for all generated notes.** Open and read this file before generating any notes. It shows: full preamble with all required packages, newtcolorbox definitions, tcolorbox callouts (blue for source examples, green for constructed examples), TikZ diagram blocks, worked example format (Given / Find / Solution steps with inline equations / Answer / Interpretation), missing-coverage section, and numerical inventory comment block. **Match this structure exactly.** If an existing module `.tex` is present for the same subject, also read it and inherit its preamble verbatim (Style Inheritance Rule, Step 0C).
