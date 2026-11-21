import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Video, VideoSummary } from '../types'
import { useVideosStore } from './videos'

const SAVED: VideoSummary = {
  id: 1,
  video_id: 'UF8uR6Z6KLc',
  title: 'Commencement address',
  channel: 'Stanford',
  language: 'en',
  generated: false,
  added_at: '2026-11-21T10:00:00Z',
  sentences: 150,
}
const ADDED: Video = {
  id: 2,
  video_id: 'arj7oStGLkU',
  title: 'A talk',
  channel: 'TED',
  language: 'en',
  generated: true,
  added_at: '2026-11-21T11:00:00Z',
  lines: [
    { id: 11, start: 1, end: 2, text: 'One.', shadowed: 0, best: null },
    { id: 12, start: 2, end: 3, text: 'Two.', shadowed: 0, best: null },
  ],
}

// Answers each "METHOD path" with the prepared [status, body], and records the requests and their JSON.
function fakeBackend(replies: Record<string, [number, unknown]>) {
  const sent: Record<string, unknown> = {}
  const asked: string[] = []
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const call = `${init?.method ?? 'GET'} ${url.replace('/api', '')}`
    if (typeof init?.body === 'string') sent[call] = JSON.parse(init.body)
    const [status, body] = replies[call.split('?')[0]]
    asked.push(call)
    return new Response(status === 204 ? null : JSON.stringify(body), { status })
  })
  return { sent, asked }
}

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => vi.unstubAllGlobals())

describe('videos', () => {
  it('loads the saved videos', async () => {
    fakeBackend({ 'GET /videos': [200, [SAVED]] })
    const store = useVideosStore()
    await store.load()
    expect(store.videos).toEqual([SAVED])
    expect(store.loading).toBe(false)
  })

  it('adds a video from its link and puts it first in the list', async () => {
    const backend = fakeBackend({ 'GET /videos': [200, [SAVED]], 'POST /videos': [201, ADDED] })
    const store = useVideosStore()
    await store.load()
    expect(await store.add(' https://youtu.be/arj7oStGLkU ')).toEqual(ADDED)
    expect(backend.sent['POST /videos']).toEqual({ url: 'https://youtu.be/arj7oStGLkU' })
    expect(store.videos.map((v) => [v.id, v.sentences])).toEqual([
      [2, 2],
      [1, 150],
    ])
    expect(store.adding).toBe(false)
  })

  it('does not list a video twice when it was saved before', async () => {
    fakeBackend({ 'GET /videos': [200, [SAVED]], 'POST /videos': [200, { ...ADDED, id: 1 }] })
    const store = useVideosStore()
    await store.load()
    await store.add('https://youtu.be/UF8uR6Z6KLc')
    expect(store.videos).toHaveLength(1)
  })

  it('says why a video could not be added', async () => {
    fakeBackend({ 'GET /videos': [200, []], 'POST /videos': [422, { detail: 'This video has no English subtitles.' }] })
    const store = useVideosStore()
    await store.load()
    expect(await store.add('https://youtu.be/arj7oStGLkU')).toBeNull()
    expect(store.addError).toContain('no English subtitles')
    expect(store.videos).toEqual([])
  })

  it('removes a video, and keeps it when that fails', async () => {
    const replies: Record<string, [number, unknown]> = { 'GET /videos': [200, [SAVED]], 'DELETE /videos/1': [500, { detail: 'The disk is full.' }] }
    fakeBackend(replies)
    const store = useVideosStore()
    await store.load()
    await store.remove(1)
    expect(store.error).toContain('The disk is full.')
    expect(store.videos).toEqual([SAVED])
    replies['DELETE /videos/1'] = [204, null]
    await store.remove(1)
    expect(store.videos).toEqual([])
  })

  const HIT = { id: 12, video: 2, video_id: 'arj7oStGLkU', title: 'A talk', position: 1, start: 2, text: 'Two.' }

  it('searches the saved subtitles for a phrase', async () => {
    const backend = fakeBackend({ 'GET /video-lines': [200, [HIT]] })
    const store = useVideosStore()
    await store.search('  two & more ')
    expect(backend.asked).toEqual(['GET /video-lines?q=two%20%26%20more'])
    expect(store.hits).toEqual([HIT])
    expect(store.searched).toBe('two & more')
    expect(store.searching).toBe(false)
  })

  it('clears the results when the search box is emptied, without asking', async () => {
    const backend = fakeBackend({ 'GET /video-lines': [200, [HIT]] })
    const store = useVideosStore()
    await store.search('two')
    await store.search('  ')
    expect(store.hits).toEqual([])
    expect(store.searched).toBe('')
    expect(backend.asked).toHaveLength(1)
  })

  it('reports a search that failed', async () => {
    fakeBackend({ 'GET /video-lines': [500, { detail: 'The disk is gone.' }] })
    const store = useVideosStore()
    await store.search('two')
    expect(store.error).toContain('The disk is gone.')
    expect(store.hits).toEqual([])
  })
})
