<template>
  <div class="lesson-screen" :style="{ backgroundColor: 'var(--bg-primary)' }">
    <div class="mobile-container">
      <div class="lesson-header">
        <button class="back-btn" @click="goBack">
          <ChevronLeft :size="28" />
        </button>
        <div class="page-indicator">
          <span
            v-for="n in totalPages"
            :key="n"
            class="dot"
            :class="{ active: currentPage === n }"
          ></span>
        </div>
      </div>

      <div class="lesson-content"
           @touchstart="handleTouchStart"
           @touchend="handleTouchEnd"
           v-if="lesson && currentPageData">
        <LessonPage 
          :page="currentPageData" 
          :grammarMeta="grammarMeta" 
          @practice="goToPractice" 
        />
      </div>
      <div v-else class="loading">Загрузка урока...</div>

      <div class="lesson-footer" v-if="currentPage < totalPages">
        <button
          class="nav-btn prev"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          <ChevronLeft :size="20" />
          <span>Назад</span>
        </button>
        <button
          class="nav-btn next"
          @click="nextPage"
        >
          <span>Далее</span>
          <ChevronRight :size="20" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useLessonsStore } from '@/stores/lessonsStore'
import { useVocabularyStore } from '@/stores/vocabularyStore'
import { useGrammarStore } from '@/stores/grammarStore'
import { useUserStore } from '@/stores/userStore'
import LessonPage from './LessonPage.vue'

const router = useRouter()
const props = defineProps<{ id: string }>()

const lessonsStore = useLessonsStore()
const vocabStore = useVocabularyStore()
const grammarStore = useGrammarStore()
const userStore = useUserStore()

const lesson = ref<any>(null)
const pages = ref<any[]>([])
const currentPage = ref(1)
const grammarMeta = ref<any>(null)

const touchStartX = ref(0)
const touchEndX = ref(0)

onMounted(async () => {
  await lessonsStore.loadAllLessons()
  lesson.value = await lessonsStore.getLessonById(props.id)

  if (lesson.value) {
    const savedPracticeIndex = userStore.getPracticeIndex(props.id)
    if (savedPracticeIndex !== undefined && lesson.value.exercises?.length && savedPracticeIndex < lesson.value.exercises.length) {
      router.replace(`/practice/${props.id}?start=${savedPracticeIndex}`)
      return
    }

    pages.value = await buildPages(lesson.value)
    grammarMeta.value = grammarStore.grammarMeta

    await userStore.saveLessonProgress(props.id, undefined, pages.value.length)

    const savedPage = userStore.getLessonProgress(props.id)
    if (savedPage && savedPage >= 1 && savedPage <= pages.value.length) {
      currentPage.value = savedPage
    } else {
      currentPage.value = 1
    }
  }
})

async function buildPages(lesson: any) {
  const pages = []
  pages.push({ type: 'title', title: lesson.title, description: `Урок ${lesson.lessonNumber}` })

  if (lesson.newWords?.length) {
    await vocabStore.loadVocabulary(lesson.hskLevel)
    const words = vocabStore.words.filter((w: any) => lesson.newWords.includes(w.id))
    pages.push({ type: 'vocabulary', words })
  }

  if (lesson.grammarPoints?.length) {
    await grammarStore.loadGrammar(lesson.hskLevel)
    const grammarPoints = grammarStore.grammarPoints.filter((g: any) => lesson.grammarPoints.includes(g.id))
    pages.push({ type: 'grammar', points: grammarPoints })
  }

  if (lesson.dialogues?.length) {
    lesson.dialogues.forEach((dialogue: any, index: number) => {
      pages.push({ type: 'dialogue', dialogue, index })
    })
  }

  pages.push({ type: 'completion' })
  return pages
}

const totalPages = computed(() => pages.value.length)
const currentPageData = computed(() => pages.value[currentPage.value - 1])

function goBack() {
  router.back()
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    userStore.saveLessonProgress(props.id, currentPage.value)
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    userStore.saveLessonProgress(props.id, currentPage.value)
  }
}

function goToPractice() {
  if (lesson.value?.exercises?.length) {
    router.push(`/practice/${props.id}`)
  } else {
    userStore.updateLessonProgress(lesson.value.id, 'completed')
    router.push('/main')
  }
}

function handleTouchStart(e: TouchEvent) {
  touchStartX.value = e.changedTouches[0].screenX
}

function handleTouchEnd(e: TouchEvent) {
  touchEndX.value = e.changedTouches[0].screenX
  handleSwipe()
}

function handleSwipe() {
  const threshold = 100;
  if (touchEndX.value < touchStartX.value - threshold) {
    nextPage();
  }
  if (touchEndX.value > touchStartX.value + threshold) {
    prevPage();
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  userStore.saveLessonProgress(props.id, currentPage.value)
  next()
})

onBeforeUnmount(() => {
  userStore.saveLessonProgress(props.id, currentPage.value)
})
</script>

<style scoped>
.lesson-screen {
  min-height: 100vh;
  transition: background-color 0.3s;
  padding: 1rem 0;
}
.lesson-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}
.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  color: var(--text-primary);
  transition: background 0.2s;
}
.back-btn:hover {
  background: color-mix(in srgb, var(--accent-color) 15%, transparent);
}
.page-indicator {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
  transition: all 0.2s;
}
.dot.active {
  width: 20px;
  background: var(--accent-color);
}
.lesson-content {
  margin-bottom: 2rem;
  min-height: 70vh;
}
.lesson-footer {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
.nav-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface);
  color: var(--text-primary);
  border: 2px solid var(--border);
  flex: 1;
  max-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.nav-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 5%, var(--surface));
  transform: scale(1.02);
}
.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}
</style>