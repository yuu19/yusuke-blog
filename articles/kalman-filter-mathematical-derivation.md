---
title: 'カルマンフィルタを数式ベースで理解する'
description: '線形ガウス状態空間モデルから、予測式・更新式・カルマンゲイン・Riccati 方程式までを数式中心に導出する'
emoji: '📐'
date: 2026-04-10
topics: ["mathematics", "statistics", "time-series"]
blog_published: True
published: False
---

## はじめに

カルマンフィルタは、**ノイズを含む観測から、時間とともに変化する潜在状態を逐次推定するための再帰アルゴリズム**です。

ただし、教科書ではしばしば

$$
\hat{x}_{t|t}
=
\hat{x}_{t|t-1}
+
K_t\left(y_t - H_t \hat{x}_{t|t-1}\right)
$$

という更新式だけが提示され、なぜこの形になるのかが見えにくくなりがちです。

この記事では、カルマンフィルタを

1. 線形ガウス状態空間モデルの定式化
2. 条件付き期待値としての最適推定
3. 予測ステップ
4. 観測による更新ステップ
5. 誤差共分散の再帰式
6. イノベーション尤度と Riccati 方程式

の順に整理します。

主眼は、**カルマンフィルタは「線形」「ガウス」「二乗誤差最小化」という 3 つの条件のもとで、条件付き分布を逐次計算しているだけ**だと理解することです。

---

## 1. 問題設定

時点 $t=1,2,\dots,T$ で、潜在状態ベクトル $x_t \in \mathbb{R}^n$ と観測ベクトル $y_t \in \mathbb{R}^m$ を考えます。

カルマンフィルタの基本モデルは、次の**線形ガウス状態空間モデル**です。

### 1.1 状態方程式

$$
x_t = F_t x_{t-1} + B_t u_t + w_t
$$

### 1.2 観測方程式

$$
y_t = H_t x_t + v_t
$$

ここで

- $F_t \in \mathbb{R}^{n \times n}$: 状態遷移行列
- $B_t u_t$: 既知入力
- $H_t \in \mathbb{R}^{m \times n}$: 観測行列
- $w_t \in \mathbb{R}^n$: プロセスノイズ
- $v_t \in \mathbb{R}^m$: 観測ノイズ

です。

以下の仮定を置きます。

- $w_t \sim \mathcal{N}(0, Q_t)$
- $v_t \sim \mathcal{N}(0, R_t)$
- 初期状態 $x_0 \sim \mathcal{N}(m_0, P_0)$
- $\{w_t\}$, $\{v_t\}$, $x_0$ は相互に独立

このとき、全ての $(x_t, y_t)$ は同時にガウスになります。

---

## 2. 何を推定したいのか

時点 $t$ までの観測情報を

$$
\mathcal{Y}_t := \sigma(y_1,\dots,y_t)
$$

と書きます。

カルマンフィルタの中心的な対象は、次の条件付き期待値です。

### 2.1 1 期先予測平均

$$
\hat{x}_{t|t-1}
:=
\mathbb{E}[x_t \mid \mathcal{Y}_{t-1}]
$$

### 2.2 フィルタ平均

$$
\hat{x}_{t|t}
:=
\mathbb{E}[x_t \mid \mathcal{Y}_t]
$$

対応する誤差を

$$
e_{t|t-1} := x_t - \hat{x}_{t|t-1},
\qquad
e_{t|t} := x_t - \hat{x}_{t|t}
$$

とし、その共分散を

$$
P_{t|t-1}
:=
\mathbb{E}[e_{t|t-1} e_{t|t-1}' \mid \mathcal{Y}_{t-1}]
$$

$$
P_{t|t}
:=
\mathbb{E}[e_{t|t} e_{t|t}' \mid \mathcal{Y}_t]
$$

と定義します。

カルマンフィルタは、各時点で

$$
(\hat{x}_{t|t-1}, P_{t|t-1})
\quad\longrightarrow\quad
(\hat{x}_{t|t}, P_{t|t})
$$

を更新し、それを次期の予測へ流す再帰です。

---

## 3. なぜ条件付き期待値が最適なのか

まず、なぜ

$$
\hat{x}_{t|t} = \mathbb{E}[x_t \mid \mathcal{Y}_t]
$$

を推定値にするのかを明確にします。

任意の $\mathcal{Y}_t$-可測推定量 $a_t$ に対して、

$$
\mathbb{E}\left[\|x_t - a_t\|^2\right]
$$

を最小にする $a_t$ は条件付き期待値です。

実際、

$$
x_t - a_t
=
\bigl(x_t - \mathbb{E}[x_t \mid \mathcal{Y}_t]\bigr)
+
\bigl(\mathbb{E}[x_t \mid \mathcal{Y}_t] - a_t\bigr)
$$

なので、

\begin{align*}
\mathbb{E}\left[\|x_t-a_t\|^2\right]
=\;&
\mathbb{E}\left[\|x_t-\mathbb{E}[x_t \mid \mathcal{Y}_t]\|^2\right] \\
&+
\mathbb{E}\left[\|\mathbb{E}[x_t \mid \mathcal{Y}_t]-a_t\|^2\right] \\
&+
2\mathbb{E}\left[
\bigl(x_t-\mathbb{E}[x_t \mid \mathcal{Y}_t]\bigr)'
\bigl(\mathbb{E}[x_t \mid \mathcal{Y}_t]-a_t\bigr)
\right].
\end{align*}

最後の交差項は、条件付き期待値の直交性より 0 です。したがって

$$
\mathbb{E}\left[\|x_t-a_t\|^2\right]
=
\mathbb{E}\left[\|x_t-\mathbb{E}[x_t \mid \mathcal{Y}_t]\|^2\right]
+
\mathbb{E}\left[\|\mathbb{E}[x_t \mid \mathcal{Y}_t]-a_t\|^2\right].
$$

右辺第 2 項は非負なので、最小化解は

$$
a_t = \mathbb{E}[x_t \mid \mathcal{Y}_t]
$$

です。

つまりカルマンフィルタは、**逐次的な最小二乗推定**を実行していると解釈できます。

---

## 4. 予測ステップの導出

時点 $t-1$ までの情報 $\mathcal{Y}_{t-1}$ があるとき、状態方程式

$$
x_t = F_t x_{t-1} + B_t u_t + w_t
$$

の条件付き期待値を取ると、

$$
\hat{x}_{t|t-1}
=
\mathbb{E}[x_t \mid \mathcal{Y}_{t-1}]
=
F_t \hat{x}_{t-1|t-1} + B_t u_t
$$

となります。ここで

$$
\mathbb{E}[w_t \mid \mathcal{Y}_{t-1}] = 0
$$

を使いました。

次に予測誤差共分散を計算します。予測誤差は

\begin{align*}
e_{t|t-1}
=\;&
x_t - \hat{x}_{t|t-1} \\
=\;&
F_t(x_{t-1} - \hat{x}_{t-1|t-1}) + w_t.
\end{align*}

したがって

\begin{align*}
P_{t|t-1}
=\;&
\mathbb{E}[e_{t|t-1}e_{t|t-1}' \mid \mathcal{Y}_{t-1}] \\
=\;&
F_t P_{t-1|t-1} F_t' + Q_t.
\end{align*}

ここで交差項

$$
\mathbb{E}\left[F_t(x_{t-1}-\hat{x}_{t-1|t-1})w_t' \mid \mathcal{Y}_{t-1}\right]
$$

は、$w_t$ が過去情報と独立で平均 0 なので消えます。

これで予測ステップは

$$
\boxed{
\hat{x}_{t|t-1}
=
F_t \hat{x}_{t-1|t-1} + B_t u_t
}
$$

$$
\boxed{
P_{t|t-1}
=
F_t P_{t-1|t-1} F_t' + Q_t
}
$$

となります。

---

## 5. 更新ステップの導出

次に、新しい観測 $y_t$ が得られたときに、予測分布をどう更新するかを考えます。

### 5.1 イノベーション

まず観測予測誤差、つまり**イノベーション**を

$$
\nu_t := y_t - \mathbb{E}[y_t \mid \mathcal{Y}_{t-1}]
$$

と定義します。

観測方程式から

$$
\mathbb{E}[y_t \mid \mathcal{Y}_{t-1}]
=
H_t \hat{x}_{t|t-1}
$$

なので、

$$
\nu_t = y_t - H_t \hat{x}_{t|t-1}.
$$

さらに

\begin{align*}
\nu_t
=\;&
H_t x_t + v_t - H_t \hat{x}_{t|t-1} \\
=\;&
H_t e_{t|t-1} + v_t.
\end{align*}

したがってイノベーション共分散は

\begin{align*}
S_t
:=\;&
\mathbb{E}[\nu_t \nu_t' \mid \mathcal{Y}_{t-1}] \\
=\;&
H_t P_{t|t-1} H_t' + R_t.
\end{align*}

また、状態予測誤差とイノベーションの共分散は

\begin{align*}
\operatorname{Cov}(e_{t|t-1}, \nu_t \mid \mathcal{Y}_{t-1})
=\;&
\mathbb{E}[e_{t|t-1}\nu_t' \mid \mathcal{Y}_{t-1}] \\
=\;&
P_{t|t-1} H_t'.
\end{align*}

---

## 6. ガウス条件付き分布から更新式を出す

線形ガウス仮定のもとでは、$\mathcal{Y}_{t-1}$ を固定したとき

$$
\begin{pmatrix}
x_t \\
y_t
\end{pmatrix}
\Bigg|\mathcal{Y}_{t-1}
$$

は同時ガウスです。

その平均は

$$
\mathbb{E}
\left[
\begin{pmatrix}
x_t \\
y_t
\end{pmatrix}
\middle|\mathcal{Y}_{t-1}
\right]
=
\begin{pmatrix}
\hat{x}_{t|t-1} \\
H_t \hat{x}_{t|t-1}
\end{pmatrix}
$$

であり、共分散は

$$
\begin{pmatrix}
P_{t|t-1} & P_{t|t-1}H_t' \\
H_t P_{t|t-1} & H_t P_{t|t-1} H_t' + R_t
\end{pmatrix}
=
\begin{pmatrix}
P_{t|t-1} & P_{t|t-1}H_t' \\
H_t P_{t|t-1} & S_t
\end{pmatrix}.
$$

一般に、同時ガウスベクトル

$$
\begin{pmatrix}
a \\
b
\end{pmatrix}
\sim
\mathcal{N}
\left(
\begin{pmatrix}
\mu_a \\
\mu_b
\end{pmatrix},
\begin{pmatrix}
\Sigma_{aa} & \Sigma_{ab} \\
\Sigma_{ba} & \Sigma_{bb}
\end{pmatrix}
\right)
$$

に対して、条件付き分布は

$$
a \mid b
\sim
\mathcal{N}
\left(
\mu_a + \Sigma_{ab}\Sigma_{bb}^{-1}(b-\mu_b),
\;
\Sigma_{aa} - \Sigma_{ab}\Sigma_{bb}^{-1}\Sigma_{ba}
\right)
$$

です。

これを $a=x_t$, $b=y_t$ に適用すると、

$$
\hat{x}_{t|t}
=
\hat{x}_{t|t-1}
+
P_{t|t-1}H_t' S_t^{-1}
\left(y_t - H_t \hat{x}_{t|t-1}\right)
$$

が得られます。

ここで

$$
K_t := P_{t|t-1}H_t' S_t^{-1}
$$

を**カルマンゲイン**と呼びます。

したがって更新式は

$$
\boxed{
\hat{x}_{t|t}
=
\hat{x}_{t|t-1}
+
K_t \nu_t
}
$$

です。

---

## 7. カルマンゲインは何を意味しているのか

カルマンゲイン

$$
K_t = P_{t|t-1}H_t'(H_tP_{t|t-1}H_t' + R_t)^{-1}
$$

は、予測値と観測値のどちらをどれだけ信用するかを決める重みです。

いくつかの極端な場合を見ると直感が得られます。

### 7.1 観測ノイズが非常に小さい場合

$$
R_t \approx 0
$$

なら $S_t$ は小さくなり、観測を強く反映するので $K_t$ は大きくなります。

### 7.2 予測誤差が小さい場合

$$
P_{t|t-1} \approx 0
$$

なら既に状態をかなり正確に知っているため、観測で大きく修正する必要がなく $K_t$ は小さくなります。

したがってカルマンフィルタは、

- 予測が不確かなら観測を重く見る
- 観測がノイジーなら予測を重く見る

という分散ベースの重み付けを自動で行っています。

---

## 8. フィルタ誤差共分散の導出

更新後の誤差は

\begin{align*}
e_{t|t}
=\;&
x_t - \hat{x}_{t|t} \\
=\;&
x_t - \hat{x}_{t|t-1} - K_t(y_t - H_t\hat{x}_{t|t-1}) \\
=\;&
e_{t|t-1} - K_t(H_t e_{t|t-1} + v_t) \\
=\;&
(I - K_t H_t)e_{t|t-1} - K_t v_t.
\end{align*}

したがって

\begin{align*}
P_{t|t}
=\;&
\mathbb{E}[e_{t|t}e_{t|t}' \mid \mathcal{Y}_t] \\
=\;&
(I-K_tH_t)P_{t|t-1}(I-K_tH_t)' + K_t R_t K_t'.
\end{align*}

これを**Joseph form**と呼びます。数値計算では対称性や半正定値性を保ちやすいので重要です。

一方、$K_t = P_{t|t-1}H_t' S_t^{-1}$ を代入して整理すると

$$
P_{t|t}
=
P_{t|t-1} - P_{t|t-1}H_t' S_t^{-1} H_t P_{t|t-1}
$$

すなわち

$$
\boxed{
P_{t|t}
=
(I-K_tH_t)P_{t|t-1}
}
$$

とも書けます。

実装上は、丸め誤差を考えると Joseph form のほうが安全です。

---

## 9. 直交性原理から見た導出

ここまでは条件付きガウス分布から更新式を出しましたが、カルマンフィルタは**最良線形不偏推定**としても理解できます。

線形更新則

$$
\tilde{x}_{t|t}
=
\hat{x}_{t|t-1} + K_t\bigl(y_t - H_t\hat{x}_{t|t-1}\bigr)
$$

を考え、$K_t$ を自由に選んで平均二乗誤差

$$
\operatorname{tr}\,\mathbb{E}\left[
(x_t-\tilde{x}_{t|t})(x_t-\tilde{x}_{t|t})'
\mid \mathcal{Y}_{t-1}
\right]
$$

を最小化します。

誤差は

$$
x_t-\tilde{x}_{t|t}
=
(I-K_tH_t)e_{t|t-1} - K_t v_t
$$

なので、目的関数は

\begin{align*}
J(K_t)
=\;&
\operatorname{tr}\Bigl(
(I-K_tH_t)P_{t|t-1}(I-K_tH_t)' + K_tR_tK_t'
\Bigr).
\end{align*}

これを $K_t$ で微分して 0 と置くと

$$
K_t(H_tP_{t|t-1}H_t' + R_t)
=
P_{t|t-1}H_t'
$$

が得られ、よって

$$
K_t = P_{t|t-1}H_t'(H_tP_{t|t-1}H_t' + R_t)^{-1}
$$

です。

線形ガウスモデルでは、最良線形推定量と真の条件付き期待値が一致するため、この $K_t$ は厳密にベイズ最適です。

---

## 10. 全体の再帰

以上をまとめると、カルマンフィルタは次の 2 段階再帰になります。

### 10.1 Predict

$$
\hat{x}_{t|t-1} = F_t\hat{x}_{t-1|t-1} + B_tu_t
$$

$$
P_{t|t-1} = F_tP_{t-1|t-1}F_t' + Q_t
$$

### 10.2 Update

$$
\nu_t = y_t - H_t\hat{x}_{t|t-1}
$$

$$
S_t = H_tP_{t|t-1}H_t' + R_t
$$

$$
K_t = P_{t|t-1}H_t'S_t^{-1}
$$

$$
\hat{x}_{t|t} = \hat{x}_{t|t-1} + K_t\nu_t
$$

$$
P_{t|t}
=
(I-K_tH_t)P_{t|t-1}(I-K_tH_t)' + K_tR_tK_t'
$$

これが各時点で一度ずつ回るので、計算量は行列積と逆行列計算に還元されます。

---

## 11. 尤度との関係

カルマンフィルタは推定だけでなく、**線形ガウス状態空間モデルの尤度計算**にも使われます。

連鎖律より

$$
p(y_1,\dots,y_T)
=
\prod_{t=1}^T p(y_t \mid y_1,\dots,y_{t-1})
$$

です。

線形ガウスモデルでは

$$
y_t \mid \mathcal{Y}_{t-1}
\sim
\mathcal{N}(H_t\hat{x}_{t|t-1}, S_t)
$$

なので、

\begin{align*}
\log p(y_1,\dots,y_T)
=\;&
\sum_{t=1}^T \log p(y_t \mid \mathcal{Y}_{t-1}) \\
=\;&
-\frac{1}{2}\sum_{t=1}^T
\Bigl(
m\log(2\pi)
+
\log|S_t|
+
\nu_t'S_t^{-1}\nu_t
\Bigr).
\end{align*}

この式は、状態空間モデルの最尤推定で非常によく使われます。  
つまりカルマンフィルタは、状態推定器であると同時に尤度評価器でもあります。

---

## 12. 定常カルマンフィルタと Riccati 方程式

時間不変モデル

$$
x_t = Fx_{t-1} + Bu_t + w_t,
\qquad
y_t = Hx_t + v_t
$$

を考え、$Q_t=Q$, $R_t=R$ が一定だとします。

十分な可観測性・可安定性条件のもとでは、共分散列 $P_{t|t-1}$, $P_{t|t}$ は定常値に収束します。

定常予測共分散を $P$ と書くと、

$$
S = HPH' + R,
\qquad
K = PH'S^{-1}
$$

であり、

$$
P = F\left(P - PH'(HPH' + R)^{-1}HP\right)F' + Q
$$

を満たします。

これが**離散時間代数 Riccati 方程式**です。

この方程式の解から定常カルマンゲインが決まり、十分時間が経った後は毎期同じゲインで更新できます。

---

## 13. 1 次元の場合の直感

1 次元で

$$
x_t = a x_{t-1} + w_t,
\qquad
y_t = x_t + v_t
$$

を考えます。ここで

$$
w_t \sim \mathcal{N}(0,q),
\qquad
v_t \sim \mathcal{N}(0,r)
$$

です。

このとき

$$
K_t = \frac{P_{t|t-1}}{P_{t|t-1} + r}
$$

となり、更新式は

$$
\hat{x}_{t|t}
=
\hat{x}_{t|t-1}
+
\frac{P_{t|t-1}}{P_{t|t-1}+r}
\left(y_t - \hat{x}_{t|t-1}\right)
$$

です。

これは、予測 $\hat{x}_{t|t-1}$ と観測 $y_t$ の加重平均に見えます。

- $r$ が大きい: 観測がうるさいので観測をあまり信用しない
- $P_{t|t-1}$ が大きい: 予測が不確かなので観測を重く見る

という構造が一目で分かります。

---

## 14. どこで破れるのか

カルマンフィルタは強力ですが、厳密に正しいのは次の条件が満たされるときです。

- 状態遷移が線形
- 観測方程式が線形
- ノイズがガウス
- 共分散行列 $Q_t$, $R_t$ が正しく指定されている

これらが破れると、条件付き分布はもはや厳密にはガウスではありません。

例えば

- 非線形モデルでは拡張カルマンフィルタ (EKF)
- 非線形性が強い場合は Unscented Kalman Filter (UKF)
- 非ガウス・多峰性なら粒子フィルタ

が候補になります。

また実務上は、$Q_t$ と $R_t$ の指定が結果を大きく左右します。  
モデルが正しくても、ノイズ共分散を過小評価するとフィルタは過度に観測へ反応し、過大評価すると反応が鈍くなります。

---

## 15. まとめ

カルマンフィルタの本質は次の通りです。

1. 状態空間モデルを書く
2. 予測分布 $p(x_t \mid \mathcal{Y}_{t-1})$ を作る
3. 新しい観測 $y_t$ を使って条件付き分布 $p(x_t \mid \mathcal{Y}_t)$ に更新する
4. 線形ガウスゆえに、この更新が平均と共分散の再帰だけで閉じる

特に重要なのは、

- 平均の更新はイノベーションへの線形補正
- 共分散の更新は不確実性の縮小
- カルマンゲインは予測と観測の信頼度を分散ベースで調整する

という 3 点です。

式を暗記するより、

$$
\text{予測} \to \text{イノベーション} \to \text{条件付きガウス更新}
$$

という流れで理解すると、拡張カルマンフィルタや状態空間モデルの尤度推定にも自然に接続できます。
