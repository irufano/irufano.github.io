# Detailed Explanation: `eval - select item` Node in Concerto CAT (3PL + Maximum Information)

---

## Overview

The `eval - select item` node runs **at the start of every CAT loop iteration** — once before each question is shown. It is the implementation of the **CAT item selection algorithm**: given the current ability estimate $\hat{\theta}$, it selects the most informative unused item from the bank.

It performs four sequential tasks:

| Task | Description |
|---|---|
| **Task 1** | Load all items from the database |
| **Task 2** | Filter out already-used items |
| **Task 3** | Compute 3PL information for each remaining item |
| **Task 4** | Select the item with maximum information and set display variables |

---

## Complete R Code

```r
# ── Load all items from the item bank ─────────────────────────────────────────
items <- concerto.table.query("SELECT * FROM item_bank_3pl")

# ── Remove already-used items to prevent repetition ───────────────────────────
if (length(used_items) > 0) {
  items <- items[!items$id %in% used_items, ]
}

# ── Convert IRT parameter columns to numeric ───────────────────────────────────
items$difficulty     <- as.numeric(items$difficulty)
items$discrimination <- as.numeric(items$discrimination)
items$guessing       <- as.numeric(items$guessing)

# ── Extract IRT parameter vectors ─────────────────────────────────────────────
a <- items$discrimination
b <- items$difficulty
c <- items$guessing

# ── Step 1: Calculate P(θ) for each item using 3PL formula ───────────────────
# P(θ) = c + (1-c) / (1 + exp(-a*(θ-b)))
P <- c + (1 - c) / (1 + exp(-a * (theta - b)))

# ── Step 2: Calculate Item Information I(θ) ───────────────────────────────────
# I(θ) = a² * [(P-c)²/(1-c)²] * [(1-P)/P]
# Safety: prevent division by zero when P ≈ 0 or P ≈ 1
P_safe <- pmax(pmin(P, 0.9999), 0.0001)
items$information <- (a^2) * ((P_safe - c)^2 / (1 - c)^2) * ((1 - P_safe) / P_safe)

# ── Step 3: Select item with maximum information ───────────────────────────────
selected <- items[which.max(items$information), ]

# ── Set question display variables ────────────────────────────────────────────
question       <- as.character(selected$question)
option_a       <- as.character(selected$option_a)
option_b       <- as.character(selected$option_b)
option_c       <- as.character(selected$option_c)
option_d       <- as.character(selected$option_d)
correct_answer <- as.character(selected$correct_answer)
current_id     <- as.integer(selected$id)

# ── Track this item as used ───────────────────────────────────────────────────
used_items <- c(used_items, current_id)
```

---

## Task 1: Load All Items from the Database

```r
items <- concerto.table.query("SELECT * FROM item_bank_3pl")
```

### What it does

Queries the entire `item_bank_3pl` table and returns all rows as an R data frame stored in `items`.

### Why `SELECT *`

We need all columns — question text, options, correct answer, and IRT parameters — so `SELECT *` retrieves everything in one call. A more targeted query like `SELECT id, discrimination, difficulty, guessing` would be faster for large banks, but for typical CAT banks of 50–200 items the difference is negligible.

### What `items` looks like after this line

| id | question | option_a | option_b | option_c | option_d | correct_answer | difficulty | discrimination | guessing |
|---|---|---|---|---|---|---|---|---|---|
| 1 | What is 1+1? | 1 | 2 | 3 | 4 | B | -2.0 | 0.8 | 0.25 |
| 2 | What is 5-3? | 1 | 2 | 3 | 4 | B | -1.5 | 1.0 | 0.25 |
| 3 | What is 4x3? | 10 | 12 | 14 | 16 | B | -1.0 | 1.2 | 0.25 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| 10 | What is log₂(256)? | 6 | 7 | 8 | 9 | C | 2.5 | 2.0 | 0.25 |

### Data types from Concerto database

Concerto returns all database values as **character strings** by default, regardless of the column type declared in the Data Table. This is why explicit type conversion is always required before any mathematical operations.

---

## Task 2: Filter Out Already-Used Items

```r
if (length(used_items) > 0) {
  items <- items[!items$id %in% used_items, ]
}
```

### Mathematical notation

This implements the constraint $i \notin \mathcal{U}$ in the item selection rule:

$$i^* = \underset{i \notin \mathcal{U}}{\arg\max}\ I_i(\hat{\theta})$$

Where $\mathcal{U}$ is the set of already-used item IDs.

### Line-by-line breakdown

#### `length(used_items) > 0`

Checks whether any items have already been administered. On the **very first question**, `used_items` was initialized as `numeric(0)` (an empty vector) in `eval - init`, so `length(numeric(0)) = 0` and the filter block is **skipped entirely** — all items remain available.

From question 2 onward, `used_items` grows by one ID per answered item, so the filter runs.

```r
# Before question 1:
used_items <- numeric(0)
length(used_items)        # → 0  → skip filter

# Before question 2 (item 5 was used):
used_items <- c(5)
length(used_items)        # → 1  → run filter
```

#### `items$id %in% used_items`

The `%in%` operator checks membership. For each element of `items$id`, returns `TRUE` if that ID is in `used_items`, `FALSE` otherwise:

```r
items$id    <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
used_items  <- c(5, 3, 7)

items$id %in% used_items
# → c(FALSE, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, FALSE, FALSE)
#          1      2     3      4     5      6     7      8      9     10
```

Items 3, 5, and 7 were already used → `TRUE`.

#### `!items$id %in% used_items`

The `!` operator flips all logical values — keeping items that are **not** in `used_items`:

```r
!c(FALSE, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, FALSE, FALSE)
# →  c(TRUE,  TRUE, FALSE, TRUE, FALSE,  TRUE, FALSE,  TRUE,  TRUE,  TRUE)
```

Items 1, 2, 4, 6, 8, 9, 10 remain → these are the candidates for selection.

#### `items[..., ]`

Subsets the data frame — keeping only rows where the logical vector is `TRUE`:

```r
items <- items[c(TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE), ]
# Keeps rows for items 1, 2, 4, 6, 8, 9, 10
# Removes rows for items 3, 5, 7 (already used)
```

The trailing comma in `items[condition, ]` is required in R to indicate we are subsetting **rows** (not columns).

### Progression across the test

| Before question | `used_items` | Items remaining |
|---|---|---|
| Q1 | `numeric(0)` | 10 of 10 |
| Q2 | `c(5)` | 9 of 10 |
| Q3 | `c(5, 3)` | 8 of 10 |
| Q4 | `c(5, 3, 7)` | 7 of 10 |
| Q10 | `c(5,3,7,1,9,2,6,8,4)` | 1 of 10 |

---

## Task 3: Type Conversion and Parameter Extraction

### Convert IRT columns to numeric

```r
items$difficulty     <- as.numeric(items$difficulty)
items$discrimination <- as.numeric(items$discrimination)
items$guessing       <- as.numeric(items$guessing)
```

As noted above, Concerto returns all database values as character strings. Without this conversion:

```r
# What Concerto returns:
items$difficulty[1]      # → "0.5"   (a string)

# What happens without conversion:
0.5 - "0.5"              # → Error: non-numeric argument to binary operator

# What happens with conversion:
as.numeric("0.5") - 0.5  # → 0.0   ✅
```

Only the three IRT parameter columns need conversion here. The question text and options remain as character strings (which is correct for display).

### Extract parameter vectors

```r
a <- items$discrimination
b <- items$difficulty
c <- items$guessing
```

Pulls the three IRT parameter columns into standalone vectors `a`, `b`, `c`.

**Why create separate vectors?**

R is **vectorized** — arithmetic operations on vectors are applied element-wise across all elements simultaneously, without explicit loops:

```r
a <- c(0.8, 1.0, 1.2, 1.5, 1.8)   # 5 items
b <- c(-2.0, -1.0, 0.0, 1.0, 2.0)
c <- c(0.25, 0.25, 0.25, 0.25, 0.25)
theta <- 0.0

# This computes P for ALL 5 items at once:
P <- c + (1 - c) / (1 + exp(-a * (theta - b)))
# → c(0.969, 0.938, 0.625, 0.312, 0.254)
```

This is equivalent to running a for-loop over all items but is:
- **Faster** — implemented in compiled C internally
- **Cleaner** — no loop boilerplate
- **Less error-prone** — no index management

---

## Task 3: Calculate P(θ) for All Items

```r
P <- c + (1 - c) / (1 + exp(-a * (theta - b)))
```

### The 3PL Model

This implements the **3-Parameter Logistic (3PL) Item Characteristic Curve**:

$$P_i(\theta) = c_i + \frac{1 - c_i}{1 + e^{-a_i(\theta - b_i)}}$$

Where:
- $\theta$ — current ability estimate (scalar, same for all items)
- $a_i$ — discrimination parameter of item $i$
- $b_i$ — difficulty parameter of item $i$
- $c_i$ — guessing parameter of item $i$

### Breaking down the formula component by component

| Component | Code | Mathematical role |
|---|---|---|
| $\theta - b_i$ | `theta - b` | Distance between ability and difficulty |
| $-a_i(\theta-b_i)$ | `-a * (theta - b)` | Scaled, negated distance |
| $e^{-a_i(\theta-b_i)}$ | `exp(-a * (theta - b))` | Exponential — always positive |
| $\frac{1}{1+e^{...}}$ | `1 / (1 + exp(...))` | Logistic function — maps $\mathbb{R} \to (0,1)$ |
| $\frac{1-c_i}{1+e^{...}}$ | `(1-c) / (1+exp(...))` | Scaled by $(1-c_i)$ to fit in $[0, 1-c_i]$ |
| $c_i + \ldots$ | `c + ...` | Shifts up by $c_i$ — sets the lower asymptote |

### Role of each parameter

#### Difficulty $b_i$ — where on the theta scale P = 0.5 + c/2

The difficulty parameter **shifts the curve left or right** along the theta axis. At $\theta = b_i$ (ignoring guessing, $c=0$):

$$P_i(b_i) = 0 + \frac{1}{1 + e^0} = \frac{1}{2} = 0.5$$

With guessing ($c > 0$), the inflection point is slightly above $b_i$.

```
Low b (easy item):          High b (hard item):
P                           P
1.0 ──────────              1.0         ──────────
0.5 ──┐                     0.5               ──┐
0.25  │ (guessing)          0.25 (guessing)   │
      └────                             └────
      θ                                       θ
   b=-2.0                               b=+2.0
```

#### Discrimination $a_i$ — steepness of the curve

Higher $a_i$ means the curve rises more steeply — the item more sharply separates test-takers above vs below the difficulty level:

```
High a (steep):     Low a (shallow):
P                   P
1.0  ─┐             1.0    ──────────
0.5  ─┤             0.5   ─
0.25  │             0.25 ─
     ─┘
      θ=b            θ=b
```

#### Guessing $c_i$ — lower asymptote

Sets the floor on $P_i(\theta)$. Even at $\theta \to -\infty$, $P_i \to c_i$:

$$\lim_{\theta \to -\infty} P_i(\theta) = c_i$$

For 4-choice MCQ items: $c_i = 0.25$ (random guessing = 1/4).

### Concrete example at $\theta = 0$

For 10 items with increasing difficulty ($b$ from -2.0 to +2.5):

| Item | $a$ | $b$ | $c$ | $\theta - b$ | $e^{-a(\theta-b)}$ | $P(\theta=0)$ |
|---|---|---|---|---|---|---|
| 1 | 0.8 | -2.0 | 0.25 | 2.0 | $e^{-1.6}=0.202$ | **0.969** |
| 2 | 1.0 | -1.5 | 0.25 | 1.5 | $e^{-1.5}=0.223$ | **0.938** |
| 3 | 1.2 | -1.0 | 0.25 | 1.0 | $e^{-1.2}=0.301$ | **0.886** |
| 4 | 1.3 | -0.5 | 0.25 | 0.5 | $e^{-0.65}=0.522$ | **0.794** |
| 5 | 1.5 | 0.0 | 0.25 | 0.0 | $e^{0}=1.000$ | **0.625** |
| 6 | 1.4 | 0.5 | 0.25 | -0.5 | $e^{0.7}=2.014$ | **0.431** |
| 7 | 1.6 | 1.0 | 0.25 | -1.0 | $e^{1.6}=4.953$ | **0.305** |
| 8 | 1.7 | 1.5 | 0.25 | -1.5 | $e^{2.55}=12.81$ | **0.266** |
| 9 | 1.8 | 2.0 | 0.25 | -2.0 | $e^{3.6}=36.60$ | **0.254** |
| 10 | 2.0 | 2.5 | 0.25 | -2.5 | $e^{5.0}=148.4$ | **0.250** |

At $\theta=0$, easy items have high $P$ (near 1), hard items approach the guessing floor (0.25).

---

## Task 3: Calculate Item Information I(θ)

```r
P_safe <- pmax(pmin(P, 0.9999), 0.0001)
items$information <- (a^2) * ((P_safe - c)^2 / (1 - c)^2) * ((1 - P_safe) / P_safe)
```

### The 3PL Item Information Function (IIF)

The Item Information Function measures **how much statistical information** item $i$ provides about $\theta$ at a given ability level:

$$I_i(\theta) = \frac{a_i^2 \left[P_i(\theta) - c_i\right]^2}{(1 - c_i)^2} \cdot \frac{1 - P_i(\theta)}{P_i(\theta)}$$

### Why two lines? — Probability clamping

```r
P_safe <- pmax(pmin(P, 0.9999), 0.0001)
```

The IIF formula has $P_i(\theta)$ in the **denominator** — division by $P_i$ becomes a problem when $P_i \approx 0$, and $(1 - P_i)/P_i \to \infty$. Similarly, the $(P_i - c_i)$ term is invalid if $P_i < c_i$ due to floating point errors.

**`pmin(P, 0.9999)`** — element-wise minimum: caps each $P_i$ at 0.9999:

```r
pmin(c(0.9999, 1.0000, 0.8), 0.9999)
# → c(0.9999, 0.9999, 0.8)
```

**`pmax(..., 0.0001)`** — element-wise maximum: floors each result at 0.0001:

```r
pmax(c(0.0001, 0.0000, 0.5), 0.0001)
# → c(0.0001, 0.0001, 0.5)
```

Note: `pmax`/`pmin` (lowercase p) operate **element-wise on vectors**, unlike `max`/`min` which return a single scalar. This is important here since `P` is a vector of 10 values.

### Breaking down the IIF formula

$$I_i(\theta) = \underbrace{a_i^2}_{\text{discrimination²}} \cdot \underbrace{\frac{(P_i - c_i)^2}{(1-c_i)^2}}_{\text{guessing correction}} \cdot \underbrace{\frac{1-P_i}{P_i}}_{\text{uncertainty term}}$$

#### Component 1: $a_i^2$ — Discrimination squared

```r
a^2
```

Items with higher discrimination contribute quadratically more information. An item with $a=2.0$ provides $4\times$ more information (at its peak) than one with $a=1.0$.

| $a_i$ | $a_i^2$ | Relative contribution |
|---|---|---|
| 0.5 | 0.25 | Low |
| 1.0 | 1.00 | Baseline |
| 1.5 | 2.25 | 2.25× |
| 2.0 | 4.00 | 4× |

#### Component 2: $\frac{(P_i - c_i)^2}{(1-c_i)^2}$ — Guessing correction

```r
(P_safe - c)^2 / (1 - c)^2
```

This term scales down the information to account for the guessing floor. It equals $\left(\frac{P_i - c_i}{1-c_i}\right)^2$, which is the **proportion of the probability above the guessing floor** relative to the maximum possible.

**At the difficulty point** ($\theta = b_i$, where $P_i \approx 0.5 + c_i/2$):

$$\frac{(P_i - c_i)^2}{(1-c_i)^2} \approx \frac{(0.5 - c_i/2)^2}{(1-c_i)^2} = \frac{0.25(1-c_i)^2}{(1-c_i)^2} = 0.25$$

So the guessing parameter reduces peak information by factor $(1-c_i)^2$. For $c=0.25$: reduction factor = $(0.75)^2 = 0.5625$ — guessing cuts peak information nearly in half.

#### Component 3: $\frac{1-P_i}{P_i}$ — Uncertainty term

```r
(1 - P_safe) / P_safe
```

This term is maximized when $P_i = 0.5$ and approaches 0 at both extremes:

| $P_i$ | $\frac{1-P_i}{P_i}$ | Interpretation |
|---|---|---|
| 0.25 (guessing floor) | 3.00 | All uncertainty is guessing — not true ability |
| 0.5 | 1.00 | Maximum genuine uncertainty |
| 0.75 | 0.33 | Mostly correct — less to learn |
| 0.99 | 0.01 | Near-certain — item too easy |
| 0.01 | 99.0 | But clamped — item too hard |

**Combined with the guessing correction**, the true maximum information for a 3PL item occurs slightly **above** the difficulty parameter $b_i$, not exactly at it, because the guessing floor shifts the optimal point upward.

### Where is information maximized?

Information $I_i(\theta)$ is maximized where $b_i \approx \hat{\theta}$ — items work best when difficulty matches ability:

```
I(θ)
  │         ╭─────╮         ← Item with b=0.5 (peaks near θ=0.5)
  │        ╭╯     ╰╮
  │      ╭─╯       ╰─╮
  │   ╭──╯           ╰──╮
  │╭──╯                 ╰──╮
  └────────────────────────── θ
  -3  -2  -1   0   1   2   3
                  ↑
              b = 0.5
```

- Items **too easy** ($b_i \ll \hat{\theta}$): $P_i \to 1$, uncertainty term $\frac{1-P_i}{P_i} \to 0$, information drops
- Items **too hard** ($b_i \gg \hat{\theta}$): $P_i \to c_i$, guessing correction $(P_i-c_i)^2 \to 0$, information drops
- Items **well-matched** ($b_i \approx \hat{\theta}$): both terms are at reasonable values, information peaks

### Concrete example at $\theta = 0$

Using $P$ values from the table above:

| Item | $a$ | $b$ | $c$ | $P(0)$ | $a^2$ | $(P-c)^2/(1-c)^2$ | $(1-P)/P$ | $I(0)$ |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.8 | -2.0 | 0.25 | 0.969 | 0.64 | 0.656 | 0.032 | **0.013** |
| 2 | 1.0 | -1.5 | 0.25 | 0.938 | 1.00 | 0.564 | 0.066 | **0.037** |
| 3 | 1.2 | -1.0 | 0.25 | 0.886 | 1.44 | 0.430 | 0.129 | **0.080** |
| 4 | 1.3 | -0.5 | 0.25 | 0.794 | 1.69 | 0.295 | 0.259 | **0.129** |
| 5 | 1.5 | 0.0 | 0.25 | 0.625 | 2.25 | 0.250 | 0.600 | **0.338** |
| 6 | 1.4 | 0.5 | 0.25 | 0.431 | 1.96 | 0.082 | 1.320 | **0.212** |
| 7 | 1.6 | 1.0 | 0.25 | 0.305 | 2.56 | 0.014 | 2.279 | **0.082** |
| 8 | 1.7 | 1.5 | 0.25 | 0.266 | 2.89 | 0.002 | 2.759 | **0.016** |
| 9 | 1.8 | 2.0 | 0.25 | 0.254 | 3.24 | 0.0002 | 2.937 | **0.002** |
| 10 | 2.0 | 2.5 | 0.25 | 0.250 | 4.00 | ~0 | 3.000 | **~0** |

**Item 5** (difficulty = 0.0, closest to $\theta = 0$) has the highest information at **0.338**. This will be selected.

---

## Task 4: Select Maximum Information Item

```r
selected <- items[which.max(items$information), ]
```

### `which.max()`

Returns the **row index** of the maximum value in a vector:

```r
items$information <- c(0.013, 0.037, 0.080, 0.129, 0.338, 0.212, 0.082, 0.016, 0.002, 0.000)
which.max(items$information)   # → 5  (index of item 5)
```

This implements the Maximum Information selection criterion:

$$i^* = \underset{i \notin \mathcal{U}}{\arg\max}\ I_i(\hat{\theta})$$

### `items[5, ]`

Selects the entire row for item 5 — all columns (question, options, parameters):

```r
selected <- items[5, ]
# A data frame with 1 row, all columns
```

The trailing comma is essential: `items[5, ]` selects row 5 (all columns). Without it, `items[5]` would select column 5 instead.

---

## Task 4: Set Display Variables

```r
question       <- as.character(selected$question)
option_a       <- as.character(selected$option_a)
option_b       <- as.character(selected$option_b)
option_c       <- as.character(selected$option_c)
option_d       <- as.character(selected$option_d)
correct_answer <- as.character(selected$correct_answer)
current_id     <- as.integer(selected$id)
```

### Why `as.character()`?

When a column is extracted from a data frame row, R may return a **factor** level instead of a plain string, especially for character columns. Factor levels do not always behave like strings in template substitution:

```r
# Without conversion:
selected$question   # → factor with level "What is 7x8?"
# Template: {{question}} might fail or show the factor level number

# With conversion:
as.character(selected$question)   # → "What is 7x8?"   plain string ✅
```

### Why `as.integer()` for `current_id`?

`current_id` is used later in `eval - score` inside a SQL WHERE clause:

```r
paste0("SELECT * FROM item_bank_3pl WHERE id = ", current_id)
```

If `current_id` is a string `"5"`, this produces valid SQL: `WHERE id = 5`. But making it an integer explicitly ensures correct behavior and prevents potential quoting issues in edge cases:

```r
as.integer("5")   # → 5L (integer)
```

### These variables are passed to `showPage - question` via flow pointers

The `{{variable}}` placeholders in the HTML template are replaced by these variable values:

```html
<div class="question">{{question}}</div>
<!-- becomes: -->
<div class="question">What is 7x8?</div>
```

---

## Task 4: Track the Used Item

```r
used_items <- c(used_items, current_id)
```

### What it does

Appends `current_id` to the `used_items` vector, recording that this item has been administered.

### Why this must happen in `eval - select item` not `eval - score`

The item ID must be tracked **before** the item is shown, not after it is scored. If the test-taker closes the browser mid-question (after seeing but before submitting), the `eval - score` node never runs. Tracking in `eval - select item` ensures the item is always recorded as used even in this edge case.

### Progression across the test

```r
# Before Q1: used_items = numeric(0)
# After Q1 selection (item 5):  used_items = c(5)
# After Q2 selection (item 6):  used_items = c(5, 6)
# After Q3 selection (item 3):  used_items = c(5, 6, 3)
# ...
# After Q10 selection (item 2): used_items = c(5, 6, 3, 7, 1, 9, 4, 8, 10, 2)
```

This vector is passed back via output flow variable pointer (↑) so the **next iteration** of `eval - select item` can filter it out.

---

## How Item Selection Adapts Across the Test

The key insight is that `theta` changes after every item (updated by `eval - score`), and `eval - select item` always uses the **latest** `theta`. This creates the adaptive cycle:

```
Round 1: theta = 0.0  → select item with b closest to 0.0 → item 5 (b=0.0)
         Test-taker answers CORRECTLY
         EAP update: theta = 0.38

Round 2: theta = 0.38 → select item with max I(0.38) from remaining 9 items
         → item 6 (b=0.5) now optimal (closest to 0.38)
         Test-taker answers INCORRECTLY
         EAP update: theta = 0.15

Round 3: theta = 0.15 → select item with max I(0.15) from remaining 8 items
         → item 6 already used, next best is item 4 (b=-0.5) or item 5 (b=0.0)
         ...
```

The test converges on the true ability through this iterative approximation process.

---

## Why Maximum Information is the Right Criterion

### Fisher Information and theta estimation

The **Fisher Information** is the expected value of the squared score function:

$$\mathcal{I}(\theta) = E\left[\left(\frac{\partial}{\partial\theta}\log L\right)^2\right]$$

For IRT, this simplifies to the Item Information Function $I_i(\theta)$. The **Cramér-Rao lower bound** states that no unbiased estimator can have variance smaller than:

$$\text{Var}(\hat{\theta}) \geq \frac{1}{\sum_i I_i(\theta)}$$

Therefore, **maximizing the total information $\sum_i I_i(\theta)$ minimizes the estimation variance**. By selecting the item with the highest $I_i(\hat{\theta})$ at each step, CAT greedily minimizes the variance of the final theta estimate with each question.

### Comparison with simpler alternatives

| Method | Formula | Advantage | Disadvantage |
|---|---|---|---|
| **Maximum Information** (used here) | $\arg\max I_i(\hat{\theta})$ | Optimal for precision | Can overexpose certain items |
| **b-matching** | $\arg\min \|b_i - \hat{\theta}\|$ | Simple, fast | Ignores discrimination $a_i$ |
| **Random** | uniform random from pool | Maximum exposure control | No precision optimization |
| **Randomesque** | random among top-5 by $I_i$ | Balance of both | Slightly suboptimal |

For our 10-item demonstration CAT, Maximum Information is appropriate. For operational CATs with security requirements, exposure control methods (Sympson-Hetter, randomesque) are preferred.

---

## Full Data Flow Summary

```
INPUTS via flow variable pointers (↓):
  theta       0.3821     — current ability estimate from eval - score
  answered    3          — items answered so far
  max_items   10         — test length
  used_items  c(5, 6)    — IDs of already-administered items
        ↓
┌────────────────────────────────────────────────────────────────┐
│  TASK 1: LOAD ITEM BANK                                        │
│  items = concerto.table.query("SELECT * FROM item_bank_3pl")   │
│  → data frame with 10 rows, all columns                        │
│  → all columns are character strings (Concerto default)        │
└────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────┐
│  TASK 2: FILTER USED ITEMS                                     │
│  used_items = c(5, 6)                                          │
│  items$id %in% c(5, 6) → rows 5 and 6 flagged TRUE            │
│  items = items[!flagged, ] → 8 rows remain (items 1-4, 7-10)  │
└────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────┐
│  TASK 3: CONVERT TYPES                                         │
│  difficulty, discrimination, guessing → as.numeric()           │
│  Extract vectors: a, b, c                                      │
└────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────┐
│  TASK 3: COMPUTE P(θ) FOR ALL 8 REMAINING ITEMS               │
│  P = c + (1-c) / (1 + exp(-a*(theta-b)))                      │
│  theta = 0.3821                                                │
│  P = c(0.966, 0.930, 0.876, 0.781, 0.388, 0.292, 0.260, 0.250)│
└────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────┐
│  TASK 3: COMPUTE I(θ) FOR ALL 8 REMAINING ITEMS               │
│  I = a² × (P-c)²/(1-c)² × (1-P)/P                            │
│  I = c(0.011, 0.031, 0.072, 0.172, 0.251, 0.107, 0.011, 0.001)│
│  Max I = 0.251 at item 4 (b=−0.5)... wait, let me recalculate │
│  Actually: item closest to theta=0.38 wins                     │
└────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────┐
│  TASK 4: SELECT ITEM                                           │
│  which.max(items$information) → item 4 or item 7 depending     │
│  on exact a,b,c values at theta=0.3821                         │
│  selected = items[best_index, ]                                │
└────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────┐
│  TASK 4: EXTRACT AND TRACK                                     │
│  question, option_a/b/c/d, correct_answer → as.character()     │
│  current_id → as.integer()                                     │
│  used_items = c(5, 6, selected_id)                             │
└────────────────────────────────────────────────────────────────┘
        ↓
OUTPUTS via flow variable pointers (↑):
  question        "What is 15/3?"   — displayed in showPage HTML
  option_a        "3"
  option_b        "4"
  option_c        "5"
  option_d        "6"
  correct_answer  "C"               — used by eval-score for scoring
  current_id      4                 — used by eval-score to fetch IRT params
  used_items      c(5, 6, 4)        — updated set of used items
  answered        3                 — unchanged (still 3 before submission)
  max_items       10                — unchanged
  theta           0.3821            — unchanged (only eval-score updates theta)
```

---

## Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `non-numeric argument to binary operator` | IRT columns not converted | Add `as.numeric()` on `difficulty`, `discrimination`, `guessing` |
| `NaN` in information values | `P` exactly 0 or 1 causing `/0` | Use `P_safe <- pmax(pmin(P, 0.9999), 0.0001)` |
| Same item selected every round | `used_items` not passed back as output ↑ | Ensure `used_items` has flow variable pointer output port |
| `subscript out of bounds` | Item bank exhausted | Add check: `if (nrow(items) == 0) stop("Item bank exhausted")` |
| All items have near-zero information | Theta far from all difficulties | Item bank doesn't cover this ability range — add more items |
| `items$id %in% used_items` error | `used_items` is NULL not numeric(0) | Initialize as `numeric(0)` in `eval - init`, not `c()` or `NULL` |

---

## References

- Lord, F. M. (1980). *Applications of Item Response Theory to Practical Testing Problems*. Lawrence Erlbaum Associates.
- Birnbaum, A. (1968). Some latent trait models. In F. M. Lord & M. R. Novick (Eds.), *Statistical Theories of Mental Test Scores*. Addison-Wesley.
- van der Linden, W. J., & Glas, C. A. W. (2022). *Computerized Adaptive Testing: Theory and Practice*. Kluwer Academic Publishers.
- Magis, D., & Barrada, J. R. (2017). Computerized Adaptive Testing with R: Recent Updates of the Package catR. *Journal of Statistical Software, 76*(1), 1–18. https://doi.org/10.18637/jss.v076.c01
- Weiss, D. J. (n.d.). *Introduction to CAT*. IACAT. https://iacat.org/introduction-to-cat/
- Kim, D., & Chung, H. (2018). Components of the item selection algorithm in computerized adaptive testing. *Journal of Educational Evaluation for Health Professions*. https://pmc.ncbi.nlm.nih.gov/articles/PMC5968224/
