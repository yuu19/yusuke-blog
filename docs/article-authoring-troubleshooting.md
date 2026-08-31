# 記事作成で問題が起きたときの確認手順

最終更新日: 2026-08-31

この文書は、yusuke-blogの記事と説明図を作る担当者向けの運用ガイドです。記事作成そのものより、図の生成、文章校正、フォーマット、ビルドで問題が起きたときに参照してください。

最初に「作業前の確認」と「完了条件」を読みます。それ以降は、発生した症状の節だけを参照できます。

## 作業前に図・フォーマッター・校正環境を確認する

本文を書き始める前に、次の3点を確認します。先に確認しておくと、記事完成後に検証手段が使えないと判明する事態を避けられます。

1. `diagram-render`と`diagram-generator-html`スキルを利用できるか
2. リポジトリ設定を使ってPrettierを実行できるか
3. 指定された校正エージェントと`natural-japanese`を利用できるか

図を作る場合は、最小限のHTMLを使ってChromiumによるスモークテストを実行します。ツールの存在は、少なくとも次の2点で確認します。

```bash
command -v diagram-render
test -f /home/yusuke/.codex/skills/diagram-generator-html/SKILL.md
```

記事のフォーマット確認は、対象ファイルを限定して実行します。

```bash
pnpm exec prettier --check articles/<article>.md
```

コマンドが失敗した場合は、その時点で原因を記録します。記事作成だけを依頼された作業では、検証のために依存関係やlockfileを勝手に変更しません。

## 完了条件は生成成功と品質確認を分けて判定する

記事と図を作成できただけでは完了としません。次の状態をそれぞれ確認します。

- frontmatterとMarkdownがリポジトリの規約に合っている
- 外部リンクと画像参照先が正しい
- 論文や仕様を扱う場合は、本文と数値を一次情報へ照合している
- 説明図を論理サイズ1280×720で設計している
- PNGが2560×1440、8-bit、sRGB、RGBで出力されている
- 検証JSONに記録されたSHA-256とPNGの実データが一致する
- 図を目視し、文字切れ、重なり、不自然な折り返しがない
- `natural-japanese`の校正結果と未解消項目を記録している
- 安全なbuildまたは記事検証コマンドが成功している
- 実行できなかった検証を成功扱いにしていない

`canonical: true`は、標準のブラウザ、検証済みフォント、既定の品質検査を使って生成できたことを示します。fallbackで画像を生成できても、`canonical: false`なら標準経路の成功とは区別します。

## Chromiumで図の生成が停止したら最小HTMLでも再現するか確認する

### 症状

`diagram-render`が、描画待機からスクリーンショット取得までの間で停止する場合があります。今回のWikiSkill記事では、単純な検証用HTMLと既存の図でも同じ症状が再現しました。

### 確認できた範囲

今回の図だけに含まれるHTMLや文言が原因とは判断していません。一方で、Chromium、Playwright、描画待機処理のどこに根本原因があるかは特定できていません。

原因が未特定の段階で、Firefoxへ切り替えれば直ると一般化しないでください。Firefoxは今回の暫定回避策です。

### 切り分け手順

1. `diagram-render`とスキルの配置を確認する
2. 最小限のHTMLを標準のChromium経路で生成する
3. どの処理まで進んだかをログで確認する
4. 同じ条件で既存の図を1枚だけ生成する
5. 複数の入力で停止する場合は、記事固有の問題とツール側の問題を分けて記録する
6. 無制限に再試行せず、停止した処理と経過時間を残す

レンダラーを調査するときは、作業用コピーを一時ディレクトリへ置きます。共有ツールやリポジトリ内の実装を、その場限りの回避策で直接変更しません。

### fallbackを使う条件

標準経路を直ちに復旧できず、記事作成を継続する必要がある場合に限り、別ブラウザやローカルフォントを検討します。その場合も、次の条件を満たす必要があります。

- 待機処理に上限時間を設ける
- 元のHTMLは変更せず、一時コピー側だけを調整する
- 検証JSONを`canonical: false`にする
- フォントfallbackを許可した事実を記録する
- PNGの寸法、色形式、SHA-256を確認する
- 生成画像を目視する
- 最終報告で標準経路を使えなかった事実を伝える

## 自動検査に合格しても図は目視する

自動検査は、画像サイズやハッシュの一致を確認できます。ただし、意味の区切りに合わない改行や、情報密度による読みにくさまでは判断できません。

今回の初回画像では、一部のラベルに不自然な折り返しがありました。HTMLの文言と配置を修正し、再生成しています。

目視では次の順に確認します。

1. タイトルと主要な流れを最初に読めるか
2. 矢印の向きと本文のデータフローが一致しているか
3. ラベルが意味の途中で切れていないか
4. 注釈が本文の主張を広げていないか
5. 1280×720相当へ縮小しても文字を判別できるか

## Prettierが起動しない場合は成功扱いにしない

現在の`.prettierrc`は、`prettier-plugin-svelte`と`prettier-plugin-tailwindcss`を読み込みます。しかし、`prettier-plugin-tailwindcss`は`package.json`と`pnpm-lock.yaml`に登録されていません。そのため、リポジトリ設定を使ったPrettierの確認はプラグイン解決エラーで停止します。

記事作成だけが作業範囲の場合は、依存関係を追加せず、次を代替確認として実行します。

- frontmatterの必須項目と値を確認する
- Markdownのリンクと画像パスを確認する
- 差分の末尾空白や不正な制御文字を確認する
- 記事を処理するbuildまたは専用validationを実行する
- Prettierを実行できなかったことを最終報告に残す

恒久対応では、`prettier-plugin-tailwindcss`を開発依存へ追加するか、不要なら`.prettierrc`から参照を外します。どちらを採る場合も、記事作成とは別の変更としてlockfileを含めて検証します。

## 指定の校正エージェントを選べない場合は代替条件を記録する

今回の作業環境では、既存のcustom agent設定を実行インターフェースから直接選べませんでした。同じモデルとreasoning設定を持つ一時的な校正エージェントを使い、`natural-japanese`の校正手順を実行しています。

代替経路を使う場合は、少なくとも次を記録します。

- 使用したモデル
- reasoning設定
- 校正モード
- 校正回数
- 反映した指摘
- 意図して残した指摘と理由

直接指定できなかったcustom agentを、利用できたとは報告しません。`natural-japanese`の手順を実行できたことと、想定したエージェントを選べたことは分けて扱います。

## build成功と警告ゼロは別の状態として記録する

WikiSkill記事では、次のコマンドによるプロダクションbuildが成功しました。

```bash
PUBLIC_BASE_URL=https://tech-yusuke.com npm run build
```

ただし、次の警告が残りました。

- Browserslistデータが古い
- `PUBLIC_ADSENSE_CLIENT_ID`が未設定
- Cloudflareの`_routes.json`が除外ルールの上限を超えた
- Pagefindが404ページをHTMLとして処理できなかった

これらが今回の記事差分によって発生したとは確認していません。記事作成の範囲外であれば変更せず、buildの終了コードと警告を分けて報告します。

次回以降は既知の警告一覧と比較し、新しい警告だけを差分として扱います。既知の警告でも、件数や内容が変わった場合は再調査します。

## WikiSkill記事ではfallback図を採用して作業を完了した

対象ファイルは次のとおりです。

- 記事: [`../articles/wikiskill-persistent-knowledge-skill-evolution.md`](../articles/wikiskill-persistent-knowledge-skill-evolution.md)
- 図のHTML: [`../diagrams/wikiskill-evolution-loop.html`](../diagrams/wikiskill-evolution-loop.html)
- 図のPNG: [`../static/images/wikiskill/wikiskill-evolution-loop.png`](../static/images/wikiskill/wikiskill-evolution-loop.png)
- 検証JSON: [`../static/images/wikiskill/wikiskill-evolution-loop.json`](../static/images/wikiskill/wikiskill-evolution-loop.json)

PNGは2560×1440、8-bit、sRGB、RGBです。検証JSONとPNGのSHA-256も一致しました。目視確認後にラベルの折り返しを修正しています。

一方、検証JSONの`canonical`は`false`です。フォントfallbackも許可されています。この図は記事で利用できる品質まで検証済みですが、標準のChromium経路を復旧できたことは意味しません。

## 次回は環境のスモークテストを先に終える

次の記事作成では、次の順番で進めます。

1. 図のChromiumスモークテスト
2. Prettierの起動確認
3. 校正エージェントの指定可否確認
4. 記事本文と図の作成
5. 一次情報との照合
6. `natural-japanese`による校正
7. 図の目視確認と検証JSONの確認
8. buildと警告差分の確認

もっとも優先度が高い残課題は、Chromium経路が停止する原因の特定です。次に、Prettier設定と開発依存の不整合を解消します。解決するまでは、fallbackや代替検証を使った事実を省略せずに報告してください。

このガイドで解決しない問題は、再現条件、実行コマンド、停止位置、終了コード、生成物の検証結果を添えて、リポジトリの課題として記録します。
