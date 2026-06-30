# Unified Operations Platform: Roadmap (M0 to M14)

A single system for stock, sales (POS), labour (rota), and labels, built on one core
idea: stock and staff hours are both **budgeted resources** feeding one **prime cost**
view (COGS percentage plus labour percentage against a budget that cannot be exceeded).

**Stack decisions (locked for now)**
- Backend: Java 21 plus Spring Boot, as a modular monolith with one package per bounded context.
- Till client: TypeScript Progressive Web App (PWA), built online first, made offline capable later.
- Sync gateway: Go, introduced only when offline first arrives (M12).
- Datastore: PostgreSQL.

**MVP target: end of M4.** The minimum viable product is one café sale running end to end
(ring up a sale, decrement stock, write a ledger entry, show a prime cost figure), online only.

**Conventions**
- Milestones use `[MX]` prefixes.
- Each milestone lists a goal, deliverables, a "Done when" definition, and a "Blocked by" line.
- Dependencies use "Blocked by" phrasing.

---

## [M0] Project setup and scaffolding
**Goal:** A buildable, CI backed skeleton for both the backend and the till client.

**Deliverables**
- Repository created with branch protection rules, PR and issue templates, and a label system.
- Spring Boot backend skeleton with package per context layout (`org`, `catalog`, `stock`, `pos`, `ledger`, `rota`, `labels`, `reporting`).
- TypeScript PWA skeleton with a build pipeline.
- PostgreSQL running locally (Docker Compose), with a migration tool wired in (Flyway or Liquibase).
- GitHub Actions CI running build and test for both subprojects with correct working directories.

**Done when:** A trivial endpoint and a trivial PWA page both build green in CI.

**Blocked by:** Nothing.

---

## [M1] Domain core: org hierarchy and the resource ledger
**Goal:** Model the spine of the whole system, including the abstraction that makes it distinctive.

**Deliverables**
- `Organisation`, `Site`, `Department` entities and their relationships.
- The `BudgetedResource` concept with `budget_limit`, `unit_cost`, and `period` (ISO week).
- The append only `ResourceLedger`: an immutable line per resource movement, with a type, a department, a period, and an amount.
- A function that sums ledger lines into a current position for a given resource, department, and period.

**Done when:** Ledger lines can be written and replayed into a correct current position in tests, with no mutable balance stored anywhere.

**Blocked by:** [M0].

---

## [M2] Catalog and stock
**Goal:** Represent what is sold and track stock as a flow, not a static count.

**Deliverables**
- `CatalogEntry` (a sellable item scoped to a department) and `StockItem` (the underlying inventory record).
- Stock receipt flow (recording purchases into stock).
- COGS calculation implemented as a ledger derivation: beginning inventory plus purchases minus ending inventory across a period.

**Done when:** Receiving stock and consuming it produces a correct COGS figure for a period, derived from ledger lines.

**Blocked by:** [M1].

---

## [M3] POS sale (backend, online happy path)
**Goal:** The backend half of the vertical slice: a sale that decrements stock and writes to the ledger.

**Deliverables**
- A sale flow: select catalog items, take payment (stubbed or test gateway), complete the sale.
- On completion, decrement stock and write the corresponding `StockResource` ledger lines.
- Sale records persisted with line items and totals.

**Done when:** A single completed café sale correctly decrements stock and appears as ledger lines, online, with everything cooperating (happy path only).

**Blocked by:** [M2].

---

## [M4] Till client (TypeScript, online) — MVP
**Goal:** Close the vertical slice with a usable till, proving the core thesis end to end.

**Deliverables**
- A TypeScript PWA till that lists a café catalog, builds a basket, and submits a sale to the backend.
- Display of a simple prime cost figure for the current period after the sale.
- Basic till UX: add item, remove item, total, confirm.

**Done when:** A person can ring up a real café sale on the till, see stock decrement, and see a prime cost figure move. This is the MVP.

**Blocked by:** [M3].

---

## [M5] COGS reporting and projections
**Goal:** Turn raw ledger lines into the read models operators actually look at.

**Deliverables**
- Read projections that aggregate ledger lines into COGS percentage by department and period.
- A reporting endpoint and a simple report view in the PWA.
- Budget comparison: actual COGS against `budget_limit`, with an over budget flag.

**Done when:** COGS percentage and over budget status are visible per department per period, derived from the ledger.

**Blocked by:** [M4].

---

## [M6] Rota and labour
**Goal:** Bring staff hours in as the second budgeted resource, exercising the abstraction.

**Deliverables**
- `Role`, `Shift`, and staff assignment within a department.
- `LabourResource` with `hourly_rate`, `hours_scheduled`, and `hours_worked`.
- A completed or recorded shift writes labour ledger lines into the same `ResourceLedger`.
- A drag and drop or list based rota builder in the PWA (minimal first pass).

**Done when:** Scheduling and completing shifts writes labour lines to the ledger using the same machinery as stock.

**Blocked by:** [M1] (for the ledger), [M5] (for the reporting pattern to extend).

---

## [M7] Unified prime cost dashboard
**Goal:** The payoff. Both resources in one view, against one budget, in something close to real time.

**Deliverables**
- A dashboard showing COGS percentage, labour percentage, and combined prime cost percentage by department and period.
- Budget targets per resource and a combined prime cost target, with alerts when a line trends over.
- A period view (weekly) since that is the operational rhythm the industry actually uses.

**Done when:** A manager can see stock spend and labour spend unified into one prime cost figure against budget, updating as sales and shifts are recorded.

**Blocked by:** [M5], [M6].

---

## [M8] Label designer core
**Goal:** A self contained, visual module: design a template and render it to a printable label.

**Deliverables**
- A template model with placeholder fields (`{price}`, `{name}`, `{barcode}`).
- A template editor in the PWA (place fields on a canvas).
- A rendering pipeline: template plus item data to a printable output (PDF first).
- Template types: shelf edge and reduction sticker.

**Done when:** A user can design a shelf edge label, bind it to a catalog item, and produce a correct printable PDF.

**Blocked by:** [M2] (needs catalog and stock data to populate labels).

---

## [M9] Allergen labels and thermal printing
**Goal:** Add the regulated, hardware adjacent depth that makes this more than a toy.

**Deliverables**
- Ingredient and allergen fields on catalog items, with the named allergens emphasised on output.
- An ingredient or allergen label template type suitable for prepacked for direct sale food.
- ZPL output for a Zebra style thermal printer, in addition to PDF.

**Done when:** An ingredient label with emphasised allergens renders correctly to both PDF and ZPL. (Verify current UK allergen rules with the Food Standards Agency before finalising fields.)

**Blocked by:** [M8].

---

## [M10] Multi department and multi vertical
**Goal:** Support the garden centre with a café inside it: multiple systems under one site.

**Deliverables**
- Per department POS configuration (a café till and a retail till behaving differently under one site).
- Shared stock across departments: a `StockItem` linked to multiple `CatalogEntry` records via a join, so one physical stock can sell through more than one till context without duplicate inventory.
- Department scoped catalogs, rotas, and reporting rolling up to site level.

**Done when:** One site can run a café department and a retail department, share a stock item across both, and report prime cost per department and for the whole site.

**Blocked by:** [M7], [M8].

---

## [M11] Offline first foundations (till client)
**Goal:** Make the online happy path survive a dropped network.

**Deliverables**
- A per terminal write ahead log of sales held locally (IndexedDB).
- Service workers so the PWA keeps operating with no connectivity.
- An outbox: sales recorded offline are queued and pushed to the backend when connectivity returns.
- Idempotent submission so a retried push does not double count.

**Done when:** A till can take sales fully offline and reconcile them to the backend on reconnect, with no duplicates.

**Blocked by:** [M4].

---

## [M12] Sync gateway and conflict resolution (Go)
**Goal:** Reconcile multiple terminals and handle the conflicts offline mode creates.

**Deliverables**
- A Go service sitting between terminals and the backend, reconciling incoming event streams.
- Conflict handling for concurrent offline decrements (for example two tills selling the last unit), with a defined resolution policy and oversell reporting.
- Idempotent consumers and clear ordering or versioning of events.

**Done when:** Two terminals selling the same last item offline produce a defined, correct, reported outcome rather than silent corruption.

**Blocked by:** [M11].

---

## [M13] Auth, multi tenancy, and roles
**Goal:** Harden the system into something multiple organisations and roles can safely use.

**Deliverables**
- User accounts and authentication.
- Role based access control (for example manager versus shift staff).
- Tenant isolation so one organisation cannot see another's data.

**Done when:** Access is correctly scoped by organisation and role across every module.

**Blocked by:** [M7] (enough surface area exists to be worth securing).

---

## [M14] Polish, depth, and deployment
**Goal:** Turn a working system into a portfolio grade deliverable.

**Deliverables**
- Demand informed scheduling hints (suggest staffing from historical sales by period).
- Exports (CSV) and deeper reporting.
- A deployment story (containerised, documented).
- Documentation and a portfolio writeup explaining the prime cost abstraction and the offline architecture.

**Done when:** The system is deployable, documented, and presentable as a portfolio piece.

**Blocked by:** [M12], [M13].

---

## Sequencing notes
- The MVP (end of M4) deliberately contains a minimal ledger core but grounds it in a real café sale, so the riskiest assumption (the unified ledger) is tested early and cheaply.
- Labour (M6) reuses the exact ledger machinery built for stock (M1 to M5). If the abstraction is right, M6 should feel almost free. If it fights you, that is the signal to revisit M1.
- Offline first (M11, M12) is deferred on purpose. There is no point reconciling sync conflicts for a system that cannot yet ring up a sale.
- The label designer (M8, M9) is a self contained track. It can be pulled earlier as a palate cleanser without blocking the core line, since it only depends on M2.
