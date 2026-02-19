export type HSKLevel = '1' | '2' | '3' | '4' | '5';

export interface HSKWord {
  id: number
  simplified: string
  pinyin: string
  translations: {
    ru: string
    en?: string
  }
  pos: string[]
  level: HSKLevel
  audioUrl?: string
}

export interface GrammarPoint {
  id: string
  pattern: string
  explanation: string
  examples: Array<{ chinese: string; pinyin: string; translation: string } | string>
  level: HSKLevel
}

export interface Dialogue {
  id: string
  lines: {
    speaker: string
    hanzi: string
    translation: string
  }[]
}

export interface Exercise {
  id: string
  type: 'choice' | 'fill' | 'order'
  question: string
  options?: string[]
  correctAnswer: string
}

export interface Lesson {
  id: string
  hskLevel: HSKLevel
  lessonNumber: number
  title: string
  newWords: number[]
  grammarPoints: string[] | GrammarPoint[]
  dialogues?: Dialogue[]
  exercises?: Exercise[]
}

export interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: number
}

export interface ReadingQuestion {
  question: {
    chinese: string
    pinyin: string
    ru: string
  }
  options: Array<{
    chinese: string
    pinyin: string
    ru: string
  }>
  answer: number
}

export interface Reading {
  id: string
  level: string
  title: string
  title_pinyin?: string
  title_ru?: string
  content: string
  pinyin?: string
  translation?: string
  questions: ReadingQuestion[]
}

export interface UserProgress {
  userId: string
  learnedWords: number[]
  lessonProgress: Record<string, 'not_started' | 'in_progress' | 'completed'>
  lessonProgressPage: Record<string, number>
  lessonPageCount: Record<string, number>
  lessonPracticeIndex: Record<string, number>
  streak: number
  xp: number
  achievements: Achievement[]
  lastVisitDate?: string
  unlockedLessons: string[]
  practiceStats?: { total: number; correct: number }
  completedReadings: string[]
  lessonPracticeStats: Record<string, { total: number; correct: number }> // новая статистика по урокам
}

export interface Exam {
  id: string
  title: string
  level: string
  sections: {
    name: string
    questions: any[]
  }[]
}

export interface ReviewItem {
  id?: number
  level: string
  type: string
  question: string
  options?: string[]
  answer: number | string
  sentence?: string
  pairs?: { chinese: string; pinyin: string }[]
  words?: string[]
  correctOrder?: number[]
}

export interface CustomExercise {
  id?: number
  level: string
  type: 'fill-blank' | 'sentence-order' | 'translate' | 'match-pinyin' | 'multiple-choice' | 'dialogue-comprehension'
  sentence?: string
  options?: string[]
  answer?: number | string
  words?: string[]
  correctOrder?: number[]
  question?: string
  pairs?: { chinese: string; pinyin: string }[]
  pinyin?: string
  dialogueRef?: number
}

export type ExerciseType = 'fill-blank' | 'sentence-order' | 'translate' | 'match-pinyin' | 'multiple-choice' | 'dialogue-comprehension'