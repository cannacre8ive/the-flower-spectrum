# Design direction

## Intent

Make the underlying visual language the centerpiece of the portfolio. The site should let a reviewer understand the concept, touch the system, and see its applications without reading a long case study first.

## Tokens

- Botanical ink: `#191c17` — base and specimen-card ground
- Paper: `#f4f0e6` — reading surfaces and type
- Sage board: `#d9d8b9` — hero specimen surface
- Field green: `#353d2c` — closing surface
- Secondary type: `#b7bbab`
- Citrus: `#d4a843` — one of ten semantic profile colors, not a general status code

The ten source profile colors and clockwise sector order are preserved in `src/engine.js`. Gas starts at twelve o’clock; each sector occupies 36 degrees. Rounded integer model scores match the supplied prototype.

## Type

Newsreader carries headlines, profile names, and specimen identities. DM Sans carries navigation, controls, labels, and descriptions. Both come from the supplied prototype’s typography rather than introducing an unrelated brand.

## Structure

Hero: an oversized identity signature paired with a physical specimen-card composition.

Story: a concise problem and rationale.

Atlas: ten compact profile choices feeding one focused detail panel.

Lab: a stable relationship between controls on the left and visual output on the right, stacked on mobile.

System: one component at a time, explained through a visual example.

Gallery: preserve the original eight pieces as an inspectable collection.

## Design review

Avoided a generic product-dashboard treatment. The key visual is the actual ten-sector identity device, not decorative charts or a stock cannabis illustration. The supplied botanical palette, serif typography, photography, and proportional strips establish continuity with the source material.

Color is redundant with labels and fixed positions. Interactive elements use visible focus; profile selectors and system tabs support arrows; native dialogs trap focus and restore it. Motion is limited to user feedback and disabled under reduced motion.

## Expanded experience, October 27, 2026

The revision makes dark mode the default and offers a persistent light preference. A ten-color strip sits beside the Newsreader wordmark, replacing the unrelated star symbol. The low-resolution photographic source cards remain unchanged in a collapsible archive at pixel-appropriate display sizes; live SVG and HTML now carry the hero, social artwork, and buyer material.

The page connects three useful workflows: explore the meaning of a spectrum sector, learn about its associated terpenes, and carry the same strain identity into D2C social content or a detailed B2B chemovar sheet. The 38-card library is searchable and draggable. Six social formats use the supplied Social Kit's structure and data, with clearer source status. Buyer sheets expose lineage, identifiers, reported chemistry, sensory architecture, complete analyte panels, and explicit gaps in commercial data.

Motion is purposeful: a single hero entrance, profile and preview transitions, and animated disclosure height. Next/previous controls supplement swipe and drag, keyboard focus remains available, and reduced-motion preferences bypass animation.
