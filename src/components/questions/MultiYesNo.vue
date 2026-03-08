<template>
  <div class="multi-yesno">
    <div class="instruction">{{ instruction }}</div>
    <table class="yesno-table">
      <thead>
        <tr>
          <th class="col-statement">命題</th>
          <th class="col-yesno">はい</th>
          <th class="col-yesno">いいえ</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in statements"
          :key="item.id"
          class="statement-row"
          :class="{
            'correct-row': disabled && isStatementCorrect(item),
            'wrong-row': disabled && !isStatementCorrect(item) && answers[item.item_key] !== undefined,
          }"
        >
          <td class="col-statement">{{ item.label }}</td>
          <td class="col-yesno">
            <button
              type="button"
              class="yesno-btn"
              :class="{
                selected: answers[item.item_key] === true,
                'correct-answer': disabled && item.is_correct === 'true',
                'wrong-answer': disabled && answers[item.item_key] === true && item.is_correct !== 'true',
              }"
              :disabled="disabled"
              @click="setAnswer(item.item_key, true)"
            >
              ○
            </button>
          </td>
          <td class="col-yesno">
            <button
              type="button"
              class="yesno-btn"
              :class="{
                selected: answers[item.item_key] === false,
                'correct-answer': disabled && item.is_correct === 'false',
                'wrong-answer': disabled && answers[item.item_key] === false && item.is_correct !== 'false',
              }"
              :disabled="disabled"
              @click="setAnswer(item.item_key, false)"
            >
              ○
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, watch, type PropType } from 'vue'
import type { QuestionItem, UserAnswer } from '@/types/quiz'

export default defineComponent({
  name: 'MultiYesNo',
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
      default: '各文について はい / いいえ を選択してください',
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

    const isStatementCorrect = (item: QuestionItem): boolean => {
      const userVal = answers[item.item_key]
      if (userVal === undefined) return false
      return userVal === (item.is_correct === 'true')
    }

    watch(
      () => ({ ...answers }),
      (ans) => {
        const answer: UserAnswer = { answers: { ...ans } }
        emit('update:answer', answer)
      },
      { deep: true }
    )

    return { statements, answers, setAnswer, isStatementCorrect }
  },
})
</script>

<style scoped>
.multi-yesno {
  width: 100%;
}
.instruction {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 0.8rem;
}
.yesno-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.4rem;
}
.yesno-table th {
  font-size: 0.8rem;
  color: #aaa;
  text-align: center;
  padding: 0.4rem 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.yesno-table th.col-statement {
  text-align: left;
}
.col-statement {
  width: auto;
  padding: 0.75rem 0.8rem;
  font-size: 0.9rem;
  line-height: 1.5;
}
.col-yesno {
  width: 60px;
  text-align: center;
  padding: 0.4rem;
}
.statement-row td {
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
}
.statement-row td:first-child {
  border-left: 2px solid #444;
  border-radius: 8px 0 0 8px;
}
.statement-row td:last-child {
  border-right: 2px solid #444;
  border-radius: 0 8px 8px 0;
}
.statement-row.correct-row td:first-child {
  border-left-color: #42b883;
}
.statement-row.wrong-row td:first-child {
  border-left-color: #ff6b6b;
}
.yesno-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #555;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-height: auto;
  min-width: auto;
}
.yesno-btn:hover:not(:disabled) {
  border-color: #41d1ff;
}
.yesno-btn.selected {
  border-color: #41d1ff;
  background: #41d1ff;
  color: #1a1a1a;
}
.yesno-btn.correct-answer {
  border-color: #42b883;
  background: #42b883;
  color: #1a1a1a;
}
.yesno-btn.wrong-answer {
  border-color: #ff6b6b;
  background: #ff6b6b;
  color: #1a1a1a;
}
.yesno-btn:disabled {
  cursor: default;
  opacity: 0.85;
}

@media (max-width: 600px) {
  .yesno-table, .yesno-table thead, .yesno-table tbody, .yesno-table tr, .yesno-table td, .yesno-table th {
    display: block;
  }
  .yesno-table thead {
    display: none;
  }
  .statement-row {
    margin-bottom: 0.8rem;
  }
  .statement-row td {
    border: none !important;
    border-radius: 0 !important;
  }
  .statement-row td:first-child {
    border-left: 2px solid #444 !important;
    border-top: 1px solid #333 !important;
    border-radius: 8px 8px 0 0 !important;
    padding: 0.8rem;
  }
  .col-yesno {
    display: inline-block;
    width: auto;
    padding: 0.4rem 0.6rem;
  }
  .col-yesno::before {
    font-size: 0.8rem;
    color: #888;
    margin-right: 0.4rem;
  }
  .statement-row td:nth-child(2)::before {
    content: 'はい: ';
  }
  .statement-row td:last-child::before {
    content: 'いいえ: ';
  }
}
</style>
