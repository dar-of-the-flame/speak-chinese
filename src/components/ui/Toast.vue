<template>
  <transition name="toast">
    <div v-if="visible" class="toast" :class="type">
      {{ message }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}>()

const visible = ref(true)

onMounted(() => {
  setTimeout(() => {
    visible.value = false
  }, props.duration || 3000)
})
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 1rem;
  z-index: 2000;
  max-width: 80%;
  text-align: center;
  backdrop-filter: blur(10px);
}
.toast.success { background: rgba(76, 175, 80, 0.9); }
.toast.error { background: rgba(244, 67, 54, 0.9); }
.toast.warning { background: rgba(255, 152, 0, 0.9); }
.toast.info { background: rgba(33, 150, 243, 0.9); }

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>