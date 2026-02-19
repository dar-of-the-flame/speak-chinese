import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db'
import type { Lesson } from '@/types'
import lessons1 from '@/data/hsk1-lessons.json'
import lessons2 from '@/data/hsk2-lessons.json'
import lessons3 from '@/data/hsk3-lessons.json'
import lessons4 from '@/data/hsk4-lessons.json'
import lessons5 from '@/data/hsk5-lessons.json'   // новый импорт

export const useLessonsStore = defineStore('lessons', () => {
  const allLessons = ref<Lesson[]>([])
  const isLoading = ref(false)

  async function loadAllLessons() {
  isLoading.value = true
  const db = await initDB()
  let stored = await db.getAll('lessons')
  if (stored.length === 0) {
    await seedLessons()
    stored = await db.getAll('lessons')
  }
  console.log('[lessonsStore] loaded lessons:', stored.map(l => ({ id: l.id, level: l.hskLevel })))
  allLessons.value = stored.sort((a, b) => {
    if (a.hskLevel !== b.hskLevel) {
      return parseInt(a.hskLevel) - parseInt(b.hskLevel)
    }
    return a.lessonNumber - b.lessonNumber
  })
  isLoading.value = false
}

  async function seedLessons() {
    const db = await initDB()
    const tx = db.transaction('lessons', 'readwrite')
    try {
      const all = [...lessons1, ...lessons2, ...lessons3, ...lessons4, ...lessons5]
      for (const item of all) {
        await tx.store.put(item)
      }
      await tx.done
      console.log('Lessons seeded')
    } catch (error) {
      console.error('Error seeding lessons:', error)
    }
  }

  function getLessonsByLevel(level: string) {
    return allLessons.value.filter(l => l.hskLevel === level)
  }

  async function getLessonById(id: string) {
    if (allLessons.value.length === 0) {
      await loadAllLessons()
    }
    return allLessons.value.find(l => l.id === id)
  }

  return {
    allLessons,
    isLoading,
    loadAllLessons,
    getLessonsByLevel,
    getLessonById,
    seedLessons,
  }
})