---
title: 'UMVUEに関する演習問題'
description: 'Katexがブログ上で使えることの確認も兼ねて、学生時代に解いた演習問題を記載する'
date: 2024-08-19
topics: ["statistics"]
blog_published: True
published: False
---

## **問題1**

**問題**
$X$: 3-class categorical variable  
$X_1, X_2, \cdots, X_n$は$X$と同分布に従う、独立な確率変数としてパラメータ$p = (p_1, p_2)$のFisher情報量行列$I(p_1, p_2)$を求めよ。

**解答**

$\mathbf{X} = (X_1, X_2, \cdots, X_n)$について、  
$(X_1 = x_1, X_2 = x_2, \cdots, X_n = x_n)$としたときの尤度関数$L(x_1, x_2,  \cdots, x_n |\, p_1, p_2)$は

$$
L(x_1, x_2, \cdots, x_n |\, p_1, p_2) = p_1^{n_1} p_2^{n_2} (1 - p_1 - p_2)^{n - n_1 - n_2}
$$

と表される。($n_1$, $n_2$はそれぞれ、KenとTomが出る回数を表す。)

対数をとって、

$$
\log{L}(x_1, x_2, \cdots, x_n) = n_1 \log{p_1} + n_2 \log{p_2} + (n - n_1 - n_2) \log{(1 - p_1 - p_2)}
$$

$p_1$, $p_2$に関する対数尤度関数の微分をそれぞれ計算すると、

$$
\frac{\partial \log{L}}{\partial p_1} = \frac{n_1}{p_1} - \frac{(n - n_1 - n_2)}{(1 - p_1 - p_2)} \quad \frac{\partial \log{L}}{\partial p_2} = \frac{n_2}{p_2} - \frac{(n - n_1 - n_2)}{(1 - p_1 - p_2)}
$$

$$
\frac{\partial^2 \log{L}}{\partial p_1^2} = \frac{-n_1}{p_1^2} - \frac{(n - n_1 - n_2)}{(1 - p_1 - p_2)^2} \quad \frac{\partial^2 \log{L}}{\partial p_2^2} = \frac{- n_2}{p_2^2} - \frac{(n - n_1 - n_2)}{(1 - p_1 - p_2)^2}
$$

$$
\frac{\partial^2 \log{L}}{\partial p_1 \partial p_2} = \frac{\partial^2 \log{L}}{\partial p_2 \partial p_1} =  - \frac{(n - n_1 - n_2)}{(1 - p_1 - p_2)^2}
$$

次に、$(p_1, p_2)$に関するFisher情報量行列$I(p_1, p_2)$を計算する。$I(p_1, p_2)$の$(i, j)$成分を$I_{i, j}(p_1, p_2)$成分と書くとき、  
$(N_1, N_2)$は、試行回数$n$, パラメータ$(p_1, p_2)$をもつ多項分布に従うことから、$\mathbb{E}[N_1] = n p_1$、$\mathbb{E}[N_2] = n p_2$となることに注意して、

$$
I_{1, 1}(p_1, p_2) = - \mathbb{E}\left[\frac{\partial^2 \log{L(X_1, X_2, \cdots, X_n)}}{\partial^2 p_1}\right] = - \mathbb{E}\left[\frac{- N_1}{p_1^2} - \frac{(n - N_1 - N_2)}{(1 - p_1 - p_2)^2}\right] = \frac{\mathbb{E}[N_1]}{p_1^2} + \frac{(n - \mathbb{E}[N_1] - \mathbb{E}[N_2])}{(1 - p_1 - p_2)^2} = \frac{n}{p_1} + \frac{n}{(1 - p_1 - p_2)}
$$

$$
I_{2, 2}(p_1, p_2) = \frac{n}{p_2} + \frac{n}{(1 - p_1 - p_2)}
$$

$$
I_{1, 2}(p_1, p_2) = I_{2, 1}(p_1, p_2) = -\mathbb{E}\left[- \frac{(n - N_1 - N_2)}{(1 - p_1 - p_2)^2}\right] = \frac{n}{(1 - p_1 - p_2)}
$$

したがって、

$$
I(p_1, p_2) = 
\begin{pmatrix}
    I_{1, 1}(p_1, p_2) & I_{1, 2}(p_1, p_2) \\
    I_{2, 1}(p_1, p_2) & I_{2, 2}(p_1, p_2)
\end{pmatrix}
= 
\begin{pmatrix}
    \frac{n}{p_1} + \frac{n}{(1 - p_1 - p_2)} & \frac{n}{(1 - p_1 - p_2)} \\
    \frac{n}{(1 - p_1 - p_2)} & \frac{n}{p_2} + \frac{n}{(1 - p_1 - p_2)}
\end{pmatrix} 
= 
\begin{pmatrix}
    \frac{n - n p_2}{p_1(1 - p_1 - p_2)} & \frac{n}{1 - p_1 - p_2} \\
    \frac{n}{1 - p_1 - p_2} & \frac{n - n p_1}{p_2(1 - p_1 - p_2)}
\end{pmatrix}
$$

---

## **問題2**

**問題**

推定量を$(\hat{p}_1, \hat{p}_2) = \left(\frac{N_1}{n}, \frac{N_2}{n}\right)$としたとの分散共分散行列$V$を計算し、  
UMVUとなるかどうかを示せ。

**解答**

まず、推定量$(\hat{p}_1, \hat{p}_2)$の分散共分散行列$V$を計算する。

$$
\mathbb{V}[\hat{p}_1] = \frac{1}{n^2} np_1(1-p_1) = \frac{p_1(1-p_1)}{n}
$$

$$
\mathbb{V}[\hat{p}_2] = \frac{1}{n^2} np_2(1-p_2) = \frac{p_2(1-p_2)}{n}
$$

$$
\text{Cov}(\hat{p}_1, \hat{p}_2) = \frac{1}{n^2} \text{Cov}(N_1, N_2) = \frac{1}{n^2} (-n p_1 p_2) = - \frac{p_1 p_2}{n}
$$

$$
V = 
\begin{pmatrix}     
    \frac{p_1(1-p_1)}{n} & - \frac{p_1 p_2}{n} \\
    - \frac{p_1 p_2}{n} & \frac{p_2(1-p_2)}{n}
\end{pmatrix}
$$

次に問題1で示したFisher情報量行列$I(p_1, p_2)$の逆行列を計算する。

$$
\det I(p_1, p_2) = \left(\frac{n}{p_1} + \frac{n}{(1 - p_1 - p_2)}\right) \left(\frac{n}{p_2} + \frac{n}{(1 - p_1 - p_2)}\right) - \left(\frac{n}{1 - p_1 - p_2}\right)^2 
$$

$$
= \frac{n^2}{p_1 p_2} + \frac{n^2}{p_1 (1 - p_1 - p_2)} + \frac{n^2}{p_2 (1 - p_1 - p_2)}
$$

$$
= \frac{n^2((1 - p_1 - p_2) + p_2 + p_1 )}{p_1 p_2 (1 - p_1 - p_2)} 
= \frac{n^2}{p_1 p_2 (1 - p_1 - p_2)}
$$

より、

$$
\frac{1}{\det I(p_1, p_2)} = \frac{p_1 p_2 (1 - p_1 - p_2)}{n^2}
$$

したがって、

$$
I^{-1}(p_1, p_2) = \frac{1}{\det I} 
\begin{pmatrix}
    \frac{n(1 - p_1)}{p_2(1 - p_1 - p_2)} & -\frac{n}{1 - p_1 - p_2} \\
    -\frac{n}{1 - p_1 - p_2} & \frac{n(1 - p_2)}{p_1(1 - p_1 - p_2)}
\end{pmatrix} 
= 
\begin{pmatrix}
    \frac{p_1(1 - p_1)}{n} & \frac{- p_1 p_2}{n} \\
    \frac{- p_1 p_2}{n} & \frac{p_2 (1 - p_2)}{n}
\end{pmatrix}
$$

ゆえに分散共分散行列$V$と$I^{-1}(p_1, p_2)$は一致し、  
$V$はクラメールラオの不等式の下限となる。$\hat{p}_1$と$\hat{p}_2$はともに不変推定量であることと合わせて、  
推定量$(\hat{p}_1, \hat{p}_2)$はUMVUであることが分かる。
