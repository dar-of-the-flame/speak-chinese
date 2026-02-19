<template>
  <div class="character-drawing">
    <div v-if="characters.length > 0">
      <div class="progress-indicator" v-if="characters.length > 1">
        {{ currentIndex + 1 }} / {{ characters.length }}
      </div>
      <div ref="container" class="drawing-canvas"></div>
      <div v-if="result" class="feedback" :class="{ correct: result.passed }">
        {{ result.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import HanziWriter from 'hanzi-writer'

const props = defineProps<{ character: string }>()
const emit = defineEmits(['complete', 'mistake'])

const container = ref<HTMLElement>()
let writer: any = null
const result = ref<{ passed: boolean; message: string } | null>(null)
const currentIndex = ref(0)

const characters = computed(() => props.character.split(''))

async function initWriter() {
  if (!container.value) return
  container.value.innerHTML = ''

  try {
    writer = HanziWriter.create(container.value, characters.value[currentIndex.value], {
      width: 250,
      height: 250,
      padding: 5,
      strokeColor: '#333',
      showOutline: true,
      delayBetweenStrokes: 500,
    })

    // Запускаем режим проверки
    writer.quiz({
      onComplete: (summary: any) => {
        const passed = summary.total === summary.correct
        result.value = {
          passed,
          message: passed ? '✅ Правильно!' : `❌ Ошибок: ${summary.total - summary.correct}`,
        }

        if (passed) {
          // Если это был последний символ
          if (currentIndex.value === characters.value.length - 1) {
            setTimeout(() => emit('complete'), 1000)
          } else {
            // Переходим к следующему символу
            currentIndex.value++
            // Очищаем результат для нового символа
            result.value = null
            // Уничтожаем текущий writer и создаём новый для следующего символа
            if (writer && typeof writer.destroy === 'function') {
              writer.destroy()
            }
            initWriter()
          }
        } else {
          emit('mistake')
        }
      },
    })
  } catch (e) {
    console.error('Failed to create HanziWriter:', e)
  }
}

onMounted(() => {
  if (characters.value.length > 0) {
    initWriter()
  }
})

onUnmounted(() => {
  if (writer && typeof writer.destroy === 'function') {
    writer.destroy()
    writer = null
  }
})

watch(() => props.character, () => {
  currentIndex.value = 0
  if (writer && typeof writer.destroy === 'function') {
    writer.destroy()
    writer = null
  }
  if (characters.value.length > 0) {
    initWriter()
  }
})
</script>

<style scoped>
.character-drawing {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.drawing-canvas {
  width: 250px;
  height: 250px;
  background: #f5f5f5;
  border-radius: 16px;
  margin-bottom: 1rem;
}
.progress-indicator {
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: var(--text-secondary);
}
.feedback {
  font-size: 1.2rem;
}
.feedback.correct {
  color: #4caf50;
}
</style>