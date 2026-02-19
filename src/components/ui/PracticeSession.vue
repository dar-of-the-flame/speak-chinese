<template>
  <div class="practice-session" :style="{ backgroundColor: 'var(--bg-primary)' }">
    <div class="mobile-container">
      <div class="session-header">
        <button class="back-btn" @click="exitPractice">
          <ChevronLeft :size="24" />
        </button>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ exercises.length }}</div>
        <div class="placeholder"></div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
      </div>

      <div v-if="exercises.length" class="exercise-wrapper">
        <ExerciseCard
          v-for="(ex, idx) in exercises"
          v-show="currentIndex === idx"
          :key="idx"
          :exercise="ex"
          :isActive="currentIndex === idx"
          @answered="handleAnswer"
          @next="nextCard"
          @mistake="handleMistake"
        />
      </div>
      <div v-else class="loading">В этом уроке нет упражнений</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useUserStore } from '@/stores/userStore'
import { ChevronLeft } from 'lucide-vue-next'
import ExerciseCard from '@/components/review/ExerciseCard.vue'

const router = useRouter()
const route = useRoute()
const props = defineProps<{ sessionId: string }>()

const lessonsStore = useLessonsStore()
const userStore = useUserStore()

const exercises = ref<any[]>([])
const currentIndex = ref(0)
const lesson = ref<any>(null)

const savedStats = userStore.getLessonPracticeStats(props.sessionId)
const correctCount = ref(savedStats.correct)
const totalAttempts = ref(savedStats.total)

const progress = computed(() => ((currentIndex.value + 1) / exercises.value.length) * 100)

onMounted(async () => {
  await lessonsStore.loadAllLessons()
  lesson.value = await lessonsStore.getLessonById(props.sessionId)
  if (lesson.value && lesson.value.exercises) {
    exercises.value = lesson.value.exercises
    const start = parseInt(route.query.start as string) || 0
    if (start >= 0 && start < exercises.value.length) {
      currentIndex.value = start
    }
  }
})

function handleAnswer(correct: boolean) {
  totalAttempts.value++
  if (correct) correctCount.value++
  userStore.addPracticeResult(correct)
  userStore.updateLessonPracticeStats(props.sessionId, correct)
}

function handleMistake() {
  // уже учтено в handleAnswer
}

function nextCard() {
  if (currentIndex.value < exercises.value.length - 1) {
    currentIndex.value++
    userStore.savePracticeIndex(props.sessionId, currentIndex.value)
  } else {
    userStore.clearPracticeIndex(props.sessionId)
    router.push(`/practice-result/${props.sessionId}`)
  }
}

function exitPractice() {
  userStore.savePracticeIndex(props.sessionId, currentIndex.value)
  router.push('/main')
}
</script>

<style scoped>
.practice-session {
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
  color: var(--accent-color);
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
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
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.exercise-wrapper {
  margin-top: 1rem;
}
</style>