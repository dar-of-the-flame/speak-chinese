<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Настройки</h3>
        <button class="btn-icon" @click="$emit('close')">
          <X :size="24" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Тема -->
        <div class="setting-section">
          <label class="setting-label">Тема</label>
          <div class="theme-buttons">
            <button
              v-for="t in themes"
              :key="t.value"
              @click="setTheme(t.value)"
              :class="['btn', { active: currentTheme === t.value }]"
            >
              <component :is="t.icon" :size="18" />
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- Размер шрифта -->
        <div class="setting-section">
          <label class="setting-label">Размер шрифта</label>
          <div class="font-size-buttons">
            <button
              v-for="s in fontSizes"
              :key="s.value"
              @click="setFontSize(s.value)"
              :class="['btn', { active: currentFontSize === s.value }]"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <!-- Цветовая схема (акцент) -->
        <div class="setting-section">
          <label class="setting-label">Цветовая схема</label>
          <div class="color-buttons">
            <button
              v-for="scheme in colorSchemes"
              :key="scheme.value"
              @click="selectColorScheme(scheme.value)"
              :class="['color-btn', { active: currentColorScheme === scheme.value }]"
              :style="{ backgroundColor: scheme.color }"
              :title="scheme.label"
            ></button>
          </div>
        </div>

        <!-- Дополнительные настройки -->
        <div class="setting-section">
          <label class="setting-label">Обслуживание</label>
          <button class="btn btn-outline reset-btn" @click="confirmReset">
            <RotateCcw :size="18" />
            Сбросить базу данных
          </button>
          <p class="reset-note">Очистит все данные и перезагрузит учебные материалы.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">Отмена</button>
        <button class="btn btn-primary" @click="saveSettings">Сохранить</button>
      </div>
    </div>

    <!-- Модалка подтверждения сброса -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal confirm-modal">
        <h3>Сбросить базу данных?</h3>
        <p>Все прогресс и настройки будут удалены, и данные будут загружены заново.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showResetConfirm = false">Отмена</button>
          <button class="btn btn-danger" @click="resetDatabase">Сбросить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore, type ColorScheme } from '@/stores/appStore'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useGrammarStore } from '@/stores/grammarStore'
import { useExamStore } from '@/stores/examStore'
import { useReadingStore } from '@/stores/readingStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useUserStore } from '@/stores/userStore'
import { initDB } from '@/db'
import { X, Sun, Moon, Monitor, RotateCcw } from 'lucide-vue-next'

const appStore = useAppStore()
const emit = defineEmits<{ (e: 'close'): void }>()

const currentTheme = ref<'light' | 'dark' | 'system'>(appStore.theme)
const currentFontSize = ref<'small' | 'medium' | 'large'>(appStore.fontSize)
const currentColorScheme = ref<ColorScheme>(appStore.colorScheme)

const showResetConfirm = ref(false)

const themes = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor }
] as const

const fontSizes = [
  { value: 'small', label: 'Мелкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'large', label: 'Крупный' }
] as const

const colorSchemes: { value: ColorScheme; label: string; color: string }[] = [
  { value: 'green', label: 'Зелёный', color: '#4caf50' },
  { value: 'teal', label: 'Бирюзовый', color: '#319795' },
  { value: 'purple', label: 'Фиолетовый', color: '#7e57c2' },
  { value: 'pink', label: 'Розовый', color: '#d46b7a' },
  { value: 'orange', label: 'Оранжевый', color: '#ff9800' }
]

function setTheme(theme: typeof currentTheme.value) {
  currentTheme.value = theme
}

function setFontSize(size: typeof currentFontSize.value) {
  currentFontSize.value = size
}

function selectColorScheme(scheme: ColorScheme) {
  currentColorScheme.value = scheme
}

function saveSettings() {
  appStore.theme = currentTheme.value
  appStore.fontSize = currentFontSize.value
  appStore.applyColorScheme(currentColorScheme.value)
  appStore.applyTheme()
  appStore.applyFontSize()
  emit('close')
}

function confirmReset() {
  showResetConfirm.value = true
}

async function resetDatabase() {
  showResetConfirm.value = false
  emit('close')

  const db = await initDB()
  const stores = ['vocabulary', 'lessons', 'grammar', 'readings', 'exams', 'exercises', 'progress', 'reviews', 'reviewBank']
  const tx = db.transaction(stores, 'readwrite')
  for (const store of stores) {
    await tx.objectStore(store).clear()
  }
  await tx.done

  await useVocabularyStore().seedVocabularyFromJson()
  await useLessonsStore().seedLessons()
  await useGrammarStore().seedGrammar()
  await useExamStore().seedExams()
  await useReadingStore().seedReadings()
  await useExerciseStore().seedExercises()

  await useUserStore().resetProgress()
  window.location.reload()
}
</script>

<style scoped>
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
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 28px 28px 0 0;
  z-index: 1;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.btn-icon {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  color: var(--accent-color);
  transition: background 0.2s;
}

.btn-icon:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}

.modal-body {
  padding: 1.5rem;
}

.setting-section {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--text-primary);
}

.theme-buttons,
.font-size-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.color-btn {
  width: 100px;
  height: 60px;
  border-radius: 32px;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn.active {
  border-color: var(--text-secondary);
  transform: scale(1.1);
}

.color-btn:hover {
  transform: scale(1.05);
}

.btn {
  flex: 1;
  min-width: 80px;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.btn.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: white;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}

.btn-outline:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 10%, transparent);
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px var(--accent-color);
}

.btn-danger {
  background: #f44336;
  color: white;
  border: none;
}

.btn-danger:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px #f44336;
}

.reset-btn {
  width: 100%;
  margin-bottom: 0.5rem;
}

.reset-note {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border);
  position: sticky;
  bottom: 0;
  background: inherit;
  border-radius: 0 0 28px 28px;
}

.confirm-modal {
  max-width: 400px;
  padding: 2rem;
  text-align: center;
}

.confirm-modal h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.confirm-modal p {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>