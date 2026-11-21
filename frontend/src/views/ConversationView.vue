<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { api } from '../api'
import CorrectionCard from '../components/CorrectionCard.vue'
import DeliveryNote from '../components/DeliveryNote.vue'
import MorseSignal from '../components/MorseSignal.vue'
import { useSpeech } from '../composables/useSpeech'
import { fromSaved, startedOn } from '../history'
import type { SavedConversation } from '../types'

// A saved conversation, to read and listen to again.
const props = defineProps<{ id: number }>()

const speech = useSpeech()
const conversation = ref<SavedConversation | null>(null)
const loading = ref(true)
const error = ref('')
const messages = computed(() => (conversation.value?.messages ?? []).map(fromSaved))

async function load() {
  loading.value = true
  error.value = ''
  conversation.value = null
  try {
    conversation.value = await api<SavedConversation>(`/conversations/${props.id}`)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

watch(() => props.id, load)
onMounted(load)
onBeforeUnmount(() => speech.stop())
</script>

<template>
  <main class="mx-auto max-w-3xl p-4 sm:p-6">
    <RouterLink class="link text-sm" :to="{ name: 'history' }">‹ History</RouterLink>

    <div v-if="loading" class="flex justify-center py-16">
      <MorseSignal animated />
    </div>

    <template v-else-if="conversation">
      <header class="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 class="text-2xl font-semibold">{{ conversation.title }}</h1>
          <p class="text-sm text-base-content/70">{{ startedOn(conversation.started_at) }} · {{ conversation.situation }}</p>
        </div>
        <RouterLink
          v-if="conversation.topic_id !== null"
          class="btn btn-primary btn-sm"
          :to="{ name: 'practice', params: { id: conversation.topic_id } }"
        >
          Practice this topic again
        </RouterLink>
      </header>

      <section class="mt-4 flex flex-col gap-1" aria-label="Conversation">
        <template v-for="(message, i) in messages" :key="i">
          <div class="chat" :class="message.role === 'tutor' ? 'chat-start' : 'chat-end'">
            <div class="chat-header text-xs text-base-content/60">{{ message.role === 'tutor' ? 'Partner' : 'You' }}</div>
            <div class="chat-bubble" :class="message.role === 'learner' ? 'chat-bubble-primary' : ''">{{ message.text }}</div>
            <div v-if="message.role === 'tutor'" class="chat-footer mt-1">
              <button class="btn btn-xs" @click="speech.speak(message.text)">Hear it</button>
            </div>
            <DeliveryNote v-else-if="message.delivery" :delivery="message.delivery" />
          </div>
          <CorrectionCard v-if="message.correction" :correction="message.correction" @hear="speech.speak" />
        </template>
      </section>
    </template>

    <div v-else role="alert" class="alert alert-error mt-4">{{ error || 'This conversation could not be opened.' }}</div>
  </main>
</template>
