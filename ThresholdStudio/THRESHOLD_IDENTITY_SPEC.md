# Threshold Identity Spec

## Studio Frame

The Studio Frame is the shared system that persists across all pages.

- Navigation bar
- Footer
- Base typography
- Base spacing
- Shared border radius
- Shared hover language
- Shared motion rhythm
- Shared root palette

## Room Personality

Each page gets a local identity layer drawn from Threshold lore and physics.

### Home
- Open, grounded, hub-oriented
- Gentle neutral gradients
- Soft orbit and drift language

### Ethos
- Minimal, declarative, serif-leaning
- Quiet contrast, restrained motion

### Glyphs
- Geometric, angular, symbol-driven
- Flicker, snap, and edge emphasis

### Learning Wheel
- Circular motifs and concentric rhythm
- Gradient arcs, rotation, pulse

### Ledger
- Monospaced, structured, data-driven
- Grid, tick, and record-like spacing

### Dialogues
- Soft, poetic, layered, breathing
- Faded depth, slow reveal, reflective motion

### Mythology
- Deep color, texture, story fragments
- Dense surfaces, mythic shadow, ritual weight

### House & Garden
- Organic shapes, soil tones, growth
- Drift, sprout, and living field motifs

### Invitation
- Open space, light, gentle gradients
- Airy spacing, quiet threshold entry

### Thank You
- Closure, stillness, receding motion
- Soft exit language

## Overlap Zones

Every room shares:

- The same root palette
- The same border language
- The same typographic rhythm
- The same hover behavior
- The same subtle motion grammar

Each room can reinterpret those rules through a different motif, palette subset, and motion accent.

## Implementation Notes

- Use a page class on the `<body>` element for every room.
- Use CSS custom properties for room palette tokens.
- Use body-level overlays or background layers for room motifs.
- Keep the Studio Frame stable; only vary room-level accents.