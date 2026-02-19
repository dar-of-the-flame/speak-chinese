import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initDB } from '../db'
import type { HSKWord, HSKLevel } from '../types'
import hsk1 from '@/data/hsk1.json'
import hsk2 from '@/data/hsk2.json'
import hsk3 from '@/data/hsk3.json'
import hsk4 from '@/data/hsk4.json'
import hsk5 from '@/data/hsk5.json'

export const useVocabularyStore = defineStore('vocabulary', () => {
  const words = ref<HSKWord[]>([])
  const isLoading = ref(false)

  // Слова, сгруппированные по уровню
  const wordsByLevel = computed(() => {
    const map = new Map<HSKLevel, HSKWord[]>()
    for (const w of words.value) {
      const level = w.level
      if (!map.has(level)) map.set(level, [])
      map.get(level)!.push(w)
    }
    return map
  })

  async function loadVocabulary(level?: HSKLevel) {
    isLoading.value = true
    const db = await initDB()
    let allWords = await db.getAll('vocabulary')
    
    if (allWords.length === 0) {
      await seedVocabularyFromJson()
      allWords = await db.getAll('vocabulary')
    }
    
    console.log(`[vocabStore] loaded ${allWords.length} words from DB`)
    if (level) {
      words.value = allWords.filter(w => w.level === level)
      console.log(`[vocabStore] filtered for level ${level}: ${words.value.length} words`)
    } else {
      words.value = allWords
    }
    isLoading.value = false
  }

  async function seedVocabularyFromJson() {
    console.log('[vocabStore] seeding vocabulary...')
    const sources = [
      { name: 'hsk1', data: hsk1, expected: 150 },
      { name: 'hsk2', data: hsk2, expected: 150 },
      { name: 'hsk3', data: hsk3, expected: 300 },
      { name: 'hsk4', data: hsk4, expected: 600 },
      { name: 'hsk5', data: hsk5, expected: 1300 },
    ]
    for (const src of sources) {
      console.log(`${src.name} length:`, src.data.length, `expected ${src.expected}`)
    }

    const db = await initDB()
    const tx = db.transaction('vocabulary', 'readwrite')
    try {
      await tx.store.clear()
      
      const allWords: HSKWord[] = [
        ...hsk1.map((w: any) => ({ ...w, level: String(w.level) as HSKLevel })),
        ...hsk2.map((w: any) => ({ ...w, level: String(w.level) as HSKLevel })),
        ...hsk3.map((w: any) => ({ ...w, level: String(w.level) as HSKLevel })),
        ...hsk4.map((w: any) => ({ ...w, level: String(w.level) as HSKLevel })),
        ...hsk5.map((w: any) => ({ ...w, level: String(w.level) as HSKLevel }))
      ]
      console.log('[vocabStore] total words to seed:', allWords.length)
      
      let count = 0
      for (const w of allWords) {
        await tx.store.put(w)
        count++
      }
      await tx.done
      console.log(`[vocabStore] Seeded ${count} words`)

      const verifyDb = await initDB()
      const all = await verifyDb.getAll('vocabulary')
      console.log(`[vocabStore] verification: ${all.length} words in DB after seed`)
    } catch (error) {
      console.error('Error seeding vocabulary:', error)
    }
  }

  return {
    words,
    wordsByLevel,
    isLoading,
    loadVocabulary,
    seedVocabularyFromJson,
  }
})