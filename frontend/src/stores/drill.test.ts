import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PatternStatus } from '../types'
import { useDrillStore } from './drill'
import { usePatternsStore } from './patterns'

const PATTERN: PatternStatus = {
  id: 'should-have',
  level: 'B2',
  pattern: 'should have + past participle',
  use: 'Regretting something in the past',
  example: 'I should have left earlier.',
  sessions: 0,
  last_correct: null,
  last_total: null,
  practiced_at: null,
}
const OTHER: PatternStatus = { ...PATTERN, id: 'id-like', level: 'A1', pattern: "I'd like + noun" }
const EXERCISES = {
  note: 'For regrets.',
  items: [
    { prompt: '더 일찍 떠났어야 했어.', answer: 'I should have left earlier.' },
    { prompt: '그에게 말했어야 했어.', answer: 'I should have told him.' },
  ],
}
const RIGHT = { correct: true, improved: 'I should have left earlier.', explanation: null }
const WRONG = { correct: false, improved: 'I should have left earlier.', explanation: 'Use the past participle.' }
const AUDIO = new Blob(['audio'])
const BASE = '/patterns/should-have'

// Answers each path with the prepared [status, body], and records the requests and their JSON.
function fakeBackend(overrides: Record<string, [number, unknown]>) {
  const replies: Record<string, [number, unknown]> = {
    '/patterns': [200, [OTHER, PATTERN]],
    [`${BASE}/exercises`]: [200, EXERCISES],
    '/transcribe': [200, { text: 'I should have left earlier.' }],
    ...overrides,
  }
  const sent: Record<string, unknown> = {}
  const calls: string[] = []
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const path = url.replace('/api', '')
    calls.push(path)
    if (typeof init?.body === 'string') sent[path] = JSON.parse(init.body)
    const [status, body] = replies[path]
    return new Response(JSON.stringify(body), { status })
  })
  return { replies, sent, calls }
}

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => vi.unstubAllGlobals())

describe('patterns', () => {
  it('loads the patterns and shows one level at a time', async () => {
    fakeBackend({})
    const store = usePatternsStore()
    await store.load()
    expect(store.levels).toEqual(['A1', 'B2'])
    expect(store.shown).toEqual([OTHER])
    store.level = 'B2'
    expect(store.shown).toEqual([PATTERN])
    expect(store.byId('should-have')).toEqual(PATTERN)
    expect(store.byId('nope')).toBeNull()
  })
})

describe('drill', () => {
  it('starts a round with new sentences for the pattern', async () => {
    fakeBackend({})
    const drill = useDrillStore()
    await drill.start(PATTERN)
    expect(drill.note).toBe('For regrets.')
    expect(drill.items).toEqual(EXERCISES.items)
    expect(drill.current).toEqual(EXERCISES.items[0])
    expect(drill.phase).toBe('idle')
  })

  it('reports that the sentences could not be written', async () => {
    fakeBackend({ [`${BASE}/exercises`]: [502, { detail: 'No model is configured.' }] })
    const drill = useDrillStore()
    await drill.start(PATTERN)
    expect(drill.error).toContain('No model is configured.')
    expect(drill.items).toEqual([])
    expect(drill.phase).toBe('idle')
  })

  it('has what was said judged and shows the verdict', async () => {
    const backend = fakeBackend({ [`${BASE}/check`]: [200, WRONG], '/transcribe': [200, { text: 'I should have leave.' }] })
    const drill = useDrillStore()
    await drill.start(PATTERN)
    await drill.attempt(AUDIO)
    expect(backend.sent[`${BASE}/check`]).toEqual({ ...EXERCISES.items[0], said: 'I should have leave.' })
    expect(drill.last).toEqual({ heard: 'I should have leave.', ...WRONG })
    expect(drill.phase).toBe('idle')
  })

  it('scores a sentence by the first try, however later tries go', async () => {
    const backend = fakeBackend({ [`${BASE}/check`]: [200, WRONG] })
    const drill = useDrillStore()
    await drill.start(PATTERN)
    await drill.attempt(AUDIO)
    backend.replies[`${BASE}/check`] = [200, RIGHT]
    await drill.attempt(AUDIO)
    expect(drill.last?.correct).toBe(true)
    expect(drill.firstTries).toEqual([false, null])
  })

  it('asks to try again when no speech was recognized', async () => {
    const backend = fakeBackend({ '/transcribe': [200, { text: '' }] })
    const drill = useDrillStore()
    await drill.start(PATTERN)
    await drill.attempt(AUDIO)
    expect(drill.error).toContain('No speech was recognized')
    expect(drill.last).toBeNull()
    expect(drill.firstTries).toEqual([null, null])
    expect(backend.calls).not.toContain(`${BASE}/check`)
  })

  it('shows the answer on request, which counts as not knowing it', async () => {
    fakeBackend({})
    const drill = useDrillStore()
    await drill.start(PATTERN)
    drill.reveal()
    expect(drill.last).toEqual({ heard: '', correct: false, improved: 'I should have left earlier.', explanation: null })
    expect(drill.firstTries).toEqual([false, null])
  })

  it('moves through the sentences and records the round at the end', async () => {
    const backend = fakeBackend({
      [`${BASE}/check`]: [200, RIGHT],
      [`${BASE}/results`]: [200, { ...PATTERN, sessions: 1, last_correct: 1, last_total: 2, practiced_at: '2026-11-21T10:00:00Z' }],
    })
    const patterns = usePatternsStore()
    await patterns.load()
    const drill = useDrillStore()
    await drill.start(PATTERN)
    await drill.attempt(AUDIO)
    await drill.next()
    expect(drill.current).toEqual(EXERCISES.items[1])
    expect(drill.last).toBeNull()
    drill.reveal()
    await drill.next()
    expect(drill.phase).toBe('done')
    expect(drill.score).toBe(1)
    expect(backend.sent[`${BASE}/results`]).toEqual({ correct: 1, total: 2 })
    // The list shows the new progress without loading again.
    expect(patterns.byId('should-have')?.sessions).toBe(1)
  })

  it('still finishes the round when its result cannot be saved', async () => {
    fakeBackend({ [`${BASE}/check`]: [200, RIGHT], [`${BASE}/results`]: [500, { detail: 'The disk is full.' }] })
    const drill = useDrillStore()
    await drill.start({ ...PATTERN })
    drill.items = [EXERCISES.items[0]]
    drill.firstTries = [null]
    await drill.attempt(AUDIO)
    await drill.next()
    expect(drill.phase).toBe('done')
    expect(drill.error).toContain('The disk is full.')
  })

  it('ignores sentences that arrive after another round was started', async () => {
    fakeBackend({})
    const drill = useDrillStore()
    const slow = drill.start(PATTERN)
    await drill.start(OTHER).catch(() => {})
    await slow
    expect(drill.pattern?.id).toBe('id-like')
  })
})
