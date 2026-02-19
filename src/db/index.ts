import { openDB } from 'idb'

const DB_NAME = 'HSK_Trainer'
const DB_VERSION = 7  // увеличено с 6 до 7

export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`)

      // Создание хранилищ, если их нет
      if (!db.objectStoreNames.contains('vocabulary')) {
        const store = db.createObjectStore('vocabulary', { keyPath: 'id' })
        store.createIndex('by_level', 'level')
      }

      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'userId' })
      }

      if (!db.objectStoreNames.contains('lessons')) {
        const store = db.createObjectStore('lessons', { keyPath: 'id' })
        store.createIndex('by_hsk_level', 'hskLevel')
      }

      if (!db.objectStoreNames.contains('grammar')) {
        const store = db.createObjectStore('grammar', { keyPath: 'id' })
        store.createIndex('by_level', 'level')
      }

      if (!db.objectStoreNames.contains('readings')) {
        const store = db.createObjectStore('readings', { keyPath: 'id' })
        store.createIndex('by_level', 'level')
      }

      if (!db.objectStoreNames.contains('exams')) {
        const store = db.createObjectStore('exams', { keyPath: 'id' })
        store.createIndex('by_level', 'level')
      }

      if (!db.objectStoreNames.contains('reviewBank')) {
        const store = db.createObjectStore('reviewBank', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by_level', 'level')
        store.createIndex('by_type', 'type')
      }

      if (!db.objectStoreNames.contains('exercises')) {
        const store = db.createObjectStore('exercises', { keyPath: 'id' })
        store.createIndex('by_level', 'level')
        store.createIndex('by_type', 'type')
      }

      if (!db.objectStoreNames.contains('reviews')) {
        const store = db.createObjectStore('reviews', { keyPath: 'id' })
        store.createIndex('by_nextReview', 'nextReview')
        store.createIndex('by_itemId', 'itemId')
      }

      // При переходе на версию 7 очищаем все хранилища, чтобы перезалить актуальные данные
      if (oldVersion < 7) {
        console.log('Clearing all stores to force reseed on v7')
        const stores = [
          'vocabulary', 'lessons', 'grammar', 'readings', 
          'exams', 'exercises', 'reviews', 'progress', 'reviewBank'
        ]
        for (const storeName of stores) {
          if (db.objectStoreNames.contains(storeName)) {
            const store = transaction.objectStore(storeName)
            await store.clear()
          }
        }
      }
    },
  })
  return db
}