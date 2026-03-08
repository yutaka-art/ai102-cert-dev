<template>
  <div class="drag-drop">
    <div class="instruction">{{ instruction }}</div>
    <div class="drag-drop-layout">
      <!-- 選択肢プール -->
      <div class="pool-section">
        <h4 class="section-title">選択肢</h4>
        <draggable
          v-model="poolItems"
          :group="{ name: 'quiz', pull: 'clone', put: false }"
          item-key="item_key"
          class="drag-list pool-list"
          :disabled="disabled"
          :clone="cloneItem"
          :sort="false"
        >
          <template #item="{ element }">
            <div
              class="drag-item"
              :class="{ 'in-answer': isInAnswer(element.item_key), disabled: disabled }"
            >
              <span class="drag-handle">⠿</span>
              <span class="drag-label">{{ element.label }}</span>
            </div>
          </template>
        </draggable>
      </div>

      <!-- 回答エリア -->
      <div class="answer-section">
        <h4 class="section-title">回答（正しい順序に並べてください）</h4>
        <draggable
          v-model="answerItems"
          :group="{ name: 'quiz', pull: true, put: true }"
          item-key="item_key"
          class="drag-list answer-list"
          :disabled="disabled"
          @change="onAnswerChange"
        >
          <template #item="{ element, index }">
            <div
              class="drag-item answer-item"
              :class="{
                disabled: disabled,
                'correct-item': disabled && isCorrectAtPosition(element.item_key, index),
                'wrong-item': disabled && !isCorrectAtPosition(element.item_key, index),
              }"
            >
              <span class="order-number">{{ index + 1 }}</span>
              <span class="drag-label">{{ element.label }}</span>
              <button
                v-if="!disabled"
                class="remove-btn"
                type="button"
                @click.stop="removeFromAnswer(index)"
              >✕</button>
            </div>
          </template>
        </draggable>
        <div
          v-if="answerItems.length === 0 && !disabled"
          class="empty-drop-zone"
        >
          こちらに選択肢をドラッグ、または下のボタンで追加してください
        </div>
      </div>
    </div>

    <!-- ボタンで追加（常に表示） -->
    <div v-if="!disabled && availablePoolItems.length > 0" class="add-section">
      <h4 class="section-title">クリックで追加</h4>
      <div class="add-buttons">
        <button
          v-for="item in availablePoolItems"
          :key="item.item_key"
          type="button"
          class="add-btn"
          @click="addToAnswer(item)"
        >
          + {{ item.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue'
import draggable from 'vuedraggable'
import type { QuestionItem, QuestionMetadata, UserAnswer } from '@/types/quiz'

interface DragItemData {
  item_key: string
  label: string
}

export default defineComponent({
  name: 'DragDrop',
  components: { draggable },
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
      default: '正しい順序に並べてください',
    },
    metadata: {
      type: Object as PropType<QuestionMetadata>,
      default: () => ({}),
    },
  },
  emits: ['update:answer'],
  setup(props, { emit }) {
    // 全 drag_item をプールに設定
    const poolItems = ref<DragItemData[]>(
      props.items
        .filter((i) => i.item_type === 'drag_item')
        .map((i) => ({ item_key: i.item_key, label: i.label }))
    )

    const answerItems = ref<DragItemData[]>([])

    const maxSelections = computed(() => props.metadata.maxSelections ?? props.items.filter(i => i.item_type === 'drag_item').length)

    const cloneItem = (item: DragItemData): DragItemData => {
      return { ...item }
    }

    const isInAnswer = (key: string): boolean => {
      return answerItems.value.some((a) => a.item_key === key)
    }

    const availablePoolItems = computed(() => {
      return poolItems.value.filter((p) => !isInAnswer(p.item_key))
    })

    const addToAnswer = (item: DragItemData) => {
      if (isInAnswer(item.item_key)) return
      if (answerItems.value.length >= maxSelections.value) return
      answerItems.value = [...answerItems.value, { ...item }]
    }

    const removeFromAnswer = (index: number) => {
      answerItems.value = answerItems.value.filter((_, i) => i !== index)
    }

    const onAnswerChange = () => {
      // clone ドラッグ完了後、重複チェック
      const seen = new Set<string>()
      const deduped = answerItems.value.filter((item) => {
        if (seen.has(item.item_key)) return false
        seen.add(item.item_key)
        return true
      })
      // 最大数制限
      if (deduped.length > maxSelections.value) {
        answerItems.value = deduped.slice(0, maxSelections.value)
      } else if (deduped.length !== answerItems.value.length) {
        answerItems.value = deduped
      }
    }

    const isCorrectAtPosition = (key: string, index: number): boolean => {
      const originalItem = props.items.find(
        (i) => i.item_type === 'drag_item' && i.item_key === key
      )
      if (!originalItem || originalItem.correct_order === null) return false
      return originalItem.correct_order === index + 1
    }

    // 回答の変更を emit
    watch(
      answerItems,
      (items) => {
        const answer: UserAnswer = {
          orderedKeys: items.map((i) => i.item_key),
        }
        emit('update:answer', answer)
      },
      { deep: true }
    )

    return {
      poolItems,
      answerItems,
      cloneItem,
      isInAnswer,
      availablePoolItems,
      addToAnswer,
      removeFromAnswer,
      onAnswerChange,
      isCorrectAtPosition,
      maxSelections,
    }
  },
})
</script>

<style scoped>
.drag-drop {
  width: 100%;
}
.instruction {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 0.8rem;
}
.drag-drop-layout {
  display: flex;
  gap: 1.5rem;
  min-height: 200px;
}
.pool-section,
.answer-section {
  flex: 1;
  min-width: 0;
}
.section-title {
  font-size: 0.85rem;
  color: #aaa;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.drag-list {
  min-height: 120px;
  border: 2px dashed #444;
  border-radius: 8px;
  padding: 0.5rem;
}
.pool-list {
  border-color: #555;
}
.answer-list {
  border-color: #41d1ff;
  background: rgba(65, 209, 255, 0.03);
}
.drag-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.4rem;
  border: 2px solid #444;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  cursor: grab;
  transition: all 0.2s;
  font-size: 0.9rem;
  line-height: 1.3;
}
.drag-item:active {
  cursor: grabbing;
}
.drag-item.in-answer {
  opacity: 0.4;
  cursor: default;
}
.drag-item.disabled {
  cursor: default;
}
.answer-item {
  background: rgba(65, 209, 255, 0.08);
  border-color: #41d1ff;
}
.answer-item.correct-item {
  border-color: #42b883;
  background: rgba(66, 184, 131, 0.12);
}
.answer-item.wrong-item {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.12);
}
.drag-handle {
  margin-right: 0.6rem;
  color: #666;
  font-size: 1.1rem;
  user-select: none;
}
.order-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  background: #41d1ff;
  color: #1a1a1a;
  font-size: 0.8rem;
  font-weight: bold;
  margin-right: 0.6rem;
}
.drag-label {
  flex: 1;
}
.remove-btn {
  background: none;
  border: none;
  color: #ff6b6b;
  cursor: pointer;
  font-size: 1rem;
  padding: 0 0.3rem;
  margin-left: 0.5rem;
  min-width: auto;
  min-height: auto;
}
.empty-drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #666;
  font-size: 0.85rem;
  border: 2px dashed #41d1ff;
  border-radius: 8px;
  background: rgba(65, 209, 255, 0.03);
  padding: 1rem;
  text-align: center;
}
.add-section {
  margin-top: 1.2rem;
}
.add-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.add-btn {
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid #41d1ff;
  border-radius: 4px;
  background: transparent;
  color: #41d1ff;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
  line-height: 1.3;
}
.add-btn:hover {
  background: rgba(65, 209, 255, 0.1);
}

@media (max-width: 768px) {
  .drag-drop-layout {
    flex-direction: column;
  }
}
</style>
