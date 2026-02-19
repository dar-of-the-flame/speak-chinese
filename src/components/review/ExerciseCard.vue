<template>
  <div class="exercise-card" :class="{ active: isActive }">
    <!-- fill-blank -->
    <div v-if="exercise.type === 'fill-blank'">
      <p class="sentence">{{ exercise.sentence }}</p>
      <p v-if="exercise.pinyin" class="sentence-pinyin">{{ exercise.pinyin }}</p>
      <div class="options">
        <button
          v-for="(opt, optIndex) in exercise.options"
          :key="optIndex"
          @click="selectOption(optIndex)"
          :class="[
            'option-btn',
            {
              correct: answered && isCorrect && optIndex === exercise.answer,
              wrong: answered && !isCorrect && selectedIdx === optIndex && optIndex !== exercise.answer,
              selected: !answered && selectedIdx === optIndex
            }
          ]"
        >
          {{ opt }}
        </button>
      </div>
    </div>

    <!-- multiple-choice -->
    <div v-else-if="exercise.type === 'multiple-choice'">
      <p class="question">{{ exercise.question }}</p>
      <p v-if="exercise.pinyin" class="sentence-pinyin">{{ exercise.pinyin }}</p>
      <div class="options">
        <button
          v-for="(opt, optIndex) in exercise.options"
          :key="optIndex"
          @click="selectOption(optIndex)"
          :class="[
            'option-btn',
            {
              correct: answered && isCorrect && optIndex === exercise.answer,
              wrong: answered && !isCorrect && selectedIdx === optIndex && optIndex !== exercise.answer,
              selected: !answered && selectedIdx === optIndex
            }
          ]"
        >
          {{ opt }}
        </button>
      </div>
    </div>

    <!-- dialogue-comprehension -->
    <div v-else-if="exercise.type === 'dialogue-comprehension'">
      <p class="question">{{ exercise.question }}</p>
      <div class="options">
        <button
          v-for="(opt, optIndex) in exercise.options"
          :key="optIndex"
          @click="selectOption(optIndex)"
          :class="[
            'option-btn',
            {
              correct: answered && isCorrect && optIndex === exercise.answer,
              wrong: answered && !isCorrect && selectedIdx === optIndex && optIndex !== exercise.answer,
              selected: !answered && selectedIdx === optIndex
            }
          ]"
        >
          {{ opt }}
        </button>
      </div>
    </div>

    <!-- sentence-order -->
    <div v-else-if="exercise.type === 'sentence-order'">
      <p class="instruction">Расположите слова в правильном порядке:</p>
      <div class="words-pool">
        <button
          v-for="(word, idx) in shuffledWords"
          :key="idx"
          @click="addWord(idx)"
          :disabled="answered && isCorrect"
          class="word-btn"
        >
          {{ word }}
        </button>
      </div>
      <div class="sentence-builder">
        <span v-for="(idx, i) in userOrder" :key="i" class="selected-word">
          {{ shuffledWords[idx] }}
          <button v-if="!answered || !isCorrect" @click="removeWord(i)" class="remove-word">✖</button>
        </span>
      </div>
      <div class="order-actions">
        <button class="btn btn-outline" @click="resetOrder" :disabled="answered && isCorrect">Сбросить</button>
        <button class="btn btn-primary" @click="checkOrder" :disabled="answered && isCorrect">Проверить</button>
      </div>
      <div v-if="showOrderError" class="feedback wrong">
        <span>❌ Неправильно, попробуйте снова</span>
      </div>
    </div>

    <!-- translate (исправлено: вопрос на китайском, ответ на русском) -->
    <div v-else-if="exercise.type === 'translate'">
      <p class="question">{{ exercise.answer }}</p>
      <input v-model="userAnswer" class="input" placeholder="Введите перевод" :disabled="answered && isCorrect" />
      <button class="btn btn-primary" @click="checkTranslate" :disabled="answered && isCorrect">Проверить</button>
      <div v-if="showTranslateError" class="feedback wrong">
        <span>❌ Неправильно, попробуйте снова</span>
      </div>
    </div>

    <!-- match-pinyin -->
    <div v-else-if="exercise.type === 'match-pinyin'" class="match-pinyin">
      <p class="instruction">Выберите пиньинь для каждого иероглифа:</p>
      <div v-for="(pair, pairIndex) in exercise.pairs" :key="pairIndex" class="match-row">
        <span class="chinese-char">{{ pair.chinese }}</span>
        <div class="pinyin-options">
          <button
            v-for="p in pinyinOptions"
            :key="p"
            @click="handlePinyinClick(pairIndex, p)"
            :class="[
              'pinyin-btn',
              { 
                active: userMatches[pairIndex] === p,
                correct: correctRows[pairIndex]
              }
            ]"
            :disabled="correctRows[pairIndex]"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- Неизвестный тип -->
    <div v-else class="error-placeholder">
      <p>⚠️ Неизвестный тип упражнения: {{ exercise.type }}</p>
    </div>

    <!-- feedback для правильного ответа -->
    <div v-if="answered && isCorrect" class="feedback correct">
      <span>✅ Верно!</span>
      <button class="btn btn-primary next-btn" @click="$emit('next')">Далее</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { CustomExercise } from '@/types'
import { useAppStore } from '@/stores/appStore'

const props = defineProps<{
  exercise: CustomExercise
  isActive: boolean
}>()

const emit = defineEmits<{
  (e: 'answered', isCorrect: boolean): void
  (e: 'next'): void
  (e: 'mistake'): void
}>()

const appStore = useAppStore()

const answered = ref(false)
const isCorrect = ref(false)
const selectedIdx = ref<number | null>(null)
const userAnswer = ref('')
const userMatches = ref<string[]>([])
const showOrderError = ref(false)
const showTranslateError = ref(false)

// Для sentence-order
const shuffledWords = ref<string[]>([])
const originalIndices = ref<number[]>([])
const userOrder = ref<number[]>([])

// Для match-pinyin
const pinyinOptions = computed(() => {
  if (props.exercise.type !== 'match-pinyin') return []
  return props.exercise.pairs?.map(p => p.pinyin) || []
})
const correctRows = ref<boolean[]>([])

onMounted(() => {
  resetForNewExercise()
})

watch(() => props.exercise, () => {
  resetForNewExercise()
})

function resetForNewExercise() {
  answered.value = false
  isCorrect.value = false
  selectedIdx.value = null
  userAnswer.value = ''
  userMatches.value = []
  userOrder.value = []
  showOrderError.value = false
  showTranslateError.value = false
  correctRows.value = []

  if (props.exercise.type === 'sentence-order' && props.exercise.words) {
    const words = props.exercise.words
    const indices = Array.from({ length: words.length }, (_, i) => i)
    // Перемешиваем индексы
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    originalIndices.value = indices
    shuffledWords.value = indices.map(i => words[i])
  }
  if (props.exercise.type === 'match-pinyin' && props.exercise.pairs) {
    userMatches.value = new Array(props.exercise.pairs.length).fill('')
    correctRows.value = new Array(props.exercise.pairs.length).fill(false)
  }
}

function selectOption(optIndex: number): void {
  if (answered.value && isCorrect.value) return
  selectedIdx.value = optIndex
  const correct = optIndex === (props.exercise as any).answer
  if (correct) {
    answered.value = true
    isCorrect.value = true
    emit('answered', true)
  } else {
    emit('mistake')
    appStore.showToast('Неверно, попробуйте ещё раз', 'error')
    selectedIdx.value = null
  }
}

// sentence-order
function addWord(index: number) {
  if (answered.value && isCorrect.value) return
  if (userOrder.value.includes(index)) return
  userOrder.value.push(index)
}
function removeWord(orderIndex: number) {
  if (answered.value && isCorrect.value) return
  userOrder.value.splice(orderIndex, 1)
}
function resetOrder() {
  if (answered.value && isCorrect.value) return
  userOrder.value = []
}
function checkOrder() {
  if (answered.value && isCorrect.value) return
  const correct = (props.exercise as any).correctOrder
  const userOriginalOrder = userOrder.value.map(idx => originalIndices.value[idx])
  const correctOrder = userOriginalOrder.length === correct.length && userOriginalOrder.every((val, idx) => val === correct[idx])
  if (correctOrder) {
    answered.value = true
    isCorrect.value = true
    emit('answered', true)
    showOrderError.value = false
  } else {
    emit('mistake')
    appStore.showToast('Неверный порядок, попробуйте снова', 'error')
    userOrder.value = []
    showOrderError.value = true
    setTimeout(() => {
      showOrderError.value = false
    }, 2000)
  }
}

// translate (исправлено: вопрос из exercise.answer, правильный ответ из exercise.question)
function checkTranslate() {
  if (answered.value && isCorrect.value) return
  const correct = (props.exercise as any).question // русский текст
  // Нормализация: убираем знаки препинания, лишние пробелы, приводим к нижнему регистру
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:]|[\s]+/g, ' ').trim()
  const normalizedUser = normalize(userAnswer.value)
  const normalizedCorrect = normalize(correct)
  if (normalizedUser === normalizedCorrect) {
    answered.value = true
    isCorrect.value = true
    emit('answered', true)
    showTranslateError.value = false
  } else {
    emit('mistake')
    appStore.showToast('Неверный перевод, попробуйте снова', 'error')
    showTranslateError.value = true
    setTimeout(() => {
      showTranslateError.value = false
    }, 2000)
  }
}

// match-pinyin
function handlePinyinClick(pairIndex: number, pinyin: string) {
  if (correctRows.value[pairIndex]) return
  const correct = props.exercise.pairs?.[pairIndex].pinyin
  if (pinyin === correct) {
    userMatches.value[pairIndex] = pinyin
    correctRows.value[pairIndex] = true
    if (correctRows.value.every(v => v)) {
      emit('answered', true)
      setTimeout(() => emit('next'), 500)
    }
  } else {
    emit('mistake')
    appStore.showToast(`Неверно, правильный: ${correct}`, 'error')
  }
}
</script>

<style scoped>
.sentence-pinyin {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  text-align: center;
}
.error-placeholder {
  text-align: center;
  padding: 2rem;
  color: red;
}

.exercise-card {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  max-width: 500px;
  margin: 0 auto;
  opacity: 0.5;
  transform: scale(0.95);
  transition: all 0.3s;
  font-size: 1.2rem;
}
.exercise-card.active {
  opacity: 1;
  transform: scale(1);
}
.sentence,
.question,
.instruction {
  font-size: 1.6rem;
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary);
  line-height: 1.4;
}
.options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.option-btn {
  padding: 1.2rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 1.2rem;
}
.option-btn.selected {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
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
  opacity: 0.5;
  cursor: default;
}
/* sentence-order */
.words-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: center;
  margin-bottom: 2rem;
}
.word-btn {
  padding: 0.8rem 1.5rem;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 1.2rem;
}
.word-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
}
.word-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.sentence-builder {
  min-height: 80px;
  background: var(--surface);
  border: 2px dashed var(--border);
  border-radius: 40px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
}
.selected-word {
  background: var(--accent-color);
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 40px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
}
.remove-word {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 0.3rem;
}
.order-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}
/* match-pinyin */
.match-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.chinese-char {
  font-size: 2rem;
  min-width: 80px;
  color: var(--text-primary);
}
.pinyin-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}
.pinyin-btn {
  padding: 0.5rem 1.2rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 1.2rem;
}
.pinyin-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.pinyin-btn.correct {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
  opacity: 0.7;
}
.pinyin-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
/* общие */
.input {
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid var(--border);
  border-radius: 40px;
  margin-bottom: 1.5rem;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 1.2rem;
}
.feedback {
  margin-top: 2.5rem;
  text-align: center;
  color: var(--text-primary);
  font-size: 1.4rem;
}
.feedback.correct {
  color: #4caf50;
}
.feedback.wrong {
  color: #f44336;
}
.next-btn {
  margin-top: 1.5rem;
}
.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px var(--accent-color);
  font-size: 1.2rem;
}
.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 16px var(--accent-color);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
  padding: 1rem 2rem;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;
}
.btn-outline:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}
.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>