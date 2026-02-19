<template>
  <div class="practice-result" :style="{ backgroundColor: 'var(--bg-primary)' }">
    <div class="mobile-container">
      <div class="result-header">
        <button class="back-btn" @click="goBack">
          <ChevronLeft :size="24" />
        </button>
        <span class="lesson-name">{{ lessonName }}</span>
      </div>

      <div class="result-card">
        <div class="result-emoji">{{ resultEmoji }}</div>
        <h2 class="result-title" :class="resultClass">{{ resultTitle }}</h2>
        <p class="result-message">{{ resultMessage }}</p>

        <div class="circular-progress">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              :stroke="progressColor"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="progress-percent">{{ percentage }}%</div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ stats.correct }}</span>
            <span class="stat-label">Верно</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.total - stats.correct }}</span>
            <span class="stat-label">Ошибок</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">Всего попыток</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="action-btn" @click="repeatMistakes">
          <RotateCcw :size="20" />
          Повторить ошибки
        </button>
        <button class="action-btn" @click="nextLesson">
          <ArrowRight :size="20" />
          Следующий урок
        </button>
        <button class="action-btn primary" @click="finishAndGoHome">
          <Home :size="20" />
          На главную
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter} from 'vue-router'
import { ChevronLeft, RotateCcw, ArrowRight, Home } from 'lucide-vue-next'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const lessonsStore = useLessonsStore()
const userStore = useUserStore()

const props = defineProps<{ sessionId: string }>()

// Получаем статистику из userStore
const stats = userStore.getLessonPracticeStats(props.sessionId)

const lesson = computed(() => lessonsStore.allLessons.find(l => l.id === props.sessionId))
const lessonName = computed(() => lesson.value?.title || 'Урок')

const totalAttempts = computed(() => stats.total)
const percentage = computed(() => {
  if (totalAttempts.value === 0) return 0
  return Math.round((stats.correct / totalAttempts.value) * 100)
})

const circumference = 2 * Math.PI * 45
const dashOffset = computed(() => circumference - (percentage.value / 100) * circumference)

const progressColor = computed(() => {
  if (percentage.value >= 80) return '#4caf50'
  if (percentage.value >= 50) return '#ff9800'
  return '#f44336'
})

const resultEmoji = computed(() => {
  if (percentage.value >= 80) return '🎉'
  if (percentage.value >= 50) return '👍'
  return '💪'
})

const resultTitle = computed(() => {
  if (percentage.value >= 80) return 'Отлично!'
  if (percentage.value >= 50) return 'Неплохо!'
  return 'Старайся лучше!'
})

const resultClass = computed(() => {
  if (percentage.value >= 80) return 'success'
  if (percentage.value >= 50) return 'warning'
  return 'danger'
})

const resultMessage = computed(() => {
  if (percentage.value >= 80) return 'Ты отлично справился! Так держать!'
  if (percentage.value >= 50) return 'Хороший результат, но есть над чем поработать.'
  return 'Не сдавайся! Попробуй ещё раз.'
})

function goBack() {
  router.back()
}

function repeatMistakes() {
  // TODO: реализовать повторение ошибок (пока просто завершаем)
  finishAndGoHome()
}

function nextLesson() {
  if (lesson.value) {
    const nextId = `${lesson.value.hskLevel}-${lesson.value.lessonNumber + 1}`
    router.push(`/lesson/${nextId}`)
  } else {
    router.push('/main')
  }
}

function finishAndGoHome() {
  // При завершении урока отмечаем его пройденным и добавляем слова
  userStore.updateLessonProgress(props.sessionId, 'completed', lesson.value?.newWords)
  // Можно сбросить статистику для этого урока, если не хотим её хранить после завершения
  // userStore.resetLessonPracticeStats(props.sessionId)
  router.push('/main')
}
</script>

<style scoped>
/* ... стили как раньше, но stats-grid теперь с тремя колонками */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.stat-item {
  background: var(--surface);
  padding: 1rem;
  border-radius: 16px;
}
.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--accent-color);
}
.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.practice-result {
  min-height: 100vh;
  padding: 1rem 0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: var(--text-primary);
  transition: background 0.2s;
}
.back-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}

.lesson-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.result-card {
  background: var(--bg-primary);
  border-radius: 32px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  text-align: center;
  margin-bottom: 2rem;
}

.result-emoji {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.result-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.result-title.success { color: #4caf50; }
.result-title.warning { color: #ff9800; }
.result-title.danger { color: #f44336; }

.result-message {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.circular-progress {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
}

.progress-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-primary);
}




.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}
.action-btn.primary {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.action-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}


.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.stat-item {
  background: var(--surface);
  padding: 1rem;
  border-radius: 16px;
}
.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--accent-color);
}
.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
</style>