<template>
  <div class="dropdown-select">
    <div class="instruction">{{ instruction }}</div>
    <div class="code-container">
      <pre class="code-block"><template v-for="(segment, idx) in codeSegments" :key="idx"><template v-if="segment.type === 'text'">{{ segment.text }}</template><template v-else><select
              class="inline-select"
              :class="{
                'correct-select': disabled && isBlankCorrect(segment.blankKey),
                'wrong-select': disabled && !isBlankCorrect(segment.blankKey) && selections[segment.blankKey] !== '',
              }"
              :disabled="disabled"
              :value="selections[segment.blankKey] || ''"
              @change="onSelect(segment.blankKey, ($event.target as HTMLSelectElement).value)"
            ><option value="" disabled>-- {{ segment.blankKey }} --</option><option
                v-for="opt in getOptionsForBlank(segment.blankKey)"
                :key="opt.id"
                :value="opt.value"
              >{{ opt.label }}</option></select></template></template></pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, reactive, type PropType } from 'vue'
import type { QuestionItem, UserAnswer } from '@/types/quiz'

interface CodeSegment {
  type: 'text' | 'blank'
  text: string
  blankKey: string
}

export default defineComponent({
  name: 'DropdownSelect',
  props: {
    items: {
      type: Array as PropType<QuestionItem[]>,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    instruction: {
      type: String,
      default: '各ドロップダウンを選択してください',
    },
  },
  emits: ['update:answer'],
  setup(props, { emit }) {
    // blank と option を分離
    const blanks = computed(() =>
      props.items
        .filter((i) => i.item_type === 'dropdown_blank')
        .sort((a, b) => a.sort_order - b.sort_order)
    )

    const options = computed(() =>
      props.items.filter((i) => i.item_type === 'dropdown_option')
    )

    // blank ごとの選択値
    const selections = reactive<Record<string, string>>({})

    // body テキストを <selectXX> でセグメント分割
    const codeSegments = computed<CodeSegment[]>(() => {
      const text = props.body
      const regex = /<(select\d+)>/g
      const segments: CodeSegment[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          segments.push({
            type: 'text',
            text: text.slice(lastIndex, match.index),
            blankKey: '',
          })
        }
        segments.push({
          type: 'blank',
          text: '',
          blankKey: match[1],
        })
        lastIndex = regex.lastIndex
      }

      if (lastIndex < text.length) {
        segments.push({
          type: 'text',
          text: text.slice(lastIndex),
          blankKey: '',
        })
      }

      return segments
    })

    // blank に対応する option のリスト
    const getOptionsForBlank = (blankKey: string): QuestionItem[] => {
      return options.value
        .filter((o) => o.parent_key === blankKey)
        .sort((a, b) => a.sort_order - b.sort_order)
    }

    const onSelect = (blankKey: string, value: string) => {
      selections[blankKey] = value
    }

    const isBlankCorrect = (blankKey: string): boolean => {
      const blank = blanks.value.find((b) => b.item_key === blankKey)
      if (!blank) return false
      return selections[blankKey] === blank.correct_value
    }

    // 回答変更を emit
    watch(
      () => ({ ...selections }),
      (sel) => {
        const answer: UserAnswer = { selections: { ...sel } }
        emit('update:answer', answer)
      },
      { deep: true }
    )

    return {
      selections,
      codeSegments,
      blanks,
      getOptionsForBlank,
      onSelect,
      isBlankCorrect,
    }
  },
})
</script>

<style scoped>
.dropdown-select {
  width: 100%;
}
.instruction {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 0.8rem;
}
.code-container {
  overflow-x: auto;
}
.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.2rem;
  border-radius: 8px;
  text-align: left;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 2;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
.inline-select {
  appearance: auto;
  background: #2d2d2d;
  color: #41d1ff;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  min-width: 200px;
  vertical-align: middle;
}
.inline-select:focus {
  border-color: #41d1ff;
  outline: none;
}
.inline-select:disabled {
  cursor: default;
  opacity: 0.9;
}
.inline-select.correct-select {
  border-color: #42b883;
  background: rgba(66, 184, 131, 0.2);
  color: #42b883;
}
.inline-select.wrong-select {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}
</style>
