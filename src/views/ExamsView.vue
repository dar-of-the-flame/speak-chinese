<template>
  <div class="exams-view mobile-container">
    <SectionHeader title="Экзамены" @open-profile="$router.push('/profile')" />

    <div v-if="examStore.isLoading" class="loading">Загрузка...</div>
    <div v-else-if="!examStore.exams?.length" class="loading">Нет данных</div>
    <div v-else>
      <div class="levels-group">
        <label
          v-for="level in levelOptions"
          :key="level.value"
          class="custom-checkbox"
          :class="{ checked: selectedLevels.includes(level.value) }"
        >
          <input type="checkbox" :value="level.value" v-model="selectedLevels" />
          <span>HSK {{ level.label }}</span>
        </label>
      </div>

      <div v-if="filteredExams.length === 0" class="placeholder">
        Нет экзаменов для выбранных уровней.
      </div>
      <div v-else class="exam-list">
        <div v-for="exam in filteredExams" :key="exam.id" class="exam-card">
          <h3>{{ exam.title }}</h3>
          <p>Уровень HSK {{ exam.level }}</p>
          <button class="exam-btn" @click="startExam(exam)">Начать экзамен</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExamStore } from '@/stores/examStore'
import { useRouter } from 'vue-router'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import type { Exam } from '@/types'

const examStore = useExamStore()
const router = useRouter()

const levelOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' }
]
const selectedLevels = ref<string[]>(['1', '2', '3', '4', '5'])

const filteredExams = computed(() => {
  const exams = examStore.exams || []
  return exams.filter((e: Exam) => selectedLevels.value.includes(e.level))
})

onMounted(() => {
  examStore.loadExams()
})

function startExam(exam: Exam) {
  router.push(`/exam/${exam.id}`)
}
</script>

<style scoped>
.exams-view {
  padding: 1rem 0 80px;
}
.levels-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.exam-list {
  display: grid;
  gap: 1rem;
}
.exam-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--card-shadow);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.exam-card h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.exam-card p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}
.exam-btn {
  padding: 0.6rem 1.5rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 1000;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px var(--accent-color);
  display: inline-block;
  margin: 0 auto;
}
.exam-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 16px var(--card-bg);
}
.loading,
.placeholder {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 2rem;
}
</style>