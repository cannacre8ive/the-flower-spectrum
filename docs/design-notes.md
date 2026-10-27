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
