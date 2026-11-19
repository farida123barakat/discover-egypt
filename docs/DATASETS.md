# Datasets — provenance and review policy

Every dataset follows the same rules, from the feature brief:

1. Never fabricate historical facts, sources or translations.
2. Never label synthetic or AI-assisted content as verified.
3. Keep unverified content **unpublished on the live site** until an editor approves it.
4. Every entry has: a unique ID, title, description, category, destination/region links, media references, source URLs (or an explicit "editorial" flag), verification/review status and a last-reviewed date.
5. Prefer a smaller, accurate dataset over a large, padded one.

| Dataset | File | Size | Provenance | Review status shipped |
| --- | --- | --- | --- | --- |
| Hieroglyph signs | `src/content/hieroglyphs.ts` | 57 signs | Gardiner (1957), Allen (2014); glyphs = Unicode (code points verified by official name, 57/57) | Editorial draft — awaiting Egyptologist review |
| Food regions | `src/content/food.ts` | 6 regions | Editorial intros | — |
| Regional dishes | `src/content/food.ts` | 17 dishes | 10 regional links **sourced** (URLs stored per dish); 7 national classics flagged **editorial** with no regional claim | Shown (they make no unsourced regional claims) |
| Recipes | `src/content/food.ts` | 10 recipes | AI-assisted editorial drafts of common home methods; "compare with" links where found | **Draft** — with a database, hidden until approved in Admin → Recipe review; on the front-end-only site shown with a "Draft" label |
| Original explainer films | `src/content/explainers.ts` → `public/media/*` | 3 films (4:50, 2:51, 2:53) | Scripts drafted with AI assistance from 4–8 cited sources each; debated points are stated as debated; every frame drawn from scratch (no stock footage) | **Draft** — with a database, hidden until published in Admin → Watch & discover; on the front-end-only site shown with a "Draft" label |
| Embedded videos | `src/content/media.ts` | 2 | World History Encyclopedia videos; IDs taken from WHE's own video listings; embedded from the creator's channel, never downloaded or re-uploaded | **Draft** — length and captions not yet checked, so the publish button stays locked |
| Proverbs | `src/content/proverbs.ts` | 14 | Traditional Egyptian sayings; transliteration and translation editorial | Editorial draft — awaiting native-speaker review |

## Things we investigated and did not use

- **Morris Franken "Pyramid of Unas" hieroglyph images** — licence of the underlying 1955 book photographs is unclear. See `docs/HIEROGLYPHS.md`.
- **Wikibooks Cookbook (CC BY-SA)** — a good candidate for attributed recipes; could not be fetched from this environment without approval. Importing it (with attribution and share-alike) is a sensible next step.

## Regional association ≠ restaurant availability

Dish cards say which sources link a dish to a region. They never imply that a specific restaurant serves it. No restaurant is listed until it has been verified.

## Watch & Discover

- Original films: one script (`src/content/explainers.ts`) produces the picture, the WebVTT captions, the chapter track and the on-page transcript, so they cannot drift apart. Re-render with `npx tsx scripts/render-explainers.ts` (needs ffmpeg and Chrome; `--preview` for stills, `--stills` for posters and captions only). The films have no narration — captions carry the story and are on by default.
- Embeds: admins add YouTube videos by id. Publishing is blocked until the item has a length (5–15 minutes for embeds), at least one source, a destination and a note on captions. Nothing loads from YouTube until the visitor presses play (`youtube-nocookie.com`, `cc_load_policy=1`).
- Only paste a transcript for an embed if you have the right to publish it (for example, the creator's own).
- The publicly readable record never stores an admin's email; the reviewer is recorded as "Discover Egypt editor".
