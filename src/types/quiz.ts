/** 問題タイプの種別 */
export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'drag_drop'
  | 'dropdown'
  | 'single_yesno'
  | 'multi_yesno'

/** 選択肢アイテムの種別 */
export type ItemType =
  | 'choice'
  | 'drag_item'
  | 'dropdown_blank'
  | 'dropdown_option'
  | 'statement'

/** questions_sample.csv 1行分 */
export interface Question {
  id: string
  question_no: string
  type: QuestionType
  title: string
  body: string
  code_block: string
  instruction: string
  answer_count: number
  explanation: string
  shuffle_items: string // "true" | "false"
  metadata_json: string // JSON文字列
}

/** question_items_sample.csv 1行分 */
export interface QuestionItem {
  id: string
  question_id: string
  item_type: ItemType
  item_key: string
  parent_key: string
  label: string
  value: string
  sort_order: number
  correct_value: string
  correct_order: number | null
  is_correct: string // "true" | "false"
}

/** メタデータ（metadata_json をパースした結果） */
export interface QuestionMetadata {
  minSelections?: number
  maxSelections?: number
  [key: string]: unknown
}

/** 問題 + 関連アイテムを結合した型 */
export interface QuestionWithItems {
  question: Question
  items: QuestionItem[]
  metadata: QuestionMetadata
}

/** ユーザーの回答（タイプ共通） */
export interface UserAnswer {
  /** single_choice: 選択キー1つ */
  selectedKey?: string
  /** multi_choice: 選択キー配列 */
  selectedKeys?: string[]
  /** drag_drop: 並べた順序のキー配列 */
  orderedKeys?: string[]
  /** dropdown: blank_key → 選択値 */
  selections?: Record<string, string>
  /** single_yesno / multi_yesno: statement_key → はい(true)/いいえ(false) */
  answers?: Record<string, boolean>
}

/** 問題タイプの日本語ラベル */
export const questionTypeLabels: Record<QuestionType, string> = {
  single_choice: '択一選択',
  multi_choice: '複数選択',
  drag_drop: 'ドラッグアンドドロップ',
  dropdown: 'ドロップダウンリスト',
  single_yesno: '択一Yes/No',
  multi_yesno: '複数Yes/No',
}
