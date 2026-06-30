# CLAUDE.md

## Project Overview

**inventory-manager** is a unified inventory, point-of-sale (POS), and staff-rota
platform for retail and hospitality businesses (shops, cafés, restaurants, pubs).
Its defining idea is an abstraction: **stock and staff hours are the same kind of
budgeted resource.** Both are controllable costs that must be tracked against a
budget that cannot be exceeded, and together they form *prime cost* (COGS % +
labour %), the industry's core operating metric.

The system is multi-tenant: a single physical **Site** can run several
**Department** types at once (e.g. a garden centre with a café inside), each with
its own catalog, POS configuration, rota, and labels.

The project is **greenfield** — only repository scaffolding exists so far. The
design is settled; implementation is driven by an M0–M14 roadmap.

## Architecture

A polyglot system, modular monolith at the core:

| Component | Language / Stack | Responsibility |
|---|---|---|
| `backend` | Java 21 / Spring Boot 3.x | Org hierarchy, inventory, labour/rota, the resource ledger, POS, labels, reporting |
| `till-client` | TypeScript (PWA) | Offline-first POS terminal; service workers + IndexedDB for a local sale log |
| `sync-gateway` *(planned, M12)* | Go | Reconciles offline sale-event streams from terminals into the central ledger |

**Datastore:** PostgreSQL; schema managed by Flyway (or Liquibase) migrations, wired in from M0.

### The core abstraction: the resource ledger

Rather than separate "Inventory" and "Rota" domains, both sit on one concept:

```
BudgetedResource   — id, site, department, period, budget_limit, unit_cost
  ├─ StockResource   — sku, quantity_on_hand, reorder_point, supplier
  └─ LabourResource  — role, hourly_rate, hours_scheduled, hours_worked
```

Both produce entries into a shared, append-only **ResourceLedger**: a sale
consumes stock and writes a ledger entry; a completed shift consumes budgeted
hours and writes a ledger entry. Reporting sums ledger entries by
type/department/period against `budget_limit` and flags overspend. This is
double-entry bookkeeping applied to operational resources rather than money —
budgeting/alerting/reporting code is written once, not twice.

### Org hierarchy (the "garden centre with a café" problem)

```
Organisation
  └─ Site (physical location)
       └─ Department (Retail, Café, Garden, …)
            ├─ Catalog        (products/SKUs scoped to this department)
            ├─ POS config     (terminal, till layout, payment methods)
            ├─ Rota           (roles, shifts, staff assigned to this department)
            └─ Label templates
```

Shared stock across departments (e.g. compost sold in both Garden and the shop
corner) is modelled by linking one `StockItem` to multiple department
`CatalogEntry` records via a join table — not duplicated inventory records.

## Repo Structure

> The tree below is the **intended** layout. Concrete classes do not exist yet;
> M0 scaffolds `backend/` and `till-client/`.

```
inventory-manager/
├── backend/
│   └── src/main/java/dev/jamieramsell/inventory/
│       ├── org/         (Organisation, Site, Department)
│       ├── catalog/     (CatalogEntry — sellable items scoped to a department)
│       ├── stock/       (StockItem, stock receipts, suppliers)
│       ├── pos/         (Sales, terminals, sale → stock-decrement flow)
│       ├── ledger/      (BudgetedResource, ResourceLedger — prime-cost core)
│       ├── rota/        (Roles, shifts, labour as a budgeted resource)
│       ├── labels/      (Label templates, rendering pipeline)
│       └── reporting/   (Prime-cost / budget reporting, alerting)
├── till-client/         (TypeScript PWA — offline-first till)
├── sync-gateway/        (planned — Go service reconciling offline sale streams)
└── docs/                (design notes, API spec, ADRs)
```

## Running the Services

> Nothing runs yet — these are the intended commands once M0 scaffolds the modules.

### backend (Java / Maven)
```bash
cd backend
./mvnw spring-boot:run        # run the service
./mvnw test                   # run tests
./mvnw verify                 # compile, test, and run Checkstyle (Google Java Style)
```

### till-client (TypeScript)
```bash
cd till-client
npm install
npm run dev                   # local dev server
```

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.). Breaking changes are marked using `<type>!:` (e.g. `fix!:`)
- **Versioning**: Semantic Versioning — see `CHANGELOG.md`
- **Branching**: milestone-based model — `<milestone>/<label>/<name>` → `stable-<milestone>` → `main`. Open an issue before PRing.
- **Java base package**: `dev.jamieramsell.inventory` *(provisional — confirm at M0)*

## Code Style

Every language in this repo follows **its own Google Style Guide**, enforced in CI.
A rule shared across all three: interfaces/types are **never** `I`-prefixed (each
Google guide forbids it).

### Java (`backend`)

- **Interfaces / classes**: PascalCase (standard Java)
- **Methods / variables**: camelCase (standard Java)
- **Persistence**: PostgreSQL via Spring Data JPA repositories; schema managed by Flyway (or Liquibase) migrations. No mutable balances are persisted — ledger positions are always *derived* by summing ledger lines
- **Package layout**: one package per bounded context (`org`, `catalog`, `stock`, `pos`, `ledger`, `rota`, `labels`, `reporting`); boundaries enforced by package structure so a future service split is mechanical
- **MVC layering**: `Controller` → `Service` → `Repository`; keep business logic out of controllers
- **Tests**: JUnit 5 via Spring Boot Test; one test class per service class (e.g. `ResourceLedgerServiceTest` for `ResourceLedgerService`)
- **Style enforcement**: the project follows the [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html) **wholesale**, enforced by the `maven-checkstyle-plugin` (`google_checks.xml`) during `mvn verify`. There are **no project-specific suppressions** — in particular, no `I`-prefix for interfaces (use plain names, e.g. `Repository`, not `IRepository`)
- **Javadoc presence**: `google_checks` requires Javadoc on every public/protected **type** (`MissingJavadocType`), and on public methods/constructors **except** trivial ones (body < 2 lines) and those annotated `@Override`/`@Test` (`MissingJavadocMethod`). A public class with no Javadoc fails the build
- **Javadoc references**: javadoc `doclint` (`all,-missing` + `failOnWarnings`) validates that `{@link}` / `@see` / `@param` / `@throws` references **resolve** and tags are well-formed — a broken reference fails the build. doclint's own `missing` group is left off on purpose, so *presence* is owned solely by Checkstyle's (GJSG-faithful, more lenient) rules rather than doclint's stricter all-or-nothing

### TypeScript (`till-client`)

- **Style**: follows the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html), enforced by [`gts`](https://github.com/google/gts) — Google's toolchain bundling Prettier formatting, an ESLint config, and a base `tsconfig`. Run `npm run check` / `npm run fix`; CI fails on any lint or format violation
- **No `I`-prefix on interfaces** (Google TS style forbids it too — e.g. `Repository`, not `IRepository`), consistent with Java and Go
- **Offline-first**: service workers for offline operation; IndexedDB for the local write-ahead sale log
- `gts` and the build pipeline are wired up in the M0 scaffolding of `till-client/`

### Go (`sync-gateway`) *(planned, M12)*

- **Style**: follows the [Google Go Style Guide](https://google.github.io/styleguide/go/) (Style Guide → Style Decisions → Best Practices), on top of the Go idioms below. It's enforced by `gofmt` + `go vet` + `staticcheck`; since much of the guide is prose guidance, those tools approximate it rather than fully encode it
- **Formatting**: `gofmt` is canonical and non-negotiable — format with `gofmt`/`goimports`; CI fails on any unformatted file (`gofmt -l .` must print nothing). The formatter decides; no style bikeshedding
- **Vet / lint**: `go vet ./...` must be clean; `staticcheck` (or `golangci-lint`) runs in CI
- **Naming**: `MixedCaps` / `mixedCaps`, never `snake_case`; an initial capital exports an identifier, lowercase keeps it package-private. Package names are short, lowercase, single-word, no underscores. **No `I`-prefix on interfaces** (consistent with Java) — name them for behaviour, using the idiomatic `-er` suffix where it fits (e.g. `Reconciler`)
- **Errors**: handled explicitly with `if err != nil`; don't `panic` across package boundaries. Add context by wrapping: `fmt.Errorf("reconciling terminal %s: %w", id, err)`
- **Module layout**: its own Go module (`sync-gateway/go.mod`), with `cmd/` for entry points and `internal/` for packages that shouldn't be imported elsewhere
- **Tests**: standard `testing` package, table-driven where it helps, files suffixed `_test.go`, run with `go test ./...`

## Current State

The repository is **early-stage** (M0 in progress). The `backend/` Maven + Spring
Boot skeleton exists: package-per-context layout, PostgreSQL + JPA + Flyway,
Checkstyle/Google style, a `/ping` endpoint, and a Testcontainers context-load
test. The `till-client/` (Vite + React + TypeScript PWA) is scaffolded too: a
trivial till page that calls `/ping` via a dev proxy, a web-app manifest, and
`gts` enforcing Google TypeScript style (service workers / offline deferred to
M11). CI builds both subprojects. The design is settled — the unified resource-ledger
abstraction, the modular-monolith backend, and a TypeScript PWA till — and
implementation is sequenced by an M0–M14 roadmap. Key design decisions:

- **Resource ledger** as the core abstraction (stock + hours as one budgeted resource → live prime-cost engine)
- **Modular monolith** (Spring Boot), bounded contexts as packages, deferred service split
- **Offline-first POS** is a first-class constraint (write-ahead log + outbox; event sourcing only if the project earns it), parked at ~M11
- **MVP** is a café **vertical slice**: catalog → POS sale → stock decrement → ledger entry → prime-cost report, online-only first

CI runs on every PR (`build.yml`) and a scheduled `manage-blocked-label.yml`
keeps the `blocked` label in sync with open issue dependencies.

> **Note:** `build.yml` runs `./mvnw -B verify` in `backend/`. Because the tests
> use Testcontainers, both CI and a local `verify` require a running Docker daemon
> (start local Postgres for running the app with `docker compose up -d`).
