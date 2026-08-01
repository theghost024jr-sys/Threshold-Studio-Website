# Excel Scan Report

Generated: 2026-07-31

## Scope

- Website workspace scan for spreadsheet files (`.xlsx`, `.xlsm`, `.xls`, `.csv`)
- External threshold folders scan under `C:\Threshold`
- OpenXML structural inspection for discovered `.xlsx` and `.xlsm` files

## Findings Summary

- Spreadsheet files found in website workspace: 0
- Spreadsheet files found under `C:\Threshold`: 3

### 1) Book1.xlsx

- Sheets: 6
- Formula-heavy: No (0 formulas across sheets)
- Nature: Conceptual mapping and system framing
- High-value for website JSON export:
  - `Cognitive State Transition` (state mapping table)
  - `Workflow Logic` (trigger/condition/action mapping)
  - `Cross-Domain Mapping` (domain translation matrix)

### 2) Freakingout.xlsm

- Sheets: 25
- Formula-heavy: Yes (many sheets with hundreds to thousands of formulas)
- Macros: Present (`vbaProject.bin`)
- Nature: Simulation/workflow engine workbook
- High-value for website JSON export:
  - `ENGINE` (momentum, pressure, threshold flags, node type)
  - `PHYSICS` (energy/stability/phase-shift signals)
  - `INTERACTIONS` (entity pair interaction table)
  - `MAP3` (cluster/node/pressure topology)
  - `TERRITORY` (spatial/projection metadata)
  - `CLUSTERS` (emergent macro-structure summary)

### 3) test_threshold.xlsx

- Sheets: 1
- Formula-heavy: No
- Nature: Small structured test data
- Headers: `structure`, `volatility`
- Usefulness: Good seed schema for tiny proof-of-pipeline tests

## Recommended Export Targets

These are the most runtime-useful JSON products to generate from spreadsheet structures:

- `vault/export/fib-flower.json`
- `vault/export/seasonal-cycles.json`
- `vault/export/harmony-values.json`
- `vault/export/glyph-map.json`
- `vault/export/branches.json`
- `vault/export/threshold-coefficients.json`

## Runtime Mapping Targets

Copy/sync into website runtime `data/` as:

- `data/fib-flower.json`
- `data/seasonal-cycles.json`
- `data/harmony-values.json`
- `data/glyph-map.json`
- `data/branches.json`
- `data/threshold-coefficients.json`

## Notes

- `.xlsm` can be read as data safely, but macro logic is not directly executable in browser runtime.
- Prefer exporting evaluated table outputs to JSON rather than trying to port workbook internals directly.
- Keep this as source pipeline: `vault/workbooks -> vault/export JSON -> website/data -> JIT engine`.
