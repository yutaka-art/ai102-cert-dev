import { ref } from 'vue'
import Papa from 'papaparse'
import type {
  Question,
  QuestionItem,
  QuestionWithItems,
  QuestionMetadata,
} from '@/types/quiz'

/** 配列をシャッフルして新しい配列を返す */
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}

/** シャッフル後の choice アイテムに A, B, C... のラベルを振り直す */
function relabelChoiceItems(items: QuestionItem[]): QuestionItem[] {
  const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let choiceIndex = 0
  return items.map((item) => {
    if (item.item_type !== 'choice') return item
    const newLetter = LABELS[choiceIndex++] || String(choiceIndex)
    // "A. テキスト" → "B. テキスト" のようにラベル先頭のアルファベットを置換
    const newLabel = item.label.replace(/^[A-Z]\./, `${newLetter}.`)
    return {
      ...item,
      item_key: newLetter,
      value: newLetter,
      label: newLabel,
    }
  })
}

/**
 * CSV から問題データを読み込む composable
 * @param mode 'sequential' で question_no 順、'shuffle' でランダム順
 * @param from 出題開始番号 (例: 61) — 省略時は先頭から
 * @param to   出題終了番号 (例: 120) — 省略時は末尾まで
 */
export function useQuizData(
  mode: 'sequential' | 'shuffle' = 'shuffle',
  from?: number,
  to?: number,
) {
  const quizQuestions = ref<QuestionWithItems[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const loadData = async () => {
    try {
      loading.value = true
      error.value = null

      // 2つの CSV を並列取得
      const [questionsRes, itemsRes] = await Promise.all([
       fetch(import.meta.env.BASE_URL + 'questions.csv'),
       fetch(import.meta.env.BASE_URL + 'question_items.csv'),
        // fetch(import.meta.env.BASE_URL + 'questions_sample_diff_381_395.csv'),
        // fetch(import.meta.env.BASE_URL + 'question_items_sample_diff_381_395.csv'),
      ])

      const questionsCsv = await questionsRes.text()
      const itemsCsv = await itemsRes.text()

      // PapaParse でパース
      const questionsParsed = Papa.parse(questionsCsv, {
        header: true,
        skipEmptyLines: true,
      }) as { data: Question[] }
      const itemsParsed = Papa.parse(itemsCsv, {
        header: true,
        skipEmptyLines: true,
      }) as { data: QuestionItem[] }

      const questions: Question[] = questionsParsed.data.filter(
        (q: Question) => q.id && q.type
      )
      const items: QuestionItem[] = itemsParsed.data.filter(
        (i: QuestionItem) => i.id && i.question_id
      )

      // question_id で items をグループ化
      const itemsByQuestionId = new Map<string, QuestionItem[]>()
      for (const item of items) {
        const list = itemsByQuestionId.get(item.question_id) || []
        list.push({
          ...item,
          sort_order: Number(item.sort_order) || 0,
          correct_order:
            item.correct_order !== undefined && item.correct_order !== null && String(item.correct_order) !== ''
              ? Number(item.correct_order)
              : null,
          // CSV によって True/False と true/false が混在するため小文字に正規化
          is_correct: item.is_correct ? String(item.is_correct).toLowerCase() : item.is_correct,
        })
        itemsByQuestionId.set(item.question_id, list)
      }

      // questions と items を結合し QuestionWithItems[] を構築
      const allQuestions: QuestionWithItems[] = questions.map((q) => {
        let qItems = (itemsByQuestionId.get(q.id) || []).sort(
          (a, b) => a.sort_order - b.sort_order
        )

        // shuffle_items が "true" の場合、選択肢をシャッフル
        if (String(q.shuffle_items).toLowerCase() === 'true') {
          qItems = shuffleArray(qItems)
          // choice 型はシャッフル後にアルファベットラベルを振り直す
          if (q.type === 'single_choice' || q.type === 'multi_choice') {
            qItems = relabelChoiceItems(qItems)
          }
        }

        // metadata_json をパース
        let metadata: QuestionMetadata = {}
        if (q.metadata_json) {
          try {
            metadata = JSON.parse(q.metadata_json)
          } catch {
            metadata = {}
          }
        }

        return {
          question: {
            ...q,
            answer_count: Number(q.answer_count) || 0,
          },
          items: qItems,
          metadata,
        }
      })

      // question_no でソート（例: #001, #002, ...）
      let sorted = allQuestions.sort((a, b) =>
        a.question.question_no.localeCompare(b.question.question_no)
      )

      // from / to が指定されている場合、question_no の数値でフィルタリング
      if (from != null || to != null) {
        sorted = sorted.filter((q) => {
          const m = q.question.question_no.match(/\d+/)
          if (!m) return false
          const num = parseInt(m[0], 10)
          if (from != null && num < from) return false
          if (to != null && num > to) return false
          return true
        })
      }

      // モードに応じて順序を決定
      if (mode === 'shuffle') {
        quizQuestions.value = shuffleArray(sorted)
      } else {
        quizQuestions.value = sorted
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'データ読み込みに失敗しました'
    } finally {
      loading.value = false
    }
  }

  // 再読み込み
  const reload = () => {
    return loadData()
  }

  // 初期ロード
  loadData()

  return {
    quizQuestions,
    loading,
    error,
    reload,
  }
}
