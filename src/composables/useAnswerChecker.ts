import type { QuestionWithItems, UserAnswer } from '@/types/quiz'

/**
 * 問題タイプに応じて正誤判定を行う composable
 */
export function useAnswerChecker() {
  /**
   * 正誤判定のメイン関数
   */
  const checkAnswer = (
    questionData: QuestionWithItems,
    userAnswer: UserAnswer
  ): boolean => {
    const type = questionData.question.type

    switch (type) {
      case 'single_choice':
        return checkSingleChoice(questionData, userAnswer)
      case 'multi_choice':
        return checkMultiChoice(questionData, userAnswer)
      case 'drag_drop':
        return checkDragDrop(questionData, userAnswer)
      case 'dropdown':
        return checkDropdown(questionData, userAnswer)
      case 'single_yesno':
        return checkYesNo(questionData, userAnswer)
      case 'multi_yesno':
        return checkYesNo(questionData, userAnswer)
      default:
        return false
    }
  }

  /**
   * 正解テキストを取得する関数
   */
  const getCorrectAnswerText = (questionData: QuestionWithItems): string => {
    const type = questionData.question.type

    switch (type) {
      case 'single_choice': {
        const correct = questionData.items.find(
          (i) => i.item_type === 'choice' && i.is_correct === 'true'
        )
        return correct ? correct.label : ''
      }
      case 'multi_choice': {
        const corrects = questionData.items.filter(
          (i) => i.item_type === 'choice' && i.is_correct === 'true'
        )
        return corrects.map((c) => c.item_key).join(', ')
      }
      case 'drag_drop': {
        const correctItems = questionData.items
          .filter(
            (i) => i.item_type === 'drag_item' && i.correct_order !== null
          )
          .sort((a, b) => (a.correct_order ?? 0) - (b.correct_order ?? 0))
        return correctItems.map((i, idx) => `${idx + 1}. ${i.label}`).join('\n')
      }
      case 'dropdown': {
        const blanks = questionData.items
          .filter((i) => i.item_type === 'dropdown_blank')
          .sort((a, b) => a.sort_order - b.sort_order)
        return blanks
          .map((b) => `${b.item_key}: ${b.correct_value}`)
          .join('\n')
      }
      case 'single_yesno': {
        const statement = questionData.items.find(
          (i) => i.item_type === 'statement'
        )
        return statement
          ? statement.is_correct === 'true'
            ? 'はい'
            : 'いいえ'
          : ''
      }
      case 'multi_yesno': {
        const statements = questionData.items
          .filter((i) => i.item_type === 'statement')
          .sort((a, b) => a.sort_order - b.sort_order)
        return statements
          .map(
            (s) =>
              `${s.label}: ${s.is_correct === 'true' ? 'はい' : 'いいえ'}`
          )
          .join('\n')
      }
      default:
        return ''
    }
  }

  return { checkAnswer, getCorrectAnswerText }
}

// --- 各タイプの判定関数 ---

function checkSingleChoice(
  questionData: QuestionWithItems,
  userAnswer: UserAnswer
): boolean {
  if (!userAnswer.selectedKey) return false
  const correctItem = questionData.items.find(
    (i) => i.item_type === 'choice' && i.is_correct === 'true'
  )
  return correctItem ? correctItem.item_key === userAnswer.selectedKey : false
}

function checkMultiChoice(
  questionData: QuestionWithItems,
  userAnswer: UserAnswer
): boolean {
  if (!userAnswer.selectedKeys || userAnswer.selectedKeys.length === 0) return false
  const correctKeys = questionData.items
    .filter((i) => i.item_type === 'choice' && i.is_correct === 'true')
    .map((i) => i.item_key)
    .sort()
  const userKeys = [...userAnswer.selectedKeys].sort()
  return (
    correctKeys.length === userKeys.length &&
    correctKeys.every((k, idx) => k === userKeys[idx])
  )
}

function checkDragDrop(
  questionData: QuestionWithItems,
  userAnswer: UserAnswer
): boolean {
  if (!userAnswer.orderedKeys || userAnswer.orderedKeys.length === 0) return false
  // 正解の順序: correct_order が設定されている items を correct_order 昇順で並べたキー列
  const correctOrder = questionData.items
    .filter(
      (i) => i.item_type === 'drag_item' && i.correct_order !== null
    )
    .sort((a, b) => (a.correct_order ?? 0) - (b.correct_order ?? 0))
    .map((i) => i.item_key)

  if (userAnswer.orderedKeys.length !== correctOrder.length) return false
  return correctOrder.every((k, idx) => k === userAnswer.orderedKeys![idx])
}

function checkDropdown(
  questionData: QuestionWithItems,
  userAnswer: UserAnswer
): boolean {
  if (!userAnswer.selections) return false
  const blanks = questionData.items.filter(
    (i) => i.item_type === 'dropdown_blank'
  )
  return blanks.every(
    (blank) => userAnswer.selections![blank.item_key] === blank.correct_value
  )
}

function checkYesNo(
  questionData: QuestionWithItems,
  userAnswer: UserAnswer
): boolean {
  if (!userAnswer.answers) return false
  const statements = questionData.items.filter(
    (i) => i.item_type === 'statement'
  )
  return statements.every((s) => {
    const userVal = userAnswer.answers![s.item_key]
    if (userVal === undefined) return false
    const correctVal = s.is_correct === 'true'
    return userVal === correctVal
  })
}
