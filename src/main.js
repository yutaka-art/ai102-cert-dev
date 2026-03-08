import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import OpeningPage from './components/OpeningPage.vue'
import QuestionQuiz from './components/QuestionQuiz.vue'

const routes = [
  { path: '/', component: OpeningPage },
  { path: '/quiz', component: QuestionQuiz },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

createApp(App).use(router).mount('#app')
