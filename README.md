# inventory-manager

> A unified inventory, point-of-sale, and staff-rota platform for shops, cafés, restaurants, and pubs — built on one idea: **stock and staff hours are the same kind of budgeted resource.**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](CHANGELOG.md)
[![Versioning](https://img.shields.io/badge/versioning-semantic-brightgreen.svg)](https://semver.org)
[![Code Style](https://img.shields.io/badge/code%20style-Google-blue.svg)](https://google.github.io/styleguide/)
[![Java](https://img.shields.io/badge/java-21+-orange.svg)](https://openjdk.org)
[![TypeScript](https://img.shields.io/badge/typescript-PWA%20till-3178c6.svg)](https://www.typescriptlang.org)
[![Go](https://img.shields.io/badge/go-sync%20gateway-00ADD8.svg)](https://go.dev)

---

## Overview

Retail and hospitality businesses run on two big controllable costs: the **stock** they buy and the **staff hours** they pay for. In the trade these are tracked together as *prime cost* — typically 55–65% of sales — because they're the two expenses an operator can actually influence day to day.

Today those two halves live in separate products: a **POS** (Toast, Square, Lightspeed) handles selling and stock, and a **rota** system (RotaCloud, Deputy, Planday) handles staff scheduling. They bolt onto each other with CSV exports and integrations, and almost nobody puts stock budget and labour budget into **one ledger against one prime-cost target.**

`inventory-manager` collapses that gap. It models stock and hours as a single abstraction — a **budgeted resource** — feeding a shared, append-only **resource ledger**. A sale consumes stock and writes a ledger line; a completed shift consumes budgeted hours and writes a ledger line. The reporting layer doesn't care which is which: it sums ledger lines by department and period against a budget that can't be exceeded, giving live prime-cost visibility.

The platform is designed to be **multi-tenant and flexible**: a single site can run several department types at once — e.g. a garden centre with a café inside it — each with its own catalog, till configuration, rota, and shelf-edge/allergen **labels**.

---

## Features

### Planned

- **Unified resource ledger** — stock and labour modelled as one budgeted resource; an append-only ledger of consumption against budget
- **Inventory management** — catalogs, SKUs, stock-on-hand, reorder points, suppliers; stock shared across departments within a site
- **Point of sale** — ring up sales, decrement stock, write ledger entries; **offline-first** terminals that keep selling when the network drops
- **Rota / labour** — roles, shifts, scheduled vs. worked hours, live labour-cost-as-%-of-sales
- **Prime-cost reporting** — COGS % and labour % per department per period, with overspend alerts
- **Org hierarchy** — Organisation → Site → Department, so one location can run retail, café, and garden departments side by side
- **Label designer** — shelf-edge, reduction, and ingredient/allergen labels from templates (with UK *Natasha's Law* allergen fields in mind)
- **Sync gateway** — reconciles offline sale streams from multiple terminals back into the central ledger

---

## Architecture

A polyglot system with a Java backend at its core and a TypeScript till at the edge:

| Component | Language / Stack | Responsibility |
|---|---|---|
| `backend` | Java 21 / Spring Boot 3.x | Modular monolith — org hierarchy, inventory, labour/rota, the resource ledger, POS, labels, reporting |
| `till-client` | TypeScript (PWA) | Offline-first point-of-sale terminal — service workers + IndexedDB for a local sale log |
| `sync-gateway` *(planned, M12)* | Go | Reconciles offline sale-event streams from terminals into the central ledger |

**Datastore:** PostgreSQL, with schema managed by Flyway (or Liquibase) migrations from M0.

The backend starts as a **modular monolith**, not microservices: each bounded context is its own package, with boundaries enforced by package structure so a future split is mechanical rather than a rewrite.

---

## Project Structure

> **Status: greenfield.** Only repository scaffolding exists today (this README, `CLAUDE.md`, CI, issue/PR templates, licence). The tree below is the *intended* layout that the M0–M14 roadmap builds out — concrete classes do not exist yet.

```
inventory-manager/
│
├── backend/                          # Java 21 / Spring Boot — modular monolith
│   └── src/main/java/dev/jamieramsell/inventory/
│       ├── org/                      # Organisation, Site, Department hierarchy
│       ├── catalog/                  # CatalogEntry — sellable items scoped to a department
│       ├── stock/                    # StockItem, stock receipts, suppliers
│       ├── pos/                      # Sales, terminals, the sale → stock-decrement flow
│       ├── ledger/                   # BudgetedResource, ResourceLedger — the prime-cost core
│       ├── rota/                     # Roles, shifts, labour as a budgeted resource
│       ├── labels/                   # Label templates and the rendering pipeline
│       └── reporting/                # Prime-cost / budget reporting and alerting
│
├── till-client/                      # TypeScript PWA — offline-first till terminal
│
├── sync-gateway/                     # (planned) Go service reconciling offline sale streams
│
├── docs/                             # Design notes, API spec, architecture decisions
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   └── bug.md
│   ├── workflows/
│   │   ├── build.yml
│   │   └── manage-blocked-label.yml
│   └── pull_request_template.md
│
├── .gitignore
├── CHANGELOG.md
├── CLAUDE.md
├── LICENSE
└── README.md
```

---

## Getting Started

> The `backend` (Spring Boot) and `till-client` (Vite + React PWA) skeletons both run now (M0 in progress). Offline support and the full POS flow arrive over M3–M11.

### Prerequisites

- Java 21+
- Docker (for local PostgreSQL, and for the Testcontainers-based tests)
- Node.js 22+ for the TypeScript till client

### Running the backend (Java / Maven)

```bash
docker compose up -d          # start local PostgreSQL (from the repo root)

cd backend
./mvnw spring-boot:run        # run the service (needs Postgres running)
./mvnw test                   # run tests (needs Docker for Testcontainers)
./mvnw verify                 # compile, test, and run Checkstyle (Google Java Style)
```

### Running the till client (TypeScript)

```bash
cd till-client
npm install
npm run dev                   # local dev server (proxies /ping to the backend)
npm run lint                  # gts — Google TypeScript Style (lint + format check)
npm run build                 # type-check and production build
```

---

## Versioning

This project uses [Semantic Versioning](https://semver.org/). Releases follow the `MAJOR.MINOR.PATCH` format:

- `MAJOR` — breaking API changes
- `MINOR` — new backwards-compatible features
- `PATCH` — backwards-compatible bug fixes

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

- **Breaking changes** are flagged with `!` (e.g. `feat!:`, `fix!:`). A breaking change must have a corresponding issue opened first.

---

## Contributing

Please open an issue before submitting a pull request so the proposed change can be discussed first.

This project uses a milestone-based branching model. Work flows from short-lived
development branches up through per-milestone stable branches into `main`:

```
<milestone>/<label>/<name>  ──PR──▶  stable-<milestone>  ──PR──▶  main
```

### Branching

- **Development branches** — `<milestone>/<label>/<name>`, where `<label>` is a
  Conventional Commit type (`feat`, `fix`, `refactor`, `docs`, `chore`, …). Version
  milestones replace dots with hyphens (`v1.0.0` → `v1-0-0`).
  - `m1/feat/resource-ledger` — defining the resource ledger in milestone M1
  - `v1-0-0/refactor/pos-terminal` — refactoring the POS terminal in milestone v1.0.0
- **Stable branches** — `stable-<milestone>` (e.g. `stable-m1`, `stable-v1-0-0`).
  Development branches are merged here via pull request once ready.
- **`main`** — a completed milestone is merged from its stable branch into `main`
  via a further pull request.

### Pull requests

1. Open an issue describing the change before starting work.
2. Branch from the relevant stable branch using the naming convention above.
3. Open a pull request targeting the appropriate branch (development → `stable-<milestone>`;
   completed milestone → `main`).
4. Every pull request must pass the automated checks (build, test, lint) before it can be merged.

### Commits & versioning

- **[Conventional Commits](https://www.conventionalcommits.org/)** (`feat:`, `fix:`,
  `refactor:`, `chore:`, `docs:`, …).
- **Breaking changes** are flagged with `!` (e.g. `feat!:`, `fix!:`). A breaking change must have a corresponding issue opened first.
- Releases follow **[Semantic Versioning](https://semver.org/)**.
