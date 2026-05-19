---
title: 'マクロ経済学への強化学習の応用'
description: 'Bellman方程式、MDP、近似動的計画法を軸に、マクロ経済学への強化学習応用を数理的に解説する'
emoji: '🧠'
date: 2026-03-24
topics: ["economics", "macroeconomics", "reinforcement-learning"]
blog_published: True
published: False
---
## はじめに

マクロ経済学と強化学習 (Reinforcement Learning, RL) は、一見すると別分野に見えます。  
しかし数理の中心には共通部分がかなりあります。マクロ経済学では昔から動的計画法、Bellman 方程式、最適制御、Riccati 方程式が使われてきました。RL はその枠組みを、**遷移法則が未知である場合**、**状態空間が巨大で厳密解が難しい場合**、**シミュレータからサンプルを生成して学習したい場合**へ拡張したものと見ると整理しやすいです。

この記事では、マクロ経済学への RL 応用を数理的に解説します。  
主眼は「RL をマクロに使うとき、何が新しく、何が従来の動学最適化と同じなのか」を明確にすることです。

扱う論点は次です。

1. マクロの政策問題を MDP としてどう定式化するか
2. Bellman 方程式と Euler 方程式がどう接続するか
3. 線形化されたマクロ政策問題ではなぜ LQR と RL がつながるか
4. 異質エージェントや高次元状態で、なぜ近似 RL が必要になるか
5. 実際のマクロ政策分析で RL を使うときの限界は何か

## 1. マクロ経済学の政策問題を MDP として書く

### 1.1 基本セットアップ

時点 $t=0,1,2,\dots$ において、政策当局または代表的主体が状態 $s_t \in \mathcal{S}$ を観測し、行動 $a_t \in \mathcal{A}(s_t)$ を選ぶとします。  
状態遷移は確率カーネル

$$
P(\mathrm{d}s' \mid s,a)
$$

で与えられ、1 期利得を

$$
r(s_t,a_t)
$$

とします。割引率を $\beta \in (0,1)$ とすると、方策 $\pi$ の価値関数は

$$
V^\pi(s)
=
\mathbb{E}^\pi \left[
\sum_{t=0}^{\infty} \beta^t r(s_t,a_t)
\;\middle|\;
s_0=s
\right]
$$

です。最適価値関数は

$$
V^*(s)=\sup_\pi V^\pi(s)
$$

で定義されます。

これはそのままマクロの動学最適化問題です。  
例えば

- 家計の消費・貯蓄問題
- 政府の最適財政ルール
- 中央銀行の損失最小化問題
- 気候政策や債務政策の逐次制御問題

はすべてこの形に埋め込めます。

### 1.2 Bellman 方程式

最適価値関数は Bellman 方程式

$$
V^*(s)
=
\sup_{a \in \mathcal{A}(s)}
\left\{
r(s,a)+\beta \int V^*(s') P(\mathrm{d}s' \mid s,a)
\right\}
$$

を満たします。

作用素

$$
(TV)(s)
=
\sup_{a \in \mathcal{A}(s)}
\left\{
r(s,a)+\beta \int V(s') P(\mathrm{d}s' \mid s,a)
\right\}
$$

を定義すると、適当な有界性条件の下で $T$ は sup-norm に関する縮小写像です。  
実際、

$$
\|TV-TW\|_\infty
\le
\beta \|V-W\|_\infty
$$

なので、Banach の不動点定理から $V^*$ は一意です。

この時点で、すでにマクロの標準的な動的計画法と RL の数理は一致しています。  
違いは、マクロではしばしば $P$ と $r$ をモデルから書き下ろすのに対して、RL ではそれらを未知としてサンプルから近似する点にあります。

## 2. Bellman 方程式と Euler 方程式の接続

RL をマクロに持ち込むときに混乱しやすいのは、「Bellman 方程式は新しい理論なのか」という点です。  
答えはほぼ No です。多くのマクロ問題では、Bellman 方程式を一階条件に落とすと Euler 方程式が出てきます。

### 2.1 消費・貯蓄問題

典型例として、資産 $a_t$ と外生所得ショック $z_t$ をもつ家計問題を考えます。  
状態は

$$
s_t=(a_t,z_t)
$$

とし、行動は消費 $c_t$ です。資産制約は

$$
a_{t+1}=R a_t + y(z_t) - c_t,
\qquad a_{t+1}\ge \underline a
$$

とします。ここで $R>0$ は総収益率です。効用が $u(c)$ なら、Bellman 方程式は

$$
V(a,z)
=
\max_{c}
\left\{
u(c)+
\beta
\mathbb{E}\left[
V(a',z')
\mid z
\right]
\right\}
$$

subject to

$$
a' = R a + y(z) - c, \qquad a' \ge \underline a
$$

です。

内点解を仮定して一階条件を書くと

$$
u'(c_t)
=
\beta \,
\mathbb{E}_t \left[
V_a(a_{t+1},z_{t+1})
\right]
$$

が得られます。さらに envelope condition

$$
V_a(a_t,z_t)
=
R\,u'(c_t)
$$

を用いると、

$$
u'(c_t)
=
\beta R \,
\mathbb{E}_t \left[
u'(c_{t+1})
\right]
$$

となり、標準的な Euler 方程式が出ます。

つまり

- Bellman 方程式: 価値関数を通じた再帰表現
- Euler 方程式: その一階条件

という関係です。  
RL は Bellman 再帰をサンプルベースで解く道具群であり、マクロの動学理論と対立するものではありません。

## 3. RL はどこで新しくなるのか

### 3.1 既知モデルと未知モデル

マクロ理論では普通、

$$
s_{t+1} = f(s_t,a_t,\varepsilon_{t+1})
$$

という遷移法則をモデルから明示的に与えます。  
このとき Bellman 方程式を value iteration, policy iteration, projection method, perturbation method などで解けばよいので、必ずしも RL は必要ありません。

RL が必要になるのは主に次のケースです。

- 遷移法則 $f$ や分布が未知
- 厳密な期待値計算が難しく、シミュレーションしか使えない
- 状態が高次元で古典的グリッド法が破綻する
- モデルを解析的に解くより、ポリシーを直接近似したい

### 3.2 Model-based RL

model-based RL では、遷移法則を

$$
\hat P_\theta(\mathrm{d}s' \mid s,a)
$$

として推定し、その上で Bellman 方程式

$$
\hat V(s)
=
\sup_a
\left\{
\hat r_\theta(s,a)+
\beta \int \hat V(s') \hat P_\theta(\mathrm{d}s' \mid s,a)
\right\}
$$

を解きます。

これはマクロでいう「推定した法則運動の下で動学計画を解く」ことにほぼ等しいです。  
したがって DSGE やシミュレータがある場合、RL 的な言葉に言い換えても本質は近似動学計画法です。

### 3.3 Model-free RL

一方で model-free RL は、$P$ を明示的に推定せず、サンプル軌道から価値関数や方策を直接更新します。  
行動価値関数

$$
Q^\pi(s,a)
=
\mathbb{E}^\pi\left[
\sum_{t=0}^\infty \beta^t r_t
\;\middle|\; s_0=s,a_0=a
\right]
$$

を使えば、Bellman 最適方程式は

$$
Q^*(s,a)
=
r(s,a)
\;+\;
\beta \int \max_{a'} Q^*(s',a') P(\mathrm{d}s' \mid s,a)
$$

です。

Q-learning の更新は離散状態・離散行動なら

$$
Q_{t+1}(s_t,a_t)
\leftarrow
Q_t(s_t,a_t)
+
\alpha_t
\left[
r_t + \beta \max_{a'}Q_t(s_{t+1},a') - Q_t(s_t,a_t)
\right]
$$

となります。

ただしマクロでは行動が連続値であることが多く、

- 消費量
- 利子率
- 炭素税率
- 資本規制の強度

などは離散 action より連続 control と考えるほうが自然です。  
このため、マクロ応用では Q-learning より policy gradient や actor-critic のほうが適合しやすいです。

## 4. 方策勾配と政策最適化

### 4.1 パラメトリック政策

政策関数を $\pi_\theta(a\mid s)$ でパラメータ化します。  
目的関数を

$$
J(\theta)
=
\mathbb{E}_{\pi_\theta}
\left[
\sum_{t=0}^{\infty}\beta^t r(s_t,a_t)
\right]
$$

とおくと、policy gradient theorem により

$$
\nabla_\theta J(\theta)
=
\mathbb{E}_{\pi_\theta}
\left[
\sum_{t=0}^{\infty}
\beta^t
\nabla_\theta \log \pi_\theta(a_t\mid s_t)
\, Q^{\pi_\theta}(s_t,a_t)
\right]
$$

が成り立ちます。

分散を下げるため advantage 関数

$$
A^\pi(s,a)=Q^\pi(s,a)-V^\pi(s)
$$

を用いれば、

$$
\nabla_\theta J(\theta)
=
\mathbb{E}_{\pi_\theta}
\left[
\sum_{t=0}^{\infty}
\beta^t
\nabla_\theta \log \pi_\theta(a_t\mid s_t)
\, A^{\pi_\theta}(s_t,a_t)
\right]
$$

と書けます。

### 4.2 マクロ政策問題との対応

例えば中央銀行の目的関数が

$$
r_t = -\left(
\lambda_\pi \pi_t^2
+
\lambda_x x_t^2
+
\lambda_i i_t^2
\right)
$$

のような period loss の負値で与えられているとします。  
ここで

- $\pi_t$: インフレギャップ
- $x_t$: 需給ギャップ
- $i_t$: 政策金利や政策スタンス

です。

このとき policy gradient は、「将来損失の期待現在価値」を最小化するように政策ルールのパラメータ $\theta$ を更新する式になります。  
Taylor rule の係数を固定して探索するよりも、政策関数全体をニューラルネットで近似して学習する、というのが深層 RL 的な見方です。

## 5. 線形マクロモデルと LQR

### 5.1 線形二次制御としてのマクロ政策

線形化されたマクロモデルでは

$$
x_{t+1} = A x_t + B u_t + w_{t+1}
$$

という遷移を考えることがよくあります。  
ここで

- $x_t \in \mathbb{R}^n$: 状態ベクトル
- $u_t \in \mathbb{R}^m$: 政策変数
- $w_{t+1}$: 平均 0 の外生ショック

です。

損失関数を

$$
\ell(x_t,u_t)=x_t'Qx_t + u_t'Ru_t
$$

とし、目的を

$$
\min_{\{u_t\}}
\mathbb{E}
\left[
\sum_{t=0}^{\infty}\beta^t \ell(x_t,u_t)
\right]
$$

とすると、これは割引付き LQR 問題です。

### 5.2 Riccati 方程式

価値関数を二次形式

$$
V(x) = x' P x + c
$$

と仮定すると、Bellman 方程式から最適政策は

$$
u_t = -K x_t
$$

であり、

$$
K=
\left(
R+\beta B'PB
\right)^{-1}
\beta B'PA
$$

となります。  
また $P$ は離散時間 Riccati 方程式

$$
P
=
Q
+
\beta A'PA
-
\beta^2 A'PB
\left(
R+\beta B'PB
\right)^{-1}
B'PA
$$

を満たします。

これは RL にとって非常に重要です。  
なぜなら、線形化ニューケインジアン・モデルの政策問題はしばしばこの形に落ちるため、RL は「未知の $A,B$ を環境との相互作用から学びつつ、最適フィードバック制御を近似する」ものとして理解できるからです。

### 5.3 LQR と RL の接点

LQR ではモデルが既知なら Riccati 方程式を解けば終わりです。  
しかし $A,B$ が未知、あるいはシミュレータブラックボックスしかない場合、

- critic が $V(x)\approx x'Px$ を学習する
- actor が $u=-Kx$ の $K$ を学習する

という actor-critic 的な見方が自然になります。

つまり RL は、LQR を置き換えるというより、**LQR をモデル未知・近似解の状況に拡張した計算法**として使えます。

## 6. 異質エージェント・マクロへの応用

### 6.1 状態空間の爆発

HANK や Aiyagari 型モデルでは、集計状態だけでなく分布自体が状態に入ります。  
例えば

$$
s_t = (K_t, z_t, \mu_t)
$$

のように、$\mu_t$ を家計分布とすると、政策問題は

$$
V(K,z,\mu)
=
\sup_a
\left\{
r(K,z,\mu,a)
+
\beta \mathbb{E}\left[
V(K',z',\mu')
\mid K,z,\mu,a
\right]
\right\}
$$

となります。

このとき難しいのは、$\mu_t$ が有限次元ベクトルではなく分布であることです。  
古典的なグリッド法はすぐに次元の呪いに直面します。

### 6.2 近似関数による圧縮

RL 的には次のような近似が考えられます。

- 価値関数近似: $V_\phi(K,z,\mu)$
- 政策関数近似: $\pi_\theta(a\mid K,z,\mu)$
- 分布圧縮: $\mu$ をモーメントやエンコーダで低次元表現 $m(\mu)$ に写す

つまり

$$
V(K,z,\mu) \approx \tilde V_\phi(K,z,m(\mu))
$$

のように表現して学習します。

この発想はマクロで昔からある parameterized expectations, projection methods, neural network approximations と本質的に近く、RL はそれをサンプルベースかつ逐次制御の観点から組み直したものです。

### 6.3 Mean-field 的な見方

多数主体モデルでは、各主体の最適化と集計分布の進化が同時に決まります。  
この構造は mean-field control や mean-field games に近く、

$$
\mu_{t+1} = \Phi(\mu_t,\pi_t,\xi_{t+1})
$$

という分布進化写像の上で政策を学ぶ問題として書けます。

この種の問題では、個別主体の Bellman 方程式と分布の law of motion が相互依存するため、RL を使うとしても「何を状態に含めるか」が非常に重要です。

## 7. マクロ政策分析に RL を使うときの限界

### 7.1 探索問題

金融市場やゲーム環境と違い、現実のマクロ経済では自由に exploration できません。  
中央銀行が「試しに大きく金利を動かして学習する」ことは許されません。

したがって現実のマクロで RL を使う場合、多くは

- 構造モデルのシミュレータ上で学習する
- 履歴データだけを使う offline RL にする
- 推定済みのショック系列を用いて反実仮想評価する

のいずれかになります。

### 7.2 シミュレータ依存

シミュレータ上で高性能な policy が得られても、それは

$$
\hat P \neq P^{\text{true}}
$$

なら現実経済では最適でないかもしれません。  
これは model misspecification の問題であり、RL 固有というよりマクロ政策分析全般の問題です。

### 7.3 目的関数の設計

RL は報酬関数に忠実です。  
したがって welfare を

$$
r_t = -(\pi_t^2 + \lambda x_t^2)
$$

と置くのか、

$$
r_t = U(C_t,N_t)
$$

のような厚生指標にするのかで、学習される政策は全く変わります。

マクロ応用ではアルゴリズム選択より先に、

- 目的関数は何か
- 制約は何か
- 評価指標は厚生か安定化か

を明示する必要があります。

### 7.4 因果解釈の弱さ

RL は policy optimization の道具であって、識別そのものを与えるわけではありません。  
観測データから政策ルールを学んでも、それが因果的に最適政策を回収しているとは限りません。

特にオフラインデータでは、support mismatch により

$$
\pi(a\mid s) > 0
\quad\text{なのに}\quad
\mu_{\text{data}}(a\mid s) \approx 0
$$

という領域で外挿が必要になります。  
これは offline RL の最も大きな難所です。

## 8. まとめ

マクロ経済学への強化学習応用は、実はかなりの部分が既存の動学最適化理論の延長です。  
数理的な骨格は次の一列でつながっています。

1. マクロ政策問題を状態 $s_t$、行動 $a_t$、遷移 $P$、報酬 $r$ をもつ MDP として書く
2. Bellman 方程式で最適価値関数を定義する
3. 一階条件を取ると Euler 方程式や最適政策ルールが出る
4. モデル未知・高次元・ブラックボックス環境では RL によって価値関数や政策関数を近似する

その意味で RL は、マクロ理論を置き換えるものではなく、

- 動的計画法の計算手法
- 高次元近似手法
- シミュレータ上の政策最適化手法

として理解するのが自然です。

特に線形二次近似では LQR と直結し、異質エージェントやブラックボックス政策環境では関数近似 RL が有力になります。  
一方で、探索不能性、シミュレータ依存、報酬設計、オフライン外挿といった制約は重く、現実の政策応用にはかなり慎重さが必要です。

要するに、マクロ経済学における RL の核心は「Bellman 方程式を学習可能な形に拡張すること」にあります。  
数理の土台はすでにマクロ側にあり、RL はその上に乗る計算と近似の技術体系だ、と捉えると全体像が見やすくなります。
