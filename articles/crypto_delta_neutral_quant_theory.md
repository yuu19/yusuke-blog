---
title: '仮想通貨のデルタニュートラル戦略を数理ファイナンスで解剖する'
description: '現物ロング×Perpショートを中心に、ヘッジ比率、基差過程、Funding、清算確率、実務上の最適化問題を理論重視で整理します。'
emoji: '⚖️'
date: 2026-02-28
topics: ["finance", "crypto", "derivatives", "delta-neutral", "stochastic-process"]
blog_published: True
published: False
---

## はじめに

仮想通貨のデルタニュートラル戦略は、しばしば

- 「価格方向を取らずにFundingを取りに行く戦略」
- 「現物と先物をぶつけるだけの簡単な裁定」

として説明されます。

しかし実際には、収益・リスクの源泉は複数あり、
**何がキャンセルされ、何が残るか** を数式で分解しないと設計を誤ります。

この記事では、数理ファイナンスの観点から

1. 価格過程とヘッジ比率
2. PnL分解
3. 基差（basis）とFundingの確率モデル
4. 清算（liquidation）を含む制約付き最適化

を理論中心で整理します。

---

## 1. セットアップ: 何を「中立化」するのか

まず、対象を明確化します。

- 現物価格: $S_t$
- パーペチュアル価格: $F_t$
- 基差: $B_t = \log(F_t/S_t)$
- Fundingレート（単位時間）: $f_t$

典型戦略は

- 現物ロング
- Perpショート

で、狙いは「一次の価格感応度（デルタ）」の打ち消しです。

デルタニュートラルは


$$
\frac{\partial \Pi}{\partial S} \approx 0
$$

を意味しますが、**価格リスクがゼロ** を意味しません。
残るのは主に

- 基差変動リスク
- Funding変動リスク
- 取引コスト/借入コスト
- 清算リスク

です。

参考リンク:

- [Black-Scholes (1973)](https://doi.org/10.1086/260062)
- [Merton (1973)](https://doi.org/10.2307/3003143)
- [Angeris et al. (2022): A primer on perpetuals](https://arxiv.org/abs/2209.03307)

---

## 2. 連続時間モデルと最小分散ヘッジ比率

一般に、瞬間収益率を


$$
\frac{dS_t}{S_t} = \mu_S dt + \sigma_S dW_t^S,
\qquad
\frac{dF_t}{F_t} = \mu_F dt + \sigma_F dW_t^F,
$$


$$
 d\langle W^S, W^F \rangle_t = \rho\,dt
$$

とします。

現物を $q_t$ 単位ロング、Perpを $h_t$ 単位ショートすると、


$$
 d\Pi_t = q_t dS_t - h_t dF_t + h_t F_t f_t dt - dC_t,
$$

ここで $dC_t$ は手数料・スリッページ・借入等のコスト項です。

$q_t$ を固定したとき、拡散項分散を最小化する $h_t$ は


$$
 h_t^* = q_t\,\frac{\rho\,\sigma_S}{\sigma_F}\,\frac{S_t}{F_t}.
$$

重要点:

- $\rho=1$, $\sigma_S=\sigma_F$, $F_t\approx S_t$ なら $h_t^*\approx q_t$（単純1対1）
- 相関低下やボラ差があると、1対1は過不足ヘッジになる

つまり「デルタニュートラル」は固定比率ではなく、
本来は**状態依存のヘッジ比率**です。

参考リンク:

- [Ederington (1979): The hedging performance of the new futures markets](https://econpapers.repec.org/article/blajfinan/v_3a34_3ay_3a1979_3ai_3a1_3ap_3a157-70.htm)
- [Myers and Thompson (1989): Generalized Optimal Hedge Ratio Estimation](https://ideas.repec.org/a/oup/ajagec/v71y1989i4p858-868..html)
- [Aldrich: Hedging and minimum-variance hedge ratio (Lecture Notes)](https://ealdrich.github.io/Teaching/Econ236/LectureNotes/hedging.html)

---

## 3. 現物×PerpのPnL分解（理論の核）

実務でよく使う等額ノーション設定:

- 現物 $N$ ドル相当ロング: 単位数 $N/S_t$
- Perp $N$ ドル相当ショート: 単位数 $N/F_t$

このとき


$$
 d\Pi_t = \frac{N}{S_t}dS_t - \frac{N}{F_t}dF_t + N f_t dt - dC_t.
$$

さらに $F_t=S_t e^{B_t}$ を使うと、近似的に


$$
 \frac{dF_t}{F_t} \approx \frac{dS_t}{S_t} + dB_t
$$

より


$$
 \frac{d\Pi_t}{N} \approx -dB_t + f_t dt - dc_t,
$$

（$dc_t=dC_t/N$）。

ここから分かること:

1. 一次の方向リスク $dS_t/S_t$ はほぼ消える
2. 残る収益源泉は $f_t$ と $-dB_t$
3. 残る主要リスクは基差ジャンプとFundingレジーム変化

よってこの戦略は実態として

- 「価格方向」ではなく
- **Fundingと基差の確率過程**

にベットしていると解釈できます。

参考リンク:

- [Angeris et al. (2022): A primer on perpetuals](https://arxiv.org/abs/2209.03307)
- [Ackerer et al. (2023/2024): Perpetual Futures Pricing](https://arxiv.org/abs/2310.11771)
- [Deribit: Inverse Perpetual（契約とFunding計算）](https://support.deribit.com/hc/en-us/articles/31424954847133-Inverse-Perpetual)

---

## 4. 基差とFundingの確率モデル

### 4.1 基差 $B_t$ の平均回帰モデル

基差はしばしば平均回帰的とみなされ、


$$
 dB_t = \kappa(\theta - B_t)dt + \eta dW_t^B + dJ_t
$$

（ジャンプ $J_t$ を許容）でモデル化できます。

この場合、$-dB_t$ を受け取る側（現物ロング×Perpショート）は

- $B_t$ が高い局面で有利（収束益を得やすい）
- ただしジャンプで逆方向に飛ぶ tail risk を持つ

となります。

### 4.2 Funding $f_t$ のレジーム依存

Fundingは市場逼迫に応じて符号・水準が切り替わるため、単純定数より

- マルコフレジーム
- 自己励起ジャンプ（急騰時にスパイク）

のほうが実務に近いです。

期待収益は概念的に


$$
 \mathbb{E}[d\Pi_t] \approx N\bigl(\mathbb{E}[f_t]-\mathbb{E}[dB_t/dt]-\bar c_t\bigr)dt
$$

で評価できますが、重要なのは平均よりも
**分布の歪み（極端局面）** です。

参考リンク:

- [Kim, Park (2025): Designing funding rates for perpetual futures in cryptocurrency markets](https://arxiv.org/abs/2506.08573)
- [BIS Working Paper 1087: Crypto carry](https://www.bis.org/publ/work1087.htm)
- [Deribit API: public/get_funding_rate_history](https://docs.deribit.com/api-reference/market-data/public-get_funding_rate_history)

---

## 5. 清算リスクを入れたとき何が変わるか

暗号資産のデルタニュートラルで古典裁定と決定的に違うのは、
証拠金制約と強制清算です。

残余損益過程 $X_t$ を


$$
 dX_t = \mu_X dt + \sigma_X dW_t,
$$

清算境界を $-a$（$a>0$）として


$$
 \tau = \inf\{t\ge 0: X_t \le -a\}
$$

を定義すると、戦略評価は

- 平均PnL最大化
- $\mathbb{P}(\tau \le T)$ の抑制

のトレードオフになります。

つまり「期待値が正」だけでは不十分で、
**生存確率（survival probability）を内生化した設計** が必要です。

参考リンク:

- [Black and Cox (1976): A first-passage model for default risk](https://doi.org/10.1111/j.1540-6261.1976.tb01891.x)
- [Herrmann and Tanré (2015): First-passage time of Brownian motion to a boundary](https://arxiv.org/abs/1501.07060)
- [Deribit: Liquidations](https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations)
- [Bybit: Liquidation Price (USDT Contract)](https://www.bybit.com/en/help-center/article/Liquidation-Price-USDT-Contract)

---

## 6. 離散リバランス誤差とコスト最適化

理論最適比率 $h_t^*$ を連続で追うことは不可能なので、離散リバランスになります。

時刻列 $t_0<t_1<\cdots$ で更新する場合、


$$
 \varepsilon_T = \int_0^T (h_t-h_t^*)\,dF_t
$$

がヘッジ誤差で、更新頻度を上げるほど小さくなる一方、取引コストは増えます。

典型的には


$$
 \min_{\{t_i\}}\; \mathbb{E}[\varepsilon_T^2] + \lambda\,\mathbb{E}[\text{turnover cost}]
$$

という二次目的に落ちます。

したがって実装で重要なのは

- 「常時リバランス」でも
- 「放置」でもなく
- **誤差分散とコストの境界最適化**

です。

参考リンク:

- [Leland (1985): Option Pricing and Replication with Transactions Costs](https://econpapers.repec.org/article/blajfinan/v_3a40_3ay_3a1985_3ai_3a5_3ap_3a1283-1301.htm)
- [Boyle and Vorst (1992): Option replication in discrete time with transaction costs](https://doi.org/10.1111/j.1540-6261.1992.tb03986.x)
- [Whalley and Wilmott (1997): Asymptotic analysis of optimal hedging with transaction costs](https://doi.org/10.1111/1467-9965.00034)

---

## 7. オプション型デルタニュートラルとの接続

暗号資産でのデルタニュートラルは、現物×Perpだけでなく

- オプション売買 + 先物ヘッジ

にも拡張されます。

この場合、一次感応度を消しても

- ガンマ $\Gamma$
- ベガ
- ボラティリティ・オブ・ボラティリティ

が残り、PnLは


$$
 d\Pi \approx \frac{1}{2}\Gamma S^2\sigma^2 dt + \text{vega term} + \text{hedge error} - \text{cost}
$$

で支配されます。

つまり「デルタニュートラル = 無リスク」ではなく、
**どの高次感応度を保持する戦略か** の選択問題です。

参考リンク:

- [Merton (1973)](https://doi.org/10.2307/3003143)
- [John C. Hull: Options, Futures, and Other Derivatives (Slides)](https://www-2.rotman.utoronto.ca/~hull/ofodslides/index.html)
- [Carr-Madan公式の導出と証明、数値実装（本サイト）](https://tech-yusuke.com/articles/carr_madan_formula)

---

## 8. まとめ

仮想通貨のデルタニュートラル戦略を数理的に要約すると:

1. 消せるのは主に一次の方向リスク
2. 残るのは基差・Funding・清算・実装誤差
3. 収益源泉は「市場方向」ではなく「市場構造（資金需給）」
4. 最適化は「期待PnL最大化」単独ではなく、生存制約つきで行う

設計上の本質は、

**デルタを消すことではなく、残余リスクの確率構造を制御可能な形に落とすこと**

にあります。

参考リンク:

- [Ackerer et al. (2023/2024): Perpetual Futures Pricing](https://arxiv.org/abs/2310.11771)
- [Kim, Park (2025): Designing funding rates for perpetual futures in cryptocurrency markets](https://arxiv.org/abs/2506.08573)
- [Black and Cox (1976): A first-passage model for default risk](https://doi.org/10.1111/j.1540-6261.1976.tb01891.x)

---

## 9. 参考文献（章別対応）

### 9.1 第1章「セットアップ: 何を中立化するか」

- [Black-Scholes (1973)](https://doi.org/10.1086/260062)  
  連続時間で「何を複製し、何を中立化するか」の原点。
- [Merton (1973)](https://doi.org/10.2307/3003143)  
  動的ヘッジの一般化と自己資金制約の定式化。
- [Angeris et al. (2022): A primer on perpetuals](https://arxiv.org/abs/2209.03307)  
  Perpetual 契約での Funding と価格関係の理論整理。

### 9.2 第2章「連続時間モデルと最小分散ヘッジ比率」

- [Ederington (1979): The hedging performance of the new futures markets](https://econpapers.repec.org/article/blajfinan/v_3a34_3ay_3a1979_3ai_3a1_3ap_3a157-70.htm)  
  最小分散ヘッジ比率の実証的ベンチマーク。
- [Myers and Thompson (1989): Generalized Optimal Hedge Ratio Estimation](https://ideas.repec.org/a/oup/ajagec/v71y1989i4p858-868..html)  
  単純回帰以外も含む一般化ヘッジ比率推定。
- [Aldrich: Hedging and minimum-variance hedge ratio (Lecture Notes)](https://ealdrich.github.io/Teaching/Econ236/LectureNotes/hedging.html)  
  $h^*=\rho\sigma_S/\sigma_F$ の導出を確認しやすい講義ノート。

### 9.3 第3章「現物×PerpのPnL分解」

- [Angeris et al. (2022): A primer on perpetuals](https://arxiv.org/abs/2209.03307)  
  Perp の無裁定条件から PnL 構造を読む基礎。
- [Ackerer et al. (2023/2024): Perpetual Futures Pricing](https://arxiv.org/abs/2310.11771)  
  線形/逆数/quanto 契約まで含めた価格付け統一モデル。
- [Deribit: Inverse Perpetual（契約とFunding計算）](https://support.deribit.com/hc/en-us/articles/31424954847133-Inverse-Perpetual)  
  実務式での Funding と premium のつながりを確認。

### 9.4 第4章「基差とFundingの確率モデル」

- [Kim, Park (2025): Designing funding rates for perpetual futures in cryptocurrency markets](https://arxiv.org/abs/2506.08573)  
  Funding 設計を理論モデルとして扱う最新研究。
- [BIS Working Paper 1087: Crypto carry](https://www.bis.org/publ/work1087.htm)  
  基差・キャリーの実証分布と tail 特性の検証。
- [Deribit API: public/get_funding_rate_history](https://docs.deribit.com/api-reference/market-data/public-get_funding_rate_history)  
  モデル校正に使う Funding 時系列データ取得。

### 9.5 第5章「清算リスクと生存確率」

- [Black and Cox (1976): A first-passage model for default risk](https://doi.org/10.1111/j.1540-6261.1976.tb01891.x)  
  境界到達時刻で破綻を扱う first-passage の古典。
- [Herrmann and Tanré (2015): First-passage time of Brownian motion to a boundary](https://arxiv.org/abs/1501.07060)  
  到達時刻分布の数値的取り扱いを補強。
- [Deribit: Liquidations](https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations)  
  取引所実装での清算トリガー仕様。
- [Bybit: Liquidation Price (USDT Contract)](https://www.bybit.com/en/help-center/article/Liquidation-Price-USDT-Contract)  
  レバレッジと清算価格の実務計算式。

### 9.6 第6章「離散リバランス誤差とコスト」

- [Leland (1985): Option Pricing and Replication with Transactions Costs](https://econpapers.repec.org/article/blajfinan/v_3a40_3ay_3a1985_3ai_3a5_3ap_3a1283-1301.htm)  
  離散ヘッジと取引コストを同時に扱う古典。
- [Boyle and Vorst (1992): Option replication in discrete time with transaction costs](https://doi.org/10.1111/j.1540-6261.1992.tb03986.x)  
  離散時間複製での取引コスト影響を明示。
- [Whalley and Wilmott (1997): Asymptotic analysis of optimal hedging with transaction costs](https://doi.org/10.1111/1467-9965.00034)  
  no-trade band による実装可能な近似最適化。

### 9.7 第7章「オプション型デルタニュートラル」

- [Merton (1973)](https://doi.org/10.2307/3003143)  
  動的ヘッジの理論基盤。
- [John C. Hull: Options, Futures, and Other Derivatives (Slides)](https://www-2.rotman.utoronto.ca/~hull/ofodslides/index.html)  
  ガンマ・ベガを含む実務的 Greek 管理の復習資料。
- [Carr-Madan公式の導出と証明、数値実装（本サイト）](https://tech-yusuke.com/articles/carr_madan_formula)  
  特性関数法に接続するオプション実装面の補助資料。

### 9.8 第8章「まとめ（戦略全体の再整理）」

- [Ackerer et al. (2023/2024): Perpetual Futures Pricing](https://arxiv.org/abs/2310.11771)  
  Perp 価格付けの理論骨格。
- [Kim, Park (2025): Designing funding rates for perpetual futures in cryptocurrency markets](https://arxiv.org/abs/2506.08573)  
  Funding 過程を設計変数として扱う視点。
- [Black and Cox (1976): A first-passage model for default risk](https://doi.org/10.1111/j.1540-6261.1976.tb01891.x)  
  生存制約を持つ設計問題の基礎理論。
