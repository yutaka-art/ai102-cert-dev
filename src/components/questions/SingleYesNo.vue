<template>
  <div class="single-yesno">
    <div class="instruction">{{ instruction }}</div>
    <div v-for="item in statements" :key="item.id" class="statement-row">
      <div class="statement-text">{{ item.label }}</div>
      <div class="yesno-buttons">
        <button
          type="button"
          class="yesno-btn yes-btn"
          :class="{
            selected: answers[item.item_key] === true,
            'correct-answer': disabled && item.is_correct === 'true',
            'wrong-answer': disabled && answers[item.item_key] === true && item.is_correct !== 'true',
          }"
          :disabled="disabled"
          @click="setAnswer(item.item_key, true)"
        >
          はい
        </button>
        <button
          type="button"
          class="yesno-btn no-btn"
          :class="{
            selected: answers[item.item_key] === false,
            'correct-answer': disabled && item.is_correct === 'false',
            'wrong-answer': disabled && answers[item.item_key] === false && item.is_correct !== 'false',
          }"
          :disabled="disabled"
          @click="setAnswer(item.item_key, false)"
        >
          いいえ
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, watch, type PropType } from 'vue'
import type { QuestionItem, UserAnswer } from '@/types/quiz'

export default defineComponent({
  name: 'SingleYesNo',
  props: {
    items: {
      type: Array as PropType<QuestionItem[]>,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    instruction: {
      type: String,
      default: 'はい / いいえ を選択してください',
    },
  },
  emits: ['update:answer'],
  setup(props, { emit }) {
    const statements = computed(() =>
      props.items
        .filter((i) => i.item_type === 'statement')
        .sort((a, b) => a.sort_order - b.sort_order)
    )

    const answers = reactive<Record<string, boolean>>({})

    const setAnswer = (key: string, value: boolean) => {
      if (props.disabled) return
      answers[key] = value
    }

    watch(
      () => ({ ...answers }),
      (ans) => {
        const answer: UserAnswer = { answers: { ...ans } }
        emit('update:answer', answer)
      },
      { deep: true }
    )

    return { statements, answers, setAnswer }
  },
})
</script>

<style scoped>
.single-yesno {
  width: 100%;
}
.instruction {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 0.8rem;
}
.statement-row {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem;
  margin-bottom: 0.8rem;
  border: 2px solid #444;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}
.statement-text {
  font-size: 0.95rem;
  line-height: 1.5;
}
.yesno-buttons {
  display: flex;
  gap: 0.8rem;
}
.yesno-btn {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 2px solid #444;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}
.yesno-btn:hover:not(:disabled) {
  border-color: #41d1ff;
}
.yesno-btn.selected {
  border-color: #41d1ff;
  background: rgba(65, 209, 255, 0.12);
  color: #41d1ff;
}
.yesno-btn.correct-answer {
  border-color: #42b883;
  background: rgba(66, 184, 131, 0.12);
  color: #42b883;
}
.yesno-btn.wrong-answer {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.12);
  color: #ff6b6b;
}
.yesno-btn:disabled {
  cursor: default;
  opacity: 0.85;
}
</style>
