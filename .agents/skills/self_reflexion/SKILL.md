---
name: self_reflexion
description: Autonomously debug errors by reading tracebacks, finding the root cause, and backtracking logic. Make sure to use this skill whenever an error message, stack trace, or code failure is encountered.
---

# Self-Reflexion: Deep Autonomous Debugging & Causal Backtracking

## The Core Philosophy / Critical Understanding

Superficial debugging is one of the most insidious sources of technical debt in modern software engineering. When an exception occurs or a test fails, naive agents often rush to patch the symptom—wrapping calls in defensive `try/except` blocks, sprinkling optional chaining (`?.`) over uninitialized references, returning empty fallback values (`[]`, `""`, or `0`), or commenting out failing test assertions. These superficial fixes do not solve the defect; they suppress the alarm while allowing corrupt state to propagate deeper into the system, producing silent data corruption, subtle race conditions, and catastrophic downstream failures.

The self-reflexion mindset treats every error, exception, and failed assertion not as an annoying blockage to be bypassed, but as empirical evidence of a broken system invariant. Software execution is a deterministic causal graph. An error at Line $N$ of Component $B$ is rarely a flaw in Line $N$ itself; it is usually the manifestation of an invalid state introduced at Line $M$ of Component $A$ seconds, minutes, or call-stack frames earlier.

To master autonomous self-reflexion, you must embrace four core principles:

1. **Epistemic Humility Before Mutation**: Never edit a single line of code until you have reconstructed the full causal sequence from input boundary to failure site. Guessing or making trial-and-error edits distorts the code baseline and obscures the true defect.
2. **Distinguishing Symptom Site from Root Cause**: The line that throws the exception is the execution crash site—the victim of corrupted state. The root cause is the upstream origin where an invariant was broken, a contract was violated, or state was improperly mutated.
3. **Causal Backtracking**: Trace execution backward frame by frame, variable by variable, through synchronous stack frames, asynchronous promise chains, and distributed event loops until you locate the exact state transition where reality diverged from expectations.
4. **Invariant Restoration Over Symptom Suppression**: A true resolution fixes the root cause such that the invalid state becomes structurally impossible to represent or execute. If data can be null, handle the valid domain logic of missing data; if data *must never* be null, prevent the generation or flow of null values at the origin.

---

## Execution Strategy (The "How")

Debugging through self-reflexion requires a disciplined, multi-phase execution strategy. Follow this intellectual workflow systematically whenever an error, traceback, or test failure occurs.

### Phase 1: Empiricism & Raw Traceback Extraction
- **Gather Un-truncated Evidence**: Retrieve complete, raw logs, stack traces, and standard error outputs. Never diagnose based on truncated 2-line snippets or summarized exception messages.
- **Isolate the Crash Coordinates**: Extract the absolute file path, exact line number, function signature, and exception class/type.
- **Identify Bound State**: Pinpoint the precise runtime variables present at the crash site and record their evaluated values, types, and constraints at the moment of execution halt.

### Phase 2: Upstream Execution Lineage & Causal Backtracking
- **Trace the Stack Upward**: Step backward through each stack frame. For every caller function, ask: What inputs were passed? What state was expected? Where did those inputs originate?
- **Track Data Flow & Lifecycle**: Follow the target variable upstream to its initialization, mutation, or deserialization point. Inspect database queries, API responses, state manager actions, or constructor invocations.
- **Identify the Invariant Breach**: Pinpoint the exact point where an expected invariant was broken (e.g., an unvalidated API payload was stored, an async closure captured stale state, or a mutex lock was released prematurely).

### Phase 3: Hypothesis Formulation & Boundary Testing
- **Formulate a Single Causal Hypothesis**: State clearly: *"Variable X became invalid at Function Y because Condition Z occurred, leading to the failure at Line W."*
- **Verify Against Code Contracts**: Cross-reference your hypothesis with the complete schemas, interface definitions, and function signatures. Ensure you are not mistaking intentional domain edge cases for bugs.

### Phase 4: Structural Remediation & Contract Preservation
- **Design a Root-Cause Patch**: Modify the origin of the invalid state rather than suppressing the symptom at the crash site.
- **Preserve API Contracts**: Ensure signatures, return types, and expected throw behavior remain unchanged for all downstream consumers.
- **Prevent Side Effects**: Audit all alternative callers of the modified code to guarantee the fix does not introduce regressions elsewhere in the codebase.

### Phase 5: Empirical Verification & Immunity
- **Execute Verification Commands**: Run the exact build, test suite, or runtime command that previously failed. Never declare victory based on visual inspection alone.
- **Add Regression Immunization**: Write or update tests specifically targeting the root-cause boundary condition to permanently prevent recurrence.

---

## Output Architecture

When performing self-reflexion or reporting debugging outcomes, structure your findings using the following standardized Markdown headers:

```markdown
# Debugging Summary

## Root Cause Analysis
[Comprehensive narrative of the underlying defect, identifying the origin of invalid state, broken invariants, and why the system reached an invalid state.]

## Execution Lineage & Causal Chain
[Step-by-step breakdown of execution flow: Trigger -> Origin of Corruption -> Propagation Path -> Crash Site.]

## The Fix
[Detailed structural resolution strategy explaining how the invariant was restored and why symptom-patching was avoided.]

## Corrected Code
[Complete, drop-in replacement code blocks containing exact changes.]

## Verification & Invariant Proof
[Concrete command outputs, test run results, and explanation of regression safeguards.]
```

---

## Critical Guidelines & Constraints

- **Avoid Defensive Null-Checks Without Rationale**: Never insert optional chaining `?.` or default fallbacks `|| []` simply to suppress a null dereference error unless the domain spec explicitly defines missing data as a valid state. If data is required, fix why it was omitted upstream.
- **Do Not Swallow Exceptions**: Wrapping failing async promises or database calls in empty `catch {}` blocks is strictly forbidden. Exceptions must be handled, transformed into domain errors, or propagated with context.
- **Maintain Execution Traces Across Boundaries**: When tracking errors across IPC, HTTP APIs, or worker threads, trace context variables (correlation IDs, payload schemas) across boundary boundaries.
- **Avoid Modifying Test Assertions to Match Broken Code**: Never change a test's expected outcome or comment out a failing test to achieve a passing suite. Fix the application logic to satisfy the test contract.
- **Resist Snippet Tunnel Vision**: Always inspect surrounding file contexts, schema definitions, and imported utilities before modifying code.

---

## Rich Case Studies & Examples

### Case Study 1: Asynchronous State Race Condition & Stale Closure in React/TypeScript

#### Scenario
A user analytics dashboard crashes intermittently with `TypeError: Cannot read properties of undefined (reading 'totalVolume')` when switching rapidly between different time-range tabs (e.g., "7 Days", "30 Days", "1 Year").

#### Debugging Analysis & Self-Reflexion

# Debugging Summary

## Root Cause Analysis
The crash occurs because of a race condition between asynchronous data fetching hooks and component unmount/re-render cycles. When the user switches tabs rapidly, multiple concurrent `fetchMetrics(range)` requests are dispatched. When a slower response from a previously selected tab resolves after a faster response from the currently active tab, the state update hook overwrites active metrics with stale or canceled payload structures where `metricsData` is undefined due to abort controllers. The root cause is uncancelled stale promise resolutions mutating state out of temporal order, violating state ordering invariants.

## Execution Lineage & Causal Chain
1. User clicks "30 Days" tab -> Dispatches `fetchMetrics('30d')` (Request A, latency 800ms).
2. User clicks "7 Days" tab -> Dispatches `fetchMetrics('7d')` (Request B, latency 150ms).
3. Request B resolves -> `setMetricsData(responseB)` updates state with valid 7-day data. Component renders successfully.
4. Request A resolves 650ms later -> Stale closure invokes `setMetricsData(responseA)`. However, Request A was aborted by the network layer, returning an unhandled `{ aborted: true, data: undefined }` structure.
5. `metricsData` becomes `{ aborted: true, data: undefined }`.
6. Component attempts to render `metricsData.data.totalVolume`, triggering `TypeError: Cannot read properties of undefined (reading 'totalVolume')` at `MetricsOverview.tsx:84`.

## The Fix
Rather than wrapping `metricsData.data.totalVolume` in optional chaining (`metricsData?.data?.totalVolume`), which would leave the dashboard showing blank stale metrics, we resolve the root cause:
1. Implement an `AbortController` bound to the `useEffect` cleanup function to instantly cancel pending network requests when tab state changes.
2. Maintain a request sequence counter / cancellation token inside the effect closure to guarantee that out-of-order asynchronous responses are discarded before state mutation occurs.

## Corrected Code

```typescript
// src/components/MetricsOverview.tsx
import React, { useState, useEffect } from 'react';
import { fetchMetrics, MetricsResponse } from '../api/metrics';

interface MetricsOverviewProps {
  timeRange: string;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ timeRange }) => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    async function loadMetrics() {
      try {
        const data = await fetchMetrics(timeRange, { signal: controller.signal });
        if (isCurrent) {
          setMetrics(data);
          setError(null);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isCurrent) {
          setError(err);
        }
      }
    }

    loadMetrics();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [timeRange]);

  if (error) return <ErrorMessage error={error} />;
  if (!metrics) return <LoadingSpinner />;

  return (
    <div className="metrics-card">
      <h3>Total Volume</h3>
      <p>{metrics.totalVolume.toLocaleString()}</p>
    </div>
  );
};
```

## Verification & Invariant Proof
- Verified by simulating high-latency network responses (800ms vs 100ms) with rapid tab switching in React Testing Library. Out-of-order responses were correctly discarded, `setMetrics` was invoked strictly for the active tab request, and zero unhandled rendering exceptions occurred across 100 automated iterations.

---

### Case Study 2: Distributed Connection Pool Exhaustion & Silent Context Deadlock in Go

#### Scenario
A backend microservice serving transaction processing experiences catastrophic slowdowns under load, eventually crashing with `http: Handler timeout error` and database connection failures (`driver: bad connection`).

#### Debugging Analysis & Self-Reflexion

# Debugging Summary

## Root Cause Analysis
The service leaks database connections during error handling paths within nested transaction blocks. When a SQL query within `ProcessPaymentTransaction` fails due to a constraint violation or context timeout, the function returns an `error` immediately without calling `tx.Rollback()`. Because the database connection remains checked out from the `sql.DB` connection pool in a pending transaction state, the pool reaches max capacity (`MaxOpenConns = 25`) within seconds of high traffic. Subsequent incoming HTTP requests block indefinitely waiting for an available connection until the HTTP server context times out. The root cause is a failure to guarantee transaction cleanup via deferred rollbacks on early function return paths.

## Execution Lineage & Causal Chain
1. HTTP handler receives `POST /transactions` and initiates a context with a 5-second deadline.
2. Handler acquires DB connection from pool and calls `db.BeginTx(ctx, nil)`.
3. An intermediate SQL statement within `ProcessPaymentTransaction` fails due to a foreign key constraint.
4. Function returns `fmt.Errorf("insert payment failed: %w", err)` immediately.
5. The `defer tx.Rollback()` was missing. The connection is never returned to the pool.
6. Next 25 requests repeat this flow, acquiring all 25 available connections in the pool.
7. 26th request calls `db.BeginTx()`, blocking forever until context deadline expires. Server thread pool depletes, causing system-wide HTTP 504 Gateway Timeouts.

## The Fix
We do not resolve this by increasing the database pool limit or catching HTTP handler timeouts. Instead, we enforce transaction lifecycle invariants:
1. Immediately after calling `db.BeginTx()`, defer a rollback closure: `defer tx.Rollback()`.
2. Standard SQL driver behavior makes `tx.Rollback()` a safe no-op if `tx.Commit()` has already been successfully invoked.
3. Explicitly inspect context cancellation state before executing long-running transactional queries.

## Corrected Code

```go
// pkg/repository/transaction.go
package repository

import (
	"context"
	"database/sql"
	"fmt"
)

type TxManager struct {
	db *sql.DB
}

func (m *TxManager) ProcessPaymentTransaction(ctx context.Context, accountID string, amount float64) error {
	tx, err := m.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Defer rollback immediately. If tx.Commit() succeeds later, tx.Rollback() returns sql.ErrTxDone and is safely ignored.
	defer func() {
		_ = tx.Rollback()
	}()

	// Execute balance deduction
	res, err := tx.ExecContext(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1", amount, accountID)
	if err != nil {
		return fmt.Errorf("failed to deduct balance: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to verify rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("insufficient funds or account not found")
	}

	// Execute ledger record insertion
	_, err = tx.ExecContext(ctx, "INSERT INTO ledger_entries (account_id, amount, type) VALUES ($1, $2, 'DEBIT')", accountID, amount)
	if err != nil {
		return fmt.Errorf("failed to record ledger entry: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
```

## Verification & Invariant Proof
- Stress-tested using `hey -c 50 -n 1000` with simulated database constraint failures. DB pool active connections remained strictly within bounds ($\le 5$ connections in use at peak), connection reuse reached 100%, and zero connection leak timeouts occurred.

---

### Case Study 3: Memory Corruption & Lifetime Mismanagement in a Multi-threaded C++ Worker

#### Scenario
A real-time audio processing pipeline crashes intermittently with `SIGSEGV` (segmentation fault) at memory address `0x000000000008` during high throughput message processing.

#### Debugging Analysis & Self-Reflexion

# Debugging Summary

## Root Cause Analysis
The crash is caused by a Use-After-Free (UAF) race condition in `AudioStreamBuffer`. A worker thread executing `ProcessAudioFrame` accesses a raw pointer to an `AudioBuffer` object that was deallocated on the main thread during dynamic buffer re-allocation. When audio sample rate changes occur, the main thread frees the underlying buffer memory without acquiring the reader mutex or synchronizing with active worker threads. The raw pointer held by the worker becomes dangling, and dereferencing it triggers a kernel memory access violation (`SIGSEGV`). The root cause is shared mutable state governed by raw pointers without shared ownership primitives or mutex synchronization.

## Execution Lineage & Causal Chain
1. Main Thread handles sample rate change event: Calls `ReallocateBuffer(newSize)`.
2. Main Thread executes `delete[] m_rawBuffer;` and assigns `m_rawBuffer = new double[newSize];`.
3. Worker Thread concurrently executes `ProcessAudioFrame()`:
   Reads `m_rawBuffer[i]` using an old offset captured prior to reallocation.
4. Worker Thread dereferences dangling pointer `0x000000000008` (freed memory block).
5. Operating system emits `SIGSEGV`, halting process execution immediately.

## The Fix
1. Replace raw pointer management with modern C++ smart pointers (`std::shared_ptr` / `std::atomic<std::shared_ptr>`) to guarantee lifetime extended access during active frame processing.
2. Implement `std::shared_mutex` to allow concurrent multi-threaded reads while acquiring exclusive write locks during reallocation.

## Corrected Code

```cpp
// src/audio/AudioStreamBuffer.hpp
#pragma once

#include <vector>
#include <memory>
#include <shared_mutex>
#include <stdexcept>

class AudioStreamBuffer {
private:
    std::shared_ptr<std::vector<float>> m_buffer;
    mutable std::shared_mutex m_mutex;

public:
    explicit AudioStreamBuffer(size_t initialSize) 
        : m_buffer(std::make_shared<std::vector<float>>(initialSize, 0.0f)) {}

    void ReallocateBuffer(size_t newSize) {
        // Acquire exclusive write lock to prevent concurrent reader access during reallocation
        std::unique_lock<std::shared_mutex> lock(m_mutex);
        auto newBuffer = std::make_shared<std::vector<float>>(newSize, 0.0f);
        // Copy existing frame data if needed
        std::copy(m_buffer->begin(), m_buffer->begin() + std::min(m_buffer->size(), newSize), newBuffer->begin());
        m_buffer = std::move(newBuffer);
    }

    void ProcessAudioFrame(size_t frameOffset, size_t frameLength, std::vector<float>& output) {
        std::shared_ptr<std::vector<float>> localBuffer;
        {
            // Acquire shared read lock to safely snapshot shared pointer
            std::shared_lock<std::shared_mutex> lock(m_mutex);
            localBuffer = m_buffer; // Increments reference count safely
        }

        if (!localBuffer || frameOffset + frameLength > localBuffer->size()) {
            throw std::out_of_range("Audio frame boundaries out of bounds");
        }

        // Thread safe reading from shared_ptr lifetime extension
        for (size_t i = 0; i < frameLength; ++i) {
            output[i] = (*localBuffer)[frameOffset + i];
        }
    }
};
```

## Verification & Invariant Proof
- Processed 100,000 concurrent buffer reallocations across 16 thread worker loops under ThreadSanitizer (`TSAN`). Zero data races, zero dangling pointer dereferences, and zero segmentation faults were reported.
