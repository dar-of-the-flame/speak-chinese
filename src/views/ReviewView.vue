<template>
  <div class="review-view mobile-container">
    <SectionHeader title="Повторение" @open-profile="$router.push('/profile')" />

    <!-- Настройки повторения (до начала) -->
    <div v-if="!inReview" class="review-controls">
      <!-- Выбор уровней -->
      <div class="levels-group">
        <label
          v-for="level in levelOptions"
          :key="level.value"
          class="custom-checkbox"
          :class="{ checked: selectedLevels.includes(level.value) }"
        >
          <input type="checkbox" :value="level.value" v-model="selectedLevels" />
          <span>HSK {{ level.label }}</span>
        </label>
      </div>

      <!-- Выбор типов -->
      <div class="types-group">
        <label
          v-for="type in exerciseTypes"
          :key="type.value"
          class="custom-checkbox"
          :class="{ checked: selectedTypes.includes(type.value) }"
        >
          <input type="checkbox" :value="type.value" v-model="selectedTypes" />
          <span>{{ type.label }}</span>
        </label>
      </div>

      <!-- в шаблоне -->
      <div class="count-selector">
        <span class="count-label">Количество:</span>
        <div class="count-buttons">
          <button
            v-for="n in [5,10,15,20,25,30,40,50]"
            :key="n"
            @click="cardCount = n"
            :class="['count-btn', { active: cardCount === n }]"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <button
        class="btn btn-primary start-btn"
        @click="startReview"
        :disabled="selectedTypes.length === 0 || selectedLevels.length === 0"
      >
        Начать повторение
      </button>

      <!-- Кнопка перехода к изучению иероглифов -->
      <button class="btn btn-primary chars-btn" @click="goToCharacterReview">
        Учить иероглифы
      </button>
    </div>

    <!-- Сессия повторения -->
    <div v-else class="review-session">
      <div class="session-header">
        <button class="back-btn" @click="confirmExit">
          <ChevronLeft :size="24" />
        </button>
        <div class="progress-indicator">
          {{ currentIndex + 1 }} / {{ sessionExercises.length }}
        </div>
        <div class="placeholder"></div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
      </div>

      <div class="card-wrapper">
        <ExerciseCard
          :exercise="sessionExercises[currentIndex]"
          :isActive="true"
          @answered="handleAnswer"
          @next="nextCard"
        />
      </div>

      <!-- Модалка подтверждения выхода -->
      <div v-if="showExitConfirm" class="modal-overlay" @click.self="showExitConfirm = false">
        <div class="modal exit-modal">
          <h3>Завершить повторение?</h3>
          <p>Прогресс не сохранится</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="showExitConfirm = false">Отмена</button>
            <button class="confirm-btn" @click="exitReview">Выйти</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка результатов -->
    <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
      <div class="modal results-modal">
        <h2>Результаты</h2>
        <div class="stats">
          <p>Правильно: {{ resultStats.correct }} из {{ resultStats.total }}</p>
          <p>Процент: {{ percentage }}%</p>
          <p>Время: {{ formattedTime }}</p>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" @click="repeatMistakes" :disabled="resultStats.mistakes.length === 0">
            Повторить ошибки
          </button>
          <button class="btn btn-outline" @click="resetToSettings">
            Выбрать режим
          </button>
          <button class="btn btn-outline" @click="restartSame">
            Заново
          </button>
          <button class="btn btn-outline" @click="goToCharacterReview">
            Учить иероглифы
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useUserStore } from '@/stores/userStore'
import ExerciseCard from '@/components/review/ExerciseCard.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { ChevronLeft } from 'lucide-vue-next'

const router = useRouter()
const exerciseStore = useExerciseStore()
const userStore = useUserStore()

onMounted(() => {
  exerciseStore.loadExercises()
})

const levelOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' }  // добавили
]
const selectedLevels = ref<string[]>(['1'])

const exerciseTypes = [
  { value: 'fill-blank', label: 'Вставка слова' },
  { value: 'sentence-order', label: 'Составь предложение' },
  { value: 'translate', label: 'Перевод' },
  { value: 'match-pinyin', label: 'Соотнеси с пиньинь' }
]
const selectedTypes = ref<string[]>(['fill-blank'])

const cardCount = ref(10)

// Состояние сессии
const inReview = ref(false)
const sessionExercises = ref<any[]>([])
const currentIndex = ref(0)
const startTime = ref(0)
const endTime = ref(0)
const resultStats = ref({ correct: 0, total: 0, mistakes: [] as any[] })
const showResults = ref(false)
const showExitConfirm = ref(false)

const lastSettings = ref({ levels: [] as string[], types: [] as string[], count: 10 })

const progress = computed(() => ((currentIndex.value + 1) / sessionExercises.value.length) * 100)
const percentage = computed(() => Math.round((resultStats.value.correct / resultStats.value.total) * 100))
const formattedTime = computed(() => {
  const diff = endTime.value - startTime.value
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
})

function startReview() {
  const filtered = exerciseStore.exercises.filter(e =>
    selectedLevels.value.includes(e.level) && selectedTypes.value.includes(e.type)
  )
  const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, cardCount.value)
  sessionExercises.value = shuffled
  currentIndex.value = 0
  inReview.value = true
  startTime.value = Date.now()
  resultStats.value = { correct: 0, total: shuffled.length, mistakes: [] }
  lastSettings.value = {
    levels: [...selectedLevels.value],
    types: [...selectedTypes.value],
    count: cardCount.value
  }
}

function handleAnswer(correct: boolean) {
  if (correct) resultStats.value.correct++
  else {
    resultStats.value.mistakes.push(sessionExercises.value[currentIndex.value])
  }
  userStore.addPracticeResult(correct)
}

function nextCard() {
  if (currentIndex.value < sessionExercises.value.length - 1) {
    currentIndex.value++
  } else {
    endTime.value = Date.now()
    inReview.value = false
    showResults.value = true
  }
}

function confirmExit() {
  showExitConfirm.value = true
}

function exitReview() {
  inReview.value = false
  showExitConfirm.value = false
}

function repeatMistakes() {
  sessionExercises.value = [...resultStats.value.mistakes].sort(() => Math.random() - 0.5)
  currentIndex.value = 0
  inReview.value = true
  showResults.value = false
  startTime.value = Date.now()
  resultStats.value = { correct: 0, total: sessionExercises.value.length, mistakes: [] }
}

function resetToSettings() {
  showResults.value = false
  // Возврат к экрану настроек
}

function restartSame() {
  const filtered = exerciseStore.exercises.filter(e =>
    lastSettings.value.levels.includes(e.level) && lastSettings.value.types.includes(e.type)
  )
  const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, lastSettings.value.count)
  sessionExercises.value = shuffled
  currentIndex.value = 0
  inReview.value = true
  showResults.value = false
  startTime.value = Date.now()
  resultStats.value = { correct: 0, total: shuffled.length, mistakes: [] }
}

function goToCharacterReview() {
  router.push('/character-review')
}
</script>

<style scoped>
.review-controls {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin: 1rem 0;
}
.levels-group, .types-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.count-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.count-label {
  font-weight: 500;
  color: var(--text-secondary);
}
.count-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.count-btn {
  padding: 0.6rem 1.2rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px;
}
.count-btn.active {
  background: var(--level-accent);
  color: white;
  border-color: var(--level-accent);
}
.start-btn, .chars-btn {
  width: 100%;
  margin-top: 1rem;
}
.review-session {
  padding: 1rem 0;
}
.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--level-accent);
  transition: background 0.2s;
}
.back-btn:hover {
  background: color-mix(in srgb, var(--level-accent) 15%, transparent);
}
.progress-indicator {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.placeholder {
  width: 40px;
}
.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 2rem;
}
.dark .progress-bar-container {
  background: rgba(255,255,255,0.1);
}
.progress-bar-fill {
  height: 100%;
  background: var(--level-accent);
  transition: width 0.3s ease;
}
.card-wrapper {
  margin-top: 1rem;
}

/* Модальное окно выхода */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 24px;
  max-width: 300px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border: 2px solid var(--level-accent);
}
.modal h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.modal p {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}
.modal-actions {
  display: flex;
  gap: 1rem;
}
.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 30px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn {
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
}
.cancel-btn:hover {
  background: color-mix(in srgb, var(--level-accent) 10%, var(--surface));
}
.confirm-btn {
  background: #f44336;
  color: white;
}
.confirm-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px #f44336;
}
.results-modal {
  max-width: 400px;
}
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>