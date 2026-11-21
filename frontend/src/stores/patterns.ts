import { defineStore } from 'pinia'
import { api } from '../api'
import type { PatternStatus } from '../types'

/** The sentence patterns, grouped by CEFR level, with the learner's progress on each. */
export const usePatternsStore = defineStore('patterns', {
  state: () => ({
    patterns: [] as PatternStatus[],
    loading: true,
    error: '',
    // The level chosen on the patterns page; kept while the app is open.
    level: '',
  }),
  getters: {
    /** The levels that have patterns, in the order the backend lists them. */
    levels: (state): string[] => [...new Set(state.patterns.map((p) => p.level))],
    active(state): string {
      return this.levels.includes(state.level) ? state.level : (this.levels[0] ?? '')
    },
    shown(state): PatternStatus[] {
      return state.patterns.filter((p) => p.level === this.active)
    },
    byId: (state) => (id: string): PatternStatus | null => state.patterns.find((p) => p.id === id) ?? null,
  },
  actions: {
    async load() {
      this.loading = true
      this.error = ''
      try {
        this.patterns = await api<PatternStatus[]>('/patterns')
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.loading = false
      }
    },

    /** Takes over a pattern's progress after a round, so the list need not be loaded again. */
    update(status: PatternStatus) {
      const at = this.patterns.findIndex((p) => p.id === status.id)
      if (at >= 0) this.patterns[at] = status
    },
  },
})
