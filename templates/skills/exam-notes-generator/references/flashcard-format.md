# Flashcard Output Format

Use this format when the user asks for flashcards, Q&A cards, or revision cards.

## Markdown format (for chat / .md output)

```markdown
---
**Q:** What is the Sharpe Ratio?
**A:** A risk-adjusted performance measure = (Portfolio Return - Risk-Free Rate) / Portfolio Std Dev.
A higher Sharpe ratio indicates better return per unit of risk.
*(Source: slides.pptx, Slide 22)*

---
**Q:** What does the Efficient Frontier represent?
**A:** The set of optimal portfolios that offer the highest expected return for a given level of risk,
or lowest risk for a given return. Derived from the Markowitz model.
*(Source: textbook_ch7.pdf, Page 143)*
```

## Rules for flashcard generation

1. **One concept per card** — do not combine two definitions.
2. **Q side:** Short, exam-style question (definition, calculation trigger, "what is", "how does").
3. **A side:** Concise but complete answer. Include formula if relevant.
4. **Always cite source file + location.**
5. **Never invent Q&A pairs** not supported by the source material.
6. Prefer testable facts: definitions, formulas, comparisons, step sequences.

## Coverage mapping

Group cards by syllabus unit:
```markdown
## Unit 2: Modern Portfolio Theory
[cards here]

## Unit 3: Modelling Asset Returns
[cards here]
```
