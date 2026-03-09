# AI-102 Certification Practice Quiz

Microsoft Azure AI Engineer Associate (AI-102) 試験対策用のインタラクティブなクイズ Web アプリケーションです。

**デモサイト:** https://yutaka-art.github.io/ai102-cert-dev/

## 機能

- **2つの出題モード** — 順番通り (Sequential) / ランダム (Shuffle)
- **6種類の問題形式** — 択一選択・複数選択・ドラッグ&ドロップ・ドロップダウン・Yes/No (単一)・Yes/No (複数)
- **即時フィードバック** — 回答後に正誤と正解・解説を表示
- **選択肢シャッフル** — choice 形式はランダム並び替え後にラベル (A, B, C…) を振り直し
- **コードブロック表示** — 問題文中のコードスニペットとインラインドロップダウンに対応
- **結果画面** — スコア・正答率・問題ごとの正誤一覧を表示

## 技術スタック

| カテゴリ | ライブラリ |
|---|---|
| フレームワーク | Vue 3 + Vue Router 4 |
| 言語 | TypeScript |
| ビルドツール | Vite 6 |
| CSV パーサー | PapaParse |
| D&D | vuedraggable |
| デプロイ | GitHub Pages (GitHub Actions) |

## プロジェクト構成

```
src/
├── components/
│   ├── OpeningPage.vue          # タイトル画面・モード選択
│   ├── QuestionQuiz.vue         # クイズ本体（進捗・ナビゲーション・結果）
│   └── questions/               # 問題タイプ別コンポーネント
│       ├── SingleChoice.vue
│       ├── MultiChoice.vue
│       ├── DragDrop.vue
│       ├── DropdownSelect.vue
│       ├── SingleYesNo.vue
│       └── MultiYesNo.vue
├── composables/
│   ├── useQuizData.ts           # CSV 読み込み・データ結合・シャッフル
│   └── useAnswerChecker.ts      # 問題タイプ別の正誤判定
├── types/
│   └── quiz.ts                  # 型定義
public/
├── questions_sample.csv         # 問題データ
└── question_items_sample.csv    # 選択肢データ
```

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## デプロイ

`main` ブランチへの push 時に GitHub Actions が自動でビルド・デプロイを実行します。

手動デプロイ:

```bash
npm run deploy
```

## データ形式

問題データは `public/` 配下の CSV ファイルで管理します。

**questions_sample.csv** — 問題定義

| カラム | 説明 |
|---|---|
| id | 問題 ID (例: q001) |
| question_no | 表示番号 (例: #001) |
| type | 問題タイプ (single_choice, multi_choice, drag_drop, dropdown, single_yesno, multi_yesno) |
| title | 問題タイトル |
| body | 問題文 |
| code_block | コードブロック (任意) |
| instruction | 操作指示 |
| answer_count | 正解数 |
| explanation | 解説 |
| shuffle_items | 選択肢シャッフル (true/false) |
| metadata_json | メタデータ JSON |

**question_items_sample.csv** — 選択肢・項目定義

| カラム | 説明 |
|---|---|
| id | 項目 ID |
| question_id | 紐づく問題 ID |
| item_type | 項目種別 (choice, drag_item, dropdown_blank, dropdown_option, statement) |
| item_key | 項目キー |
| label | 表示ラベル |
| value | 値 |
| sort_order | 表示順 |
| correct_value | 正解値 (dropdown 用) |
| correct_order | 正解順序 (drag_drop 用) |
| is_correct | 正解フラグ (true/false) |

## ライセンス

Private
