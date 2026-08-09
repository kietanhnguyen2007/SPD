---
name: plan_and_solve_decomposition
description: Break down a massive, ambiguous goal into a step-by-step project plan before executing anything. Make sure to use this skill whenever the user asks for a full-stack app, a complex module, or gives a very broad instruction like "build X".
---

# Plan-and-Solve Decomposition

Plan-and-Solve Decomposition is the foundational discipline of transforming high-level, ambiguous, or massive software engineering prompts into structured, deterministic, and verifiable execution plans. When faced with expansive directives such as "build a full-stack e-commerce engine" or "refactor the auth service," jump-starting straight into code leads to context drift, hallucinated architectural abstractions, leaky module boundaries, and compounding technical debt.

This skill equips the model to think as a Principal System Architect before acting as a Senior Software Engineer—establishing clear domain boundaries, explicit data contracts, and gated task sequences prior to emitting any code.

---

## The Core Philosophy / Critical Understanding

### The Fallacy of Immediate Implementation
Large Language Models exhibit a natural bias toward immediate code emission. When presented with a complex objective, the model attempts to solve architectural design, state management, API schema definition, error handling, and UI layout concurrently within a single generation turn. This cognitive overloading leads to predictable failure modes:
1. **Context Window Decay & Attention Fragmentation**: As token count grows during monolithic code generation, the model loses track of early architectural assumptions, leading to mismatched variables, broken imports, and inconsistent patterns.
2. **Premature Implementation Lock-in**: Code generated without an upfront blueprint anchors subsequent decisions around flawed initial choices, requiring costly back-tracking or patch-upon-patch fixes.
3. **Interface Drift**: Sub-systems built in isolation without explicit input/output contracts fail to integrate cleanly, forcing ad-hoc adapters and duplicated logic.

### Decompose before Digesting, Design before Decoding
To achieve deterministic quality across complex engineering tasks, execution must be strictly decoupled into two distinct phases:

```
[ Ambiguous User Goal ]
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Phase I: Architectural Orchestration (The Plan)       │
│  - Dissect hidden requirements & implicit bounds        │
│  - Define domain boundaries & explicit data contracts  │
│  - Sequence atomic, verifiable execution tasks         │
└────────────────────────────────────────────────────────┘
          │
          ▼ (User Gate / Validation)
┌────────────────────────────────────────────────────────┐
│  Phase II: Modular Execution (The Solve)               │
│  - Execute Task 1 -> Verify -> Commit State            │
│  - Execute Task 2 -> Verify -> Commit State            │
│  - Execute Task N -> Final Integration & Verification  │
└────────────────────────────────────────────────────────┘
```

The core principle is **State Decoupling**: Each step of the plan must produce a tangible artifact (a schema, a module, an API integration, a test suite) with crisp interfaces, allowing subsequent steps to build upon verified foundations rather than fluid assumptions.

---

## Execution Strategy (The "How")

### Step 1: Ambiguity Dissection & Intent Unpacking
Before writing a single line of code or structural specification, dissect the prompt across three dimensions:
- **Explicit Requirements**: Core features directly requested by the user.
- **Implicit System Dependencies**: Unstated yet essential prerequisites (e.g., persistence layers, authentication middleware, error boundaries, environment configs).
- **Non-Functional Constraints**: Performance expectations, scale, type safety, cross-platform compatibility, and security boundaries.

### Step 2: System Boundary & Interface Mapping
Delineate how data and control flow across the application:
- Identify domain boundaries (e.g., Auth, Storage, Billing, UI Presentation).
- Define concrete data schemas and contract interfaces between modules (TypeScript interfaces, Pydantic models, OpenAPI specifications, or DB schemas).
- Identify external integrations and establish stub/mock boundaries for isolated testing.

### Step 3: Topological Task Sequencing
Divide the project into 3 to 6 logical tasks ordered by dependency topology:
- **Prerequisite Infrastructure First**: Setup configurations, core data types, and database schemas before consuming logic.
- **Atomic & Independent**: Each task must be independently runnable, testable, and verifiable. Avoid "half-working" tasks that depend on unwritten future code to validate.
- **Bite-Sized Scope**: A task should focus on a single conceptual domain (e.g., "Implement Order Repository & Database Migrations", not "Build Order System and Frontend Checkout").

### Step 4: Verification & Acceptance Criteria Definition
For every single task in the plan, establish concrete, empirical verification criteria:
- What command or manual check proves this step succeeded? (e.g., `npm run test:unit`, verifying route HTTP 200 response, schema validation check).
- What exact file outputs or structural changes signify task completion?

### Step 5: Interactive Gated Presentation
Format the output according to the standard **Output Architecture** (below) and present it to the user. Explicitly stop execution to seek confirmation or refinement before commencing Task 1.

---

## Output Architecture

When executing Plan-and-Solve Decomposition, format the plan using the following standard Markdown architecture:

```markdown
# Architectural Blueprint & Execution Plan: [Project Name]

## 1. System Overview & Key Architecture Decisions
- **Core Stack & Frameworks:** [List primary technologies]
- **Architectural Pattern:** [e.g., Clean Architecture, Modular Monolith, Event-Driven]
- **Key System Boundaries:** [Brief description of module separation]

## 2. Phase-by-Phase Execution Graph

- [ ] **Task 1: [Prerequisite/Core Infrastructure Task Name]**
  - **Objective:** [Clear description of what will be accomplished]
  - **Inputs & Dependencies:** [Prerequisites, configs, existing files]
  - **Deliverables & Data Contracts:** [Created files, interfaces, exports]
  - **Verification Strategy:** [Exact test command or verification check]

- [ ] **Task 2: [Domain Logic / Core Backend Task Name]**
  - **Objective:** [Description]
  - **Inputs & Dependencies:** [Task 1 outputs]
  - **Deliverables & Data Contracts:** [Files, API routes, types]
  - **Verification Strategy:** [Verification check]

- [ ] **Task 3: [Integration / Frontend Task Name]**
  - **Objective:** [Description]
  - **Inputs & Dependencies:** [Task 2 outputs]
  - **Deliverables & Data Contracts:** [UI components, state stores]
  - **Verification Strategy:** [Verification check]

- [ ] **Task 4: [Final Verification & End-to-End Testing Task Name]**
  - **Objective:** [Integration testing, documentation, polish]
  - **Inputs & Dependencies:** [Tasks 1-3 outputs]
  - **Deliverables & Data Contracts:** [Test suites, build artifacts]
  - **Verification Strategy:** [E2E test suite or smoke test]

---

## 3. Approval Gate
> **Plan Approval Request:** Please review the architectural blueprint and task sequence above. Reply with **"Approved"** or provide modifications. Once confirmed, I will execute Task 1.
```

---

## Critical Guidelines & Constraints

### Anti-Patterns to Avoid
- **Monolithic Task Collapse**: Grouping database migration, API route handler, and UI component into a single "Task 1: Implement Feature X". Keep database, logic, and UI separated or cleanly layered.
- **Premature Implementation in Planning Stage**: Emitting actual file source code inside the planning response. The plan must contain specifications, interfaces, and architecture—not raw source code blocks.
- **Leaky Task Dependencies**: Creating Task 3 which relies on an undefined helper function supposed to be created in Task 4. Dependency flow must strictly be acyclic and sequential.
- **Vague Acceptance Criteria**: Specifying verification as "Make sure it works". Verification must be empirical: exact shell commands, API HTTP code assertions, or schema validations.
- **Over-Decomposition of Trivials**: Creating 15 micro-tasks for a simple tool script. Keep task count between 3 and 6, scaling detail within tasks rather than proliferating trivial checkboxes.

### Tone and Style
- **Role**: Speak with the authority, clarity, and precision of a Principal System Architect.
- **Language**: Use direct, imperative, action-oriented engineering vocabulary (e.g., "Decouple", "Enforce", "Isolate", "Validate", "Sequence").
- **Transparency**: Explicitly call out tradeoffs, assumptions, and potential edge cases upfront in the System Overview.

---

## Rich Case Studies & Detailed Examples

### Example 1: Greenfield Full-Stack E-Commerce System with Real-Time Inventory

**User Prompt:** "Build a full-stack online store where users can browse products, add items to cart, checkout with Stripe, and see live inventory updates."

```markdown
# Architectural Blueprint & Execution Plan: Real-Time E-Commerce Engine

## 1. System Overview & Key Architecture Decisions
- **Core Stack & Frameworks:** Next.js (App Router), TypeScript, PostgreSQL, Prisma ORM, WebSockets (Pusher/Socket.io), Stripe API.
- **Architectural Pattern:** Layered Modular Monolith with Event-Driven Inventory Sync.
- **Key System Boundaries:**
  - `Database & ORM Layer`: Source of truth for Products, Orders, Users, and Stock Ledger.
  - `Payment & Checkout Boundary`: Stripe SDK integration with webhook idempotency handling.
  - `Real-Time Synchronization Layer`: WebSocket broadcaster for broadcast stock change events.
  - `Frontend Presentation Layer`: React Server Components (RSC) for catalog, Client Components for dynamic cart and real-time badges.

## 2. Phase-by-Phase Execution Graph

- [ ] **Task 1: Database Schema & Core Data Model Layer**
  - **Objective:** Establish normalized PostgreSQL database schema via Prisma including optimistic concurrency controls for stock inventory.
  - **Inputs & Dependencies:** PostgreSQL instance, `.env.local` database credentials.
  - **Deliverables & Data Contracts:**
    - `prisma/schema.prisma` containing `User`, `Product`, `Order`, `OrderItem`, and `InventoryLog` models.
    - Exported TypeScript types (`ProductWithStock`, `CartItem`, `CheckoutSessionPayload`).
  - **Verification Strategy:** Run `npx prisma migrate dev --name init` and execute a seed script (`npx prisma db seed`) populating 10 test products.

- [ ] **Task 2: Payment Gateway & Order Processing Service**
  - **Objective:** Construct backend REST/Route handlers for cart checkout and webhook processing for asynchronous payment confirmation.
  - **Inputs & Dependencies:** Task 1 Prisma models, Stripe Secret Key & Webhook Secret.
  - **Deliverables & Data Contracts:**
    - `app/api/checkout/route.ts`: Initializes Stripe Checkout Session with line items.
    - `app/api/webhooks/stripe/route.ts`: Handles `payment_intent.succeeded`, updates order status to `PAID`, and decrements inventory atomically.
  - **Verification Strategy:** Trigger simulated webhook event via `stripe trigger payment_intent.succeeded` and verify order status transitions in database via Prisma Studio.

- [ ] **Task 3: Real-Time Inventory Broadcasting Engine**
  - **Objective:** Implement WebSocket publisher/subscriber infrastructure to emit real-time stock updates upon inventory changes.
  - **Inputs & Dependencies:** Task 2 order processing logic, Pusher/Socket server credentials.
  - **Deliverables & Data Contracts:**
    - `lib/socket/server.ts`: Helper utility to publish `INVENTORY_UPDATED` events with `{ productId, newQuantity }`.
    - `lib/socket/client.ts`: React hook (`useRealtimeStock`) subscribing to channel updates.
  - **Verification Strategy:** Execute test script simulating concurrent purchases while observing live WebSocket payload emissions.

- [ ] **Task 4: Interactive Frontend & Reactive Cart Interface**
  - **Objective:** Develop Next.js UI views for product catalog listing, slide-over cart management, and real-time inventory badge indicators.
  - **Inputs & Dependencies:** Task 1-3 API endpoints and WebSocket client hooks.
  - **Deliverables & Data Contracts:**
    - `app/products/page.tsx`: Catalog view rendering product grid with live stock status.
    - `components/cart/CartDrawer.tsx`: Dynamic cart drawer calculating subtotals and initiating Stripe checkout flow.
  - **Verification Strategy:** Launch Next.js dev server (`npm run dev`), add items to cart, complete test checkout, and observe real-time stock decrease across two browser tabs.

---

## 3. Approval Gate
> **Plan Approval Request:** Please review the architectural blueprint and task sequence above. Reply with **"Approved"** or provide modifications. Once confirmed, I will execute Task 1.
```

---

### Example 2: Legacy Refactoring - Monolithic Express REST API to Modular Domain-Driven Architecture

**User Prompt:** "Our Node/Express backend is a messy single file with 4,000 lines of code. Split it into clean modules without breaking the API."

```markdown
# Architectural Blueprint & Execution Plan: Express Monolith Domain Refactoring

## 1. System Overview & Key Architecture Decisions
- **Core Stack & Frameworks:** Node.js, Express, TypeScript, Jest, Supertest.
- **Architectural Pattern:** Domain-Driven Design (DDD) with Controller-Service-Repository separation.
- **Key System Boundaries:**
  - `Route / Controller Layer`: Request validation, HTTP response formatting, status codes.
  - `Domain Service Layer`: Business logic, domain rules, orchestration across repositories.
  - `Repository / Data Layer`: Direct database access, query abstraction, ORM interactions.

## 2. Phase-by-Phase Execution Graph

- [ ] **Task 1: Safety Net - Integration Test Suite Baseline**
  - **Objective:** Construct comprehensive end-to-end regression test suite covering all existing public API endpoints prior to refactoring.
  - **Inputs & Dependencies:** Running monolith backend server, test database instance.
  - **Deliverables & Data Contracts:**
    - `tests/e2e/auth.spec.ts`: Tests for `/api/v1/auth/*`.
    - `tests/e2e/users.spec.ts`: Tests for `/api/v1/users/*`.
    - `tests/e2e/orders.spec.ts`: Tests for `/api/v1/orders/*`.
  - **Verification Strategy:** Run `npx jest tests/e2e` ensuring 100% test pass rate against existing unmodified monolith.

- [ ] **Task 2: Modular Project Skeleton & Shared Middleware Domain**
  - **Objective:** Establish clean directory structure (`src/modules/*`, `src/shared/*`) and migrate cross-cutting concerns (error handling, JWT validation, logging).
  - **Inputs & Dependencies:** Existing global Express middlewares in monolith.
  - **Deliverables & Data Contracts:**
    - `src/shared/middleware/auth.ts`: Decoupled JWT verification middleware.
    - `src/shared/errors/AppError.ts`: Centralized custom exception classes.
    - `src/shared/middleware/errorHandler.ts`: Global Express error handler.
  - **Verification Strategy:** Import shared middleware into dummy test route and execute unit tests (`npx jest tests/unit/middleware`).

- [ ] **Task 3: Domain Extraction - Auth & User Modules**
  - **Objective:** Extract user authentication and profile logic out of monolith file into `src/modules/auth` and `src/modules/users`.
  - **Inputs & Dependencies:** Task 2 shared utilities, monolithic source code (`server.js`).
  - **Deliverables & Data Contracts:**
    - `src/modules/auth/auth.controller.ts`, `auth.service.ts`, `auth.routes.ts`.
    - `src/modules/users/user.repository.ts`, `user.service.ts`.
  - **Verification Strategy:** Execute auth E2E tests (`npx jest tests/e2e/auth.spec.ts`) asserting 0 regressions.

- [ ] **Task 4: Domain Extraction - Order Processing & Final Cleanup**
  - **Objective:** Extract remaining domain logic (Orders, Catalog) into standalone modules, dismantle legacy `server.js`, and wire modular router in `src/app.ts`.
  - **Inputs & Dependencies:** Tasks 1-3 modules and test runner.
  - **Deliverables & Data Contracts:**
    - `src/modules/orders/*`: Complete order domain layer.
    - `src/app.ts`: Root application initializer importing sub-module routers.
  - **Verification Strategy:** Run full integration test suite (`npm run test:e2e`), verify all endpoints pass, and confirm original monolith file is safely removed.

---

## 3. Approval Gate
> **Plan Approval Request:** Please review the architectural blueprint and task sequence above. Reply with **"Approved"** or provide modifications. Once confirmed, I will execute Task 1.
```

---

### Example 3: High-Throughput Asynchronous Log Processing & Analytics Pipeline

**User Prompt:** "Design and implement a high-throughput log ingestion and analytics system in Python that consumes server logs, parses them asynchronously, and writes aggregated metrics into ClickHouse."

```markdown
# Architectural Blueprint & Execution Plan: Asynchronous Analytics Ingestion Pipeline

## 1. System Overview & Key Architecture Decisions
- **Core Stack & Frameworks:** Python 3.11+, asyncio, aiokafka / RabbitMQ, Pydantic v2, ClickHouse-Driver / HTTP Client.
- **Architectural Pattern:** Producer-Consumer Micro-Pipeline with Batching & Dead Letter Queue (DLQ).
- **Key System Boundaries:**
  - `Ingestion & Parsing Boundary`: Async workers extracting raw log lines into validated Pydantic log schemas.
  - `Buffering & Batching Layer`: In-memory thread-safe queues aggregating records to maximize ClickHouse bulk insert performance.
  - `Analytics Storage Layer`: ClickHouse MergeTree table schema optimized for time-series aggregation queries.

## 2. Phase-by-Phase Execution Graph

- [ ] **Task 1: ClickHouse Storage Schema & Ingestion Client Setup**
  - **Objective:** Configure ClickHouse database connection pool and create target table schema with appropriate sorting keys.
  - **Inputs & Dependencies:** Running ClickHouse server instance, `clickhouse-connect` package.
  - **Deliverables & Data Contracts:**
    - `db/migrations/001_create_logs_table.sql`: Table definition using `SummingMergeTree` partitioned by month and ordered by `(timestamp, service_name, status_code)`.
    - `src/storage/clickhouse_client.py`: Async connection manager with bulk insert helper `insert_log_batch(batch: List[LogRecord])`.
  - **Verification Strategy:** Run schema migration script and execute unit test inserting 1,000 mock log records via bulk client.

- [ ] **Task 2: Log Parsing & Data Validation Engine**
  - **Objective:** Build robust asynchronous parser converting unstructured log formats (JSON, Nginx access logs, Syslog) into strongly typed models.
  - **Inputs & Dependencies:** Pydantic v2, regex patterns for standard log formats.
  - **Deliverables & Data Contracts:**
    - `src/parser/schema.py`: `LogRecord` Pydantic model enforcing strict type constraints (IP address, timestamp ISO format, status code integer).
    - `src/parser/log_parser.py`: `parse_log_line(raw_line: str) -> Optional[LogRecord]` handling corrupted log lines without raising unhandled exceptions.
  - **Verification Strategy:** Execute test suite (`pytest tests/test_parser.py`) against sample corpus of 10,000 valid and invalid log strings.

- [ ] **Task 3: Async Batching Queue & DLQ Error Handler**
  - **Objective:** Construct background worker loop that buffers parsed logs in memory and triggers flush when batch size threshold (5,000 records) or time interval (2 seconds) is reached.
  - **Inputs & Dependencies:** Task 1 ClickHouse client, Task 2 Pydantic schema.
  - **Deliverables & Data Contracts:**
    - `src/pipeline/batch_processor.py`: `AsyncBatchProcessor` managing queue consumption, flushing, and routing malformed records to Dead Letter File storage (`dlq/failed_logs.log`).
  - **Verification Strategy:** Run stress test feeding 50,000 records into queue at 10,000 logs/sec and verify batch insert frequency and zero record loss in ClickHouse.

- [ ] **Task 4: CLI Runner, Monitoring Metrics & End-to-End Test**
  - **Objective:** Package the processing engine into runnable CLI daemon with Prometheus metrics instrumentation (logs/sec processed, error count, flush latency).
  - **Inputs & Dependencies:** Tasks 1-3 components, `prometheus_client`.
  - **Deliverables & Data Contracts:**
    - `src/cli.py`: Main entry point accepting configuration parameters (`--batch-size`, `--flush-interval-ms`, `--log-file`).
    - `docker-compose.yml`: Local orchestrator spinning up ClickHouse, log generator, and processor daemon.
  - **Verification Strategy:** Execute `docker-compose up`, let run for 60 seconds, and query ClickHouse metrics via SQL: `SELECT service_name, count() FROM logs GROUP BY service_name`.

---

## 3. Approval Gate
> **Plan Approval Request:** Please review the architectural blueprint and task sequence above. Reply with **"Approved"** or provide modifications. Once confirmed, I will execute Task 1.
```

---

### Example 4: Real-Time Multi-User Collaborative Canvas/Document Editor

**User Prompt:** "Build a collaborative canvas drawing web app where multiple users can draw together in real-time with conflict handling."

```markdown
# Architectural Blueprint & Execution Plan: Real-Time Collaborative Canvas Editor

## 1. System Overview & Key Architecture Decisions
- **Core Stack & Frameworks:** React, HTML5 Canvas API / Konva.js, WebSockets, Yjs (CRDT), Node.js (ws server).
- **Architectural Pattern:** Decentralized CRDT (Conflict-free Replicated Data Type) with WebSocket Relay Server.
- **Key System Boundaries:**
  - `CRDT State Manager`: Local Yjs document maintaining canvas shape trees, color attributes, and position vectors.
  - `Network Sync Layer`: `y-websocket` provider transmitting binary delta patches across connected clients.
  - `Rendering Engine Layer`: React Canvas component performing high-performance delta updates without triggering full DOM re-renders.

## 2. Phase-by-Phase Execution Graph

- [ ] **Task 1: Shared CRDT Document Schema & Delta Data Layer**
  - **Objective:** Define shared Yjs data structures for canvas vector primitives (paths, rectangles, text nodes) and awareness presence (cursor positions, selected colors).
  - **Inputs & Dependencies:** `yjs` package.
  - **Deliverables & Data Contracts:**
    - `src/crdt/schema.ts`: Initializer for `Y.Doc` containing `Y.Array<CanvasShape>` map and `Y.Map<UserAwareness>`.
    - `src/crdt/types.ts`: TypeScript interfaces for `CanvasShape`, `Point`, `StrokeProperties`.
  - **Verification Strategy:** Unit test creating two independent `Y.Doc` instances, mutating Document A, applying update delta to Document B, and asserting state equality.

- [ ] **Task 2: WebSocket Relay Server & Room Management**
  - **Objective:** Implement Node.js WebSocket server managing room subscriptions, persisting document states, and broadcasting binary CRDT updates.
  - **Inputs & Dependencies:** `ws`, `y-websocket/bin/utils`.
  - **Deliverables & Data Contracts:**
    - `server/index.js`: Express + WS server handling endpoint `ws://localhost:1234/rooms/:roomId`.
    - `server/storage.js`: In-memory / Redis buffer snapshotting Yjs document state every 30 seconds.
  - **Verification Strategy:** Launch server script and execute node client script connecting 5 concurrent WS clients performing bidirectional ping/pong and update sync.

- [ ] **Task 3: React Canvas Component & Drawing Interaction Engine**
  - **Objective:** Create interactive canvas component supporting freehand drawing, shape creation, color picking, and dynamic cursor tracking.
  - **Inputs & Dependencies:** Task 1 CRDT schema, Konva.js / HTML5 Canvas API.
  - **Deliverables & Data Contracts:**
    - `src/components/Canvas.tsx`: Main canvas element handling mouse events (`onMouseDown`, `onMouseMove`, `onMouseUp`).
    - `src/hooks/useCanvasDrawing.ts`: Custom hook binding user mouse inputs to local Yjs array updates.
  - **Verification Strategy:** Test rendering component locally, draw freehand lines, and verify shape coordinates are correctly appended to the local Yjs document.

- [ ] **Task 4: End-to-End Multi-User Synchronization & Cursor Overlay**
  - **Objective:** Connect frontend canvas component to WebSocket sync provider and overlay remote user awareness cursors in real-time.
  - **Inputs & Dependencies:** Tasks 1-3 outputs, `y-websocket` client provider.
  - **Deliverables & Data Contracts:**
    - `src/hooks/useCollaborativeSession.ts`: Hook establishing WS connection to room, syncing Y.Doc, and tracking remote cursors.
    - `src/components/RemoteCursors.tsx`: Component displaying colored user avatars and cursor pointers over the canvas.
  - **Verification Strategy:** Open application in two side-by-side browser windows across different room IDs and verify real-time draw stroke sync and cursor movement with sub-50ms latency.

---

## 3. Approval Gate
> **Plan Approval Request:** Please review the architectural blueprint and task sequence above. Reply with **"Approved"** or provide modifications. Once confirmed, I will execute Task 1.
```
