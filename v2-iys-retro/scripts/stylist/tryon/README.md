# DRESSUP.EXE slot assets (offline try-on + manual approval)

DRESSUP.EXE mixes and matches TOP / BOTTOM / OUTERWEAR on the two canonical
models. Each slot piece is a static layer of **the same canonical photo** in
which only that slot's garment changed. Those layers are made at development
time, reviewed by a person, and shipped as files. Nothing is generated at
runtime: the app never loads this tooling, calls no AI service, and has no
AI dependency (enforced by `src/tests/dressup-tryon.test.ts`).

**Same person. Real garment. Only the clothing changes. Manually reviewed. Static assets.**

## Asset classes

| class | what | in production |
| --- | --- | --- |
| official look (`scope: whole`) | an official photo of that same model in the piece, whole body below the chin (`looks.ts` WHOLE_LOOKS). Worn one at a time | yes (the deployed 13) |
| official slot (`source: official, scope: slot`) | an official photo of that same model, cut to one slot (`looks.ts` OFFICIAL_SLOT_CANDIDATES) | only once approved |
| derived slot (`source: derived, scope: slot`) | an offline image edit (virtual try-on) of the canonical photo with the real garment | only once approved |
| view-only | everything else | listed, never drawn |

Source priority per piece and model: approved official slot > approved
derived slot > official whole look > view-only. A slot layer replaces the
whole look of that piece on that model.

## Files

| file | committed | what |
| --- | --- | --- |
| `jobs.json` | yes | the job manifest: one job per piece + model + slot. Products by handle and image index only, never prices, variants or availability |
| `approvals.json` | yes | the review record, append-only: decision, the candidate's sha256, reasons, notes, time |
| `built.json` | yes (once something is approved) | per approved job: the candidate hash and the hash of the layer built from it, so a machine without the candidate keeps exactly that layer |
| `../candidates/` | README only | the inbox for returned images |
| `.cache/stylist/tryon/` | no | packs (`outbox/`), imported candidates + checks (`candidates/`), review sheets + `review/index.html` |

## Workflow

```
npm run stylist-tryon -- plan        # (re)build jobs.json from the live catalogue
npm run stylist-tryon -- validate    # every job still resolves (slot, model, images, prompt)
npm run stylist-tryon -- export --next 10   # packs for pending derived jobs
#   … generate OUTSIDE this repo with an image-editing / try-on capability …
#   save each result as scripts/stylist/candidates/<job id>.png
npm run stylist-tryon -- import      # validate + check → needs-review
npm run stylist-tryon -- official    # align the official photos (official jobs) → needs-review
npm run stylist-tryon -- sheet       # review sheets + index.html
npm run stylist-tryon -- approve <id> --notes "what you checked"
npm run stylist-tryon -- reject <id> --reasons print,logo --notes "why"
npm run build-stylist                # approved candidates only → public/ + registry
npm run stylist-tryon -- status      # pending / generated / needs-review / approved / rejected
```

Behind the proxy, run node with `NODE_USE_ENV_PROXY=1` (plan, export,
official and sheet read official product photos from the CDN, cached).

### Status (derived from files, never stored)

- **pending**: nothing returned yet.
- **generated**: a file waits in the inbox, not imported (or refused: the
  import prints why).
- **needs-review**: imported and validated; no decision on this exact
  candidate.
- **approved / rejected**: the latest decision on exactly this candidate. A
  re-generated file is a new candidate and needs review again.

### Import validation

A returned file is refused, and left in the inbox, unless: its name is a
derived job's id; that job still matches the catalogue (the handle exists,
the classifier still files it under the job's slot, it is listed for the
job's model); an optional `<id>.json` beside it names the same job; it is a
2:3 frame of at least 600 × 900. Accepted files are normalised to the
600 × 900 stage frame and checked against the canonical photo:

- hard: the canonical head is found where it is in the canonical photo
  (same person, same framing). A failure cannot be approved.
- flagged on the sheet: how much the head, the room, and the zone the job
  must not touch (the legs for a top / layer, the chest for a bottom) changed.

### Review

Each sheet shows: canonical photo | official product photo(s) | candidate |
extracted slot layer | the layer in DRESSUP.EXE (room, the other canonical
slot, the layer, the canonical head), with the product, model, slot, method,
candidate hash, checks, extraction result and the two commands. Check:
identity, face, hair, pose, hands, body; print, logo, text, colour, garment
geometry, zipper / pockets; that nothing else changed; background;
artefacts; how it composites.

`approve` refuses unless: notes are given, the candidate passed the hard
checks, its sheet (of this very candidate) was made, and its slot layer can
be extracted. `reject` needs reasons from: identity, face, hair, pose, hands,
body, print, logo, text, color, geometry, zipper-pockets, non-target,
background, artifacts, compositing, other.

### Ingestion (`npm run build-stylist`)

Per job in the manifest: stale jobs (product gone, re-filed under another
slot or model) are reported and skipped; only a latest decision of
`approved` on exactly the candidate on disk, or, with no candidate on this
machine, on exactly the candidate the committed layer was built from (layer
file unchanged), is ingested. The layer is cut from the candidate by the
same slot split as the canonical photo (`scripts/lib/stylist-slots.mjs`):
a top / layer keeps its upper body with arms and hands (a layer also its open
front, where a chosen top shows); a bottom keeps the trousers, continued up
under the hem. Files go to `public/iys/stylist/slot/<model>/<handle>.webp`;
a model with at least one slot layer also gets its canonical room / upper /
lower layers. Unused layers are deleted. A piece whose layer is missing is
view-only.

## Canonical decomposition (infrastructure for approved candidates)

Not a substitute for generation: it only prepares the canonical photo so an
approved candidate's slot can be cut and recombined (`canonical()` in
`scripts/lib/tryon-pipeline.mjs`, `scripts/lib/stylist-slots.mjs`).

- **base**: the 600 × 900 crop of the supplied studio photo, untouched.
- **head + hair**: cut from the same photo, always drawn last, so the face never changes (a generated face is never shown).
- **room plate**: the photo with the body below the chin removed, each row filled from the room beside it.
- **upper**: garment + arms + hands below the chin. **lower**: the trousers, holes under the resting hands filled from below, continued up under the hem so a top never leaves a gap.
- **hands**: hand-measured boxes keep resting hands with the upper body (they belong to the arm, drawn over any bottom).
- **outline**: a hand-measured polygon keeps the props beside the legs out of the body. A derived candidate's body may leave it wherever the edit changed the photo (a wider garment).
- **outerwear occlusion**: a layer is a whole upper body with its own arms; the chosen top shows only through the layer's open front (`inner` mask, clipped at runtime); under a closed layer the top is worn but hidden (the UI says so).
- **known limit**: the trousers' continuation under the hem is synthesised (a repeat of the visible fabric). A top ending above the canonical hem uncovers it, so extraction measures it and the sheet flags it (`WAIST_FLAG`); the reviewer judges the waist in the DRESSUP.EXE panel.

Recomposing room + lower + upper + head reproduces the canonical photo to
within about 0.5 % of pixels (≥ 24 levels off, at the cut edges).

## Prompts

`src/features/dressup/tryon.ts` `promptFor(slot, title, model)` (version
`PROMPT_VERSION`), one strict template per slot (TOP, OUTERWEAR, BOTTOM,
FULL LOOK): keep this exact person, pose, hands, the other garments, the
shoes, room, light and camera; change only the target garment; reproduce the
real garment exactly (colour, print, logo, typography, embroidery, zipper,
pockets, silhouette); no beautification, no new pose, no editorial image. A
piece sold in several colours targets ONE colourway (`color` in the job, the
references are that colourway's images only, the prompt names it).

The prompt is stored in each job; a template change bumps the version and `validate` asks for a
re-plan.

## The first batch

`plan` resolves `tryon.ts` PLAN against the catalogue: per model and bucket,
best-referenced first (a clean front packshot, then available pieces, then
catalogue order; the model's own range first for the women's tops and
bottoms), at most 2 colourways of one product line and a few of one product
type, never a piece with an official job or the one the canonical photo
shows. MEN: hoodies 10, tees 10, crewnecks 6, layers 6, bottoms 10. WOMEN:
hoodies / crewnecks 10, tops 10, layers 6, bottoms 10. Plus the 24 official
slot candidates.

## What is missing

Generation. This environment has no GPU, no image-editing service and no
credentials for one, and cannot download model weights. The pipeline is
generator-agnostic: any multi-image instruction editor (input 1 the
canonical frame, inputs 2+ the garment photos, the job's prompt) run by a
person outside the repo is enough; its outputs come back through `import`
and the review gate like any other candidate.
