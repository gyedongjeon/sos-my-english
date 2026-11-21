<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { api } from '../api'
import MorseSignal from '../components/MorseSignal.vue'
import { useYouTubePlayer } from '../composables/useYouTubePlayer'
import type { Video } from '../types'
import { clock, lineAt, stepFrom } from '../video'

// A saved video, listened to one sentence at a time.
const props = defineProps<{ id: number }>()

// A sentence's start is worked out from its subtitle line, so playing starts a moment early.
const LEAD = 0.25
const RATES = [0.5, 0.75, 1]

const video = ref<Video | null>(null)
const loading = ref(true)
const error = ref('')
const frame = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
const player = useYouTubePlayer(frame)

// The sentence chosen by the learner; while the video plays on, the one being said.
const chosen = ref(-1)
const repeat = ref(false)
const rate = ref(1)
const showText = ref(true)

const lines = computed(() => video.value?.lines ?? [])
const current = computed(() => (player.part.value ? chosen.value : lineAt(lines.value, player.time.value)))

function play(index: number) {
  const line = lines.value[index]
  if (!line) return
  chosen.value = index
  player.playPart(Math.max(0, line.start - LEAD), line.end, repeat.value)
}

function step(by: 1 | -1) {
  play(stepFrom(lines.value, current.value, by))
}

function toggle() {
  if (player.playing.value) player.pause()
  else play(current.value < 0 ? 0 : current.value)
}

async function load() {
  loading.value = true
  error.value = ''
  video.value = null
  chosen.value = -1
  try {
    video.value = await api<Video>(`/videos/${props.id}`)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
  if (!video.value) return
  await nextTick()
  await player.open(video.value.video_id)
}

watch(rate, (now) => player.setRate(now))
watch(player.ready, (now) => now && player.setRate(rate.value))
// With the text hidden, the subtitles on the video itself are hidden as well.
watch(showText, (now) => player.setCaptions(now))
// The subtitles come back when a video starts to play, so they are hidden again then.
watch(player.playing, (now) => now && !showText.value && player.setCaptions(false))
// Repeating starts or stops for the sentence that is playing, too.
watch(repeat, (now) => {
  if (player.part.value) player.part.value.repeat = now
})
watch(current, async (now) => {
  await nextTick()
  list.value?.querySelector(`[data-line="${now}"]`)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
})
watch(() => props.id, load)
onMounted(load)
</script>

<template>
  <main class="mx-auto max-w-3xl p-4 sm:p-6">
    <RouterLink class="link text-sm" :to="{ name: 'videos' }">‹ All videos</RouterLink>

    <div v-if="loading" class="flex justify-center py-16">
      <MorseSignal animated />
    </div>

    <template v-else-if="video">
      <header class="mt-2">
        <h1 class="text-2xl font-semibold">{{ video.title }}</h1>
        <p class="text-sm text-base-content/70">
          <template v-if="video.channel">{{ video.channel }} · </template>{{ lines.length }} sentences<template
            v-if="video.generated"
          >
            · automatic subtitles, so some words and sentence breaks may be off</template
          >
        </p>
      </header>

      <div class="sticky top-0 z-10 -mx-4 mt-3 bg-base-200 px-4 pb-3 sm:-mx-6 sm:px-6">
        <div ref="frame" class="video-frame aspect-video w-full overflow-hidden rounded-box bg-neutral"></div>
        <div v-if="player.error.value" role="alert" class="alert alert-error alert-soft mt-2">{{ player.error.value }}</div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button class="btn btn-sm" :disabled="!player.ready.value" aria-label="Previous sentence" @click="step(-1)">‹ Previous</button>
          <button class="btn btn-primary btn-sm" :disabled="!player.ready.value" @click="toggle">
            {{ player.playing.value ? 'Pause' : 'Play the sentence' }}
          </button>
          <button class="btn btn-sm" :disabled="!player.ready.value" aria-label="Next sentence" @click="step(1)">Next ›</button>
          <label class="label cursor-pointer gap-2 text-sm">
            <input v-model="repeat" type="checkbox" class="toggle toggle-sm" />
            Repeat
          </label>
          <label class="flex items-center gap-2 text-sm">
            Speed
            <select v-model.number="rate" class="select select-sm w-24">
              <option v-for="r in RATES" :key="r" :value="r">{{ r }}×</option>
            </select>
          </label>
          <label class="label cursor-pointer gap-2 text-sm">
            <input v-model="showText" type="checkbox" class="toggle toggle-sm" />
            Show the text
          </label>
        </div>
      </div>

      <ol ref="list" class="mt-2 grid gap-1" aria-label="Sentences">
        <li v-for="(line, i) in lines" :key="i" :data-line="i">
          <button
            class="flex w-full items-baseline gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-base-100"
            :class="i === current ? 'bg-base-100 ring-2 ring-primary' : ''"
            :aria-current="i === current"
            :disabled="!player.ready.value"
            @click="play(i)"
          >
            <span class="w-12 shrink-0 text-xs text-base-content/50 tabular-nums">{{ clock(line.start) }}</span>
            <span v-if="showText">{{ line.text }}</span>
            <span v-else class="italic text-base-content/40">Sentence {{ i + 1 }}</span>
          </button>
        </li>
      </ol>
    </template>

    <div v-else role="alert" class="alert alert-error mt-4">{{ error || 'This video could not be opened.' }}</div>
  </main>
</template>

<style scoped>
/* YouTube's player comes as an iframe with a fixed size; it fills the frame instead. */
.video-frame :deep(iframe) {
  width: 100%;
  height: 100%;
}
</style>
