# Phase 1 Membership Schema Design

## Objective

Define a membership lifecycle model with explicit states (`candidate`, `active`, `inactive`, `exit`), complete status-change auditability, and a migration path that is compatible with the current Prisma schema (`Nasabah`, `StatusNasabah`, and existing `AuditLog`).

## Current State (As-Is)

From `dashboard/prisma/schema.prisma`:

- Membership master data is represented by `Nasabah`.
- `Nasabah.status` uses enum `StatusNasabah` with values:
  - `AKTIF`
  - `NON_AKTIF`
  - `KELUAR`
- There is no first-class `candidate` state in the current enum.
- Generic audit table `AuditLog` exists, with `beforeData`, `afterData`, and `metadata` JSON fields.
- Multi-tenant scope is at `companyId` level.

Implication:

- Existing production behavior for member activation/deactivation/exit must remain valid.
- Any design must avoid disruptive enum replacement in Phase 1.

## Target Lifecycle Model (To-Be)

### Canonical Lifecycle States

- `CANDIDATE`: Prospect / onboarding in progress, not yet an active member.
- `ACTIVE`: Fully registered and operational member.
- `INACTIVE`: Temporarily not active (e.g., administrative hold, dormancy).
- `EXIT`: Membership ended permanently.

### Transition Rules

Allowed transitions:

- `CANDIDATE -> ACTIVE`
- `CANDIDATE -> EXIT`
- `ACTIVE -> INACTIVE`
- `INACTIVE -> ACTIVE`
- `ACTIVE -> EXIT`
- `INACTIVE -> EXIT`

Disallowed transitions:

- `EXIT -> *` (terminal state)
- direct `CANDIDATE -> INACTIVE` (unless explicitly required later)

### Invariants

- Every transition must be captured in a dedicated lifecycle audit row.
- State changes are idempotent at API/service layer (no-op if same state requested).
- `EXIT` requires reason code.
- `companyId` scope must be preserved for all lifecycle data.

## Backward-Compatible Schema Strategy

Phase 1 uses additive schema changes only, keeping existing `StatusNasabah` untouched.

### 1) Add canonical lifecycle columns to `Nasabah`

Add fields (Prisma-level proposal):

- `membershipState String @default("ACTIVE")`
- `membershipStateSince DateTime @default(now())`
- `membershipExitedAt DateTime?`
- `membershipExitReason String?`

Notes:

- Keep type as `String` for Phase 1 to avoid enum migration risk and simplify rollback.
- Values constrained in application/service layer to `CANDIDATE|ACTIVE|INACTIVE|EXIT`.
- Existing `status` (`StatusNasabah`) remains source of truth for legacy flows during migration.

### 2) Add dedicated status history table

Create model `MembershipStatusHistory`:

- `id String @id @default(cuid())`
- `nasabahId String`
- `companyId String`
- `fromState String?`
- `toState String`
- `transitionAt DateTime @default(now())`
- `reasonCode String?`
- `reasonText String?`
- `changedById String?`
- `source String @default("SYSTEM")` (e.g., `SYSTEM`, `BACKFILL`, `API`, `BATCH`)
- `requestId String?`
- `metadata Json?`
- `createdAt DateTime @default(now())`

Indexes:

- `@@index([companyId, nasabahId, transitionAt])`
- `@@index([toState, transitionAt])`
- `@@index([changedById, transitionAt])`

Relations:

- FK `nasabahId -> Nasabah.id` with `onDelete: Cascade`.
- FK `changedById -> User.id` nullable.
- FK `companyId -> Company.id` with `onDelete: Cascade`.

### 3) Compatibility mapping between old and new status

During transition period:

- Legacy `status=AKTIF` maps to canonical `ACTIVE`
- Legacy `status=NON_AKTIF` maps to canonical `INACTIVE`
- Legacy `status=KELUAR` maps to canonical `EXIT`
- `CANDIDATE` exists only in `membershipState` (not representable in current `StatusNasabah`)

Write strategy (temporary dual-write):

- Membership service writes `membershipState` + history table.
- For canonical values representable in old enum, also write `status` for backward compatibility.
- For `CANDIDATE`, keep `status` at safe legacy value by policy:
  - Option A (recommended): set `status=NON_AKTIF` until activation.
  - Ensure all legacy consumers are updated not to treat every `NON_AKTIF` as historically equivalent.

## Audit Trail Design

### Dedicated lifecycle audit (primary)

`MembershipStatusHistory` is the source of truth for status transitions:

- Immutable append-only records.
- Captures actor, reason, source, and request correlation.
- Supports timeline reconstruction and compliance review.

### Integration with generic `AuditLog` (secondary)

Keep using existing `AuditLog` for broad entity-change tracing:

- On status changes, add `AuditLog` row with:
  - `entityType = "NASABAH"`
  - `entityId = nasabahId`
  - `action = UPDATE`
  - `beforeData` / `afterData` include legacy `status` + canonical `membershipState`
  - `metadata` includes `reasonCode`, `requestId`, and `source`

Rationale:

- Avoid overloading `AuditLog` as lifecycle source.
- Preserve existing observability and admin tooling compatibility.

## Migration Strategy

## Phase 1A: Schema Expand

1. Add columns to `nasabah` table:
   - `membership_state` (default `ACTIVE`)
   - `membership_state_since` (default `now()`)
   - `membership_exited_at` nullable
   - `membership_exit_reason` nullable
2. Create `membership_status_history` table.
3. Add required indexes and foreign keys.

No existing column removal or enum mutation.

## Phase 1B: Backfill

Backfill canonical state from existing `status`:

- `AKTIF -> ACTIVE`
- `NON_AKTIF -> INACTIVE`
- `KELUAR -> EXIT`

For each existing `nasabah`, insert one synthetic history row:

- `fromState = null`
- `toState = mapped state`
- `source = BACKFILL`
- `reasonCode = "INITIAL_MIGRATION"`

If mapped to `EXIT`:

- set `membership_exited_at` to best available timestamp:
  - prefer domain-specific exit date if available later,
  - otherwise fallback to `updatedAt` at migration time.

## Phase 1C: Application Dual-Write

Update membership mutation paths:

- New service API enforces transition rules.
- On transition:
  - insert `MembershipStatusHistory`
  - update `nasabah.membershipState*` fields
  - update `nasabah.status` when representable
  - insert generic `AuditLog`

All writes in single DB transaction.

## Phase 1D: Read Path Migration

Gradually move readers from `Nasabah.status` to `Nasabah.membershipState`:

- Admin list/filter
- Detail page timeline
- Reporting pipelines
- Eligibility logic (loan/savings operations)

Add temporary parity checks in logs/metrics to detect divergence.

## Phase 1E: Contract Tightening (Future)

After full cutover:

- Optional: migrate `membershipState` from `String` to enum.
- Optional: deprecate direct business reads on legacy `status`.
- Keep legacy `status` field until downstream dependencies are fully retired.

## Rollout Plan

1. Deploy schema migration (expand only).
2. Run backfill job in controlled batches per `companyId`.
3. Enable dual-write behind feature flag (`membership_lifecycle_dual_write`).
4. Enable read-from-canonical behind feature flag (`membership_lifecycle_read_canonical`) per module.
5. Observe metrics for 1-2 full business cycles:
   - transition write failures
   - canonical vs legacy mismatch count
   - missing history rows
6. Promote canonical read to default.
7. Keep dual-write enabled until rollback window closes.

### Operational Safeguards

- Batch backfill with checkpointing (`last_processed_id` per company).
- Re-runnable backfill using idempotency key (`nasabahId + INITIAL_MIGRATION`).
- Alert when status update happens without corresponding history insert.

## Rollback Plan

Rollback objective: return application behavior to legacy `Nasabah.status` without data loss.

1. Disable `membership_lifecycle_read_canonical` flag.
2. Disable `membership_lifecycle_dual_write` flag.
3. Revert service to legacy write path (`status` only).
4. Keep new schema objects in place (do not drop during emergency rollback).
5. If needed, run repair script to sync `status` from latest canonical state for impacted rows:
   - `ACTIVE -> AKTIF`
   - `INACTIVE -> NON_AKTIF`
   - `EXIT -> KELUAR`
   - `CANDIDATE -> NON_AKTIF` (compatibility fallback)
6. Keep `membership_status_history` for forensic analysis.

Why non-destructive rollback:

- Dropping columns/tables during incident increases risk.
- Preserving additive schema enables fast roll-forward after fix.

## Testing Strategy

### 1) Migration Tests

- Apply migration on fresh DB and verify table/column/index creation.
- Apply migration on realistic snapshot and verify no enum breakage.
- Verify backfill populates all rows exactly once.
- Verify rollback script (feature flags + sync script) on staging dataset.

### 2) Service Unit Tests

- Transition matrix validation:
  - allow only configured transitions
  - reject invalid transitions with deterministic errors
- Idempotency:
  - same-state transition request does not duplicate history
- Exit behavior:
  - requires `reasonCode`
  - sets `membershipExitedAt`

### 3) Transactional Integrity Tests

For each valid transition, assert in one transaction:

- `Nasabah.membershipState` updated
- legacy `status` updated when representable
- `MembershipStatusHistory` inserted exactly once
- `AuditLog` inserted with expected metadata

Inject failures mid-transaction to confirm atomic rollback.

### 4) Integration/API Tests

- Endpoints for create candidate, activate, deactivate, exit.
- Authorization checks by role and `companyId` tenant boundary.
- Read APIs return canonical state and history timeline consistently.

### 5) Data Quality & Observability Tests

- Reconciliation query: latest history `toState` must equal `nasabah.membershipState`.
- Reconciliation query: canonical-to-legacy mapping parity for representable states.
- Dashboard/alerts for:
  - transitions without history
  - history without actor/source context
  - cross-tenant anomalies

## Prisma Compatibility Notes

- Existing enum `StatusNasabah` remains unchanged in Phase 1.
- Existing `AuditLog` is reused, not replaced.
- New lifecycle design is additive and does not break existing relational constraints.
- Multi-tenant integrity preserved by including `companyId` in history model and indexes.

## Proposed Deliverables

- Prisma migration for schema expand (`membership_state` columns + history table).
- Backfill script with idempotent checkpoints.
- Membership lifecycle service (transition validator + transactional writer).
- Feature flags for dual-write and canonical read.
- Reconciliation SQL and monitoring panel.

## Open Decisions

- Final policy for legacy `status` value while in `CANDIDATE` (`NON_AKTIF` recommended for now).
- Standardized `reasonCode` taxonomy for transitions.
- Whether to promote `membershipState` to enum in Phase 2 after full cutover.
