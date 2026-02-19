import { createRouter, createWebHistory } from 'vue-router'
import SplashScreen from '@/views/SplashScreen.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import HomeView from '@/views/HomeView.vue'
import ReviewView from '@/views/ReviewView.vue'
import TextsView from '@/views/TextsView.vue'
import ExamsView from '@/views/ExamsView.vue'
import LessonScreen from '@/components/ui/LessonScreen.vue'
import PracticeSession from '@/components/ui/PracticeSession.vue'
import PracticeResult from '@/components/ui/PracticeResult.vue'
import ProfileView from '@/views/ProfileView.vue'
import ExamSession from '@/views/ExamSession.vue'
import CharacterReview from '@/views/CharacterReview.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'splash',
      component: SplashScreen
    },
    {
      path: '/main',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'review', name: 'review', component: ReviewView },
        { path: 'texts', name: 'texts', component: TextsView },
        { path: 'exams', name: 'exams', component: ExamsView }
      ]
    },
    {
      path: '/lesson/:id',
      name: 'lesson',
      component: LessonScreen,
      props: true
    },
    {
      path: '/practice/:sessionId',
      name: 'practice',
      component: PracticeSession,
      props: true
    },
    {
      path: '/practice-result/:sessionId',
      name: 'practice-result',
      component: PracticeResult,
      props: true
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    },
    {
      path: '/exam/:id',
      name: 'exam',
      component: ExamSession,
      props: true
    },
    {
      path: '/character-review',
      name: 'character-review',
      component: CharacterReview
    }
  ]
})

export default router