import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db'
import type { CustomExercise } from '@/types'

import exercisesData from '@/data/exercises.json'

export const useExerciseStore = defineStore('exercise', () => {
  const exercises = ref<CustomExercise[]>([])
  const isLoading = ref(false)

  async function loadExercises(level?: string) {
    isLoading.value = true
    const db = await initDB()
    let all = await db.getAll('exercises')
    if (all.length === 0) {
      await seedExercises()
      all = await db.getAll('exercises')
    }
    if (level) {
      exercises.value = all.filter(e => e.level === level)
    } else {
      exercises.value = all
    }
    isLoading.value = false
  }

  async function seedExercises() {
    const db = await initDB()
    const tx = db.transaction('exercises', 'readwrite')
    try {
      for (const item of exercisesData) {
        await tx.store.put({ ...item, id: Date.now() + Math.random() })
      }
      await tx.done
      console.log('Exercises seeded')
    } catch (error) {
      console.error('Error seeding exercises:', error)
    }
  }

  return {
    exercises,
    isLoading,
    loadExercises,
    seedExercises, // ✅ экспортируем
  }
})