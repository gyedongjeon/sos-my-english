<script setup lang="ts">
import { onMounted } from 'vue'
import MorseSignal from '../components/MorseSignal.vue'
import { usePatternsStore } from '../stores/patterns'

// The sentence patterns, one CEFR level at a time, with how the last round of each went.
const store = usePatternsStore()

onMounted(() => store.load())
</script>

<template>
  <main class="mx-auto max-w-3xl p-4 sm:p-6">
    <h1 class="text-2xl font-semibold">Patterns</h1>
    <p class="text-sm text-base-content/70">
      Pick a sentence pattern. You see a sentence in your language and say it in English, five sentences a round.
    </p>

    <div v-if="store.loading" class="flex justify-center py-16">
      <MorseSignal animated />
    </div>
    <div v-else-if="store.error" role="alert" class="alert alert-error alert-soft mt-4">{{ store.error }}</div>

    <template v-else>
      <div class="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Levels">
        <button
          v-for="level in store.levels"
          :key="level"
          role="tab"
          :aria-selected="level === store.active"
          class="btn btn-sm rounded-full"
          :class="level === store.active ? 'btn-primary' : 'btn-ghost bg-base-100'"
          @click="store.level = level"
        >
          {{ level }}
        </button>
      </div>

      <ul class="mt-3 grid gap-3">
        <li v-for="p in store.shown" :key="p.id">
          <RouterLink
            class="card card-border bg-base-100 transition hover:border-primary"
            :to="{ name: 'pattern', params: { id: p.id } }"
          >
            <div class="card-body flex-row items-center gap-4">
              <div class="grow">
                <h2 class="card-title text-lg">{{ p.pattern }}</h2>
                <p class="text-sm text-base-content/60">{{ p.use }}</p>
              </div>
              <span
                v-if="p.sessions"
                class="badge badge-soft whitespace-nowrap"
                :class="p.last_correct === p.last_total ? 'badge-success' : 'badge-neutral'"
                :title="`Practised ${p.sessions} time${p.sessions === 1 ? '' : 's'}`"
              >
                {{ p.last_correct }}/{{ p.last_total }}
              </span>
              <span aria-hidden="true" class="text-2xl text-primary">›</span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </template>
  </main>
</template>
