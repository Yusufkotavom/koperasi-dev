# Orchestrator Run Log Template

Template standar untuk pencatatan setiap eksekusi orchestrator.

## Header

- Run ID: `RUN-YYYYMMDD-HHMM-XX`
- Date (UTC): `YYYY-MM-DD`
- Start Time (UTC): `HH:MM`
- End Time (UTC): `HH:MM`
- Orchestrator/Branch: `...`
- Operator: `...`
- Environment: `local | staging | production`

## Scope

- Objective: `...`
- Included Workstreams: `...`
- Excluded Workstreams: `...`
- Related Ticket/Issue/PR: `...`

## Pre-Run Checks

- Dependency sync status: `PASS/FAIL`
- Config/env validation: `PASS/FAIL`
- Data prerequisite check: `PASS/FAIL`
- Risk notes: `...`

## Execution Steps

1. Step: `...`
   - Start-End (UTC): `...`
   - Output summary: `...`
   - Status: `PASS/FAIL/BLOCKED`
2. Step: `...`
   - Start-End (UTC): `...`
   - Output summary: `...`
   - Status: `PASS/FAIL/BLOCKED`

## Testing Evidence (Required for Completion Claims)

- Test Matrix:
  - Unit: `PASS/FAIL/NA`
  - Integration: `PASS/FAIL/NA`
  - Smoke/E2E: `PASS/FAIL/NA`
- Commands Executed:
  - ``
  - ``
- Raw Output Location:
  - `path/to/log-1.txt`
  - `path/to/log-2.txt`
- Artifacts:
  - Screenshot/Video: `...`
  - Report file: `...`
  - Build output reference: `...`
- Defects Found:
  - ID: `...`, Severity: `...`, Status: `...`, Link: `...`
- Defects Resolved in Run:
  - ID: `...`, Verification command: `...`, Evidence: `...`

## Post-Run Validation

- Data integrity check: `PASS/FAIL`
- Regression spot check: `PASS/FAIL`
- Rollback readiness: `READY/NOT READY`
- Follow-up actions: `...`

## Completion Gate

- Any Phase checklist item marked `[x]` in plan/progress docs? `YES/NO`
- If `YES`, list item IDs and supporting evidence links:
  - `P1.x -> evidence link/path`
- Reviewer sign-off:
  - Reviewer: `...`
  - Decision: `APPROVE/REJECT`
  - Timestamp (UTC): `...`
  - Notes: `...`
