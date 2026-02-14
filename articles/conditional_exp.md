---
title: '条件付き期待値の性質'
description: 'Katexがブログ上で使えることの確認も兼ねて、学生時代に解いた演習問題を記載する'
emoji: '📐'
date: 2024-08-19
topics: ["statistics"]
blog_published: False
published: False
---

式が崩れている部分は後日に訂正をします(たぶん)

**仮定**

確率空間 $(\Omega, \mathcal{F}, P)$ を固定し、$\mathcal{G}$ を $\mathcal{F}$ の部分 $\sigma$ 加法族であるとする。  
さらに、確率変数 $X \in L^{1}(\Omega, \mathcal{F})$ が成り立つとする。  

ラドンニコディムの定理から次のような確率変数 $E[X|\mathcal{G}]$ を (P-a.s) 一意にとることができる。

---

**(条件付き期待値の定義 (Kuo\,2章))**

$X$ の $\mathcal{G}$ による条件付き期待値 $E[X|\,\mathcal{G}]$ は以下の 2 つを満たすものとして定義される。

1. **(i)**  
   $E[X|\,\mathcal{G}]$ は $\mathcal{G}$ 可測
2. **(ii)**  
   任意の $A \in \mathcal{G}$ について、次の式が成り立つ。

   $$
   \int_{A} E[X|\,\mathcal{G}] \, P(d\omega) = \int_{A} X \, P(d\omega)
   $$

---

**定理4.2(ii)の条件と次の (ii)` が等しいことを示す。**

**次の条件 (ii), (ii)` は同値である。**

- **(ii)**  
  任意の $A \in \mathcal{G}$ について、次の式が成り立つ。
  
  $$
  E[X; A] = E[\xi; A]
  $$

- **(ii)`**  
  任意の有界な $\mathcal{G}$ 可測確率変数 $\eta$ について、
  
  $$
  E[X\eta] = E[\xi \eta]
  $$
  が成り立つ。

---

**証明**

1. **(ii)` $\Rightarrow$ (ii)**  
   確率変数 $\eta$ を $I_{A}$ ととればよい。

2. **(ii) $\Rightarrow$ (ii)`**  
   - **$\eta$ が単関数である場合**  
     $\eta = \sum_{i=1}^n a_i I_{A_i}$\,($a_i \in \mathbb{R}$, \,$\{A_i\}_{i=1}^n$ は各 $i$ について、$A_i \in \mathcal{G}$) と表されるとする。
     
     このとき、
     
     $$
     E[X\eta] = \sum_{i=1}^n a_i E[X; A_i] = \sum_{i=1}^n a_i E[\xi; A_i] = E[\xi \eta]
     $$
     となる。
     
     一般の場合についても単関数近似によって示すことができる（後で書く）。

---

**条件付き期待値の性質**

1. $E[E[X|\mathcal{G}]] = E[X]$
2. $E\left[\sum_{k=1}^n a_k X_k \,\bigg|\, \mathcal{G}\right] = \sum_{k=1}^n a_k E[X_k|\mathcal{G}] \quad \text{a.s}$
3. $X_1 \leq X_2 \,\text{a.s} \Rightarrow E[X_1|\mathcal{G}] \leq E[X_2|\mathcal{G}] \,\text{a.s}$
4. $|E[X|\,\mathcal{G}]|^p \leq E[|X|^p|\,\mathcal{G}] \,\text{a.s}$
5. $Y$ が $\mathcal{G}$ 可測ならば、
   
   $$
   E[XY|\,\mathcal{G}] = Y E[X|\,\mathcal{G}] \,\text{a.s}
   $$
6. $\mathcal{G}_1 \subset \mathcal{G}_2$ ならば、
   
   $$
   E[X|\,\mathcal{G}_1] = E[E[X|\mathcal{G}_2]|\mathcal{G}_1] \,\text{a.s}
   $$

---

**証明**

1. **$E[E[X|\mathcal{G}]] = E[X]$**  
   条件付き期待値の定義の (ii) で、$A = \Omega$ とした場合に対応している。

2. **線形性**  
   簡単のために $n=2$ として、$E[aX + bY|\,\mathcal{G}] = aE[X|\,\mathcal{G}] + bE[Y|\,\mathcal{G}]$ を示す。
   
   従って、次の等式
   
   $$
   \int_A \left(aE[X|\,\mathcal{G}] + b E[Y|\,\mathcal{G}]\right) \, P(d\omega) = \int_A (aX + bY) \, P(d\omega)
   $$
   が成り立つことを確かめればよい。
   
   左辺は、
   
   $$
   a \int_A E[X|\,\mathcal{G}] \, P(d\omega) + b \int_A E[Y|\,\mathcal{G}] \, P(d\omega) = a \int_A X \, P(d\omega) + b \int_A Y \, P(d\omega)
   $$
   （条件付き期待値の定義より）  
   これが右辺と一致する。
   
   Well-defined に定義されていることを示す。  
   可積分性について、$|aX + bY| \leq |a||X| + |b||Y|$ であり、$X$, $Y$ はそれぞれ可積分であるので、$aX + bY$ は可積分である。  
   最後に、条件付き期待値の条件 (i) について、$E[X|\,\mathcal{G}]$ と $E[Y|\,\mathcal{G}]$ はともに $\mathcal{G}$ 可測であるので、$aE[X|\,\mathcal{G}] + bE[Y|\,\mathcal{G}]$ は $\mathcal{G}$ 可測である。

3. **順序保存性**  
   任意の $A \in \mathcal{G}$ について、
   $$
   \int_A (E[X_2|\, \mathcal{G}] - E[X_1|\, \mathcal{G}]) \, P(d\omega)
   $$
   が成り立つことを示す。
   
   計算すると、
   
   \begin{align*}
   &\int_A (E[X_2|\, \mathcal{G}] - E[X_1|\, \mathcal{G}]) \, P(d\omega) \\
   &= \int_A E[X_2|\, \mathcal{G}] \, P(d\omega) - \int_A E[X_1|\, \mathcal{G}] \, P(d\omega) \\
   &= \int_A X_2 \, P(d\omega) - \int_A X_1 \, P(d\omega) \\
   &\geq 0 \quad \text{（$X_2 \geq X_1$ より）}
   \end{align*}

4. **条件付き Jensen の不等式**  
   より一般的な場合を示せば、$\phi(x) = |x|^k$ の場合を考えることで証明が完了する。
   
   **条件付き Jensen の不等式**  
   $\phi(x)$ を凸関数、$X$ を $X$ と $\phi(X)$ が可積分な確率変数とする。$\mathcal{G}$ を $\mathcal{F}$ の部分 $\sigma$ 加法族としたとき、次の式が成り立つ。
   
   $$
   \phi(E[X|\,\mathcal{G}]) \leq E[\phi(X)|\,\mathcal{G}]
   $$
   （条件付き Jensen の不等式の証明は、[参考資料](http://www.math.kobe-u.ac.jp/HOME/higuchi/h22kogi/prob100430.pdf) を参照。）

5. **乗法性**  
   $Y$ を $\mathcal{G}$ 可測な確率変数であるとすると、$Y\eta$ も $\mathcal{G}$ 可測な確率変数であるため、
   \begin{align*}
   E[XY\eta] &= E[X(Y\eta)] \\
   &= E[E[X|\mathcal{G}] (Y\eta)] \quad \text{（条件 (ii)` より）} \\
   &= E[(E[X|\mathcal{G}] Y) \eta]
   \end{align*}
   が成り立つ。
   
   従って任意の $\mathcal{G}$-可測な確率変数 $\eta$ について、
   
   $$
   E[(XY) \eta] = E[(E[X|\mathcal{G}] Y) \eta]
   $$
   が成り立つ。
   
   ゆえに条件 (ii)` を用いて、$XY$ の条件付き期待値 $E[XY|\,\mathcal{G}]$ は
   
   $$
   E[XY|\,\mathcal{G}] = Y E[X|\mathcal{G}]
   $$
   と表すことができる。

6. **塔の定理（マルコフ性）**  
   $\mathcal{G}_1 \subset \mathcal{G}_2$ ならば、
   
   $$
   E[X|\,\mathcal{G}_1] = E[E[X|\mathcal{G}_2]|\mathcal{G}_1] \,\text{a.s}
   $$
   
   証明：  
   $\eta$ は $\mathcal{G}_1$-可測であるとすると、
   
   $$
   E[X\eta] = E[E[X|\mathcal{G}_1] \eta] \quad \text{（条件 (ii)` より）}
   $$
   が成り立つ。
   
   また、$\eta$ は仮定から $\mathcal{G}_2$-可測でもあるので、
   
   $$
   E[X\eta] = E[E[X|\mathcal{G}_2] \eta] \quad \text{（条件 (ii)` より）}
   $$
   が成り立つ。
   
   従って、任意の $\mathcal{G}_1$ 可測な確率変数 $\eta$ について、
   
   $$
   E[E[X|\mathcal{G}_1] \eta] = E[E[X|\mathcal{G}_2] \eta]
   $$
   が成り立つので、再び条件 (ii)` を用いて、
   $E[X|\mathcal{G}_2]$ の $\mathcal{G}_1$ のもとでの条件付き期待値について、
   
   $$
   E[E[X|\mathcal{G}_2] |\, \mathcal{G}_1] = E[X|\mathcal{G}_1]
   $$
   と表すことができる。
