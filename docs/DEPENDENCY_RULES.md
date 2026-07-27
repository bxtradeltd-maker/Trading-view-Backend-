# Dependency Rules

These rules are enforced by convention and package boundaries in
Phase 2. (Automated enforcement — e.g. an ESLint boundaries plugin or
a dependency-cruiser check in CI — is a natural Phase 11 (Testing)
addition, not yet wired up here; flagged as a follow-up, not silently
skipped.)

## The rules

1. **`packages/domain` depends on nothing** except the Node standard
   library (`node:crypto` for `randomUUID`). No npm dependencies in
   its `package.json` by design. Verified in this environment: the
   domain layer type-checks cleanly in isolation.

2. **`packages/application` depends only on `packages/domain`.** Its
   `package.json` declares exactly one workspace dependency. No
   Express, no BullMQ, no pg, no Winston — ports describe *what*
   infrastructure must do, never *how*.

3. **`packages/infrastructure` implements `packages/application`
   ports and may depend on `packages/domain` types (e.g. `Trade` in
   repository signatures) plus real infrastructure libraries** (BullMQ,
   pg, winston). It must contain **zero business rules** — every
   adapter method either does pure plumbing or throws a `Phase N`
   TODO error; none contain trading/risk logic.

4. **`apps/api` (Presentation) depends on `packages/domain`,
   `packages/application`, and `packages/infrastructure`** — but only
   in `composition-root.ts`. `server.ts` and `index.ts` should ideally
   only need Application ports plus the `Container` type; the one
   exception in Phase 2 is `index.ts` importing `buildContainer`
   directly, which is expected for an entrypoint.

5. **No layer above Domain may be imported by a layer below it.**
   Domain never imports Application; Application never imports
   Infrastructure or Presentation.

## How to check this yourself

Quick manual check (no tooling required):
```bash
# Domain should show zero @trading-platform/* or node_modules imports
# other than node:crypto
grep -rn "^import" packages/domain/src

# Application should only ever import @trading-platform/domain
grep -rn "^import.*@trading-platform" packages/application/src | grep -v domain
```
The second command should return nothing — if it does, application is
importing infrastructure or itself circularly, which is a violation.
