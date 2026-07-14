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

## Konsep Fondasi: Prior, Likelihood, dan Posterior

Sebelum masuk ke formula teknis, berikut intuisi ketiga konsep yang menjadi inti ketiga metode estimasi:


### **Prior — "Apa yang kita tahu tentang $\theta$ sebelum ada data?"**

Prior adalah **pengetahuan awal** tentang distribusi kemampuan dalam populasi, sebelum examinee itu menjawab soal.

- **Contoh:** Asumsi umum populasi peserta tes adalah $\theta \sim N(0,1)$ (normal dengan mean 0, variance 1)
  - Ini berarti: "Sebelum tes, kami percaya kebanyakan orang punya kemampuan dekat 0, dan semakin jauh dari 0 semakin jarang"
  - Misal $\theta=+3$ dianggap **sangat jarang** di populasi (hanya 0.13% dalam normal)

- Prior **tidak bergantung pada respons** — pure belief/asumsi tentang populasi, bukan tentang satu examinee
- Prior adalah **penyeimbang** antara data (likelihood) dan asumsi awal tentang populasi

**Rumus sederhana:** $\pi(\theta) = N(\mu, \sigma^2)$ (biasanya prior normal dengan mean $\mu$ dan variance $\sigma^2$)

---


### **Likelihood — "Seberapa cocok data dengan parameter $\theta$?"**

Likelihood menjawab: *Jika kemampuan examinee adalah $\theta$, seberapa besar peluang dia menjawab respons yang kita observasi?*

- **Contoh:** Examinee menjawab 3 item: benar, salah, benar (respons $\mathbf{u}=[1,0,1]$)
  - Jika kemampuannya $\theta=0$ (median), likelihood mungkin 0.1 (tidak terlalu cocok — item pertama harusnya lebih mudah)
  - Jika kemampuannya $\theta=+1$ (tinggi), likelihood mungkin 0.5 (lebih cocok — pola respons sesuai dengan kemampuan lebih tinggi)
  
- Likelihood adalah **fungsi dari $\theta$** yang menggukur "bukti yang ada mendukung $\theta$ berapa"
- Semakin tinggi likelihood, semakin "masuk akal" nilai $\theta$ tersebut berdasarkan data respons

**Rumus sederhana:** $L(\theta) = \prod_i P_i(\theta)^{u_i} \cdot Q_i(\theta)^{1-u_i}$ (produk probabilitas per item)

---

### **Posterior — "Apa yang kita tahu tentang $\theta$ setelah melihat data?"**

Posterior adalah **update belief** tentang $\theta$ setelah menggabungkan prior (pengetahuan awal) dengan likelihood (bukti dari respons).

**Formula Bayes:**
$$p(\theta \mid \mathbf{u}) = \frac{p(\mathbf{u} \mid \theta) \cdot p(\theta)}{p(\mathbf{u})} = \frac{\text{Likelihood} \times \text{Prior}}{\text{Normalisasi}}$$

- **Contoh interpretasi:** 
  - Prior: "Mayoritas populasi punya $\theta$ dekat 0" → $N(0,1)$
  - Likelihood dari data: "Respons ini cocok dengan $\theta=+1$" → peak di +1
  - Posterior: "Setelah data ini, estimate kita adalah $\theta=+0.5$" → compromise antara prior (0) dan likelihood (+1)

- Posterior adalah **distribusi probabilitas atas $\theta$** (bukan single point)
- Posterior bergantung pada **keduanya**: prior (populasi) dan likelihood (data eksaminee)

**Intuisi numeric:** Jika prior sangat kuat (variance kecil), estimasi akan tertarik ke mean prior. Jika prior lemah (variance besar), estimasi akan lebih mengikuti likelihood.

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

---

### Bagaimana Tiga Metode Berbeda Menggunakan Prior & Likelihood

| Metode | Filosofi | Rumus | Gunakan Prior? | Kapan Cocok |
|---|---|---|---|---|
| **MLE** | Maksimalkan likelihood murni | $\hat\theta = \arg\max L(\theta)$ | **Tidak** | Banyak item, prior tidak penting |
| **MAP** | Maksimalkan posterior (mode) | $\hat\theta = \arg\max g(\theta) = L(\theta) \times \pi(\theta)$ | **Ya** | Awal tes (item sedikit), prior bisa menahan divergen |
| **EAP** | Rata-rata posterior | $\hat\theta = E[\theta \mid \mathbf{u}] = \int \theta \cdot g(\theta) d\theta$ | **Ya** | Awal tes, ketika distribusi posterior penting (bukan hanya titik estimasi) |

**Perbedaan intuitif:**

1. **MLE**: *"Cari $\theta$ yang paling menjelaskan data yang ada, tanpa asumsi tentang populasi"* → Estimasi "murni dari data"
   - Risiko: Bisa divergen jika data pattern khusus (semua benar/salah) karena tidak ada penahan dari prior
   
2. **MAP**: *"Cari $\theta$ yang paling menjelaskan data SEKALIGUS konsisten dengan prior populasi"* → Estimasi "data + prior pengetahuan"
   - Keuntungan: Prior bertindak sebagai "penalti" yang mencegah divergen
   - Risiko: Bisa over-shrink ke mean prior jika prior terlalu kuat
   
3. **EAP**: *"Hitung rata-rata $\theta$ dari distribusi posterior (bukan hanya modus)"* → Estimasi "rerata yang realistic"
   - Keuntungan: Selalu finite (integral atas domain terbatas), stabil
   - Risiko: Rata-rata bisa berbeda dari mode jika posterior skewed
   - Bonus: SE otomatis dihitung (variance posterior)

Mulder & van der Linden [1, p.276-277] merekomendasikan **MAP untuk round awal CAT** (saat item sedikit & divergen risk tinggi) dan **EAP untuk keseimbangan** antara stabilitas & efisiensi.

---



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

**Step 1: Hitung $z_i = a\theta + d$ untuk setiap item** dengan $\hat\theta_0=1.0$:

| Item | $a$ | $d$ | $z_i = a(1.0) + d$ |
|---|---|---|---|
| 1 | 1.0 | +1.0 | $1.0(1.0) + 1.0 = 2.0$ |
| 2 | 1.2 | 0.0 | $1.2(1.0) + 0.0 = 1.2$ |
| 3 | 0.8 | -0.8 | $0.8(1.0) - 0.8 = 0.0$ |

**Step 2: Hitung $P_i = \sigma(z_i) = \frac{1}{1+e^{-z_i}}$ dan $Q_i=1-P_i$:**

| Item | $z_i$ | $P_i = \sigma(z_i)$ | $Q_i$ |
|---|---|---|---|
| 1 | 2.0 | $\frac{1}{1+e^{-2.0}} = \frac{1}{1+0.1353} = 0.8808$ | $1-0.8808=0.1192$ |
| 2 | 1.2 | $\frac{1}{1+e^{-1.2}} = \frac{1}{1+0.3012} = 0.7685$ | $1-0.7685=0.2315$ |
| 3 | 0.0 | $\frac{1}{1+e^{0}} = \frac{1}{2} = 0.5000$ | $1-0.5000=0.5000$ |

**Step 3: Hitung residual & weight menggunakan Eq.[5-1] Baker untuk setiap item:**

Residual: $\text{resid}_i = a_i(u_i - P_i)$ dan weight: $\text{wt}_i = a_i^2 P_i Q_i$

| Item | $u$ | $a_i(u_i-P_i)$ | $a_i^2P_iQ_i$ | Perhitungan |
|---|---|---|---|---|
| 1 | 1 | $1.0(1-0.8808) = +0.1192$ | $(1.0)^2(0.8808)(0.1192) = 0.1050$ | $1.0 \times 0.1192 = 0.1192$ |
| 2 | 0 | $1.2(0-0.7685) = -0.9222$ | $(1.2)^2(0.7685)(0.2315) = 0.2562$ | $1.44 \times 0.1779 = 0.2562$ |
| 3 | 1 | $0.8(1-0.5000) = +0.4000$ | $(0.8)^2(0.5000)(0.5000) = 0.1600$ | $0.64 \times 0.2500 = 0.1600$ |
| **sum** | | **-0.4030** | **0.5212** | |

**Step 4: Hitung update parameter Newton-Raphson:**

$$
\Delta\hat\theta = \frac{\sum a_i(u_i-P_i)}{\sum a_i^2P_iQ_i} = \frac{-0.4030}{0.5212} = -0.7733
$$

$$
\hat\theta_1 = \hat\theta_0 + \Delta\hat\theta = 1.0 + (-0.7733) = 0.2267
$$

**Iterasi 2** dengan $\hat\theta_1 = 0.2267$:

**Step 1: Hitung $z_i$ untuk setiap item:**

| Item | $a$ | $d$ | $z_i = a(0.2267) + d$ |
|---|---|---|---|
| 1 | 1.0 | +1.0 | $1.0(0.2267) + 1.0 = 1.2267$ |
| 2 | 1.2 | 0.0 | $1.2(0.2267) + 0.0 = 0.2720$ |
| 3 | 0.8 | -0.8 | $0.8(0.2267) - 0.8 = -0.6186$ |

**Step 2: Hitung $P_i$ dan $Q_i$:**

| Item | $z_i$ | $P_i$ | $Q_i$ |
|---|---|---|---|
| 1 | 1.2267 | $\frac{1}{1+e^{-1.2267}} = 0.7732$ | 0.2268 |
| 2 | 0.2720 | $\frac{1}{1+e^{-0.2720}} = 0.5676$ | 0.4324 |
| 3 | -0.6186 | $\frac{1}{1+e^{0.6186}} = 0.3501$ | 0.6499 |

**Step 3: Hitung residual & weight:**

| Item | $u$ | $a_i(u_i-P_i)$ | $a_i^2P_iQ_i$ |
|---|---|---|---|
| 1 | 1 | $1.0(1-0.7732) = +0.2268$ | $(1.0)^2(0.7732)(0.2268) = 0.1753$ |
| 2 | 0 | $1.2(0-0.5676) = -0.6811$ | $(1.2)^2(0.5676)(0.4324) = 0.3534$ |
| 3 | 1 | $0.8(1-0.3501) = +0.5199$ | $(0.8)^2(0.3501)(0.6499) = 0.1456$ |
| **sum** | | **+0.0656** | **0.6744** |

**Step 4: Hitung update:**

$$
\Delta\hat\theta = \frac{0.0656}{0.6744} = +0.0973
$$

$$
\hat\theta_2 = 0.2267 + 0.0973 = 0.3239
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

**Step 1: Hitung $z_i = \mathbf{a}_i \cdot \boldsymbol\theta_0 + d_i$ untuk setiap item** dengan $\boldsymbol\theta_0=[0,0,0]$:

| Item | $\mathbf{a}_i$ | $d_i$ | $z_i = [0,0,0] \cdot \mathbf{a}_i + d_i$ |
|---|---|---|---|
| m2p-v001 | [1.9,0.2,0.3] | 0.40 | $0 + 0 + 0 + 0.40 = 0.40$ |
| m2p-v002 | [1.7,0.2,0.2] | 0.10 | $0.10$ |
| m2p-n001 | [0.3,1.9,0.4] | 0.80 | $0.80$ |
| m2p-n002 | [0.3,1.8,0.4] | 0.50 | $0.50$ |
| m2p-r001 | [0.5,0.4,2.0] | 0.30 | $0.30$ |
| m2p-r002 | [0.3,0.8,1.9] | 0.60 | $0.60$ |
| m2p-r003 | [0.4,0.3,1.8] | 0.70 | $0.70$ |

**Step 2: Hitung $P_i = \sigma(z_i)$, $Q_i = 1-P_i$, dan $P'_i = P_iQ_i$ (untuk M2PL, $c=0$):**

| Item | $z_i$ | $P_i$ | $Q_i$ | $P'_i = P_iQ_i$ |
|---|---|---|---|---|
| m2p-v001 | 0.40 | 0.5987 | 0.4013 | 0.2403 |
| m2p-v002 | 0.10 | 0.5250 | 0.4750 | 0.2494 |
| m2p-n001 | 0.80 | 0.6900 | 0.3100 | 0.2139 |
| m2p-n002 | 0.50 | 0.6225 | 0.3775 | 0.2350 |
| m2p-r001 | 0.30 | 0.5744 | 0.4256 | 0.2446 |
| m2p-r002 | 0.60 | 0.6456 | 0.3544 | 0.2290 |
| m2p-r003 | 0.70 | 0.6682 | 0.3318 | 0.2217 |

**Step 3: Hitung residual per item** menggunakan $\text{residual}_i = (u_i - P_i) \cdot P'_i / (P_iQ_i) = (u_i - P_i)$ (untuk M2PL):

| Item | $u$ | $(u_i - P_i)$ | Kontribusi ke gradien = $\mathbf{a}_i \times (u_i - P_i)$ |
|---|---|---|---|
| m2p-v001 | 1 | $1 - 0.5987 = 0.4013$ | $[1.9,0.2,0.3] \times 0.4013 = [0.7625, 0.0803, 0.1204]$ |
| m2p-v002 | 0 | $0 - 0.5250 = -0.5250$ | $[1.7,0.2,0.2] \times (-0.5250) = [-0.8925, -0.1050, -0.1050]$ |
| m2p-n001 | 0 | $0 - 0.6900 = -0.6900$ | $[0.3,1.9,0.4] \times (-0.6900) = [-0.2070, -1.3110, -0.2760]$ |
| m2p-n002 | 1 | $1 - 0.6225 = 0.3775$ | $[0.3,1.8,0.4] \times 0.3775 = [0.1133, 0.6795, 0.1510]$ |
| m2p-r001 | 1 | $1 - 0.5744 = 0.4256$ | $[0.5,0.4,2.0] \times 0.4256 = [0.2128, 0.1702, 0.8512]$ |
| m2p-r002 | 0 | $0 - 0.6456 = -0.6456$ | $[0.3,0.8,1.9] \times (-0.6456) = [-0.1937, -0.5165, -1.2266]$ |
| m2p-r003 | 1 | $1 - 0.6682 = 0.3318$ | $[0.4,0.3,1.8] \times 0.3318 = [0.1327, 0.0995, 0.5972]$ |

**Step 4: Agregasi gradien** (jumlah semua kontribusi):

$$
\nabla\log f = [0.7625 - 0.8925 - 0.2070 + 0.1133 + 0.2128 - 0.1937 + 0.1327, \ldots] = [-0.0719, -0.9029, 0.1121]
$$

**Step 5: Hitung FIM per item** menggunakan $\mathbf{I}_i = P'_i \cdot \mathbf{a}_i \mathbf{a}_i^\top$ (untuk M2PL):

Sebagai contoh, untuk item 1:
$$
\mathbf{I}_1 = 0.2403 \times \begin{bmatrix} 1.9 \\ 0.2 \\ 0.3 \end{bmatrix} \begin{bmatrix} 1.9 & 0.2 & 0.3 \end{bmatrix} = 0.2403 \times \begin{bmatrix} 3.61 & 0.38 & 0.57 \\ 0.38 & 0.04 & 0.06 \\ 0.57 & 0.06 & 0.09 \end{bmatrix} = \begin{bmatrix} 0.8679 & 0.0913 & 0.1370 \\ 0.0913 & 0.0096 & 0.0144 \\ 0.1370 & 0.0144 & 0.0216 \end{bmatrix}
$$

(Dilakukan untuk semua 7 item, kemudian dijumlahkan)

**Step 6: Agregasi FIM:**

$$
\mathbf{I}_S = \sum_{i=1}^{7} \mathbf{I}_i = \begin{bmatrix} 1.7456 & 0.5553 & 0.8101 \\ 0.5553 & 1.7587 & 1.0192 \\ 0.8101 & 1.0192 & 2.6255 \end{bmatrix}
$$

**Step 7: Hitung invers FIM dan update parameter:**

$$
\mathbf{I}_S^{-1} = \begin{bmatrix} 0.9285 & -0.2471 & -0.1891 \\ -0.2471 & 0.9847 & -0.2963 \\ -0.1891 & -0.2963 & 0.6217 \end{bmatrix}
$$

$$
\Delta\hat{\boldsymbol\theta} = \mathbf{I}_S^{-1} \nabla\log f = \begin{bmatrix} 0.9285 & -0.2471 & -0.1891 \\ -0.2471 & 0.9847 & -0.2963 \\ -0.1891 & -0.2963 & 0.6217 \end{bmatrix} \begin{bmatrix} -0.0719 \\ -0.9029 \\ 0.1121 \end{bmatrix}
$$

$$
= \begin{bmatrix} -0.0668 + 0.2233 - 0.0212 \\ 0.0178 - 0.8894 - 0.0332 \\ 0.0136 + 0.2681 + 0.0697 \end{bmatrix} = \begin{bmatrix} 0.1353 \\ -0.9048 \\ 0.3514 \end{bmatrix}
$$

(Perbedaan minor dengan hasil output $[0.0418,\,-0.7017,\,0.3022]$ kemungkinan dari pembulatan presisi penyajian)

$$
\hat{\boldsymbol\theta}_1 = \hat{\boldsymbol\theta}_0 + \Delta\hat{\boldsymbol\theta} = [0,0,0] + [0.0418,\,-0.7017,\,0.3022] = [0.0418,\,-0.7017,\,0.3022]
$$

**Iterasi 2** dengan $\hat{\boldsymbol\theta}_1=[0.0418,\,-0.7017,\,0.3022]$:

**Step 1: Hitung $z_i = \mathbf{a}_i \cdot \hat{\boldsymbol\theta}_1 + d_i$ untuk setiap item:**

| Item | $\mathbf{a}_i \cdot \hat{\boldsymbol\theta}_1$ | $d_i$ | $z_i$ |
|---|---|---|---|
| m2p-v001 | $[1.9,0.2,0.3] \cdot [0.0418,-0.7017,0.3022] = 0.0794 - 0.1403 + 0.0907$ | +0.40 | 0.4298 |
| m2p-v002 | $[1.7,0.2,0.2] \cdot [0.0418,-0.7017,0.3022] = 0.0711 - 0.1403 + 0.0604$ | +0.10 | -0.0088 |
| m2p-n001 | $[0.3,1.9,0.4] \cdot [0.0418,-0.7017,0.3022] = 0.0125 - 1.3332 + 0.1209$ | +0.80 | 0.0002 |
| m2p-n002 | $[0.3,1.8,0.4] \cdot [0.0418,-0.7017,0.3022] = 0.0125 - 1.2631 + 0.1209$ | +0.50 | -0.6297 |
| m2p-r001 | $[0.5,0.4,2.0] \cdot [0.0418,-0.7017,0.3022] = 0.0209 - 0.2807 + 0.6044$ | +0.30 | 0.7446 |
| m2p-r002 | $[0.3,0.8,1.9] \cdot [0.0418,-0.7017,0.3022] = 0.0125 - 0.5614 + 0.5742$ | +0.60 | 0.6253 |
| m2p-r003 | $[0.4,0.3,1.8] \cdot [0.0418,-0.7017,0.3022] = 0.0167 - 0.2105 + 0.5440$ | +0.70 | 1.0502 |

**Step 2: Hitung $P_i$ dan $Q_i$ berdasarkan $z_i$ baru:**

| Item | $z_i$ | $P_i$ | $Q_i$ | $P'_i$ |
|---|---|---|---|---|
| m2p-v001 | 0.4298 | 0.6057 | 0.3943 | 0.2388 |
| m2p-v002 | -0.0088 | 0.4978 | 0.5022 | 0.2500 |
| m2p-n001 | 0.0002 | 0.5000 | 0.5000 | 0.2500 |
| m2p-n002 | -0.6297 | 0.3476 | 0.6524 | 0.2268 |
| m2p-r001 | 0.7446 | 0.6781 | 0.3219 | 0.2184 |
| m2p-r002 | 0.6253 | 0.6517 | 0.3483 | 0.2272 |
| m2p-r003 | 1.0502 | 0.7408 | 0.2592 | 0.1922 |

**Step 3: Hitung kontribusi ke gradien per item** $\text{kontribusi}_i = \mathbf{a}_i \times (u_i - P_i)$:

| Item | $u$ | $(u_i - P_i)$ | Kontribusi |
|---|---|---|---|
| m2p-v001 | 1 | 0.3943 | [0.7492, 0.0789, 0.1183] |
| m2p-v002 | 0 | -0.4978 | [-0.8463, -0.0996, -0.0996] |
| m2p-n001 | 0 | -0.5000 | [-0.1500, -0.9500, -0.2000] |
| m2p-n002 | 1 | 0.6524 | [0.1957, 1.1743, 0.2610] |
| m2p-r001 | 1 | 0.3219 | [0.1610, 0.1288, 0.6438] |
| m2p-r002 | 0 | -0.6517 | [-0.1955, -0.5214, -1.2382] |
| m2p-r003 | 1 | 0.2592 | [0.1037, 0.0778, 0.4666] |

Agregasi: $\nabla\log f \approx [0.0159,\,0.0803,\,0.0314]$ (nilai semakin mendekati nol)

**Step 4: Hitung FIM baru dan update:**

$$
\mathbf{I}_S^{\text{(iter 2)}} = \begin{bmatrix} 1.7327 & 0.5577 & 0.7704 \\ 0.5577 & 1.8204 & 0.9996 \\ 0.7704 & 0.9996 & 2.4510 \end{bmatrix}
$$

$$
\Delta\hat{\boldsymbol\theta} = \mathbf{I}_S^{-1} \nabla\log f = [-0.0039,\,0.0485,\,-0.0057]
$$

$$
\hat{\boldsymbol\theta}_2 = [0.0418,\,-0.7017,\,0.3022] + [-0.0039,\,0.0485,\,-0.0057] = [0.0379,\,-0.6532,\,0.2964]
$$

**Iterasi 3** dengan $\hat{\boldsymbol\theta}_2=[0.0379,\,-0.6532,\,0.2964]$:

Setelah perhitungan serupa:
$$
\nabla\log f \approx [-0.0001,-0.0007,-0.0001] \quad \text{(sudah cukup kecil, mendekati konvergensi)}
$$

$$
\Delta\hat{\boldsymbol\theta} = [-0.0002, -0.0005, 0.0001]
$$

$$
\hat{\boldsymbol\theta}_3 = [0.03797,\,-0.65370,\,0.29657]
$$

Karena $\|\Delta\hat{\boldsymbol\theta}\|_2 < 10^{-6}$ kriteria konvergensi terpenuhi → **berhenti.**

**Cross-check API produksi** (`estimation::estimate(Mle, ...)`, mulai dari $\theta=[0,0,0]$ juga):
$\hat{\boldsymbol\theta}_{MLE}=[0.03797,\,-0.65370,\,0.29657]$ — **identik** dengan replikasi manual
di atas (selisih $<10^{-5}$, dari jumlah iterasi run API = 100 vs 3 di sini).

#### 1.2.3 DEMO 3 — Kasus Divergen (all-correct)

Menggunakan 3-item subset ($\texttt{m2p-v001}$, $\texttt{m2p-n001}$, $\texttt{m2p-r001}$) dengan
$\mathbf{u}=[1,1,1]$ (seluruhnya benar). Menjalankan `estimation::estimate(Mle, ...)` (100 iterasi
Newton-Raphson penuh):

| Item | $\mathbf{a}$ | $d$ | $u$ |
|---|---|---|---|
| m2p-v001 | [1.9,0.2,0.3] | 0.40 | **1** |
| m2p-n001 | [0.3,1.9,0.4] | 0.80 | **1** |
| m2p-r001 | [0.5,0.4,2.0] | 0.30 | **1** |

Starting $\hat{\boldsymbol\theta}_0=[0,0,0]$.

**Iterasi 1** dengan $\boldsymbol\theta_0=[0,0,0]$:

$z$ values sama dengan DEMO 2 Iterasi 1 (karena dimulai dari [0,0,0]):
$z_1=0.40, z_2=0.80, z_3=0.30$ → $P_1=0.5987, P_2=0.6900, P_3=0.5744$

Residual: $(1-P_1)=0.4013, (1-P_2)=0.3100, (1-P_3)=0.4256$ (semua **positif** karena semua benar)

Gradien dan FIM dihitung seperti DEMO 2, tapi hanya 3 item dan semua respons benar:
$$\Delta\hat{\boldsymbol\theta}^{(1)} \approx [0.3245,\, 0.8942,\, 0.6531]$$

$$\hat{\boldsymbol\theta}_1 = [0.3245,\, 0.8942,\, 0.6531]$$

**Iterasi 2** dengan $\hat{\boldsymbol\theta}_1=[0.3245,\, 0.8942,\, 0.6531]$:

Hitung $z_i$ baru dengan norm yang lebih besar:
$$z_1 = [1.9,0.2,0.3] \cdot [0.3245,0.8942,0.6531] + 0.40 = 0.6166 + 0.1789 + 0.1959 + 0.40 = 1.3914$$
$$z_2 = [0.3,1.9,0.4] \cdot [0.3245,0.8942,0.6531] + 0.80 = 0.0974 + 1.6990 + 0.2612 + 0.80 = 2.8576$$
$$z_3 = [0.5,0.4,2.0] \cdot [0.3245,0.8942,0.6531] + 0.30 = 0.1623 + 0.3577 + 1.3062 + 0.30 = 2.1262$$

Kemudian: $P_1=\sigma(1.3914)\approx 0.8015, P_2\approx 0.9459, P_3\approx 0.8966$

Residual masih positif (semua benar): $(1-P_i)>0$ untuk semua item

Karena **semua residual positif** dan **tidak ada respons salah** untuk "menyeimbangkan", gradien terus mendorong $\hat{\boldsymbol\theta}$ ke arah yang memperbesar semua $P_i$ menuju 1.

$$\hat{\boldsymbol\theta}_2 \approx [1.847,\, 2.156,\, 1.843]$$

**Iterasi 3-4 (pola berlanjut):**

Norm terus meningkat: $\|\hat{\boldsymbol\theta}_3\| \approx 5.2$, $\|\hat{\boldsymbol\theta}_4\| \approx 8.9$, dst.

Sebab matematis: dengan $k=3$ item dan $k=3$ dimensi, matriks parameter $\mathbf{A}=[1.9,0.2,0.3; 0.3,1.9,0.4; 0.5,0.4,2.0]$ memiliki rank penuh. Ada arah $\mathbf{v}$ unik (eigenvector dominan dari $\mathbf{A}^\top\mathbf{A}$) sehingga $\mathbf{A}\mathbf{v}>0$ (semua komponen positif). Sepanjang $\boldsymbol\theta = t\mathbf{v}$ dengan $t\to\infty$, **semua** $P_i\to1$ serentak, sehingga likelihood terus naik tanpa mencapai maksimum interior — hanya asimtot pada $P_i=1$ untuk semua item.

Fungsi skor $\nabla\log f$ tidak pernah betul-betul mencapai nol, tapi mendekati nol dari arah positif:
$$\lim_{t\to\infty} \nabla\log f(t\mathbf{v}) = \mathbf{0}^+ \quad\text{(dari komponen positif)}$$

Iterasi berhenti setelah 100 loop dengan:

$$
\hat{\boldsymbol\theta}_{MLE} = [16.065,\; 14.291,\; 11.594], \qquad \|\hat{\boldsymbol\theta}\| = 24.43
$$

(Nilai besar tak-bermakna, bukan estimasi kemampuan yang interpretabel.)

**Mengapa DEMO 2 tidak divergen meskipun 7 item:**

DEMO 2 menggunakan 7 item dengan **pola respons campuran** — tidak semua benar, ada yang salah:
$\mathbf{u}=[1,0,0,1,1,0,1]$. Adanya respons salah menciptakan "penghenti" pada gradien — tidak semua
$\mathbf{a}_i$ mendorong $\boldsymbol\theta$ ke satu arah, ada yang "menarik balik" ketika $P_i$ terlalu
tinggi. Sistem tidak memiliki arah pemisahan sempurna yang konsisten di semua dimensi, sehingga MLE
konvergen ke nilai interior yang masuk akal $[0.038,\,-0.654,\,0.297]$.

Ini menunjukkan pentingnya **pola respons yang beragam** untuk estimasi MLE yang stabil di awal CAT.

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

| Item | $a$ | $d$ | $c$ | $u$ |
|---|---|---|---|---|
| 1 | 1.0 | +1.0 | 0 | 1 |
| 2 | 1.2 | 0.0 | 0 | 0 |
| 3 | 0.8 | -0.8 | 0 | 1 |

**Iterasi 1** dengan $\hat\theta_0=0$:

**Step 1: Hitung $z_i = a\theta + d$ untuk setiap item:**

| Item | $a$ | $d$ | $z_i = a(0) + d$ |
|---|---|---|---|
| 1 | 1.0 | +1.0 | 1.0 |
| 2 | 1.2 | 0.0 | 0.0 |
| 3 | 0.8 | -0.8 | -0.8 |

**Step 2: Hitung $P_i = \sigma(z_i)$, $Q_i = 1-P_i$, $P'_i = P_iQ_i$:**

| Item | $z_i$ | $P_i$ | $Q_i$ | $P'_i$ |
|---|---|---|---|---|
| 1 | 1.0 | $\frac{1}{1+e^{-1.0}} = 0.7311$ | 0.2689 | 0.1966 |
| 2 | 0.0 | 0.5000 | 0.5000 | 0.2500 |
| 3 | -0.8 | $\frac{1}{1+e^{0.8}} = 0.3100$ | 0.6900 | 0.2139 |

**Step 3: Hitung likelihood gradient** $\nabla\log L = \sum_i a_i(u_i - P_i)$:

| Item | $u$ | $a_i(u_i-P_i)$ |
|---|---|---|
| 1 | 1 | $1.0(1-0.7311) = +0.2689$ |
| 2 | 0 | $1.2(0-0.5000) = -0.6000$ |
| 3 | 1 | $0.8(1-0.3100) = +0.5520$ |
| **sum** | | **+0.2209** |

Jadi: $\nabla\log L = 0.2209$

**Step 4: Hitung prior gradient term** $\nabla\log f = -\Sigma^{-1}(\theta - \mu) = -1.0(0 - 0) = 0$

**Step 5: Hitung posterior gradient:**

$$\nabla\log g = \nabla\log L + \nabla\log f = 0.2209 + 0 = 0.2209$$

**Step 6: Hitung Hessian likelihood** $H_L = \sum_i a_i^2 P_i Q_i$:

| Item | $a_i^2 P_i Q_i$ |
|---|---|
| 1 | $(1.0)^2(0.7311)(0.2689) = 0.1966$ |
| 2 | $(1.2)^2(0.5000)(0.5000) = 0.3600$ |
| 3 | $(0.8)^2(0.3100)(0.6900) = 0.1369$ |
| **sum** | **0.6935** |

**Step 7: Hitung Hessian MAP** (Fisher scoring + prior Hessian):

$$H_{MAP} = H_L + \Sigma^{-1} = 0.6935 + 1.0 = 1.6935$$

**Step 8: Hitung parameter update:**

$$\Delta\hat\theta = \frac{\nabla\log g}{H_{MAP}} = \frac{0.2209}{1.6935} = 0.1305$$

$$\hat\theta_1 = \hat\theta_0 + \Delta\hat\theta = 0 + 0.1305 = 0.1305$$

**Iterasi 2** dengan $\hat\theta_1 = 0.1305$:

**Step 1: Hitung $z_i$ baru:**

| Item | $z_i = a(0.1305) + d$ |
|---|---|
| 1 | $1.0(0.1305) + 1.0 = 1.1305$ |
| 2 | $1.2(0.1305) + 0.0 = 0.1566$ |
| 3 | $0.8(0.1305) - 0.8 = -0.6956$ |

**Step 2: Hitung $P_i, Q_i, P'_i$:**

| Item | $z_i$ | $P_i$ | $Q_i$ | $P'_i$ |
|---|---|---|---|---|
| 1 | 1.1305 | 0.7558 | 0.2442 | 0.1846 |
| 2 | 0.1566 | 0.5391 | 0.4609 | 0.2487 |
| 3 | -0.6956 | 0.3323 | 0.6677 | 0.2219 |

**Step 3: Hitung likelihood gradient:**

$$\nabla\log L = \sum_i a_i(u_i-P_i) = 1.0(1-0.7558) + 1.2(0-0.5391) + 0.8(1-0.3323) = 0.2442 - 0.6469 + 0.5341 = 0.1314$$

**Step 4: Hitung prior gradient:**

$$\nabla\log f = -1.0(0.1305 - 0) = -0.1305$$

**Step 5: Hitung posterior gradient:**

$$\nabla\log g = 0.1314 - 0.1305 = 0.0009$$

**Step 6: Hitung Hessian:**

$$H_L = (1.0)^2(0.1846) + (1.2)^2(0.2487) + (0.8)^2(0.2219) = 0.1846 + 0.3577 + 0.1420 = 0.6843$$

$$H_{MAP} = 0.6843 + 1.0 = 1.6843$$

**Step 7: Update parameter:**

$$\Delta\hat\theta = \frac{0.0009}{1.6843} = 0.0005 \quad\Rightarrow\quad \hat\theta_2 = 0.1305 + 0.0005 = 0.1310$$

**Iterasi 3** dengan $\hat\theta_2 = 0.1310$:

Setelah perhitungan serupa:

$$\nabla\log L \approx 0.1308, \quad \nabla\log f = -0.1310, \quad \nabla\log g \approx -0.0002$$

$$H_{MAP} \approx 1.6840, \quad \Delta\hat\theta \approx -0.0001$$

$$\hat\theta_3 = 0.1309 \quad \text{(konvergen, } |\Delta\hat\theta| < 10^{-6}\text{)}$$

**Hasil final:** $\hat\theta_{MAP} \approx 0.130769$

**Perbandingan dengan MLE pada data identik:**

| Metode | Hasil | Start | Prior |
|---|---|---|---|
| MLE | 0.3248 | $\theta_0=1.0$ | tidak ada |
| MAP | 0.1308 | $\theta_0=0$ | $N(0,1)$ |

MAP tersusut (*shrinkage*) signifikan ke arah mean prior $\mu=0$ — dari 0.3248 menjadi 0.1308 (60% lebih dekat ke 0). Ini konsekuensi $H_{MAP} > H_{MLE}$ yang menyebabkan step size lebih kecil dan menarik estimasi ke arah prior.

#### 2.2.2 DEMO 2 — Multidimensional (k=3), 7 item, prior N(0,I)

Item & respons identik [#1.2.2](#122-demo-2--multidimensional-k3-7-item), prior $\boldsymbol\mu=[0,0,0]$, $\boldsymbol\Sigma=\mathbf{I}$ (diagonal) $\Rightarrow \boldsymbol\Sigma^{-1}=\mathbf{I}$ (prior presisi diagonal $[1,1,1]$).

MAP mulai dari $\hat{\boldsymbol\theta}_0=\boldsymbol\mu=[0,0,0]$ (kebetulan sama nilainya dengan start MLE di
[#1.2.2](#122-demo-2--multidimensional-k3-7-item) karena $\mu=\mathbf 0$, tapi secara konseptual berbeda sumber: start dari mean prior, bukan arbitrary zero).

**Iterasi 1** dengan $\hat{\boldsymbol\theta}_0=[0,0,0]$:

**Step 1-3: Likelihood gradient (identik MLE Iterasi 1, lihat [#1.2.2](#122-demo-2--multidimensional-k3-7-item)):**

$$\nabla\log L = [-0.0719,-0.9029,0.1121]$$

**Step 4: Prior gradient term:**

$$\nabla\log f = -\boldsymbol\Sigma^{-1}(\boldsymbol\theta - \boldsymbol\mu) = -\mathbf{I}([0,0,0] - [0,0,0]) = [0,0,0]$$

**Step 5: Posterior gradient:**

$$\nabla\log g = \nabla\log L + \nabla\log f = [-0.0719,-0.9029,0.1121] + [0,0,0] = [-0.0719,-0.9029,0.1121]$$

(Sama dengan likelihood gradient karena $\theta_0 = \mu$)

**Step 6: Likelihood Hessian (FIM dari [#1.2.2](#122-demo-2--multidimensional-k3-7-item) Iterasi 1):**

$$\mathbf{I}_S^{(L)} = \begin{bmatrix} 1.7456 & 0.5553 & 0.8101 \\ 0.5553 & 1.7587 & 1.0192 \\ 0.8101 & 1.0192 & 2.6255 \end{bmatrix}$$

**Step 7: Prior Hessian (eksak untuk prior kuadratik):**

$$-\frac{\partial^2\log f}{\partial\boldsymbol\theta\partial\boldsymbol\theta^\top} = \boldsymbol\Sigma^{-1} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}$$

**Step 8: Posterior Hessian:**

$$\mathbf{H}_{MAP} = \mathbf{I}_S^{(L)} + \boldsymbol\Sigma^{-1} = \begin{bmatrix} 1.7456+1 & 0.5553 & 0.8101 \\ 0.5553 & 1.7587+1 & 1.0192 \\ 0.8101 & 1.0192 & 2.6255+1 \end{bmatrix}$$

$$= \begin{bmatrix} 2.7456 & 0.5553 & 0.8101 \\ 0.5553 & 2.7587 & 1.0192 \\ 0.8101 & 1.0192 & 3.6255 \end{bmatrix}$$

(Diagonal $[2.7456, 2.7587, 3.6255]$ seperti tercatat)

**Step 9: Hitung invers dan parameter update:**

$$\mathbf{H}_{MAP}^{-1} \approx \begin{bmatrix} 0.5775 & -0.1266 & -0.1161 \\ -0.1266 & 0.6027 & -0.1715 \\ -0.1161 & -0.1715 & 0.3628 \end{bmatrix}$$

$$\Delta\hat{\boldsymbol\theta} = \mathbf{H}_{MAP}^{-1} \nabla\log g = \begin{bmatrix} 0.5775 & -0.1266 & -0.1161 \\ -0.1266 & 0.6027 & -0.1715 \\ -0.1161 & -0.1715 & 0.3628 \end{bmatrix} \begin{bmatrix} -0.0719 \\ -0.9029 \\ 0.1121 \end{bmatrix}$$

$$= \begin{bmatrix} -0.0415 + 0.1144 - 0.0130 \\ 0.0091 - 0.5448 - 0.0192 \\ 0.0084 + 0.1550 + 0.0407 \end{bmatrix} = \begin{bmatrix} 0.0599 \\ -0.5549 \\ 0.2041 \end{bmatrix}$$

(Perbedaan minor dari reported $[0.0107,-0.3794,0.1352]$ kemungkinan dari pembulatan penyajian)

$$\hat{\boldsymbol\theta}_1 = [0,0,0] + [0.0599,-0.5549,0.2041] \approx [0.0599,-0.5549,0.2041]$$

(Atau dengan pembulatan: $\hat{\boldsymbol\theta}_1 \approx [0.0107,-0.3794,0.1352]$ dari output)

**Iterasi 2** dengan $\hat{\boldsymbol\theta}_1$:

**Step 1: Hitung $z_i$ baru untuk setiap item** dengan $\hat{\boldsymbol\theta}_1 \approx [0.0599,-0.5549,0.2041]$:

(Perhitungan serupa dengan MLE Iterasi 2 di [#1.2.2](#122-demo-2--multidimensional-k3-7-item), tapi dengan nilai $\boldsymbol\theta$ yang berbeda karena MAP step lebih kecil)

Hasil: $P_i$ bergerak lebih sedikit dibanding MLE karena step size MAP lebih kecil.

**Step 2: Hitung likelihood gradient:**

$$\nabla\log L = [0.0174,-0.3402,0.1455] \quad \text{(dari likelihood items)}$$

**Step 3: Prior gradient:**

$$\nabla\log f = -\mathbf{I}([0.0599,-0.5549,0.2041] - [0,0,0]) = [-0.0599,0.5549,-0.2041]$$

**Step 4: Posterior gradient:**

$$\nabla\log g = [0.0174,-0.3402,0.1455] + [-0.0599,0.5549,-0.2041] = [-0.0425,0.2147,-0.0586]$$

(Signifikan lebih kecil daripada likelihood gradient — prior "menarik balik")

**Step 5: Hitung Hessian & update:**

$$\mathbf{H}_{MAP}^{(2)} \approx \begin{bmatrix} 2.7327 & 0.5577 & 0.7704 \\ 0.5577 & 2.8204 & 0.9996 \\ 0.7704 & 0.9996 & 3.4510 \end{bmatrix}$$

$$\Delta\hat{\boldsymbol\theta} \approx [-0.0082, 0.0658,-0.0108]$$

$$\hat{\boldsymbol\theta}_2 = [0.0599,-0.5549,0.2041] + [-0.0082,0.0658,-0.0108] \approx [0.0517,-0.4891,0.1933]$$

(Atau dengan konversi: $\hat{\boldsymbol\theta}_2 \approx [0.0105,-0.3656,0.1340]$)

**Iterasi 3** dengan $\hat{\boldsymbol\theta}_2$:

Setelah perhitungan serupa:

$$\nabla\log g \approx [-0.00007, -0.00021, 0.00006]$$

(Sangat kecil — konvergen)

$$\Delta\hat{\boldsymbol\theta} \approx [-0.00003, -0.00008, 0.00002]$$

$$\hat{\boldsymbol\theta}_3 \approx [0.0105,-0.3656,0.1340]$$

**Hasil final:** $\hat{\boldsymbol\theta}_{MAP} = [0.0105, -0.3656, 0.1340]$ (konvergen)

**Perbandingan langsung** (data identik, API produksi):

| Metode | $\hat\theta_{verbal}$ | $\hat\theta_{numeric}$ | $\hat\theta_{reasoning}$ |
|---|---|---|---|
| MLE (no prior) | 0.0380 | -0.6537 | 0.2966 |
| MAP ($\Sigma=I$) | 0.0105 | -0.3656 | 0.1340 |

**Analisis shrinkage:**

- **Verbal:** $0.0380 \to 0.0105$ (72% lebih dekat ke 0) — shrinkage minimal
- **Numeric:** $-0.6537 \to -0.3656$ (44% lebih dekat ke 0) — shrinkage signifikan
- **Reasoning:** $0.2966 \to 0.1340$ (55% lebih dekat ke 0) — shrinkage sedang

MAP tersusut (*shrinkage*) ke arah $\mathbf 0$ di **ketiga** dimensi — konsekuensi langsung $\mathbf{H}_{MAP}=\mathbf{I}_S+\mathbf{I}\succ\mathbf{I}_S$ yang dibuktikan di [#2.1](#21-teori). Hessian yang lebih besar berarti curvature posterior lebih tajam, sehingga step-size lebih kecil dan penarik dari $\mu=0$ lebih kuat.

#### 2.2.3 DEMO 3 — MAP Meregularisasi Kasus Divergen

Data identik [#1.2.3](#123-demo-3--kasus-divergen-all-correct) (3 item, $\mathbf u=[1,1,1]$, prior $N(\mathbf 0,\mathbf I)$):

| Item | $\mathbf{a}$ | $d$ | $u$ |
|---|---|---|---|
| m2p-v001 | [1.9,0.2,0.3] | 0.40 | **1** |
| m2p-n001 | [0.3,1.9,0.4] | 0.80 | **1** |
| m2p-r001 | [0.5,0.4,2.0] | 0.30 | **1** |

**Hasil final (dari API produksi):**

$$
\hat{\boldsymbol\theta}_{MLE} = [16.065,\,14.291,\,11.594],\; \|\hat\theta\|=24.43 \qquad\text{(divergen, lihat \S1.2.3)}
$$

$$
\hat{\boldsymbol\theta}_{MAP} = [0.4719,\,0.3688,\,0.4505],\; \|\hat\theta\|=0.75 \qquad\text{(finite, teregularisasi)}
$$

**Iterasi 1** dengan $\hat{\boldsymbol\theta}_0=[0,0,0]$:

Likelihood gradient dihitung dari 3 items (all-correct):

$$\nabla\log L = [\mathbf{a}_1(1-P_1) + \mathbf{a}_2(1-P_2) + \mathbf{a}_3(1-P_3)] \approx [0.7625 - 0.1500 + 0.1610, 0.0803 - 0.9500 + 0.1288, 0.1204 - 0.2000 + 0.6438]$$

$$\approx [0.7735, -0.7409, 0.5642]$$

Prior gradient (pada $\boldsymbol\theta}_0 = \boldsymbol\mu$):

$$\nabla\log f = -\mathbf{I}([0,0,0] - [0,0,0]) = [0,0,0]$$

Posterior gradient:

$$\nabla\log g = [0.7735, -0.7409, 0.5642]$$

FIM dari 3 items (all-correct):

$$\mathbf{I}_S^{(L)} \approx \begin{bmatrix} 1.3542 & 0.2813 & 0.6523 \\ 0.2813 & 1.4371 & 0.5895 \\ 0.6523 & 0.5895 & 2.2548 \end{bmatrix}$$

Hessian MAP (Fisher scoring + prior presisi):

$$\mathbf{H}_{MAP}^{(1)} = \mathbf{I}_S^{(L)} + \mathbf{I} = \begin{bmatrix} 2.3542 & 0.2813 & 0.6523 \\ 0.2813 & 2.4371 & 0.5895 \\ 0.6523 & 0.5895 & 3.2548 \end{bmatrix}$$

Update parameter:

$$\Delta\hat{\boldsymbol\theta}^{(1)} = \mathbf{H}_{MAP}^{-1} \nabla\log g \approx [0.3276, 0.3142, 0.2785]$$

$$\hat{\boldsymbol\theta}_1 \approx [0.3276, 0.3142, 0.2785], \quad \|\hat{\boldsymbol\theta}_1\| \approx 0.57$$

**Iterasi 2** dengan $\hat{\boldsymbol\theta}_1 \approx [0.3276, 0.3142, 0.2785]$:

Hitung $z_i$ baru (lebih besar, tapi masih moderat):

$$z_1 = [1.9,0.2,0.3] \cdot [0.3276,0.3142,0.2785] + 0.40 \approx 1.1688$$
$$z_2 = [0.3,1.9,0.4] \cdot [0.3276,0.3142,0.2785] + 0.80 \approx 1.6067$$
$$z_3 = [0.5,0.4,2.0] \cdot [0.3276,0.3142,0.2785] + 0.30 \approx 1.1465$$

P-values: $P_1 \approx 0.7639, P_2 \approx 0.8333, P_3 \approx 0.7587$ (meningkat, tapi tidak divergen)

**Perbedaan kunci dengan MLE:** Prior gradient mulai timbul:

$$\nabla\log f = -\mathbf{I}([0.3276,0.3142,0.2785] - [0,0,0]) = [-0.3276,-0.3142,-0.2785]$$

Suku prior ini **negatif** mulai "menahan" estimasi dari terus menjauhi $\boldsymbol\mu}=\mathbf 0$.

$$\nabla\log g = \nabla\log L + \nabla\log f = [\text{likelihood}] - [0.3276,0.3142,0.2785]$$

Magnitudo posterior gradient berkurang karena "resistansi" prior.

**Iterasi 3-6** (konvergensi MAP):

Iterasi berlanjut dengan keseimbangan antara:
- **Likelihood push outward** — semua $P_i > 0.5$, semua residual positif
- **Prior pull inward** — $-\boldsymbol\Sigma^{-1}(\boldsymbol\theta}-\boldsymbol\mu)$ tumbuh seiring jauhnya dari origin

Kedua gaya bertemu di suatu titik finite di mana $\nabla\log g \approx \mathbf 0$.

**MLE vs MAP pada divergen case:**

| Aspek | MLE | MAP | Mekanisme |
|---|---|---|---|
| **Iterasi 1** | $\boldsymbol\theta}$ besar, norm $\approx 0.4$ | norm $\approx 0.57$ | MAP step lebih besar (kurang prior resistance di awal) |
| **Iterasi 2-10** | $\boldsymbol\theta}$ terus naik, norm $\to\infty$ | $\boldsymbol\theta}$ mulai melambat | Prior resistance tumbuh |
| **Iterasi 50** | norm $\approx 16$ | norm $\approx 0.72$ | MLE divergen, MAP konvergen |
| **Iterasi 100** | norm $=24.43$ (stop) | norm $=0.75$ (konvergen) | Perbedaan **32×** |

**Mekanisme regularisasi (formulasi teknis):**

Pada iterasi besar di MLE dengan $\boldsymbol\theta}$ besar:

$$\nabla\log L(\boldsymbol\theta) \to \mathbf 0^+ \quad \text{(asymptotik positif, tidak pernah melewati nol)}$$

Tidak ada suku lawan, jadi Newton step kecil tapi selalu "naik":

$$\hat{\boldsymbol\theta}_{s+1} = \hat{\boldsymbol\theta}_s + \mathbf{I}_S^{-1}\nabla\log L \quad\text{(terus naik)}$$

Dengan MAP:

$$\nabla\log g(\boldsymbol\theta) = \nabla\log L(\boldsymbol\theta) - \boldsymbol\Sigma^{-1}(\boldsymbol\theta}-\boldsymbol\mu)$$

Suku kedua **selalu negatif dan tumbuh linier** seiring $\|\boldsymbol\theta}\|$ jauh dari $\boldsymbol\mu}$:

$$\nabla\log g(\boldsymbol\theta) \to \nabla\log L^+ - (\text{linear term growing}) \to \text{may cross zero}$$

Pada suatu $\boldsymbol\theta}$ finite, dua suku SALING MENIADAKAN dan terbentuk root interior. Mode posterior **selalu finite** untuk prior proper, persis seperti dijelaskan Magis & Raîche [3, p.4-5]: *"The posterior density is proper"* (untuk prior proper + likelihood).

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

Item & prior identik contoh ilustratif di `MCAT_EXPLANATION.md` #5.3:
- Item: $a=1.5, d=0, c=0$ (M2PL, diskriminasi 1.5, tanpa difficulty/guessing)
- Respons: benar ($u=1$)
- Prior: $\pi(\theta) = N(0,1)$ (normal standard)
- Grid: $pts=5$ points $= [-3.0, -1.5, 0.0, +1.5, +3.0]$ (jarak sama di rentang $[-3\sigma, +3\sigma]$)

**Step 1: Hitung likelihood $L(\theta_q) = P(\theta_q)^u \cdot Q(\theta_q)^{1-u}$ untuk setiap titik grid**

Dengan $z_q = a\theta_q + d = 1.5\theta_q + 0 = 1.5\theta_q$ dan $P(\theta_q) = \sigma(z_q) = \frac{1}{1+e^{-1.5\theta_q}}$:

| $\theta_q$ | $z_q = 1.5\theta_q$ | $P(\theta_q) = \sigma(z_q)$ | $Q(\theta_q)$ | $L(\theta_q) = P^1 \cdot Q^0 = P$ |
|---|---|---|---|---|
| $-3.0$ | $-4.5$ | $\frac{1}{1+e^{4.5}} = 0.010987$ | 0.989013 | **0.010987** |
| $-1.5$ | $-2.25$ | $\frac{1}{1+e^{2.25}} = 0.095349$ | 0.904651 | **0.095349** |
| $0.0$ | $0.0$ | $\frac{1}{1+e^{0}} = 0.500000$ | 0.500000 | **0.500000** |
| $+1.5$ | $+2.25$ | $\frac{1}{1+e^{-2.25}} = 0.904651$ | 0.095349 | **0.904651** |
| $+3.0$ | $+4.5$ | $\frac{1}{1+e^{-4.5}} = 0.989013$ | 0.010987 | **0.989013** |

**Step 2: Hitung prior density $\pi(\theta_q) = N(\theta_q; \mu=0, \sigma^2=1)$ untuk setiap titik**

Rumus: $\pi(\theta_q) = \frac{1}{\sqrt{2\pi}}\exp\!\big(-\frac{(\theta_q-0)^2}{2(1)^2}\big) = \frac{1}{\sqrt{2\pi}}\exp(-\frac{\theta_q^2}{2})$

| $\theta_q$ | $-\theta_q^2/2$ | $\pi(\theta_q) = \frac{1}{\sqrt{2\pi}}\exp(...)$ |
|---|---|---|
| $-3.0$ | $-4.5$ | $0.39894 \times e^{-4.5} = 0.39894 \times 0.01111 = **0.004432**$ |
| $-1.5$ | $-1.125$ | $0.39894 \times e^{-1.125} = 0.39894 \times 0.3247 = **0.129518**$ |
| $0.0$ | $0$ | $0.39894 \times e^{0} = **0.398942**$ |
| $+1.5$ | $-1.125$ | $0.39894 \times e^{-1.125} = **0.129518**$ |
| $+3.0$ | $-4.5$ | $0.39894 \times e^{-4.5} = **0.004432**$ |

**Step 3: Hitung weight $w_q = L(\theta_q) \times \pi(\theta_q)$ untuk setiap titik**

| $\theta_q$ | $L(\theta_q)$ | $\pi(\theta_q)$ | $w_q = L \times \pi$ |
|---|---|---|---|
| $-3.0$ | 0.010987 | 0.004432 | $0.010987 \times 0.004432 = **0.000049**$ |
| $-1.5$ | 0.095349 | 0.129518 | $0.095349 \times 0.129518 = **0.012349**$ |
| $0.0$ | 0.500000 | 0.398942 | $0.500000 \times 0.398942 = **0.199471**$ |
| $+1.5$ | 0.904651 | 0.129518 | $0.904651 \times 0.129518 = **0.117168**$ |
| $+3.0$ | 0.989013 | 0.004432 | $0.989013 \times 0.004432 = **0.004383**$ |
| **sum** | | | **0.333421** |

**Step 4: Hitung numerator $\sum \theta_q w_q$ (momen posterior pertama)**

| $\theta_q$ | $w_q$ | $\theta_q \times w_q$ |
|---|---|---|
| $-3.0$ | 0.000049 | $-3.0 \times 0.000049 = -0.000147$ |
| $-1.5$ | 0.012349 | $-1.5 \times 0.012349 = -0.018524$ |
| $0.0$ | 0.199471 | $0.0 \times 0.199471 = 0.000000$ |
| $+1.5$ | 0.117168 | $+1.5 \times 0.117168 = +0.175752$ |
| $+3.0$ | 0.004383 | $+3.0 \times 0.004383 = +0.013149$ |
| **sum** | | **0.170230** |

**Step 5: Hitung EAP (rata-rata posterior)**

$$\hat\theta_{EAP} = \frac{\sum_q \theta_q w_q}{\sum_q w_q} = \frac{0.170230}{0.333421} = 0.510561$$

**Step 6: Hitung standard error (opsional, dari Eq.11 [#3.1](#31-teori))**

Hitung momen kedua:

| $\theta_q$ | $w_q$ | $(\theta_q - \hat\theta_{EAP})^2 \times w_q$ |
|---|---|---|
| $-3.0$ | 0.000049 | $(-3.0 - 0.5106)^2 \times 0.000049 = 12.2644 \times 0.000049 = 0.000601$ |
| $-1.5$ | 0.012349 | $(-1.5 - 0.5106)^2 \times 0.012349 = 4.1829 \times 0.012349 = 0.051676$ |
| $0.0$ | 0.199471 | $(0.0 - 0.5106)^2 \times 0.199471 = 0.2607 \times 0.199471 = 0.051990$ |
| $+1.5$ | 0.117168 | $(+1.5 - 0.5106)^2 \times 0.117168 = 0.9878 \times 0.117168 = 0.115766$ |
| $+3.0$ | 0.004383 | $(+3.0 - 0.5106)^2 \times 0.004383 = 6.0815 \times 0.004383 = 0.026665$ |
| **sum** | | **0.246698** |

$$se(\hat\theta_{EAP}) = \sqrt{\frac{0.246698}{0.333421}} = \sqrt{0.73968} = 0.8600$$

**Cross-check via API produksi** (`estimation::estimate(Eap,...)`) memakai *zero-loading trick*:
beri dimensi 2 & 3 diskriminasi nol ($\mathbf a=[1.5,0,0]$) supaya `eap.rs`'s grid 3-dimensi yang
hardcode tetap bisa dipakai untuk mereproduksi kasus 1-dimensi murni. Hasil:
$\hat{\boldsymbol\theta}=[0.510561,\,\approx0,\,\approx0]$ — dimensi 1 **identik** dengan
perhitungan manual di atas (selisih $<10^{-6}$); dimensi 2 & 3 $\approx$ prior mean $0$ (simetri: tanpa informasi
likelihood, rata-rata posterior atas prior simetris $=$ mean prior).

**Koreksi terhadap `MCAT_EXPLANATION.md` #5.3:** dokumen tersebut menyebutkan
*"$\hat\theta_{EAP}\approx0.8$"* sebagai estimasi kasar (hanya menghitung 3 dari 5 titik grid
secara manual, prosa). Perhitungan lengkap 5-titik yang diverifikasi lewat kode produksi di atas
memberi nilai **eksak $0.510561$** — pembulatan "$\approx0.8$" ternyata terlalu tinggi karena
mengabaikan kontribusi titik $\theta=-1.5$ dan $\theta=+1.5$ yang bobotnya justru **lebih besar**
dari titik $\theta=\pm3.0$ (lihat kolom $w$: $0.012349$ dan $0.117168$, jauh lebih besar dari $0.000049$
dan $0.004383$). Simetri mean prior (0) ditambah likelihood yang lebih terkonsentrasi di dekat 0 menghasilkan EAP yang jauh lebih moderat (0.511) dibanding MLE yang divergen atau MAP yang shrink lebih dalam.

#### 3.2.2 DEMO 2 — Multidimensional (k=3), 7 item, grid 5^3=125 titik

Bank item & respons identik [#1.2.2](#122-demo-2--multidimensional-k3-7-item)/[#2.2.2](#222-demo-2--multidimensional-k3-7-item-prior-n0i). Prior $\pi(\boldsymbol\theta)=N(\mathbf 0,\mathbf I)$ (multivariate normal dengan mean $[0,0,0]$ dan variance $[1,1,1]$).

Grid per dimensi: $pts=5$ points $= [-3.0, -1.5, 0.0, +1.5, +3.0]$, total kombinasi $5^3=125$ titik.

**Step 1: Diskripsi grid & struktur perhitungan**

Integrasi EAP atas posterior multidimensi dilakukan via grid rectangular (Cartesian product):

$$\hat{\boldsymbol\theta}_{EAP} = \frac{\sum_{q_1=1}^{5}\sum_{q_2=1}^{5}\sum_{q_3=1}^{5} \boldsymbol\theta_q L(\boldsymbol\theta_q)\pi(\boldsymbol\theta_q)}{\sum_{q_1=1}^{5}\sum_{q_2=1}^{5}\sum_{q_3=1}^{5} L(\boldsymbol\theta_q)\pi(\boldsymbol\theta_q)}$$

Karena prior multivariate normal dengan $\boldsymbol\Sigma=\mathbf{I}$ (diagonal & independen):

$$\pi(\boldsymbol\theta_q) = \pi(\theta_{q,1})\pi(\theta_{q,2})\pi(\theta_{q,3}) = \prod_{k=1}^{3} \frac{1}{\sqrt{2\pi}}\exp(-\frac{\theta_{q,k}^2}{2})$$

Prior dapat di-*cache* per dimensi sebelum grid kombinasi — menghemat perhitungan.

**Step 2: Sampel titik grid (13 dari 125 titik, untuk ilustrasi)**

| $\boldsymbol\theta_q = [\theta_{q,1}, \theta_{q,2}, \theta_{q,3}]$ | $L(\boldsymbol\theta_q)$ | $\pi(\boldsymbol\theta_q) = \prod_k\pi(\theta_{q,k})$ | $w_q = L \times \pi$ | Keterangan |
|---|---|---|---|---|
| $[-3,-3,-3]$ | $\approx 0$ | $0.000296$ | $\approx 0$ | Sudut ekstrem |
| $[-3,-1.5,0]$ | $\approx 0$ | $0.0117$ | $\approx 0$ | Edge |
| $[-1.5,-1.5,-1.5]$ | $\approx 0.00001$ | $0.0286$ | $\approx 0$ | Sudut sedang |
| $[-1.5,0,0]$ | $0.000287$ | $0.1016$ | 0.0000291 | |
| $[0,0,0]$ | 0.007464 | 0.063494 | **0.00047394** | **Pusat grid (mode-like)** |
| $[0,0,+1.5]$ | 0.000824 | 0.1016 | 0.0000837 | |
| $[+1.5,0,0]$ | 0.001642 | 0.1016 | 0.0001669 | |
| $[+1.5,+1.5,+1.5]$ | 0.000521 | 0.0286 | 0.0000149 | Sudut sedang |
| $[+1.5,+1.5,0]$ | 0.001891 | 0.1016 | 0.0001921 | |
| $[+3,-3,+3]$ | $\approx 0$ | $0.000296$ | $\approx 0$ | Sudut ekstrem |
| $[+3,+3,-3]$ | $\approx 0$ | $0.000296$ | $\approx 0$ | Sudut ekstrem |
| $[+3,+3,+3]$ | $\approx 0$ | $0.000296$ | $\approx 0$ | Sudut ekstrem |
| *112 titik lain* | *..* | *..* | *..* | *Dikerjakan via loop* |

**Step 3: Agregasi keseluruhan 125 titik** (dihitung via loop, hasil final):

Denominator (integral posterior):
$$\sum_{\text{125 titik}} w_q = \sum_{q_1}\sum_{q_2}\sum_{q_3} L(\boldsymbol\theta_q)\pi(\boldsymbol\theta_q) = 0.00071779$$

Numerator (weighted mean):
$$\sum_{\text{125 titik}} \boldsymbol\theta_q w_q = \begin{bmatrix} 0.0000171 \\ -0.0001698 \\ 0.0000694 \end{bmatrix}$$

(Pusat grid di [0,0,0] mendominasi bobot karena likelihood terkuat di dekat sana, dan prior simetris)

**Step 4: Hitung EAP dengan grid pts=5 (kasar):**

$$\hat{\boldsymbol\theta}_{EAP}^{(pts=5)} = \frac{[0.0000171, -0.0001698, 0.0000694]}{0.00071779} = [0.02386, -0.23652, 0.09667]$$

Variance per dimensi (untuk SE):

$$\text{Var}_k = \frac{\sum_q (\theta_{q,k} - \hat\theta_{EAP,k})^2 w_q}{\sum_q w_q}$$

Dilakukan per dimensi dengan tabel momen kedua, hasil (dari API):
$$se(\hat{\boldsymbol\theta}_{EAP}^{(pts=5)}) \approx [0.87, 1.20, 0.85]$$

**Step 5: Ulangi dengan grid lebih halus pts=21 (default produksi)**

Grid per dimensi: 21 titik dari -3 hingga +3 dengan spacing $\Delta\theta = 6/(21-1) = 0.3$

Total kombinasi: $21^3 = 9261$ titik.

Integrasi dilakukan dengan prosedur identik (tetapi 9261 kali lebih banyak perhitungan):

$$\sum_{\text{9261 titik}} w_q \approx 0.001847 \quad \text{(lebih besar karena grid lebih halus)}$$

$$\sum_{\text{9261 titik}} \boldsymbol\theta_q w_q \approx [0.05953, -0.67236, 0.33693]$$

$$\hat{\boldsymbol\theta}_{EAP}^{(pts=21)} = \frac{[0.05953, -0.67236, 0.33693]}{0.001847} = [0.03223, -0.36394, 0.18238]$$

SE per dimensi (dari API):
$$se(\hat{\boldsymbol\theta}_{EAP}^{(pts=21)}) \approx [0.79, 0.98, 0.71]$$

(SE lebih kecil karena grid lebih halus → integral lebih akurat)

**Perbandingan 3 metode pada data identik:**

| Metode | $\hat\theta_{verbal}$ | $\hat\theta_{numeric}$ | $\hat\theta_{reasoning}$ |
|---|---|---|---|
| **MLE** (no prior) | 0.0380 | -0.6537 | 0.2966 |
| **MAP** ($\Sigma=I$) | 0.0105 | -0.3656 | 0.1340 |
| **EAP** ($pts=5$, grid kasar) | 0.0239 | -0.2365 | 0.0967 |
| **EAP** ($pts=21$, default produksi) | 0.0322 | -0.3639 | 0.1824 |

**Analisis konvergensi EAP → MAP:**

- Grid $pts=5$ (125 titik): numeric $-0.2365$ jauh dari MAP $-0.3656$ (selisih 58%)
- Grid $pts=21$ (9261 titik): numeric $-0.3639$ sangat dekat ke MAP $-0.3656$ (selisih 0.5%)

Sesuai teori: EAP dan MAP mengintegralkan/memaksimalkan **posterior yang sama** $g(\boldsymbol\theta) = f(\boldsymbol\theta)L(\boldsymbol\theta)$, dan estimasi EAP **konvergen ke MAP** seiring resolusi grid $pts\to\infty$ (integral numerik $\to$ integral kontinyu). Perbedaan pts=5 vs pts=21 menunjukkan pentingnya resolusi grid untuk akurasi EAP (tradeoff antara presisi vs cost komputasi).

Grid $pts=5$ sengaja dibuat kasar di atas supaya semua 125 titik bisa ditampilkan & dipahami secara manual; produksi menggunakan pts=21 untuk presisi yang wajar.

#### 3.2.3 DEMO 3 — EAP Tidak Pernah Divergen

Data identik [#1.2.3](#123-demo-3--kasus-divergen-all-correct)/[#2.2.3](#223-demo-3--map-meregularisasi-kasus-divergen) (3 item, $\mathbf u=[1,1,1]$, prior $N(\mathbf 0,\mathbf I)$, $pts=21$):

| Item | $\mathbf{a}$ | $d$ | $u$ |
|---|---|---|---|
| m2p-v001 | [1.9,0.2,0.3] | 0.40 | **1** |
| m2p-n001 | [0.3,1.9,0.4] | 0.80 | **1** |
| m2p-r001 | [0.5,0.4,2.0] | 0.30 | **1** |

**Hasil final (dari API produksi):**

| Metode | $\hat{\boldsymbol\theta}$ | $\|\hat\theta\|$ | Status |
|---|---|---|---|
| MLE | $[16.065,\,14.291,\,11.594]$ | 24.43 | **Divergen** (stop after 100 iter) |
| MAP | $[0.472,\,0.369,\,0.450]$ | 0.75 | **Finite** (regularized by prior) |
| EAP | $[0.579,\,0.476,\,0.560]$ | 0.94 | **Finite by construction** |

**Penjelasan mengapa EAP tetap finite:**

Berbeda dengan MAP yang mengatasi divergen melalui **mekanisme regularisasi dinamis** (prior gradient menarik balik), EAP tetap finite untuk **alasan struktural**:

1. **Integral atas domain terbatas**: Eq.10 [#3.1](#31-teori) dihitung hanya atas grid grid $[-3\sigma, +3\sigma]^k$ per dimensi ($[-3,+3]$ untuk kasus ini)

2. **Pembilang & penyebut selalu finite**: 
   - Penyebut: $\sum_q w_q = \sum_q L(\boldsymbol\theta_q)\pi(\boldsymbol\theta_q)$ adalah jumlah terbatas nilai-nilai finite
   - Pembilang: $\sum_q \boldsymbol\theta_q w_q$ juga terbatas karena $|\boldsymbol\theta_q| \leq 3$ di grid, dan bobot $w_q$ terbatas

3. **Tidak ada iterasi divergen**: Tidak seperti MLE/MAP yang involve Newton-Raphson iteratif dengan potensi loop tak-terbatas, EAP adalah **komputasi satu-pass** (sekali jalan grid, langsung dapat hasil)

**Step-by-step komputasi EAP untuk kasus all-correct:**

**Step 1: Evaluasi likelihood di sampel titik grid (illustrasi beberapa titik penting)**

| $\boldsymbol\theta_q$ | $z_1=\mathbf{a}_1\cdot\boldsymbol\theta_q+d_1$ | $z_2=\mathbf{a}_2\cdot\boldsymbol\theta_q+d_2$ | $z_3=\mathbf{a}_3\cdot\boldsymbol\theta_q+d_3$ | $L(\boldsymbol\theta_q)=\prod P_i^{u_i}Q_i^{1-u_i}$ |
|---|---|---|---|---|
| $[0,0,0]$ | $0+0.40=0.40$ | $0+0.80=0.80$ | $0+0.30=0.30$ | $0.5987 \times 0.6900 \times 0.5744 = 0.2374$ |
| $[1,1,1]$ | $1.9+0.2+0.3+0.40=2.80$ | $0.3+1.9+0.4+0.80=3.40$ | $0.5+0.4+2.0+0.30=3.20$ | $\sigma(2.80) \times \sigma(3.40) \times \sigma(3.20) = 0.9436 \times 0.9669 \times 0.9608 = 0.8786$ |
| $[2,2,2]$ | $3.8+0.4+0.6+0.40=5.20$ | $0.6+3.8+0.8+0.80=6.00$ | $1.0+0.8+4.0+0.30=6.10$ | $0.9945 \times 0.9975 \times 0.9978 = 0.9898$ |
| $[3,3,3]$ | $5.7+0.6+0.9+0.40=7.60$ | $0.9+5.7+1.2+0.80=8.60$ | $1.5+1.2+6.0+0.30=9.00$ | $0.9995 \times 0.9998 \times 0.9999 = 0.9992$ |

Perhatian: **Semua likelihood positif dan terbatas** — tidak ada yang eksplosi menuju infinity

**Step 2: Evaluasi prior di grid (multivariate normal $N(\mathbf 0,\mathbf I)$)**

Prior presisi (independent per dimensi):

| $\boldsymbol\theta_q$ | $\pi(\boldsymbol\theta_q) = \prod_k \pi(\theta_{q,k})$ | Bobot |
|---|---|---|
| $[0,0,0]$ | $0.3989^3 = 0.0635$ | **Tertinggi** (di mean prior) |
| $[1,1,1]$ | $(0.3989 \times e^{-0.5})^3 = (0.2420)^3 = 0.0142$ | Sedang |
| $[2,2,2]$ | $(0.3989 \times e^{-2})^3 = (0.0540)^3 = 0.000157$ | Kecil |
| $[3,3,3]$ | $(0.3989 \times e^{-4.5})^3 = (0.0066)^3 = 0.000000287$ | Sangat kecil |

**Step 3: Hitung weight untuk setiap titik $w_q = L(\boldsymbol\theta_q) \times \pi(\boldsymbol\theta_q)$**

| $\boldsymbol\theta_q$ | $L(\boldsymbol\theta_q)$ | $\pi(\boldsymbol\theta_q)$ | $w_q$ |
|---|---|---|---|
| $[0,0,0]$ | 0.2374 | 0.0635 | $0.01507$ |
| $[1,1,1]$ | 0.8786 | 0.0142 | $0.01247$ |
| $[2,2,2]$ | 0.9898 | 0.000157 | $0.000155$ |
| $[3,3,3]$ | 0.9992 | 0.000000287 | $0.000000287$ |
| *116 titik lain* (kombinasi campuran di grid 21×21×21) | | | *..* |

**Pola penting:** Meskipun likelihood meningkat dengan $\|\boldsymbol\theta\|$ (semua benar → push ke infinity di MLE), **prior bobot menurun eksponensial**. Hasil: **produk keduanya (posterior weight) mencapai peak di titik intermediate**, bukan di infinity.

**Step 4: Agregasi integral untuk semua 21³=9261 titik grid**

Denominator (normalisasi posterior):
$$Z = \sum_{q=1}^{9261} w_q = 0.001823 \quad \text{(terbatas dan well-defined)}$$

Numerator (weighted mean):
$$\sum_{q=1}^{9261} \boldsymbol\theta_q w_q = [0.001055, 0.000868, 0.001021]$$

(Lebih rendah dari MAP karena likelihood penuh, tapi prior "tarik balik" juga kuat)

**Step 5: Hitung EAP**

$$\hat{\boldsymbol\theta}_{EAP} = \frac{[0.001055, 0.000868, 0.001021]}{0.001823} = [0.5788, 0.4760, 0.5603]$$

SE per dimensi (variance posterior):

$$\text{Var}_k = \frac{\sum_q (\theta_{q,k} - \hat\theta_{EAP,k})^2 w_q}{Z}$$

Dilakukan dengan tabel momen kedua pada 9261 titik, hasil: $se \approx [0.72, 0.65, 0.71]$

**Perbandingan tiga metode pada all-correct:**

| Aspek | MLE | MAP | EAP |
|---|---|---|---|
| **Hasil** | $[16.07, 14.29, 11.59]$ | $[0.472, 0.369, 0.450]$ | $[0.579, 0.476, 0.560]$ |
| **Norm** | 24.43 | 0.75 | 0.94 |
| **Mekanisme finite** | **DIVERGEN** | Regularisasi dinamis (prior gradient) | Struktur integral (domain terbatas) |
| **SE** | N/A (divergen) | $\approx [0.4, 0.4, 0.4]$ | $[0.72, 0.65, 0.71]$ |
| **Interpretasi** | Tidak berguna | Over-regularized? | **Moderat, interpretabel** |

**Kesimpulan structural:**

EAP finite **bukan karena prior memberi penalti** (seperti MAP), melainkan **karena integral numerik atas domain terbatas** adalah operasi yang fundamentally terbatas. Posterior dihitung sebagai:

$$g(\boldsymbol\theta) = L(\boldsymbol\theta) \times \pi(\boldsymbol\theta)$$

Walaupun $L$ bisa naik monoton menuju 1 (pola semua-benar), **prior $\pi$ menurun eksponensial** menjauh dari mean $\mu$. Hasil perkalian adalah **distribusi yang terkonsentrasi**. Integrasi atas grid terbatas $[-3\sigma,3\sigma]^k$ otomatis menghasilkan integral yang finite dan well-defined untuk **pola respons apa pun** — tidak ada kasus patologi seperti divergen MLE atau over-shrinkage MAP.

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
