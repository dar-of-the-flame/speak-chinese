<template>
  <div v-if="isAppLoading" class="app-loading">
    <div class="spinner"></div>
    <p>Загрузка данных...</p>
  </div>
  <div v-else>
    <BackgroundElements />
    <router-view />
    <SettingsModal v-if="appStore.isSettingsOpen" @close="appStore.closeSettings" />
    <ToastContainer ref="toastContainer" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { initDB } from './db'
import { useAppStore } from './stores/appStore'
import { useVocabularyStore } from './stores/vocabularyStore'
import { useLessonsStore } from './stores/lessonsStore'
import { useGrammarStore } from './stores/grammarStore'
import { useExamStore } from './stores/examStore'
import { useReadingStore } from './stores/readingStore'
import { useExerciseStore } from './stores/exerciseStore'
import { useUserStore } from './stores/userStore'
import SettingsModal from '@/components/ui/SettingsModal.vue'
import BackgroundElements from '@/components/ui/BackgroundElements.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { isChineseVoiceAvailable} from '@/services/tts'

const appStore = useAppStore()
const isAppLoading = ref(true)
const toastContainer = ref<InstanceType<typeof ToastContainer>>()

onMounted(() => {
  appStore.toast = (message: string, type: any = 'info') => {
    toastContainer.value?.addToast({ message, type })
  }
  appStore.applyTheme()

  if (Capacitor.isNativePlatform()) {
    StatusBar.hide()
  }

  // Проверка TTS при старте
  checkTtsVoice()
})

async function checkTtsVoice() {
  const available = await isChineseVoiceAvailable()
  if (!available) {
    appStore.showToast('Китайский голос не найден. Установите его в настройках.', 'warning')
    // Можно предложить открыть настройки
    // Для этого добавим кнопку или отдельное модальное окно, но пока просто тост
  }
}

onMounted(async () => {
  try {
    await initDB()
    await Promise.all([
      useVocabularyStore().loadVocabulary(),
      useLessonsStore().loadAllLessons(),
      useGrammarStore().loadGrammar(),
      useExamStore().loadExams(),
      useReadingStore().loadReadings(),
      useExerciseStore().loadExercises(),
      useUserStore().loadProgress()
    ])
  } catch (error) {
    console.error('Error loading initial data:', error)
  } finally {
    isAppLoading.value = false
  }
})
</script>

<style scoped>
.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--level-bg);
}
.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0,0,0,0.1);
  border-top-color: var(--level-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>