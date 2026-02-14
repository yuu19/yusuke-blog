---
title: 'Terraformの開発環境を整える'
description: 'Terraformの開発環境にLinterやFormatterを導入し、快適に開発できるようにしました'
emoji: '🏗️'
date: 2025-03-10
topics: ["terraform"]
blog_published: True
published: False
---



gitでコミット(commit)前にterraform fmtやtflintを実行したい時はpre-commit-terraformが便利
https://dev.classmethod.jp/articles/pre-commit-terraform-introduction/



## シークレットの管理
`.env` などに AWS のシークレット情報を記載する場合、誤って機密情報を公開しないよう対策を講じることが重要です。  
`git-secrets` を使用すると、コミット時に機密情報が含まれていないかを自動チェックし、誤った公開を防ぐことができます。  

## **git-secrets の導入と設定**

### **1. git-secrets のインストール**
まず、`git-secrets` をインストールします。


#### **Linux (手動インストール)**
```sh
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install
```

### **2. プロジェクトに git-secrets を適用**
リポジトリのプロジェクトルートで以下のコマンドを実行し、`git-secrets` をセットアップします。

```sh
git secrets --install
git secrets --register-aws
```

この設定により、AWS のアクセスキーやシークレットキーが誤って含まれていないかをチェックできるようになります。

### **3. コミット前にチェックを強制**
コミット前に `git-secrets` を実行するように `pre-commit` フックを設定します。

```sh
git secrets --install ~/.git-templates/git-secrets
git config --global init.templateDir ~/.git-templates/git-secrets
```

### **4. カスタムパターンの追加 (任意)**
AWS のシークレットキー以外にも `.env` ファイルのパターンなどを追加することで、より強力なセキュリティ対策が可能です。

```sh
git secrets --add 'API_KEY=[A-Za-z0-9]+'
git secrets --add 'SECRET_KEY=[A-Za-z0-9]+'
```

### **5. コミット前のチェック**
リポジトリ内に機密情報が含まれていないかを手動でチェックする場合、以下のコマンドを実行します。

```sh
git secrets --scan
```

---

これで `git-secrets` を活用し、誤って機密情報を公開してしまうリスクを軽減できます。  
Terraform の開発環境をより安全に保つために、必ず適用することをおすすめします。


参考: [git-secrets を使用して Git リポジトリに機密情報やセキュリティ上の問題がないかスキャンする](https://docs.aws.amazon.com/ja_jp/prescriptive-guidance/latest/patterns/scan-git-repositories-for-sensitive-information-and-security-issues-by-using-git-secrets.html)

### Secret Managerに環境変数を登録する場合
参考
 https://dev.classmethod.jp/articles/prevent-commit-using-git-secrets-and-husky/

## Linter

Terraform用のLinterであるTFLintを使用します。

#### TFLintのインストール

(Ubuntuの場合)

1.`curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash`


2.` tflint --version`としてインストールされていることを確認する

参考
- [tflintのREADME](https://github.com/terraform-linters/tflint)



#### 設定

今回はデフォルトの設定のまま動かしますが、設定を変更したい場合は設定ファイル`.tflint.hcl`に記入してください。

`.tflint.hcl`は、以下の順序で検索され、最初に見つかったファイルが使用されます。

```bash
1. --configオプションで指定されたファイル

2. TFLINT_CONFIG_FILE環境変数で指定されたファイル

3. カレントディレクトリの.tflint.hcl

4. ホームディレクトリの.tflint.hcl
```

参考: [document: Configuring TFLint](https://github.com/terraform-linters/tflint/blob/master/docs/user-guide/config.md)

以下のコマンドを実行すると

```bash
tflint
```
Linterによって、Terraformのコードをチェックできます。

参考: [tflint の仕様や使い方についてのメモ](https://zenn.dev/ta2023/articles/923ca224a69420)

### Formatter
`terraform fmt`コマンドでフォーマットできますが、Vscodeの拡張機能である[HashiCorp Terraform](https://marketplace.visualstudio.com/items?itemName=HashiCorp.terraform)を使用して
ファイルを保存したときに自動フォーマットされるようにします。

手順
1. HashiCorp TerraformをVscodeにインストール
2. 現在のプロジェクトの`.vscode/settings.json`に
   以下のように記載してください。
  
```
   {
  "editor.defaultFormatter": "hashicorp.terraform",
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file"
}
```

## ドキュメント生成

[terraform-docs](https://github.com/terraform-docs/terraform-docs)を使用することで、
Terraformで作成したリソースや入出力をまとめたドキュメントを自動生成できます。



### インストール

今回はバイナリをダウンロードする方法を取りました

```
curl -sSLo ./terraform-docs.tar.gz https://terraform-docs.io/dl/v0.19.0/terraform-docs-v0.19.0-$(uname)-amd64.tar.gz
tar -xzf terraform-docs.tar.gz
chmod +x terraform-docs
mv terraform-docs /some-dir-in-your-PATH/terraform-docs
```
参考: [Document: Installation](https://terraform-docs.io/user-guide/installation/)
### 設定
今回はデフォルトのままで使用します。terraform-docsの設定をカスタマイズしたい場合は
`terraform-docs.yml`に設定を記述してください。

参考: [Document: Configuration](https://terraform-docs.io/user-guide/configuration/)

### 実行
例
`terraform-docs markdown table  --output-file terraform.md --output-mode inj
ect .`

参考: [Docucment: Reference](https://terraform-docs.io/reference/terraform-docs/)


以下のように、ドキュメントが自動生成されていることを確認できます。
![image](https://hackmd.io/_uploads/BJY1MNsikg.png)
