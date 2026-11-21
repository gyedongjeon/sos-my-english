<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MorseSignal from '../components/MorseSignal.vue'
import { useTopicsStore } from '../stores/topics'

const store = useTopicsStore()

// The form for a topic of the learner's own, shown on request.
const writing = ref(false)
const draft = reactive({ title: '', situation: '', opener: '' })
// The own topic whose "Delete" was pressed once; deleting takes a second press.
const confirming = ref<number | null>(null)

function open() {
  store.addError = ''
  writing.value = true
}

async function add() {
  if (!(await store.add(draft))) return
  Object.assign(draft, { title: '', situation: '', opener: '' })
  writing.value = false
}

async function remove(id: number) {
  await store.remove(id)
  confirming.value = null
}

onMounted(() => store.load())
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

    <div v-if="store.loading" class="flex justify-center py-16">
      <MorseSignal animated />
    </div>

    <div v-else class="grid gap-3">
      <div v-if="store.error" role="alert" class="alert alert-error alert-soft">{{ store.error }}</div>

      <div v-for="topic in store.topics" :key="topic.id" class="card card-border bg-base-100 transition hover:border-primary">
        <div class="card-body flex-row flex-wrap items-center gap-3">
          <RouterLink class="flex grow basis-64 items-center gap-4" :to="{ name: 'practice', params: { id: topic.id } }">
            <div class="grow">
              <h2 class="card-title text-lg">
                {{ topic.title }}
                <span v-if="topic.custom" class="badge badge-primary badge-soft badge-sm">Yours</span>
              </h2>
              <p class="text-sm text-base-content/60">{{ topic.situation }}</p>
            </div>
            <span aria-hidden="true" class="text-2xl text-primary">›</span>
          </RouterLink>
          <template v-if="topic.custom">
            <template v-if="confirming === topic.id">
              <button class="btn btn-error btn-sm" @click="remove(topic.id)">Delete for good</button>
              <button class="btn btn-ghost btn-sm" @click="confirming = null">Keep</button>
            </template>
            <button v-else class="btn btn-ghost btn-sm" :aria-label="`Delete the topic ${topic.title}`" @click="confirming = topic.id">
              Delete
            </button>
          </template>
        </div>
      </div>

      <form v-if="writing" class="card card-border bg-base-100" @submit.prevent="add">
        <div class="card-body gap-3">
          <h2 class="card-title text-lg">A topic of your own</h2>
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Title</span>
            <input v-model.trim="draft.title" class="input w-full" maxlength="80" required placeholder="Renting a car" />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Situation</span>
            <textarea
              v-model.trim="draft.situation"
              class="textarea w-full"
              rows="3"
              maxlength="600"
              required
              placeholder="Who your partner is and what you talk about. For example: my partner works at a car rental desk at the airport, and I pick up the car I booked."
            ></textarea>
            <span class="text-xs text-base-content/60">Any language works; the conversation itself is in English.</span>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Your partner's first line <span class="font-normal text-base-content/60">(optional)</span></span>
            <input v-model.trim="draft.opener" class="input w-full" maxlength="400" placeholder="Leave empty to have it written for you" />
          </label>
          <div v-if="store.addError" role="alert" class="alert alert-error alert-soft">{{ store.addError }}</div>
          <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-primary btn-sm" type="submit" :disabled="store.adding">Add the topic</button>
            <button class="btn btn-ghost btn-sm" type="button" :disabled="store.adding" @click="writing = false">Cancel</button>
            <span v-if="store.adding" class="flex items-center gap-2 text-sm text-base-content/60">
              <MorseSignal animated /> Adding…
            </span>
          </div>
        </div>
      </form>
      <button v-else class="btn btn-outline btn-primary justify-self-start" @click="open">+ Add your own topic</button>
    </div>
  </main>
</template>
