<template>
  <div class="opening-container">
    <img :src="viteLogo" alt="Vite Logo" class="opening-logo" />
    <h1 class="opening-title">AI-102 試験対策</h1>
    <h2 class="opening-sub">―</h2>
    <div class="opening-date">2026/3/8</div>

    <!-- 範囲指定 -->
    <div class="range-section">
      <label class="range-label">出題範囲（任意）</label>
      <div class="range-inputs">
        <span class="range-prefix">Q</span>
        <input
          v-model.number="rangeFrom"
          type="number"
          min="1"
          placeholder="開始"
          class="range-input"
        />
        <span class="range-separator">〜</span>
        <span class="range-prefix">Q</span>
        <input
          v-model.number="rangeTo"
          type="number"
          min="1"
          placeholder="終了"
          class="range-input"
        />
      </div>
      <div class="range-hint">例: Q61〜Q120 → 61 と 120 を入力。空欄で全問出題</div>
    </div>

    <div class="mode-selection">
      <router-link :to="quizLink('sequential')" class="start-btn mode-btn">順番通りに出題</router-link>
      <router-link :to="quizLink('shuffle')" class="start-btn mode-btn shuffle-btn">シャッフルで出題</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import viteLogo from '/vite.svg'

const rangeFrom = ref(null)
const rangeTo = ref(null)

const quizLink = (mode) => {
  const query = { mode }
  if (rangeFrom.value) query.from = String(rangeFrom.value)
  if (rangeTo.value) query.to = String(rangeTo.value)
  return { path: '/quiz', query }
}
</script>

<style scoped>
.opening-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #232526 0%, #414345 100%);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  padding: 2.5rem 1rem 2rem 1rem;
}
.opening-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1.2rem;
  filter: drop-shadow(0 0 16px #41d1ffcc);
}
.opening-title {
  font-size: 2.6rem;
  font-weight: bold;
  letter-spacing: 0.04em;
  color: #41d1ff;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 16px #23252699;
}
.opening-sub {
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 0.3rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}
.opening-date {
  font-size: 1.1rem;
  color: #b3e5fc;
  font-weight: 400;
  letter-spacing: 0.08em;
  margin-bottom: 1.5rem;
}
.mode-selection {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
  max-width: 320px;
}
/* 範囲指定 */
.range-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.2rem;
  width: 100%;
  max-width: 320px;
}
.range-label {
  font-size: 0.95rem;
  color: #b3e5fc;
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.range-prefix {
  color: #41d1ff;
  font-weight: bold;
  font-size: 1rem;
}
.range-input {
  width: 72px;
  padding: 0.35em 0.5em;
  border-radius: 6px;
  border: 1px solid #555;
  background: #2a2a2a;
  color: #fff;
  font-size: 1rem;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}
.range-input:focus {
  border-color: #41d1ff;
}
.range-input::placeholder {
  color: #666;
}
.range-separator {
  color: #888;
  font-size: 1.1rem;
}
.range-hint {
  font-size: 0.78rem;
  color: #777;
  margin-top: 0.35rem;
}
.start-btn {
  display: inline-block;
  background: #41d1ff;
  color: #232526;
  font-weight: bold;
  font-size: 1.2rem;
  padding: 0.7em 2.2em;
  border-radius: 8px;
  text-decoration: none;
  box-shadow: 0 2px 8px #41d1ff33;
  transition: background 0.2s, color 0.2s;
  text-align: center;
}
.start-btn:hover {
  background: #232526;
  color: #41d1ff;
}
.shuffle-btn {
  background: #42b883;
  box-shadow: 0 2px 8px #42b88333;
}
.shuffle-btn:hover {
  background: #232526;
  color: #42b883;
}
</style>
