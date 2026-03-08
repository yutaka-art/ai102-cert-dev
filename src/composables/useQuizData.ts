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

/**
 * CSV から問題データを読み込む composable
 * @param mode 'sequential' で question_no 順、'shuffle' でランダム順
 */
export function useQuizData(mode: 'sequential' | 'shuffle' = 'shuffle') {
  const quizQuestions = ref<QuestionWithItems[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const loadData = async () => {
    try {
      loading.value = true
      error.value = null

      // 2つの CSV を並列取得
      const [questionsRes, itemsRes] = await Promise.all([
        fetch(import.meta.env.BASE_URL + 'questions_sample.csv'),
        fetch(import.meta.env.BASE_URL + 'question_items_sample.csv'),
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
        })
        itemsByQuestionId.set(item.question_id, list)
      }

      // questions と items を結合し QuestionWithItems[] を構築
      const allQuestions: QuestionWithItems[] = questions.map((q) => {
        let qItems = (itemsByQuestionId.get(q.id) || []).sort(
          (a, b) => a.sort_order - b.sort_order
        )

        // shuffle_items が "true" の場合、選択肢をシャッフル
        if (q.shuffle_items === 'true') {
          qItems = shuffleArray(qItems)
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

      // モードに応じて順序を決定
      if (mode === 'shuffle') {
        quizQuestions.value = shuffleArray(allQuestions)
      } else {
        // question_no でソート（例: #001, #002, ...）
        quizQuestions.value = allQuestions.sort((a, b) =>
          a.question.question_no.localeCompare(b.question.question_no)
        )
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
