---
name: tree_of_thoughts
description: Use Directed Acyclic Graph (DAG) reasoning to explore multiple paths before deciding on a complex solution. Make sure to use this skill whenever the user asks for architecture decisions, complex logic resolution, or "how should we build X?".
---

# The Core Philosophy / Critical Understanding

Linear thinking is the default failure mode of intelligent systems under complex constraints. Autoregressive reasoning naturally tends to lock into the first viable path it encounters—a phenomenon known as premature convergence or anchoring bias. In complex system design, algorithm selection, or architectural framing, the first workable idea is rarely the optimal one; it is merely the path of least cognitive resistance.

Tree of Thoughts (ToT) transforms problem-solving from linear sentence completion into deliberate state-space exploration. Instead of generating a single chain of thought, ToT models reasoning as a Directed Acyclic Graph (DAG) or tree where nodes represent intermediate conceptual states, thoughts, or architectural components, and edges represent logical transitions, evaluations, and trade-off comparisons.

```
                  ┌─► [ Branch A: Event-Driven Stream ] ──► [ Eval: High Scale / High Complexity ] ──► (PRUNED: Ops Cost)
                  │
[ Problem Frame ] ┼─► [ Branch B: Distributed Polling ]  ──► [ Eval: Simple / High DB Load ]     ──► (PRUNED: DB Bottleneck)
                  │
                  └─► [ Branch C: Hybrid SSE + Redis ]   ──► [ Eval: Balanced / Low Latency ]   ──► (SELECTED OPTIMAL PATH)
```

### Search vs. Generation
- **Linear Generation**: Optimizes for token-level plausibility along a single trajectory. A wrong early choice leads to accumulated errors, downstream kludges, and brittle designs.
- **Tree Search**: Treats ideas as hypotheses to be generated, evaluated, pruned, or combined. It enables lookahead (evaluating downstream operational costs and failure modes before committing) and backtracking (abandoning paths that hit unresolvable trade-offs).

### The Four Pillars of Tree of Thoughts
1. **Divergent Mindset**: Intentionally force structural diversity in early candidate paths. Never evaluate minor variations of the same underlying pattern; contrast fundamental paradigms (e.g., push vs. pull, stateless vs. stateful, relational vs. document).
2. **Objective Heuristic Scoring**: Evaluate candidates against non-functional constraints (latency, scalability, operational complexity, security posture, developer velocity) rather than superficial preferences.
3. **Ruthless Pruning**: Eliminate sub-optimal branches immediately when a core invariant is violated, preventing wasted analysis on dead ends.
4. **Synthesis Over Pure Choice**: The final decision is rarely a raw copy of a single branch; it frequently synthesizes the core strengths of the top branch while integrating safeguards discovered during the stress-testing of discarded paths.

---

# Execution Strategy (The "How")

Navigating a complex problem space using Tree of Thoughts requires a structured 5-phase execution strategy:

### Phase 1: Problem Framing & Metric Definition
Before spawning branches, explicitly bound the problem space and establish evaluation criteria.
- **Identify Core Invariants**: What must never break under any circumstances? (e.g., zero financial transaction loss, <50ms P99 latency, strict GDPR compliance).
- **Define Evaluation Metrics**: Establish 4-6 trade-off dimensions (e.g., Complexity, Read Latency, Write Throughput, Operational Overhead, Developer Experience).
- **Surface Hidden Constraints**: Uncover implicit requirements around team capabilities, existing tech stack, deployment environments, or future scaling horizons.

### Phase 2: Divergent Path Generation (Branching)
Generate 3 to 4 distinct conceptual paradigms. Each branch must represent a fundamentally different architectural stance or algorithmic philosophy.
- **Avoid Strawmen**: Every branch must be a defensible, production-grade contender under the right context.
- **Ensure Structural Contrast**: If Branch A is synchronous REST + PostgreSQL, Branch B shouldn't be REST + MySQL; it should be Event-Driven CQRS + Kafka or Server-Sent Events + Redis.
- **Articulate Core Mechanics**: Describe the fundamental data flow, state ownership, and control flow for each branch.

### Phase 3: Multi-Dimensional Evaluation & Stress Testing
Conduct a systematic, rigorous evaluation of each path against your established metrics.
- **Analyze Pros & Cons**: Highlight immediate technical benefits and long-term operational risks.
- **Stress-Test Edge Cases**: How does this branch behave under network partitions, spike loads, deployment failures, or schema migrations?
- **Assess Complexity & Maintenance Overhead**: What is the cognitive load on engineers? What operational toil is introduced?

### Phase 4: Path Pruning & Strategic Backtracking
Systematically eliminate paths that fail core invariants or display unacceptable trade-offs.
- **State Explicit Pruning Rationale**: Document exactly why a branch was discarded (e.g., "Pruned Path 2 due to unbounded memory consumption under high tenant concurrency").
- **Backtrack if Necessary**: If all initial branches show critical flaws, step back to Phase 2 and generate a new branch combining salvaged elements from pruned paths.

### Phase 5: Synthesis & Execution Blueprint
Construct the final implementation plan based on the surviving optimal branch.
- **Synthesize Discovered Mitigations**: Incorporate lessons learned from pruned branches into the winning architecture.
- **Provide Actionable Artifacts**: Include complete component breakdowns, data schemas, API contracts, and phased execution steps.

---

## Standard Output Architecture

When executing this skill, adhere strictly to the following markdown header structure:

```markdown
# Tree of Thoughts Analysis: [Problem Title]

## 1. Problem Frame & Success Metrics
- **Core Challenge**: [Concise framing of the problem]
- **Key Constraints & Invariants**: [Non-negotiable requirements]
- **Evaluation Criteria**: [Metrics used to score paths: Latency, Complexity, Scalability, etc.]

## 2. Divergent Branching
- **Branch A: [Paradigm Name]**: [High-level concept & architectural blueprint]
- **Branch B: [Paradigm Name]**: [High-level concept & architectural blueprint]
- **Branch C: [Paradigm Name]**: [High-level concept & architectural blueprint]

## 3. Multi-Dimensional Evaluation
### Branch A Evaluation
- **Pros & Architectural Strengths**: [...]
- **Cons & Operational Risks**: [...]
- **Failure Modes & Edge Cases**: [...]

### Branch B Evaluation
- **Pros & Architectural Strengths**: [...]
- **Cons & Operational Risks**: [...]
- **Failure Modes & Edge Cases**: [...]

### Branch C Evaluation
- **Pros & Architectural Strengths**: [...]
- **Cons & Operational Risks**: [...]
- **Failure Modes & Edge Cases**: [...]

## 4. Pruning & Path Rejection
- **Pruned Branch**: [Name] - **Reason**: [Specific trade-off failure or constraint violation]
- **Pruned Branch**: [Name] - **Reason**: [Specific trade-off failure or constraint violation]

## 5. Optimal Path Synthesis & Implementation Blueprint
- **Selected Paradigm**: [Winning branch or hybrid synthesis]
- **Architecture & Technical Design**: [Detailed design with schemas, APIs, or sequence flows]
- **Implementation Strategy**: [Step-by-step rollout plan]
```

---

# Critical Guidelines & Constraints

### Anti-Patterns to Avoid
- **The Illusion of Choice (Strawman Branching)**: Creating deliberately weak or ridiculous alternatives just to make the preferred choice look good. All branches must be legitimate options that a senior architect would defend in specific contexts.
- **Superficial Branching**: Presenting options that only differ in minor implementation details (e.g., choosing between Axios and Fetch) rather than core architectural paradigms.
- **Post-Hoc Rationalization**: Deciding on the answer first and retrofitting evaluation metrics to justify it. Evaluation criteria must be defined independently of the solutions.
- **Premature Convergence**: Abandoning exploration after finding the first workable branch without evaluating alternative paradigms.

### Style & Tone Guidance
- Use objective, analytical, and authoritative language.
- Avoid vague qualifiers like "better", "faster", or "easier". Quantify trade-offs explicitly (e.g., "reduces database read IOPS by 75% at the cost of eventual consistency bounded by 500ms").
- Frame trade-offs as engineering realities rather than absolute rights and wrongs (e.g., "Optimizes for read velocity at the expense of operational complexity").

### Edge Case Handling
- **Constraint Conflicts**: When metrics directly conflict (e.g., maximum security vs. minimal latency), explicitly state the priority order specified by the user or domain standard before evaluating.
- **All Paths Flawed**: If every initial path violates a key constraint, introduce a hybrid branch in Phase 4 that explicitly combines elements of the pruned paths to resolve the conflict.

---

# Rich Case Studies & Examples

### Case Study 1: High-Throughput Real-Time Analytics Pipeline Architecture

**Scenario**: A financial platform needs to ingest 50,000 real-time market trade updates per second, aggregate volume-weighted average price (VWAP) over sliding 5-minute windows, and serve sub-50ms dashboard queries to 10,000 concurrent users.

```markdown
# Tree of Thoughts Analysis: Real-Time Analytics Pipeline

## 1. Problem Frame & Success Metrics
- **Core Challenge**: Ingesting 50k events/sec, performing sliding-window aggregates, and serving low-latency queries to high concurrency.
- **Key Invariants**: Zero lost event records, sub-50ms query read latency, strict linear temporal ordering per ticker symbol.
- **Evaluation Criteria**: Ingestion Throughput, Read Latency, Infrastructure Complexity, Fault Tolerance, Operational Cost.

## 2. Divergent Branching
- **Branch A: Micro-Batch Relational (PostgreSQL + TimescaleDB)**
  Ingest raw stream directly into TimescaleDB hyper-tables using micro-batch inserts. Compute sliding VWAP via continuous aggregates refreshed every 1 second.
- **Branch B: Stream-Native Processing (Apache Kafka + Apache Flink + Redis)**
  Ingest events into Kafka topics partitioned by ticker symbol. Flink processes sliding 5-minute event-driven windows and emits pre-aggregated metrics into Redis hash maps for O(1) query lookup.
- **Branch C: In-Memory Event Sourcing (Node.js/Go Cluster + Shared Memory Redis Streams)**
  App nodes consume directly from Redis Streams, compute metrics in local worker thread memory, and flush periodic snapshots to PostgreSQL for historical auditing.

## 3. Multi-Dimensional Evaluation
### Branch A Evaluation (TimescaleDB)
- **Pros**: Relational simplicity, full SQL query flexibility, single data engine for raw logs and aggregated metrics.
- **Cons**: High WAL write amplification under 50k inserts/sec; continuous aggregate background refresh introduces lock contention and query spikes during volatile markets.
- **Failure Modes**: Heavy write surges exhaust connection pools and degrade read response times beyond the 50ms P99 target.

### Branch B Evaluation (Kafka + Flink + Redis)
- **Pros**: Exceptional throughput scaling, exact-once processing semantics, isolates write ingestion completely from read serving layer. Redis guarantees <5ms query response times.
- **Cons**: High operational overhead requiring Zookeeper/KRaft, Flink cluster state management, RocksDB state backends, and multi-service deployment topologies.
- **Failure Modes**: Flink checkpointing failure during network instability can cause temporary pipeline lag, though query data remains served from Redis without downtime.

### Branch C Evaluation (In-Memory Redis Streams)
- **Pros**: Extremely low latency, lightweight setup without heavy stream-processing framework dependencies.
- **Cons**: Application worker nodes are stateful; node crashes require replaying Redis stream history, leading to cold-start delays. Hard to guarantee global exact-once windowing across worker restarts.
- **Failure Modes**: Pod restart during high volume triggers a 30-second recalculation lag, missing real-time SLA.

## 4. Pruning & Path Rejection
- **Pruned Branch A**: Discarded due to write lock contention and inability to guarantee sub-50ms P99 read latency under 50,000 events/sec ingestion load.
- **Pruned Branch C**: Discarded due to stateful pod recovery bottlenecks and risk of inaccurate metric calculations during worker failovers.

## 5. Optimal Path Synthesis & Implementation Blueprint
- **Selected Paradigm**: Branch B (Stream-Native with Kafka, Flink, and Redis).
- **Architecture**:
  1. Producers emit market events to `market.trades.v1` Kafka topic (key: `ticker_symbol`).
  2. Apache Flink job consumes stream, applies `TumblingEventTimeWindows.of(Time.seconds(300))` with 1-second slide, calculating running VWAP.
  3. Flink sinks output directly to Redis string keys (`ticker:{symbol}:vwap`) using pipelined writes.
  4. API Layer queries Redis directly via `MGET` for sub-5ms latency.
```

---

### Case Study 2: Multi-Tenant Data Isolation Strategy for Enterprise SaaS

**Scenario**: An enterprise B2B SaaS application upgrading from mid-market to Fortune 500 clients requires strict tenant data isolation, compliance with SOC2 Type II, support for custom encryption keys (BYOK), and cost-effective scaling across 5,000 tenants.

```markdown
# Tree of Thoughts Analysis: Enterprise Multi-Tenant Data Architecture

## 1. Problem Frame & Success Metrics
- **Core Challenge**: Architecting multi-tenant isolation balancing enterprise security compliance against infrastructure cost and operational overhead.
- **Key Invariants**: Zero cross-tenant data leakage under application-layer vulnerabilities, support per-tenant encryption keys (BYOK).
- **Evaluation Criteria**: Security Isolation Level, Cost Efficiency per Tenant, Schema Migration Complexity, Operational Maintenance Effort.

## 2. Divergent Branching
- **Branch A: Database-Per-Tenant (Silo Pattern)**
  Provision an isolated PostgreSQL instance (or dedicated database within a shared cluster) for every customer tenant.
- **Branch B: Shared Database with Schema-Per-Tenant (Bridge Pattern)**
  Use a single PostgreSQL cluster where each tenant is assigned an isolated database schema within the same instance.
- **Branch C: Shared Database with Row-Level Security & Application Key Encryption (Pool Pattern)**
  Store all tenant data in unified tables containing a `tenant_id` column, enforced by PostgreSQL Row Level Security (RLS) policies and field-level AES-256-GCM encryption with tenant keys fetched from AWS KMS.

## 3. Multi-Dimensional Evaluation
### Branch A Evaluation (Database-Per-Tenant)
- **Pros**: Complete physical and logical isolation. Easy BYOK implementation by encrypting dedicated storage volumes. Zero risk of cross-tenant query contamination.
- **Cons**: High idle resource cost. Running 5,000 database instances incurs massive compute waste. Schema migrations require running 5,000 parallel DDL scripts, leading to long maintenance windows.
- **Failure Modes**: Migration failures leave tenant database schemas in inconsistent versions across the fleet.

### Branch B Evaluation (Schema-Per-Tenant)
- **Pros**: Logical isolation within a single cluster. Simplifies tenant backup/dump operations compared to unified tables.
- **Cons**: PostgreSQL object limit bottlenecks (catalogs degrade when handling >10,000 schemas). Connection pooler overhead (PgBouncer struggles with distinct schema paths per tenant).

### Branch C Evaluation (Shared Database + RLS + Field Encryption)
- **Pros**: Extremely cost-efficient. Instant onboarding of new tenants. Schema migrations are a single DDL execution. RLS enforces isolation at the database engine level even if application code omits `WHERE tenant_id = ?`.
- **Cons**: Requires rigorous RLS testing. No hard compute isolation—noisy neighbor queries from Tenant X can impact performance for Tenant Y unless strict query quotas are enforced.

## 4. Pruning & Path Rejection
- **Pruned Branch B**: Discarded due to PostgreSQL catalog bloat and connection pooling degradation beyond 1,000 active schemas.
- **Pruned Branch A (for standard tiers)**: Discarded as default strategy due to prohibitive base compute costs ($5,000+ / mo idle infrastructure).

## 5. Optimal Path Synthesis & Implementation Blueprint
- **Selected Paradigm**: Tiered Hybrid Strategy (Branch C as Default Pool + Branch A for Enterprise BYOK Tier).
- **Architecture**:
  - **Standard/Professional Tier (Pool)**: Shared database cluster utilizing PostgreSQL RLS. Every session sets `SET LOCAL app.current_tenant_id = 'tenant_xyz'`. Field-level sensitive data is encrypted using envelope encryption with per-tenant KMS keys.
  - **Enterprise Dedicated Tier (Silo)**: High-value enterprise customers paying a premium are deployed to an automated dedicated database instance via Terraform modules.
```

---

### Case Study 3: Global Distributed Cache Invalidation & Consistency System

**Scenario**: An e-commerce platform with a global user base experiences severe "cache stampedes" and stale price updates during flash sales. The system must update product prices across 5 geographic AWS regions within 500ms while maintaining 99.999% cache hit ratios for product pages.

```markdown
# Tree of Thoughts Analysis: Distributed Cache Invalidation Architecture

## 1. Problem Frame & Success Metrics
- **Core Challenge**: Propagating price modifications globally with sub-500ms latency while guarding against cache stampedes during flash sale spikes.
- **Key Invariants**: Users must never complete checkout with a price older than 2 seconds; regional caches must avoid thundering herd database crashes.
- **Evaluation Criteria**: Global Propagation Speed, Cache Hit Ratio, Database Protection (Stampede Prevention), System Complexity.

## 2. Divergent Branching
- **Branch A: TTL Cache-Aside with Short Expiration & Background Refresh**
  Product pages cache data locally in Redis with a 5-second TTL. A background cron worker periodically fetches and warms keys before expiration.
- **Branch B: Event-Driven Cache Invalidation via Global Pub/Sub (AWS SNS/SQS + Redis)**
  Price change events are published to an SNS topic that fans out to SQS queues in all 5 regions. Edge API services consume SQS messages and actively delete/update local Redis keys.
- **Branch C: Two-Tier Cache with Probabilistic Early Expiration (XFetch) & Read-Through Gateway**
  Implement an L1 in-memory LRU cache inside the API gateway and L2 regional Redis. Use the XFetch algorithm to refresh keys before expiration based on request frequency, combined with CDC (Change Data Capture) via Debezium from the primary database.

## 3. Multi-Dimensional Evaluation
### Branch A Evaluation (Short TTL + Cron Warmup)
- **Pros**: Conceptual simplicity, no pub/sub infrastructure to maintain.
- **Cons**: High baseline database query load. Background cron worker cannot predict which of the 100,000 products will trend during a flash sale, causing wasted DB overhead or cold cache hits.

### Branch B Evaluation (Event-Driven SNS/SQS Invalidation)
- **Pros**: Instant invalidation propagation (typically <150ms globally). Caching remains strictly event-driven without unnecessary poll loops.
- **Cons**: If SQS consumer drops or lags, stale prices persist until TTL expires. A burst of invalidation messages during bulk inventory updates can flood edge nodes.

### Branch C Evaluation (Two-Tier + XFetch + Debezium CDC)
- **Pros**: Zero reliance on application-layer event publishing (Debezium captures raw DB transaction logs). XFetch completely prevents thundering herd stampedes by asynchronously revalidating hot keys before they expire.
- **Cons**: Significant operational footprint (Kafka Connect, Debezium, L1/L2 coordination logic).

## 4. Pruning & Path Rejection
- **Pruned Branch A**: Discarded because polling cannot guarantee sub-500ms global consistency during unpredictable flash sale price adjustments.
- **Pruned Branch C**: Discarded due to excess deployment complexity for the current team size, despite excellent theoretical properties.

## 5. Optimal Path Synthesis & Implementation Blueprint
- **Selected Paradigm**: Branch B augmented with Probabilistic Lock-Free Stampede Prevention.
- **Architecture**:
  1. Price modifications update PostgreSQL and trigger a transactional outbox event to AWS SNS.
  2. SNS propagates to regional SQS queues; regional lambda consumers invalidate local Redis keys.
  3. **Stampede Safeguard**: When a key invalidation occurs during high traffic, the first request acquires a 2-second Redis distributed lock (`SET key val NX PX 2000`) to re-query DB, while secondary requests serve stale data for 200ms instead of hammering the DB.
```

---

### Case Study 4: Next.js Enterprise State Management & Server-Client Hydration Architecture

**Scenario**: A complex SaaS analytics dashboard built with Next.js App Router requires real-time filtering, url-driven shareable state, fast initial server-side rendering (SSR), and smooth interactive charts without triggering layout shifts or double-fetching data.

```markdown
# Tree of Thoughts Analysis: Next.js State & Hydration Architecture

## 1. Problem Frame & Success Metrics
- **Core Challenge**: Managing multi-widget dashboard state with URL synchronization, SSR compatibility, and zero-redundancy data fetching.
- **Key Invariants**: Deep-linked URLs must reproduce identical dashboard view states; zero client-side layout cumulative shifts (CLS).
- **Evaluation Criteria**: SSR Hydration Velocity, URL Synchronization Rigor, Code Complexity, Bundle Size Impact.

## 2. Divergent Branching
- **Branch A: Global Client-Side Context (Zustand + React Query)**
  Fetch baseline layout on server, pass data as initial state to client-side Zustand store and React Query cache. Sync state to URL search parameters via `useRouter.push` inside useEffect hooks.
- **Branch B: URL-Driven React Server Components (nuqs + Server Actions)**
  Treat the URL search params as the single source of truth. Every filter change executes a lightweight transition using `nuqs` (Next URL Query State), triggering Server Component re-renders that stream updated chart payloads via React Suspense boundaries.
- **Branch C: Redux Toolkit + RTK Query with Hybrid SSR Hydration**
  Maintain a centralized Redux store using RTK Query's SSR hydration listeners to sync server-fetched snapshots with client-side state slices.

## 3. Multi-Dimensional Evaluation
### Branch A Evaluation (Zustand + React Query)
- **Pros**: Highly responsive client interactions. Rich client-side cache manipulation.
- **Cons**: High risk of hydration mismatch errors if client URL state diverges from server render. Duplicated fetching logic across server and client layers. Excessive `useEffect` wiring to keep URL search params in sync with Zustand.

### Branch B Evaluation (nuqs + URL-Driven RSC)
- **Pros**: Zero client-side state duplication—URL is the single source of truth. Drastically reduced JS bundle size since data processing stays in React Server Components. Bookmarkable and shareable by default.
- **Cons**: Filter changes trigger server roundtrips; requires robust client-side optimistic UI updates to maintain 60fps feel during fast slider inputs.

### Branch C Evaluation (RTK Query)
- **Pros**: Powerful dev tools, rigid state predictability.
- **Cons**: Massive boilerplate overhead, large bundle footprint, steep learning curve for team members, unnecessary complexity for mostly URL-driven state.

## 4. Pruning & Path Rejection
- **Pruned Branch C**: Discarded due to excessive boilerplate and heavy JavaScript bundle overhead for web analytics presentation layers.
- **Pruned Branch A**: Discarded due to state duplication and fragile synchronization loops between Zustand stores and URL query parameters.

## 5. Optimal Path Synthesis & Implementation Blueprint
- **Selected Paradigm**: Branch B (URL-Driven RSC via `nuqs`) with Local Optimistic State for High-Frequency Inputs.
- **Architecture**:
  1. Use `nuqs` schema definitions for search parameters (`page`, `dateRange`, `filters`).
  2. Dashboard layout rendered as RSC; data fetching occurs directly in Server Components using cached fetch requests (`unstable_cache`).
  3. High-frequency controls (e.g., date range sliders) maintain transient local React state while sliding, flushing to the URL via `useQueryState` on slider release (`onSetterComplete`).
  4. React `Suspense` skeletons wrap individual widget containers, ensuring instantaneous layout shell renders while chart data streams in.
```
