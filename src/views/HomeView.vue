<template>
  <div class="home-view mobile-container">
    <div class="bg-elements">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
      <div class="bg-bubble bubble-1"></div>
      <div class="bg-bubble bubble-2"></div>
    </div>

    <div v-if="lessonsStore.isLoading" class="loading">Загрузка уроков...</div>
    <div v-else-if="lessonsForLevel.length === 0" class="placeholder">
      Нет уроков для HSK {{ appStore.currentHSKLevel }}
    </div>
    <div v-else class="lessons-container">
      <template v-for="(lesson, index) in enhancedLessons" :key="lesson.id">
        <div v-if="index > 0" class="connector-dots">
          <div class="connector-dot" />
          <div class="connector-dot" />
          <div class="connector-dot" />
        </div>
        <LessonCard
          :lesson="lesson"
          :index="index"
          @click="goToLesson(lesson)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/appStore'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useUserStore } from '@/stores/userStore'
import LessonCard from '@/components/ui/LessonCard.vue'

const router = useRouter()
const appStore = useAppStore()
const lessonsStore = useLessonsStore()
const userStore = useUserStore()

onMounted(() => {
  lessonsStore.loadAllLessons()
})

const lessonsForLevel = computed(() => 
  lessonsStore.getLessonsByLevel(appStore.currentHSKLevel)
    .sort((a, b) => a.lessonNumber - b.lessonNumber)
)

function isLevelCompleted(level: string): boolean {
  const levelLessons = lessonsStore.allLessons.filter(l => l.hskLevel === level)
  return levelLessons.every(l => userStore.progress.lessonProgress[l.id] === 'completed')
}

const enhancedLessons = computed(() => {
  return lessonsForLevel.value.map(lesson => {
    const status = userStore.progress.lessonProgress[lesson.id] || 'not_started'
    const inProgress = status === 'in_progress'
    const completed = status === 'completed'

    const currentLevelNum = parseInt(lesson.hskLevel)
    let levelLocked = false
    if (currentLevelNum > 1) {
      const prevLevel = (currentLevelNum - 1).toString() as '1'|'2'|'3'
      levelLocked = !isLevelCompleted(prevLevel)
    }

    let lessonLocked = false
    if (lesson.lessonNumber > 1) {
      const prevLessonId = `${lesson.hskLevel}-${lesson.lessonNumber - 1}`
      lessonLocked = userStore.progress.lessonProgress[prevLessonId] !== 'completed'
    }

    const locked = levelLocked || lessonLocked

    // Прогресс теории
    let theoryProgress = 0
    if (!locked && !completed) {
      const savedPage = userStore.getLessonProgress(lesson.id) || 1
      const totalTheoryPages = userStore.getLessonPageCount(lesson.id) || 1
      theoryProgress = Math.min(Math.round((savedPage / totalTheoryPages) * 100), 100)
    }

    // Прогресс практики
    let practiceProgress = 0
    const practiceIndex = userStore.getPracticeIndex(lesson.id)
    const exercisesCount = lesson.exercises?.length || 0
    if (practiceIndex !== undefined && practiceIndex < exercisesCount) {
      practiceProgress = Math.round((practiceIndex / exercisesCount) * 100)
    } else if (completed) {
      practiceProgress = 100
    }

    // Общий прогресс (теория 70%, практика 30%)
    const totalProgress = Math.round(theoryProgress * 0.7 + practiceProgress * 0.3)

    const difficulty = 2

    return {
      ...lesson,
      difficulty: difficulty as 1 | 2 | 3,
      locked,
      completed,
      inProgress: inProgress || (!locked && !completed && (theoryProgress > 0 || practiceProgress > 0)),
      progress: totalProgress
    }
  })
})

function goToLesson(lesson: any) {
  if (!lesson.locked) {
    router.push(`/lesson/${lesson.id}`)
  }
}
</script>

<style scoped>
.home-view {
  padding: 1rem 0 5rem 0;
  position: relative;
  min-height: 100vh;
}
.lessons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.connector-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 4px 0;
}
.connector-dot {
  width: 6px;
  height: 6px;
  background-color: var(--accent-color);
  border-radius: 50%;
  opacity: 0.6;
  box-shadow: 0 0 6px var(--accent-color);
}
.connector-dot:nth-child(2) {
  width: 8px;
  height: 8px;
  opacity: 0.9;
}
.loading, .placeholder {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 40px;
}
</style>