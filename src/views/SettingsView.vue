<template>
  <div class="settings-view">
    <div class="settings-header">
      <button class="back-btn" @click="$router.back()">
        <ChevronLeft :size="24" />
      </button>
      <h2>Настройки</h2>
      <div class="placeholder"></div>
    </div>

    <div class="settings-content">
      <div class="setting-section">
        <label class="setting-label">Тема</label>
        <div class="theme-buttons">
          <button
            v-for="theme in themes"
            :key="theme.value"
            @click="setTheme(theme.value)"
            :class="['theme-btn', { active: currentTheme === theme.value }]"
          >
            <component :is="theme.icon" :size="18" />
            {{ theme.label }}
          </button>
        </div>
      </div>

      <div class="setting-section">
        <label class="setting-label">Размер шрифта</label>
        <div class="font-size-buttons">
          <button
            v-for="size in fontSizes"
            :key="size.value"
            @click="setFontSize(size.value)"
            :class="['font-btn', { active: currentFontSize === size.value }]"
          >
            {{ size.label }}
          </button>
        </div>
      </div>

      <div class="setting-section">
        <label class="setting-label">Цвет карточек</label>
        <div class="color-buttons">
          <button
            v-for="level in levels"
            :key="level"
            @click="setLevelColor(level)"
            :class="['color-btn', { active: currentLevel === level }]"
            :style="{ '--btn-color': getLevelColor(level) }"
          >
            <span class="color-dot"></span>
            <span>HSK {{ level }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="settings-footer">
      <button class="save-btn" @click="saveSettings">Сохранить</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/appStore'
import { useRouter } from 'vue-router'
import { ChevronLeft, Sun, Moon, Monitor } from 'lucide-vue-next'
import type { HSKLevel } from '@/types' // <-- импортируем правильный тип

type Theme = 'light' | 'dark' | 'system'
type FontSize = 'small' | 'medium' | 'large'

const appStore = useAppStore()
const router = useRouter()

const currentTheme = ref<Theme>(appStore.theme)
const currentFontSize = ref<FontSize>(appStore.fontSize)
const currentLevel = ref<HSKLevel>(appStore.currentHSKLevel) // теперь тип совпадает

const themes: { value: Theme; label: string; icon: any }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor }
]

const fontSizes: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Мелкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'large', label: 'Крупный' }
]

const levels: HSKLevel[] = ['1', '2', '3', '4', '5'] // теперь включает 5

function getLevelColor(level: HSKLevel): string {
  const colors: Record<HSKLevel, string> = {
    '1': '#4caf50',
    '2': '#319795',
    '3': '#7e57c2',
    '4': '#d46b7a',
    '5': '#ff9800'
  }
  return colors[level]
}

function setTheme(theme: Theme): void {
  currentTheme.value = theme
}

function setFontSize(size: FontSize): void {
  currentFontSize.value = size
  // Применяем размер шрифта через CSS-переменную
  const scale = size === 'small' ? 0.875 : size === 'large' ? 1.125 : 1
  document.documentElement.style.setProperty('--font-scale', scale.toString())
}

function setLevelColor(level: HSKLevel): void {
  currentLevel.value = level
}

function saveSettings(): void {
  appStore.theme = currentTheme.value
  appStore.fontSize = currentFontSize.value
  appStore.setHSKLevel(currentLevel.value)
  appStore.applyTheme()
  appStore.applyFontSize()
  router.back()
}
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 1rem;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: #333;
  transition: background 0.2s;
}

.dark .back-btn {
  color: #f5f5f5;
}

.back-btn:hover {
  background: rgba(0,0,0,0.05);
}

.settings-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--accent-color);
}

.placeholder {
  width: 40px;
}

.settings-content {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.dark .settings-content {
  background: #1e1e1e;
  color: #f5f5f5;
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.setting-label {
  font-weight: 500;
  color: #333;
}

.dark .setting-label {
  color: #ccc;
}

.theme-buttons,
.font-size-buttons,
.color-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.theme-btn,
.font-btn {
  flex: 1;
  min-width: 80px;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.dark .theme-btn,
.dark .font-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #ccc;
}

.theme-btn.active,
.font-btn.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: white;
}

.color-btn {
  flex: 1;
  min-width: 70px;
  padding: 0.75rem 0.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.dark .color-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #ccc;
}

.color-btn.active {
  border-color: var(--btn-color);
  background: color-mix(in srgb, var(--btn-color) 10%, white);
  color: var(--btn-color);
}

.dark .color-btn.active {
  background: color-mix(in srgb, var(--btn-color) 20%, #2a2a2a);
  color: white;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--btn-color);
  transition: transform 0.2s;
}

.color-btn.active .color-dot {
  transform: scale(1.2);
}

.settings-footer {
  display: flex;
  justify-content: center;
}

.save-btn {
  padding: 1rem 3rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px var(--accent-color);
}

.save-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 16px var(--accent-color);
}
</style>