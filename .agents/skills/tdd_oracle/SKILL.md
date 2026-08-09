---
name: tdd_oracle
description: Ensure code is unbreakable by strictly following Test-Driven Development (TDD). Make sure to use this skill whenever the user asks you to implement a core logic feature, handle edge cases, or write reliable code, even if they don't explicitly mention TDD or tests.
---

# TDD Oracle

## The Core Philosophy / Critical Understanding

Test-Driven Development (TDD) is not merely a post-hoc testing methodology; it is a fundamental software design discipline. When an engineer or AI agent writes implementation code prior to defining executable tests, cognitive confirmation bias inevitably creeps in. Implementation written first is subtly shaped around intuitive assumptions of how the system *should* function under happy-path conditions, causing boundary failures, unhandled exceptions, and brittle architecture to remain hidden until late integration or production deployment.

The **TDD Oracle** mindset completely inverts this paradigm by treating tests as executable software specifications. A test suite crafted prior to implementation acts as an unyielding contract that specifies system behavior entirely from the perspective of the interface consumer. By requiring the specification to exist first, you force domain boundaries to be clarified, eliminate ambient state dependencies, and establish unambiguous error-handling contracts.

### Key Pillars of the TDD Oracle Mindset:
- **Specification over Verification**: Tests define *what* the system must achieve before deciding *how* to achieve it. The test suite serves as the single source of truth for all requirements and invariants.
- **Minimal Implementation Discipline**: Once the test suite is established, write only the simplest, cleanest code required to satisfy the suite. Resisting premature abstraction or speculative features prevents unnecessary complexity and bloat.
- **Red-Green-Refactor Integrity**: First, define expected behavior through failing specifications (Red); second, produce functional implementation code that passes all tests (Green); third, refactor code structure and performance while maintaining 100% test suite compliance (Refactor).
- **Edge-First Design**: Critical bugs inevitably lurk in boundary conditions—null references, empty collections, numeric overflows, rate limit bursts, concurrent state mutations, and network timeouts. Designing test specifications around edge conditions first builds resilient, production-grade software architecture.

---

## Execution Strategy (The "How")

To execute the TDD Oracle process effectively, follow this multi-phase workflow for any core feature, refactoring, or logic implementation request.

### Phase 1: Requirements Deconstruction & Domain Mapping
Before authoring any code or tests, systematically decompose the request into atomic behavioral assertions:
1. **Identify Input Boundaries**: Analyze valid parameter ranges, unexpected types, null/empty collections, zero values, and extreme magnitudes.
2. **Identify State & Side Effects**: Map internal state mutations, database persistence operations, event emissions, and external API calls.
3. **Identify Failure Modes & Exceptions**: Establish clear contracts for validation failures, timeout handling, resource exhaustion, and domain-specific errors.
4. **Define Invariants**: Formulate algebraic properties and structural constraints that must hold true before, during, and after execution.

### Phase 2: Formulate the Test Specification Suite
Draft a comprehensive unit test suite using the standard test runner appropriate for the target language (e.g., PyTest, Jest, Vitest, JUnit, Go `testing`).
- Structure tests cleanly using the **AAA (Arrange-Act-Assert)** pattern.
- Categorize test suites logically: Happy Path, Boundary & Limits, Exception & Error Handling, and State Isolation.
- Focus assertions on **observable behavior and outputs**, rather than internal private state or non-essential implementation details.

### Phase 3: Present Proposed Test Suite & Seek User Confirmation
Present the complete executable test specification to the user before introducing implementation code. Highlight how specific test cases correspond to business constraints and edge scenarios, and request review or verification before proceeding to implementation.

### Phase 4: Write Minimal Satisfying Implementation
With the test suite confirmed:
1. Write the minimal logic necessary to make all test cases pass cleanly.
2. Avoid speculative feature additions, extra un-tested helper methods, or un-requested abstractions.
3. Guarantee that every code branch in the implementation is directly exercised by at least one test case.

### Phase 5: Refactor & Harden
With a green test suite establishing a safe safety net:
1. Simplify complex conditional logic, remove duplication, and optimize data structures.
2. Enhance naming clarity, type annotations, and docstrings.
3. Verify that all test cases execute deterministically, independently, and in parallel without shared state leakage.

---

## Output Architecture

When exercising the TDD Oracle skill, format outputs using the following standardized Markdown structure:

### 1. Domain Specification & Behavior Analysis
- Highlighting input boundaries, invariants, state transformations, and failure modes.

### 2. Proposed Unit Test Specification
- Containing executable, production-grade test cases utilizing language-idiomatic testing frameworks.

### 3. Coverage & Boundary Matrix
- A structured mapping of test functions against happy-path scenarios, boundary limits, and negative test cases.

### 4. Implementation Phase & Verification
- Minimal implementation code paired with test execution status proving all tests pass.

---

## Critical Guidelines & Constraints

### Anti-Patterns to Avoid
- **Implementation Leakage**: Writing tests that rely on private fields, private methods, or internal state variables instead of inspecting public outputs and state transitions.
- **Tautological Assertions**: Writing meaningless assertions (e.g., `assert result == result` or mocking out the logic under test) that pass regardless of logic flaws.
- **Writing Implementation First**: Authoring business logic before defining and verifying the test suite contract.
- **Over-Mocking**: Mocking out domain logic or pure functions; mocks should be reserved primarily for external IO boundaries, network calls, or non-deterministic primitives (time, randomness).
- **Happy-Path Blindness**: Crafting multiple tests for standard inputs while failing to test nulls, empty arrays, edge numbers, timeout conditions, or concurrent calls.

### Style & Operational Directives
- Write highly descriptive test method names that explicitly articulate expected behavior (e.g., `test_calculate_tax_should_raise_value_error_when_rate_is_negative`).
- Maintain strict test isolation: ensure no test relies on static state, global variables, or specific execution ordering.
- Keep assertions targeted and single-focused per test method to make test failures immediately diagnostic.

---

## Rich Case Studies / Examples

### Example 1: Financial Tiered Discount Engine (Python / PyTest)

**Context:** The system requires a financial discount calculator that calculates tiered percentage discounts based on user loyalty tier and purchase total, with extra stackable incentives and precision rounding rules.

**Phase 1: Domain Analysis & Edge Case Discovery**
- Standard tier rates: `BRONZE` (5%), `SILVER` (10%), `GOLD` (15%), `PLATINUM` (20%).
- High-value order rule: Orders exceeding $1,000.00 receive an additional 5% stackable discount.
- Edge & Error handling: Negative amounts must raise `ValueError`. Orders with 0.00 total must return 0 discount cleanly. Money computations must use `Decimal` with `ROUND_HALF_EVEN` rounding to prevent floating-point drift.

**Phase 2: Proposed Test Specification**

```python
import pytest
from decimal import Decimal
from discount_engine import calculate_discount, LoyaltyTier, DiscountResult

class TestDiscountEngine:
    def test_bronze_tier_standard_order(self):
        """Standard order for BRONZE tier receives base 5% discount."""
        result = calculate_discount(order_total=Decimal("200.00"), tier=LoyaltyTier.BRONZE)
        assert result.discount_amount == Decimal("10.00")
        assert result.final_total == Decimal("190.00")

    def test_gold_tier_high_value_order_stackable_discount(self):
        """GOLD tier (15%) with > $1000 order gets additional 5% stackable discount (20% total)."""
        result = calculate_discount(order_total=Decimal("1500.00"), tier=LoyaltyTier.GOLD)
        assert result.discount_amount == Decimal("300.00")
        assert result.final_total == Decimal("1200.00")

    def test_zero_amount_order_returns_zero_discount(self):
        """Zero order total produces zero discount without raising an exception."""
        result = calculate_discount(order_total=Decimal("0.00"), tier=LoyaltyTier.SILVER)
        assert result.discount_amount == Decimal("0.00")
        assert result.final_total == Decimal("0.00")

    def test_negative_order_total_raises_value_error(self):
        """Negative order total must raise a ValueError with descriptive text."""
        with pytest.raises(ValueError, match="Order total cannot be negative"):
            calculate_discount(order_total=Decimal("-50.00"), tier=LoyaltyTier.BRONZE)

    def test_precision_rounding_to_two_decimal_places(self):
        """Discounts with fractional cents must round cleanly using HALF_EVEN."""
        result = calculate_discount(order_total=Decimal("33.33"), tier=LoyaltyTier.BRONZE)
        # 5% of 33.33 = 1.6665 -> rounds to 1.67
        assert result.discount_amount == Decimal("1.67")
        assert result.final_total == Decimal("31.66")
```

**Phase 3: Minimal Implementation**

```python
from decimal import Decimal, ROUND_HALF_EVEN
from enum import Enum
from dataclasses import dataclass

class LoyaltyTier(Enum):
    BRONZE = Decimal("0.05")
    SILVER = Decimal("0.10")
    GOLD = Decimal("0.15")
    PLATINUM = Decimal("0.20")

@dataclass(frozen=True)
class DiscountResult:
    discount_amount: Decimal
    final_total: Decimal

def calculate_discount(order_total: Decimal, tier: LoyaltyTier) -> DiscountResult:
    if order_total < Decimal("0.00"):
        raise ValueError("Order total cannot be negative")
    
    rate = tier.value
    if order_total > Decimal("1000.00"):
        rate += Decimal("0.05")
        
    raw_discount = order_total * rate
    discount_amount = raw_discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
    final_total = order_total - discount_amount
    
    return DiscountResult(discount_amount=discount_amount, final_total=final_total)
```

---

### Example 2: Circuit Breaker Resilience State Machine (TypeScript / Vitest)

**Context:** Implement a resilience Circuit Breaker state machine for microservice API calls that transitions between `CLOSED`, `OPEN`, and `HALF_OPEN` states based on error thresholds and cooldown intervals.

**Phase 1: Domain Analysis & Edge Case Discovery**
- Initial state: `CLOSED`.
- Failure Threshold: Reaching 3 consecutive function call failures transitions the circuit state to `OPEN`.
- Fail-Fast Mechanism: When in `OPEN` state, calls fail fast immediately throwing `CircuitOpenError` without calling the downstream service.
- Cooldown & Recovery: After `cooldownMs` elapses, the state becomes `HALF_OPEN`. A trial call in `HALF_OPEN` state resets circuit to `CLOSED` upon success or immediately reverts to `OPEN` upon failure.

**Phase 2: Proposed Test Specification**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitOpenError, CircuitState } from './CircuitBreaker';

describe('CircuitBreaker State Machine Specification', () => {
  let breaker: CircuitBreaker;
  const cooldownMs = 5000;

  beforeEach(() => {
    vi.useFakeTimers();
    breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs });
  });

  it('starts in CLOSED state and passes through successful calls', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await breaker.execute(fn);
    
    expect(result).toBe('success');
    expect(breaker.state).toBe(CircuitState.CLOSED);
  });

  it('transitions to OPEN state after reaching failure threshold', async () => {
    const failureFn = vi.fn().mockRejectedValue(new Error('Downstream Outage'));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failureFn)).rejects.toThrow('Downstream Outage');
    }

    expect(breaker.state).toBe(CircuitState.OPEN);
  });

  it('fails fast when OPEN without attempting downstream function execution', async () => {
    const failureFn = vi.fn().mockRejectedValue(new Error('Downstream Outage'));
    for (let i = 0; i < 3; i++) { await breaker.execute(failureFn).catch(() => {}); }

    const targetFn = vi.fn().mockResolvedValue('ok');
    await expect(breaker.execute(targetFn)).rejects.toThrow(CircuitOpenError);
    expect(targetFn).not.toHaveBeenCalled();
  });

  it('transitions to HALF_OPEN when cooldown timer expires', async () => {
    const failureFn = vi.fn().mockRejectedValue(new Error('Downstream Outage'));
    for (let i = 0; i < 3; i++) { await breaker.execute(failureFn).catch(() => {}); }

    vi.advanceTimersByTime(cooldownMs + 100);

    expect(breaker.state).toBe(CircuitState.HALF_OPEN);
  });

  it('resets to CLOSED when request succeeds while in HALF_OPEN state', async () => {
    const failureFn = vi.fn().mockRejectedValue(new Error('Downstream Outage'));
    for (let i = 0; i < 3; i++) { await breaker.execute(failureFn).catch(() => {}); }
    vi.advanceTimersByTime(cooldownMs + 100);

    const successFn = vi.fn().mockResolvedValue('recovered');
    const result = await breaker.execute(successFn);

    expect(result).toBe('recovered');
    expect(breaker.state).toBe(CircuitState.CLOSED);
  });

  it('immediately returns to OPEN state if trial call fails in HALF_OPEN state', async () => {
    const failureFn = vi.fn().mockRejectedValue(new Error('Downstream Outage'));
    for (let i = 0; i < 3; i++) { await breaker.execute(failureFn).catch(() => {}); }
    vi.advanceTimersByTime(cooldownMs + 100);

    await expect(breaker.execute(failureFn)).rejects.toThrow('Downstream Outage');
    expect(breaker.state).toBe(CircuitState.OPEN);
  });
});
```

---

### Example 3: Sliding Window Rate Limiter (Go / `testing`)

**Context:** Build a thread-safe sliding window log rate limiter that restricts client request rates per key across a moving time window.

**Phase 1: Domain Analysis & Edge Case Discovery**
- Rule: Allow up to `N` requests per client key within time window `W`.
- Eviction: Request timestamps older than `currentTime - W` must be purged from the active window log.
- Thread Safety: Rate evaluation and timestamp logging must operate safely across concurrent goroutines without race conditions.

**Phase 2: Proposed Test Specification**

```go
package ratelimit

import (
	"sync"
	"testing"
	"time"
)

func TestRateLimiter_AllowsRequestsWithinLimit(t *testing.T) {
	limiter := NewSlidingWindowLimiter(3, 1*time.Second)
	now := time.Now()

	for i := 0; i < 3; i++ {
		if !limiter.AllowAt("user-1", now) {
			t.Errorf("expected request %d to be allowed", i+1)
		}
	}
}

func TestRateLimiter_RejectsExceedingRequests(t *testing.T) {
	limiter := NewSlidingWindowLimiter(2, 1*time.Second)
	now := time.Now()

	limiter.AllowAt("user-1", now)
	limiter.AllowAt("user-1", now)

	if limiter.AllowAt("user-1", now) {
		t.Errorf("expected 3rd request in window to be rejected")
	}
}

func TestRateLimiter_EvictsExpiredLogsAfterWindowPasses(t *testing.T) {
	limiter := NewSlidingWindowLimiter(2, 1*time.Second)
	now := time.Now()

	limiter.AllowAt("user-1", now)
	limiter.AllowAt("user-1", now)

	// Advance timestamp beyond the 1-second window
	later := now.Add(1100 * time.Millisecond)

	if !limiter.AllowAt("user-1", later) {
		t.Errorf("expected request to be allowed after window expired")
	}
}

func TestRateLimiter_ThreadSafetyUnderConcurrentRequests(t *testing.T) {
	limiter := NewSlidingWindowLimiter(100, 1*time.Second)
	now := time.Now()

	var wg sync.WaitGroup
	allowedCount := 0
	var mu sync.Mutex

	for i := 0; i < 150; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if limiter.AllowAt("concurrent-user", now) {
				mu.Lock()
				allowedCount++
				mu.Unlock()
			}
		}()
	}

	wg.Wait()
	if allowedCount != 100 {
		t.Errorf("expected exactly 100 allowed requests under concurrent load, got %d", allowedCount)
	}
}
```
