#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PKG_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(PKG_ROOT, 'templates');

function printHelp() {
  console.log(`
exam-notes-generator-skill v${require('../package.json').version}

Usage:
  npx exam-notes-generator init [target-dir]           Scaffold the skill into a project
  npx exam-notes-generator init [target-dir] --windsurf  Also install .windsurf/rules/ entry
  npx exam-notes-generator --help                      Show this help

Commands:
  init [dir]    Install the skill and all supporting files into the specified
                directory (default: current working dir).

What gets installed:
  .github/
    copilot-instructions.md          <- workspace-level AI routing rules (Windsurf / Copilot)
    docs/
      prompts/
        exam-notes.prompt.md         <- slash-prompt harness
      skills/
        exam-notes-generator/
          SKILL.md                   <- full skill specification
          references/
            flashcard-format.md
            ocr-strategy.md
            soffice-convert.md
    reference-notes/
      template/
        reference-study-source.tex   <- LaTeX quality & formatting benchmark

  With --windsurf flag, also installs:
  .windsurf/
    rules/
      exam-notes-generator.md        <- Windsurf rules panel entry (same content as copilot-instructions)

Examples:
  npx exam-notes-generator init
  npx exam-notes-generator init ./my-course-project
  npx exam-notes-generator init /home/user/workspace/bio-notes --windsurf
`);
}

function scaffold(targetDir, windsurfMode) {
  const destRoot = path.resolve(targetDir);
  const githubDir = path.join(destRoot, '.github');

  // Define the full directory structure we want to create
  const dirs = [
    path.join(githubDir, 'docs', 'prompts'),
    path.join(githubDir, 'docs', 'skills', 'exam-notes-generator', 'references'),
    path.join(githubDir, 'reference-notes', 'template'),
  ];

  if (windsurfMode) {
    dirs.push(path.join(destRoot, '.windsurf', 'rules'));
  }

  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
      console.log(`  created: ${path.relative(process.cwd(), d)}`);
    } else {
      console.log(`  exists:  ${path.relative(process.cwd(), d)}`);
    }
  }

  // Map of template files -> destination paths
  // IMPORTANT: copilot-instructions.md goes to .github/copilot-instructions.md
  // (the standard path read by Windsurf and GitHub Copilot at workspace level).
  const files = [
    {
      src: path.join(TEMPLATES_DIR, 'copilot-instructions.md'),
      dst: path.join(githubDir, 'copilot-instructions.md'),
    },
    {
      src: path.join(TEMPLATES_DIR, 'prompts', 'exam-notes.prompt.md'),
      dst: path.join(githubDir, 'docs', 'prompts', 'exam-notes.prompt.md'),
    },
    {
      src: path.join(TEMPLATES_DIR, 'skills', 'exam-notes-generator', 'SKILL.md'),
      dst: path.join(githubDir, 'docs', 'skills', 'exam-notes-generator', 'SKILL.md'),
    },
    {
      src: path.join(TEMPLATES_DIR, 'skills', 'exam-notes-generator', 'references', 'flashcard-format.md'),
      dst: path.join(githubDir, 'docs', 'skills', 'exam-notes-generator', 'references', 'flashcard-format.md'),
    },
    {
      src: path.join(TEMPLATES_DIR, 'skills', 'exam-notes-generator', 'references', 'ocr-strategy.md'),
      dst: path.join(githubDir, 'docs', 'skills', 'exam-notes-generator', 'references', 'ocr-strategy.md'),
    },
    {
      src: path.join(TEMPLATES_DIR, 'skills', 'exam-notes-generator', 'references', 'soffice-convert.md'),
      dst: path.join(githubDir, 'docs', 'skills', 'exam-notes-generator', 'references', 'soffice-convert.md'),
    },
    {
      src: path.join(TEMPLATES_DIR, 'reference', 'reference-study-source.tex'),
      dst: path.join(githubDir, 'reference-notes', 'template', 'reference-study-source.tex'),
    },
  ];

  // --windsurf: also copy copilot-instructions to .windsurf/rules/
  if (windsurfMode) {
    files.push({
      src: path.join(TEMPLATES_DIR, 'copilot-instructions.md'),
      dst: path.join(destRoot, '.windsurf', 'rules', 'exam-notes-generator.md'),
    });
  }

  let installed = 0;
  let updated = 0;

  for (const { src, dst } of files) {
    if (!fs.existsSync(src)) {
      console.error(`  missing template: ${src}`);
      continue;
    }
    const content = fs.readFileSync(src, 'utf-8');
    const exists = fs.existsSync(dst);
    fs.writeFileSync(dst, content, 'utf-8');
    if (exists) {
      console.log(`  updated: ${path.relative(process.cwd(), dst)}`);
      updated++;
    } else {
      console.log(`  installed: ${path.relative(process.cwd(), dst)}`);
      installed++;
    }
  }

  console.log(`\nDone. ${installed} new file(s) installed, ${updated} updated.`);
  console.log(`Target: ${destRoot}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Place your source materials (PDF / PPTX / DOCX) in the project,`);
  console.log(`     e.g. subjects/<SubjectName>/Module N/`);
  console.log(`  2. Ask your AI assistant with a single prompt:`);
  console.log(`     "Make complete study notes for <subject name>"`);
  console.log(`     "Solutions for the practice questions in <file.docx>"`);
  console.log(`  3. The skill auto-detects sources, output paths, and existing style.`);
  console.log(`     No follow-up questions needed.`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];

  if (command === 'init') {
    const positional = args.filter(a => !a.startsWith('--'));
    const target = positional[1] || '.';
    const windsurfMode = args.includes('--windsurf');
    scaffold(target, windsurfMode);
  } else {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }
}

main();
