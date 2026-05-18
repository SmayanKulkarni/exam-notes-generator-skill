---
mode: agent
description: >
  Generate exam study notes, solutions, flashcards, or a cheatsheet from course material files.
  One prompt is enough — subject name, folder path, or file reference is all that is needed.
  Fires automatically on: "make notes for X", "study notes for module N", "notes from these slides",
  "solutions for the practice questions", "solve the questions in this file", "flashcards for X".
---

# Exam Notes Workflow

## How to invoke (lazy prompting)

All of the following are valid single-prompt invocations. No follow-up questions needed.

```
"Make complete study notes for ML3"
"Notes for NLTP module 5 from the slides in subjects/NLTP/Module 5/"
"Generate study notes for all modules in subjects/QPM/"
"Solutions for the practice questions in Practice Questions (2).docx"
"Flashcards for Module 3"
"Cheatsheet for the DP and MC section"
```

The agent auto-detects: source folder, output directory, existing style to inherit, syllabus (if present).

---

## Skill reference

Execute the full workflow defined in:
```
.github/docs/skills/exam-notes-generator/SKILL.md
```

Before writing any LaTeX, also open and read:
```
.github/reference-notes/template/reference-study-source.tex
```
This is the quality and formatting benchmark. Match its preamble, `\newtcolorbox` definitions,
tcolorbox color scheme, and worked-example structure exactly.

If the subject already has existing module `.tex` files in `outputs/`, read one and inherit its
preamble verbatim (Style Inheritance Rule — all modules of a subject must be visually consistent).

---

## Auto-detection defaults (no inputs required)

| Parameter | Default behaviour |
|-----------|------------------|
| Source path | Auto-detect from subject name in prompt; scan `subjects/`, `UNIT N/`, and workspace root |
| Module scope | All modules found under the subject folder; or single module if named |
| Syllabus | Auto-detect file named `syllabus`/`curriculum` in subject folder; skip gracefully if absent |
| Output type | **Study notes** (detailed, exhaustive, per-module standalone `.tex`) |
| Solutions mode | Triggered by "solutions", "solve", "answers" keywords — produces Q&A `.tex` |
| Output directory | `outputs/<subject-slug>/latex/` under workspace root |
| Image directory | `outputs/<subject-slug>/extracted/images/module<N>/` |
| Compile | Two-pass `pdflatex`; report page count and `!`-line count |

---

## Execution checklist (agent must complete all steps)

### Source ingestion
- [ ] Listed all files in source folder(s); built file-type dispatch table
- [ ] Extracted text layer from every PPTX/PDF/DOCX
- [ ] Extracted all embedded images from every source file (fitz/python-pptx/python-docx)
- [ ] Rasterized every slide/page at 2× zoom as full-page PNG
- [ ] OCR'd every rasterized image; merged OCR content with text layer
- [ ] Built image triage log (KEEP / DISCARD with reason for every image)
- [ ] OCR'd and captioned every KEEP image; copied to extracted images directory

### LaTeX output
- [ ] Read reference-study-source.tex; noted preamble and box definitions
- [ ] If existing module .tex present for this subject: read it; inherited preamble (Style Inheritance Rule)
- [ ] Output file named `<subject-slug>-module<N>-complete-study-source.tex`
- [ ] Preamble includes: amsmath, amssymb, graphicx, booktabs, geometry, hyperref, tcolorbox, enumitem, xcolor, float, lmodern, caption
- [ ] `\newtcolorbox` definitions match existing module style (or reference template if first module)
- [ ] `\tableofcontents` present; sections follow module/unit structure
- [ ] Every `\subsection` opens with 2–4 sentence explanatory paragraph before any bullet list
- [ ] Worked numericals: minimum 3 per taught method; blue tcolorbox (source) / green (constructed)
- [ ] Every worked numerical has: Given, Find, numbered Steps with inline formulas, Answer, Interpretation
- [ ] Every KEEP diagram embedded as `\begin{figure}[H]` with semantic `\includegraphics` path and full caption
- [ ] Numerical inventory comment block at top of `.tex` file
- [ ] No markdown syntax anywhere in the `.tex` file

### Compile and verify
- [ ] Ran `pdflatex` twice (two-pass for TOC and refs)
- [ ] Zero `!` lines in `.log`
- [ ] Reported: filename, page count, error count

---

## Output specification

### Study Notes mode
- **One `.tex` file per module subfolder**, independently compilable
- Path: `outputs/<subject-slug>/latex/<subject-slug>-module<N>-complete-study-source.tex`
- Content: exhaustive — every concept, formula, diagram, and worked example from sources

### Solutions Document mode (triggered by "solutions" / "solve" / "answers" keywords)
- **One `.tex` file** covering all questions in the source file
- Path: `outputs/<subject-slug>/latex/<subject-slug>-practice-questions-solutions.tex`
- Format: gray question box + blue solution box per question
- Solutions: open with theory paragraph, show all arithmetic steps, end with conclusion
- Every solution must be explanatory, not a bullet-fragment list

### Flashcards / Cheatsheet mode
- See `.github/docs/skills/exam-notes-generator/references/flashcard-format.md`

---

## Quality enforcement

- **No hallucination.** Every fact traces to a specific source file + slide/page.
- **No compressed bullets.** Preserve source hierarchy — nested bullets stay nested.
- **No orphan figures.** Every `\includegraphics` path must exist on disk before compile.
- **No theory-only methods.** Every taught formula/algorithm gets ≥ 3 worked examples.
- **No one-pass compile.** Always run `pdflatex` twice.
- **No style drift.** Every module of a subject uses the same preamble and box definitions.
- **No vague solutions.** Solutions document answers open with a conceptual paragraph; never start with a bare bullet list.
- **Report gaps.** If a syllabus topic has no source coverage, say so explicitly — do not skip silently.
