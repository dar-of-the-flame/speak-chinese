<template>
  <button
    :class="[
      'lesson-card',
      statusClass,
      { 'self-start': index % 2 === 0, 'self-end': index % 2 !== 0 }
    ]"
    :disabled="lesson.locked"
    @click="!lesson.locked && emit('click')"
  >
    <!-- Кружок с процентом или иконка статуса -->
    <div class="absolute top-3 right-3">
      <Lock v-if="lesson.locked" class="w-5 h-5 text-white/80" />
      <div
        v-else-if="lesson.completed"
        class="progress-circle completed"
      >
        <CheckCircle class="w-5 h-5 text-white" />
      </div>
      <div
        v-else-if="lesson.inProgress"
        class="progress-circle"
        :style="{ '--progress': lesson.progress }"
      >
        <svg viewBox="0 0 36 36" class="circle-svg">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            stroke-width="2"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span class="progress-text">{{ lesson.progress }}%</span>
      </div>
      <div v-else class="progress-circle">
        <span class="progress-text">0%</span>
      </div>
    </div>

    <h3 class="font-bold text-xl leading-tight text-left text-white">
      {{ lesson.title }}
    </h3>

    <div>
      <div class="flex gap-1 mb-2">
        <Circle
          v-for="level in 3"
          :key="level"
          :size="10"
          :class="level <= lesson.difficulty ? 'filled' : ''"
        />
      </div>
      <span class="text-xs text-white/90 bg-black/20 px-2.5 py-1.5 rounded-full">
        HSK {{ lesson.hskLevel }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Lock, CheckCircle, Circle } from 'lucide-vue-next'

const props = defineProps<{
  lesson: {
    id: string
    title: string
    hskLevel: string
    difficulty: 1 | 2 | 3
    locked?: boolean
    completed?: boolean
    inProgress?: boolean
    progress?: number
  }
  index: number
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const statusClass = computed(() => {
  if (props.lesson.locked) return 'locked'
  if (props.lesson.completed) return 'completed'
  if (props.lesson.inProgress) return 'in-progress'
  return ''
})

const circumference = 2 * Math.PI * 16 // 2 * π * r
const dashOffset = computed(() => {
  if (!props.lesson.inProgress || props.lesson.progress === undefined) return circumference
  return circumference - (props.lesson.progress / 100) * circumference
})
</script>

<style scoped>
.lesson-card {
  position: relative;
  width: calc(45% - 0.75rem);
  aspect-ratio: 1 / 1;
  border-radius: 28px;
  padding: 1.25rem;
  box-shadow: var(--card-shadow);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  background: linear-gradient(145deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 70%, white));
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(2px);
  cursor: pointer;
}

.lesson-card:hover:not(:disabled) {
  transform: translateY(-6px);
  box-shadow: var(--card-hover-shadow);
}

.lesson-card:disabled {
  cursor: not-allowed;
}

.lesson-card.completed {
  border: 2px solid var(--accent-color);
}
.lesson-card.in-progress {
  border: 2px solid var(--accent-color);
}
.lesson-card.locked {
  opacity: 0.6;
  filter: grayscale(0.8);
}

.self-start { align-self: flex-start; }
.self-end { align-self: flex-end; }

.absolute { position: absolute; }
.top-3 { top: 0.75rem; }
.right-3 { right: 0.75rem; }
.flex { display: flex; }
.gap-1 { gap: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }

.text-white { color: white; }
.text-white\/80 { color: rgba(255,255,255,0.8); }
.text-white\/90 { color: rgba(255,255,255,0.9); }
.text-xs { font-size: 0.75rem; }
.font-bold { font-weight: 700; }
.bg-black\/20 { background: rgba(0,0,0,0.2); }
.px-2\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.rounded-full { border-radius: 9999px; }

.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }

:deep(.circle) {
  fill: white;
  color: rgba(255,255,255,0.4);
}
:deep(.filled) {
  fill: white;
  color: white;
}

/* Кружок с процентом */
.progress-circle {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-svg {
  width: 100%;
  height: 100%;
}

.progress-text {
  position: absolute;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
}

/* Адаптация для маленьких экранов */
@media (max-width: 480px) {
  .progress-circle {
    width: 32px;
    height: 32px;
  }
  .progress-text {
    font-size: 0.65rem;
  }
}

@media (max-width: 360px) {
  .progress-circle {
    width: 28px;
    height: 28px;
  }
  .progress-text {
    font-size: 0.6rem;
  }
}

.progress-circle.completed {
  background: transparent;
}
</style>