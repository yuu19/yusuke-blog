---
title: '構造推定を数式ベースで理解する'
description: '構造推定の考え方を、識別・尤度・GMM・SMM・NFXP・MPECまで数式中心に整理する'
emoji: '📐'
date: 2026-04-04
topics: ["economics", "econometrics", "estimation"]
blog_published: True
published: False
---

## はじめに

構造推定は、単に

$$
\mathbb{E}[Y \mid X]
$$

の関係を当てるのではなく、**経済主体の意思決定、制約、均衡条件、ショックの分布**まで含めたモデルを立て、そのモデルのパラメータをデータから推定する方法です。

縮約形の回帰が

$$
Y = X\beta + u
$$

のように観測変数の間の統計的関係を直接書くのに対して、構造推定では

$$
\text{observables} = \text{model}(\theta, \text{states}, \text{shocks})
$$

という生成過程そのものを書きます。  
このとき推定したい対象は係数 $\beta$ だけではなく、効用関数、費用関数、選好パラメータ、調整費用、情報構造などをまとめた

$$
\theta \in \Theta \subset \mathbb{R}^p
$$

です。

この記事では、構造推定の基本を数式ベースで整理します。流れは次の通りです。

1. 構造モデルをどう書くか
2. 識別とは何か
3. 尤度・GMM・SMM でどう推定するか
4. 動学モデルでなぜ NFXP や MPEC が出てくるのか
5. 漸近理論と実務上の注意点

---

## 1. 問題設定

観測データを

$$
W_1, \dots, W_n \in \mathcal{W}
$$

とします。$W_i$ は個票でも時系列ブロックでも構いません。構造推定では、これらのデータがあるパラメータ $\theta_0$ の下で生成されたと考えます。

最も抽象的には、モデルは

$$
H(W_i, X_i, \varepsilon_i; \theta) = 0
$$

という形で書けます。ここで

- $W_i$ は観測変数
- $X_i$ は潜在状態や未観測変数
- $\varepsilon_i$ は外生ショック
- $\theta$ は構造パラメータ

です。

例えば離散選択なら、個人 $i$ が選択肢 $a$ を選んだときの潜在効用を

$$
U_{ia} = u(x_{ia}; \theta) + \varepsilon_{ia}
$$

と書き、

$$
y_i = \arg\max_{a \in \mathcal{A}} U_{ia}
$$

から観測された選択 $y_i$ が生成されると考えます。  
動学モデルなら Bellman 方程式、

$$
V_\theta(s) = \max_{a \in \mathcal{A}(s)} \left\{ \pi(s,a;\theta) + \beta \mathbb{E}[V_\theta(s') \mid s,a] \right\}
$$

が構造の中心になります。

重要なのは、**観測データの分布が $\theta$ を通じて間接的に決まる**という点です。  
したがって構造推定の本質は、モデルが含意する分布またはモーメントをデータと一致させることです。

---

## 2. 構造モデルから観測分布へ

観測データ $W$ の密度または確率質量関数を $p_\theta(w)$ と書きます。  
未観測変数 $X$ があるなら、観測分布は周辺化で

$$
p_\theta(w) = \int p_\theta(w,x)\,dx
$$

と書かれます。離散型なら積分を総和に置き換えればよいです。

この式は単純ですが、構造推定ではここに全てが入っています。  
効用最大化、均衡条件、状態遷移、測定誤差、政策関数は最終的に $p_\theta(w)$ あるいはその含意するモーメント

$$
M(\theta) = \mathbb{E}_\theta[m(W)]
$$

へ写像されます。

つまり

$$
\theta \longmapsto p_\theta(\cdot)
$$

または

$$
\theta \longmapsto M(\theta)
$$

という写像が、構造推定の中心です。

---

## 3. 識別

### 3.1 大域的識別

構造パラメータ $\theta_0$ が分布ベースで識別されるとは、

$$
p_\theta(w) = p_{\theta_0}(w) \ \text{a.s. for all } w
\quad \Longrightarrow \quad
\theta = \theta_0
$$

が成り立つことです。

モーメントベースなら

$$
M(\theta) = M(\theta_0)
\quad \Longrightarrow \quad
\theta = \theta_0
$$

が識別条件です。

この条件が壊れると、データからは複数の $\theta$ が同じ観測分布を生むため、推定量をいくら精密に計算しても「真の値」に絞れません。

### 3.2 局所識別

実務では局所識別を Jacobian のランク条件で確認することが多いです。  
モーメント条件

$$
\mathbb{E}[g(W,\theta_0)] = 0, \qquad g(W,\theta) \in \mathbb{R}^q
$$

を考えると、

$$
G_0 := \frac{\partial}{\partial \theta'} \mathbb{E}[g(W,\theta)] \Big|_{\theta=\theta_0}
\in \mathbb{R}^{q \times p}
$$

が列フルランク、

$$
\operatorname{rank}(G_0) = p
$$

なら、$\theta_0$ の近傍で局所識別が成立します。

直観的には、$\theta$ を少し動かしたときにモデル含意が十分な方向に動く、ということです。  
逆に $G_0$ がほぼ特異なら、弱識別や平坦な目的関数が起こりやすくなります。

---

## 4. 一般的な M 推定としての定式化

多くの構造推定は

$$
\hat{\theta}_n
=
\arg\min_{\theta \in \Theta} Q_n(\theta)
$$

または

$$
\hat{\theta}_n
=
\arg\max_{\theta \in \Theta} L_n(\theta)
$$

という M 推定として書けます。

例えば

$$
Q_n(\theta)
=
\frac{1}{n}\sum_{i=1}^n q(W_i;\theta)
$$

が一様収束して

$$
Q_n(\theta) \xrightarrow{u.p.} Q_0(\theta)
$$

かつ $Q_0(\theta)$ が $\theta_0$ で一意に最小化されるなら、

$$
\hat{\theta}_n \xrightarrow{p} \theta_0
$$

が得られます。  
したがって構造推定の理論は、結局は

1. 目的関数が極限で何に収束するか
2. その極限問題が本当に $\theta_0$ を選ぶか

に整理されます。

---

## 5. 最尤法

観測分布 $p_\theta(w)$ を明示的に書けるなら、最も自然なのは最尤法です。

独立同分布の設定では対数尤度を

$$
\ell_n(\theta)
=
\sum_{i=1}^n \log p_\theta(W_i)
$$

と置き、

$$
\hat{\theta}_{ML}
=
\arg\max_{\theta \in \Theta} \ell_n(\theta)
$$

で推定します。

### 5.1 潜在変数がある場合

潜在変数 $X_i$ があるなら、

$$
p_\theta(W_i)
=
\int p_\theta(W_i, X_i)\,dX_i
$$

なので、尤度はしばしば高次元積分を含みます。  
この積分が閉形式で計算できればよいですが、できない場合は

- 数値積分
- フィルタリング
- シミュレーション
- EM 的な手続き

が必要になります。

### 5.2 漸近分布

正則条件の下でスコア

$$
s(W_i,\theta)
=
\frac{\partial}{\partial \theta} \log p_\theta(W_i)
$$

と Fisher 情報

$$
I(\theta_0)
=
\mathbb{E}\left[s(W,\theta_0)s(W,\theta_0)'\right]
$$

を使って

$$
\sqrt{n}(\hat{\theta}_{ML}-\theta_0)
\xrightarrow{d}
\mathcal{N}(0, I(\theta_0)^{-1})
$$

が成り立ちます。  
尤度が正しく特定されていない場合は、いわゆる sandwich 分散になります。

---

## 6. GMM

構造モデルから直接尤度を書くのが難しくても、モーメント条件なら書けることが多いです。  
このとき一般化モーメント法 (GMM) を使います。

モーメント条件を

$$
\mathbb{E}[g(W,\theta_0)] = 0,
\qquad
g(W,\theta) \in \mathbb{R}^q
$$

とします。標本モーメントは

$$
\bar{g}_n(\theta)
=
\frac{1}{n}\sum_{i=1}^n g(W_i,\theta)
$$

です。GMM 推定量は

$$
\hat{\theta}_{GMM}
=
\arg\min_{\theta \in \Theta}
\bar{g}_n(\theta)' W_n \bar{g}_n(\theta)
$$

で定義されます。ここで $W_n$ は正定値の重み行列です。

効率的 GMM では

$$
W_n \approx \Omega^{-1},
\qquad
\Omega
=
\mathbb{E}[g(W,\theta_0)g(W,\theta_0)']
$$

を使います。

### 6.1 漸近分布

Jacobian

$$
G_0 = \mathbb{E}\left[\frac{\partial g(W,\theta_0)}{\partial \theta'}\right]
$$

を用いると、

$$
\sqrt{n}(\hat{\theta}_{GMM}-\theta_0)
\xrightarrow{d}
\mathcal{N}\left(
0,
(G_0'WG_0)^{-1}G_0'W\Omega WG_0(G_0'WG_0)^{-1}
\right).
$$

特に $W=\Omega^{-1}$ なら

$$
\operatorname{Avar}(\hat{\theta}_{GMM})
=
(G_0'\Omega^{-1}G_0)^{-1}
$$

となります。

### 6.2 構造推定での意味

構造推定で GMM を使うとき、$g(W,\theta)$ は単なる回帰残差ではありません。例えば

- Euler 方程式
- 需要と供給の均衡条件
- マルコフ遷移の定常モーメント
- 政策関数から導かれる予測誤差

など、モデル固有の制約から作られます。  
この点が通常の統計的モーメント推定と違います。

---

## 7. SMM と Indirect Inference

構造モデルは書けるが、理論モーメント

$$
M(\theta) = \mathbb{E}_\theta[m(W)]
$$

を解析的に計算できないことがあります。  
その場合、パラメータ $\theta$ の下で人工データをシミュレーションし、シミュレートされたモーメントで現実データを近似します。

シミュレーション回数を $S$ として、人工データを $W_1^{(s)}(\theta),\dots,W_n^{(s)}(\theta)$ とすると、

$$
\hat{M}_{n,S}(\theta)
=
\frac{1}{S}\sum_{s=1}^S
\left(
\frac{1}{n}\sum_{i=1}^n m(W_i^{(s)}(\theta))
\right)
$$

と書けます。

実データのモーメント

$$
\hat{M}_n
=
\frac{1}{n}\sum_{i=1}^n m(W_i)
$$

と比較して

$$
\hat{\theta}_{SMM}
=
\arg\min_{\theta \in \Theta}
\left(\hat{M}_n - \hat{M}_{n,S}(\theta)\right)'
W_n
\left(\hat{M}_n - \hat{M}_{n,S}(\theta)\right)
$$

を最小化します。

SMM の利点は、モデルを厳密な閉形式に落とせなくても推定できることです。  
一方で、$S$ が小さいとシミュレーションノイズが大きく、目的関数が粗くなります。

---

## 8. 動学構造推定と固定点

構造推定が急に難しくなるのは、$\theta$ を与えただけでは尤度やモーメントがすぐ計算できず、**その前に主体の最適化問題や均衡条件を解かなければならない**からです。

### 8.1 動学離散選択

状態 $s_t \in \mathcal{S}$、行動 $a_t \in \mathcal{A}$、フロー利得 $\pi(s_t,a_t;\theta)$、割引率 $\beta$ を考えます。  
価値関数は

$$
V_\theta(s)
=
\max_{a \in \mathcal{A}}
\left\{
\pi(s,a;\theta)
+
\beta \sum_{s' \in \mathcal{S}} V_\theta(s') P_\theta(s' \mid s,a)
\right\}.
$$

右辺の作用素を $T_\theta$ と書けば、

$$
V_\theta = T_\theta V_\theta
$$

が Bellman 固定点条件です。

選択確率 $P_\theta(a \mid s)$ や状態遷移密度 $f_\theta(s' \mid s,a)$ を用いれば、パネルデータ $(s_{it}, a_{it}, s_{i,t+1})$ の対数尤度は概念的に

$$
\ell_n(\theta)
=
\sum_{i,t}
\log P_\theta(a_{it} \mid s_{it})
+
\sum_{i,t}
\log f_\theta(s_{i,t+1} \mid s_{it}, a_{it})
$$

となります。

しかし $P_\theta(a \mid s)$ は $V_\theta$ を通じて決まるので、$\ell_n(\theta)$ を評価するには毎回 Bellman 方程式を解く必要があります。

### 8.2 NFXP

これが Rust 型の NFXP (nested fixed point) です。  
外側のループで $\theta$ を更新し、内側のループで

$$
V_\theta = T_\theta V_\theta
$$

を解きます。形式的には

$$
\hat{\theta}
=
\arg\max_{\theta \in \Theta}
\ell_n(\theta, V_\theta)
\quad
\text{subject to }
V_\theta = T_\theta V_\theta.
$$

NFXP の計算量が重いのは、候補パラメータごとに固定点を解き直すからです。

### 8.3 MPEC

MPEC は価値関数 $V$ 自体を最適化変数に含め、

$$
\max_{\theta, V} \ \ell_n(\theta, V)
$$

subject to

$$
V - T_\theta V = 0
$$

と書く方法です。

つまり NFXP では「内側で方程式を解いてから外側で最適化」していたのを、MPEC では

$$
\text{optimize over } (\theta, V)
$$

にまとめます。  
計算の勝ち負けは問題依存ですが、制約付き最適化ソルバを使える点、微分情報を一括で扱いやすい点が利点です。

---

## 9. 縮約形との違い

構造推定を使う理由は、パラメータに経済学的意味があるからです。  
例えば需要推定なら価格弾力性だけでなく、効用関数

$$
u_{ij} = x_j'\beta - \alpha p_j + \xi_j + \varepsilon_{ij}
$$

の $\alpha$ や $\beta$ を推定したいことがあります。  
そのとき

$$
\frac{\partial s_j}{\partial p_k}
$$

のような需要弾力性だけでなく、

- 価格規制の反事実
- 新商品の導入
- 税率変更
- 補助金政策

のような「制度変更後の均衡」を計算したいわけです。

縮約形は局所的な因果効果の推定に強い一方、制度が変わると係数の不変性が崩れやすいです。  
構造推定はモデルの仮定を強く置く代わりに、政策変更後の反事実分析を可能にします。

---

## 10. 漸近展開の見方

多くの構造推定量は、一階条件

$$
\frac{\partial Q_n(\hat{\theta}_n)}{\partial \theta} = 0
$$

または

$$
\frac{\partial \ell_n(\hat{\theta}_n)}{\partial \theta} = 0
$$

から導かれます。  
$\theta_0$ の近傍で Taylor 展開すると、

$$
0
=
\frac{\partial Q_n(\theta_0)}{\partial \theta}
+
\frac{\partial^2 Q_n(\bar{\theta}_n)}{\partial \theta \partial \theta'}
(\hat{\theta}_n - \theta_0)
$$

なので、

$$
\sqrt{n}(\hat{\theta}_n - \theta_0)
=
-
\left[
\frac{\partial^2 Q_n(\bar{\theta}_n)}{\partial \theta \partial \theta'}
\right]^{-1}
\sqrt{n}
\frac{\partial Q_n(\theta_0)}{\partial \theta}.
$$

この形を見ると、漸近分布は

1. 勾配の中心極限定理
2. Hessian の確率収束

に分解されることが分かります。  
構造推定が複雑でも、漸近理論の骨格自体は標準的な M 推定と同じです。

---

## 11. 実務上の難所

### 11.1 モデルの誤特定

現実のデータ生成過程がモデル族

$$
\{p_\theta : \theta \in \Theta\}
$$

に含まれない場合、推定量は「真の構造パラメータ」ではなく、擬似真値

$$
\theta^\ast
=
\arg\min_{\theta \in \Theta} Q_0(\theta)
$$

へ収束します。  
反事実分析もこの擬似真値に依存するため、モデル誤特定の影響は縮約形より深刻です。

### 11.2 弱識別

目的関数が平坦だと、

$$
Q_n(\theta_1) \approx Q_n(\theta_2)
$$

となり、標準誤差が大きくなります。  
局所的な二次近似が効かず、通常の Wald 型推論が不安定になることもあります。

### 11.3 計算誤差

動学モデルでは、推定誤差に加えて

- 固定点反復の打ち切り誤差
- 数値積分誤差
- シミュレーション誤差
- 非凸最適化による局所解

が入ります。  
構造推定では「統計の問題」と「数値解析の問題」が分離しません。

### 11.4 複数均衡

モデルが複数均衡をもつと、同じ $\theta$ でも観測分布が一意に定まらないことがあります。  
この場合

$$
\theta \longmapsto p_\theta
$$

という写像自体が多価になるので、推定と識別の議論を修正しなければなりません。

---

## 12. まとめ

構造推定を数式で見ると、やっていることは一貫しています。

1. モデルが観測分布またはモーメントをどう生成するかを書き下す
2. その写像が識別を与えるか確認する
3. 尤度、GMM、SMM などの目的関数を組み立てる
4. 必要なら Bellman 方程式や均衡条件を内側で解く
5. M 推定の漸近理論で推定量を評価する

要するに構造推定は、

$$
\theta
\xrightarrow{\text{model}}
p_\theta(\cdot) \text{ or } M(\theta)
\xrightarrow{\text{fit to data}}
\hat{\theta}
$$

という写像を扱う問題です。

縮約形より仮定は重いですが、その代わり

- パラメータに経済学的意味がある
- 制度変更の反事実分析ができる
- 最適化や均衡のメカニズムを直接テストできる

という利点があります。

構造推定を理解する鍵は、アルゴリズム名を覚えることではなく、

$$
\text{識別} \quad + \quad \text{目的関数} \quad + \quad \text{内側のモデル解法}
$$

の 3 つを分けて考えることです。  
この 3 つを分解して見れば、最尤法も GMM も SMM も NFXP も、同じ骨組みの上に乗っていることが分かります。
