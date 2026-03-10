<template>
  <div class="quiz-container">
    <!-- ローディング -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>問題を読み込んでいます...</p>
    </div>

    <!-- エラー -->
    <div v-else-if="error" class="error-state">
      <p class="error-text">⚠ {{ error }}</p>
      <button @click="reload">再読み込み</button>
    </div>

    <!-- クイズ進行中 -->
    <div v-else-if="currentData" class="quiz-active">
      <!-- プログレスバー -->
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ totalQuestions }}</div>
      </div>

      <!-- 問題ナビゲーション -->
      <div class="question-nav">
        <button class="nav-btn" :disabled="currentIndex === 0" @click="goToPrev">
          ← 前へ
        </button>
        <button class="nav-btn" :disabled="currentIndex >= totalQuestions - 1" @click="goToNext">
          次へ →
        </button>
      </div>

      <!-- 問題ヘッダー -->
      <div class="question-header">
        <span class="question-no">{{ currentData.question.question_no }}</span>
        <span class="question-type-badge">{{ questionTypeLabel }}</span>
      </div>
      <h2 class="question-title">{{ currentData.question.title }}</h2>

      <!-- 問題本文 -->
      <div class="question-body" v-html="formattedBody"></div>

      <!-- コードブロック (dropdown以外の場合のみ) -->
      <div v-if="currentData.question.code_block && currentData.question.type !== 'dropdown'" class="code-section">
        <pre class="code-block"><code>{{ currentData.question.code_block }}</code></pre>
      </div>

      <!-- タイプ別コンポーネント -->
      <div class="answer-section" :key="currentData.question.id">
        <SingleChoice
          v-if="currentData.question.type === 'single_choice'"
          :items="choiceItems"
          :disabled="answered"
          :instruction="currentData.question.instruction"
          @update:answer="onAnswerUpdate"
        />
        <MultiChoice
          v-else-if="currentData.question.type === 'multi_choice'"
          :items="choiceItems"
          :disabled="answered"
          :instruction="currentData.question.instruction"
          :max-selections="currentData.question.answer_count"
          @update:answer="onAnswerUpdate"
        />
        <DragDrop
          v-else-if="currentData.question.type === 'drag_drop'"
          :items="currentData.items"
          :disabled="answered"
          :instruction="currentData.question.instruction"
          :metadata="currentData.metadata"
          @update:answer="onAnswerUpdate"
        />
        <DropdownSelect
          v-else-if="currentData.question.type === 'dropdown'"
          :items="currentData.items"
          :body="currentData.question.body"
          :code-block="currentData.question.code_block"
          :disabled="answered"
          :instruction="currentData.question.instruction"
          @update:answer="onAnswerUpdate"
        />
        <SingleYesNo
          v-else-if="currentData.question.type === 'single_yesno'"
          :items="currentData.items"
          :disabled="answered"
          :instruction="currentData.question.instruction"
          @update:answer="onAnswerUpdate"
        />
        <MultiYesNo
          v-else-if="currentData.question.type === 'multi_yesno'"
          :items="currentData.items"
          :disabled="answered"
          :instruction="currentData.question.instruction"
          @update:answer="onAnswerUpdate"
        />
      </div>

      <!-- 回答ボタン / 正誤表示 -->
      <div class="action-section">
        <div v-if="!answered">
          <button class="submit-btn" :disabled="!hasAnswer" @click="submitAnswer">
            回答する
          </button>
        </div>
        <div v-else class="result-section">
          <div class="result-badge" :class="{ correct: isCorrect, incorrect: !isCorrect }">
            {{ isCorrect ? '✓ 正解！' : '✗ 不正解' }}
          </div>
          <div class="correct-answer-box">
            <div class="correct-answer-label">正解:</div>
            <div class="correct-answer-text" v-html="formattedCorrectAnswer"></div>
          </div>
          <div class="explanation-box" v-if="currentData.question.explanation">
            <div class="explanation-label">解説:</div>
            <div class="explanation-text" v-html="formattedExplanation"></div>
          </div>
        </div>
        <!-- ナビゲーション + 結果ボタン -->
        <div class="bottom-nav">
          <button class="nav-btn" :disabled="currentIndex === 0" @click="goToPrev">
            ← 前へ
          </button>
          <button class="view-results-btn" @click="viewResults">
            結果を見る
          </button>
          <button class="nav-btn" :disabled="currentIndex >= totalQuestions - 1" @click="goToNext">
            次へ →
          </button>
        </div>
      </div>
    </div>

    <!-- 結果画面 -->
    <div v-else-if="showResults" class="result-screen">
      <h2 class="result-title">クイズ結果</h2>
      <div class="result-score">
        <div class="score-circle" :class="scoreClass">
          <span class="score-number">{{ correctCount }}</span>
          <span class="score-divider">/</span>
          <span class="score-total">{{ totalQuestions }}</span>
        </div>
        <div class="score-rate">正答率: {{ correctRate }}%</div>
        <div class="score-detail">回答済み: {{ answeredCount }} / {{ totalQuestions }} 問（未回答は不正解扱い）</div>
      </div>
      <div class="result-details">
        <div
          v-for="(result, idx) in questionResults"
          :key="idx"
          class="result-row"
          :class="{ 'result-correct': result.correct, 'result-wrong': !result.correct }"
        >
          <span class="result-icon">{{ result.correct ? '✓' : '✗' }}</span>
          <span class="result-no">{{ result.questionNo }}</span>
          <span class="result-type">{{ result.typeLabel }}</span>
          <span class="result-title-text">{{ result.title }}</span>
        </div>
      </div>
      <div class="result-actions">
        <button class="restart-btn" @click="restartQuiz">もう一度挑戦する</button>
        <button
          v-if="wrongCount > 0"
          class="restart-btn retry-wrong-btn"
          @click="retryWrong"
        >
          間違えた問題だけ再挑戦（{{ wrongCount }}問）
        </button>
        <router-link to="/" class="back-link">トップに戻る</router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuizData } from '@/composables/useQuizData'
import { useAnswerChecker } from '@/composables/useAnswerChecker'
import { questionTypeLabels } from '@/types/quiz'
import type { UserAnswer, QuestionWithItems } from '@/types/quiz'
import SingleChoice from './questions/SingleChoice.vue'
import MultiChoice from './questions/MultiChoice.vue'
import DragDrop from './questions/DragDrop.vue'
import DropdownSelect from './questions/DropdownSelect.vue'
import SingleYesNo from './questions/SingleYesNo.vue'
import MultiYesNo from './questions/MultiYesNo.vue'

interface QuestionResult {
  questionNo: string
  typeLabel: string
  title: string
  correct: boolean
}

/** 各問題の回答状態 */
interface AnswerState {
  answered: boolean
  isCorrect: boolean
  userAnswer: UserAnswer
}

export default defineComponent({
  name: 'QuestionQuiz',
  components: {
    SingleChoice,
    MultiChoice,
    DragDrop,
    DropdownSelect,
    SingleYesNo,
    MultiYesNo,
  },
  setup() {
    const route = useRoute()
    const quizMode = (route.query.mode as string) === 'sequential' ? 'sequential' : 'shuffle'
    const rangeFrom = route.query.from ? Number(route.query.from) : undefined
    const rangeTo = route.query.to ? Number(route.query.to) : undefined
    const quizLimit = route.query.limit ? Number(route.query.limit) : undefined
    const { quizQuestions, loading, error, reload } = useQuizData(quizMode, rangeFrom, rangeTo, quizLimit)
    const { checkAnswer, getCorrectAnswerText } = useAnswerChecker()

    const currentIndex = ref(0)
    const showResults = ref(false)
    const currentAnswer = ref<UserAnswer>({})

    // 全問の回答状態を保持する配列
    const answerStates = ref<AnswerState[]>([])

    // quizQuestions がロードされたら answerStates を初期化
    watch(
      () => quizQuestions.value.length,
      (len) => {
        if (len > 0 && answerStates.value.length === 0) {
          answerStates.value = Array.from({ length: len }, () => ({
            answered: false,
            isCorrect: false,
            userAnswer: {},
          }))
        }
      },
      { immediate: true }
    )

    // 現在の問題の回答状態
    const currentState = computed<AnswerState | null>(() => {
      if (currentIndex.value < answerStates.value.length) {
        return answerStates.value[currentIndex.value]
      }
      return null
    })

    const answered = computed(() => currentState.value?.answered ?? false)
    const isCorrect = computed(() => currentState.value?.isCorrect ?? false)

    // 現在の問題データ
    const currentData = computed<QuestionWithItems | null>(() => {
      if (!showResults.value && currentIndex.value < quizQuestions.value.length) {
        return quizQuestions.value[currentIndex.value]
      }
      return null
    })

    // 総問題数
    const totalQuestions = computed(() => quizQuestions.value.length)

    // プログレスバーの割合
    const progressPercent = computed(() => {
      if (totalQuestions.value === 0) return 0
      return ((currentIndex.value + 1) / totalQuestions.value) * 100
    })

    // 問題タイプの日本語ラベル
    const questionTypeLabel = computed(() => {
      if (!currentData.value) return ''
      return questionTypeLabels[currentData.value.question.type] || currentData.value.question.type
    })

    // 選択肢アイテム（choice typeのみ）
    const choiceItems = computed(() => {
      if (!currentData.value) return []
      return currentData.value.items.filter((i) => i.item_type === 'choice')
    })

    // 問題本文のフォーマット
    const formattedBody = computed(() => {
      if (!currentData.value) return ''
      const body = currentData.value.question.body
      if (currentData.value.question.type === 'dropdown') {
        return '<p style="color: #aaa;">以下のコードの空欄に適切な選択肢を選んでください。</p>'
      }
      return body.replace(/\n/g, '<br>')
    })

    // 正解テキストのフォーマット
    const formattedCorrectAnswer = computed(() => {
      if (!currentData.value) return ''
      return getCorrectAnswerText(currentData.value).replace(/\n/g, '<br>')
    })

    // 解説のフォーマット
    const formattedExplanation = computed(() => {
      if (!currentData.value) return ''
      return currentData.value.question.explanation.replace(/\n/g, '<br>')
    })

    // 回答があるかどうかの判定
    const hasAnswer = computed(() => {
      const a = currentAnswer.value
      if (a.selectedKey) return true
      if (a.selectedKeys && a.selectedKeys.length > 0) return true
      if (a.orderedKeys && a.orderedKeys.length > 0) return true
      if (a.selections && Object.values(a.selections).some((v) => v !== '')) return true
      if (a.answers && Object.keys(a.answers).length > 0) return true
      return false
    })

    // 回答済み数
    const answeredCount = computed(() => answerStates.value.filter((s) => s.answered).length)

    // 正答数（結果画面用 - 未回答は不正解）
    const correctCount = computed(() => answerStates.value.filter((s) => s.isCorrect).length)

    // 正答率
    const correctRate = computed(() => {
      if (totalQuestions.value === 0) return 0
      return Math.round((correctCount.value / totalQuestions.value) * 100)
    })

    // スコアのクラス
    const scoreClass = computed(() => {
      const rate = correctRate.value
      if (rate >= 80) return 'score-excellent'
      if (rate >= 60) return 'score-good'
      return 'score-needs-work'
    })

    // 結果一覧（未回答は不正解扱い）
    const questionResults = computed<QuestionResult[]>(() => {
      return quizQuestions.value.map((qd, idx) => ({
        questionNo: qd.question.question_no,
        typeLabel: questionTypeLabels[qd.question.type] || qd.question.type,
        title: qd.question.title,
        correct: answerStates.value[idx]?.isCorrect ?? false,
      }))
    })

    // 子コンポーネントからの回答更新
    const onAnswerUpdate = (answer: UserAnswer) => {
      currentAnswer.value = answer
    }

    // 回答確定
    const submitAnswer = () => {
      if (!currentData.value) return
      const result = checkAnswer(currentData.value, currentAnswer.value)
      answerStates.value[currentIndex.value] = {
        answered: true,
        isCorrect: result,
        userAnswer: { ...currentAnswer.value },
      }
    }

    // 問題間を移動する共通処理
    const navigateTo = (idx: number) => {
      if (idx < 0 || idx >= totalQuestions.value) return
      currentIndex.value = idx
      // 移動先の保存済み回答を復元
      const state = answerStates.value[idx]
      if (state && state.answered) {
        currentAnswer.value = { ...state.userAnswer }
      } else {
        currentAnswer.value = {}
      }
    }

    const goToPrev = () => navigateTo(currentIndex.value - 1)
    const goToNext = () => navigateTo(currentIndex.value + 1)

    // 結果画面へ
    const viewResults = () => {
      showResults.value = true
    }

    // 不正解の問題数
    const wrongCount = computed(() => {
      return quizQuestions.value.length - correctCount.value
    })

    // やり直す
    const restartQuiz = () => {
      currentIndex.value = 0
      showResults.value = false
      currentAnswer.value = {}
      answerStates.value = []
      reload()
    }

    // 間違えた問題だけ再挑戦
    const retryWrong = () => {
      const wrongQuestions = quizQuestions.value.filter(
        (_, idx) => !answerStates.value[idx]?.isCorrect
      )
      quizQuestions.value = wrongQuestions
      currentIndex.value = 0
      showResults.value = false
      currentAnswer.value = {}
      answerStates.value = []
    }

    return {
      // state
      loading,
      error,
      currentIndex,
      showResults,
      answered,
      isCorrect,
      correctCount,
      questionResults,
      answeredCount,
      // computed
      currentData,
      totalQuestions,
      progressPercent,
      questionTypeLabel,
      choiceItems,
      formattedBody,
      formattedCorrectAnswer,
      formattedExplanation,
      hasAnswer,
      correctRate,
      scoreClass,
      // methods
      reload,
      onAnswerUpdate,
      submitAnswer,
      goToPrev,
      goToNext,
      viewResults,
      restartQuiz,
      retryWrong,
      wrongCount,
    }
  },
})
</script>

<style scoped>
.quiz-container {
  max-width: 800px;
  margin: 1rem auto;
  padding: 1.5rem;
}

/* ローディング */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #888;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top: 3px solid #41d1ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* エラー */
.error-state {
  text-align: center;
  padding: 2rem;
}
.error-text {
  color: #ff6b6b;
  font-size: 1.1rem;
}

/* プログレスバー */
.progress-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #41d1ff, #42b883);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 0.85rem;
  color: #888;
  white-space: nowrap;
}

/* 問題ヘッダー */
.question-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.5rem;
}
.question-no {
  font-size: 0.9rem;
  color: #41d1ff;
  font-weight: 600;
}
.question-type-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  background: rgba(65, 209, 255, 0.15);
  color: #41d1ff;
  font-weight: 500;
}
.question-title {
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

/* 問題本文 */
.question-body {
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 1.2rem;
  color: inherit;
  opacity: 0.9;
  text-align: left;
}

/* コードブロック */
.code-section {
  margin-bottom: 1.2rem;
}
.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.2rem;
  border-radius: 8px;
  text-align: left;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0;
}
.code-block code {
  font-family: inherit;
}

/* 回答セクション */
.answer-section {
  margin-bottom: 1.5rem;
}

/* アクションセクション */
.action-section {
  margin-top: 1rem;
}
.submit-btn {
  width: 100%;
  padding: 0.8rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  background: #41d1ff;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.submit-btn:hover:not(:disabled) {
  background: #2bc4f5;
}
.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 正誤表示 */
.result-section {
  margin-top: 0.5rem;
}
.result-badge {
  display: inline-block;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.result-badge.correct {
  background: rgba(66, 184, 131, 0.15);
  color: #42b883;
}
.result-badge.incorrect {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}
.correct-answer-box {
  background: rgba(66, 184, 131, 0.08);
  border-left: 3px solid #42b883;
  padding: 0.8rem 1rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 1rem;
}
.correct-answer-label,
.explanation-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #888;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.correct-answer-text {
  font-size: 0.9rem;
  line-height: 1.6;
}
.explanation-box {
  background: rgba(65, 209, 255, 0.05);
  border-left: 3px solid #41d1ff;
  padding: 0.8rem 1rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 1rem;
}
.explanation-text {
  font-size: 0.9rem;
  line-height: 1.6;
}
.next-btn {
  width: 100%;
  padding: 0.8rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  background: #42b883;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.next-btn:hover {
  background: #38a876;
}

/* 問題ナビゲーション */
.question-nav {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}
.nav-btn {
  padding: 0.5rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: rgba(65, 209, 255, 0.1);
  color: #41d1ff;
  border: 1px solid rgba(65, 209, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.nav-btn:hover:not(:disabled) {
  background: rgba(65, 209, 255, 0.2);
}
.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 下部ナビゲーション */
.bottom-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.2rem;
}
.view-results-btn {
  padding: 0.6rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.view-results-btn:hover {
  background: rgba(255, 193, 7, 0.25);
}

/* 結果画面 */
.result-screen {
  text-align: center;
  padding: 1rem 0;
}
.result-title {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}
.result-score {
  margin-bottom: 2rem;
}
.score-circle {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.2rem;
  padding: 1.5rem 2.5rem;
  border-radius: 16px;
  margin-bottom: 0.8rem;
}
.score-circle.score-excellent {
  background: rgba(66, 184, 131, 0.15);
  color: #42b883;
}
.score-circle.score-good {
  background: rgba(65, 209, 255, 0.15);
  color: #41d1ff;
}
.score-circle.score-needs-work {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}
.score-number {
  font-size: 3rem;
  font-weight: 800;
}
.score-divider {
  font-size: 1.5rem;
  margin: 0 0.2rem;
  opacity: 0.6;
}
.score-total {
  font-size: 1.5rem;
  font-weight: 600;
  opacity: 0.6;
}
.score-rate {
  font-size: 1.1rem;
  color: #888;
}
.score-detail {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.3rem;
}

/* 結果詳細 */
.result-details {
  text-align: left;
  margin-bottom: 2rem;
}
.result-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
}
.result-row.result-correct {
  background: rgba(66, 184, 131, 0.08);
}
.result-row.result-wrong {
  background: rgba(255, 107, 107, 0.08);
}
.result-icon {
  font-weight: bold;
  font-size: 1rem;
  width: 20px;
  text-align: center;
}
.result-correct .result-icon { color: #42b883; }
.result-wrong .result-icon { color: #ff6b6b; }
.result-no {
  color: #888;
  font-size: 0.85rem;
  min-width: 40px;
}
.result-type {
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: #aaa;
  white-space: nowrap;
}
.result-title-text {
  flex: 1;
}
.restart-btn {
  width: 100%;
  padding: 0.8rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  background: #41d1ff;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.8rem;
}
.restart-btn:hover {
  background: #2bc4f5;
}
.retry-wrong-btn {
  background: #ff9f43;
  color: #1a1a1a;
}
.retry-wrong-btn:hover {
  background: #e68a2e;
}
.result-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.back-link {
  display: inline-block;
  color: #888;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
.back-link:hover {
  color: #41d1ff;
}

@media (max-width: 600px) {
  .quiz-container {
    padding: 1rem;
    margin: 0.5rem;
  }
  .question-title {
    font-size: 1.1rem;
  }
  .code-block {
    font-size: 0.75rem;
    padding: 0.8rem;
  }
}
</style>
