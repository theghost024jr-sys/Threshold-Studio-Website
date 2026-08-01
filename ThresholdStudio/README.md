# Threshold Studio Website

This folder is the canonical publishable structure for Threshold Studio.

## Architecture Topology

Threshold uses two connected workspaces:

- Workspace A: Threshold Studio Website (runtime world)
	- Routes, scripts, styles, JIT engine, navigation, Hub, logo.
- Workspace B: theghost or Threshold vault (knowledge substrate)
	- Lore, notes, diagrams, mythology, source JSON and world logic.

These workspaces stay separate.
The website imports only runtime-ready outputs such as:

- data/vault-archive.json
- data/vault-index.json
- selected mirrored assets in assets/vault/

Do not move the full vault into this website workspace.
Use scripts/import-threshold-vault.ps1 to pull and compile only what runtime needs.

Optional: set THRESHOLD_VAULT_ROOT to point at the external vault root before running importer.

## Vault Export Pipeline

Expected external vault structure:

- vault/export/vault-archive.json
- vault/export/vault-dialogues.json
- vault/export/vault-mythic.json
- vault/export/vault-glyphs.json
- vault/export/vault-branches.json
- vault/export/logo.svg (optional) or vault/export/threshold-logo.svg

Runtime data targets in this workspace:

- data/vault-archive.json
- data/vault-dialogues.json
- data/vault-mythic.json
- data/vault-glyphs.json
- data/vault-branches.json
- assets/logo/threshold-logo.svg

Sync command:

- node scripts/sync-vault.js C:\Threshold\threshold\ThresholdVault

Or use VS Code task:

- Threshold: Sync Vault Exports

## Pages

- index.html
- ethos.html
- glyphs.html
- learningwheel.html
- ledger.html
- dialogues.html
- mythology.html
- housegarden.html
- invitation.html
- contact.html

## Directories

- styles/
- scripts/
- assets/
- data/

## Notes

- styles/styles.css is the shared stylesheet.
- scripts/glyphs.js controls glyph modal behavior.
- scripts/wheel.js is the learning wheel script hook.
- assets/sketches/jewelery contains imported source artwork files.
