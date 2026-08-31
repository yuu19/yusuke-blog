---
title: 'WikiSkill論文解説：経験を残し、Skill変更だけを戻せる設計'
description: 'Google ResearchらのWikiSkill論文をもとに、Raw・Wiki・Skillsの3層とvalidationによるSkill更新の採否を解説する'
emoji: '🧠'
date: 2026-08-31
topics: ["ai-agent", "agent-skills", "llm", "machine-learning"]
blog_published: True
published: False
---

## はじめに

CodexやClaude Code向けの`SKILL.md`を継続的に直していると、ある失敗に効いた手順が別の作業を悪化させることがあります。Skill変更は戻したい。けれども、「その失敗が起きた」「この修正案では改善しなかった」という知見まで捨てれば、後から同じ提案を繰り返しかねません。これは論文の実験結果ではなく、WikiSkillの問題設定をリポジトリ運用へ置き換えた本記事の例です。

この状況を一般化すると、難しいのはSkillの作り方だけではありません。過去の成功や失敗から得た知見が、optimization historyや実行履歴の各所に散在し、次の改善で体系的に参照しにくくなります。

Google Researchの研究者らが2026年8月27日に公開したarXiv v1論文 **WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution** は、この問題に対して、実行経験と実行可能なSkillの間に永続的なWiki Layerを置く構成を提案しています。

- Liyan Tang et al., *WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution* (2026)
  https://arxiv.org/html/2608.27454v1

設計の核は、Wikiに蓄積した知識と変更履歴を残したまま、Skill変更だけをvalidationで評価し、必要ならrollbackできることです。そのために、情報を次のように分けます。

- 実行経験は、Raw Layerへ不変の証拠として残す
- 経験から整理した知識は、Wiki Layerへiterationをまたいで蓄積する
- Inference Agentに実行させる手続きは、Skills Layerへ置く
- Skill変更はvalidationで評価し、改善しなければrollbackする
- Skill変更をrollbackしても、Wikiに蓄積した知識、変更履歴、validation結果は残す

以下では、論文で報告された結果を「論文で確認された事実」、著者らが結果に与えた因果説明や含意を「著者らの解釈・仮説」、リポジトリ運用への読み替えを「本記事としての考察」と区別して説明します。

## 1. Skill改善で失われやすいもの

既存のSkill evolution手法にも基本的な流れはあります。training taskを実行し、成功・失敗したtrajectory（タスク実行中の観測・行動・出力を含む実行過程）を分析したうえでSkillを更新し、validationで評価します。WikiSkillが問題としているのは、その改善を導いた知見がoptimization historyなどに散らばり、独立した知識表現として蓄積されないことです。

Skillは、Agentが実行時に読む手続き的知識です。短く実行しやすいことが望まれる一方、そこへ次の情報をすべて詰め込むと役割が混ざります。

- どのtaskで何が起きたかという生の履歴
- 複数の履歴から見つかったfailure modeやsuccessful strategy
- 過去に試したSkill変更と、その評価結果
- Agentが次のtaskで実行すべき具体的な手順

WikiSkillは、これらの役割をRaw、Wiki、Skillsの3層へ分けます。Skillの数が増えること自体を原因とする主張ではありません。論文が扱うのは、反復的なSkill改善で得た知見を、次のiterationへどう引き継ぐかという問題です。

## 2. WikiSkillの要点：Raw / Wiki / Skillsの3層

3層は単なる保存先の違いではありません。それぞれが「証拠」「蓄積された知識」「実行可能な手続き」という異なる役割を持ちます。

| Layer | 主な内容 | 役割 | 更新上の性質 |
| --- | --- | --- | --- |
| Raw Layer (`raw/`) | training rolloutのexecution trace | 何が起きたかを確認できる証拠 | immutable |
| Wiki Layer (`wiki/`) | failure / success pattern、workaround、変更履歴 | 経験を横断して整理した知識 | iteration間でpersistent |
| Skills Layer (`skills/`) | `SKILL.md`、`PURPOSE.md` | Inference Agentが使うprocedural knowledge | validationで採否、rollback可能 |

### Raw Layer：実行経験を不変の証拠として残す

Raw Layerには、各iterationのtraining exampleから得たexecution traceを保存します。execution traceとは、Agentが実行中に残した一連の記録です。論文の実験設定では、reasoning、tool calls、tool outputs、final answersを含むstep-by-step interactionが対象です。

この層はimmutableです。後から知識の整理方法やSkillが変わっても、元の実行で何が起きたかを上書きしません。Wiki MaintainerとSkill Proposerは、このRaw Layerを分析に利用できます。

### Wiki Layer：経験を再利用できる知識へ整理する

Wiki Layerでは、生のtraceを複数の実行にまたがる知識へまとめます。対象は、繰り返し見つかったfailure mode、successful strategy、actionable workaroundです。

論文本文では、主に次のファイルが説明されています。

- `wiki/patterns/`: 個別のpatternページ
- `index.md`: 現在のpatternを探すためのcatalog
- `logs.md`: iterationごとの発見を残すevolution log
- `skill-impact.md`: Skill変更とvalidation結果の履歴

`skill-impact.md`にはproposal metadata、対象Skill、変更のunified diff、validation score、accepted / rejectedの結果が記録されます。次のSkill Proposerは、この履歴から過去に何を試し、どう評価されたかを確認できます。Wikiはiterationごとにresetされず、継続して蓄積されます。

### Skills Layer：Inference Agentが実行する手続きを置く

Skills Layerには、現在有効なprocedural knowledgeを置きます。論文のWikiSkillでは、各Skill directoryが次の2ファイルを持ちます。

- `SKILL.md`: Skillの手続き本体
- `PURPOSE.md`: Skillの作成・変更を動機づけたWiki patternとの対応

Raw Layerが「何が起きたか」、Wiki Layerが「そこから何を学んだか」を担当するのに対し、Skills Layerは「次の実行で何をさせるか」を担当します。証拠と解釈と手続きを分けるため、Skill変更だけを安全に戻せます。

## 3. InferenceからGatingまでの進化ループ

WikiSkillの1 iterationは、Inference Agent、Wiki Maintainer、Skill Proposer、Gating & Rollbackの順に進みます。

![WikiSkillにおけるRaw・Wiki・Skillsの3層と、trainingからvalidationを経てActive Skillsを更新またはrollbackする流れ](/images/wikiskill/wikiskill-evolution-loop.png)

*図：WikiSkill論文のFigure 2とSection 3を参考に、永続化とrollbackの境界が分かるよう記事用に再構成。論文図の転載・模写ではありません。*

図の上段では、training taskの実行結果がimmutableなRaw Tracesとして残ります。Wiki Maintainerは、既存Wikiとsampled tracesからpatternを更新します。下段では、Skill ProposerがWikiと必要なRawを参照してcandidate Skillを作り、validation gateが採否を決めます。rollbackの対象はSkillsです。Rawは書き換えず、Wikiはcandidateがrejectedでも変更内容と評価結果を蓄積します。

### Step 1：Inference Agentがtraining taskを実行する

Inference Agentは、現在のactive skillsがpromptへinjectされた状態でtraining taskを実行します。論文のデフォルト構成では、Inference AgentからWiki Layerへのアクセスは禁止されています。ここで得られたtrajectoryがRaw Layerへ保存されます。

### Step 2：Wiki Maintainerがpatternを統合する

Wiki Maintainerは、既存Wikiに加え、成功例・失敗例からsampleしたraw tracesを読みます。失敗taskのroot causeを分析し、成功taskから有効なstrategyを抽出します。その結果を使って、`wiki/patterns/`、`index.md`、`logs.md`を差分更新します。

論文の実装では、context windowを考慮して1 iterationあたり最大8件のtraceをsampleしています。この上限は論文の実装条件であり、Wiki Layerの概念上の必須条件ではありません。

### Step 3：Skill Proposerがatomic proposalを作る

Skill Proposerは、Wikiのindex、`skill-impact.md`、training task全体の成否要約を受け取ります。必要なpatternページやraw traceは、`read_file`で選択して調べます。

1 iterationで生成するのは、1つのSkillだけを対象とするatomic proposalです。新しいSkillを作るか、既存Skillへincremental patchを適用します。複数のSkillを一度に変更しないため、validation結果と変更内容を対応付けやすい設計です。

### Step 4：Validation Gateが採否を決める

candidate Skill setはvalidation splitで評価されます。採用条件は、candidateのvalidation scoreがそれまでのbest scoreを**上回ること**です。同点では採用されません。

- 改善した場合：candidateを新しいactive skillsとして採用する
- 改善しない場合：直前の成功したSkill setへrollbackする

accepted / rejectedのどちらでも、proposal、diff、score、結果は`skill-impact.md`へ追記されます。つまり、実行手続きとして不採用になった変更も、改善履歴としては消えません。

### Training / Validation / Testの役割

3つのsplitは用途が異なります。

- training split: trajectoryを集め、WikiとSkill proposalを発展させる
- validation split: candidate Skillの採否を決める
- test split: evolution終了後、未見taskで最終性能を測る

test setはSkill更新の採否には使われません。論文は、training / validation / testを分けた設定で、最終test performanceを報告しています。

## 4. Wikiは残し、Skillだけを戻す

WikiSkillでは、WikiとSkillsに異なる更新規則を与えています。

candidate Skillがvalidationでbest scoreを上回らなければ、Skill変更は直前の成功状態へ戻ります。しかし、その過程で得た次の情報は残ります。

- どのfailure / success patternが観測されていたか
- どのWiki patternがSkillの作成・変更を動機づけたか
- どのSkillを対象に、どのようなdiffを提案したか
- validation scoreがどう変化したか
- proposalがaccepted / rejectedのどちらだったか

Wiki patternと`PURPOSE.md`は、Skillがどの知識を根拠にしたかを結び付けます。`skill-impact.md`はproposal、diff、score、採否を追跡します。Skillをrollbackしても、この履歴はWikiから削除されません。次のSkill Proposerは、過去に失敗した介入を確認し、同じ変更の繰り返しを避けるための判断材料にできます。

**本記事としての考察：** GitとCIにたとえると、Skills Layerは現在deploy可能な設定、validation gateはCI、candidateは変更branchに近い存在です。CIに失敗したbranchをmainへ入れなくても、失敗したtest log、review結果、変更diffまで消す必要はありません。Wiki Layerは、個々のbranchより長く残る変更理由と評価履歴に相当します。

この比喩は論文の実験結果ではありません。ただし、「失敗したSkill変更を実行手続きとして残さないこと」と「失敗から得た情報を失わないこと」を分ける設計意図を理解する助けになります。

## 5. なぜInference AgentにWikiを直接読ませないのか

WikiSkillのWikiは、Inference Agentがtask実行中に常時参照する長期記憶ではありません。デフォルト構成では、WikiをSkill改善側へ渡し、task実行側にはSkillsだけを渡します。

**論文で確認された事実：** Table 3は、Gemini-3.5-Flashを使い、LiveMath、SealQA、SpreadsheetBench、OfficeQAの4 benchmarkでWiki accessを比較したアブレーションです。Inference AgentにWikiを与えず、Skill ProposerにWikiを与えるデフォルト構成の平均は63.7でした。両方へWikiを与えた構成は60.9で、デフォルトより2.8ポイント低い結果です。

また、Inference AgentがWikiを読まない条件で比べると、Skill ProposerがWikiを利用しない構成は48.7、利用する構成は63.7で、後者のほうが15.0ポイント高い結果でした。このアブレーションでは、「Skill Proposerのpersistent Wiki利用」と「Inference AgentのWiki非利用」を組み合わせた構成が最高値です。

**著者らの仮説：** Inference AgentがSkillsとWikiの両方を読むと、task-solving knowledgeをWikiから直接得る場合があります。その結果、Skillsの弱点がtrajectoryへ現れにくくなり、Skill改善に使う情報量が落ちる可能性があると著者らは述べています。

確認されたのはTable 3の性能差です。「Wikiを直接読んだためtrajectoryの情報量が落ちた」という因果メカニズム自体は、著者らの仮説として区別する必要があります。

## 6. 5 benchmark平均では5 modelすべてで最高だが、全条件で改善したわけではない

論文は、性質の異なる5つのbenchmarkを使っています。

| Benchmark | 評価対象 |
| --- | --- |
| LiveMath | 数学的reasoning |
| SealQA | Web searchを伴う情報検索 |
| SpreadsheetBench | コード実行を伴う表計算操作 |
| OfficeQA | 長い文書を対象とするquestion answering |
| ALFWorld | text-based環境でのmulti-step action |

評価modelは、Qwen-3.5-4B、Qwen-3.5-9B-Instruct、Qwen-3.6-27B、Gemma-4-31B-It、Gemini-3.5-Flashです。比較対象はNo skill、Trace2Skill、EvoSkill、SkillOpt、WikiSkillでした。

すべてのskill-evolution methodはempty skill setから開始しています。Table 1の値は、full evolution processを3回独立に実行して得たtest performanceの平均です。

表中の最上位methodを判定するため、test splitのtaskを復元抽出するpaired bootstrap testを1,000 iterationsにわたって実施しています。判定基準は`p < 0.05`です。

### 代表的な改善と、改善しなかった例

**論文で確認された事実：** Table 1では、WikiSkillが5 modelすべてで5 benchmark平均の最高値を記録しています。ただし、すべてのmodel・benchmarkの組み合わせでNo skillを上回ったわけではありません。

- Gemini-3.5-Flash × LiveMath: No skill 33.0、WikiSkill 72.6、**+39.6ポイント**
- Qwen-3.6-27B × SpreadsheetBench: No skill 40.8、WikiSkill 81.7、**+40.9ポイント**
- Qwen-3.5-4B × OfficeQA: No skill 30.2、WikiSkill 28.5、**-1.7ポイント**

したがって、論文の結論に合わせるなら「WikiSkillはmost model-benchmark settingsでNo skillを改善した」と表現するのが正確です。「全条件で改善した」とは言えません。

ここで示した差の単位は、Table 1のscore差を表すポイントです。相対的なパーセント改善率ではありません。

## 7. 3つのQwen modelでは規模と平均改善幅が同時に増えた

Qwen familyでは、model規模が大きいほどWikiSkillによる5 benchmark平均の改善幅が大きくなりました。

| Model | No skill | WikiSkill | 差分 |
| --- | ---: | ---: | ---: |
| Qwen-3.5-4B | 26.2 | 38.5 | +12.3ポイント |
| Qwen-3.5-9B | 29.9 | 47.4 | +17.5ポイント |
| Qwen-3.6-27B | 39.4 | 63.3 | +23.9ポイント |

**論文で確認された事実：** この3 modelと5 benchmarkの範囲では、平均改善幅がmodel規模とともに増えています。また、WikiSkillを使うQwen-3.5-9Bの平均47.4は、No skillのQwen-3.6-27Bの39.4を8.0ポイント上回りました。

**著者らの解釈：** 著者らは、model capabilityとevolved procedural knowledgeが補完関係にあり、強いmodelほど有効なSkillを作成・実行して大きな価値を得られる可能性があると述べています。

ただし、この結果から一般に「小型modelとSkillの組み合わせが大型modelより優れる」とは言えません。対象となったQwen model、WikiSkillで進化させたSkill、5 benchmarkの評価条件に限った比較です。

## 8. Cross-Model Skill Transferはsourceによって性能が下がる場合もある

Table 2では、あるmodelをsourceとしてWikiSkillで進化させたSkillを、別のinference modelへ与えています。その結果、別model由来のSkillがNo skillだけでなく、self-evolved skillを上回る例が確認されました。

**論文で確認された事実：** inference modelがQwen-3.5-9B、benchmarkがALFWorldの場合、Qwen-3.6-27Bをsourceとして進化させたSkillで70.2を記録しました。Qwen-3.5-9B自身が進化させたSkillでは63.4であり、cross-model Skillはself-evolved Skillを6.8ポイント上回っています。No skillは34.7でした。

一方、転移は常に有効ではありません。Gemini-3.5-Flashをinference modelとするSpreadsheetBenchでは、No skillが50.5、Qwen-3.5-4B由来のSkillが18.1で、32.4ポイント低下しました。同じinference modelでも、Qwen-3.6-27B由来のSkillは63.4でした。

**著者らの解釈：** 著者らは、Qwen-3.5-4B由来のSkillにlow-level workaroundや断片的な診断手順が含まれていたと説明しています。それらがより強いmodelによるend-to-end scriptの利用を制約し、tool call budgetを消費したという解釈です。一般的な手続きを表すSkillと、source model固有の弱点を補うSkillでは、転移可能性が異なるという議論です。

そのうえで著者らは、「経験から有用な手続きを発見・設計する能力」と「与えられた手続きを正しく実行する能力」を分けて考えられると解釈しています。これはcross-model実験からの著者らの解釈であり、一般に確立された事実ではありません。

## 9. 実務へ置き換えると何が変わるか

ここからは、WikiSkillから着想した実運用への適用案です。Codex、Claude Code、Cursorなどを使うリポジトリへ取り入れる場合、directoryを3つ作るだけでは足りません。まず必要なのは、次の運用上の分離です。

1. Rawを後から都合よく書き換えない
2. Wikiのpatternに根拠となるrunを結び付ける
3. Skill変更を独立したvalidationで評価する
4. rejected proposalも検索できる形で残す
5. test結果をproposal採否へ流用しない

**本記事としての考察：** これらの条件をファイル構成へ落とすなら、たとえば次のように役割を分けられます。

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

この例では、`raw/`にobservableなtool calls、outputs、errors、final results、評価結果を置きます。`wiki/patterns/`は複数runで再発したfailure modeや成功条件、`wiki/skill-impact.md`はSkill変更と評価条件、score、採否を担います。`skills/`に置くのは、Agentへ実行させる短く具体的な手続きです。

保存期間やアクセス権も、層ごとに変えられます。Rawには大きなlogや機密情報が含まれ得るため、短い保存期間（retention）と厳しいaccess controlが必要かもしれません。Wikiにはsanitizedされた再利用可能な知識を残し、SkillsにはAgentが安全に実行できる手続きだけを置く、という分離が考えられます。

論文のRaw Layerにはreasoningも含まれます。しかし、商用Agentで内部reasoningを取得・保存できるとは限りません。実運用では、observableなtool calls、tool outputs、errors、final results、human feedback、automated evaluationを証拠として利用する可能性があります。ここで述べたのは、実装環境の制約を踏まえた本記事の適用案です。論文の性能結果ではありません。

ファイル名そのものより、情報の寿命と更新権限の分離が設計の要点です。

## 10. 論文からは断定できないこと

WikiSkillには、論文自身が挙げている制約があります。

### Skill retrieval / triggeringを評価していない

論文ではSkill品質の評価に集中するため、active skillsの全内容をInference Agentのpromptへ直接injectしています。Skillを検索して選ぶretrievalや、適切なタイミングで起動するtriggeringは評価していません。

したがって、Skillが多数ある環境でも同じ効果が得られるとは断定できません。Skill libraryが増えたときの選択精度やcontext使用量は、別の評価課題です。

### Neutral proposalを採用できない

validation scoreがbestを上回る場合だけ採用するため、そのiterationではscoreを維持するneutral proposalもrejectedになります。将来の改善の土台になる変更でも、直後に性能を上げなければ残せない可能性があります。

### Wikiを自動pruneしない

Wikiはpatternページ、evolution log、proposal diffを蓄積し続けますが、自動的に古い知識や重複をpruneする仕組みはありません。長期運用時のWikiの拡張性は確認されていません。

### Very long-horizon taskを扱っていない

OfficeQAのlong-context reasoningやmulti-step tool interactionは含まれますが、数百actionを要するtaskや、数時間にわたるvery long-horizon taskは評価対象外です。1回の長いexecution中にSkillをオンライン更新する方法も、今後の課題とされています。

さらに、validation splitは比較的小さく、gating decisionにnoiseが入り得ると論文は述べています。この変動を考慮し、報告値にはfull evolution processを3回独立に実行したtest performanceの平均を使っています。paired bootstrap testは、test split上でmethod間の性能差に統計的有意性があるかを判定する手続きです。いずれも、CodexやClaude Codeの本番リポジトリで同程度の改善を保証するものではありません。

## 11. まとめ

WikiSkillの価値は、単にbenchmark scoreが高かったことだけではありません。実行経験、経験から整理した知識、Agentが実行する手続きに、それぞれ異なるライフサイクルを与えた点にあります。

- Raw Layerは、書き換えない証拠として残す
- Wiki Layerは、iterationをまたいで知識と変更履歴を蓄積する
- Skills Layerは、validationを通過した手続きだけを有効にする
- Skillをrollbackしても、その変更から得た知識はrollbackしない

論文では、5 benchmark・5 modelの範囲で、WikiSkillが既存のskill-evolution methodを平均性能で上回ったと報告されています。また、most model-benchmark settingsでNo skillを改善しました。一方、改善しない組み合わせ、cross-modelで性能が下がる組み合わせ、retrievalや長期運用を評価していない制約もあります。

WikiSkillが投げかける問いは、「エージェントに何を覚えさせるべきか」だけではありません。

**経験そのもの、経験から得た知識、実際に実行させる手続きを、同じ寿命・同じ更新ルールで管理してよいのか。**

Skillを改善し続ける仕組みを設計するなら、何を永続化し、何をvalidationで選別し、何を安全にrollbackできるようにするかまで考える必要があります。

## 参考文献

1. Liyan Tang, Cyrus Rashtchian, Chun-Sung Ferng, Andrew Tomkins, Da-Cheng Juan, Tu Vu, *WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution*, arXiv:2608.27454v1, 2026.
   https://arxiv.org/html/2608.27454v1
