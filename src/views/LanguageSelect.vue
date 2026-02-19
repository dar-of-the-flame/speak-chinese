<template>
  <div class="lang-select">
    <div class="modal-card">
      <h2>Выберите языки для изучения</h2>
      <p class="subtitle">Можно выбрать несколько</p>
      <div class="options">
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="toggleLang(lang.code)"
          :class="[
            'lang-btn',
            lang.code,
            { selected: selected.includes(lang.code) }
          ]"
        >
          {{ lang.name }}
        </button>
      </div>
      <button
        class="continue-btn"
        :disabled="selected.length === 0"
        @click="continueClick"
      >
        Продолжить ({{ selected.length }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/appStore'
import { useRouter } from 'vue-router'

const appStore = useAppStore()
const router = useRouter()

const languages = [
  { code: 'chinese', name: 'Китайский' },
  { code: 'english', name: 'Английский' },
  { code: 'russian', name: 'Русский' },
  { code: 'spanish', name: 'Испанский' },
  { code: 'french', name: 'Французский' },
  { code: 'german', name: 'Немецкий' }
]

const selected = ref<string[]>(appStore.targetLanguages || ['chinese'])

function toggleLang(code: string) {
  const index = selected.value.indexOf(code)
  if (index === -1) {
    selected.value.push(code)
  } else {
    selected.value.splice(index, 1)
  }
}

function continueClick() {
  appStore.targetLanguages = selected.value
  if (selected.value.length > 0) {
    appStore.targetLanguage = selected.value[0] as any
  }
  router.push('/main')
}
</script>

<style scoped>
.lang-select {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(145deg, #667eea, #764ba2);
  padding: 16px;
}
.modal-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 32px;
  padding: 40px 32px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
h2 {
  margin-bottom: 8px;
  color: #333;
  font-size: 1.8rem;
  font-weight: 600;
}
.subtitle {
  color: #666;
  margin-bottom: 32px;
  font-size: 1rem;
}
.options {
  display: grid;
  grid-template-columns: 1fr 1fr;       /* две колонки */
  gap: 12px;
  margin-bottom: 40px;
}
.lang-btn {
  padding: 16px 8px;
  border: none;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  opacity: 0.9;                          /* прозрачность */
  backdrop-filter: blur(2px);
  transform: translateY(0);
  will-change: transform;
}
/* Градиенты с полупрозрачностью */
.lang-btn.chinese { background: linear-gradient(145deg, rgba(67, 160, 71, 0.9), rgba(46, 125, 50, 0.9)); }
.lang-btn.english { background: linear-gradient(145deg, rgba(30, 136, 229, 0.9), rgba(21, 101, 192, 0.9)); }
.lang-btn.russian { background: linear-gradient(145deg, rgba(229, 57, 53, 0.9), rgba(198, 40, 40, 0.9)); }
.lang-btn.spanish { background: linear-gradient(145deg, rgba(255, 152, 0, 0.9), rgba(245, 124, 0, 0.9)); }
.lang-btn.french { background: linear-gradient(145deg, rgba(156, 39, 176, 0.9), rgba(123, 31, 162, 0.9)); }
.lang-btn.german { background: linear-gradient(145deg, rgba(255, 193, 7, 0.9), rgba(255, 179, 0, 0.9)); }

.lang-btn.selected {
  transform: translateY(-4px) scale(1.02);   /* параллакс */
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.3);
  border: 2px solid white;
  opacity: 1;
}
.lang-btn:hover {
  transform: translateY(-2px) scale(1.01);
  opacity: 1;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}
.continue-btn {
  padding: 18px 32px;
  background: linear-gradient(145deg, #2a5298, #1e3c72);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.3rem;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.continue-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.continue-btn:not(:disabled):hover {
  transform: scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}
</style>