<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api'
import MorseSignal from '../components/MorseSignal.vue'
import type { Topic } from '../types'

const topics = ref<Topic[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    topics.value = await api<Topic[]>('/topics')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="mx-auto max-w-3xl p-4 sm:p-8">
    <header class="py-8">
      <MorseSignal />
      <h1 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Stuck for words?<br />
        <span class="text-primary">Help is on the way.</span>
      </h1>
      <p class="mt-3 text-base-content/70">
        Pick a topic and talk it through out loud. Your partner answers by voice and fixes your English as you go.
      </p>
    </header>

    <div v-if="loading" class="flex justify-center py-16">
      <MorseSignal animated />
    </div>
    <div v-else-if="error" role="alert" class="alert alert-error">{{ error }}</div>

    <div v-else class="grid gap-3">
      <RouterLink
        v-for="topic in topics"
        :key="topic.id"
        class="card card-border bg-base-100 transition hover:border-primary"
        :to="{ name: 'practice', params: { id: topic.id } }"
      >
        <div class="card-body flex-row items-center gap-4">
          <div class="grow">
            <h2 class="card-title text-lg">{{ topic.title }}</h2>
            <p class="text-sm text-base-content/60">{{ topic.situation }}</p>
          </div>
          <span aria-hidden="true" class="text-2xl text-primary">›</span>
        </div>
      </RouterLink>
    </div>
  </main>
</template>
