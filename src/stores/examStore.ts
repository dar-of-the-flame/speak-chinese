import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db'
import type { Exam } from '@/types'

import exam1list from '@/data/hsk1-exam.json'
import exam2list from '@/data/hsk2-exam.json'
import exam3list from '@/data/hsk3-exam.json'
import exam4list from '@/data/hsk4-exam.json'
import exam5list from '@/data/hsk5-exam.json'   // новый импорт

export const useExamStore = defineStore('exam', () => {
  const exams = ref<Exam[]>([])
  const isLoading = ref(false)

  async function loadExams(level?: string) {
    isLoading.value = true
    const db = await initDB()
    let all = await db.getAll('exams')
    console.log(`[examStore] loaded from DB: ${all.length} exams`)

    if (all.length === 0) {
      console.log('[examStore] no exams in DB, seeding...')
      await seedExams()
      all = await db.getAll('exams')
      console.log(`[examStore] after seeding: ${all.length} exams`)
    }

    if (level) {
      exams.value = all.filter(e => e.level === level)
      console.log(`[examStore] filtered for level ${level}: ${exams.value.length} exams`)
    } else {
      exams.value = all
      console.log(`[examStore] total exams: ${exams.value.length}`)
    }
    isLoading.value = false
  }

  async function seedExams() {
    console.log('[examStore] seeding exams...')
    console.log('exam1list length:', exam1list.length)
    console.log('exam2list length:', exam2list.length)
    console.log('exam3list length:', exam3list.length)
    console.log('exam4list length:', exam4list.length)
    console.log('exam5list length:', exam5list.length)   // добавили
    const db = await initDB()
    const tx = db.transaction('exams', 'readwrite')
    await tx.store.clear()
    const allExams = [...exam1list, ...exam2list, ...exam3list, ...exam4list, ...exam5list]
    console.log('[examStore] total exams to seed:', allExams.length)
    for (const exam of allExams) {
      await tx.store.put(exam)
    }
    await tx.done
    console.log('[examStore] seeding completed')
  }

  return {
    exams,
    isLoading,
    loadExams,
    seedExams,
  }
})