import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db'
import type { Reading } from '@/types'

import readings from '@/data/hsk-reading.json'

export const useReadingStore = defineStore('reading', () => {
  const readingsData = ref<Reading[]>([])
  const isLoading = ref(false)

  async function loadReadings(level?: string) {
    isLoading.value = true
    const db = await initDB()
    let all = await db.getAll('readings')
    if (all.length === 0) {
      await seedReadings()
      all = await db.getAll('readings')
    }
    console.log('[readingStore] loaded readings:', all.map(r => ({ id: r.id, level: r.level })))
    if (level) {
      readingsData.value = all.filter(r => r.level === level)
    } else {
      readingsData.value = all
    }
    isLoading.value = false
  }

  async function seedReadings() {
    const db = await initDB()
    const tx = db.transaction('readings', 'readwrite')
    try {
      for (const item of readings) {
        await tx.store.put(item)
      }
      await tx.done
      console.log('Readings seeded')
    } catch (error) {
      console.error('Error seeding readings:', error)
    }
  }

  return {
    readings: readingsData,
    isLoading,
    loadReadings,
    seedReadings,
  }
})