<template>
  <div class="character-review mobile-container">
    <div class="session-header">
      <button class="back-btn" @click="router.back()">
        <ChevronLeft :size="24" />
      </button>
      <div class="progress-indicator" v-if="inSession">
        {{ currentWordIndex + 1 }} / {{ sessionWords.length }}
      </div>
      <div class="placeholder"></div>
    </div>

    <!-- Экран настроек (если не в сессии) -->
    <div v-if="!inSession" class="settings-panel">
      <div v-if="characters.length === 0" class="empty-state">
        <p>У вас ещё нет изученных слов.</p>
        <p>Пройдите несколько уроков, чтобы появились слова для повторения.</p>
      </div>
      <template v-else>
        <h3>Выберите режимы</h3>
        <div class="modes-group">
          <label
            v-for="mode in modeOptions"
            :key="mode.value"
            class="custom-checkbox"
            :class="{ checked: selectedModes.includes(mode.value) }"
          >
            <input type="checkbox" :value="mode.value" v-model="selectedModes" />
            <span>{{ mode.label }}</span>
          </label>
        </div>

        <div class="count-input">
          <label>Количество слов (макс. {{ maxWords }}):</label>
          <input
            type="number"
            v-model.number="wordCount"
            :max="maxWords"
            min="1"
            @keyup.enter="startSession"
            placeholder="1"
          />
        </div>

        <button
          class="btn btn-primary start-btn"
          @click="startSession"
          :disabled="selectedModes.length === 0 || wordCount < 1 || wordCount > maxWords"
        >
          Начать
        </button>
      </template>
    </div>

    <!-- Сессия -->
    <div v-else class="session-area">
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: sessionProgress + '%' }"></div>
      </div>

      <div class="mode-block">
        <!-- Режим карточки -->
        <div v-if="currentMode === 'flashcard'" class="flashcard-mode">
          <div class="character-display" @click="showTranslation = !showTranslation">
            <span class="hanzi">{{ currentWord.simplified }}</span>
            <span v-if="showTranslation" class="translation">{{ currentWord.translations.ru }}</span>
          </div>
          <div class="pinyin">{{ currentWord.pinyin }}</div>
          <div class="actions">
            <button class="btn btn-outline" @click="playAudio">
              <Volume2 :size="20" /> Аудио
            </button>
            <button class="btn btn-outline stroke-btn" @click="openStrokeOrder">
              <PenTool :size="20" /> Порядок черт
            </button>
          </div>
        </div>

        <!-- Режим выбора перевода -->
        <div v-else-if="currentMode === 'choice-translate'" class="choice-mode">
          <div class="character-display">
            <span class="hanzi">{{ currentWord.simplified }}</span>
          </div>
          <div class="options-grid two-columns">
            <button
              v-for="(option, idx) in translateOptions"
              :key="idx"
              @click="handleChoiceAnswer(option, currentWord.translations.ru)"
              :class="['option-btn', { selected: selectedOption === option }]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Режим выбора иероглифа -->
        <div v-else-if="currentMode === 'choice-chinese'" class="choice-mode">
          <div class="question-text">{{ currentWord.translations.ru }}</div>
          <div class="options-grid two-columns">
            <button
              v-for="(option, idx) in chineseOptions"
              :key="idx"
              @click="handleChoiceAnswer(option, currentWord.simplified)"
              :class="['option-btn', { selected: selectedOption === option }]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Режим выбора пиньиня -->
        <div v-else-if="currentMode === 'choice-pinyin'" class="choice-mode">
          <div class="character-display">
            <span class="hanzi">{{ currentWord.simplified }}</span>
          </div>
          <div class="options-grid two-columns">
            <button
              v-for="(option, idx) in pinyinOptions"
              :key="idx"
              @click="handleChoiceAnswer(option, currentWord.pinyin)"
              :class="['option-btn', { selected: selectedOption === option }]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Режим прописи -->
        <div v-else-if="currentMode === 'drawing'" class="drawing-mode">
          <CharacterDrawing
            :character="currentWord.simplified"
            @complete="handleDrawingComplete"
            @mistake="handleMistake"
          />
        </div>

        <!-- Режим порядка черт -->
        <div v-else-if="currentMode === 'stroke'" class="stroke-mode">
          <div class="character-display">
            <span class="hanzi">{{ currentWord.simplified }}</span>
          </div>
          <button class="btn btn-primary" @click="openStrokeOrder">
            Показать порядок черт
          </button>
        </div>

        <!-- Режим аудирования -->
        <div v-else-if="currentMode === 'listening'" class="listening-mode">
          <div class="character-display">
            <span class="hanzi">{{ currentWord.simplified }}</span>
          </div>
          <button class="btn btn-primary" @click="playAudio">Прослушать</button>
          <p class="hint">Прослушайте произношение иероглифа</p>
        </div>
      </div>

      <!-- Навигация по режимам и словам (увеличенные кнопки) -->
      <div class="session-navigation">
        <button class="nav-btn" @click="prevStep" :disabled="!canGoPrev">
          <ChevronLeft :size="32" />
          <span>Назад</span>
        </button>
        <span class="mode-indicator">{{ currentModeLabel }} ({{ currentModeIndex + 1 }}/{{ selectedModes.length }})</span>
        <button class="nav-btn" @click="nextStep" :disabled="!canGoNext">
          <span>Далее</span>
          <ChevronRight :size="32" />
        </button>
      </div>
    </div>

    <!-- Модалка порядка черт -->
    <div v-if="showStrokeModal" class="modal-overlay" @click.self="showStrokeModal = false">
      <div class="modal stroke-modal">
        <div class="modal-header">
          <h3>{{ currentWord?.simplified }}</h3>
          <button class="btn-icon" @click="showStrokeModal = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <StrokeOrder :character="currentWord.simplified" :size="200" />
        </div>
      </div>
    </div>

    <!-- Модалка результатов -->
    <div v-if="showResultModal" class="modal-overlay" @click.self="showResultModal = false">
      <div class="modal results-modal">
        <h2>Результаты</h2>
        <p>Ошибок: {{ mistakeWords.length }} из {{ sessionWords.length }}</p>
        <div class="result-actions">
          <button v-if="mistakeWords.length" class="btn btn-primary" @click="repeatMistakes">
            Повторить ошибки
          </button>
          <button class="btn btn-outline" @click="resetSession">Завершить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { useAppStore } from '@/stores/appStore'
import { ChevronLeft, ChevronRight, PenTool, X, Volume2 } from 'lucide-vue-next'
import StrokeOrder from '@/components/ui/StrokeOrder.vue'
import CharacterDrawing from '@/components/ui/CharacterDrawing.vue'
import { speak } from '@/services/tts'

const router = useRouter()
const userStore = useUserStore()
const vocabStore = useVocabularyStore()
const appStore = useAppStore()

const characters = ref<any[]>([])
const inSession = ref(false)
const sessionWords = ref<any[]>([])
const currentWordIndex = ref(0)
const currentModeIndex = ref(0)
const selectedModes = ref<string[]>([])
const wordCount = ref(1)
const showStrokeModal = ref(false)
const selectedOption = ref<string | null>(null)
const showTranslation = ref(false)
const mistakeWords = ref<any[]>([])
const showResultModal = ref(false)

const modeOptions = [
  { value: 'flashcard', label: 'Карточка (иероглиф → перевод)' },
  { value: 'choice-translate', label: 'Выбор перевода' },
  { value: 'choice-chinese', label: 'Выбор иероглифа' },
  { value: 'choice-pinyin', label: 'Выбор пиньиня' },
  { value: 'drawing', label: 'Пропись' },
  { value: 'stroke', label: 'Порядок черт' },
  { value: 'listening', label: 'Аудирование' },
]

const maxWords = computed(() => characters.value.length)
const currentWord = computed(() => sessionWords.value[currentWordIndex.value])
const currentMode = computed(() => selectedModes.value[currentModeIndex.value])
const currentModeLabel = computed(() => modeOptions.find(m => m.value === currentMode.value)?.label || '')
const sessionProgress = computed(() => {
  if (sessionWords.value.length === 0) return 0
  return ((currentWordIndex.value + 1) / sessionWords.value.length) * 100
})

const canGoPrev = computed(() => currentWordIndex.value > 0 || currentModeIndex.value > 0)
const canGoNext = computed(() => {
  if (currentWordIndex.value < sessionWords.value.length - 1) return true
  if (currentModeIndex.value < selectedModes.value.length - 1) return true
  return false
})

const translateOptions = computed(() => {
  if (!currentWord.value) return []
  const correct = currentWord.value.translations.ru
  const levelWords = vocabStore.wordsByLevel.get(currentWord.value.level) || []
  const otherWords = levelWords.filter(w => w.id !== currentWord.value.id)
  const shuffled = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.translations.ru)
  return [correct, ...shuffled].sort(() => 0.5 - Math.random())
})

const chineseOptions = computed(() => {
  if (!currentWord.value) return []
  const correct = currentWord.value.simplified
  const levelWords = vocabStore.wordsByLevel.get(currentWord.value.level) || []
  const otherWords = levelWords.filter(w => w.id !== currentWord.value.id)
  const shuffled = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.simplified)
  return [correct, ...shuffled].sort(() => 0.5 - Math.random())
})

const pinyinOptions = computed(() => {
  if (!currentWord.value) return []
  const correct = currentWord.value.pinyin
  const levelWords = vocabStore.wordsByLevel.get(currentWord.value.level) || []
  const otherWords = levelWords.filter(w => w.id !== currentWord.value.id)
  const shuffled = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.pinyin)
  return [correct, ...shuffled].sort(() => 0.5 - Math.random())
})

onMounted(async () => {
  await vocabStore.loadVocabulary()
  const learnedIds = userStore.progress.learnedWords
  characters.value = vocabStore.words.filter(w => learnedIds.includes(w.id))
})

function startSession() {
  if (selectedModes.value.length === 0 || wordCount.value < 1 || wordCount.value > maxWords.value) return
  const shuffled = [...characters.value].sort(() => 0.5 - Math.random())
  sessionWords.value = shuffled.slice(0, wordCount.value)
  currentWordIndex.value = 0
  currentModeIndex.value = 0
  selectedOption.value = null
  showTranslation.value = false
  mistakeWords.value = []
  inSession.value = true
}

function prevStep() {
  if (currentModeIndex.value > 0) {
    currentModeIndex.value--
    resetModeState()
  } else if (currentWordIndex.value > 0) {
    currentWordIndex.value--
    currentModeIndex.value = selectedModes.value.length - 1
    resetModeState()
  }
}

function nextStep() {
  if (currentModeIndex.value < selectedModes.value.length - 1) {
    currentModeIndex.value++
    resetModeState()
  } else if (currentWordIndex.value < sessionWords.value.length - 1) {
    currentWordIndex.value++
    currentModeIndex.value = 0
    resetModeState()
  } else {
    inSession.value = false
    showResultModal.value = true
  }
}

function resetModeState() {
  selectedOption.value = null
  showTranslation.value = false
}

function handleChoiceAnswer(answer: string, correct: string) {
  if (selectedOption.value !== null) return
  selectedOption.value = answer
  if (answer === correct) {
    appStore.showToast('Верно!', 'success')
  } else {
    appStore.showToast('Ошибка!', 'error')
    handleMistake()
  }
}

function handleMistake() {
  if (!mistakeWords.value.find(w => w.id === currentWord.value.id)) {
    mistakeWords.value.push(currentWord.value)
  }
}

function handleDrawingComplete() {
  nextStep()
}

async function playAudio() {
  if (currentWord.value) {
    try {
      await speak(currentWord.value.simplified, 'zh-CN')
    } catch (error) {
      appStore.showToast('Ошибка воспроизведения аудио. Проверьте наличие китайского голоса в системе.', 'error')
      console.error('TTS error:', error)
    }
  }
}

function openStrokeOrder() {
  showStrokeModal.value = true
}

function repeatMistakes() {
  sessionWords.value = [...mistakeWords.value]
  mistakeWords.value = []
  currentWordIndex.value = 0
  currentModeIndex.value = 0
  inSession.value = true
  showResultModal.value = false
}

function resetSession() {
  showResultModal.value = false
}
</script>

<style scoped>
.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.character-review {
  padding: 1rem 0;
  min-height: 100vh;
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
  color: var(--accent-color);
}
.progress-indicator {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.placeholder {
  width: 40px;
}

/* Панель настроек */
.settings-panel {
  margin-top: 2rem;
}
.settings-panel h3 {
  margin-bottom: 1rem;
}
.modes-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.custom-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--surface);
  border-radius: 30px;
  border: 2px solid var(--border);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  color: var(--text-primary);
  user-select: none;
}
.custom-checkbox:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, var(--surface));
  border-color: var(--accent-color);
}
.custom-checkbox input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.custom-checkbox.checked {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
.count-input {
  margin-bottom: 2rem;
}
.count-input label {
  display: block;
  margin-bottom: 0.5rem;
}
.count-input input {
  padding: 0.8rem 1.2rem;
  border: 2px solid var(--border);
  border-radius: 30px;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 1.1rem;
  width: 100%;
  max-width: 200px;
}
.start-btn {
  width: 100%;
}
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

/* Сессия */
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
  background: var(--accent-color);
  transition: width 0.3s ease;
}
.mode-block {
  background: var(--bg-primary);
  border-radius: 32px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  margin-bottom: 2rem;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.character-display {
  text-align: center;
  cursor: pointer;
  margin-bottom: 1rem;
}
.hanzi {
  font-size: 6rem;
  font-weight: bold;
  color: var(--text-primary);
  display: block;
}
.translation {
  font-size: 2rem;
  color: var(--accent-color);
  margin-top: 1rem;
  display: block;
}
.pinyin {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}
.options-grid {
  display: grid;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}
.two-columns {
  grid-template-columns: 1fr 1fr;
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
.option-btn.selected {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 10%, var(--surface));
}
.option-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.question-text {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: var(--text-primary);
}
.hint {
  color: var(--text-secondary);
  margin-top: 1rem;
}

/* Увеличенные кнопки навигации */
.session-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 40px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;
  min-width: 120px;
  justify-content: center;
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
  transform: scale(1.02);
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mode-indicator {
  font-size: 1.2rem;
  color: var(--text-secondary);
  white-space: nowrap;
}
@media (max-width: 480px) {
  .nav-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    min-width: 90px;
  }
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}
.modal {
  background: var(--bg-primary);
  border-radius: 28px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.modal-header h3 {
  margin: 0;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
}
.stroke-modal .modal-body {
  display: flex;
  justify-content: center;
}
</style>