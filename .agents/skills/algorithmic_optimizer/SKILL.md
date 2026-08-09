---
name: algorithmic_optimizer
description: Refactor and optimize inefficient code to achieve the lowest possible time and space complexity (e.g., O(1) or O(log n)). Make sure to use this skill whenever the user asks to "optimize this code", "make this faster", "reduce memory usage", or presents nested loops / inefficient algorithms.
---

# Algorithmic Optimizer

Transform inefficient, naive, or resource-heavy algorithms into optimal, production-grade implementations. Analyze theoretical lower bounds, choose data structures grounded in mathematical invariants, and eliminate asymptotic bottlenecks while respecting hardware realities like cache locality and allocation overhead.

## The Core Philosophy / Critical Understanding

Algorithmic optimization is not merely about replacing nested loops with library calls; it is the discipline of discovering and maintaining structural invariants within data to achieve the theoretical minimum complexity bounds of a problem.

### 1. Information-Theoretic Limits & Theoretical Lower Bounds
Before modifying code, establish the theoretical lower bound ($\Omega$-notation) of the problem. For example, sorting an arbitrary array via comparison requires $\Omega(N \log N)$ operations, whereas finding an item in an unsorted collection requires $\Omega(N)$ operations. If an algorithm performs worse than the theoretical bound (e.g., $O(N^2)$ for searching or sorting), a structural optimization exists. Recognizing these bounds prevents chasing impossible complexities or settling for suboptimal implementations.

### 2. Redundancy Elimination & Invariant Preservation
High complexity usually stems from redundant computation—re-evaluating overlapping subproblems, repeatedly traversing unindexed sequences, or failing to preserve state across iterations. Optimization shifts work from execution time to initialization or state maintenance:
- **Index/Lookup State**: Hash tables, tries, and direct-indexed arrays trade $O(N)$ auxiliary space for $O(1)$ or $O(\log N)$ point access.
- **Cumulative State**: Prefix arrays, difference arrays, and monotonic stacks/queues maintain aggregate invariants across window sweeps.
- **Subproblem State**: Dynamic programming and memoization store solved subproblem boundaries to bypass exponential recursion trees.

### 3. Asymptotic Scaling vs. Hardware Reality
Big-$O$ notation models growth rates as inputs approach infinity, but real-world execution is bound by modern hardware constraints. An $O(N)$ linear scan over a contiguous array (high L1/L2 cache hit rate, SIMD vectorization, low pointer-chasing) frequently outperforms an $O(\log N)$ tree search with poor cache locality for moderate $N$. True optimization balances asymptotic reductions ($O(N^2) \rightarrow O(N)$) with low constant factors, minimized memory allocations, and cache-friendly data layouts.

### 4. Space-Time and Amortized Trade-Offs
Optimal engineering requires evaluating the context-specific trade-offs between CPU cycles, memory usage, and operational guarantees:
- **Space vs. Time**: Sacrificing space for speed (e.g., caching, precomputed tables) vs. conserving memory in memory-constrained environments.
- **Worst-Case vs. Amortized Bounds**: Algorithms like dynamic array expansion or hash table insertion offer $O(1)$ amortized time but occasional $O(N)$ spikes, which may be unacceptable in real-time low-latency systems.

---

## Execution Strategy (The "How")

Follow a systematic five-step methodology when analyzing and optimizing code.

### Step 1: Input Scoping & Lower Bound Discovery
Deconstruct the problem constraints: input size ($N$), data distribution, update frequency vs. query frequency, and memory limits. Determine the absolute theoretical lower bound for the operation.

### Step 2: Bottleneck Profiling & Redundancy Identification
Locate the primary asymptotic bottleneck. Trace how data flows through loops, recursive calls, and allocations. Identify duplicated work:
- Are subproblems recomputed multiple times?
- Are lookups performing linear searches inside nested loops?
- Are string concatenations or array reallocations creating hidden $O(N)$ operations?

### Step 3: Multi-Paradigm Solution Synthesis
Formulate at least two distinct algorithmic paradigms to solve the bottleneck (e.g., Hash Indexing vs. Sorting + Two Pointers vs. Monotonic Queue vs. Tree Decomposition). Never settle on the first idea without contrasting alternative approaches.

### Step 4: Trade-Off Analysis & Mathematical Proof
Compare the proposed approaches mathematically. Evaluate:
- Time Complexity (Best, Average, Worst Case).
- Space Complexity (Auxiliary heap/stack space).
- Constant Factors & Cache Locality.
- Implementation Complexity & Maintainability.

### Step 5: Implementation & Edge-Case Verification
Write clean, self-contained, highly idiomatic code for the chosen approach. Ensure robust handling of edge cases (empty inputs, single elements, extreme boundaries, integer overflow, duplicate elements).

---

### Output Architecture

When presenting an optimization analysis, structure your response using these exact standard Markdown headers:

# Algorithmic Optimization Report

## Complexity Analysis
Provide a precise breakdown of the original implementation's time and space complexity, highlighting the exact lines or loops causing the bottleneck.

## Proposed Approaches
Detail at least two distinct algorithmic solutions, describing their underlying mechanisms and why they improve upon the original.

## Trade-offs
Present a comparative evaluation (preferably with a structured matrix) contrasting time bounds, auxiliary space, cache locality, and maintainability.

## Optimal Implementation
Provide production-ready, clean code implementing the selected optimal approach with full edge-case coverage and comments explaining key invariants.

---

## Critical Guidelines & Constraints

- **Focus on Asymptotic Gains First**: Prioritize reducing Big-$O$ complexity (e.g., $O(N^2) \rightarrow O(N)$) before attempting micro-optimizations (e.g., bit shifts or loop unrolling).
- **Expose Hidden Built-In Overhead**: Avoid using standard library primitives whose complexity is hidden (e.g., `item in list` in Python is $O(N)$, string concatenation `s += char` in loops is $O(N^2)$).
- **Prevent Arithmetic & Overflow Traps**: Use safe mid-point calculations like `mid = low + (high - low) // 2` to prevent integer overflow in fixed-width language environments.
- **Avoid Unnecessary Allocations**: Re-use buffers and arrays where possible, avoiding object instantiation within hot loops.
- **Maintain Code Readability**: Do not sacrifice code clarity for marginal performance gains unless explicitly operating in zero-overhead critical paths.

---

## Rich Case Studies / Examples

### Example 1: Contiguous Subarray Target Sum Query

**Input Request:**
"Optimize this function that counts how many contiguous subarrays sum up to a target integer `k`."

```python
def count_subarrays(nums, k):
    count = 0
    for i in range(len(nums)):
        for j in range(i, len(nums)):
            current_sum = 0
            for x in range(i, j + 1):
                current_sum += nums[x]
            if current_sum == k:
                count += 1
    return count
```

**Output Response:**

# Algorithmic Optimization Report

## Complexity Analysis
The existing implementation relies on three nested loops: outer loop $i$, inner loop $j$, and an innermost sum computation loop $x$. This yields a time complexity of $O(N^3)$ and a space complexity of $O(1)$. Even if simplified to two loops using cumulative sums ($O(N^2)$), it remains unviable for inputs where $N > 10^4$.

## Proposed Approaches

1. **Prefix Sum with Hash Map (Frequency Counter)**
   - Maintain a running prefix sum while iterating through the array once.
   - For a given prefix sum $S_{current}$, any previous prefix sum $S_{prev}$ satisfying $S_{current} - S_{prev} = k$ indicates a valid subarray ending at the current index.
   - Store frequency of prefix sums in a Hash Map to query $S_{prev}$ in $O(1)$ time.
   - **Time**: $O(N)$, **Space**: $O(N)$.

2. **Prefix Sum Array with Binary Search (Sorting)**
   - Precompute an array of prefix sums. If all elements in `nums` were non-negative, the prefix array would be monotonically increasing, allowing binary search ($O(N \log N)$ time).
   - However, since array elements can be negative, monotonicity does not hold, making sorting or binary search inapplicable without complex tree structures.

## Trade-offs

| Strategy | Time Complexity | Auxiliary Space | Handles Negative Numbers? | Cache Locality |
| :--- | :--- | :--- | :--- | :--- |
| **Naive Nested Loops** | $O(N^3)$ | $O(1)$ | Yes | High |
| **Prefix Sum + Hash Map** | $O(N)$ | $O(N)$ | Yes | Moderate (Hash Bucket Lookups) |
| **Segment Tree** | $O(N \log N)$ | $O(N)$ | Yes | Low (Pointer/Tree Traversals) |

## Optimal Implementation

```python
def count_subarrays(nums: list[int], k: int) -> int:
    """
    Counts contiguous subarrays summing to k in linear time using a prefix sum frequency hash map.
    """
    prefix_counts = {0: 1}  # Base case: empty prefix sum has frequency 1
    current_sum = 0
    total_count = 0

    for num in nums:
        current_sum += num
        # If (current_sum - k) exists in map, it represents valid subarrays ending here
        target_prefix = current_sum - k
        if target_prefix in prefix_counts:
            total_count += prefix_counts[target_prefix]

        # Record current prefix sum frequency
        prefix_counts[current_sum] = prefix_counts.get(current_sum, 0) + 1

    return total_count
```

---

### Example 2: Sliding Window Maximum Streaming Engine

**Input Request:**
"Optimize this function that finds the maximum value in a sliding window of size `k` moving across an array of length `N`."

```python
def max_sliding_window(nums, k):
    res = []
    for i in range(len(nums) - k + 1):
        window_max = max(nums[i:i+k])
        res.append(window_max)
    return res
```

**Output Response:**

# Algorithmic Optimization Report

## Complexity Analysis
The naive solution slices the array to extract $k$ elements and calls `max()` on each window step. Slicing creates a new array of size $k$ ($O(k)$ copy), and `max()` performs $k-1$ comparisons ($O(k)$). Across $N - k + 1$ window positions, the time complexity is $O(N \cdot k)$ with $O(k)$ auxiliary space per slice. When $k \approx N/2$, this degrades to $O(N^2)$.

## Proposed Approaches

1. **Max-Heap / Priority Queue with Lazy Deletion**
   - Store elements as `(-value, index)` pairs in a max-heap.
   - For each new element, insert into heap. Remove elements from the top of the heap if their index falls outside the current window $[i - k + 1, i]$.
   - **Time**: $O(N \log N)$ worst-case, **Space**: $O(N)$.

2. **Monotonic Double-Ended Queue (Deque)**
   - Maintain a deque storing indices of elements in decreasing order of their values.
   - As the window slides:
     1. Remove indices from the front if they expire (out of window range).
     2. Remove indices from the back if their values are less than or equal to the incoming element (maintaining monotonic order).
     3. Push the incoming element index to the back.
   - The front of the deque always holds the index of the maximum element for the current window.
   - **Time**: $O(N)$ total (each element is pushed and popped at most once), **Space**: $O(k)$.

## Trade-offs

| Approach | Time Complexity | Auxiliary Space | Operations per Element | Cache Friendliness |
| :--- | :--- | :--- | :--- | :--- |
| **Naive Slice Max** | $O(N \cdot k)$ | $O(k)$ | $k$ comparisons + allocation | Moderate |
| **Max-Heap** | $O(N \log N)$ | $O(N)$ | $\log N$ heap adjust | Low |
| **Monotonic Deque** | $O(N)$ amortized | $O(k)$ | Amortized $O(1)$ pushes/pops | High (Contiguous Deque Buffer) |

## Optimal Implementation

```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    """
    Calculates sliding window maximums in O(N) time and O(k) space using a monotonic deque.
    """
    if not nums or k == 0:
        return []

    dq = deque()  # Stores indices, maintaining monotonically decreasing values
    result = []

    for i, val in enumerate(nums):
        # 1. Remove expired indices outside window [i - k + 1, i]
        if dq and dq[0] < i - k + 1:
            dq.popleft()

        # 2. Maintain monotonicity: pop smaller elements from back
        while dq and nums[dq[-1]] <= val:
            dq.pop()

        # 3. Append current element index
        dq.append(i)

        # 4. Record result once first window is formed
        if i >= k - 1:
            result.append(nums[dq[0]])

    return result
```

---

### Example 3: Dynamic Range Minimum Query Service

**Input Request:**
"Optimize an array inspection module that frequently receives element point updates and needs to calculate range minimum queries over sub-segments `[left, right]`."

```python
class RangeQuerySystem:
    def __init__(self, data):
        self.data = list(data)

    def update(self, index, val):
        self.data[index] = val

    def query_min(self, left, right):
        return min(self.data[left:right + 1])
```

**Output Response:**

# Algorithmic Optimization Report

## Complexity Analysis
The naive implementation performs point updates in $O(1)$ time, but range minimum queries slice the array and perform a full linear scan, taking $O(N)$ time per query. For $Q$ query operations on an array of size $N$, total query time is $O(Q \cdot N)$, which leads to real-time latency bottlenecks under high query volume.

## Proposed Approaches

1. **Segment Tree**
   - Construct a balanced binary tree where leaf nodes represent array elements and internal nodes store the minimum of their child segments.
   - Point Update: Update leaf node and propagate changes up the tree ($O(\log N)$).
   - Range Query: Traverse tree nodes overlapping with `[left, right]` segment ($O(\log N)$).
   - **Time**: Build $O(N)$, Update $O(\log N)$, Query $O(\log N)$. **Space**: $O(N)$.

2. **Sparse Table (RMQ)**
   - Precompute dynamic programming table where `table[i][j]` stores minimum in range `[i, i + 2^j - 1]`.
   - Range Query: Combine two overlapping power-of-two ranges in $O(1)$ time.
   - Limitations: Point updates invalidate the entire precomputed table, requiring $O(N \log N)$ re-construction. Excellent for static arrays, poor for dynamic updates.

## Trade-offs

| Strategy | Construction Time | Update Time | Range Query Time | Auxiliary Space | Best Suited For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Naive Array Scan** | $O(1)$ | $O(1)$ | $O(N)$ | $O(1)$ | Heavy updates, minimal queries |
| **Sparse Table** | $O(N \log N)$ | $O(N \log N)$ | $O(1)$ | $O(N \log N)$ | Static array, massive query load |
| **Segment Tree** | $O(N)$ | $O(\log N)$ | $O(\log N)$ | $O(N)$ | Balanced mix of updates and queries |

## Optimal Implementation

```python
class SegmentTree:
    """
    Segment Tree supporting O(log N) point updates and range minimum queries.
    """
    def __init__(self, data: list[int]):
        self.n = len(data)
        self.tree = [0] * (4 * self.n)
        if self.n > 0:
            self._build(data, 0, 0, self.n - 1)

    def _build(self, data: list[int], node: int, start: int, end: int):
        if start == end:
            self.tree[node] = data[start]
            return
        mid = start + (end - start) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2
        self._build(data, left_child, start, mid)
        self._build(data, right_child, mid + 1, end)
        self.tree[node] = min(self.tree[left_child], self.tree[right_child])

    def update(self, index: int, val: int):
        """Updates array element at index in O(log N) time."""
        def _update(node: int, start: int, end: int):
            if start == end:
                self.tree[node] = val
                return
            mid = start + (end - start) // 2
            left_child = 2 * node + 1
            right_child = 2 * node + 2
            if start <= index <= mid:
                _update(left_child, start, mid)
            else:
                _update(right_child, mid + 1, end)
            self.tree[node] = min(self.tree[left_child], self.tree[right_child])

        _update(0, 0, self.n - 1)

    def query_min(self, left: int, right: int) -> int:
        """Calculates minimum in range [left, right] in O(log N) time."""
        def _query(node: int, start: int, end: int) -> float:
            if right < start or end < left:
                return float('inf')  # Out of bounds sentinel
            if left <= start and end <= right:
                return self.tree[node]  # Node segment fully inside query range
            mid = start + (end - start) // 2
            left_min = _query(2 * node + 1, start, mid)
            right_min = _query(2 * node + 2, mid + 1, end)
            return min(left_min, right_min)

        return int(_query(0, 0, self.n - 1))
```
