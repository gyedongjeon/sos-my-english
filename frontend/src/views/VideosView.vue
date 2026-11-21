<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MorseSignal from '../components/MorseSignal.vue'
import { startedOn } from '../history'
import { useVideosStore } from '../stores/videos'

// The videos saved to study with, and the form that adds one from a YouTube link.
const store = useVideosStore()
const router = useRouter()

const link = ref('')
// The video whose "Delete" was pressed once; deleting takes a second press.
const confirming = ref<number | null>(null)

async function add() {
  const video = await store.add(link.value)
  if (!video) return
  link.value = ''
  void router.push({ name: 'video', params: { id: video.id } })
}

async function remove(id: number) {
  await store.remove(id)
  confirming.value = null
}

onMounted(() => store.load())
</script>

<template>
  <main class="mx-auto max-w-3xl p-4 sm:p-6">
    <h1 class="text-2xl font-semibold">Videos</h1>
    <p class="text-sm text-base-content/70">
      Paste a link to a YouTube video with English subtitles, then listen to it one sentence at a time.
    </p>

    <form class="mt-4 flex flex-wrap gap-2" @submit.prevent="add">
      <input
        v-model.trim="link"
        class="input grow"
        type="url"
        required
        placeholder="https://www.youtube.com/watch?v=…"
        aria-label="Link to a YouTube video"
      />
      <button class="btn btn-primary" type="submit" :disabled="store.adding">Add the video</button>
    </form>
    <p v-if="store.adding" class="mt-2 flex items-center gap-2 text-sm text-base-content/60">
      <MorseSignal animated /> Getting the subtitles…
    </p>
    <div v-if="store.addError" role="alert" class="alert alert-error alert-soft mt-3">{{ store.addError }}</div>
    <p class="mt-2 text-xs text-base-content/60">
      The video is played by YouTube's own player and is not downloaded. Its subtitles are saved on this computer
      only.
    </p>

    <div v-if="store.loading" class="flex justify-center py-16">
      <MorseSignal animated />
    </div>
    <template v-else>
      <div v-if="store.error" role="alert" class="alert alert-error alert-soft mt-4">{{ store.error }}</div>
      <p v-if="!store.videos.length && !store.error" class="mt-6 text-base-content/70">No videos yet.</p>

      <ul class="mt-4 grid gap-3">
        <li v-for="v in store.videos" :key="v.id" class="card card-border bg-base-100">
          <div class="card-body flex-row flex-wrap items-center gap-3">
            <RouterLink class="flex grow basis-64 items-center gap-4" :to="{ name: 'video', params: { id: v.id } }">
              <img
                class="h-16 w-28 shrink-0 rounded-lg bg-base-300 object-cover"
                :src="`https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`"
                alt=""
                loading="lazy"
              />
              <div class="grow">
                <h2 class="card-title text-lg">{{ v.title }}</h2>
                <p class="text-sm text-base-content/60">
                  <template v-if="v.channel">{{ v.channel }} · </template>{{ v.sentences }} sentences ·
                  {{ startedOn(v.added_at) }}
                </p>
              </div>
            </RouterLink>
            <template v-if="confirming === v.id">
              <button class="btn btn-error btn-sm" @click="remove(v.id)">Delete for good</button>
              <button class="btn btn-ghost btn-sm" @click="confirming = null">Keep</button>
            </template>
            <button v-else class="btn btn-ghost btn-sm" :aria-label="`Delete the video ${v.title}`" @click="confirming = v.id">
              Delete
            </button>
          </div>
        </li>
      </ul>
    </template>
  </main>
</template>
