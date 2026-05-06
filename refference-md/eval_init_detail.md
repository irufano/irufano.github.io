# Detailed Explanation: `eval - init` Node in Concerto CAT (3PL + Bayesian EAP)

---

## Overview

The `eval - init` node runs **exactly once** — at the very beginning of the test, immediately after `test start`. Its sole purpose is to **initialize every variable** that will be used throughout the entire CAT session.

It is the simplest node in the flow but also the most foundational: if any variable is missing or wrongly typed here, every subsequent node will fail.

| Property | Value |
|---|---|
| **Runs** | Once only — at test start |
| **Position in flow** | `test start` → `eval - init` → `eval - select item` |
| **Purpose** | Initialize all session variables with correct types and starting values |
| **Outputs** | All variables needed by every other node |

---

## Complete R Code

```r
# ── Ability estimate ──────────────────────────────────────────────────────────
# Start at population mean θ = 0 (prior mean for Bayesian EAP)
theta    <- 0

# ── Standard error of theta estimate ─────────────────────────────────────────
# Starts high (very uncertain), decreases as more items are answered
se_theta <- 999

# ── Test control variables ────────────────────────────────────────────────────
answered  <- 0      # number of items answered so far
max_items <- 10     # fixed-length stopping rule

# ── Used item tracking ────────────────────────────────────────────────────────
# Prevents the same item from being shown twice
used_items <- numeric(0)

# ── Response history — required for Bayesian EAP ─────────────────────────────
# responses: 1 = correct, 0 = incorrect, one entry per answered item
responses <- numeric(0)

# IRT parameter history — one entry per answered item (same order as responses)
items_a   <- numeric(0)   # discrimination parameters of answered items
items_b   <- numeric(0)   # difficulty parameters of answered items
items_c   <- numeric(0)   # guessing parameters of answered items

# ── Question display variables ────────────────────────────────────────────────
correct_answer <- ""
question       <- ""
option_a       <- ""
option_b       <- ""
option_c       <- ""
option_d       <- ""
current_id     <- 0

# ── Scoring totals ────────────────────────────────────────────────────────────
total_correct <- 0
test_complete <- FALSE
```

---

## Variable-by-Variable Explanation

---

### `theta <- 0`

```r
theta <- 0
```

**What it is:**
The current ability estimate $\hat{\theta}$ — the CAT's best guess of the test-taker's true latent ability on the IRT scale.

**Why start at 0:**
In IRT, the ability scale is standardized so that the **population mean is 0** and the standard deviation is 1. Starting at $\hat{\theta}_0 = 0$ means we begin with the assumption that the test-taker has average ability — the most neutral and statistically justified starting point before any evidence is collected.

This is the **prior mean** of the Bayesian EAP estimation. The standard normal prior $\pi(\theta) = \mathcal{N}(0, 1)$ used in `eval - score` is centered at 0, so starting theta at 0 is consistent with the prior.

**What happens if we started elsewhere:**

| Starting theta | Effect |
|---|---|
| $\hat{\theta}_0 = 0$ | Neutral — most appropriate for unknown test-takers |
| $\hat{\theta}_0 = -1$ | First item will be easier than necessary — wastes 1 item |
| $\hat{\theta}_0 = +2$ | First item will be too hard — may discourage test-taker |
| $\hat{\theta}_0 = \text{prior score}$ | Efficient if we have prior information (e.g., previous test) |

**How theta evolves:**
```
Start:    theta = 0.0000  (prior mean, no data)
After Q1: theta = 0.3821  (answered correctly — ability estimate rises)
After Q2: theta = 0.1504  (answered incorrectly — estimate falls)
After Q3: theta = 0.2813  (answered correctly — rises again)
...
After Q10: theta = 0.4217  (converged estimate)
```

The EAP algorithm in `eval - score` updates this value after every response.

---

### `se_theta <- 999`

```r
se_theta <- 999
```

**What it is:**
The Standard Error of the theta estimate — a measure of how precisely we know the test-taker's ability:

$$SE(\hat{\theta}) = \frac{1}{\sqrt{\sum_{j=1}^{n} I_j(\hat{\theta})}}$$

**Why 999 and not 0, NA, or Inf:**

Before any items are answered ($n = 0$), the true SE is mathematically infinite:

$$SE = \frac{1}{\sqrt{0}} = \frac{1}{0} = \infty$$

We cannot use `Inf` directly because Concerto may corrupt infinite values during flow variable serialization. `999` is a **sentinel value** — a deliberately large finite number that means "infinitely uncertain":

| Value | Problem |
|---|---|
| `Inf` | May not serialize correctly through Concerto flow pointers |
| `NA` | Causes arithmetic errors in CI calculation: `0 ± 1.96 * NA` → `NA` |
| `0` | Implies perfect precision — dangerously wrong |
| `999` | ✅ Safely serializable, obviously not a real SE, makes all stopping rules evaluate correctly |

**Why it matters for the stopping rule:**
In `eval - score`, the SE-based stopping rule is:

```r
test_complete <- (se_theta < 0.3) | (answered >= max_items)
```

With `se_theta = 999` initially:
```r
999 < 0.3   # → FALSE  ✅ test correctly does not stop before any items
```

If `se_theta` were `0`:
```r
0 < 0.3   # → TRUE  ❌ test would immediately end with zero items answered
```

**How SE evolves:**

| After item | Typical SE | Interpretation |
|---|---|---|
| 0 (init) | **999** | Sentinel — no data |
| 1 | ~0.89 | Very uncertain |
| 3 | ~0.62 | Improving |
| 5 | ~0.48 | Acceptable |
| 7 | ~0.38 | Good |
| 10 | ~0.31 | High precision |

SE is a real EAP-computed value from item 1 onward — `999` exists only for the single moment before the first item is shown.

---

### `answered <- 0`

```r
answered <- 0
```

**What it is:**
A counter tracking how many items have been answered so far.

**Why start at 0:**
No items have been answered at test start. This counter increments by 1 in `eval - score` after each submission:

```r
# In eval - score:
answered <- as.numeric(answered) + 1
```

**How it is used:**

| Node | Use of `answered` |
|---|---|
| `showPage - question` | Displays "Question {{answered}} of {{max_items}}" |
| `eval - score` | Incremented after each response |
| `eval - score` | Used in stopping rule: `n_answered >= max_items` |
| `showPage - result` | Shows total items answered |
| `eval - compute result` | Used for percentage correct calculation |

**Why integer not logical:**
`answered` participates in arithmetic (`answered + 1`) and comparison (`answered >= max_items`), so it must be numeric. Starting as `0` (integer) ensures this.

---

### `max_items <- 10`

```r
max_items <- 10
```

**What it is:**
The **fixed-length stopping rule** threshold — the maximum number of items the test will administer.

**Why 10:**
10 is a reasonable default for a demonstration CAT. In operational CATs:

| Test type | Typical length |
|---|---|
| Demonstration / prototype | 5–10 items |
| Short-form CAT | 10–20 items |
| Standard CAT | 20–40 items |
| High-stakes certification (e.g. NCLEX) | 75–145 items |

**To change the test length:**
Simply change this one value:
```r
max_items <- 5    # short demo
max_items <- 20   # standard test
max_items <- 30   # longer assessment
```

**How it flows through the system:**

```
eval - init:     max_items = 10  (set here)
      ↓ output ↑
eval - select item: receives max_items, passes to showPage
      ↓
showPage - question: displays "Question X of 10"
      ↓
eval - score:    max_items received, used in:
                 test_complete <- n_answered >= max_items
```

**Why defined here and not hardcoded in `eval - score`:**
Centralizing configuration in `eval - init` means you only need to change one place to adjust test length. If it were hardcoded in `eval - score`, you would need to update two nodes whenever you changed the test length.

---

### `used_items <- numeric(0)`

```r
used_items <- numeric(0)
```

**What it is:**
A vector tracking the IDs of all items that have already been administered. Used in `eval - select item` to exclude already-seen items from selection.

**Why `numeric(0)` and not `c()` or `NULL`:**

| Initialization | Type | Problem |
|---|---|---|
| `c()` | NULL | `length(NULL) = 0` works, but type is ambiguous |
| `NULL` | NULL | `c(NULL, 5)` → `5` but Concerto may serialize NULL differently |
| `numeric(0)` | **numeric** | ✅ Explicitly numeric, empty vector of correct type |

Using `numeric(0)` ensures that when we later do `c(used_items, current_id)` where `current_id` is an integer, the result is always a numeric vector — never a character or list.

**How it is used in `eval - select item`:**

```r
if (length(used_items) > 0) {
  items <- items[!items$id %in% used_items, ]
}
```

On the first call: `length(numeric(0)) = 0` → condition is `FALSE` → filter skipped → all items available.

**Progression across the test:**

```r
# Before Q1:  numeric(0)         → all 10 items available
# Before Q2:  c(5)               → 9 items available
# Before Q3:  c(5, 6)            → 8 items available
# Before Q10: c(5,6,3,7,1,9,4,8,10) → 1 item remaining
```

---

### `responses <- numeric(0)`

```r
responses <- numeric(0)
```

**What it is:**
A vector storing the **binary response history** — one entry per answered item:
- `1` = correct
- `0` = incorrect

This is the $\mathbf{u} = (u_1, u_2, \ldots, u_n)$ vector in the EAP likelihood formula:

$$L(\theta_k \mid \mathbf{u}) = \prod_{j=1}^{n} P_j(\theta_k)^{u_j} [1-P_j(\theta_k)]^{1-u_j}$$

**Why this is critical for Bayesian EAP:**
Unlike Newton-Raphson (which uses only the most recent item), EAP recomputes theta from scratch after every item using **all previous responses**. Without this vector, EAP cannot function — it needs the complete response history to compute the likelihood.

**Why `numeric(0)` not `c()`:**
Same reasoning as `used_items` — explicit numeric type prevents type errors when arithmetic is performed on elements in the EAP loop.

**Progression across the test:**

```r
# Before Q1:  numeric(0)      → no responses yet
# After Q1:   c(0)            → answered incorrectly
# After Q2:   c(0, 1)         → Q2 correct
# After Q3:   c(0, 1, 1)      → Q3 correct
# After Q10:  c(0,1,1,0,1,0,1,1,0,1) → full history
```

In `eval - score`, the new response is appended:

```r
responses <- c(responses, is_correct)
```

---

### `items_a <- numeric(0)`, `items_b <- numeric(0)`, `items_c <- numeric(0)`

```r
items_a <- numeric(0)   # discrimination parameters of answered items
items_b <- numeric(0)   # difficulty parameters of answered items
items_c <- numeric(0)   # guessing parameters of answered items
```

**What they are:**
Three parallel vectors that store the IRT parameters of every item that has been answered, in the same order as `responses`.

**Why three separate vectors:**
The EAP inner loop in `eval - score` iterates over answered items and needs all three parameters for each:

```r
for (j in seq_len(n_answered)) {
  Pj <- items_c[j] + (1 - items_c[j]) / (1 + exp(-items_a[j] * (th - items_b[j])))
  ...
}
```

Storing them as separate parallel numeric vectors (rather than a data frame or list) makes element-wise access inside the loop reliable and avoids type coercion issues.

**Why `numeric(0)` not `c()`:**
The EAP code does arithmetic on these vectors (`1 - items_c[j]`, `-items_a[j] * ...`). Initializing as `numeric(0)` guarantees they are numeric before any elements are appended.

**Parallel structure — they must always have the same length:**

```r
# After 3 items (responses = c(0, 1, 1)):
items_a <- c(0.8, 1.5, 1.4)    # item 1: a=0.8, item 2: a=1.5, item 3: a=1.4
items_b <- c(-2.0, 0.0, 0.5)   # item 1: b=-2.0, etc.
items_c <- c(0.25, 0.25, 0.25)  # all 4-choice MCQ so c=0.25 for all

# Invariant: length(responses) == length(items_a) == length(items_b) == length(items_c)
```

In `eval - score`, all four vectors are appended together in the same block:

```r
responses <- c(responses, is_correct)
items_a   <- c(items_a,   a_new)
items_b   <- c(items_b,   b_new)
items_c   <- c(items_c,   c_new)
```

This guarantees the parallel structure is maintained across all iterations.

---

### Question Display Variables

```r
correct_answer <- ""
question       <- ""
option_a       <- ""
option_b       <- ""
option_c       <- ""
option_d       <- ""
current_id     <- 0
```

**What they are:**
Placeholder variables for the current item's content. These are populated by `eval - select item` before each question is shown.

**Why initialize as empty strings:**
These variables must exist as flow variables from the very first node. If they were not initialized here, `eval - select item` might receive `NULL` on the first iteration, causing errors during type conversion or string operations.

**Why `current_id <- 0` (not `numeric(0)`):**
`current_id` is used in a SQL WHERE clause in `eval - score`:

```r
paste0("SELECT * FROM item_bank_3pl WHERE id = ", current_id)
```

An ID of `0` produces valid (if harmless) SQL: `WHERE id = 0`. This will return zero rows — safely handled. By contrast, `numeric(0)` would produce `WHERE id = ` (incomplete SQL — an error).

**Flow of display variables:**

```
eval - init:          question = ""    (blank placeholder)
      ↓
eval - select item:   question = "What is 7x8?"   (filled by item selection)
      ↓
showPage - question:  {{question}} → "What is 7x8?"   (displayed to user)
      ↓
eval - score:         correct_answer used for scoring
      ↓
eval - select item:   question = "What is √169?"  (next item, overwrites)
      ↓
showPage - question:  {{question}} → "What is √169?"
```

---

### `total_correct <- 0`

```r
total_correct <- 0
```

**What it is:**
A running count of how many items the test-taker answered correctly.

**How it is updated in `eval - score`:**

```r
is_correct    <- as.integer(answer == correct_answer)
total_correct <- as.numeric(total_correct) + is_correct
```

**How it is used in `eval - compute result`:**

```r
pct_correct <- round((total_correct / answered) * 100, 1)
```

**Why this is separate from theta:**
`total_correct` is a classical test theory metric (raw score / percentage correct). Theta is an IRT metric. They measure the same construct differently:

| Metric | Type | Range | Properties |
|---|---|---|---|
| `total_correct` | Classical | 0 to `max_items` | Simple count, scale-dependent |
| `theta` | IRT | $-4$ to $+4$ | Scale-independent, comparable across test forms |

Both are reported on the results page to give test-takers a familiar score alongside the IRT estimate.

---

### `test_complete <- FALSE`

```r
test_complete <- FALSE
```

**What it is:**
A logical flag that controls whether the `if` node routes to the next item or to the results page.

**Why initialize as `FALSE`:**
At test start, the test is obviously not complete. Initializing as `FALSE` means the `if` node expression `test_complete` evaluates correctly on the first pass without errors.

**How it is updated in `eval - score`:**

```r
test_complete <- n_answered >= max_items
```

**How the `if` node uses it:**

```
test_complete = FALSE  →  if node "false" port  →  loop back to eval - select item
test_complete = TRUE   →  if node "true" port   →  go to eval - compute result
```

**Why logical not integer:**
The `if` node expression field expects a logical (`TRUE`/`FALSE`) value. If `test_complete` were an integer (`0` or `1`), the `if` node might not evaluate it correctly. Initializing as `FALSE` (logical) and keeping it as logical throughout avoids this issue.

---

## Why Every Variable Must Be Initialized Here

Concerto flow variable pointers only work for variables that **already exist** in the R session. If a variable is first created in `eval - select item` or `eval - score` (instead of `eval - init`), it will not be available as a flow variable in earlier rounds when the loop returns to that node.

The pattern is:

```
eval - init creates ALL variables with correct types
      ↓
eval - select item reads some, overwrites some, passes all forward
      ↓
showPage - question reads some, adds `answer`
      ↓
eval - score reads all, updates some, passes all forward
      ↓
if node routes based on test_complete
      ↓
loop back to eval - select item (which now has updated values from eval - score)
```

If any variable is missing from `eval - init`, the first time the loop returns to `eval - select item`, that variable will be `NULL` — causing either a silent error or a crash.

---

## Type Choices — Why They Matter

| Variable | Type | Why this type |
|---|---|---|
| `theta` | `numeric` (double) | IRT computations require decimal precision |
| `se_theta` | `numeric` (double) | SE is always a decimal; 999 is sentinel for ∞ |
| `answered` | `numeric` (integer-like) | Counter — arithmetic `+1` must work |
| `max_items` | `numeric` (integer-like) | Comparison `>= max_items` must work |
| `used_items` | `numeric(0)` (empty numeric) | `%in%` comparison with integer IDs |
| `responses` | `numeric(0)` (empty numeric) | Arithmetic in EAP loop: `u_j * log(P_j)` |
| `items_a/b/c` | `numeric(0)` (empty numeric) | Arithmetic in EAP: `exp(-a*(th-b))` |
| `question` etc | `""` (character) | Template substitution requires strings |
| `current_id` | `0` (numeric) | SQL WHERE clause concatenation |
| `total_correct` | `0` (numeric) | Arithmetic `+= is_correct` |
| `test_complete` | `FALSE` (logical) | `if` node expression evaluates logicals |

---

## Output Ports Required

Every variable initialized in `eval - init` must have a corresponding **output port with Flow variable pointer (↑)** set. Without the output port, the variable is computed locally in `eval - init` but never written to the global flow variable store — making it invisible to all subsequent nodes.

### Full output port list

| Port name | Pointed variable name | Initial value |
|---|---|---|
| `theta` | `theta` | `0` |
| `se_theta` | `se_theta` | `999` |
| `answered` | `answered` | `0` |
| `max_items` | `max_items` | `10` |
| `used_items` | `used_items` | `numeric(0)` |
| `responses` | `responses` | `numeric(0)` |
| `items_a` | `items_a` | `numeric(0)` |
| `items_b` | `items_b` | `numeric(0)` |
| `items_c` | `items_c` | `numeric(0)` |
| `correct_answer` | `correct_answer` | `""` |
| `question` | `question` | `""` |
| `option_a` | `option_a` | `""` |
| `option_b` | `option_b` | `""` |
| `option_c` | `option_c` | `""` |
| `option_d` | `option_d` | `""` |
| `current_id` | `current_id` | `0` |
| `total_correct` | `total_correct` | `0` |
| `test_complete` | `test_complete` | `FALSE` |

### How to add each port in Concerto

1. Click **red `+`** on the right side of `eval - init`
2. Type the port name (e.g. `theta`)
3. Click the port → check **Flow variable pointer**
4. Set **Pointed variable name** to the same name (`theta`)
5. Click **Save**
6. Repeat for all 18 variables above

Each port should show a **↑ arrow** when configured correctly.

---

## Full Data Flow from `eval - init`

```
test start (out) ──→ eval - init (in)
                              │
                              ↓ executes R code
                              │
              ┌───────────────┼───────────────────────────┐
              │               │                           │
              ↑ theta=0       ↑ se_theta=999              ↑ answered=0
              ↑ max_items=10  ↑ used_items=numeric(0)     ↑ responses=numeric(0)
              ↑ items_a=num(0)↑ items_b=num(0)            ↑ items_c=num(0)
              ↑ question=""   ↑ option_a=""  ...           ↑ current_id=0
              ↑ total_correct=0               ↑ test_complete=FALSE
              │
              ↓ out (execution port)
              │
      eval - select item (in)
      [reads: theta, answered, max_items, used_items via ↓ flow pointers]
```

---

## Common Mistakes and Fixes

| Mistake | Symptom | Fix |
|---|---|---|
| `used_items <- c()` instead of `numeric(0)` | Type errors in `%in%` on first loop | Use `numeric(0)` |
| `responses <- c()` instead of `numeric(0)` | EAP arithmetic fails on first item | Use `numeric(0)` |
| `se_theta <- 0` | Test immediately ends (stopping rule fires) | Use `999` |
| `se_theta <- NA` | CI calculation crashes | Use `999` |
| `test_complete <- 0` | `if` node may not evaluate correctly | Use `FALSE` (logical) |
| Missing output port for `responses` | EAP has no response history in loop | Add output port with flow pointer |
| Missing output port for `items_a/b/c` | EAP has no item parameters | Add output ports with flow pointers |
| `theta <- "0"` (string) | EAP arithmetic fails immediately | Use `0` (numeric, no quotes) |
| Not initializing display variables | `NULL` errors in `eval - select item` | Initialize all as `""` |

---

## Summary

`eval - init` is the **configuration and initialization hub** of the entire CAT session. Its design principles are:

1. **Initialize everything** — every variable used anywhere in the flow must be created here with the correct type
2. **Use safe types** — `numeric(0)` for empty vectors, `FALSE` for logicals, `0` for numeric counters
3. **Use sentinel values** — `se_theta = 999` for "not yet computed" infinity
4. **Centralize configuration** — `max_items = 10` here means one place to change test length
5. **Export everything** — every variable needs an output port with Flow variable pointer (↑)

---

## References

- Bock, R. D., & Mislevy, R. J. (1982). Adaptive EAP estimation of ability in a microcomputer environment. *Applied Psychological Measurement, 6*(4), 431–444. https://doi.org/10.1177/014662168200600405
- Lord, F. M. (1980). *Applications of Item Response Theory to Practical Testing Problems*. Lawrence Erlbaum Associates.
- Baker, F. B., & Kim, S.-H. (2004). *Item Response Theory: Parameter Estimation Techniques* (2nd ed.). Marcel Dekker.
- van der Linden, W. J., & Glas, C. A. W. (2022). *Computerized Adaptive Testing: Theory and Practice*. Kluwer Academic Publishers.
- Weiss, D. J. (n.d.). *Introduction to CAT*. IACAT. https://iacat.org/introduction-to-cat/
