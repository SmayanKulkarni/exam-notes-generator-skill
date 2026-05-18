# Copilot Workspace Instructions

## Skill Routing Priority

When the user asks for notes, revision material, flashcards, cheatsheets, exam prep, solutions, or
answers to practice questions from any course files or folders, use the skill at:
`.github/docs/skills/exam-notes-generator/SKILL.md`

**One prompt is sufficient.** Do not ask for clarification unless the user's request is completely
ambiguous about which subject or file to use. All other parameters (output type, depth, paths,
syllabus) have safe defaults defined in the skill.

If the user asks for a complete study source, exhaustive notes, or a LaTeX-ready document, route to
the same skill and require a full coverage pass over every provided file.

## Trigger Phrases

Use the exam-notes-generator skill when requests include any of:
- make notes / create notes / study notes / exam notes
- notes from slides / notes from pdf / notes from this file
- summarize lecture / revise topic / prepare for exam
- make a cheatsheet / flashcards from these files
- **solutions** / **solve the questions** / **answers to practice questions** / **answer the questions in**
- generate solutions / practice question solutions

## Scope Detection (Folder-Pattern-Agnostic)

Auto-detect source content from the workspace. The skill supports multiple folder conventions:

| Pattern | Example |
|---------|---------|
| `subjects/<SubjectName>/Module N/` | `subjects/MLIII/Module 5/` |
| `subjects/<SubjectName>/Unit N/` | `subjects/QPM/Unit 3/` |
| `UNIT N/` | `UNIT 1/`, `UNIT 2/` |
| `Module N/` at root | `Module 3/` |
| Any folder with `.pptx`/`.pdf`/`.docx` files | detected automatically |

When the user names a subject (e.g. "ML3", "NLTP"), scan the full workspace for a matching folder.
Do not limit scope to `UNIT N/` naming only.

## Output Policy

### Format Requirements
- **ALL notes output must be complete, independently compilable `.tex` (LaTeX) documents.**
- **Default: one `.tex` file per module/unit subfolder** — not one monolithic document.
- Output path: `outputs/<subject-slug>/latex/<subject-slug>-module<N>-complete-study-source.tex`
- The output `.tex` file must include:
  - Full preamble with all required packages: amsmath, amssymb, lmodern, graphicx, booktabs,
    geometry, hyperref, tcolorbox, enumitem, xcolor, float, caption
  - `\newtcolorbox` definitions matching any existing module files for the same subject
    (**Style Inheritance Rule**: all modules of a subject share the same preamble and box styles)
  - `\tableofcontents` with proper sectioning
  - `\section`, `\subsection` hierarchy matching source depth
  - Every `\subsection` opens with a 2–4 sentence explanatory paragraph before any bullet list
  - Proper `\begin{itemize}` / `\begin{enumerate}` with nested lists where source uses nesting
  - Text emphasis: `\textbf{}` for key terms, `\textit{}` where appropriate
  - Equations in proper LaTeX environments (`\[ \]` or `\begin{equation}`)
  - `tcolorbox` environments for key concept callouts, important formulas, and worked numericals
    (blue = source examples, green = agent-constructed examples)
  - `\begin{figure}[H]` blocks with `\includegraphics` and `\caption{}` for all significant diagrams
  - Numerical inventory comment block at top of file
- **Compile with two passes of `pdflatex`** (required for TOC and cross-references).
- Report final page count and zero `!` errors to the user.
- **Reference quality standard:** `.github/reference-notes/template/reference-study-source.tex`
  — open and read this before generating any `.tex` output. If an existing module `.tex` is
  present for the same subject, also read it and inherit its preamble verbatim.

### Solutions Document Requirements
When the request is for solutions to practice questions:
- Output path: `outputs/<subject-slug>/latex/<subject-slug>-practice-questions-solutions.tex`
- Each question: gray tcolorbox (`colback=gray!6,colframe=black!60`) with question text verbatim
- Each solution: blue tcolorbox (`colback=blue!4,colframe=blue!70`) with detailed answer
- Every solution MUST open with a conceptual paragraph explaining the relevant theory — never start with bullet fragments
- Show all arithmetic steps for numerical sub-questions
- End numerical solutions with a boxed final answer and interpretation

### Content Requirements
- Keep all factual content grounded in provided files only.
- If a requested topic is not in sources, explicitly state that — never fill gaps by guessing.
- Exhaustive coverage: every theory concept, formula, diagram, and worked example from sources.
- OCR every slide/page image — do not trust the text layer alone.
- **Do NOT compress source bullet lists.** Preserve original bullet depth, sub-points, and caveats.
- Every taught method that has a computable form gets ≥ 3 worked examples in the output.

## Preferred Command

For consistent invocation, use the slash prompt: `.github/docs/prompts/exam-notes.prompt.md`
