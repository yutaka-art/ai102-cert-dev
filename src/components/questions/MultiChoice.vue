<template>
  <div class="multi-choice">
    <div class="instruction">{{ instruction }}</div>
    <ul class="choice-list">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="choice-btn"
          :class="{
            selected: selectedKeys.includes(item.item_key),
            'correct-answer': disabled && item.is_correct === 'true',
            'wrong-answer': disabled && selectedKeys.includes(item.item_key) && item.is_correct !== 'true',
          }"
          :disabled="disabled"
          @click="toggleItem(item.item_key)"
        >
          <span class="choice-checkbox">
            <span v-if="selectedKeys.includes(item.item_key)" class="check-mark">✓</span>
          </span>
          <span class="choice-label">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, type PropType } from 'vue'
import type { QuestionItem, UserAnswer } from '@/types/quiz'

export default defineComponent({
  name: 'MultiChoice',
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
      default: '複数選択してください',
    },
    maxSelections: {
      type: Number,
      default: 0,
    },
  },
  emits: ['update:answer'],
  setup(props, { emit }) {
    const selectedKeys = ref<string[]>([])

    const toggleItem = (key: string) => {
      if (props.disabled) return
      const idx = selectedKeys.value.indexOf(key)
      if (idx >= 0) {
        selectedKeys.value = selectedKeys.value.filter((k) => k !== key)
      } else {
        // maxSelections が設定されている場合、上限チェック
        if (props.maxSelections > 0 && selectedKeys.value.length >= props.maxSelections) {
          return
        }
        selectedKeys.value = [...selectedKeys.value, key]
      }
    }

    watch(
      selectedKeys,
      (keys) => {
        const answer: UserAnswer = { selectedKeys: [...keys] }
        emit('update:answer', answer)
      },
      { deep: true }
    )

    return { selectedKeys, toggleItem }
  },
})
</script>

<style scoped>
.multi-choice {
  width: 100%;
}
.instruction {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 0.8rem;
}
.choice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.choice-list li {
  margin-bottom: 0.5rem;
}
.choice-btn {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  border: 2px solid #444;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  line-height: 1.4;
}
.choice-btn:hover:not(:disabled) {
  border-color: #41d1ff;
  background: rgba(65, 209, 255, 0.05);
}
.choice-btn.selected {
  border-color: #41d1ff;
  background: rgba(65, 209, 255, 0.12);
}
.choice-btn.correct-answer {
  border-color: #42b883;
  background: rgba(66, 184, 131, 0.12);
}
.choice-btn.wrong-answer {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.12);
}
.choice-btn:disabled {
  cursor: default;
  opacity: 0.85;
}
.choice-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 4px;
  border: 2px solid #666;
  margin-right: 0.75rem;
  transition: all 0.2s;
  font-size: 0.8rem;
  font-weight: bold;
}
.choice-btn.selected .choice-checkbox {
  border-color: #41d1ff;
  background: #41d1ff;
  color: #1a1a1a;
}
.check-mark {
  line-height: 1;
}
.choice-label {
  flex: 1;
}
</style>
