<!-- src/views/ExamSession.vue -->
<template>
  <div class="exam-session" :style="{ backgroundColor: 'var(--level-bg)' }">
    <div class="mobile-container">
      <div class="session-header">
        <button class="back-btn" @click="confirmExit">
          <ChevronLeft :size="24" />
        </button>
        <div class="progress-text">Раздел {{ currentSectionIndex + 1 }} / {{ exam?.sections.length }}</div>
        <div class="placeholder"></div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: totalProgress + '%' }"></div>
      </div>

      <div v-if="exam && currentSection" class="section-container">
        <h2 class="section-title">{{ currentSection.name }}</h2>
        <div class="questions">
          <div
            v-for="(q, qIdx) in currentSection.questions"
            :key="qIdx"
            class="question-card"
            v-show="currentQuestionIndex === qIdx"
          >
            <!-- Множественный выбор -->
            <div v-if="q.type === 'multiple-choice'" class="multiple-choice">
              <p class="question-text">{{ q.question }}</p>
              <div class="options">
                <button
                  v-for="(opt, optIdx) in q.options"
                  :key="optIdx"
                  @click="answerQuestion(qIdx, optIdx)"
                  :disabled="isAnswered"
                  :class="[
                    'option-btn',
                    {
                      correct: isAnswered && optIdx === q.answer,
                      wrong: isAnswered && userAnswers[currentSectionIndex]?.[qIdx] === optIdx && optIdx !== q.answer,
                      selected: !isAnswered && tempAnswer === optIdx
                    }
                  ]"
                >
                  {{ opt }}
                </button>
              </div>
            </div>

            <!-- Заполнение пропуска -->
            <div v-else-if="q.type === 'fill-blank'" class="fill-blank">
              <p class="sentence">{{ q.sentence }}</p>
              <div class="options">
                <button
                  v-for="(opt, optIdx) in q.options"
                  :key="optIdx"
                  @click="answerQuestion(qIdx, optIdx)"
                  :disabled="isAnswered"
                  :class="[
                    'option-btn',
                    {
                      correct: isAnswered && optIdx === q.answer,
                      wrong: isAnswered && userAnswers[currentSectionIndex]?.[qIdx] === optIdx && optIdx !== q.answer,
                      selected: !isAnswered && tempAnswer === optIdx
                    }
                  ]"
                >
                  {{ opt }}
                </button>
              </div>
            </div>

            <!-- Перевод -->
            <div v-else-if="q.type === 'translate'" class="translate">
              <p class="question-text">{{ q.question }}</p>
              <input
                v-model="tempTranslate"
                class="input"
                placeholder="Ваш перевод"
                :disabled="isAnswered"
              />
              <button
                class="btn btn-primary submit-btn"
                @click="submitTranslate(qIdx)"
                :disabled="isAnswered || !tempTranslate.trim()"
              >
                Ответить
              </button>
            </div>

            <!-- Чтение с подвопросами -->
            <div v-else-if="q.type === 'reading'" class="reading">
              <div class="reading-text">
                <p>{{ q.text }}</p>
              </div>
              <div
                v-for="(item, itemIdx) in q.items"
                :key="itemIdx"
                class="reading-item"
              >
                <p class="reading-question">{{ item.question }}</p>
                <div class="options">
                  <button
                    v-for="(opt, optIdx) in item.options"
                    :key="optIdx"
                    @click="answerReadingItem(qIdx, itemIdx, optIdx)"
                    :disabled="isReadingItemAnswered(qIdx, itemIdx)"
                    :class="[
                      'option-btn',
                      {
                        correct: isReadingItemAnswered(qIdx, itemIdx) && optIdx === item.answer,
                        wrong: isReadingItemAnswered(qIdx, itemIdx) && readingAnswers[qIdx]?.[itemIdx] === optIdx && optIdx !== item.answer,
                        selected: !isReadingItemAnswered(qIdx, itemIdx) && tempReadingAnswer === optIdx
                      }
                    ]"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="loading">Загрузка экзамена...</div>

      <div class="navigation">
        <button
          class="nav-btn prev"
          :disabled="currentSectionIndex === 0 && currentQuestionIndex === 0"
          @click="prevQuestion"
        >
          Назад
        </button>
        <button
          class="nav-btn next"
          :class="{ primary: isLastQuestion }"
          @click="nextQuestion"
          :disabled="!canGoNext"
        >
          {{ isLastQuestion ? 'Завершить' : 'Далее' }}
        </button>
      </div>

      <!-- Модалка подтверждения выхода -->
      <div v-if="showExitConfirm" class="modal-overlay" @click.self="showExitConfirm = false">
        <div class="modal">
          <h3>Завершить экзамен?</h3>
          <p>Прогресс не сохранится</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="showExitConfirm = false">Отмена</button>
            <button class="confirm-btn" @click="exitExam">Выйти</button>
          </div>
        </div>
      </div>

      <!-- Модалка результатов -->
      <div v-if="showResults" class="modal-overlay" @click.self="showResults = false">
        <div class="modal results-modal">
          <h2>Результаты экзамена</h2>
          <div class="score-circle">
            <svg viewBox="0 0 100 100" width="120" height="120">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                :stroke="scoreColor"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="score-percent">{{ scorePercentage }}%</div>
          </div>
          <div class="score-stats">
            <p>Правильно: {{ correctCount }} из {{ totalQuestions }}</p>
          </div>
          <button class="btn btn-primary" @click="finishExam">На главную</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { useExamStore } from '@/stores/examStore'

// Типы для вопросов экзамена (упрощённо)
interface ExamQuestion {
  type: string
  question?: string
  options?: string[]
  answer?: number
  sentence?: string
  text?: string
  items?: { question: string; options: string[]; answer: number }[]
}

interface ExamSection {
  name: string
  questions: ExamQuestion[]
}

interface Exam {
  id: string
  title: string
  level: string
  sections: ExamSection[]
}

const router = useRouter()
const props = defineProps<{ id: string }>()

const examStore = useExamStore()
const exam = ref<Exam | null>(null)

const currentSectionIndex = ref(0)
const currentQuestionIndex = ref(0)
// Храним ответы пользователя: [sectionIndex][questionIndex] = answerIndex (для non-reading) или объект для reading
const userAnswers = ref<Record<number, Record<number, number>>>({})
const readingAnswers = ref<Record<number, Record<number, number>>>({}) // для reading: [qIdx][itemIdx] = answerIndex

const tempAnswer = ref<number | null>(null)
const tempTranslate = ref('')
const tempReadingAnswer = ref<number | null>(null)
const isAnswered = ref(false)

const showExitConfirm = ref(false)
const showResults = ref(false)

onMounted(async () => {
  await examStore.loadExams()
  exam.value = examStore.exams.find(e => e.id === props.id) as Exam | null
})

const currentSection = computed(() => exam.value?.sections[currentSectionIndex.value])

const isLastQuestion = computed(() => {
  if (!exam.value) return false
  return (
    currentSectionIndex.value === exam.value.sections.length - 1 &&
    currentQuestionIndex.value === (currentSection.value?.questions.length ?? 0) - 1
  )
})

const totalQuestions = computed(() => {
  if (!exam.value) return 0
  return exam.value.sections.reduce((acc, sec) => acc + sec.questions.length, 0)
})

const totalProgress = computed(() => {
  let answeredCount = 0
  if (!exam.value) return 0
  for (let s = 0; s < exam.value.sections.length; s++) {
    const section = exam.value.sections[s]
    for (let q = 0; q < section.questions.length; q++) {
      if (userAnswers.value[s]?.[q] !== undefined) answeredCount++
    }
  }
  return (answeredCount / totalQuestions.value) * 100
})

const canGoNext = computed(() => {
  const secIdx = currentSectionIndex.value
  const qIdx = currentQuestionIndex.value
  const question = currentSection.value?.questions[qIdx]
  if (!question) return false

  if (question.type === 'translate') {
    return userAnswers.value[secIdx]?.[qIdx] !== undefined
  } else if (question.type === 'reading') {
    const items = question.items
    if (!items) return false
    for (let i = 0; i < items.length; i++) {
      if (readingAnswers.value[qIdx]?.[i] === undefined) return false
    }
    return true
  } else {
    return userAnswers.value[secIdx]?.[qIdx] !== undefined
  }
})

const correctCount = computed(() => {
  let correct = 0
  if (!exam.value) return 0
  for (let s = 0; s < exam.value.sections.length; s++) {
    const section = exam.value.sections[s]
    for (let q = 0; q < section.questions.length; q++) {
      const question = section.questions[q]
      if (question.type === 'reading') {
        const items = question.items
        if (!items) continue
        for (let i = 0; i < items.length; i++) {
          if (readingAnswers.value[q]?.[i] === items[i].answer) correct++
        }
      } else {
        if (userAnswers.value[s]?.[q] === question.answer) correct++
      }
    }
  }
  return correct
})

const scorePercentage = computed(() => Math.round((correctCount.value / totalQuestions.value) * 100))
const circumference = 2 * Math.PI * 45
const dashOffset = computed(() => circumference - (scorePercentage.value / 100) * circumference)
const scoreColor = computed(() => {
  if (scorePercentage.value >= 80) return '#4caf50'
  if (scorePercentage.value >= 50) return '#ff9800'
  return '#f44336'
})

function answerQuestion(qIdx: number, optIdx: number): void {
  if (isAnswered.value) return
  const secIdx = currentSectionIndex.value
  if (!userAnswers.value[secIdx]) userAnswers.value[secIdx] = {}
  userAnswers.value[secIdx][qIdx] = optIdx
  isAnswered.value = true
  tempAnswer.value = optIdx
}

function submitTranslate(qIdx: number): void {
  if (!tempTranslate.value.trim()) return
  const secIdx = currentSectionIndex.value
  if (!userAnswers.value[secIdx]) userAnswers.value[secIdx] = {}
  userAnswers.value[secIdx][qIdx] = 1 // просто помечаем как отвеченное
  isAnswered.value = true
}

function answerReadingItem(qIdx: number, itemIdx: number, optIdx: number): void {
  if (!readingAnswers.value[qIdx]) readingAnswers.value[qIdx] = {}
  readingAnswers.value[qIdx][itemIdx] = optIdx
}

function isReadingItemAnswered(qIdx: number, itemIdx: number): boolean {
  return readingAnswers.value[qIdx]?.[itemIdx] !== undefined
}

function prevQuestion(): void {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  } else if (currentSectionIndex.value > 0) {
    currentSectionIndex.value--
    currentQuestionIndex.value = exam.value!.sections[currentSectionIndex.value].questions.length - 1
  }
  resetTemp()
}

function nextQuestion(): void {
  if (!canGoNext.value) return

  if (currentQuestionIndex.value < (currentSection.value?.questions.length ?? 0) - 1) {
    currentQuestionIndex.value++
  } else if (currentSectionIndex.value < (exam.value?.sections.length ?? 0) - 1) {
    currentSectionIndex.value++
    currentQuestionIndex.value = 0
  } else {
    showResults.value = true
    return
  }
  resetTemp()
}

function resetTemp(): void {
  tempAnswer.value = null
  tempTranslate.value = ''
  tempReadingAnswer.value = null
  isAnswered.value = false
}

function confirmExit(): void {
  showExitConfirm.value = true
}

function exitExam(): void {
  router.back()
}

function finishExam(): void {
  router.push('/main/exams')
}
</script>

<style scoped>
.exam-session {
  min-height: 100vh;
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
}

.progress-text {
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
.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.question-card {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  margin-bottom: 2rem;
}

.question-text, .sentence {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.option-btn {
  padding: 1rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 16px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.option-btn:hover:not(:disabled) {
  border-color: var(--level-accent);
  background: color-mix(in srgb, var(--level-accent) 5%, var(--surface));
}

.option-btn.selected {
  border-color: var(--level-accent);
  background: color-mix(in srgb, var(--level-accent) 10%, var(--surface));
}

.option-btn.correct {
  border-color: #4caf50;
  background: #e8f5e9;
  color: #2e7d32;
}
.option-btn.wrong {
  border-color: #f44336;
  background: #ffebee;
  color: #c62828;
}
.option-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.input {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.submit-btn {
  width: 100%;
}

.reading-text {
  background: var(--surface);
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  white-space: pre-wrap;
  line-height: 1.6;
}

.reading-item {
  margin-bottom: 2rem;
}

.reading-question {
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.navigation {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.nav-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--level-accent);
  background: color-mix(in srgb, var(--level-accent) 5%, var(--surface));
  transform: scale(1.02);
}
.nav-btn.primary {
  background: var(--level-accent);
  color: white;
  border-color: var(--level-accent);
}
.nav-btn.primary:hover:not(:disabled) {
  background: var(--level-accent);
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--level-accent);
}

/* Модальные окна */
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
}

.results-modal {
  max-width: 400px;
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
}

.cancel-btn {
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
}

.confirm-btn {
  background: #f44336;
  color: white;
}

.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
}

.score-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-primary);
}

.score-stats {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}
</style>