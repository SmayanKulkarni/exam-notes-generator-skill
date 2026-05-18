# exam-notes-generator-skill

> Npx-installable AI skill for generating exam-ready LaTeX study notes from course materials (PDF, DOCX, PPTX). Includes diagram extraction, OCR, worked numericals, and complete compilation-ready `.tex` output.

## What This Is

This package scaffolds a **Windsurf / Copilot-compatible agent skill** into any project. The skill turns lecture slides, PDFs, and Word documents into:

- **Complete, compilable LaTeX** (`.tex`) documents with proper preamble, TOC, sectioning, equations, and diagrams
- **Exhaustive study notes** that preserve every concept, formula, and worked example from your sources
- **Diagram extraction & embedding** with semantic filenames and proper figure placement
- **Augmented worked numericals** — every taught method gets at least 3 solved examples (source + agent-constructed)
- **Flashcards & cheatsheets** as alternative outputs

## Quick Start

### One-shot (no install)

```bash
npx exam-notes-generator init
```

This scaffolds the skill into your current directory.

For Windsurf users, also install into `.windsurf/rules/`:

```bash
npx exam-notes-generator init --windsurf
```

### Install locally (for repeated use)

```bash
npm install -g exam-notes-generator-skill
exam-notes-generator init ./my-course-project --windsurf
```

## What Gets Installed

```
.github/
  copilot-instructions.md            # AI workspace routing rules (Windsurf / Copilot standard path)
  docs/
    prompts/
      exam-notes.prompt.md           # Lazy-prompt harness (one prompt = full output)
    skills/
      exam-notes-generator/
        SKILL.md                     # Full skill specification (~1100 lines)
        references/
          flashcard-format.md        # Q&A card output format
          ocr-strategy.md            # Scanned PDF handling
          soffice-convert.md         # Legacy .doc/.ppt conversion
  reference-notes/
    template/
      reference-study-source.tex     # LaTeX quality & formatting benchmark

# With --windsurf:
.windsurf/
  rules/
    exam-notes-generator.md          # Windsurf Rules panel entry
```

## Skill Workflow (One Prompt Is All You Need)

1. **Place your course materials** in the project (any folder structure works):
   - `subjects/<SubjectName>/Module N/` ← standard
   - `UNIT N/` ← also supported
   - Any folder with `.pptx`/`.pdf`/`.docx` files
2. **Ask your AI assistant with a single casual prompt**:
   - *"Make complete study notes for ML3"*
   - *"Notes for Module 5 from subjects/NLTP/Module 5/"*
   - *"Solutions for the practice questions in Practice Questions.docx"*
   - *"Flashcards for the DP and MC section"*
3. **The skill automatically** (no follow-up questions):
   - Locates source files by subject/module name matching
   - Extracts text layer + all embedded images
   - Rasterizes every page/slide and OCRs them
   - Inherits preamble style from existing module files (style consistency)
   - Builds a numerical inventory and augments with extra examples
   - Produces one standalone compilable `.tex` per module
   - Runs two-pass `pdflatex` and reports page count + error count

## Key Design Principles

| Principle | Enforcement |
|---|---|
| **One prompt** | No clarifying questions — all parameters have safe defaults |
| **Grounded only** | Every fact must trace to a specific source file |
| **LaTeX-first** | Output is compilable `.tex`, one file per module |
| **Style inheritance** | New modules inherit preamble from existing modules of same subject |
| **Diagrams are content** | Every significant figure extracted, OCR'd, named semantically, embedded |
| **No compression** | Source bullet hierarchy, sub-points, and caveats preserved |
| **Numericals mandatory** | Every method gets ≥3 worked examples (source + constructed) |
| **Solutions mode** | Practice question files produce explanatory Q+A `.tex` documents |
| **Two-pass compile** | Always runs `pdflatex` twice; reports zero `!` errors |

## Example Invocations

```
# Study notes — one module
"Make study notes for NLTP Module 6"

# Study notes — all modules of a subject
"Generate complete study-source LaTeX for all ML3 modules"

# Solutions document
"Solutions for the practice questions in subjects/MLIII/Practice Questions (2).docx"

# Flashcards
"Flashcards for the eligibility traces section of Module 5"
```

## Requirements

- Node.js >= 18 (for the CLI scaffold tool)
- The AI skill runs inside your agent environment (Windsurf, Copilot, etc.)
- Optional but recommended: `pymupdf`, `pdfplumber`, `python-pptx`, `python-docx`, `tesseract`

## License

MIT
