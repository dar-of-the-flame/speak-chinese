import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initDB } from '@/db'
import type { UserProgress } from '@/types'

export const useUserStore = defineStore('user', () => {
  const name = ref(localStorage.getItem('userName') || 'Пользователь')
  const avatar = ref(localStorage.getItem('userAvatar') || 'default')

  const progress = ref<UserProgress>({
    userId: 'default',
    learnedWords: [],
    lessonProgress: {},
    lessonProgressPage: {},
    lessonPageCount: {},
    lessonPracticeIndex: {},
    streak: 0,
    xp: 0,
    achievements: [],
    lastVisitDate: new Date().toDateString(),
    unlockedLessons: [],
    practiceStats: { total: 0, correct: 0 },
    completedReadings: [],
    lessonPracticeStats: {}
  })

  function updateName(newName: string) {
    name.value = newName
    localStorage.setItem('userName', newName)
  }

  function setAvatar(avatarValue: string) {
    avatar.value = avatarValue
    localStorage.setItem('userAvatar', avatarValue)
  }

  async function loadProgress() {
    const db = await initDB()
    const saved = await db.get('progress', 'default')
    if (saved) {
      progress.value = {
        ...saved,
        achievements: saved.achievements || [],
        unlockedLessons: saved.unlockedLessons || [],
        practiceStats: saved.practiceStats || { total: 0, correct: 0 },
        completedReadings: saved.completedReadings || [],
        lessonProgressPage: saved.lessonProgressPage || {},
        lessonPageCount: saved.lessonPageCount || {},
        lessonPracticeIndex: saved.lessonPracticeIndex || {},
        lessonPracticeStats: saved.lessonPracticeStats || {}
      }
      if (progress.value.unlockedLessons.length === 0) {
        progress.value.unlockedLessons.push('1-1')
      }
      updateStreak()
    } else {
      progress.value.unlockedLessons = ['1-1']
      const copy = JSON.parse(JSON.stringify(progress.value))
      await db.put('progress', copy)
    }
  }

  async function saveProgress() {
    const db = await initDB()
    const copy = JSON.parse(JSON.stringify(progress.value))
    await db.put('progress', copy)
  }

  function updateStreak() {
    const today = new Date().toDateString()
    const last = progress.value.lastVisitDate
    if (!last) {
      progress.value.streak = 1
    } else {
      const lastDate = new Date(last)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        progress.value.streak += 1
      } else if (diffDays > 1) {
        progress.value.streak = 1
      }
    }
    progress.value.lastVisitDate = today
    saveProgress()
  }

  async function addLearnedWord(wordId: number) {
    if (!progress.value.learnedWords.includes(wordId)) {
      progress.value.learnedWords.push(wordId)
      progress.value.xp += 10
      await checkAchievements()
      await saveProgress()
    }
  }

  async function updateLessonProgress(
    lessonId: string,
    status: 'not_started' | 'in_progress' | 'completed',
    newWords?: number[]
  ) {
    progress.value.lessonProgress[lessonId] = status
    if (status === 'completed') {
      progress.value.xp += 50
      unlockNextLesson(lessonId)
      if (newWords) {
        for (const wordId of newWords) {
          if (!progress.value.learnedWords.includes(wordId)) {
            progress.value.learnedWords.push(wordId)
          }
        }
      }
      delete progress.value.lessonPracticeIndex[lessonId]
      delete progress.value.lessonProgressPage[lessonId]
      await checkAchievements()
    }
    await saveProgress()
  }

  function unlockNextLesson(completedLessonId: string) {
    const parts = completedLessonId.split('-')
    if (parts.length === 2) {
      const level = parts[0]
      const num = parseInt(parts[1])
      const nextId = `${level}-${num + 1}`
      if (!progress.value.unlockedLessons.includes(nextId)) {
        progress.value.unlockedLessons.push(nextId)
      }
    }
  }

  async function saveLessonProgress(lessonId: string, page?: number, totalPages?: number) {
    if (page !== undefined) {
      progress.value.lessonProgressPage[lessonId] = page
    }
    if (totalPages !== undefined) {
      progress.value.lessonPageCount[lessonId] = totalPages
    }
    await saveProgress()
  }

  function getLessonProgress(lessonId: string): number | undefined {
    return progress.value.lessonProgressPage?.[lessonId]
  }

  function getLessonPageCount(lessonId: string): number | undefined {
    return progress.value.lessonPageCount?.[lessonId]
  }

  async function savePracticeIndex(lessonId: string, index: number) {
    progress.value.lessonPracticeIndex[lessonId] = index
    await saveProgress()
  }

  function getPracticeIndex(lessonId: string): number | undefined {
    return progress.value.lessonPracticeIndex?.[lessonId]
  }

  async function clearPracticeIndex(lessonId: string) {
    delete progress.value.lessonPracticeIndex[lessonId]
    await saveProgress()
  }

  // Методы для поурочной статистики
  function getLessonPracticeStats(lessonId: string): { total: number; correct: number } {
    return progress.value.lessonPracticeStats[lessonId] || { total: 0, correct: 0 }
  }

  async function updateLessonPracticeStats(lessonId: string, correct: boolean) {
    if (!progress.value.lessonPracticeStats[lessonId]) {
      progress.value.lessonPracticeStats[lessonId] = { total: 0, correct: 0 }
    }
    progress.value.lessonPracticeStats[lessonId].total++
    if (correct) {
      progress.value.lessonPracticeStats[lessonId].correct++
    }
    await saveProgress()
  }

  async function resetLessonPracticeStats(lessonId: string) {
    delete progress.value.lessonPracticeStats[lessonId]
    await saveProgress()
  }

  async function checkAchievements() {
    const achievements = progress.value.achievements
    if (!achievements.find(a => a.id === 'first10')) {
      if (progress.value.learnedWords.length >= 10) {
        achievements.push({
          id: 'first10',
          icon: '🎓',
          title: 'Первый шаг',
          description: 'Выучить 10 слов',
          unlocked: true,
          unlockedAt: Date.now(),
        })
      }
    }
    if (!achievements.find(a => a.id === 'streak3')) {
      if (progress.value.streak >= 3) {
        achievements.push({
          id: 'streak3',
          icon: '🔥',
          title: 'Огонёк',
          description: 'Заниматься 3 дня подряд',
          unlocked: true,
          unlockedAt: Date.now(),
        })
      }
    }
    if (!achievements.find(a => a.id === 'words50')) {
      if (progress.value.learnedWords.length >= 50) {
        achievements.push({
          id: 'words50',
          icon: '🏆',
          title: 'Лингвист',
          description: 'Выучить 50 слов',
          unlocked: true,
          unlockedAt: Date.now(),
        })
      }
    }
  }

  async function addPracticeResult(correct: boolean) {
    if (!progress.value.practiceStats) {
      progress.value.practiceStats = { total: 0, correct: 0 }
    }
    progress.value.practiceStats.total++
    if (correct) {
      progress.value.practiceStats.correct++
      progress.value.xp += 5
    }
    await saveProgress()
  }

  async function addCompletedReading(readingId: string) {
    if (!progress.value.completedReadings.includes(readingId)) {
      progress.value.completedReadings.push(readingId)
      await saveProgress()
    }
  }

  function isReadingCompleted(readingId: string): boolean {
    return progress.value.completedReadings.includes(readingId)
  }

  async function resetProgress() {
    progress.value = {
      userId: 'default',
      learnedWords: [],
      lessonProgress: {},
      lessonProgressPage: {},
      lessonPageCount: {},
      lessonPracticeIndex: {},
      streak: 0,
      xp: 0,
      achievements: [],
      lastVisitDate: new Date().toDateString(),
      unlockedLessons: ['1-1'],
      practiceStats: { total: 0, correct: 0 },
      completedReadings: [],
      lessonPracticeStats: {}
    }
    await saveProgress()
  }

  return {
    name,
    avatar,
    progress,
    updateName,
    setAvatar,
    loadProgress,
    addLearnedWord,
    updateLessonProgress,
    addPracticeResult,
    addCompletedReading,
    isReadingCompleted,
    resetProgress,
    saveLessonProgress,
    getLessonProgress,
    getLessonPageCount,
    savePracticeIndex,
    getPracticeIndex,
    clearPracticeIndex,
    getLessonPracticeStats,
    updateLessonPracticeStats,
    resetLessonPracticeStats,
  }
})