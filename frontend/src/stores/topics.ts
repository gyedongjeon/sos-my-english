import { defineStore } from 'pinia'
import { api } from '../api'
import type { Topic } from '../types'

/** What the learner types to add a topic; an empty opening line is written by the tutor. */
export interface TopicDraft {
  title: string
  situation: string
  opener: string
}

/** The topics to practise: the built-in ones, then the learner's own. */
export const useTopicsStore = defineStore('topics', {
  state: () => ({
    topics: [] as Topic[],
    loading: true,
    error: '',
    adding: false,
    addError: '',
  }),
  actions: {
    async load() {
      this.loading = true
      this.error = ''
      try {
        this.topics = await api<Topic[]>('/topics')
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.loading = false
      }
    },

    /** Resolves with whether the topic was added; `addError` says why not. */
    async add(draft: TopicDraft): Promise<boolean> {
      this.adding = true
      this.addError = ''
      try {
        const json = { title: draft.title, situation: draft.situation, opener: draft.opener.trim() || null }
        this.topics.push(await api<Topic>('/topics', { method: 'POST', json }))
        return true
      } catch (e) {
        this.addError = (e as Error).message
        return false
      } finally {
        this.adding = false
      }
    },

    async remove(id: number) {
      this.error = ''
      try {
        await api(`/topics/${id}`, { method: 'DELETE' })
        this.topics = this.topics.filter((t) => t.id !== id)
      } catch (e) {
        this.error = (e as Error).message
      }
    },
  },
})
