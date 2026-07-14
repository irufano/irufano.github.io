---
title: "Ability Estimation - MCAT (MLE, MAP, EAP)"
date: "2026-07-14"
description: "Dokumen ini merangkum tiga metode estimasi kemampuan multidimensional CAT (MLE, MAP, EAP)"
author: "irufano"
tags:
  - AI
  - CAT
  - MCAT
  - Adaptive Test
image: "https://www.assessmentworkshop.com/wp-content/uploads/2022/04/CAT-Infographic.png"
---

Dokumen ini merangkum tiga metode estimasi kemampuan (ability, $\theta$) multidimensional CAT:
**Maximum Likelihood Estimation (MLE)**, **Maximum A Posteriori (MAP / Bayes Modal)**, dan
**Expected A Posteriori (EAP)**. Fokus dokumen: landasan teori tiap metode, pembuktian aljabar bahwa perhitungan identik dengan literatur, dan contoh perhitungan manual
per metode.

---

## Model & Notasi Dasar (dipakai oleh ketiga metode)

Model respons item M3PL/M2PL [1, Eq.1, p.275]:

$$
P_i(\boldsymbol\theta) = c_i + (1-c_i)\,\sigma(\mathbf{a}_i\cdot\boldsymbol\theta + d_i), \qquad
\sigma(z) = \frac{1}{1+e^{-z}}
$$

**Likelihood dari seluruh respons yang sudah di-observasi** [1, Eq.2–3, p.276]:

$$
\hat{\boldsymbol\theta} \equiv \arg\max_{\boldsymbol\theta} f(\mathbf{u}\mid\boldsymbol\theta), \qquad
f(\mathbf{u}\mid\boldsymbol\theta) = \prod_{i=1}^{n} P_i(\boldsymbol\theta)^{u_i}\,Q_i(\boldsymbol\theta)^{1-u_i}
$$

dengan $u_i\in\{0,1\}$ respons examinee pada item $i$ yang sudah di-administer, dan
$Q_i(\boldsymbol\theta)=1-P_i(\boldsymbol\theta)$. Mulder & van der Linden menyatakan langsung
setelah Eq.3 [1, p.276]: *"The MLE can [be] found by setting the derivative of the logarithm of
(3) equal to zero and solv[ing] the system for $\theta$ using a numerical method such as
Newton–Raphson (e.g., Segall, 1996) or an EM algorithm."* — namun paper tidak menuliskan bentuk
eksplisit turunannya. Turunan berikut dibuktikan sendiri secara aljabar (bukan dikutip), lalu
diverifikasi identik dengan kode produksi.

### 0.1 Pembuktian: Skor (gradien log-likelihood)

$$
\log f(\mathbf{u}\mid\boldsymbol\theta) = \sum_{i=1}^n \Big[u_i\log P_i(\boldsymbol\theta) + (1-u_i)\log Q_i(\boldsymbol\theta)\Big]
$$

Karena $\partial Q_i/\partial\boldsymbol\theta = -\partial P_i/\partial\boldsymbol\theta$:

$$
\frac{\partial \log f}{\partial\boldsymbol\theta} = \sum_i \left[\frac{u_i}{P_i} - \frac{1-u_i}{Q_i}\right]\frac{\partial P_i}{\partial\boldsymbol\theta}
= \sum_i \frac{u_iQ_i - (1-u_i)P_i}{P_iQ_i}\,\frac{\partial P_i}{\partial\boldsymbol\theta}
$$

Aljabar pembilang: $u_iQ_i-(1-u_i)P_i = u_i(1-P_i)-P_i+u_iP_i = u_i-P_i$. Dan dengan aturan rantai
pada $P_i(\boldsymbol\theta)=c_i+(1-c_i)\sigma(z_i)$, $z_i=\mathbf{a}_i\cdot\boldsymbol\theta+d_i$:

$$
\frac{\partial P_i}{\partial\boldsymbol\theta} = (1-c_i)\,\sigma(z_i)\big(1-\sigma(z_i)\big)\,\mathbf{a}_i = P'_i\,\mathbf{a}_i
$$

($P'_i$ = notasi yang sama seperti [item_selection_summary #0](/posts/cat/item-selection-criteria-mcat#model--notasi-dasar-dipakai-oleh-ketiga-metode)). Maka:

$$
\boxed{\nabla\log f(\boldsymbol\theta) = \sum_i \mathbf{a}_i\,\frac{(u_i-P_i)\,P'_i}{P_iQ_i}}
$$

Ini **identik** dengan `mle.rs:32-33`: `residual=(x-p)*p_prime/(p*q); grad += a*residual`.

### 0.2 Fisher Information Matrix sebagai pengganti Hessian (Fisher scoring)

Hessian eksak (turunan kedua $\log f$) melibatkan turunan kedua $P'_i$ yang rumit. Praktik standar
—dipakai baik oleh Baker (2001, lihat [#1.1](#11-teori)) maupun Mulder & van der Linden—adalah
mengganti Hessian dengan negatif ekspektasinya, yaitu **Fisher Information Matrix** [1, Eq.4,
p.276]:

$$
\mathbf{I}_i(\boldsymbol\theta) \equiv -E\!\left[\frac{\partial^2}{\partial\boldsymbol\theta\partial\boldsymbol\theta^\top}\log f(U_i\mid\boldsymbol\theta)\right]
= \frac{Q_i(\theta)\big[P_i(\theta)-c_i\big]^2}{P_i(\theta)(1-c_i)^2}\,\mathbf{a}_i\mathbf{a}_i^\top
$$

Substitusi ini disebut **Fisher scoring** (metode skor). Pembuktian bahwa formula ini identik
dengan `w=(P')²/(PQ)` yang dipakai `mle.rs`/`map.rs`/`mirt::item_fim`: substitusikan
$P^*=(P_i-c_i)/(1-c_i)$ (invers dari $P_i=c_i+(1-c_i)P^*$), maka $1-P^*=(1-P_i)/(1-c_i)=Q_i/(1-c_i)$,
sehingga

$$
P'_i = (1-c_i)P^*(1-P^*) = (1-c_i)\cdot\frac{P_i-c_i}{1-c_i}\cdot\frac{Q_i}{1-c_i} = \frac{(P_i-c_i)Q_i}{1-c_i}
$$

$$
w_i = \frac{(P'_i)^2}{P_iQ_i} = \frac{(P_i-c_i)^2Q_i^2/(1-c_i)^2}{P_iQ_i} = \frac{Q_i(P_i-c_i)^2}{P_i(1-c_i)^2} \quad\blacksquare
$$

— sama persis dengan $\mathbf{I}_i(\boldsymbol\theta)$ di atas. Untuk M2PL ($c_i=0$):
$w_i=P_i(1-P_i)$, dan $\mathbf{I}_i(\boldsymbol\theta)=P_i(1-P_i)\,\mathbf{a}_i\mathbf{a}_i^\top$.
FIM total teradditif atas item yang sudah dijawab [1, Eq.6, p.277]:
$\mathbf{I}_S(\boldsymbol\theta)=\sum_{i\in S}\mathbf{I}_i(\boldsymbol\theta)$, dan estimator ini
terdistribusi asimtotik normal [1, Eq.7, p.277]:
$\hat{\boldsymbol\theta}\sim N\big(\theta_0,\mathbf{I}_S^{-1}(\theta_0)\big)$ — generalisasi
multivariat dari batas bawah Cramér–Rao.

**Keterangan variabel (tambahan untuk estimasi):**

| Simbol | Arti |
|---|---|
| $\mathbf{u}=(u_1,\dots,u_n)$ | Vektor respons examinee pada $n$ item yang sudah di-administer |
| $f(\mathbf{u}\mid\boldsymbol\theta)$ | Fungsi likelihood — peluang bersama seluruh respons pada $\boldsymbol\theta$ |
| $\nabla\log f(\boldsymbol\theta)$ | Skor (*score function*) — gradien log-likelihood, $=0$ pada MLE |
| $\mathbf{I}_i(\boldsymbol\theta)$, $\mathbf{I}_S(\boldsymbol\theta)$ | FIM item $i$ / FIM kumulatif himpunan item $S$ (identik dengan $I_i(\theta)$ di item_selection notes) |
| $P^*$ | $\sigma(z_i)$, bagian sigmoid murni tanpa guessing (dipakai pada pembuktian $w_i$) |

---

## 1. Maximum Likelihood Estimation (MLE)

### 1.1 Teori

MLE mencari $\hat{\boldsymbol\theta}$ yang memaksimalkan $f(\mathbf{u}\mid\boldsymbol\theta)$
[1, Eq.2, p.276] — lihat [#0](#model--notasi-dasar-dipakai-oleh-ketiga-metode) untuk definisi
lengkap dan pembuktian skor/FIM. Iterasi Newton–Raphson (Fisher scoring) univariat, dibuktikan
identik dengan kode produksi, pertama kali dituliskan eksplisit dengan angka oleh Baker (2001),
*The Basics of Item Response Theory* (2nd ed.), Bab 5 "Estimating an Examinee's Ability",
**Eq.[5-1], p.86** [2]:

$$
\hat\theta_{s+1} = \hat\theta_s + \frac{\displaystyle\sum_{i=1}^N a_i\big[u_i-P_i(\hat\theta_s)\big]}{\displaystyle\sum_{i=1}^N a_i^2\,P_i(\hat\theta_s)\,Q_i(\hat\theta_s)}
\tag{5-1}
$$

Untuk M2PL univariat ($c=0$, $k=1$), $\nabla\log f=\sum a_i(u_i-P_i)$ ([#0.1](#01-pembuktian-skor-gradien-log-likelihood)) dan
$\mathbf{I}_S=\sum a_i^2P_iQ_i$ ([#0.2](#02-fisher-information-matrix-sebagai-pengganti-hessian-fisher-scoring)) — Eq.[5-1] Baker **adalah** Fisher scoring
$\hat\theta_{s+1}=\hat\theta_s+\mathbf{I}_S^{-1}\nabla\log f$ pada kasus 1-dimensi, dituliskan
dengan notasi $(a,b,c)$ alih-alih $(a,d,c)$ (lihat [#1.2.1](#121-demo-1--reproduksi-baker-2001-k1) untuk konversi $d=-ab$).

Generalisasi ke $k>1$ dimensi (produksi `mle.rs`) mengganti pembagian skalar dengan perkalian
matriks invers:

$$
\hat{\boldsymbol\theta}_{s+1} = \hat{\boldsymbol\theta}_s + \mathbf{I}_S(\hat{\boldsymbol\theta}_s)^{-1}\,\nabla\log f(\hat{\boldsymbol\theta}_s), \qquad \left\|\hat{\boldsymbol\theta}_{s+1}-\hat{\boldsymbol\theta}_s\right\| < 10^{-6} \Rightarrow \text{stop}
$$

Iterasi dibatasi 100 kali (`mle.rs:7`). Mulder & van der Linden mencatat langsung setelah definisi
MLE [1, p.276]: *"The likelihood function may not have a maximum (e.g., when only correct or
incorrect item responses are observed), or a local instead of a global maximum may be found."* —
dibuktikan ulang secara eksperimental di [#1.2.3](#123-demo-3--kasus-divergen-all-correct).

**Keterangan variabel:**

| Simbol | Arti |
|---|---|
| $\hat\theta_s$ | Estimasi kemampuan pada iterasi ke-$s$ |
| $a_i$ (Baker) $\equiv \mathbf{a}_i$ (notasi vektor) | Parameter diskriminasi item $i$ |
| $N$ | Jumlah item yang sudah di-administer |
| $\mathbf{I}_S(\boldsymbol\theta)^{-1}$ | Invers FIM kumulatif — berperan sebagai "step size" matriks pada Newton step |

### 1.2 Perhitungan Manual

Semua angka berikut dihasilkan oleh menjalankan
`cargo run --example estimation_mle` (`src/experimental/estimation/mle/estimation_mle.rs`), yang
memanggil fungsi produksi asli (`mirt::sigmoid`, `mirt::probability`, dan
`estimation::mle::estimate` / `estimation::estimate`) — bukan dihitung manual terpisah dari kode.

#### 1.2.1 DEMO 1 — Reproduksi Baker (2001), k=1

Item Baker (2001, p.87) dalam parameterisasi $(a,b,c)$, dikonversi ke $(a,d,c)$ produksi via
$d=-ab$ (karena $z=a\theta+d=a(\theta-b)$):

| Item | $a$ | $b$ (Baker) | $d=-ab$ | $c$ | $u$ |
|---|---|---|---|---|---|
| 1 | 1.0 | $-1$ | $+1.0$ | 0 | 1 |
| 2 | 1.2 | $0$ | $0.0$ | 0 | 0 |
| 3 | 0.8 | $1$ | $-0.8$ | 0 | 1 |

*A priori* $\hat\theta_0=1.0$ — dikutip langsung, Baker (2001, p.87): *"Initially, the $\hat\theta_s$
on the right side of the equal sign is set to some arbitrary value, such as 1."*

**Iterasi 1** (dihitung via `mirt::probability`, M2PL sehingga $P=P^*=\sigma(a\theta+d)$):

| item | $u$ | $P$ | $Q$ | $a(u-P)$ | $a^2PQ$ |
|---|---|---|---|---|---|
| 1 | 1 | 0.8808 | 0.1192 | +0.1192 | 0.1050 |
| 2 | 0 | 0.7685 | 0.2315 | -0.9222 | 0.2562 |
| 3 | 1 | 0.5000 | 0.5000 | +0.4000 | 0.1600 |
| **sum** | | | | **-0.4030** | **0.5212** |

$$
\Delta\hat\theta = \frac{-0.4030}{0.5212} = -0.7733 \quad\Rightarrow\quad \hat\theta_1 = 1.0 - 0.7733 = 0.2267
$$

**Iterasi 2:**

| item | $u$ | $P$ | $Q$ | $a(u-P)$ | $a^2PQ$ |
|---|---|---|---|---|---|
| 1 | 1 | 0.7732 | 0.2268 | +0.2268 | 0.1753 |
| 2 | 0 | 0.5676 | 0.4324 | -0.6811 | 0.3534 |
| 3 | 1 | 0.3501 | 0.6499 | +0.5199 | 0.1456 |
| **sum** | | | | **+0.0656** | **0.6744** |

$$
\Delta\hat\theta = \frac{0.0656}{0.6744} = +0.0973 \quad\Rightarrow\quad \hat\theta_2 = 0.2267+0.0973 = 0.3239
$$

**Cross-check langsung terhadap buku** (Baker 2001, p.88, angka asli):

$$
\Delta\hat\theta_s = -.403/.520 = -.773,\;\; \hat\theta_{s+1}=1.0-.773=0.227 \qquad
\Delta\hat\theta_s = .066/.674 = .097,\;\; \hat\theta_{s+1}=0.227+.097=0.324
$$

Run kode produksi menghasilkan $0.2267$ dan $0.3239$ — **cocok dengan buku sampai 3 desimal**
($0.227$, $0.324$; selisih dari pembulatan tampilan 3-desimal Baker vs 4-desimal run ini). Iterasi
3–4 melanjutkan hingga konvergen: $\hat\theta_3=0.3248$, $\hat\theta_4=0.3248$
($\|\Delta\hat\theta\|<10^{-6}$) → **$\hat\theta_{MLE}\approx 0.324846$**.

Pembuktian bahwa `mle.rs`'s residual/weight tereduksi tepat menjadi Eq.[5-1] Baker saat $k=1,c=0$:
$P'=PQ$ untuk M2PL (dari [#0.2](#02-fisher-information-matrix-sebagai-pengganti-hessian-fisher-scoring) dengan $c=0$), sehingga
$\text{residual}=(u-P)P'/(PQ)=(u-P)$ dan $w=(P')^2/(PQ)=PQ$ — identik dengan pembilang/penyebut
Eq.[5-1].

#### 1.2.2 DEMO 2 — Multidimensional (k=3), 7 item

Menggunakan seluruh 7-item bank yang sama seperti
[Item Bank Snapshot](/posts/cat/item-selection-criteria-mcat#item-bank-snapshot), dengan pola
respons **campuran** (bukan seragam per content-area — lihat catatan pemisahan sempurna di
[#1.2.3](#123-demo-3--kasus-divergen-all-correct)):

| Item | $\mathbf{a}$ | $d$ | $u$ |
|---|---|---|---|
| m2p-v001 | [1.9,0.2,0.3] | 0.40 | 1 |
| m2p-v002 | [1.7,0.2,0.2] | 0.10 | 0 |
| m2p-n001 | [0.3,1.9,0.4] | 0.80 | 0 |
| m2p-n002 | [0.3,1.8,0.4] | 0.50 | 1 |
| m2p-r001 | [0.5,0.4,2.0] | 0.30 | 1 |
| m2p-r002 | [0.3,0.8,1.9] | 0.60 | 0 |
| m2p-r003 | [0.4,0.3,1.8] | 0.70 | 1 |

Starting $\hat{\boldsymbol\theta}_0=[0,0,0]$ (`mle.rs:6`, `DVector::zeros`).

**Iterasi 1** — $\nabla\log f$ dan $\mathbf{I}_S$ dihitung persis seperti [#0.1](#01-pembuktian-skor-gradien-log-likelihood)/[#0.2](#02-fisher-information-matrix-sebagai-pengganti-hessian-fisher-scoring), dijumlahkan atas ke-7 item:

$$
\nabla\log f = [-0.0719,\,-0.9029,\,0.1121]
$$

$$
\mathbf{I}_S = \begin{bmatrix} 1.7456 & 0.5553 & 0.8101 \\ 0.5553 & 1.7587 & 1.0192 \\ 0.8101 & 1.0192 & 2.6255 \end{bmatrix}
$$

$$
\Delta\hat{\boldsymbol\theta} = \mathbf{I}_S^{-1}\nabla\log f = [0.0418,\,-0.7017,\,0.3022] \quad\Rightarrow\quad \hat{\boldsymbol\theta}_1 = [0.0418,\,-0.7017,\,0.3022]
$$

**Iterasi 2** ($\hat{\boldsymbol\theta}=\hat{\boldsymbol\theta}_1$):

$$
\nabla\log f = [0.0159,\,0.0803,\,0.0314], \qquad
\mathbf{I}_S = \begin{bmatrix} 1.7327 & 0.5577 & 0.7704 \\ 0.5577 & 1.8204 & 0.9996 \\ 0.7704 & 0.9996 & 2.4510 \end{bmatrix}
$$

$$
\Delta\hat{\boldsymbol\theta} = [-0.0039,\,0.0485,\,-0.0057] \quad\Rightarrow\quad \hat{\boldsymbol\theta}_2 = [0.0379,\,-0.6532,\,0.2964]
$$

**Iterasi 3:** $\nabla\log f\approx[-0.0001,-0.0007,-0.0001]$ (mendekati nol) →
$\hat{\boldsymbol\theta}_3 = [0.03797,\,-0.65370,\,0.29657]$, konvergen.

**Cross-check API produksi** (`estimation::estimate(Mle, ...)`, mulai dari $\theta=[0,0,0]$ juga):
$\hat{\boldsymbol\theta}_{MLE}=[0.03797,\,-0.65370,\,0.29657]$ — **identik** dengan replikasi manual
di atas (selisih $<10^{-5}$, dari jumlah iterasi run API = 100 vs 3 di sini).

#### 1.2.3 DEMO 3 — Kasus Divergen (all-correct)

Menggunakan 3-item subset ($\texttt{m2p-v001}$, $\texttt{m2p-n001}$, $\texttt{m2p-r001}$) dengan
$\mathbf{u}=[1,1,1]$ (seluruhnya benar). Menjalankan `estimation::estimate(Mle, ...)` (100 iterasi
Newton-Raphson penuh):

$$
\hat{\boldsymbol\theta}_{MLE} = [16.065,\; 14.291,\; 11.594], \qquad \|\hat{\boldsymbol\theta}\| = 24.43
$$

Ini secara langsung mereproduksi peringatan Mulder & van der Linden [1, p.276] (dikutip di
[#1.1](#11-teori)): dengan tepat $k=3$ item untuk $k=3$ dimensi dan pola respons yang **bersih**
per content-area (semua item verbal/numeric/reasoning konsisten benar), sistem persis-determinasi
ini analog dengan **pemisahan sempurna** (*complete/quasi-complete separation*) pada regresi
logistik: karena ketiga vektor $\mathbf{a}_i$ memiliki komponen positif di semua dimensi, ada arah
$\mathbf{v}$ sehingga $\mathbf{a}_i\cdot\mathbf{v}>0$ untuk seluruh item yang benar — sepanjang
$\boldsymbol\theta\to\infty\mathbf{v}$, $P_i\to1$ untuk semua item serentak, skor
$\nabla\log f\to\mathbf{0}^+$ tanpa pernah benar-benar mencapai akar interior. Inilah mengapa
[#1.2.2](#122-demo-2--multidimensional-k3-7-item) sengaja memakai pola respons **campuran** (bukan seragam per area) dan **7 item**
(bukan 3) — pola seragam/persis-determinasi pada bank item ini mudah terpisah sempurna dan
membuat MLE divergen, bahkan tanpa semua-benar/semua-salah literal.

### 1.3 Kelebihan & Kekurangan

**Kelebihan:**
- Landasan teori paling matang & tertua — dasar dari seluruh literatur IRT sejak Lord (1980),
  dan Newton-Raphson/Fisher scoring-nya sudah didokumentasikan lengkap dengan contoh numerik
  ber-halaman oleh Baker (2001) [2, Eq.5-1, p.86-88].
- Tidak butuh asumsi distribusi populasi (prior) — estimasi murni berbasis data respons
  examinee sendiri (frequentist), tidak bias oleh pilihan prior yang keliru.
- Asimtotik efisien & normal [1, Eq.7, p.277] — untuk tes yang cukup panjang, varians estimasi
  mendekati batas bawah Cramér–Rao.

**Kekurangan:**
- **Divergen** bila pola respons dapat dipisahkan sempurna oleh arah linear tertentu dari
  $\mathbf{a}_i$ — dibuktikan langsung di [#1.2.3](#123-demo-3--kasus-divergen-all-correct), bukan hanya kasus trivial
  all-correct/all-incorrect. Risiko ini lebih tinggi di awal tes (item sedikit) — persis mengapa
  MCAT umumnya memakai MAP di round-round awal (lihat [#2](#2-maximum-a-posteriori-map--bayes-modal)).
- Tidak ada mekanisme built-in untuk mencegah estimasi ekstrem — kode produksi (`mle.rs`) tidak
  meng-clamp $\hat\theta$, sehingga kasus divergen menghasilkan nilai besar tak-berguna
  (mis. $\|\hat\theta\|=24.43$ di [#1.2.3](#123-demo-3--kasus-divergen-all-correct)) alih-alih error eksplisit.
- Butuh minimal beberapa item dengan variasi respons (benar & salah) untuk estimasi yang stabil —
  tidak cocok dipakai sebagai estimator tunggal di 1-2 round pertama CAT.

---

## 2. Maximum A Posteriori (MAP / Bayes Modal)

### 2.1 Teori

MAP (disebut juga *Bayes Modal*/BM) memaksimalkan **posterior**, bukan likelihood murni — Magis &
Raîche (2012), *"Random Generation of Response Patterns under Computerized Adaptive Testing with
the R Package catR"*, Journal of Statistical Software 48(8), **#2.2 "Ability estimation", p.4-5**
[3]:

$$
g(\theta) = f(\theta)\,L(\theta) \qquad\Rightarrow\qquad \log g(\theta) = \log f(\theta) + \log L(\theta) \tag{5, p.5}
$$

$$
\hat\theta_{BM} = \arg\max_\theta g(\theta)
$$

dengan $f(\theta)$ *prior* dan $L(\theta)$ likelihood (identik $f(\mathbf u\mid\theta)$ di
[#0](#model--notasi-dasar-dipakai-oleh-ketiga-metode)). Magis & Raîche [3, p.4]: *"The choice of a prior distribution is
usually driven by some prior belief of the ability distribution among the population of
examinees. The most common choice is the normal distribution with mean $\mu$ and variance
$\sigma^2$."* Kode produksi menggunakan **multivariate normal** $\pi(\boldsymbol\theta)=N(\boldsymbol\mu,\boldsymbol\Sigma)$
dengan $\boldsymbol\Sigma$ diagonal (`prior_cov_diag`, `engine.rs:112`). Paper aslinya (BM
diformalkan oleh Mislevy 1986 [4], dirujuk di [3, p.4]) tidak dapat diakses gratis untuk
verifikasi halaman langsung — diverifikasi silang melalui Magis & Raîche [3] yang open access dan
mereproduksi definisi Eq.5 secara eksplisit dengan nomor persamaan.

**Pembuktian (bukan dikutip, diturunkan sendiri dari Eq.5 di atas):** untuk prior multivariate
normal $\pi(\boldsymbol\theta)=(2\pi)^{-k/2}|\boldsymbol\Sigma|^{-1/2}\exp\!\big(-\tfrac12(\boldsymbol\theta-\boldsymbol\mu)^\top\boldsymbol\Sigma^{-1}(\boldsymbol\theta-\boldsymbol\mu)\big)$:

$$
\log f(\boldsymbol\theta) = -\tfrac12(\boldsymbol\theta-\boldsymbol\mu)^\top\boldsymbol\Sigma^{-1}(\boldsymbol\theta-\boldsymbol\mu) + \text{const}
$$

$$
\nabla\log f(\boldsymbol\theta) = -\boldsymbol\Sigma^{-1}(\boldsymbol\theta-\boldsymbol\mu), \qquad
\frac{\partial^2\log f}{\partial\boldsymbol\theta\partial\boldsymbol\theta^\top} = -\boldsymbol\Sigma^{-1}
$$

(turunan standar bentuk kuadratik multivariat — eksak, bukan ekspektasi, karena $\log f$ memang
kuadratik murni). Menggabungkan dengan skor & FIM likelihood dari [#0.1](#01-pembuktian-skor-gradien-log-likelihood)/[#0.2](#02-fisher-information-matrix-sebagai-pengganti-hessian-fisher-scoring):

$$
\boxed{\nabla\log g(\boldsymbol\theta) = \nabla\log f(\boldsymbol\theta) - \boldsymbol\Sigma^{-1}(\boldsymbol\theta-\boldsymbol\mu)}
\qquad
\boxed{\mathbf{H}_{MAP} \approx \mathbf{I}_S(\boldsymbol\theta) + \boldsymbol\Sigma^{-1}}
$$

— **identik** dengan `map.rs:9,25`: `hess = prior_cov_inv.clone(); ...; grad -= prior_cov_inv * (theta - prior_mean)`.
Newton step: $\hat{\boldsymbol\theta}_{s+1}=\hat{\boldsymbol\theta}_s+\mathbf{H}_{MAP}^{-1}\nabla\log g$,
mulai dari $\hat{\boldsymbol\theta}_0=\boldsymbol\mu$ (`map.rs:6`), bukan $\mathbf 0$ seperti MLE.

Karena $\boldsymbol\Sigma^{-1}\succeq0$ selalu ditambahkan ke $\mathbf{I}_S(\boldsymbol\theta)\succeq0$,
$\mathbf{H}_{MAP}\succeq\mathbf{H}_{MLE}$ — informasi MAP selalu $\geq$ MLE, menjelaskan standard
error MAP yang lebih kecil, sesuai [3, Eq.6, p.5]:
$se(\hat\theta_{BM}) = 1/\sqrt{1/\sigma^2 + \sum_i I_i(\hat\theta_{BM})}$ (bentuk univariat; kode
produksi tidak menghitung $se$ secara eksplisit, hanya titik estimasi $\hat\theta$).

**Keterangan variabel (tambahan untuk MAP):**

| Simbol | Arti |
|---|---|
| $g(\theta)$ | Posterior tak-ternormalisasi $=f(\theta)L(\theta)$ |
| $f(\theta)$, $\pi(\boldsymbol\theta)$ | Densitas prior (dipakai bergantian, notasi Magis & Raîche vs notasi umum) |
| $\boldsymbol\mu$, $\boldsymbol\Sigma$ | Mean & kovarians prior (produksi: `prior_mean`, `diag(prior_cov_diag)`) |
| $\boldsymbol\Sigma^{-1}$ | *Prior precision* — presisi/informasi prior, ditambahkan langsung ke FIM |
| $\mathbf{H}_{MAP}$ | Hessian (Fisher scoring) posterior $=\mathbf{I}_S(\theta)+\boldsymbol\Sigma^{-1}$ |

### 2.2 Perhitungan Manual

Dijalankan via `cargo run --example estimation_map`
(`src/experimental/estimation/map/estimation_map.rs`).

#### 2.2.1 DEMO 1 — MAP vs MLE (k=1), prior N(0,1)

Item & respons identik [#1.2.1](#121-demo-1--reproduksi-baker-2001-k1), prior $\mu=0,\sigma^2=1\Rightarrow\Sigma^{-1}=1.0$.
$\hat\theta_0=\mu=0$.

**Iterasi 1:** $\nabla\log L=0.2209$ (dihitung sama seperti [#0.1](#01-pembuktian-skor-gradien-log-likelihood) via `mirt::probability`
untuk ketiga item), prior term $=\Sigma^{-1}(\theta-\mu)=0$ →
$\nabla\log g = 0.2209$. $H_{LL}=0.6935$, $H_{MAP}=0.6935+1.0=1.6935$.
$\Delta\hat\theta = 0.2209/1.6935=+0.1305 \Rightarrow \hat\theta_1=0.1305$.

**Iterasi 2:** $\nabla\log L=0.1310$, prior term $=1.0\times(0.1305-0)=0.1305$,
$\nabla\log g=0.0005$. $H_{MAP}=1.6844$. $\Delta\hat\theta=0.0003\Rightarrow\hat\theta_2=0.1308$.

**Iterasi 3:** konvergen, $\hat\theta_{MAP}\approx 0.130769$.

Dibandingkan $\hat\theta_{MLE}\approx0.324846$ pada item yang **sama** tanpa prior
([#1.2.1](#121-demo-1--reproduksi-baker-2001-k1)): MAP menarik estimasi ke arah $\mu=0$, sesuai deskripsi Magis & Raîche [3, p.4]:
*"the BM estimator ... is obtained by a combination of the prior distribution $f(\theta)$ and the
likelihood function $L(\theta)$."*

#### 2.2.2 DEMO 2 — Multidimensional (k=3), 7 item, prior N(0,I)

Item, respons, dan $\hat{\boldsymbol\theta}_0$ berbeda dari MLE: MAP mulai dari
$\hat{\boldsymbol\theta}_0=\boldsymbol\mu=[0,0,0]$ (kebetulan sama nilainya dengan start MLE di
[#1.2.2](#122-demo-2--multidimensional-k3-7-item) karena $\mu=\mathbf 0$, tapi secara konseptual berbeda sumber:
`map.rs:6` vs `mle.rs:6`).

**Iterasi 1:** $\nabla\log L=[-0.0719,-0.9029,0.1121]$ (identik dengan MLE iterasi 1 di
[#1.2.2](#122-demo-2--multidimensional-k3-7-item), karena bagian likelihood-nya sama), prior term $=\mathbf 0$ (karena
$\theta_0=\mu$) → $\nabla\log g=$ sama. $\mathbf H_{MAP}$ diagonal $=[2.7456,2.7587,3.6255]$
(diagonal FIM $[1.7456,1.7587,2.6255]$ dari [#1.2.2](#122-demo-2--multidimensional-k3-7-item) $+1.0$ presisi prior). Newton step:
$\Delta\hat{\boldsymbol\theta}=[0.0107,-0.3794,0.1352]\Rightarrow\hat{\boldsymbol\theta}_1=[0.0107,-0.3794,0.1352]$.

**Iterasi 2:** $\nabla\log L=[0.0174,-0.3402,0.1455]$, prior term $=[0.0107,-0.3794,0.1352]$,
$\nabla\log g=[0.0067,0.0392,0.0103]$ (jauh lebih kecil — hampir konvergen).
$\hat{\boldsymbol\theta}_2=[0.0105,-0.3656,0.1340]$.

**Iterasi 3:** konvergen → $\hat{\boldsymbol\theta}_{MAP}=[0.0105,\,-0.3656,\,0.1340]$.

**Perbandingan langsung** (data identik, API produksi):

| Metode | $\hat\theta_{verbal}$ | $\hat\theta_{numeric}$ | $\hat\theta_{reasoning}$ |
|---|---|---|---|
| MLE (no prior) | 0.0380 | -0.6537 | 0.2966 |
| MAP ($\Sigma=I$) | 0.0105 | -0.3656 | 0.1340 |

MAP tersusut (*shrinkage*) ke arah $\mathbf 0$ di **ketiga** dimensi — konsekuensi langsung
$\mathbf H_{MAP}=\mathbf I_S+\mathbf I\succ\mathbf I_S$ yang dibuktikan di [#2.1](#21-teori).

#### 2.2.3 DEMO 3 — MAP Meregularisasi Kasus Divergen

Data identik [#1.2.3](#123-demo-3--kasus-divergen-all-correct) (3 item, $\mathbf u=[1,1,1]$, prior $N(\mathbf 0,\mathbf I)$):

$$
\hat{\boldsymbol\theta}_{MLE} = [16.065,\,14.291,\,11.594],\; \|\hat\theta\|=24.43 \qquad\text{(divergen, lihat \S1.2.3)}
$$

$$
\hat{\boldsymbol\theta}_{MAP} = [0.4719,\,0.3688,\,0.4505],\; \|\hat\theta\|=0.75 \qquad\text{(finite, teregularisasi)}
$$

**Mengapa MAP tetap finite:** pada $\boldsymbol\theta$ besar, $\nabla\log L\to\mathbf0^+$ (tidak
pernah negatif untuk pola all-correct — lihat [#1.2.3](#123-demo-3--kasus-divergen-all-correct)) tapi TIDAK PERNAH melewati nol.
Dengan prior, $\nabla\log g=\nabla\log L-\boldsymbol\Sigma^{-1}(\boldsymbol\theta-\boldsymbol\mu)$
— suku kedua tumbuh makin negatif seiring $\boldsymbol\theta$ menjauhi $\boldsymbol\mu$, sehingga
pada suatu $\boldsymbol\theta$ finite, kedua suku saling meniadakan persis di titik nol —
mode posterior selalu ada untuk prior proper (terintegralkan), persis seperti dijelaskan
Magis & Raîche [3, p.4-5].

### 2.3 Kelebihan & Kekurangan

**Kelebihan:**
- **Tidak pernah divergen** untuk prior proper — dibuktikan langsung pada kasus yang membuat MLE
  divergen di [#2.2.3](#223-demo-3--map-meregularisasi-kasus-divergen).
- Landasan teori kuat (Bayes modal, Mislevy 1986 [4]; diverifikasi silang via Magis & Raîche [3,
  Eq.5-6, p.5]), sekaligus tetap murah komputasi — Newton-Raphson dengan FIM, sama seperti MLE,
  hanya menambah $\boldsymbol\Sigma^{-1}$ ke Hessian dan suku prior ke gradien.
- Efektif dipakai sejak round pertama CAT (start dari $\boldsymbol\mu$, bukan butuh estimasi awal
  arbitrer seperti MLE) — cocok untuk re-estimasi di awal tes ketika jumlah item masih sedikit.

**Kekurangan:**
- **Bias ke arah prior** — jika $\boldsymbol\mu$ tidak mencerminkan kemampuan examinee sebenarnya
  (mis. populasi prior salah untuk sub-grup tertentu), estimasi MAP secara sistematis tertarik ke
  $\boldsymbol\mu$, terbukti pada [#2.2.2](#222-demo-2--multidimensional-k3-7-item-prior-n0i) (MAP $\neq$ MLE meski data sama).
- Memerlukan spesifikasi prior ($\boldsymbol\mu$, $\boldsymbol\Sigma$) yang, tidak seperti EAP,
  hanya dipakai sebagai *penalti* pada titik mode — bukan diintegralkan penuh atas seluruh
  ruang $\boldsymbol\theta$ (band. [#3](#3-expected-a-posteriori-eap)).
- $se(\hat\theta_{BM})$ dalam bentuk tertutup [3, Eq.6, p.5] tidak diimplementasikan di kode
  produksi (`map.rs` hanya mengembalikan titik estimasi $\hat\theta$, bukan standard error) —
  temuan langsung dari membaca `map.rs`, bukan asumsi.

---

## 3. Expected A Posteriori (EAP)

### 3.1 Teori

EAP menghitung **rata-rata posterior** (bukan modus seperti MAP) — Magis & Raîche (2012), **#2.2,
p.5-6, Eq.10-11** [3]:

$$
\hat\theta_{EAP} = \frac{\displaystyle\int_{-\infty}^{+\infty}\theta\,f(\theta)\,L(\theta)\,d\theta}{\displaystyle\int_{-\infty}^{+\infty} f(\theta)\,L(\theta)\,d\theta}
\tag{10, p.5}
$$

$$
se(\hat\theta_{EAP}) = \left[\frac{\int_{-\infty}^{+\infty}(\theta-\hat\theta_{EAP})^2f(\theta)L(\theta)d\theta}{\int_{-\infty}^{+\infty}f(\theta)L(\theta)d\theta}\right]^{1/2}
\tag{11, p.6}
$$

Sumber asli metode ini, Bock & Mislevy (1982), *"Adaptive EAP estimation of ability in a
microcomputer environment"*, Applied Psychological Measurement 6(4):431-444 [5], tidak dapat
diakses gratis untuk verifikasi halaman langsung — diverifikasi silang melalui Magis & Raîche [3]
yang secara eksplisit mengaitkan Eq.10 dengan Bock & Mislevy (1982) [3, p.5]: *"The third estimator
is the expected a posteriori (EAP) estimator (Bock and Mislevy 1982)."*

Magis & Raîche [3, p.6] menyatakan integral pada Eq.10-11 **"are approximated, for instance by
adaptive quadrature or numerical integration"** — tanpa memberi resep pasti. Kode produksi
(`eap.rs`) mendekati integral dengan **grid berjarak sama** (bukan node Gauss-Hermite klasik) per
dimensi:

$$
\theta_{q} = -3\sigma + 6\sigma\cdot\frac{q}{pts-1}, \qquad q=0,1,\dots,pts-1
$$

dan menjumlahkan atas seluruh kombinasi grid $k$-dimensi ($pts^k$ titik total):

$$
\hat{\boldsymbol\theta}_{EAP} \approx \frac{\sum_{\text{grid}} \boldsymbol\theta_q \cdot L(\boldsymbol\theta_q)\cdot\pi(\boldsymbol\theta_q)}{\sum_{\text{grid}} L(\boldsymbol\theta_q)\cdot\pi(\boldsymbol\theta_q)}, \qquad \pi(\boldsymbol\theta_q)=\prod_{d=1}^k N(\theta_{q,d};0,\sigma)
$$

Pola penjumlahan multi-indeks atas grid ini (bukan rumus per-dimensinya) sama seperti teknik
kuadratur Gauss-Hermite $k$-dimensi pada Chalmers (2012), *"mirt: A Multidimensional Item Response
Theory Package for the R Environment"*, JSS 48(6), **Eq.6, p.5** [6]:
$\tilde P_\ell=\sum_{q_m}\cdots\sum_{q_1}L_\ell(\mathbf x_\ell\mid\boldsymbol\Psi,\mathbf K)\,g(K_{q1})g(K_{q2})\cdots g(K_{qm})$
— meski Eq.6 [6] dipakai untuk mengintegralkan $\theta$ sebagai *nuisance parameter* pada estimasi
parameter item (EM), bukan untuk EAP examinee individual, teknik diskretisasi grid multi-indeksnya
identik.

**Catatan implementasi penting (ditemukan langsung dari membaca `eap.rs`, bukan asumsi):**
1. Grid `eap.rs:9-11` berjarak **sama rata** ($-3\sigma$ s.d. $+3\sigma$), **bukan** node
   Gauss-Hermite klasik (yang tidak berjarak sama, dipilih dari akar polinomial Hermite untuk
   akurasi optimal pada integral berbobot Gaussian). Ini adalah pilihan implementasi/simplifikasi,
   bukan transkripsi literal dari kuadratur Gauss-Hermite Bock & Mislevy (1982).
2. `eap.rs` **hardcode 3 dimensi** (nested loop `q0,q1,q2` eksplisit) — tidak generik untuk
   $k\neq3$, berbeda dari `mle.rs`/`map.rs` yang bekerja untuk $k$ berapa pun via `nalgebra::DVector`.
3. Prior EAP **selalu** $N(\mathbf 0,\sigma^2\mathbf I)$ — grid berpusat di $0$ (`eap.rs:10`,
   tidak ada offset `prior_mean`) dan `normal_density` dipanggil dengan `mu=0.0` hardcoded
   (`eap.rs:20-22`). Ini **mengabaikan** `settings.prior_mean`/`prior_cov_diag` yang dipakai MAP —
   sebuah inkonsistensi antar-metode di kode produksi saat ini (`engine.rs:124`:
   `eap_prior_sd: 1.0` juga di-hardcode, bukan dari `settings.prior_cov_diag`).

**Keterangan variabel (tambahan untuk EAP):**

| Simbol | Arti |
|---|---|
| $\hat\theta_{EAP}$ | Estimasi = rata-rata (mean) posterior, bukan modus |
| $\theta_q$, $\boldsymbol\theta_q$ | Titik grid kuadratur ke-$q$ (skalar/vektor) |
| $pts$ | Jumlah titik grid per dimensi (`eap_quad_pts`, default 21 di `engine.rs:123`) |
| $\pi(\boldsymbol\theta_q)$ | Bobot prior pada titik grid $=\prod_d N(\theta_{q,d};0,\sigma)$ |
| $L(\boldsymbol\theta_q)$ | Likelihood seluruh respons pada titik grid $=\prod_i P_i(\boldsymbol\theta_q)^{u_i}Q_i(\boldsymbol\theta_q)^{1-u_i}$ |

### 3.2 Perhitungan Manual

Dijalankan via `cargo run --example estimation_eap`
(`src/experimental/estimation/eap/estimation_eap.rs`).

#### 3.2.1 DEMO 1 — Reproduksi 1 Dimensi (pts=5)

Item $a=1.5,d=0,c=0$, respons benar ($x=1$), $\sigma=1.0$, grid $=[-3,-1.5,0,1.5,3]$ — item &
grid yang sama seperti contoh ilustratif di `MCAT_EXPLANATION.md` #5.3.

| $\theta_q$ | $P(x{=}1\mid\theta_q)$ | $\pi(\theta_q){=}N(\theta_q;0,1)$ | $w=L\cdot\pi$ |
|---|---|---|---|
| $-3.0$ | 0.010987 | 0.004432 | 0.000049 |
| $-1.5$ | 0.095349 | 0.129518 | 0.012349 |
| $0.0$ | 0.500000 | 0.398942 | 0.199471 |
| $+1.5$ | 0.904651 | 0.129518 | 0.117168 |
| $+3.0$ | 0.989013 | 0.004432 | 0.004383 |

$$
\hat\theta_{EAP} = \frac{\sum\theta_q w_q}{\sum w_q} = \frac{0.170231}{0.333421} = 0.510561
$$

**Cross-check via API produksi** (`estimation::estimate(Eap,...)`) memakai *zero-loading trick*:
beri dimensi 2 & 3 diskriminasi nol ($\mathbf a=[1.5,0,0]$) supaya `eap.rs`'s grid 3-dimensi yang
hardcode tetap bisa dipakai untuk mereproduksi kasus 1-dimensi murni. Hasil:
$\hat{\boldsymbol\theta}=[0.510561,\,\approx0,\,\approx0]$ — dimensi 1 **identik** dengan
perhitungan manual di atas; dimensi 2 & 3 $\approx$ prior mean $0$ (simetri: tanpa informasi
likelihood, rata-rata posterior atas prior simetris $=$ mean prior).

**Koreksi terhadap `MCAT_EXPLANATION.md` #5.3:** dokumen tersebut menyebutkan
*"$\hat\theta_{EAP}\approx0.8$"* sebagai estimasi kasar (hanya menghitung 3 dari 5 titik grid
secara manual, prosa). Perhitungan lengkap 5-titik yang diverifikasi lewat kode produksi di atas
memberi nilai **eksak $0.510561$** — pembulatan "$\approx0.8$" ternyata terlalu tinggi karena
mengabaikan kontribusi titik $\theta=-1.5$ dan $\theta=+1.5$ yang bobotnya justru lebih besar
dari titik $\theta=\pm3.0$ (lihat kolom $w$: $0.012$ dan $0.117$, jauh lebih besar dari $0.00004$
dan $0.0044$).

#### 3.2.2 DEMO 2 — Multidimensional (k=3), 7 item, grid 5^3=125 titik

Bank item & respons identik [#1.2.2](#122-demo-2--multidimensional-k3-7-item)/[#2.2.2](#222-demo-2--multidimensional-k3-7-item-prior-n0i). Grid per dimensi $pts=5$:
$[-3,-1.5,0,1.5,3]$, total $5^3=125$ kombinasi. Sampel titik (pusat & 8 sudut kubus grid):

| $\boldsymbol\theta_q$ | $L(\boldsymbol\theta_q)$ | $\pi(\boldsymbol\theta_q)$ | $w=L\cdot\pi$ |
|---|---|---|---|
| $[-3,-3,-3]$ | 0.000000 | 0.000000 | 0.00000000 |
| $[-3,-3,+3]$ | 0.000003 | 0.000000 | 0.00000000 |
| $[-3,+3,-3]$ | 0.000000 | 0.000000 | 0.00000000 |
| $[-3,+3,+3]$ | 0.000000 | 0.000000 | 0.00000000 |
| $[0,0,0]$ | 0.007464 | 0.063494 | 0.00047394 |
| $[+3,-3,-3]$ | 0.000000 | 0.000000 | 0.00000000 |
| $[+3,-3,+3]$ | 0.000002 | 0.000000 | 0.00000000 |
| $[+3,+3,-3]$ | 0.000000 | 0.000000 | 0.00000000 |
| $[+3,+3,+3]$ | 0.000000 | 0.000000 | 0.00000000 |

(116 titik lain, termasuk seluruh kombinasi campuran, ikut dijumlahkan di bawah — hanya pusat &
8 sudut kubus yang ditampilkan agar tabel tetap ringkas.)

$$
\sum_{\text{125 titik}} w_q = 0.00071779, \qquad \sum_{\text{125 titik}}\boldsymbol\theta_q w_q = [0.0000171,\,-0.0001698,\,0.0000694]
$$

$$
\hat{\boldsymbol\theta}_{EAP}^{(pts=5)} = [0.02386,\; -0.23652,\; 0.09667]
$$

**Cross-check API produksi** ($pts=5$): identik persis. Dengan resolusi grid default produksi
($pts=21\Rightarrow21^3=9261$ titik, `engine.rs:123`):

$$
\hat{\boldsymbol\theta}_{EAP}^{(pts=21)} = [0.03223,\; -0.36394,\; 0.18238]
$$

**Perbandingan 3 metode pada data identik:**

| Metode | $\hat\theta_{verbal}$ | $\hat\theta_{numeric}$ | $\hat\theta_{reasoning}$ |
|---|---|---|---|
| MLE | 0.0380 | -0.6537 | 0.2966 |
| MAP ($\Sigma=I$) | 0.0105 | -0.3656 | 0.1340 |
| EAP ($pts=5$, grid kasar) | 0.0239 | -0.2365 | 0.0967 |
| EAP ($pts=21$, default produksi) | 0.0322 | -0.3639 | 0.1824 |

Grid $pts=21$ jauh lebih dekat ke MAP dibanding $pts=5$ (khususnya dimensi numeric: $-0.364$ vs
$-0.366$, nyaris identik) — sesuai teori: EAP dan MAP mengintegralkan/memaksimalkan posterior
**yang sama**, dan estimasi EAP konvergen ke nilai yang konsisten dengan MAP seiring resolusi
grid $pts\to\infty$ (integral kontinu). Grid $pts=5$ di atas sengaja dibuat kasar hanya supaya
seluruh 125 titik bisa ditabulasi manual.

#### 3.2.3 DEMO 3 — EAP Tidak Pernah Divergen

Data identik [#1.2.3](#123-demo-3--kasus-divergen-all-correct)/[#2.2.3](#223-demo-3--map-meregularisasi-kasus-divergen) (3 item, $\mathbf u=[1,1,1]$, $pts=21$):

| Metode | $\hat{\boldsymbol\theta}$ | $\|\hat\theta\|$ |
|---|---|---|
| MLE | $[16.065,\,14.291,\,11.594]$ | 24.43 (divergen) |
| MAP | $[0.472,\,0.369,\,0.450]$ | 0.75 (finite, regularized) |
| EAP | $[0.579,\,0.476,\,0.560]$ | 0.94 (finite by construction) |

EAP finite untuk **alasan berbeda** dari MAP: bukan karena penalti pada gradien Newton-Raphson,
melainkan karena integral pada Eq.10 [3, p.5] dihitung atas grid **terbatas** ($[-3\sigma,3\sigma]$
per dimensi) dengan bobot prior yang selalu positif dan pembilang/penyebut yang keduanya pasti
finite untuk pola respons apa pun — tidak ada proses iteratif yang bisa "kabur" ke infinity.

### 3.3 Kelebihan & Kekurangan

**Kelebihan:**
- **Tidak pernah divergen**, untuk alasan yang lebih fundamental dari MAP: bukan hasil regularisasi
  optimasi, melainkan sifat integral pada domain terbatas — dibuktikan di [#3.2.3](#323-demo-3--eap-tidak-pernah-divergen).
- Tidak butuh titik awal/iterasi Newton-Raphson sama sekali (tidak ada risiko konvergen ke
  maksimum lokal yang salah, tidak seperti MLE/MAP) — estimasi dihitung langsung dari satu kali
  penjumlahan grid.
- Menyediakan estimasi *se* dalam bentuk tertutup [3, Eq.11, p.6] yang secara alami konsisten
  dengan definisi rata-rata posteriornya (meski tidak diimplementasikan produksi — lihat
  Kekurangan).

**Kekurangan:**
- **Akurasi bergantung penuh pada resolusi grid** $pts$ — dibuktikan di [#3.2.2](#322-demo-2--multidimensional-k3-7-item-grid-53125-titik): $pts=5$ vs
  $pts=21$ menghasilkan estimasi yang berbeda cukup jauh pada dimensi reasoning ($0.097$ vs
  $0.182$). Biaya komputasi tumbuh $pts^k$ — untuk $k=3$, $pts=21$ berarti $9261$ evaluasi
  likelihood per estimasi, jauh lebih mahal dari MLE/MAP (~3-5 iterasi Newton).
- **Bug/keterbatasan konkret yang ditemukan langsung dari kode**: `eap.rs` hardcode $k=3$
  (nested loop `q0,q1,q2`) — tidak akan bekerja untuk MCAT dengan jumlah dimensi $\neq3$ tanpa
  modifikasi kode, berbeda dari `mle.rs`/`map.rs` yang generik untuk $k$ berapa pun.
- **Prior tidak konsisten** dengan MAP: EAP selalu memakai $N(\mathbf 0,\sigma^2\mathbf I)$
  (grid berpusat $0$, `eap_prior_sd` konstan di-hardcode `1.0` di `engine.rs:124`), mengabaikan
  `settings.prior_mean`/`prior_cov_diag` yang justru dipakai MAP — berarti mengganti
  `estimation_method` dari `map` ke `eap` di `TestSettings` diam-diam mengganti prior yang
  dipakai, bukan hanya metodenya. Temuan langsung dari membaca `engine.rs:111-125` dan `eap.rs`.
- Grid berjarak-sama bukan kuadratur Gauss-Hermite klasik (lihat [#3.1](#31-teori) catatan implementasi #1) — pada
  jumlah titik yang sama, akurasi integrasinya secara teoretis lebih rendah dari node
  Gauss-Hermite yang dioptimalkan untuk bobot Gaussian.

---

## 4. Ringkasan Perbandingan

| Metode | Formula Inti | Butuh Prior? | Titik Awal | Bisa Divergen? |
|---|---|---|---|---|
| MLE | $\arg\max_\theta f(\mathbf u\mid\theta)$ | Tidak | $\mathbf 0$ | Ya ([#1.2.3](#123-demo-3--kasus-divergen-all-correct)) |
| MAP | $\arg\max_\theta f(\theta)L(\theta)$ | Ya | $\boldsymbol\mu$ (prior mean) | Tidak (prior proper) |
| EAP | $\dfrac{\int\theta f(\theta)L(\theta)d\theta}{\int f(\theta)L(\theta)d\theta}$ | Ya (selalu $N(\mathbf0,\sigma^2\mathbf I)$, lihat [#3.1](#31-teori)) | N/A (bukan iteratif) | Tidak |

**Hasil numerik pada dataset identik** (7 item, pola respons campuran — lihat
[#1.2.2](#122-demo-2--multidimensional-k3-7-item)):

| Metode | $\hat\theta_{verbal}$ | $\hat\theta_{numeric}$ | $\hat\theta_{reasoning}$ |
|---|---|---|---|
| MLE | 0.0380 | -0.6537 | 0.2966 |
| MAP ($\Sigma=I$) | 0.0105 | -0.3656 | 0.1340 |
| EAP ($pts=21$) | 0.0322 | -0.3639 | 0.1824 |

**Hasil numerik pada dataset all-correct (kasus divergen MLE)** — lihat [#1.2.3](#123-demo-3--kasus-divergen-all-correct):

| Metode | $\hat\theta$ | $\|\hat\theta\|$ |
|---|---|---|
| MLE | $[16.065,14.291,11.594]$ | 24.43 |
| MAP | $[0.472,0.369,0.450]$ | 0.75 |
| EAP | $[0.579,0.476,0.560]$ | 0.94 |

| Aspek | MLE | MAP | EAP |
|---|---|---|---|
| Basis teori | Likelihood murni (frequentist) | Posterior mode (Bayesian) | Posterior mean (Bayesian) |
| Algoritma | Newton-Raphson / Fisher scoring | Newton-Raphson / Fisher scoring + prior | Kuadratur grid (bukan iteratif) |
| Cocok untuk tahap tes | Menengah–akhir (butuh $\geq$ beberapa item non-separable) | Awal–akhir (aman sejak round 1) | Awal–akhir (aman sejak round 1, tapi mahal) |
| Risiko utama | Divergensi pada pola respons separable | Bias ke prior jika $\mu$ keliru | Akurasi bergantung $pts$; prior selalu isotropik $N(0,\sigma^2I)$ |
| Biaya komputasi | Rendah (~3-5 iterasi $k\times k$ inverse) | Rendah (sama seperti MLE) | Tinggi ($pts^k$ evaluasi likelihood) |

---

## Referensi

**[1]** Mulder, J., & van der Linden, W. J. (2009). Multidimensional Adaptive Testing with Optimal
Design Criteria for Item Selection. *Psychometrika*, 74(2), 273–296.
https://doi.org/10.1007/s11336-008-9097-5 — Full text gratis (PubMed Central, open access):
https://pmc.ncbi.nlm.nih.gov/articles/PMC2813188/ (mirror PDF jurnal dengan nomor halaman asli:
https://www.cambridge.org/core/services/aop-cambridge-core/content/view/A3BFF7744EDCE563819C31270D9C7E7D/S0033312300021608a.pdf/multidimensional-adaptive-testing-with-optimal-design-criteria-for-item-selection.pdf).
Sumber untuk: model M3PL (Eq.1, p.275), definisi MLE & fungsi likelihood (Eq.2-3, p.276),
pernyataan Newton-Raphson & catatan non-eksistensi maksimum (p.276), Fisher Information Matrix
(Eq.4, p.276), aditivitas FIM (Eq.6, p.277), dan normalitas asimtotik/Cramér–Rao (Eq.7, p.277).
Sama seperti [1] pada
[item_selection_summary.md](/posts/cat/item-selection-criteria-mcat#referensi), bagian
berbeda (#2-3 alih-alih #3-4).

**[2]** Baker, F. B. (2001). *The Basics of Item Response Theory* (2nd ed.). ERIC Clearinghouse on
Assessment and Evaluation, University of Maryland. Full text gratis (ERIC ED458219):
https://files.eric.ed.gov/fulltext/ED458219.pdf (mirror: https://www.ime.unicamp.br/~cnaber/Baker_Book.pdf).
Sumber untuk Bab 5 "Estimating an Examinee's Ability" (p.85-90): formula iteratif MLE univariat
Eq.[5-1] (p.86), contoh tiga-item lengkap dengan nilai *a priori* (p.87), dan tabel iterasi
1-2 yang direproduksi persis di [#1.2.1](#121-demo-1--reproduksi-baker-2001-k1) (p.88). Sama seperti [2] pada
[item_selection_summary.md](/posts/cat/item-selection-criteria-mcat#referensi) (di sana dipakai untuk Bab 6
"The Information Function", di sini untuk Bab 5).

**[3]** Magis, D., & Raîche, G. (2012). Random Generation of Response Patterns under Computerized
Adaptive Testing with the R Package catR. *Journal of Statistical Software*, 48(8), 1–31.
https://doi.org/10.18637/jss.v048.i08 — Open access (JSS). PDF:
https://www.jstatsoft.org/index.php/jss/article/view/v048i08/600 (landing page:
https://www.jstatsoft.org/v48/i08/). Sumber utama #2.2 "Ability estimation" (p.4-6): definisi ML
(Eq.2-4, p.4), Bayes Modal/MAP (Eq.5-6, p.4-5), Jeffreys' prior (Eq.7-9, p.5, tidak dipakai kode
produksi), EAP (Eq.10-11, p.5-6), dan Weighted Likelihood/Warm estimator (Eq.12-14, p.6, tidak
diimplementasikan produksi — dicatat sebagai pembanding di [#4](#4-ringkasan-perbandingan)).

**[4]** Mislevy, R. J. (1986). Bayes modal estimation in item response models. *Psychometrika*,
51(2), 177–195. https://doi.org/10.1007/BF02293979 — Sumber asli/historis estimasi Bayes
Modal (MAP). Tidak berhasil diakses gratis (Springer/Psychometrika berbayar) — klaim yang berasal
dari Mislevy (1986) pada dokumen ini hanya diverifikasi secara tidak langsung lewat definisi &
nomor persamaan yang direproduksi eksplisit di [3, Eq.5-6, p.4-5].

**[5]** Bock, R. D., & Mislevy, R. J. (1982). Adaptive EAP estimation of ability in a
microcomputer environment. *Applied Psychological Measurement*, 6(4), 431–444.
https://doi.org/10.1177/014662168200600405 — Sumber asli/historis estimasi EAP. Tidak berhasil
diakses gratis (SAGE berbayar) — klaim yang berasal dari Bock & Mislevy (1982) pada dokumen ini
hanya diverifikasi secara tidak langsung lewat definisi & nomor persamaan yang direproduksi
eksplisit di [3, Eq.10-11, p.5-6], yang juga menyitasi Bock & Mislevy (1982) secara langsung
sebagai sumber EAP (p.5).

**[6]** Chalmers, R. P. (2012). mirt: A Multidimensional Item Response Theory Package for the R
Environment. *Journal of Statistical Software*, 48(6), 1–29. https://doi.org/10.18637/jss.v048.i06
— Open access (JSS). PDF: https://www.jstatsoft.org/index.php/jss/article/view/v048i06/598
(landing page: https://www.jstatsoft.org/article/view/v048i06). Sumber untuk model M3PL
multidimensional dengan skala $D$ (Eq.1, p.3 — produksi tidak memakai skala $D$, konsisten dengan
[1, Eq.1]) dan pola diskretisasi grid kuadratur multi-indeks $k$-dimensi (Eq.6, p.5), dipakai
sebagai pembanding teknik untuk grid EAP di [#3.1](#31-teori) (catatan: Eq.6 [6] pada paper aslinya
mengintegralkan $\theta$ sebagai *nuisance parameter* pada estimasi parameter item/EM, bukan pada
estimasi EAP examinee individual — hanya teknik diskretisasinya yang dipakai sebagai pembanding,
bukan rumusnya secara langsung).

### Peta Sitasi per Formula

| Formula | Dipakai di metode | Sumber |
|---|---|---|
| $f(\mathbf u\mid\theta)=\prod P_i^{u_i}Q_i^{1-u_i}$, $\hat\theta=\arg\max f$ | MLE (dasar ketiganya) | [1] Eq.2–3, p.276 |
| $\nabla\log f(\theta)=\sum a_i(u_i-P_i)P'_i/(P_iQ_i)$ | MLE, MAP (bagian likelihood) | Diturunkan sendiri di [#0.1](#01-pembuktian-skor-gradien-log-likelihood) dari [1] Eq.2-3 |
| $\mathbf I_i(\theta)=w\cdot\mathbf a_i\mathbf a_i^\top$ (Fisher scoring) | MLE, MAP (Hessian) | [1] Eq.4, p.276; dibuktikan identik di [#0.2](#02-fisher-information-matrix-sebagai-pengganti-hessian-fisher-scoring) |
| $\hat\theta_{s+1}=\hat\theta_s+[\Sigma a(u-P)]/[\Sigma a^2PQ]$ | MLE (univariat) | [2] Eq.[5-1], p.86 |
| $\log g(\theta)=\log f(\theta)+\log L(\theta)$, $\hat\theta_{BM}=\arg\max g$ | MAP | [3] Eq.5, p.5; asal-usul [4] |
| $\nabla\log g=\nabla\log f-\Sigma^{-1}(\theta-\mu)$, $H_{MAP}=I_S+\Sigma^{-1}$ | MAP | Diturunkan sendiri di [#2.1](#21-teori) dari [3] Eq.5 + kalkulus Gaussian multivariat |
| $\hat\theta_{EAP}=\int\theta f L\,d\theta/\int fL\,d\theta$ | EAP | [3] Eq.10, p.5; asal-usul [5] |
| Grid kuadratur multi-indeks $k$-dimensi | EAP | Teknik dibandingkan dengan [6] Eq.6, p.5 |
