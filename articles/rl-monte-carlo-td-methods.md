---
title: '強化学習におけるモンテカルロ法とTD法を数学で理解する'
description: '価値関数、Bellman方程式、モンテカルロ法、TD(0)、n-step TD、TD(λ) を数式ベースで整理し、偏り・分散・収束の違いを解説する'
emoji: '🎯'
date: 2026-04-05
topics: ["reinforcement-learning", "mathematics", "machine-learning"]
blog_published: True
published: False
---

## はじめに

強化学習では、ある方策 $\pi$ の下で

$$
\text{将来どれだけ報酬が得られるか}
$$

を評価することが基本問題になります。  
このとき価値関数を学習する代表的な方法が

- モンテカルロ法 (Monte Carlo, MC)
- TD 法 (Temporal Difference, TD)

です。

両者は似ていますが、本質的な違いがあります。

- モンテカルロ法は **実際に最後まで見た累積報酬** を使う
- TD 法は **Bellman 方程式を使って途中で bootstrap する**

という違いです。

この差は単なる実装テクニックではなく、

- unbiased だが分散が大きい推定
- biased だが分散が小さくオンライン更新しやすい推定

という数理的なトレードオフに対応しています。

この記事では、強化学習における MC 法と TD 法を数式中心に整理します。主な流れは次です。

1. MRP / MDP と価値関数の定義
2. モンテカルロ法の推定量と性質
3. TD(0) の更新式と Bellman 方程式との関係
4. n-step TD と TD($\lambda$) による橋渡し
5. 偏り・分散・収束の観点で両者を比較する

---

## 1. 問題設定

まず、固定された方策 $\pi$ を評価する **prediction 問題** から始めます。  
制御ではなく評価に絞ると、議論が最も明確になります。

### 1.1 Markov Reward Process

方策 $\pi$ を固定すると、MDP は Markov Reward Process (MRP) に落ちます。  
状態空間を $\mathcal{S}$、遷移確率を

$$
P_\pi(s,s') = \Pr(S_{t+1}=s' \mid S_t=s)
$$

とし、1 ステップ期待報酬を

$$
r_\pi(s) = \mathbb{E}_\pi[R_{t+1} \mid S_t=s]
$$

とします。割引率は

$$
\gamma \in [0,1)
$$

です。

### 1.2 Return と価値関数

時刻 $t$ から先の割引累積報酬を

$$
G_t := \sum_{k=0}^{\infty} \gamma^k R_{t+1+k}
$$

と定義します。すると状態価値関数は

$$
v_\pi(s)
:=
\mathbb{E}_\pi[G_t \mid S_t=s]
$$

です。

action-value 関数も同様に

$$
q_\pi(s,a)
:=
\mathbb{E}_\pi[G_t \mid S_t=s, A_t=a]
$$

と定義できますが、この記事ではまず $v_\pi$ に集中します。

### 1.3 Bellman 方程式

return の定義から

$$
G_t = R_{t+1} + \gamma G_{t+1}
$$

が成り立つので、

$$
v_\pi(s)
=
\mathbb{E}_\pi[R_{t+1} + \gamma v_\pi(S_{t+1}) \mid S_t=s]
$$

を得ます。行列表現では

$$
v_\pi = r_\pi + \gamma P_\pi v_\pi
$$

です。したがって

$$
(I-\gamma P_\pi)v_\pi = r_\pi
$$

であり、有限状態なら

$$
v_\pi = (I-\gamma P_\pi)^{-1} r_\pi
$$

です。

MC 法も TD 法も、最終的にはこの $v_\pi$ をサンプルから近似的に求める方法です。

---

## 2. モンテカルロ法

### 2.1 基本アイデア

モンテカルロ法は、状態 $s$ を訪れたあとに実際に観測された return

$$
G_t
$$

を、そのまま $v_\pi(s)$ のサンプルとみなします。

なぜなら、条件付き期待値の定義から

$$
\mathbb{E}_\pi[G_t \mid S_t=s] = v_\pi(s)
$$

だからです。

したがって、$S_t=s$ となるサンプルをたくさん集めて平均すれば、

$$
v_\pi(s)
$$

を推定できます。

### 2.2 first-visit MC と every-visit MC

エピソードを $i=1,\dots,N$ とし、エピソード $i$ の中で状態 $s$ が訪問された時刻集合を $\mathcal{T}_i(s)$ とします。

#### First-visit MC

各エピソードで最初の 1 回だけを使うなら、

$$
\hat v_N^{\text{FV}}(s)
=
\frac{1}{N_s}
\sum_{i:\,\mathcal{T}_i(s)\neq\varnothing}
G_{\tau_i(s)}^{(i)}
$$

です。ここで $\tau_i(s)$ はエピソード $i$ における最初の訪問時刻、$N_s$ は $s$ を訪れたエピソード数です。

##### 具体例

状態 $s$ について、3 本のエピソードから次のようなデータが得られたとします。

- エピソード 1:
  状態 $s$ が時刻 2 と 5 に現れた。
  最初の訪問時刻は

$$
\tau_1(s)=2
$$

で、その return が

$$
G_2^{(1)} = 10
$$

- エピソード 2:
  状態 $s$ が 1 回も現れない。
  このエピソードは使いません。

- エピソード 3:
  状態 $s$ が時刻 4 に現れた。
  最初の訪問時刻は

$$
\tau_3(s)=4
$$

で、その return が

$$
G_4^{(3)} = 6
$$

です。

このとき、状態 $s$ が現れたエピソードは 1 と 3 だけなので

$$
N_s = 2
$$

です。したがって First-visit MC の推定値は

$$
\hat v_3^{\mathrm{FV}}(s)
=
\frac{10+6}{2}
=
8
$$

です。

重要なのは、エピソード 1 の中で $s$ が 2 回目、3 回目に現れていても、First-visit MC ではそれらを使わないことです。

#### Every-visit MC

すべての訪問を使うなら、

$$
\hat v_M^{\text{EV}}(s)
=
\frac{1}{M_s}
\sum_{i=1}^N \sum_{t \in \mathcal{T}_i(s)} G_t^{(i)}
$$

です。$M_s$ は総訪問回数です。

##### 具体例

同じ 3 本のエピソードで、今度は状態 $s$ のすべての訪問を使うとします。

- エピソード 1:
  状態 $s$ が時刻 2 と 5 に現れ、

$$
G_2^{(1)} = 10,
\qquad
G_5^{(1)} = 4
$$

とします。

- エピソード 2:
  状態 $s$ は現れないので使いません。

- エピソード 3:
  状態 $s$ が時刻 4 に現れ、

$$
G_4^{(3)} = 6
$$

とします。

この場合、状態 $s$ の総訪問回数は

$$
M_s = 3
$$

なので、Every-visit MC の推定値は

$$
\hat v_3^{\mathrm{EV}}(s)
=
\frac{10+4+6}{3}
=
\frac{20}{3}
\approx
6.67
$$

です。

First-visit MC では

$$
\hat v_3^{\mathrm{FV}}(s)=8
$$

だったので、同じデータでも「各エピソードの最初の 1 回だけ使う」のか、「すべての訪問を使う」のかで推定値が変わることが分かります。

両者とも大標本では $v_\pi(s)$ に近づきますが、有限サンプルでは分散構造が異なります。

### 2.3 モンテカルロ推定量の unbiased 性

単純化のため、状態 $s$ に対する独立同分布に近いサンプル $G^{(1)},\dots,G^{(N)}$ があり、

$$
G^{(i)} \sim \text{distribution of } G_t \mid S_t=s
$$

とします。このときサンプル平均

$$
\hat v_N(s) = \frac{1}{N}\sum_{i=1}^N G^{(i)}
$$

は

$$
\mathbb{E}[\hat v_N(s)] = v_\pi(s)
$$

を満たすので unbiased です。

また

$$
\mathrm{Var}(\hat v_N(s))
=
\frac{1}{N}\mathrm{Var}(G_t \mid S_t=s)
$$

です。したがって大数の法則により

$$
\hat v_N(s) \to v_\pi(s)
$$

が成り立ちます。

### 2.4 incremental update

MC 法は平均更新として逐次的にも書けます。$s$ の $n$ 回目のサンプル return を $G_n(s)$ とすると、

$$
V_{n+1}(s)
=
V_n(s) + \frac{1}{n}\bigl(G_n(s)-V_n(s)\bigr)
$$

です。

<details>
<summary>導出を確認する</summary>

$n$ 個のサンプル return の平均を

$$
V_{n+1}(s)
=
\frac{1}{n}\sum_{k=1}^{n} G_k(s)
$$

とします。最後の 1 項を分けると

$$
V_{n+1}(s)
=
\frac{1}{n}
\left(
\sum_{k=1}^{n-1} G_k(s) + G_n(s)
\right)
$$

です。

ここで、$n-1$ 個のサンプル平均

$$
V_n(s)
=
\frac{1}{n-1}\sum_{k=1}^{n-1} G_k(s)
$$

より

$$
\sum_{k=1}^{n-1} G_k(s)
=
(n-1)V_n(s)
$$

なので、

$$
V_{n+1}(s)
=
\frac{1}{n}
\left(
(n-1)V_n(s) + G_n(s)
\right)
$$

となります。これを整理すると

$$
V_{n+1}(s)
=
\frac{nV_n(s) - V_n(s) + G_n(s)}{n}
$$

$$
=
V_n(s) + \frac{1}{n}\bigl(G_n(s)-V_n(s)\bigr)
$$

です。

</details>

一般に定数ステップサイズ $\alpha$ を使えば

$$
V_{t+1}(S_t)
=
V_t(S_t) + \alpha \bigl(G_t - V_t(S_t)\bigr)
$$

となります。これは stochastic approximation の形です。

### 2.5 モンテカルロ法の特徴

MC 法の数理的特徴は次の通りです。

- 目標値が実測 return $G_t$ なので自然
- Bellman 方程式を明示的に使わない
- エピソード終端まで待つ必要がある
- unbiased だが、$G_t$ の分散が大きくなりやすい

特に

$$
G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots
$$

は長い将来のノイズを全部含むため、分散が大きくなりやすいです。

---

## 3. TD(0) 法

### 3.1 基本アイデア

TD 法は return を最後まで待たずに、

$$
R_{t+1} + \gamma V(S_{t+1})
$$

を $v_\pi(S_t)$ の近似目標値として使います。  
これは Bellman 方程式

$$
v_\pi(S_t)
\approx
\mathbb{E}[R_{t+1} + \gamma v_\pi(S_{t+1}) \mid S_t]
$$

に対応しています。

TD(0) の更新は

$$
V_{t+1}(S_t)
=
V_t(S_t)
+ \alpha_t \delta_t
$$

で、TD 誤差は

$$
\delta_t
:=
R_{t+1} + \gamma V_t(S_{t+1}) - V_t(S_t)
$$

です。

##### 具体例

状態 $s$ から 1 ステップ先に状態 $s'$ へ遷移したとします。  
このとき観測された報酬と現在の推定値が

$$
R_{t+1}=2,\qquad \gamma=0.9,\qquad V_t(s)=5,\qquad V_t(s')=4
$$

だったとします。

すると TD target は

$$
Y_t^{\mathrm{TD}}
=
R_{t+1}+\gamma V_t(s')
=
2+0.9 \cdot 4
=
5.6
$$

です。したがって TD 誤差は

$$
\delta_t
=
5.6-5
=
0.6
$$

になります。

ステップサイズを

$$
\alpha=0.1
$$

とすると、更新後の価値は

$$
V_{t+1}(s)
=
V_t(s)+\alpha \delta_t
=
5+0.1 \cdot 0.6
=
5.06
$$

です。

逆に、もし次状態の価値推定が低くて

$$
R_{t+1}=0,\qquad \gamma=0.9,\qquad V_t(s)=5,\qquad V_t(s')=3
$$

なら、

$$
Y_t^{\mathrm{TD}}=0+0.9 \cdot 3 = 2.7
$$

なので

$$
\delta_t = 2.7-5=-2.3
$$

となり、$V_t(s)$ は下方向に修正されます。

つまり TD(0) は毎回

$$
\text{現在の推定 }V_t(s)
\quad \text{と} \quad
\text{1 ステップ先を使った目標 }R_{t+1}+\gamma V_t(s')
$$

の差だけを見て、少しずつ価値関数を修正していることが分かります。

### 3.2 TD target は biased

TD target

$$
Y_t^{\text{TD}} := R_{t+1} + \gamma V_t(S_{t+1})
$$

を考えると、一般には

$$
\mathbb{E}[Y_t^{\text{TD}} \mid S_t=s]
\neq
v_\pi(s)
$$

です。なぜなら $V_t$ がまだ真の価値関数 $v_\pi$ に一致していないからです。

つまり TD 法は bootstrap によって

- target の分散を下げる代わりに
- 近似値 $V_t$ を target に入れることによる bias を持つ

ことになります。

### 3.3 期待更新と Bellman 作用素

Bellman expectation operator を

$$
(T_\pi V)(s)
:=
\mathbb{E}_\pi[R_{t+1} + \gamma V(S_{t+1}) \mid S_t=s]
$$

と定義すると、

$$
v_\pi = T_\pi v_\pi
$$

です。

TD 更新の条件付き期待値は

$$
\mathbb{E}[\delta_t \mid S_t=s]
=
(T_\pi V_t)(s) - V_t(s)
$$

となるので、平均的には

$$
V_t(s)
\longrightarrow
(T_\pi V_t)(s)
$$

の方向へ押し戻されています。

したがって TD は、サンプル版 Bellman fixed-point iteration と見ることができます。

### 3.4 TD(0) はなぜ収束するのか

有限状態・方策固定・十分な探索・適切なステップサイズ

$$
\sum_t \alpha_t = \infty,
\qquad
\sum_t \alpha_t^2 < \infty
$$

の下では、表形式 TD(0) は $v_\pi$ に収束します。

直感は、期待更新が

$$
V \mapsto T_\pi V
$$

という縮小写像の不動点を追うからです。実際、sup-norm で

$$
\|T_\pi V - T_\pi W\|_\infty
\le
\gamma \|V-W\|_\infty
$$

が成り立ちます。

したがって deterministic なら value iteration

$$
V_{k+1}=T_\pi V_k
$$

は $v_\pi$ に収束します。TD はこれをサンプルノイズ付きで逐次実行していると見なせます。

### 3.5 線形代数で見た TD の目標

有限状態で定常分布 $d_\pi$ を考え、内積

$$
\langle x,y\rangle_D := x^\top D y,
\qquad
D=\mathrm{diag}(d_\pi)
$$

を導入します。TD(0) は平均的に

$$
\mathbb{E}[\delta_t \phi(S_t)] = 0
$$

という条件を満たす方向を目指します。表形式ではこれは

$$
V = \Pi_D T_\pi V
$$

という projected Bellman equation と一致します。  
表形式では $\Pi_D$ は恒等写像なので、結局

$$
V = T_\pi V = v_\pi
$$

です。

この見方は関数近似に進むと重要になります。

---

## 4. モンテカルロ法と TD 法の比較

### 4.1 target の比較

MC target は

$$
Y_t^{\text{MC}} = G_t
$$

TD(0) target は

$$
Y_t^{\text{TD}} = R_{t+1} + \gamma V_t(S_{t+1})
$$

です。

MC では

$$
\mathbb{E}[Y_t^{\text{MC}} \mid S_t=s] = v_\pi(s)
$$

ですが、TD では一般にそうではありません。

一方、分散は通常

$$
\mathrm{Var}(Y_t^{\text{TD}} \mid S_t=s)
<
\mathrm{Var}(Y_t^{\text{MC}} \mid S_t=s)
$$

となりやすいです。TD target は 1 ステップ先しかランダム性を直接含まず、残りは近似値 $V_t$ にまとめてしまうからです。

### 4.2 bias-variance trade-off

両者の差は典型的な bias-variance trade-off です。

- MC:

$$
\text{bias small} \quad \text{variance large}
$$

- TD:

$$
\text{bias larger} \quad \text{variance smaller}
$$

ただし RL では最終的に fixed point へ向かうダイナミクスが重要なので、1 ステップの unbiased 性だけでは優劣は決まりません。多くの実問題で TD の方が学習が速いのはこのためです。

### 4.3 オンライン性

MC はエピソード終端が必要なので continuing task と相性が悪いです。  
TD は

$$
(S_t,R_{t+1},S_{t+1})
$$

が得られた時点で更新できるため、オンライン・継続環境に向いています。

---

## 5. n-step TD

MC と TD(0) の間を埋めるのが n-step TD です。

### 5.1 n-step return

$n$ ステップ return を

$$
G_t^{(n)}
:=
\sum_{k=0}^{n-1}\gamma^k R_{t+1+k}
+
\gamma^n V(S_{t+n})
$$

と定義します。

すると更新は

$$
V(S_t)
\leftarrow
V(S_t) + \alpha \bigl(G_t^{(n)} - V(S_t)\bigr)
$$

です。

### 5.2 両極端としての MC と TD(0)

$n=1$ なら

$$
G_t^{(1)} = R_{t+1} + \gamma V(S_{t+1})
$$

なので TD(0) です。

一方、エピソード終端までの残り長さを $T-t$ として $n=T-t$ にすれば

$$
G_t^{(T-t)} = G_t
$$

となり MC です。

したがって n-step TD は、MC と TD(0) の連続的な橋渡しになっています。

---

## 6. TD($\lambda$) と eligibility trace

### 6.1 $\lambda$-return

$\lambda \in [0,1]$ を導入すると、$\lambda$-return は

$$
G_t^\lambda
:=
(1-\lambda)\sum_{n=1}^{\infty}\lambda^{n-1} G_t^{(n)}
$$

と書けます。終端付きエピソードでは最後の項を適切に含めた有限和になります。

これは

- 小さい $n$ の TD 的 target
- 大きい $n$ の MC 的 target

を幾何重みで平均していると解釈できます。

### 6.2 特殊ケース

- $\lambda=0$:

$$
G_t^\lambda = G_t^{(1)}
$$

で TD(0) になります。

- $\lambda \to 1$:

十分よい条件の下で MC return に近づきます。

つまり TD($\lambda$) は

$$
\text{MC} \leftrightarrow \text{TD(0)}
$$

の連続補間です。

### 6.3 backward view

実装では forward view の $\lambda$-return を直接使うより、eligibility trace

$$
e_t(s)
=
\gamma \lambda e_{t-1}(s) + \mathbf{1}\{S_t=s\}
$$

を用いて

$$
V_{t+1}(s)
=
V_t(s) + \alpha \delta_t e_t(s)
$$

と書く backward view がよく使われます。

これにより、最近訪れた状態に TD 誤差を広く配分できます。

---

## 7. action-value 版と制御

これまで状態価値関数 $v_\pi$ を扱いましたが、行動価値関数 $q_\pi$ でも同様です。

### 7.1 モンテカルロ制御

action-value に対して

$$
q_\pi(s,a)
=
\mathbb{E}_\pi[G_t \mid S_t=s, A_t=a]
$$

を MC 平均で推定し、そこから greedy 改善を行うと MC control になります。

### 7.2 TD 制御

代表例は SARSA です。

$$
Q_{t+1}(S_t,A_t)
=
Q_t(S_t,A_t)
+ \alpha
\bigl(
R_{t+1}
+ \gamma Q_t(S_{t+1},A_{t+1})
- Q_t(S_t,A_t)
\bigr)
$$

これは on-policy TD control です。

一方、Q-learning では

$$
Q_{t+1}(S_t,A_t)
=
Q_t(S_t,A_t)
+ \alpha
\bigl(
R_{t+1}
+ \gamma \max_a Q_t(S_{t+1},a)
- Q_t(S_t,A_t)
\bigr)
$$

となり、off-policy に最適 Bellman 方程式を追います。

---

## 8. 関数近似に入ると何が難しくなるか

表形式では TD は非常にきれいに収束しますが、関数近似

$$
V_\theta(s) \approx v_\pi(s)
$$

を導入すると事情が変わります。

### 8.1 モンテカルロ法

MC なら、たとえば二乗誤差

$$
\min_\theta
\mathbb{E}\bigl[(G_t - V_\theta(S_t))^2\bigr]
$$

を最小化する回帰問題に近く、理論的に比較的扱いやすいです。

### 8.2 TD 法

TD は target にも $\theta$ が入るので、

$$
R_{t+1} + \gamma V_\theta(S_{t+1})
$$

を使った更新は通常の教師あり学習とは異なります。  
線形近似では projected Bellman equation の解に対応しますが、非線形近似では不安定化しやすく、

- bootstrap
- off-policy
- function approximation

の 3 つが同時に入ると難しくなります。いわゆる deadly triad です。

---

## 9. 具体例: 小さな MRP で MC と TD の違いを見る

抽象論だけだと差が見えにくいので、2 状態の MRP を考えます。

### 9.1 環境

状態を

$$
\mathcal{S}=\{A,B\}
$$

とし、遷移と報酬を次のようにします。

- $A \to B$ に確率 1 で遷移し、報酬は $0$
- $B \to \text{terminal}$ に確率 1 で遷移し、報酬は $1$

割引率を

$$
\gamma \in [0,1)
$$

とすると、真の価値関数はすぐに計算できます。

### 9.2 真の価値関数

まず状態 $B$ では、次の 1 期だけ報酬 1 を受け取って終了するので

$$
v(B)=1
$$

です。

状態 $A$ では、1 ステップ先に $B$ があり、そのときの即時報酬は 0 なので

$$
v(A)=0+\gamma v(B)=\gamma
$$

です。

したがって

$$
v(A)=\gamma,
\qquad
v(B)=1
$$

が真値です。

### 9.3 モンテカルロ法ならどう見えるか

この環境では、$A$ から始まる return は

$$
G_t = 0 + \gamma \cdot 1 = \gamma
$$

で毎回同じです。したがって MC target は

$$
Y^{\text{MC}}(A)=\gamma
$$

で、1 エピソード目から真値そのものになります。

同様に $B$ の return は

$$
Y^{\text{MC}}(B)=1
$$

です。

この例ではランダム性がないので MC の分散は 0 ですが、通常は終端までのランダム報酬列が入るため分散が増えます。

### 9.4 TD(0) ならどう動くか

初期値を

$$
V_0(A)=V_0(B)=0
$$

とし、ステップサイズを $\alpha$ とします。

まず $A \to B$ の遷移で TD 誤差は

$$
\delta_A
=
0+\gamma V_0(B)-V_0(A)=0
$$

なので、最初の時点では

$$
V_1(A)=0
$$

のままです。

次に $B \to \text{terminal}$ の遷移で

$$
\delta_B
=
1 + \gamma \cdot 0 - V_0(B)=1
$$

だから

$$
V_1(B)=\alpha
$$

となります。

次のエピソードで再び $A \to B$ を観測すると

$$
\delta_A
=
0+\gamma V_1(B)-V_1(A)
=
\gamma \alpha
$$

となり、

$$
V_2(A)=\alpha \cdot \gamma \alpha = \gamma \alpha^2
$$

だけ増えます。

この例で見えるのは、

- MC は終端を見た瞬間に真値 return を直接使う
- TD は $B$ の学習結果が bootstrap を通じて徐々に $A$ に伝播する

という構造です。

大規模な問題では、この「値が近傍へ逐次伝播する」性質が TD の強みになります。

---

## 10. 実装例: Python で MC と TD(0) を比較する

以下は上の 2 状態 MRP をそのまま実装し、MC と TD(0) を並べて学習させる最小コードです。外部ライブラリは不要です。

```python
from dataclasses import dataclass


@dataclass
class TwoStateEpisode:
    states: list[str]
    rewards: list[float]


def generate_episode() -> TwoStateEpisode:
    # A --0--> B --1--> terminal
    return TwoStateEpisode(
        states=["A", "B"],
        rewards=[0.0, 1.0],
    )


def monte_carlo_prediction(num_episodes: int, gamma: float = 0.9):
    values = {"A": 0.0, "B": 0.0}
    counts = {"A": 0, "B": 0}

    for _ in range(num_episodes):
        episode = generate_episode()
        states = episode.states
        rewards = episode.rewards

        returns = [0.0] * len(states)
        g = 0.0
        for t in reversed(range(len(states))):
            g = rewards[t] + gamma * g
            returns[t] = g

        visited = set()
        for state, g in zip(states, returns):
            if state in visited:
                continue
            visited.add(state)
            counts[state] += 1
            n = counts[state]
            values[state] += (g - values[state]) / n

    return values


def td0_prediction(num_episodes: int, alpha: float = 0.1, gamma: float = 0.9):
    values = {"A": 0.0, "B": 0.0, "terminal": 0.0}

    for _ in range(num_episodes):
        # step 1: A -> B, reward 0
        td_target = 0.0 + gamma * values["B"]
        td_error = td_target - values["A"]
        values["A"] += alpha * td_error

        # step 2: B -> terminal, reward 1
        td_target = 1.0 + gamma * values["terminal"]
        td_error = td_target - values["B"]
        values["B"] += alpha * td_error

    return {"A": values["A"], "B": values["B"]}


if __name__ == "__main__":
    gamma = 0.9

    mc_values = monte_carlo_prediction(num_episodes=10, gamma=gamma)
    td_values = td0_prediction(num_episodes=10, alpha=0.1, gamma=gamma)

    print("True values: A=0.9, B=1.0")
    print("Monte Carlo:", mc_values)
    print("TD(0):", td_values)
```

このコードで注目すべき点は次です。

- MC は `returns[t]` を計算して、そのまま状態価値の平均に使っている
- TD(0) は `reward + gamma * next_value` で 1 ステップ先だけを使っている
- `A` の値は TD では `B` の推定値を通じて少しずつ上がる

### 10.1 この実装で期待される出力

$\gamma=0.9$ なら真値は

$$
v(A)=0.9,\qquad v(B)=1.0
$$

です。

MC はこの環境では各エピソードの return が常に同じなので、数エピソードでほぼ

```text
Monte Carlo: {'A': 0.9, 'B': 1.0}
```

になります。

一方 TD(0) は例えば 10 エピソード程度では

```text
TD(0): {'A': 0.23..., 'B': 0.65...}
```

のようにまだ真値へ向かう途中です。  
ただしエピソードを増やせば、$B$ が先に 1 に近づき、その後 $A$ が $\gamma$ へ近づいていきます。

### 10.2 ランダム報酬を入れると何が起きるか

もし $B$ で得る報酬を確率的に

$$
R \in \{0,2\}
$$

のように変えると、$A$ から見た MC return も毎回揺れます。すると

$$
Y^{\text{MC}} = G_t
$$

の分散が大きくなり、MC の更新は不安定になりやすいです。

一方 TD は

$$
Y^{\text{TD}} = R_{t+1} + \gamma V(S_{t+1})
$$

で将来部分を推定値に置き換えるため、通常は target の揺れが小さくなります。ここに TD の実務上の強さがあります。

---

## 11. どう使い分けるべきか

数学的観点から整理すると、使い分けはかなり明確です。

### 11.1 モンテカルロ法が向く場面

- エピソードが短く明確に終わる
- unbiased な評価を重視したい
- Bellman bootstrap を入れたくない
- オフラインで最後まで rollout できる

### 11.2 TD 法が向く場面

- 途中で逐次更新したい
- continuing task を扱いたい
- 分散を抑えたい
- 少ないサンプルで早く学習したい

実務上は TD 系が中心になることが多いですが、MC 的な return は policy gradient, actor-critic, offline evaluation などでも重要です。

---

## 12. まとめ

強化学習におけるモンテカルロ法と TD 法の違いは、数式で書くとかなり明確です。

モンテカルロ法は

$$
V(S_t) \leftarrow V(S_t) + \alpha \bigl(G_t - V(S_t)\bigr)
$$

で、実測 return をそのまま target に使います。  
これは unbiased ですが、分散が大きく、終端まで待つ必要があります。

TD(0) は

$$
V(S_t)
\leftarrow
V(S_t)
+ \alpha
\bigl(
R_{t+1} + \gamma V(S_{t+1}) - V(S_t)
\bigr)
$$

で、Bellman 方程式に基づいて 1 ステップ bootstrap を行います。  
こちらは biased ですが、分散が小さく、オンラインに更新できます。

さらに

- n-step TD は MC と TD(0) の橋渡し
- TD($\lambda$) はその連続補間

になっています。

結局のところ、

$$
\text{MC} = \text{full return を使う}
$$

$$
\text{TD} = \text{Bellman 再帰を使って一部を近似値で置き換える}
$$

という違いがすべてです。  
この 1 点を押さえると、SARSA, Q-learning, actor-critic, eligibility traces などの位置づけもかなり見通しよく理解できます。
