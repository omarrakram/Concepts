# Inbox: returned try-on candidates

Drop each generated image here as `<job id>.png` (or `.jpg` / `.webp`), e.g.
`men--black-basic-oversized-hoodie.png`, then run
`npm run stylist-tryon -- import`.

- One full frame per job, 2:3, at least 600 × 900, the framing of the
  pack's `input-1-canonical.png`. Not retouched by hand.
- Optionally the pack's `job.json` beside it as `<job id>.json`.
- Accepted files move to `.cache/stylist/tryon/candidates/` (needs-review);
  refused ones stay here and the import prints why.

Nothing in this folder except this README is committed (`.gitignore`), and
nothing here ever reaches production without an approval
(`scripts/stylist/tryon/README.md`).
