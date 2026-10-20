---
title: 'WikiSkill論文解説：経験を残し、Skillの変更だけを戻せる設計'
description: 'Google Researchの研究者らによるWikiSkill論文をもとに、Raw・Wiki・Skillsの3層と検証によるSkill更新の採否を解説する'
emoji: '🧠'
date: 2026-08-31
topics: ["ai-agent", "agent-skills", "llm", "machine-learning"]
blog_published: True
published: False
---

## はじめに

たとえば、CodexやClaude Code向けの`SKILL.md`を継続的に直していると、ある失敗を防ぐために追加した手順が、別の作業を妨げることがあります。その変更を戻しても、失敗の内容や修正案がうまくいかなかった理由は、次の改善に活かしたいところです。

Skillの改善を繰り返すには、実行手順を更新するだけでなく、過去の成功や失敗から得た知見を整理し、次の改善で参照できるようにする必要があります。

Google Researchの研究者らは2026年8月27日、arXiv v1論文 **WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution** を公開しました。この論文は、実行経験と実行可能なSkillの間に永続的なWiki Layerを置く構成を提案しています。

- Liyan Tang et al., *WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution* (2026)
  https://arxiv.org/html/2608.27454v1

設計の核は、実行記録、経験から得た知識、実行用の手順を分け、Skillの変更を取り消しても、Wikiに知識と評価履歴を残すことです。

以下では、まず論文の仕組みと実験結果を整理し、その後でリポジトリ運用への応用を考えます。著者らの仮説と筆者の考察は、実験で確認された結果と分けて説明します。

## 1. Skill改善の知見は次の改善で再利用しにくい

ここでいうSkill evolutionは、タスクの実行結果をもとにSkillを反復的に作成・修正することです。モデルの重みを更新する学習とは異なります。既存手法にも基本的な流れはあります。学習用タスクを実行し、成功・失敗した実行軌跡（trajectory）を分析したうえでSkillを更新し、検証用データ（validation split）で評価します。ここでいう実行軌跡とは、タスク実行中の観測・行動・出力を含む実行過程です。WikiSkillが問題としているのは、その改善を導いた知見が最適化履歴などに散らばり、独立した知識表現として蓄積されないことです。

Skillは、Agentが実行時に読む手続き的知識です。短く実行しやすいことが望まれる一方、そこへ次の情報をすべて詰め込むと役割が混ざります。

- どのタスクで何が起きたかという生の履歴
- 複数の履歴から見つかった失敗パターンや成功戦略
- 過去に試したSkill変更と、その評価結果
- Agentが次のタスクで実行すべき具体的な手順

WikiSkillは、これらの役割をRaw、Wiki、Skillsの3層へ分け、Skillの改善で得た知見を次の反復へ引き継ぎます。

## 2. WikiSkillの要点：Raw / Wiki / Skillsの3層

3層は単なる保存先の違いではありません。それぞれが「証拠」「蓄積された知識」「実行可能な手続き」という異なる役割を持ちます。

| Layer | 役割と更新方法 |
| --- | --- |
| Raw Layer (`raw/`) | 実行軌跡を証拠として保存し、後から書き換えない（immutable） |
| Wiki Layer (`wiki/`) | 失敗・成功パターン、回避策、変更履歴を反復をまたいで蓄積する（persistent） |
| Skills Layer (`skills/`) | Inference Agentが使う手続き的知識。検証で採否を決め、ロールバックできる |

### Raw Layer：実行経験を不変の証拠として残す

Raw Layerには、各反復の学習例から得た実行軌跡（execution trace）を保存します。これは、Agentが実行中に残した一連の記録です。論文の実験設定では、推論過程（reasoning）、ツール呼び出し、その出力、最終回答を含む段階的なやり取りが対象です。

この層に保存した記録は書き換えません（immutable）。後から知識の整理方法やSkillが変わっても、元の実行で何が起きたかは上書きされません。Wiki MaintainerとSkill Proposerは、このRaw Layerを分析に利用できます。

### Wiki Layer：経験を再利用できる知識へ整理する

Wiki Layerでは、生の実行軌跡を複数の実行にまたがる知識へまとめます。対象は、繰り返し見つかった失敗パターン（failure mode）、成功戦略（successful strategy）、実行可能な回避策（actionable workaround）です。

Wiki Layerの主な構成要素は、次の4つです。

- `wiki/patterns/`: 個別のパターンページ
- `index.md`: 現在のパターンを探すための索引
- `logs.md`: 反復ごとの発見を残す進化ログ
- `skill-impact.md`: Skill変更と検証結果の履歴

`skill-impact.md`には、提案のメタデータ、対象Skill、unified diff形式の変更差分、検証スコア、採否が記録されます。次のSkill Proposerは、この履歴から過去に何を試し、どう評価されたかを確認できます。Wikiは反復ごとに初期化されず、継続して蓄積されます。

### Skills Layer：Inference Agentが実行する手続きを置く

Skills Layerには、現在有効な手続き的知識（procedural knowledge）を置きます。論文のWikiSkillでは、各Skillディレクトリが次の2ファイルを持ちます。

- `SKILL.md`: Skillの手続き本体
- `PURPOSE.md`: Skillの作成・変更を動機づけたWikiパターンとの対応

Raw Layerが「何が起きたか」、Wiki Layerが「そこから何を学んだか」を担当するのに対し、Skills Layerは「次の実行で何をさせるか」を担当します。証拠と解釈と手続きを分けるため、Skillの変更だけを戻せます。

## 3. タスクの実行から更新案の採否判定まで

1回の反復は、タスク実行役（Inference Agent）、知識整理役（Wiki Maintainer）、更新提案役（Skill Proposer）、採否判定（Gating & Rollback）の順に進みます。

[![WikiSkillにおけるRaw・Wiki・Skillsの3層と、学習から検証を経てActive Skillsを更新またはロールバックする流れ](/images/wikiskill/wikiskill-evolution-loop.png)](/images/wikiskill/wikiskill-evolution-loop.png)

*図：論文のFigure 2とSection 3をもとに、知識を残す範囲と変更を戻す範囲が分かるよう筆者が再構成。画像を開くと原寸で確認できます。*

図は上段を左から右へ、下段を右から左へ読みます。タスクの実行記録からWikiを更新し、その知識をもとにSkillの更新案を作って検証します。以下で各役割と採否の条件を見ていきます。

### Step 1：Inference Agentが学習用タスクを実行する

Inference Agentは、現在有効なSkill群（active skills）の全文をプロンプトとして受け取り、学習用タスクを実行します。論文のデフォルト構成では、Inference AgentからWiki Layerへのアクセスは禁止されています。ここで得られた実行軌跡がRaw Layerへ保存されます。

### Step 2：Wiki Maintainerがパターンを統合する

Wiki Maintainerは、既存Wikiに加え、成功例・失敗例から抽出した実行軌跡を読みます。失敗したタスクの根本原因を分析し、成功したタスクから有効な戦略を取り出します。その結果を使って、`wiki/patterns/`、`index.md`、`logs.md`を差分更新します。

論文の実装では、コンテキストウィンドウを考慮し、1回の反復につき最大8件の実行軌跡をサンプリングしています。この上限は論文の実装条件であり、Wiki Layerの概念上の必須条件ではありません。

### Step 3：Skill Proposerが1つのSkillだけを変更する

Skill Proposerは、Wikiの索引、`skill-impact.md`、学習用タスク全体の成否要約を受け取ります。必要なパターンページや実行軌跡は、`read_file`で選んで調べます。

Skill Proposerが1回の反復で生成するのは、一つのSkillだけを作成・修正する提案（atomic proposal）です。新しいSkillを一つ作るか、既存のSkill一つに小さな差分（incremental patch）を適用します。複数のSkillを一度に変更しないため、検証結果と変更内容を対応付けやすい設計です。

### Step 4：Validation Gateが採否を決める

更新案を適用したSkill群を、検証用データで評価します。採用条件は、検証スコアが従来の最高値を**上回ること**です。同点では採用されません。

- 改善した場合：候補を新しい有効なSkill群として採用する
- 改善しない場合：直前の成功したSkill群へロールバックする

採否にかかわらず、提案内容、変更差分、スコア、結果は`skill-impact.md`へ追記されます。Skillを元に戻しても、Wikiに蓄積したパターンや評価履歴は残ります。次のSkill Proposerは、不採用になった変更案を確認し、同じ変更を繰り返さないための判断材料にできます。

`PURPOSE.md`は、Skillの作成・変更の根拠となったWikiパターンを示します。これと`skill-impact.md`を合わせると、変更の理由と評価結果を追跡できます。

### 学習用・検証用・テスト用データの役割

3つのデータ分割（split）は用途が異なります。

- training split（学習用）: 実行軌跡を集め、WikiとSkillの提案を発展させる
- validation split（採否判定用）: 候補のSkillを採用するか決める
- test split（最終評価用）: Skillの改善プロセス終了後、未見のタスクで最終性能を測る

テスト用データはSkill更新の採否には使われません。論文は学習用・検証用・テスト用のデータを分け、テスト用データで測った最終性能を報告しています。

### GitとCIでたとえると

リポジトリ運用へ置き換えると、採用しなかった変更ブランチでも、変更理由やテスト結果は次の修正に活かせます。WikiSkillでも、不採用になったSkillの作成・変更は元に戻しますが、変更理由と評価履歴はWikiに残し、次の提案へ引き継ぎます。この点が、変更を元に戻すだけの運用との違いです。

## 4. なぜInference AgentにWikiを直接読ませないのか

WikiSkillのWikiは、Inference Agentがタスク実行中に常時参照する長期記憶ではありません。デフォルト構成では、WikiをSkill改善側へ渡し、タスク実行側にはSkillsだけを渡します。

論文のTable 3は、Wikiを参照できる役割を変えて影響を比べた実験（アブレーション）です。Gemini-3.5-Flashを使い、LiveMath、SealQA、SpreadsheetBench、OfficeQAの4ベンチマークで評価しています。Inference AgentにWikiを与えず、Skill ProposerにWikiを与えるデフォルト構成の平均は63.7でした。両方へWikiを与えた構成は60.9で、デフォルトより2.8ポイント低い結果です。

また、Inference AgentがWikiを読まない条件では、Skill ProposerにWikiを与えない構成が48.7、与える構成が63.7で、15.0ポイントの差がありました。Wikiを与えない構成ではWiki Maintainerも除外しているため、この比較は知識を蓄積する仕組み全体の有無を含みます。最高値だったのは、Skill ProposerがWikiを参照し、Inference Agentは参照しない構成です。

著者らは、タスク実行役がWikiから必要な知識を直接得ると、Skillの弱点が実行軌跡に現れにくくなり、改善に使える情報が減るのではないかと推測しています。ただし、実験で確認されたのは性能差であり、この因果関係自体は検証されていません。

## 5. 評価した5モデルでは平均スコアが最高だが、全条件では改善していない

論文は、性質の異なる5つのベンチマークを使っています。

| ベンチマーク | 評価対象 |
| --- | --- |
| LiveMath | 数学的推論 |
| SealQA | Web検索を伴う情報検索 |
| SpreadsheetBench | コード実行を伴う表計算操作 |
| OfficeQA | 長い文書を対象とする質問応答 |
| ALFWorld | テキスト環境での複数段階の操作 |

評価したモデルは、Qwen-3.5-4B、Qwen-3.5-9B-Instruct、Qwen-3.6-27B、Gemma-4-31B-It、Gemini-3.5-Flashです。比較の基準は、Skillを与えない条件（No skill）です。これと既存手法のTrace2Skill、EvoSkill、SkillOpt、提案手法のWikiSkillを比較しています。以下では、同じモデル・同じベンチマーク内でのスコア差を見ます。

すべてのSkill改善手法は、Skillが1つもない状態から開始しています。Table 1の値は、進化プロセス全体を3回独立して実行し、テスト用データで測った性能の平均です。

表中の最上位手法を判定するため、test splitのタスクを復元抽出するpaired bootstrap testを1,000回実施しています。判定基準は`p < 0.05`です。

### 代表的な改善と、改善しなかった例

Table 1では、WikiSkillは5モデルのいずれでも、5ベンチマーク平均で最高値を記録しています。ただし、すべてのモデルとベンチマークの組み合わせでNo skillを上回ったわけではありません。

- Gemini-3.5-Flash × LiveMath: No skill 33.0、WikiSkill 72.6、**+39.6ポイント**
- Qwen-3.6-27B × SpreadsheetBench: No skill 40.8、WikiSkill 81.7、**+40.9ポイント**
- Qwen-3.5-4B × OfficeQA: No skill 30.2、WikiSkill 28.5、**-1.7ポイント**

ここで示した差の単位は、Table 1のスコア差を表すポイントです。相対的なパーセント改善率ではありません。

## 6. 評価した3つのQwenモデルでは、大きいモデルほど改善幅も大きかった

Qwen系列では、モデル規模が大きいほどWikiSkillによる5ベンチマーク平均の改善幅が大きくなりました。

| モデル | No skill | WikiSkill | 差分 |
| --- | ---: | ---: | ---: |
| Qwen-3.5-4B | 26.2 | 38.5 | +12.3ポイント |
| Qwen-3.5-9B | 29.9 | 47.4 | +17.5ポイント |
| Qwen-3.6-27B | 39.4 | 63.3 | +23.9ポイント |

この3モデルと5ベンチマークの範囲では、平均改善幅がモデル規模とともに増えています。また、WikiSkillを使うQwen-3.5-9Bの平均47.4は、No skillのQwen-3.6-27Bの39.4を8.0ポイント上回りました。

著者らは、モデル自体の能力と、経験をもとに改善した手続き的知識が互いを補うと解釈しています。そのため、高性能なモデルほどSkillから得る恩恵も大きくなる可能性があると述べています。

ただし、この結果から一般に「小型モデルとSkillの組み合わせが大型モデルより優れる」とは言えません。対象となったQwenモデル、WikiSkillで進化させたSkill、5ベンチマークの評価条件に限った比較です。

## 7. モデル間のSkill転移は転移元によって性能が下がる場合もある

Table 2では、ある転移元モデルを使ってWikiSkillで進化させたSkillを、別の推論モデルへ与えています。その結果、別のモデルで進化させたSkillがNo skillだけでなく、推論モデル自身が進化させたSkillを上回る例も確認されました。

推論モデルがQwen-3.5-9B、ベンチマークがALFWorldの場合、Qwen-3.6-27Bを転移元とするSkillで70.2を記録しました。Qwen-3.5-9B自身が進化させたSkillは63.4であり、別モデル由来のSkillが6.8ポイント上回っています。No skillは34.7でした。

一方、転移は常に有効ではありません。推論モデルをGemini-3.5-FlashとしたSpreadsheetBenchでは、No skillが50.5、Qwen-3.5-4B由来のSkillが18.1で、32.4ポイント低下しました。同じ推論モデルでも、Qwen-3.6-27B由来のSkillは63.4でした。

著者らの分析では、Qwen-3.5-4B由来のSkillに含まれる局所的な回避策が、高性能なモデルによる一連の処理を完結させるスクリプトの利用を妨げていました。また、断片的な診断手順が余分なツール呼び出しを生み、タスクを完了する前に呼び出し回数の上限に達する場合があったと説明しています。

この結果から著者らは、「経験から有用な手続きを発見・設計する能力」と「与えられた手続きを正しく実行する能力」を分けて考えています。Skillの有用性は、転移元がどのような手順を作るかと、受け取るモデルがそれを実行できるかの両方に左右されるという見方です。

## 8. 実務へ置き換えると何が変わるか

ここからは、WikiSkillから着想した実運用への適用案です。Codex、Claude Code、Cursorなどを使うリポジトリへ取り入れる場合、ディレクトリを3つ作るだけでは足りません。まず必要なのは、次の5つの運用ルールです。

1. Rawを後から都合よく書き換えない
2. Wikiのパターンに根拠となる実行履歴を結び付ける
3. Skill変更を独立した検証で評価する
4. 不採用の提案も検索できる形で残す
5. 最終評価の結果を提案の採否へ流用しない

これらの条件をファイル構成へ落とすなら、たとえば次のように役割を分けられます。

```text
raw/
  runs/<run-id>/
    tool-calls.jsonl
    outputs/
    result.json
wiki/
  index.md
  logs.md
  skill-impact.md
  patterns/
    flaky-browser-startup.md
    migration-ordering.md
skills/
  deploy-check/
    SKILL.md
    PURPOSE.md
```

この例では、`raw/`に実行環境側で記録・確認できるツール呼び出し、その出力、エラー、最終結果、評価結果を置きます。`wiki/patterns/`には複数の実行で再発した失敗パターンや成功条件を、`wiki/skill-impact.md`にはSkillの変更内容、評価条件、スコア、採否を残します。`skills/`に置くのは、Agentへ実行させる短く具体的な手続きです。

保存期間やアクセス権も、層ごとに変えられます。Rawには大きなログや機密情報が含まれ得るため、短い保存期間（retention）と厳しいアクセス制御が必要かもしれません。Wikiには機密情報を除去・加工した再利用可能な知識を残し、SkillsにはAgentが安全に実行できる手続きだけを置くという分離が考えられます。

論文のRaw Layerには推論過程（reasoning）も含まれます。しかし、商用Agentで内部の推論過程を取得・保存できるとは限りません。実運用では、実行環境側で記録・確認できるツール呼び出し、その出力、エラー、最終結果、人によるフィードバック、自動評価を証拠として利用する可能性があります。

ファイル名そのものより、情報の寿命と更新権限の分離が設計の要点です。

## 9. 評価されていない範囲と設計上の制約

WikiSkillには、論文自身が挙げている制約があります。

### Skillの検索・起動を評価していない

論文ではSkill品質の評価に集中するため、有効なSkill群の全内容をInference Agentのプロンプトへ直接挿入しています。Skillを検索して選ぶ仕組み（retrieval）や、適切なタイミングで起動する仕組み（triggering）は評価していません。

したがって、Skillが多数ある環境でも同じ効果が得られるとは断定できません。Skillライブラリが増えたときの選択精度やコンテキスト使用量は、別の評価課題です。

### 性能を維持するだけの提案は採用できない

検証スコアが従来の最高値を上回る場合だけ採用するため、その反復ではスコアを維持するだけの提案（neutral proposal）も不採用になります。将来の改善の土台になる変更でも、直後に性能を上げなければ残せない可能性があります。

### Wikiを自動的に整理・削除しない

Wikiはパターンページ、進化ログ、提案の変更差分を蓄積し続けますが、古い知識や重複を自動的に整理・削除（prune）する仕組みはありません。長期運用時のWikiの拡張性は確認されていません。

### 数百ステップ、数時間に及ぶタスクを扱っていない

OfficeQAには長いコンテキストでの推論や複数段階のツール操作が含まれますが、数百回の操作を要するタスクや、数時間にわたるタスクは評価対象外です。1回の長い実行中にSkillをオンライン更新する方法も、今後の課題とされています。

### 検証用データが少ないと、採否が評価のばらつきに左右される

検証用データが比較的小さいため、提案の採否が評価のばらつきに左右される可能性があると著者らは述べています。この変動を考慮し、論文では改善プロセス全体を独立に3回実行し、各回のテスト性能の平均を報告しています。

以上の制約があるため、WikiSkillがCodexやClaude Codeの本番リポジトリでも同程度の改善をもたらすとは断定できません。

## 10. まとめ

WikiSkillの価値は、単にベンチマークスコアが高かったことだけではありません。実行経験、経験から整理した知識、Agentが実行する手続きに、それぞれ異なるライフサイクルを与えた点にあります。

- Raw Layerは、書き換えない証拠として残す
- Wiki Layerは、反復をまたいで知識と変更履歴を蓄積する
- Skills Layerは、検証を通過した手続きだけを有効にする
- Skillをロールバックしても、その変更から得た知識はロールバックしない

論文では、5つのベンチマークと5つのモデルの範囲で、WikiSkillが既存のSkill改善手法を平均性能で上回ったと報告されています。また、多くのモデルとベンチマークの組み合わせでNo skillを上回りました。一方、改善しない組み合わせ、モデル間転移で性能が下がる組み合わせ、Skillの検索や長期運用を評価していない制約もあります。

WikiSkillが投げかける問いは、「エージェントに何を覚えさせるべきか」だけではありません。

**経験そのもの、経験から得た知識、実際に実行させる手続きを、同じ寿命・同じ更新ルールで管理してよいのか。**

Skillを改善し続ける仕組みを設計するなら、何を永続化し、何を検証で選別し、何をロールバックできるようにするかまで考える必要があります。

## 参考文献

1. Liyan Tang, Cyrus Rashtchian, Chun-Sung Ferng, Andrew Tomkins, Da-Cheng Juan, Tu Vu, *WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution*, arXiv:2608.27454v1, 2026.
   https://arxiv.org/html/2608.27454v1
