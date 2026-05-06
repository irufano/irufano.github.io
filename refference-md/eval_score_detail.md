# Detailed Explanation: `eval - score` Node in Concerto CAT (3PL + Bayesian EAP)

---

## Overview

The `eval - score` node runs **after every submitted answer** in the CAT loop. It is the most complex node in the system and performs three sequential tasks:

| Task | Description |
|---|---|
| **Task 1** | Score the response — determine if the answer is correct |
| **Task 2** | Update theta using Bayesian EAP estimation |
| **Task 3** | Check the stopping rule — decide if the test is done |

---

## Complete R Code

```r
# ── Task 1: Score the response ────────────────────────────────────────────────
is_correct    <- as.integer(answer == correct_answer)
total_correct <- as.numeric(total_correct) + is_correct
answered      <- as.numeric(answered) + 1

# ── Retrieve current item's IRT parameters from the database ──────────────────
current_item <- concerto.table.query(
  paste0("SELECT * FROM item_bank_3pl WHERE id = ", current_id)
)

a_new <- as.numeric(current_item$discrimination[1])
b_new <- as.numeric(current_item$difficulty[1])
c_new <- as.numeric(current_item$guessing[1])

# ── Defensive conversion of history vectors ───────────────────────────────────
responses <- as.numeric(unlist(responses))
items_a   <- as.numeric(unlist(items_a))
items_b   <- as.numeric(unlist(items_b))
items_c   <- as.numeric(unlist(items_c))

# Remove any NA values from serialization artifacts
responses <- responses[!is.na(responses)]
items_a   <- items_a[!is.na(items_a)]
items_b   <- items_b[!is.na(items_b)]
items_c   <- items_c[!is.na(items_c)]

# ── Append this item's parameters to history vectors ─────────────────────────
responses <- c(responses, is_correct)
items_a   <- c(items_a,   a_new)
items_b   <- c(items_b,   b_new)
items_c   <- c(items_c,   c_new)

n_answered <- length(responses)

# ── Task 2: Bayesian EAP Theta Estimation ─────────────────────────────────────
K          <- 41
theta_grid <- seq(-4, 4, length.out = K)
log_lik    <- numeric(K)

for (k in seq_len(K)) {
  th <- theta_grid[k]
  ll <- 0

  for (j in seq_len(n_answered)) {
    Pj <- items_c[j] + (1 - items_c[j]) / (1 + exp(-items_a[j] * (th - items_b[j])))
    Pj <- max(min(Pj, 0.9999), 0.0001)

    if (responses[j] == 1) {
      ll <- ll + log(Pj)
    } else {
      ll <- ll + log(1 - Pj)
    }
  }

  log_lik[k] <- ll
}

log_lik_centered <- log_lik - max(log_lik)
likelihood       <- exp(log_lik_centered)
prior            <- dnorm(theta_grid, mean = 0, sd = 1)
weights          <- likelihood * prior
weights_sum      <- sum(weights)
weights_norm     <- weights / weights_sum

theta    <- sum(theta_grid * weights_norm)
se_theta <- sqrt(sum((theta_grid - theta)^2 * weights_norm))

theta    <- round(theta, 4)
se_theta <- round(se_theta, 4)

# ── Diagnostic log ────────────────────────────────────────────────────────────
cat("\n========================================\n")
cat(sprintf("EAP UPDATE after item %d\n", n_answered))
cat(sprintf("  Response:       %s (%s)\n",
    answer, ifelse(is_correct == 1, "CORRECT", "INCORRECT")))
cat(sprintf("  Item params:    a=%.3f, b=%.3f, c=%.3f\n", a_new, b_new, c_new))
cat(sprintf("  Response hist:  [%s]\n", paste(responses, collapse=",")))
cat(sprintf("  New theta (θ̂): %.4f\n", theta))
cat(sprintf("  SE(θ̂):         %.4f\n", se_theta))
cat(sprintf("  95%% CI:        [%.4f, %.4f]\n",
    theta - 1.96 * se_theta, theta + 1.96 * se_theta))
cat("========================================\n\n")

# ── Task 3: Stopping rule ─────────────────────────────────────────────────────
max_items     <- as.numeric(max_items)
test_complete <- n_answered >= max_items
```

---

## Task 1: Score the Response

### 1.1 Determine Correctness

```r
is_correct <- as.integer(answer == correct_answer)
```

| Component | Description | Example |
|---|---|---|
| `answer` | Value submitted by test-taker via `showPage` | `"B"` |
| `correct_answer` | Correct option stored in item bank | `"B"` |
| `answer == correct_answer` | Logical comparison | `TRUE` |
| `as.integer(TRUE)` | Converts logical to integer | `1` |
| `as.integer(FALSE)` | Converts logical to integer | `0` |

This produces a **binary response score** consistent with IRT notation:

$$u_n = \begin{cases} 1 & \text{if answer is correct} \\ 0 & \text{if answer is incorrect} \end{cases}$$

**Why `as.integer()`?**
The EAP loop later does arithmetic on `responses[j]`. Keeping it as integer (0 or 1) rather than logical (TRUE/FALSE) prevents type errors inside the loop.

---

### 1.2 Update Running Totals

```r
total_correct <- as.numeric(total_correct) + is_correct
answered      <- as.numeric(answered) + 1
```

**`as.numeric()`** is applied defensively because Concerto may pass numeric values as character strings between nodes (e.g., `"2"` instead of `2`). Without this conversion, `"2" + 1` throws an error in R.

**Example progression across items:**

| Item | `is_correct` | `total_correct` | `answered` |
|---|---|---|---|
| Start | — | 0 | 0 |
| Item 1 (wrong) | 0 | 0 | 1 |
| Item 2 (right) | 1 | 1 | 2 |
| Item 3 (right) | 1 | 2 | 3 |
| Item 4 (wrong) | 0 | 2 | 4 |

---

### 1.3 Fetch Current Item's IRT Parameters

```r
current_item <- concerto.table.query(
  paste0("SELECT * FROM item_bank_3pl WHERE id = ", current_id)
)

a_new <- as.numeric(current_item$discrimination[1])
b_new <- as.numeric(current_item$difficulty[1])
c_new <- as.numeric(current_item$guessing[1])
```

**Why fetch from the database again?**
The item parameters ($a$, $b$, $c$) were already available in `eval - select item`, but passing decimal values through Concerto flow variable pointers introduces type corruption risk. Fetching from the database with explicit `as.numeric()` conversion is safer and always returns the correct type.

**How `paste0()` builds the SQL query:**

```r
current_id <- 6
paste0("SELECT * FROM item_bank_3pl WHERE id = ", current_id)
# → "SELECT * FROM item_bank_3pl WHERE id = 6"
```

**Why `[1]`?**
The query returns a data frame. Even though only one row matches (since `id` is unique), R still returns a vector for each column. `[1]` extracts the first (and only) element:

```r
current_item$discrimination      # → c(1.4)  a vector of length 1
current_item$discrimination[1]   # → 1.4     a scalar
as.numeric(1.4)                  # → 1.4     explicitly numeric
```

**Example result for item id=6:**

```r
a_new <- 1.400   # high discrimination — good at separating abilities
b_new <- 0.500   # slightly above average difficulty
c_new <- 0.250   # 4-choice MCQ guessing floor
```

---

## Defensive Conversion of History Vectors

### Why This Is Critical

```r
responses <- as.numeric(unlist(responses))
items_a   <- as.numeric(unlist(items_a))
items_b   <- as.numeric(unlist(items_b))
items_c   <- as.numeric(unlist(items_c))
```

This block solves the most common cause of the error:
```
<simpleError: non-numeric argument to binary operator>
```

**Root cause:** Concerto serializes R vectors to disk between loop iterations through flow variable pointers. When deserialized, the vector may arrive in a corrupted form:

| Original value | What Concerto may return |
|---|---|
| `c(0.8, 1.5, 1.2)` | `"0.8, 1.5, 1.2"` (one long string) |
| `c(0.8, 1.5, 1.2)` | `list("0.8", "1.5", "1.2")` (list of strings) |
| `c(0.25)` | `"0.25"` (single string) |
| `numeric(0)` | `NULL` or `NA` |

**`unlist()`** flattens any nested list structure into a flat vector:

```r
unlist(list("0.8", "1.5", "1.2"))
# → c("0.8", "1.5", "1.2")   still strings, but now a flat vector
```

**`as.numeric()`** converts character strings to numbers:

```r
as.numeric(c("0.8", "1.5", "1.2"))
# → c(0.8, 1.5, 1.2)   ✅ numeric, ready for math
```

**Combined effect — handles all cases:**

```r
# Case 1: already numeric vector — unchanged
as.numeric(unlist(c(0.8, 1.5, 1.2)))   # → c(0.8, 1.5, 1.2)

# Case 2: list of strings — fixed
as.numeric(unlist(list("0.8","1.5")))   # → c(0.8, 1.5)

# Case 3: single string — fixed
as.numeric(unlist("0.8, 1.5"))          # → NA (needs further handling)

# Case 4: NULL — becomes empty numeric
as.numeric(unlist(NULL))                # → numeric(0)
```

---

### Remove NA Values

```r
responses <- responses[!is.na(responses)]
items_a   <- items_a[!is.na(items_a)]
items_b   <- items_b[!is.na(items_b)]
items_c   <- items_c[!is.na(items_c)]
```

When `as.numeric()` encounters a value it cannot convert, it silently produces `NA`:

```r
as.numeric("hello")   # → NA  (with a warning)
as.numeric("")        # → NA
as.numeric(NULL)      # → numeric(0)  (empty, no NA)
```

**`!is.na(x)`** creates a logical mask — `TRUE` where values are valid:

```r
x <- c(0.8, NA, 1.5, NA, 1.2)
x[!is.na(x)]   # → c(0.8, 1.5, 1.2)
```

This is especially important on **item 1**, when history vectors are still empty. Concerto may serialize `numeric(0)` (an empty vector) as `NA`, so filtering ensures a clean empty vector before appending.

---

### Append Current Item to History

```r
responses <- c(responses, is_correct)
items_a   <- c(items_a,   a_new)
items_b   <- c(items_b,   b_new)
items_c   <- c(items_c,   c_new)
```

**What it does:** Grows each history vector by one entry per answered item.

**Why these vectors are essential for EAP:**
EAP recomputes theta from scratch after every item using the **full response history** — not just the most recent response. This is fundamentally different from Newton-Raphson which uses only the current item.

**Example after 3 items:**

```r
responses <- c(0, 1, 1)              # wrong, right, right
items_a   <- c(0.8, 1.5, 1.4)       # discrimination of each item
items_b   <- c(-2.0, 0.0, 0.5)      # difficulty of each item
items_c   <- c(0.25, 0.25, 0.25)    # guessing of each item
```

---

```r
n_answered <- length(responses)
```

**Why use `length(responses)` instead of `answered`?**

`n_answered` is derived from the actual vector length — it is always correct. The `answered` variable arrives via flow variable pointer and may have been corrupted during serialization. Using `length(responses)` as ground truth is safer.

```r
# If answered was corrupted to "3" (string):
n_answered <- length(c(0, 1, 1))   # → 3  ✅ always correct
answered   <- "3"                   # potentially wrong type
```

---

## Task 2: Bayesian EAP Theta Estimation

### Mathematical Foundation

EAP is a Bayesian estimation method. It treats $\theta$ as a random variable with a prior distribution $\pi(\theta)$, combines it with the likelihood of the observed responses, and computes the **posterior mean** as the estimate.

**Bayes' theorem:**

$$p(\theta \mid \mathbf{u}) = \frac{L(\theta \mid \mathbf{u}) \cdot \pi(\theta)}{\int L(\theta \mid \mathbf{u}) \cdot \pi(\theta)\ d\theta}$$

**EAP estimate** — posterior mean:

$$\hat{\theta}_{EAP} = \int \theta \cdot p(\theta \mid \mathbf{u})\ d\theta = \frac{\int \theta \cdot L(\theta \mid \mathbf{u}) \cdot \pi(\theta)\ d\theta}{\int L(\theta \mid \mathbf{u}) \cdot \pi(\theta)\ d\theta}$$

**Posterior standard error:**

$$SE_{EAP} = \sqrt{\int (\theta - \hat{\theta}_{EAP})^2 \cdot p(\theta \mid \mathbf{u})\ d\theta}$$

---

### Step 2a: Quadrature Grid

```r
K          <- 41
theta_grid <- seq(-4, 4, length.out = K)
log_lik    <- numeric(K)
```

The continuous integral is approximated using **discrete quadrature** — evaluating the integrand at $K$ fixed points:

$$\int f(\theta)\ d\theta \approx \sum_{k=1}^{K} f(\theta_k) \cdot \Delta\theta$$

**`seq(-4, 4, length.out = 41)`** creates 41 equally-spaced points:

```
-4.0, -3.8, -3.6, -3.4, ..., 0.0, ..., 3.4, 3.6, 3.8, 4.0
```

**Why these choices?**

| Parameter | Value | Reason |
|---|---|---|
| Lower bound | $-4$ | $\Phi(-4) = 0.00003$ — negligible prior mass beyond this |
| Upper bound | $+4$ | $\Phi(4) = 0.99997$ — symmetric |
| $K = 41$ | 41 points | Standard in IRT software; matches Baker & Kim (2004) |
| `numeric(K)` | 41 zeros | Pre-allocates the log-likelihood vector |

**`numeric(K)`** is more efficient than `c()` inside a loop because it pre-allocates memory:

```r
numeric(5)   # → c(0, 0, 0, 0, 0)
```

---

### Step 2b: Log-Likelihood Computation

```r
for (k in seq_len(K)) {
  th <- theta_grid[k]
  ll <- 0

  for (j in seq_len(n_answered)) {
    Pj <- items_c[j] + (1 - items_c[j]) / (1 + exp(-items_a[j] * (th - items_b[j])))
    Pj <- max(min(Pj, 0.9999), 0.0001)

    if (responses[j] == 1) {
      ll <- ll + log(Pj)
    } else {
      ll <- ll + log(1 - Pj)
    }
  }

  log_lik[k] <- ll
}
```

#### Outer loop — over grid points

For each $\theta_k$ in the grid, computes how likely the observed response pattern is if the test-taker's true ability were $\theta_k$.

#### Inner loop — over answered items

For each item $j$, computes its log-likelihood contribution at $\theta_k$:

$$\ell_j(\theta_k) = u_j \log P_j(\theta_k) + (1-u_j) \log(1-P_j(\theta_k))$$

The total log-likelihood at $\theta_k$ is the sum across all answered items:

$$\log L(\theta_k \mid \mathbf{u}) = \sum_{j=1}^{n} \ell_j(\theta_k)$$

#### The 3PL Probability

```r
Pj <- items_c[j] + (1 - items_c[j]) / (1 + exp(-items_a[j] * (th - items_b[j])))
```

This implements the **3-Parameter Logistic model**:

$$P_j(\theta_k) = c_j + \frac{1 - c_j}{1 + e^{-a_j(\theta_k - b_j)}}$$

**Behavior at different theta values** (item with $a=1.5$, $b=0.5$, $c=0.25$):

| $\theta_k$ | $P_j(\theta_k)$ | Interpretation |
|---|---|---|
| $-4.0$ | $\approx 0.250$ | Very low ability — can only guess |
| $-1.0$ | $0.306$ | Below average — slightly above guessing |
| $0.5$ | $0.625$ | At difficulty — 50% above guessing floor |
| $2.0$ | $0.903$ | High ability — very likely correct |
| $4.0$ | $\approx 0.999$ | Exceptional — virtually certain |

#### Probability Clamping

```r
Pj <- max(min(Pj, 0.9999), 0.0001)
```

Clamps $P_j$ to the open interval $(0.0001, 0.9999)$ to prevent:

| Condition | Code problem | Mathematical problem |
|---|---|---|
| $P_j = 0$ | `log(0)` → `-Inf` | $\log 0$ is undefined |
| $P_j = 1$ | `log(1-1)` = `log(0)` → `-Inf` | $\log 0$ is undefined |
| $P_j$ very near 0 or 1 | Extreme values dominate sum | Numerical instability |

#### Log-Likelihood Contribution

```r
if (responses[j] == 1) {
  ll <- ll + log(Pj)         # correct response: add log P
} else {
  ll <- ll + log(1 - Pj)    # incorrect response: add log(1-P)
}
```

**Why log-likelihood instead of likelihood?**

The raw likelihood is a product of probabilities:

$$L(\theta_k \mid \mathbf{u}) = \prod_{j=1}^{n} P_j(\theta_k)^{u_j}(1-P_j(\theta_k))^{1-u_j}$$

After 10 items with $P_j \approx 0.6$:
$$L \approx 0.6^{10} \approx 0.006$$

After 40 items:
$$L \approx 0.6^{40} \approx 1.3 \times 10^{-9}$$

R's floating point minimum is $\approx 5 \times 10^{-324}$. Products of many small numbers **underflow to zero**, making all grid points look equally likely and destroying the estimate.

**Log transforms products into sums** — numerically stable regardless of test length:

$$\log L(\theta_k) = \sum_{j=1}^{n} [u_j \log P_j + (1-u_j)\log(1-P_j)]$$

**Concrete example** — 3 items, responses = [0, 1, 1], at $\theta_k = 0$:

| Item $j$ | $a_j$ | $b_j$ | $c_j$ | $u_j$ | $P_j(0)$ | Contribution |
|---|---|---|---|---|---|---|
| 1 | 0.8 | -2.0 | 0.25 | 0 | 0.874 | $\log(1-0.874) = -2.07$ |
| 2 | 1.5 | 0.0 | 0.25 | 1 | 0.625 | $\log(0.625) = -0.47$ |
| 3 | 1.4 | 0.5 | 0.25 | 1 | 0.431 | $\log(0.431) = -0.84$ |

$$\log L(0) = -2.07 + (-0.47) + (-0.84) = -3.38$$

This is repeated for all 41 $\theta_k$ values, giving a vector `log_lik` of 41 values.

---

### Step 2c: Numerically Stable Exponentiation

```r
log_lik_centered <- log_lik - max(log_lik)
likelihood       <- exp(log_lik_centered)
```

**Why subtract `max(log_lik)` before `exp()`?**

After 10 items, `log_lik` values might range from -30 to -100. `exp(-100)` $\approx 3.7 \times 10^{-44}$ — very small but still representable. However the **relative differences** between grid points are what matter for EAP, not the absolute magnitudes.

By centering on the maximum:

```r
# Before centering:
log_lik <- c(-50.1, -48.3, -47.0, -51.2, ...)
# All values very negative — exp gives tiny numbers

# After centering (subtract max = -47.0):
log_lik_centered <- c(-3.1, -1.3, 0.0, -4.2, ...)
# Maximum is now 0 → exp(0) = 1 at the peak

# Exponentiate:
likelihood <- c(0.045, 0.272, 1.000, 0.015, ...)
# Clean values, no underflow
```

**Mathematical justification:**
Multiplying all weights by a constant $e^{-\max}$ does not change the EAP estimate because the constant cancels in the normalization step:

$$\hat{\theta}_{EAP} = \frac{\sum \theta_k \cdot w_k}{\sum w_k} = \frac{\sum \theta_k \cdot (w_k / C)}{\sum (w_k / C)}$$

---

### Step 2d: Prior Distribution

```r
prior <- dnorm(theta_grid, mean = 0, sd = 1)
```

**`dnorm(x, mean, sd)`** evaluates the standard normal PDF:

$$\pi(\theta_k) = \frac{1}{\sqrt{2\pi}} e^{-\theta_k^2 / 2}$$

**Why $\mathcal{N}(0, 1)$ as prior?**

This encodes the assumption that, before seeing any responses, the population of test-takers has ability distributed as a standard normal — most people cluster around $\theta = 0$ (average), with fewer at the extremes.

**Effect of the prior on the estimate:**

| Items answered | Prior influence | Likelihood influence |
|---|---|---|
| 1–3 | Strong — pulls theta toward 0 | Weak — little data |
| 4–7 | Moderate | Moderate |
| 8–10 | Weak | Strong — data dominates |

This is exactly what we want: the prior stabilizes estimates early when data is scarce, then gradually yields to the data as evidence accumulates.

**Prior values across the grid:**

```r
dnorm(-4)   # → 0.000134  almost zero — extreme abilities unlikely a priori
dnorm(-2)   # → 0.054
dnorm(-1)   # → 0.242
dnorm(0)    # → 0.399     peak — average ability most likely a priori
dnorm(1)    # → 0.242
dnorm(2)    # → 0.054
dnorm(4)    # → 0.000134
```

---

### Step 2e–f: Posterior Weights

```r
weights      <- likelihood * prior
weights_sum  <- sum(weights)
weights_norm <- weights / weights_sum
```

**`weights = likelihood * prior`** implements Bayes' theorem numerator:

$$w_k = L(\theta_k \mid \mathbf{u}) \cdot \pi(\theta_k) \propto p(\theta_k \mid \mathbf{u})$$

**`weights_norm = weights / weights_sum`** normalizes so they sum to 1:

$$\tilde{w}_k = \frac{w_k}{\sum_{k=1}^{K} w_k}$$

The normalized weights $\tilde{w}_k$ represent the **discrete posterior distribution** of $\theta$ given all responses.

**Example with 5 grid points (simplified):**

| $\theta_k$ | Likelihood | Prior | Weight | Normalized |
|---|---|---|---|---|
| $-2$ | 0.10 | 0.054 | 0.0054 | 0.013 |
| $-1$ | 0.40 | 0.242 | 0.0968 | 0.234 |
| $0$ | 1.00 | 0.399 | 0.3990 | 0.965... |
| $1$ | 0.60 | 0.242 | 0.1452 | 0.351 |
| $2$ | 0.10 | 0.054 | 0.0054 | 0.013 |
| **Sum** | | | **0.6518** | **1.000** |

---

### Step 2g: EAP Estimate — Posterior Mean

```r
theta <- sum(theta_grid * weights_norm)
```

Implements the discrete approximation to the posterior mean:

$$\hat{\theta}_{EAP} \approx \sum_{k=1}^{K} \theta_k \cdot \tilde{w}_k$$

**Example (continuing above):**

$$\hat{\theta}_{EAP} = (-2)(0.013) + (-1)(0.234) + (0)(0.965) + (1)(0.351) + (2)(0.013)$$

Wait — those don't sum to 1. Let me normalize properly:

$$\text{sum} = 0.0054 + 0.0968 + 0.3990 + 0.1452 + 0.0054 = 0.6518$$
$$\tilde{w} = (0.008, 0.149, 0.612, 0.223, 0.008)$$
$$\hat{\theta}_{EAP} = (-2)(0.008)+(-1)(0.149)+(0)(0.612)+(1)(0.223)+(2)(0.008) = 0.090$$

This theta ($\approx 0.09$) is slightly above average — consistent with more correct than incorrect responses.

---

### Step 2h: Posterior Standard Error

```r
se_theta <- sqrt(sum((theta_grid - theta)^2 * weights_norm))
```

Implements the discrete posterior variance:

$$SE_{EAP} = \sqrt{\sum_{k=1}^{K} (\theta_k - \hat{\theta}_{EAP})^2 \cdot \tilde{w}_k}$$

This is the square root of the **weighted variance** of the posterior distribution.

**SE interpretation:**

| SE value | Meaning | 95% CI width |
|---|---|---|
| $\geq 0.8$ | Very uncertain — early in test | $\pm 1.57$ |
| $0.5 - 0.8$ | Moderate uncertainty | $\pm 0.98 - 1.57$ |
| $0.3 - 0.5$ | Acceptable precision | $\pm 0.59 - 0.98$ |
| $< 0.3$ | High precision — test can stop | $< \pm 0.59$ |

**SE progression across a 10-item test:**

| After item | Typical SE | 95% CI |
|---|---|---|
| 1 | $\approx 0.89$ | $\pm 1.74$ |
| 3 | $\approx 0.62$ | $\pm 1.21$ |
| 5 | $\approx 0.48$ | $\pm 0.94$ |
| 7 | $\approx 0.38$ | $\pm 0.74$ |
| 10 | $\approx 0.31$ | $\pm 0.61$ |

SE decreases monotonically as each item adds information to the posterior.

---

### Rounding

```r
theta    <- round(theta, 4)
se_theta <- round(se_theta, 4)
```

Rounds to 4 decimal places for clean display and storage. Applied **after** all computation to avoid accumulated rounding errors.

---

## Diagnostic Log

```r
cat(sprintf("EAP UPDATE after item %d\n", n_answered))
cat(sprintf("  Response:       %s (%s)\n",
    answer, ifelse(is_correct == 1, "CORRECT", "INCORRECT")))
cat(sprintf("  Item params:    a=%.3f, b=%.3f, c=%.3f\n", a_new, b_new, c_new))
cat(sprintf("  Response hist:  [%s]\n", paste(responses, collapse=",")))
cat(sprintf("  New theta (θ̂): %.4f\n", theta))
cat(sprintf("  SE(θ̂):         %.4f\n", se_theta))
cat(sprintf("  95%% CI:        [%.4f, %.4f]\n",
    theta - 1.96 * se_theta, theta + 1.96 * se_theta))
```

**`sprintf()` format codes:**

| Code | Meaning | Example |
|---|---|---|
| `%d` | Integer | `3` |
| `%.3f` | Float, 3 decimal places | `1.400` |
| `%.4f` | Float, 4 decimal places | `0.3821` |
| `%s` | String | `"CORRECT"` |
| `%%` | Literal `%` sign | `%` |

**`paste(responses, collapse=",")`** joins a vector into a readable string:

```r
paste(c(0, 1, 1), collapse=",")   # → "0,1,1"
```

**`ifelse(is_correct == 1, "CORRECT", "INCORRECT")`** produces a label:

```r
ifelse(1 == 1, "CORRECT", "INCORRECT")   # → "CORRECT"
ifelse(0 == 1, "CORRECT", "INCORRECT")   # → "INCORRECT"
```

**Example log output after item 3:**

```
========================================
EAP UPDATE after item 3
  Response:       B (CORRECT)
  Item params:    a=1.400, b=0.500, c=0.250
  Response hist:  [0,1,1]
  New theta (θ̂): 0.3821
  SE(θ̂):         0.6104
  95% CI:        [-0.8143, 1.5785]
========================================
```

**To view logs in real-time:**

```bash
docker exec -it concerto-platform-01-concerto-1 \
  find /var/www/html/var/logs -name "*.log" -exec tail -100 {} \;
```

---

## Task 3: Stopping Rule

```r
max_items     <- as.numeric(max_items)
test_complete <- n_answered >= max_items
```

**`as.numeric(max_items)`** — same defensive conversion as before. `max_items = 10` in `eval - init` but may arrive as `"10"` (string) through the flow variable pointer.

**`n_answered >= max_items`** — produces a logical value:

```r
# After item 9:   9 >= 10  → FALSE  → if node "false" port → loop back
# After item 10: 10 >= 10  → TRUE   → if node "true" port  → go to results
```

**Why `n_answered` not `answered`?**
`n_answered = length(responses)` is computed from the actual vector length — immune to serialization corruption. `answered` is a flow variable that has been passed through Concerto and could theoretically be wrong.

**The `if` node reads `test_complete`:**
The `if` node expression is set to `test_complete`. When this is `TRUE`, it routes to `eval - compute result` → `showPage - result` → `test end`. When `FALSE`, it routes back to `eval - select item` for the next iteration.

---

## Full Data Flow Summary

```
INPUTS via flow variable pointers (↓):
  answer          "B"           — test-taker's submitted answer
  correct_answer  "B"           — correct answer from item bank
  current_id      6             — ID of the item just answered
  answered        2             — items answered before this one (may be string)
  total_correct   1             — correct answers so far (may be string)
  theta           0.0721        — current ability estimate
  se_theta        0.6104        — current standard error
  max_items       10            — stopping threshold (may be string)
  responses       c(0, 1)       — response history (may be list/string)
  items_a         c(0.8, 1.5)   — discrimination history (may be list/string)
  items_b         c(-2.0, 0.0)  — difficulty history (may be list/string)
  items_c         c(0.25, 0.25) — guessing history (may be list/string)
        ↓
┌──────────────────────────────────────────────────────────────┐
│  TASK 1: SCORE                                               │
│  is_correct = 1  (answer == correct_answer)                  │
│  total_correct = 2, answered = 3                             │
│  Fetch a=1.4, b=0.5, c=0.25 from DB (id=6)                  │
└──────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────┐
│  DEFENSIVE CONVERSION                                        │
│  unlist() + as.numeric() + NA removal on all vectors         │
│  responses = c(0, 1)  items_a = c(0.8, 1.5)  etc.           │
└──────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────┐
│  APPEND TO HISTORY                                           │
│  responses = c(0, 1, 1)                                      │
│  items_a   = c(0.8, 1.5, 1.4)                                │
│  items_b   = c(-2.0, 0.0, 0.5)                               │
│  items_c   = c(0.25, 0.25, 0.25)                             │
│  n_answered = 3                                              │
└──────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────┐
│  TASK 2: BAYESIAN EAP                                        │
│  Grid: 41 points from -4 to +4                               │
│  For each θ_k:                                               │
│    Compute P_j(θ_k) using 3PL for each of 3 items           │
│    Accumulate log-likelihood                                  │
│  Center and exponentiate log-likelihoods                     │
│  Multiply by N(0,1) prior                                    │
│  Normalize to get posterior weights                          │
│  theta    = Σ(θ_k × w_k)         = 0.3821                   │
│  se_theta = √Σ((θ_k-θ̂)² × w_k) = 0.5803                   │
└──────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────┐
│  TASK 3: STOPPING RULE                                       │
│  n_answered (3) >= max_items (10) → FALSE                    │
│  test_complete = FALSE → loop back to eval - select item     │
└──────────────────────────────────────────────────────────────┘
        ↓
OUTPUTS via flow variable pointers (↑):
  answered        3
  total_correct   2
  theta           0.3821
  se_theta        0.5803
  test_complete   FALSE
  responses       c(0, 1, 1)
  items_a         c(0.8, 1.5, 1.4)
  items_b         c(-2.0, 0.0, 0.5)
  items_c         c(0.25, 0.25, 0.25)
  used_items      c(1, 5, 6)
```

---

## References

- Bock, R. D., & Mislevy, R. J. (1982). Adaptive EAP estimation of ability in a microcomputer environment. *Applied Psychological Measurement, 6*(4), 431–444. https://doi.org/10.1177/014662168200600405
- Lord, F. M. (1980). *Applications of Item Response Theory to Practical Testing Problems*. Lawrence Erlbaum Associates.
- Baker, F. B., & Kim, S.-H. (2004). *Item Response Theory: Parameter Estimation Techniques* (2nd ed.). Marcel Dekker.
- Magis, D., & Barrada, J. R. (2017). Computerized Adaptive Testing with R: Recent Updates of the Package catR. *Journal of Statistical Software, 76*(1), 1–18. https://doi.org/10.18637/jss.v076.c01
- Kim, S. (2015). Effectiveness of IRT Proficiency Estimation Methods Under Adaptive Multistage Testing. *ETS Research Report Series*. https://doi.org/10.1002/ets2.12057
