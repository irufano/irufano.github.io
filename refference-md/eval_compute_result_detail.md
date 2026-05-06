# Detailed Explanation: `eval - compute result` Node in Concerto CAT (3PL + Bayesian EAP)

---

## Overview

The `eval - compute result` node runs **exactly once** — after the `if` node routes to the `true` port (test is complete). Its purpose is to **transform raw numeric outputs** from the CAT algorithm into human-readable labels, derived metrics, and formatted values that the results page can display meaningfully.

| Property | Value |
|---|---|
| **Runs** | Once only — after stopping rule is met |
| **Position in flow** | `if` (true) → `eval - compute result` → `showPage - result` |
| **Purpose** | Compute labels, CI bounds, precision assessment, and percentage |
| **Inputs** | `theta`, `se_theta`, `answered`, `total_correct` |
| **Outputs** | `ability_label`, `ci_lower`, `ci_upper`, `precision_label`, `pct_correct` + pass-through of inputs |

---

## Complete R Code

```r
# ── Ability label from theta ───────────────────────────────────────────────────
if (theta >= 2.0) {
  ability_label <- "Exceptional"
} else if (theta >= 1.0) {
  ability_label <- "High"
} else if (theta >= -1.0) {
  ability_label <- "Average"
} else if (theta >= -2.0) {
  ability_label <- "Below Average"
} else {
  ability_label <- "Low"
}

# ── 95% Confidence interval: θ̂ ± 1.96 * SE ───────────────────────────────────
ci_lower <- round(theta - 1.96 * se_theta, 3)
ci_upper <- round(theta + 1.96 * se_theta, 3)

# ── Precision label based on SE ───────────────────────────────────────────────
if (se_theta < 0.3) {
  precision_label <- "High precision"
} else if (se_theta < 0.5) {
  precision_label <- "Acceptable precision"
} else {
  precision_label <- "Low precision (more items recommended)"
}

# ── Percentage correct ────────────────────────────────────────────────────────
pct_correct <- round((total_correct / answered) * 100, 1)
```

---

## Why This Node Exists as a Separate Step

It would be technically possible to compute these values inside `showPage - result` using inline JavaScript or inside `eval - score`. However, separating computation from display follows the **separation of concerns** principle:

| Reason | Detail |
|---|---|
| **Clean display node** | `showPage - result` only handles HTML rendering — no logic |
| **Testability** | Computed values can be logged and inspected before display |
| **Reusability** | The same computed variables can be passed to multiple display nodes if needed |
| **Concerto limitation** | Complex R logic inside `showPage` templates is unreliable |

---

## Variable-by-Variable Explanation

---

### `ability_label` — Human-Readable Ability Classification

```r
if (theta >= 2.0) {
  ability_label <- "Exceptional"
} else if (theta >= 1.0) {
  ability_label <- "High"
} else if (theta >= -1.0) {
  ability_label <- "Average"
} else if (theta >= -2.0) {
  ability_label <- "Below Average"
} else {
  ability_label <- "Low"
}
```

#### What it does

Maps the continuous theta estimate $\hat{\theta} \in [-4, 4]$ to a discrete categorical label using a set of threshold comparisons.

#### Why we need this

The raw theta value (e.g., `0.3821`) is meaningful to psychometricians but not to most test-takers. A label like "Average" communicates the result intuitively without requiring knowledge of the IRT scale.

#### The threshold logic

R evaluates `if-else if` chains top-down and stops at the first `TRUE` condition. The thresholds are based on the standard normal distribution:

| Condition | Label | Theta range | % of population |
|---|---|---|---|
| `theta >= 2.0` | Exceptional | $[2.0, \infty)$ | Top ~2.3% |
| `theta >= 1.0` | High | $[1.0, 2.0)$ | Next ~13.6% |
| `theta >= -1.0` | Average | $[-1.0, 1.0)$ | Middle ~68.2% |
| `theta >= -2.0` | Below Average | $[-2.0, -1.0)$ | Next ~13.6% |
| else | Low | $(-\infty, -2.0)$ | Bottom ~2.3% |

These thresholds correspond to the **68-95-99.7 rule** of the standard normal distribution, since theta is scaled as $\mathcal{N}(0,1)$ across the population:

```
                    68.2%
          ┌─────────────────────┐
          │                     │
  2.3%    │   13.6%   │  13.6%  │   2.3%
 ──────   │ ─────────  ─────────│  ──────
   Low    │  Below    │  High   │  Excep-
          │  Average  │         │  tional
 ──────────────────────────────────────
 -3  -2  -1    0    +1   +2   +3
          └─── Average ────┘
```

#### Concrete examples

| `theta` | Condition evaluated | `ability_label` |
|---|---|---|
| `3.21` | `3.21 >= 2.0` → TRUE | `"Exceptional"` |
| `1.54` | `1.54 >= 2.0` → FALSE; `1.54 >= 1.0` → TRUE | `"High"` |
| `0.38` | `0.38 >= 2.0` → FALSE; `0.38 >= 1.0` → FALSE; `0.38 >= -1.0` → TRUE | `"Average"` |
| `-0.72` | all `>= positive` → FALSE; `-0.72 >= -1.0` → TRUE | `"Average"` |
| `-1.33` | `-1.33 >= -1.0` → FALSE; `-1.33 >= -2.0` → TRUE | `"Below Average"` |
| `-2.87` | all conditions FALSE | `"Low"` |

#### Why `else if` not multiple `if` statements

Using `if-else if` ensures **only one branch executes**. Using separate `if` statements would allow multiple conditions to be true and overwrite each other:

```r
# WRONG — multiple ifs: theta=1.5 would match BOTH conditions
if (theta >= 1.0) ability_label <- "High"
if (theta >= -1.0) ability_label <- "Average"   # overwrites "High"!

# CORRECT — else if: theta=1.5 matches first TRUE, stops
if (theta >= 2.0) {
  ability_label <- "Exceptional"
} else if (theta >= 1.0) {
  ability_label <- "High"          # matches here, stops
} else if (theta >= -1.0) {
  ability_label <- "Average"       # never reached
}
```

#### Customizing the labels

You can adjust thresholds or labels for your specific test context:

```r
# Example: 5-level classification for a certification exam
if (theta >= 1.5) {
  ability_label <- "Master"
} else if (theta >= 0.5) {
  ability_label <- "Proficient"
} else if (theta >= -0.5) {
  ability_label <- "Developing"
} else if (theta >= -1.5) {
  ability_label <- "Beginning"
} else {
  ability_label <- "Novice"
}
```

---

### `ci_lower` and `ci_upper` — 95% Confidence Interval

```r
ci_lower <- round(theta - 1.96 * se_theta, 3)
ci_upper <- round(theta + 1.96 * se_theta, 3)
```

#### What it does

Computes the **95% confidence interval** for the theta estimate using the EAP standard error:

$$CI_{95\%} = \left[\hat{\theta} - 1.96 \cdot SE_{EAP},\quad \hat{\theta} + 1.96 \cdot SE_{EAP}\right]$$

#### Why 1.96

`1.96` is the **critical value** of the standard normal distribution at the 95% confidence level:

$$P(-1.96 \leq Z \leq 1.96) = 0.95$$

This means: if we were to repeat the test many times with different random item selections, 95% of the resulting confidence intervals would contain the test-taker's true ability $\theta$.

Other common confidence levels:

| Confidence level | Critical value $z_{\alpha/2}$ | Code |
|---|---|---|
| 90% | 1.645 | `theta ± 1.645 * se_theta` |
| **95%** | **1.960** | **`theta ± 1.96 * se_theta`** |
| 99% | 2.576 | `theta ± 2.576 * se_theta` |

#### `round(..., 3)` — 3 decimal places

The CI bounds are rounded to 3 decimal places for clean display. More decimals would imply false precision — given the uncertainty in the estimate, 3 decimal places is sufficient.

#### Concrete examples

**Example 1** — Average ability, moderate precision:
```r
theta    <- 0.3821
se_theta <- 0.5803

ci_lower <- round(0.3821 - 1.96 * 0.5803, 3)
           = round(0.3821 - 1.1374, 3)
           = round(-0.7553, 3)
           = -0.755

ci_upper <- round(0.3821 + 1.96 * 0.5803, 3)
           = round(0.3821 + 1.1374, 3)
           = round(1.5195, 3)
           = 1.520

# Result: CI = [-0.755, 1.520]  (wide — only 3 items answered)
```

**Example 2** — Higher ability, high precision:
```r
theta    <- 1.2341
se_theta <- 0.2814

ci_lower <- round(1.2341 - 1.96 * 0.2814, 3)  = round(0.6826, 3)  = 0.683
ci_upper <- round(1.2341 + 1.96 * 0.2814, 3)  = round(1.7856, 3)  = 1.786

# Result: CI = [0.683, 1.786]  (narrower — 10 items answered)
```

#### CI width as a measure of test quality

```r
ci_width <- ci_upper - ci_lower   # = 2 * 1.96 * se_theta = 3.92 * se_theta
```

| SE | CI width | Interpretation |
|---|---|---|
| 0.89 (after Q1) | 3.49 | Covers almost entire scale — very uncertain |
| 0.62 (after Q3) | 2.43 | Still very wide |
| 0.48 (after Q5) | 1.88 | Moderate |
| 0.31 (after Q10) | 1.21 | Reasonably narrow |
| 0.20 (target) | 0.78 | High precision |

A CI of width ~1.2 after 10 items is typical for a well-calibrated 3PL CAT.

#### What the CI means in practice

```
                  ←── CI width = 1.52 ──→
         ─────────[━━━━━━━━━━━━━━━━━━━━━]─────────
        -1.0    -0.76                  1.52    2.0
                  ↑                     ↑
               ci_lower             ci_upper
                              ↑
                           theta = 0.38

"We are 95% confident the test-taker's true ability
 lies somewhere in this range."
```

---

### `precision_label` — Measurement Precision Assessment

```r
if (se_theta < 0.3) {
  precision_label <- "High precision"
} else if (se_theta < 0.5) {
  precision_label <- "Acceptable precision"
} else {
  precision_label <- "Low precision (more items recommended)"
}
```

#### What it does

Maps the continuous SE value to a categorical precision label, giving test-takers and administrators a plain-language assessment of measurement quality.

#### The SE thresholds

The thresholds `0.3` and `0.5` come from the CAT psychometrics literature:

| SE threshold | Source | Meaning |
|---|---|---|
| $SE < 0.30$ | Standard CAT stopping criterion | High precision — equivalent to reliability $\geq 0.91$ |
| $SE < 0.50$ | Acceptable for many applications | Moderate precision — reliability $\approx 0.75$ |
| $SE \geq 0.50$ | Below standard | Low precision — more items needed |

**Relationship between SE and reliability ($\rho$):**

Reliability is related to SE by:

$$\rho = 1 - SE^2$$

(assuming the population variance of theta is 1, i.e., $\sigma^2_\theta = 1$)

| SE | $SE^2$ | Reliability $\rho$ | Label |
|---|---|---|---|
| 0.20 | 0.04 | 0.96 | High precision |
| 0.30 | 0.09 | 0.91 | High precision (boundary) |
| 0.40 | 0.16 | 0.84 | Acceptable precision |
| 0.50 | 0.25 | 0.75 | Acceptable precision (boundary) |
| 0.60 | 0.36 | 0.64 | Low precision |
| 0.89 | 0.79 | 0.21 | Low precision (after Q1) |

#### Concrete examples

```r
se_theta <- 0.2814   → "High precision"
se_theta <- 0.4103   → "Acceptable precision"
se_theta <- 0.5803   → "Low precision (more items recommended)"
se_theta <- 999      → "Low precision (more items recommended)"  [should never reach here]
```

#### Why show this to test-takers?

Transparency about measurement precision is important in modern assessment. Test-takers deserve to know:
- How confident the system is in their score
- Whether their result is based on sufficient evidence
- Whether they might benefit from a longer test

In high-stakes contexts, administrators can use this label to flag borderline cases for review.

#### Customizing thresholds

For different testing contexts:

```r
# High-stakes certification (stricter):
if (se_theta < 0.25) {
  precision_label <- "High precision"
} else if (se_theta < 0.40) {
  precision_label <- "Acceptable precision"
} else {
  precision_label <- "Insufficient precision — retest recommended"
}

# Formative assessment (more lenient):
if (se_theta < 0.40) {
  precision_label <- "Good estimate"
} else if (se_theta < 0.60) {
  precision_label <- "Approximate estimate"
} else {
  precision_label <- "Preliminary estimate"
}
```

---

### `pct_correct` — Percentage Correct (Classical Score)

```r
pct_correct <- round((total_correct / answered) * 100, 1)
```

#### What it does

Computes the percentage of items answered correctly — the classical test theory (CTT) equivalent of the IRT theta estimate.

$$\text{pct\_correct} = \text{round}\left(\frac{\sum u_j}{n} \times 100,\ 1\right)$$

Where:
- $\sum u_j$ = `total_correct` — number of correct responses
- $n$ = `answered` — total items answered
- $\times 100$ — converts proportion to percentage
- `round(..., 1)` — rounds to 1 decimal place

#### Why include this alongside theta?

| Metric | Audience | Interpretation |
|---|---|---|
| `theta = 0.38` | Psychometricians | Ability on IRT scale |
| `pct_correct = 60.0%` | Everyone | 6 out of 10 correct |

Most test-takers intuitively understand percentage correct even if they have never heard of IRT. Including both metrics bridges the gap between technical rigor and accessibility.

#### Concrete examples

```r
# 6 correct out of 10:
pct_correct <- round((6 / 10) * 100, 1)   # → 60.0

# 8 correct out of 10:
pct_correct <- round((8 / 10) * 100, 1)   # → 80.0

# 3 correct out of 7 (SE-based stopping, fewer items):
pct_correct <- round((3 / 7) * 100, 1)    # → 42.9
```

#### Why `round(..., 1)` not `round(..., 0)`

Rounding to 1 decimal place (e.g., `42.9%`) is more informative than rounding to 0 decimals (e.g., `43%`) without implying false precision. For a 10-item test, the minimum distinguishable percentage is 10%, so 1 decimal place is appropriate.

#### Important note: pct_correct is not the same as theta

Because CAT selects items adaptively, percentage correct is **not a fair comparison across test-takers**:

- A high-ability test-taker gets harder items → lower pct_correct despite higher theta
- A low-ability test-taker gets easier items → higher pct_correct despite lower theta

**Example:**

| Test-taker | `theta` | Items administered | `pct_correct` |
|---|---|---|---|
| High ability | +2.0 | Mostly hard items ($b \approx 2$) | 55% |
| Average ability | 0.0 | Mixed items ($b \approx 0$) | 58% |
| Low ability | -2.0 | Mostly easy items ($b \approx -2$) | 60% |

The low-ability test-taker has the **highest** percentage correct despite the **lowest** theta — because they were given easy items they could answer correctly. This is why theta (IRT) is a fairer and more informative measure than raw percentage in adaptive testing.

The `pct_correct` is included as a **supplementary familiar metric**, not as the primary score. The `theta` estimate is the primary result.

---

## Why `round()` is Applied Here, Not in `eval - score`

Rounding is applied in `eval - compute result` (the display preparation node) rather than in `eval - score` (the computation node) for an important reason:

**`eval - score` uses `theta` and `se_theta` for further computation in the next loop iteration.** If theta were rounded to 3 decimal places inside `eval - score`, the rounding error would **accumulate** across 10 iterations:

```r
# Without rounding in eval - score:
theta after Q1:  0.38213847...   (full precision)
theta after Q2:  0.15042918...   (computed from full-precision Q1 theta)
theta after Q10: 0.42178334...   (full precision throughout)

# With rounding in eval - score:
theta after Q1:  0.382            (rounded)
theta after Q2:  0.150            (computed from rounded Q1 theta → error introduced)
theta after Q10: 0.419            (accumulated rounding error)
```

By keeping full precision in `eval - score` and only rounding in `eval - compute result` (which runs after all computation is complete), we eliminate accumulated rounding error.

The `round()` in `eval - score` only applies to the **final display values**:
```r
theta    <- round(theta, 4)      # 4 decimal places — sufficient precision for display
se_theta <- round(se_theta, 4)   # while keeping more precision than 3 decimal places
```

And `eval - compute result` rounds further for presentation:
```r
ci_lower <- round(theta - 1.96 * se_theta, 3)   # 3 decimal places for CI bounds
pct_correct <- round((total_correct / answered) * 100, 1)   # 1 decimal for percentage
```

---

## Input and Output Ports

### Input ports (↓) — receive from `eval - score` via flow pointers

| Port name | Type | Description |
|---|---|---|
| `theta` | numeric | Final EAP ability estimate |
| `se_theta` | numeric | Final EAP standard error |
| `answered` | numeric | Total items answered |
| `total_correct` | numeric | Total correct responses |

### Output ports (↑) — pass to `showPage - result`

| Port name | Type | Description | Example |
|---|---|---|---|
| `ability_label` | character | Ability classification | `"Average"` |
| `ci_lower` | numeric | Lower 95% CI bound | `-0.755` |
| `ci_upper` | numeric | Upper 95% CI bound | `1.520` |
| `precision_label` | character | Precision assessment | `"Acceptable precision"` |
| `pct_correct` | numeric | Percentage correct | `60.0` |
| `theta` | numeric | Pass-through | `0.3821` |
| `se_theta` | numeric | Pass-through | `0.5803` |
| `answered` | numeric | Pass-through | `10` |
| `total_correct` | numeric | Pass-through | `6` |

### Why pass-through ports for `theta`, `se_theta`, `answered`, `total_correct`?

`showPage - result` needs these values to display them directly (e.g., `{{theta}}`, `{{answered}}`). Since `eval - compute result` sits between `eval - score` and `showPage - result` in the execution chain, these values must be **passed through** via output ports — they cannot flow directly from `eval - score` to `showPage - result` because there is no direct connection between those two nodes.

---

## Full Data Flow

```
INPUTS via flow variable pointers (↓):
  theta         0.3821    — final EAP estimate after 10 items
  se_theta      0.5803    — final EAP standard error
  answered      10        — items answered
  total_correct 6         — correct responses
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  COMPUTE ability_label                                          │
│  theta = 0.3821                                                 │
│  0.3821 >= 2.0  → FALSE                                         │
│  0.3821 >= 1.0  → FALSE                                         │
│  0.3821 >= -1.0 → TRUE  → ability_label = "Average"            │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  COMPUTE ci_lower, ci_upper                                     │
│  ci_lower = round(0.3821 - 1.96 * 0.5803, 3)                   │
│           = round(0.3821 - 1.1374, 3)                           │
│           = round(-0.7553, 3) = -0.755                          │
│  ci_upper = round(0.3821 + 1.1374, 3)                           │
│           = round(1.5195, 3)  = 1.520                           │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  COMPUTE precision_label                                        │
│  se_theta = 0.5803                                              │
│  0.5803 < 0.3 → FALSE                                           │
│  0.5803 < 0.5 → FALSE                                           │
│  else → precision_label = "Low precision (more items ...)"      │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  COMPUTE pct_correct                                            │
│  pct_correct = round((6 / 10) * 100, 1)                         │
│              = round(60.0, 1) = 60.0                            │
└─────────────────────────────────────────────────────────────────┘
        ↓
OUTPUTS via flow variable pointers (↑):
  ability_label   "Average"
  ci_lower        -0.755
  ci_upper         1.520
  precision_label "Low precision (more items recommended)"
  pct_correct      60.0
  theta            0.3821   (pass-through)
  se_theta         0.5803   (pass-through)
  answered         10       (pass-through)
  total_correct    6        (pass-through)
        ↓
showPage - result
  {{theta}}           → 0.3821
  {{se_theta}}        → 0.5803
  {{ci_lower}}        → -0.755
  {{ci_upper}}        → 1.520
  {{answered}}        → 10
  {{total_correct}}   → 6
  {{ability_label}}   → Average
  {{precision_label}} → Low precision (more items recommended)
  {{pct_correct}}     → 60.0
```

---

## What the Results Page Shows

Given the computed values above, the `showPage - result` HTML renders as:

```
┌─────────────────────────────────────────────────┐
│           Test Complete!                        │
│  Results based on 3PL IRT + Bayesian EAP        │
│                                                 │
│              ╭─────────╮                        │
│              │  0.3821 │                        │
│              │ Theta(θ)│                        │
│              ╰─────────╯                        │
│                                                 │
│  95% CI: [-0.755, 1.520]                        │
│  SE(θ̂) = 0.5803                                │
│                                                 │
│  Items: 10    Correct: 6    Accuracy: 60.0%     │
│                                                 │
│  Ability Level: [Average]                       │
│  [Low precision (more items recommended)]       │
│                                                 │
│  [Explanation of EAP and SE...]                 │
│                                                 │
│              [Finish]                           │
└─────────────────────────────────────────────────┘
```

---

## Common Mistakes and Fixes

| Mistake | Symptom | Fix |
|---|---|---|
| Missing `theta` input port | `ability_label` always "Low" (`theta` is 0 or NULL) | Add `theta` input port with flow pointer ↓ |
| Missing `se_theta` input port | `ci_lower`/`ci_upper` wrong; `precision_label` always "Low" | Add `se_theta` input port with flow pointer ↓ |
| Missing pass-through output for `theta` | `{{theta}}` blank on results page | Add `theta` output port with flow pointer ↑ |
| `answered = 0` reaches this node | Division by zero in `pct_correct` | Add guard: `if (answered > 0) pct_correct <- ...` |
| `se_theta = 999` reaches this node | CI is `[-1957, 1958]`, precision is "Low" | Verify `if` node only fires after items are answered |
| Rounding `theta` here to 2 decimal places | Loss of precision if reused | Keep 3-4 decimal places; round only for display in HTML |

---

## Optional Enhancements

### Add a scaled score (0–100)

```r
# Convert theta to a 0-100 scale (mean=50, SD=10)
scaled_score <- round(50 + (theta * 10), 0)
scaled_score <- max(0, min(100, scaled_score))  # clamp to [0, 100]
```

### Add pass/fail classification

```r
# Define a passing cut score (e.g., theta >= 0.0 = pass)
cut_score <- 0.0

if (ci_lower > cut_score) {
  pass_fail <- "PASS"
  pass_fail_detail <- "Ability clearly above the passing standard."
} else if (ci_upper < cut_score) {
  pass_fail <- "FAIL"
  pass_fail_detail <- "Ability clearly below the passing standard."
} else {
  pass_fail <- "BORDERLINE"
  pass_fail_detail <- "Ability estimate is near the passing standard. More items recommended."
}
```

### Add percentile rank

```r
# Convert theta to percentile using standard normal CDF
# pnorm(theta) gives P(Z <= theta) for Z ~ N(0,1)
percentile_rank <- round(pnorm(theta) * 100, 0)
# theta=0.38 → pnorm(0.38) = 0.648 → 65th percentile
```

---

## Summary

`eval - compute result` is the **interpretation layer** of the CAT system. It converts raw statistical outputs into meaningful, communicable results:

| Input (raw) | Output (interpreted) |
|---|---|
| `theta = 0.3821` | `ability_label = "Average"` |
| `theta = 0.3821`, `se_theta = 0.5803` | `ci_lower = -0.755`, `ci_upper = 1.520` |
| `se_theta = 0.5803` | `precision_label = "Low precision (more items recommended)"` |
| `total_correct = 6`, `answered = 10` | `pct_correct = 60.0` |

Its design principles are:
1. **Never modify** `theta` or `se_theta` — only compute derived quantities from them
2. **Round for display** — apply final rounding here, not in computation nodes
3. **Pass through** all inputs — `showPage - result` needs everything
4. **Separate concerns** — computation here, rendering in `showPage - result`

---

## References

- Lord, F. M. (1980). *Applications of Item Response Theory to Practical Testing Problems*. Lawrence Erlbaum Associates.
- Bock, R. D., & Mislevy, R. J. (1982). Adaptive EAP estimation of ability in a microcomputer environment. *Applied Psychological Measurement, 6*(4), 431–444. https://doi.org/10.1177/014662168200600405
- Seo, D. G. (2017). Overview and current management of computerized adaptive testing in licensing/certification examinations. *Journal of Educational Evaluation for Health Professions, 14*, 17. https://doi.org/10.3352/jeehp.2017.14.17
- van der Linden, W. J., & Glas, C. A. W. (2022). *Computerized Adaptive Testing: Theory and Practice*. Kluwer Academic Publishers.
- Weiss, D. J. (n.d.). *Introduction to CAT*. IACAT. https://iacat.org/introduction-to-cat/
