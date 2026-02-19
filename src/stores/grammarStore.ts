import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db'
import type { GrammarPoint } from '@/types'

import grammar1 from '@/data/grammar1.json'
import grammar2 from '@/data/grammar2.json'
import grammar3 from '@/data/grammar3.json'
import grammar4 from '@/data/grammar4.json'
import grammar5 from '@/data/grammar5.json'   // новый импорт

export const useGrammarStore = defineStore('grammar', () => {
  const grammarPoints = ref<GrammarPoint[]>([])
  const grammarMeta = ref<any>(null)
  const isLoading = ref(false)

  async function loadGrammar(level?: '1' | '2' | '3' | '4' | '5') {  // расширен тип
    isLoading.value = true
    const db = await initDB()
    let all = await db.getAll('grammar')
    if (all.length === 0) {
      await seedGrammar()
      all = await db.getAll('grammar')
    }
    grammarMeta.value = all.find(item => item.id === 'meta') || null
    const filtered = all.filter(item => item.id !== 'meta')
    
    if (level) {
      grammarPoints.value = filtered.filter(g => g.level === level)
    } else {
      grammarPoints.value = filtered
    }
    isLoading.value = false
  }

  async function seedGrammar() {
    const db = await initDB()
    const tx = db.transaction('grammar', 'readwrite')
    try {
      const levels = [
        { data: grammar1, level: '1' },
        { data: grammar2, level: '2' },
        { data: grammar3, level: '3' },
        { data: grammar4, level: '4' },
        { data: grammar5, level: '5' }
      ]
      for (const { data, level } of levels) {
        const withLevel = data.map((item: any) => ({ ...item, level }))
        for (const item of withLevel) {
          await tx.store.put(item)
        }
      }
      await tx.done
      console.log('Grammar seeded')
    } catch (error) {
      console.error('Error seeding grammar:', error)
    }
  }

  return {
    grammarPoints,
    grammarMeta,
    isLoading,
    loadGrammar,
    seedGrammar,
  }
})