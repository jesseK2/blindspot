# Blindspot

**See what the review never looked at.**

AI review tools report on the code they were shown. Blindspot is a working demo of the other half: a review surface that tracks what the checker *skipped* — the files it never opened, the paths it waved through — and turns those gaps into a queue someone can actually clear before merge.

Open the demo, pick a change, and the gap sheet shows each unchecked area with the regret it carries if it ships: low, moderate, elevated, severe. Clearing a gap moves it into the handoff queue with the evidence attached, so "we didn't check that" stops being an invisible risk.

## What's in it

| Area                        | What it does                                                        |
| --------------------------- | ------------------------------------------------------------------- |
| `components/gap-sheet.tsx`   | The gap sheet: unchecked areas, bands and the reasoning behind each |
| `components/handoff-queue.tsx` | Gaps that were cleared, with the evidence attached                |
| `components/risk-ledger.tsx` | The running ledger of what shipped unexamined                       |
| `components/story-intro.tsx` | The one-screen explanation of the mechanic                          |
| `components/tour.tsx`        | Guided pass through the demo                                        |
| `functions/`                 | Optional server handler for the hosted build                        |

Built with React 19, Vite, TypeScript, Tailwind CSS 4 and lucide icons. Tokens live in CSS custom properties so light and dark themes are both first-class (toggle in the header, remembered in `localStorage`).

## Run it

```sh
npm install
npm run dev
```

## Live

https://blindspot-review-kec16q5gjt9.qoder.website

## Provenance

See [PROVENANCE.md](./PROVENANCE.md) for where the visual language and copy came from, and what was written for this demo.
