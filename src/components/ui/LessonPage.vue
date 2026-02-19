<template>
  <div class="lesson-page">
    <!-- Титульная страница -->
    <div v-if="page.type === 'title'" class="title-page centered">
      <h2>{{ page.title }}</h2>
      <p>{{ page.description }}</p>
    </div>

    <!-- Страница с новыми словами -->
    <div v-else-if="page.type === 'vocabulary'" class="vocab-page centered">
      <h3>Новые слова</h3>
      <div v-for="word in page.words" :key="word.id" class="word-item">
        <div class="chinese-line">
          <span class="hanzi">{{ word.simplified }}</span>
          <span class="pinyin">{{ word.pinyin }}</span>
        </div>
        <span class="translation">{{ word.translations.ru }}</span>
      </div>
    </div>

    <!-- Страница с грамматикой -->
    <div v-else-if="page.type === 'grammar'" class="grammar-page centered">
      <div class="grammar-header">
        <h3>Грамматика</h3>
        <GrammarLegend v-if="grammarMeta" :meta="grammarMeta" />
      </div>
      <div v-for="point in page.points" :key="point.id" class="grammar-item">
        <p class="pattern">{{ point.pattern }}</p>
        <p class="explanation">{{ point.explanation }}</p>
        <ul class="examples">
          <li v-for="ex in point.examples" :key="ex">
            <template v-if="typeof ex === 'string'">{{ ex }}</template>
            <template v-else>
              <span class="example-chinese">{{ ex.chinese }}</span>
              <span class="example-pinyin" v-if="ex.pinyin"> ({{ ex.pinyin }})</span>
              <span class="example-translation" v-if="ex.translation"> – {{ ex.translation }}</span>
            </template>
          </li>
        </ul>
      </div>

      <!-- Примечание с сокращениями -->
      <div class="grammar-note">
        <h4>Сокращения:</h4>
        <p>S = Subject (подлежащее), N = Noun (существительное), V = Verb (глагол), Adj = Adjective (прилагательное), O = Object (дополнение), Prep = Preposition (предлог), Part = Particle (частица), M = Measure word (счётное слово), Num = Numeral (числительное), Pron = Pronoun (местоимение), Conj = Conjunction (союз), Adv = Adverb (наречие).</p>
      </div>
    </div>

    <!-- Страница с диалогом -->
    <div v-else-if="page.type === 'dialogue'" class="dialogue-page centered">
      <h3>Диалог</h3>
      <div v-for="(line, idx) in page.dialogue.lines" :key="idx" class="dialogue-line">
        <span class="speaker">{{ line.speaker }}:</span>
        <div class="chinese-block">
          <span class="chinese">{{ line.chinese }}</span>
          <span class="pinyin">{{ line.pinyin }}</span>
        </div>
        <button v-if="!showTranslations[Number(idx)]" class="show-translation-btn" @click="toggleTranslation(Number(idx))">
          <Eye :size="28" />
        </button>
        <span v-else class="translation">{{ line.russian }}</span>
      </div>
    </div>

    <!-- Страница завершения -->
    <div v-else-if="page.type === 'completion'" class="completion-page centered">
      <div class="check-circle">
        <CheckCircle :size="96" />
      </div>
      <h2>Урок завершён!</h2>
      <p>Вы готовы к практике</p>
      <button class="btn btn-primary" @click="$emit('practice')">Практика</button>
    </div>

    <!-- Неизвестный тип -->
    <div v-else class="unknown-page">
      <p>Неизвестный тип страницы: {{ page.type }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircle, Eye } from 'lucide-vue-next'
import GrammarLegend from '@/components/ui/GrammarLegend.vue'

const props = defineProps<{ page: any; grammarMeta?: any }>()

const showTranslations = ref<boolean[]>([])

watch(() => props.page, (newPage) => {
  if (newPage?.type === 'dialogue' && newPage.dialogue?.lines) {
    showTranslations.value = new Array(newPage.dialogue.lines.length).fill(false)
  }
}, { immediate: true })

function toggleTranslation(index: number) {
  showTranslations.value[index] = true
}
</script>

<style scoped>
.lesson-page {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: var(--card-shadow);
  min-height: 60vh;
  font-size: 1.2rem;
}

.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
}

.dark .lesson-page {
  background: #2a2a2a;
  color: #f5f5f5;
}

.title-page,
.completion-page {
  min-height: 50vh;
}

.vocab-page .word-item {
  width: 100%;
  max-width: 700px;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.vocab-page .word-item:last-child {
  border-bottom: none;
}

.chinese-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.hanzi {
  font-size: 2.8rem;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.2;
}

.pinyin {
  font-size: 1.8rem;
  color: var(--text-secondary);
  line-height: 1.2;
}

.translation {
  display: block;
  font-size: 1.6rem;
  color: var(--text-primary);
  text-align: left;
  padding-left: 0.5rem;
}

.grammar-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.grammar-item {
  margin-bottom: 2.5rem;
  padding: 2rem;
  background: var(--surface);
  border-radius: 20px;
  width: 100%;
  max-width: 700px;
}

.pattern {
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.explanation {
  font-size: 1.6rem;
  margin-bottom: 1rem;
}

.examples {
  margin-top: 1rem;
  padding-left: 2rem;
  color: var(--text-secondary);
  text-align: left;
  font-size: 1.5rem;
}

.example-chinese {
  font-weight: 500;
}
.example-pinyin {
  color: var(--text-secondary);
  font-style: italic;
  margin-left: 0.5rem;
}
.example-translation {
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.dialogue-line {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--surface);
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
}

.speaker {
  font-weight: bold;
  color: var(--accent-color);
  min-width: 100px;
  font-size: 1.6rem;
}

.chinese-block {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1rem;
  flex: 1;
}

.chinese {
  font-size: 2.2rem;
  color: var(--text-primary);
  line-height: 1.2;
}

.pinyin {
  font-size: 1.4rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-left: 0.2rem;
}

.show-translation-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent-color);
  margin-left: auto;
  display: flex;
  align-items: center;
  padding: 0.5rem;
}

.translation {
  color: var(--text-primary);
  margin-left: auto;
  font-style: italic;
  max-width: 300px;
  font-size: 1.6rem;
}

.completion-page .check-circle {
  color: #58cc02;
  margin-bottom: 2rem;
}

.unknown-page {
  padding: 3rem;
  text-align: center;
  color: red;
}

.grammar-note {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--surface);
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  font-size: 1.2rem;
  color: var(--text-secondary);
  border-left: 4px solid var(--accent-color);
}
.grammar-note h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--accent-color);
}

@media (max-width: 480px) {
  .hanzi { font-size: 2.2rem; }
  .pinyin { font-size: 1.5rem; }
  .translation { font-size: 1.4rem; }
}
</style>