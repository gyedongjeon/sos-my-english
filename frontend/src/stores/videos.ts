import { defineStore } from 'pinia'
import { api } from '../api'
import type { Video, VideoHit, VideoSummary } from '../types'

/** The videos saved to study with. */
export const useVideosStore = defineStore('videos', {
  state: () => ({
    videos: [] as VideoSummary[],
    loading: true,
    error: '',
    adding: false,
    addError: '',
    // The sentences found by the last search of the saved subtitles, and what was looked for.
    hits: [] as VideoHit[],
    searched: '',
    searching: false,
  }),
  actions: {
    async load() {
      this.loading = true
      this.error = ''
      try {
        this.videos = await api<VideoSummary[]>('/videos')
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.loading = false
      }
    },

    /** Saves the video a YouTube link leads to; resolves with it, or null with `addError` set. */
    async add(url: string): Promise<Video | null> {
      this.adding = true
      this.addError = ''
      try {
        const video = await api<Video>('/videos', { method: 'POST', json: { url: url.trim() } })
        if (!this.videos.some((v) => v.id === video.id)) {
          const { lines, ...about } = video
          this.videos.unshift({ ...about, sentences: lines.length })
        }
        return video
      } catch (e) {
        this.addError = (e as Error).message
        return null
      } finally {
        this.adding = false
      }
    },

    /** Looks for a word or phrase in the subtitles of all saved videos. */
    async search(phrase: string) {
      const wanted = phrase.trim()
      this.error = ''
      this.hits = []
      this.searched = wanted
      if (!wanted) return
      this.searching = true
      try {
        this.hits = await api<VideoHit[]>(`/video-lines?q=${encodeURIComponent(wanted)}`)
      } catch (e) {
        this.error = (e as Error).message
      } finally {
        this.searching = false
      }
    },

    async remove(id: number) {
      this.error = ''
      try {
        await api(`/videos/${id}`, { method: 'DELETE' })
        this.videos = this.videos.filter((v) => v.id !== id)
        this.hits = this.hits.filter((hit) => hit.video !== id)
      } catch (e) {
        this.error = (e as Error).message
      }
    },
  },
})
