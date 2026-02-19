import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db'
import { v4 as uuidv4 } from 'uuid'

export interface ReviewItem {
  id: string
  itemType: 'word' | 'grammar' | 'exercise'
  itemId: string | number
  level: string
  easiness: number
  interval: number
  repetitions: number
  nextReview: number
  lastReview: number
}

export const useReviewStore = defineStore('review', () => {
  const dueItems = ref<ReviewItem[]>([])

  async function loadDueItems() {
    const db = await initDB()
    const now = Date.now()
    const tx = db.transaction('reviews', 'readonly')
    const index = tx.store.index('by_nextReview')
    dueItems.value = await index.getAll(IDBKeyRange.upperBound(now))
  }

  async function addItem(item: Omit<ReviewItem, 'id' | 'easiness' | 'interval' | 'repetitions' | 'nextReview' | 'lastReview'>) {
    const db = await initDB()
    const newItem: ReviewItem = {
      id: uuidv4(),
      ...item,
      easiness: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: Date.now(),
      lastReview: 0,
    }
    await db.put('reviews', newItem)
  }

  async function updateReview(itemId: string, quality: number) {
    const db = await initDB()
    const item = await db.get('reviews', itemId)
    if (!item) return

    if (quality >= 3) {
      if (item.repetitions === 0) item.interval = 1
      else if (item.repetitions === 1) item.interval = 6
      else item.interval = Math.round(item.interval * item.easiness)
      item.repetitions++
    } else {
      item.repetitions = 0
      item.interval = 1
    }

    item.easiness = Math.max(1.3, item.easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    item.lastReview = Date.now()
    item.nextReview = item.lastReview + item.interval * 24 * 60 * 60 * 1000

    await db.put('reviews', item)
    await loadDueItems()
  }

  return { dueItems, loadDueItems, addItem, updateReview }
})