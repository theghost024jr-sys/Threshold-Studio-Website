# Excel to Runtime Export Map

Generated: 2026-07-31

## Source Priority

1. Primary workbook: Stability Engine v0.xlsx
2. Fallback workbook: Stability Engine v0.xlsm
3. Minimal mirror: StabilityEngine_v0_minimal.xlsx
4. Secondary mapping workbook: Book 1.xlsx

Use one workbook family per export run to avoid mixed snapshots.

## Runtime Targets

This map defines concrete exports into website runtime targets:

- data/vault-dialogues.json
- data/vault-mythic.json
- data/vault-glyphs.json
- data/vault-branches.json

## Target 1: data/vault-dialogues.json

Purpose: Seasonal dialogue layer and root-machine voice routing.

Source sheets:

- Book 1.xlsx :: Dials
- Book 1.xlsx :: Engine
- Stability Engine v0.xlsx :: ENGINE
- Stability Engine v0.xlsx :: AUDIT

Source columns:

- Dials: Date, W_Bias, W_Momentum, W_Acceleration, W_Bias_Mean, W_Momentum_Mean, W_Accel_Mean, W_Bias_Slope
- Engine: SpotClose, WeeklyCallWall, WeeklyPutWall, MonthlyCallWall, MonthlyPutWall
- Stability ENGINE: Ticker, State, MomentumScore, PressureScore, ThresholdFlag, NodeType
- Stability AUDIT: invariant checks and enforcement flags

Transform rules:

- season selector:
  - fog: momentum low and pressure low
  - shimmer: momentum rising and positive bias slope
  - storm: pressure high or threshold flag active
  - soil: low volatility and stabilized state
- dialogue voice source:
  - season text from derived season profile
  - rootMachine text from NodeType + ThresholdFlag
  - legacy text from state transition severity (from AUDIT/ENGINE)

Output schema:

- season.fog|shimmer|storm|soil|threshold
- legacy.fog|shimmer|storm|soil|threshold
- rootMachine.fog|shimmer|storm|soil|threshold
- voice.fog|shimmer|storm|soil|threshold
- meta.generatedAt, meta.sourceWorkbook, meta.rowCount

## Target 2: data/vault-mythic.json

Purpose: Spirit and legacy character mapping by state and interaction outcome.

Source sheets:

- Stability Engine v0.xlsx :: INTERACTIONS
- Stability Engine v0.xlsx :: PHYSICS
- Stability Engine v0.xlsx :: CLUSTERS

Source columns:

- INTERACTIONS: EntityA, EntityB, InteractionType, ResultState, StabilityImpact, RoleA, RoleB, InteractionBias
- PHYSICS: Entity, State, Energy, Stability, DecayFlag, PhaseShiftChance, Role
- CLUSTERS: cluster labels, stability indexes, type

Transform rules:

- map state classes to seasonal buckets:
  - fog: low-energy transitions, exploratory interactions
  - shimmer: high-coherence interactions, growth states
  - storm: decay/pressure or unstable interactions
  - soil: recovery/stable/anchored outcomes
- spirit labels chosen by dominant cluster role per season bucket
- legacy labels chosen by interaction narrative type per season bucket

Output schema:

- spirit.fog|shimmer|storm|soil|threshold
- legacy.fog|shimmer|storm|soil|threshold
- meta.generatedAt, meta.sourceWorkbook, meta.interactionRows

## Target 3: data/vault-glyphs.json

Purpose: Glyph lookup by chamber, node type, and seasonal state.

Source sheets:

- Stability Engine v0.xlsx :: MAP3
- Stability Engine v0.xlsx :: TERRITORY
- Stability Engine v0.xlsx :: MAP2

Source columns:

- MAP3: Node, NodeType, ConnectsTo, Status, ClusterAffinity, ClusterInertia, Cluster, ClusterMass, ClusterEnergy, ClusterPressure, ClusterType, ClusterStabilityIndex, AssignedCluster
- TERRITORY: spatial projection fields for clusters and nodes
- MAP2: Node, NodeType, ConnectsTo, Status

Transform rules:

- glyph id = normalized Node or NodeType
- season assignment inferred from ClusterPressure and ClusterStabilityIndex
- chamber assignment inferred from ClusterType and Status
- include links for connected glyph navigation from ConnectsTo

Output schema:

- glyphs[]:
  - id
  - node
  - nodeType
  - chamber
  - season
  - status
  - connectsTo[]
  - pressure
  - stabilityIndex
  - coordinates (if available from TERRITORY)
- meta.generatedAt, meta.sourceWorkbook, meta.glyphCount

## Target 4: data/vault-branches.json

Purpose: Branch graph and route metadata for JIT branch resolution.

Source sheets:

- Stability Engine v0.xlsx :: MAP3
- Stability Engine v0.xlsx :: MAP2
- Stability Engine v0.xlsx :: MAP_OLD
- Stability Engine v0.xlsx :: TERRITORY

Source columns:

- MAP3/MAP2/MAP_OLD: Node, NodeType, ConnectsTo, Status
- MAP3: Cluster, ClusterType, ClusterPressure, ClusterStabilityIndex
- TERRITORY: spatial zone and cluster projection fields

Transform rules:

- each Node becomes a branch node
- ConnectsTo values become directed edges
- branch condition generated from Status + ClusterPressure bands
- route chamber inferred from NodeType and ClusterType

Output schema:

- branches.nodes[]:
  - id
  - nodeType
  - status
  - chamber
  - cluster
  - pressureBand
  - stabilityBand
- branches.edges[]:
  - from
  - to
  - condition
  - weight
- meta.generatedAt, meta.sourceWorkbook, meta.nodeCount, meta.edgeCount

## Export Order

1. Export and validate vault-branches.json
2. Export and validate vault-glyphs.json
3. Export and validate vault-mythic.json
4. Export and validate vault-dialogues.json

This order ensures graph and node context exists before voice-layer derivations.
