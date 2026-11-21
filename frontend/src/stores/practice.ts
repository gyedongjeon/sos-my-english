import { defineStore } from 'pinia'
import { api } from '../api'
import type { Correction, Message, Phase, Topic } from '../types'

interface Transcript {
  text: string
  clarity: number | null
  unclear_words: string[]
  words_per_minute: number | null
}

/** The conversation in progress with the tutor. */
export const usePracticeStore = defineStore('practice', {
  state: () => ({
    topic: null as Topic | null,
    messages: [] as Message[],
    phase: 'idle' as Phase,
    error: '',
    // Bumped by begin(), so a slow request of an abandoned conversation is ignored.
    session: 0,
  }),
  getters: {
    /** The learner spoke last: the tutor's reply is missing (it failed) or on its way. */
    awaitingReply: (state) => state.messages[state.messages.length - 1]?.role === 'learner',
  },
  actions: {
    begin(topic: Topic) {
      this.session++
      this.topic = topic
      this.messages = [{ role: 'tutor', text: topic.opener }]
      this.phase = 'idle'
      this.error = ''
    },

    /** Transcribes what the learner said and gets the tutor's reply; resolves with the reply to read aloud. */
    async say(audio: Blob): Promise<string | null> {
      const session = this.session
      this.error = ''
      this.phase = 'transcribing'
      let heard: Transcript
      try {
        const form = new FormData()
        form.append('file', audio, 'speech.webm')
        heard = await api<Transcript>('/transcribe', { method: 'POST', body: form })
      } catch (e) {
        if (session === this.session) {
          this.error = (e as Error).message
          this.phase = 'idle'
        }
        return null
      }
      if (session !== this.session) return null
      if (!heard.text) {
        this.error = 'No speech was recognized. Try saying it again.'
        this.phase = 'idle'
        return null
      }
      this.messages.push({
        role: 'learner',
        text: heard.text,
        correction: null,
        delivery:
          heard.clarity === null
            ? null
            : { clarity: heard.clarity, unclearWords: heard.unclear_words, wordsPerMinute: heard.words_per_minute },
      })
      return this.requestReply()
    },

    /** Gets the tutor's reply to the learner's last line; also used to ask again after a failure. */
    async requestReply(): Promise<string | null> {
      if (!this.topic || !this.awaitingReply) return null
      const session = this.session
      this.error = ''
      this.phase = 'thinking'
      try {
        const data = await api<{ reply: string; correction: Correction | null }>('/reply', {
          method: 'POST',
          json: { topic_id: this.topic.id, messages: this.messages.map(({ role, text }) => ({ role, text })) },
        })
        if (session !== this.session) return null
        this.messages[this.messages.length - 1].correction = data.correction
        this.messages.push({ role: 'tutor', text: data.reply })
        this.phase = 'idle'
        return data.reply
      } catch (e) {
        if (session === this.session) {
          this.error = `Could not get a reply: ${(e as Error).message}`
          this.phase = 'idle'
        }
        return null
      }
    },
  },
})
