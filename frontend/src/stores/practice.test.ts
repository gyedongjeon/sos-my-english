import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Topic } from '../types'
import { usePracticeStore } from './practice'

const TOPIC: Topic = { id: 1, title: 'Small talk', situation: 'A relaxed chat.', opener: 'How has your week been?' }
const CORRECTION = { original: 'I go', improved: 'I went', explanation: 'Past tense.' }
const AUDIO = new Blob(['audio'])

// A tiny backend: answers each path with the prepared [status, body], and records the JSON it was sent.
function fakeBackend(replies: Record<string, [number, unknown]>) {
  const sent: Record<string, unknown> = {}
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const path = url.replace('/api', '')
    if (typeof init?.body === 'string') sent[path] = JSON.parse(init.body)
    const [status, body] = replies[path]
    return new Response(JSON.stringify(body), { status })
  })
  return { replies, sent }
}

const heard = (text: string) => ({ text, clarity: 80, unclear_words: ['beach'], words_per_minute: null })

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => vi.unstubAllGlobals())

describe('practice', () => {
  it('opens a conversation with the tutor’s first line', () => {
    const store = usePracticeStore()
    store.begin(TOPIC)
    expect(store.messages).toEqual([{ role: 'tutor', text: 'How has your week been?' }])
  })

  it('adds what the learner said, its correction, and the tutor’s reply', async () => {
    const backend = fakeBackend({
      '/transcribe': [200, heard('I go to the beach.')],
      '/reply': [200, { reply: 'Nice! Who with?', correction: CORRECTION }],
    })
    const store = usePracticeStore()
    store.begin(TOPIC)
    expect(await store.say(AUDIO)).toBe('Nice! Who with?')
    expect(store.messages.slice(1)).toEqual([
      {
        role: 'learner',
        text: 'I go to the beach.',
        correction: CORRECTION,
        delivery: { clarity: 80, unclearWords: ['beach'], wordsPerMinute: null },
      },
      { role: 'tutor', text: 'Nice! Who with?' },
    ])
    expect(backend.sent['/reply']).toEqual({
      topic_id: 1,
      messages: [
        { role: 'tutor', text: 'How has your week been?' },
        { role: 'learner', text: 'I go to the beach.' },
      ],
    })
    expect(store.phase).toBe('idle')
  })

  it('asks to try again when no speech was recognized', async () => {
    fakeBackend({ '/transcribe': [200, { text: '', clarity: null, unclear_words: [], words_per_minute: null }] })
    const store = usePracticeStore()
    store.begin(TOPIC)
    expect(await store.say(AUDIO)).toBeNull()
    expect(store.messages).toHaveLength(1)
    expect(store.error).toContain('No speech was recognized')
  })

  it('keeps the learner’s line when the tutor cannot reply, so the reply can be asked for again', async () => {
    const backend = fakeBackend({
      '/transcribe': [200, heard('I go to the beach.')],
      '/reply': [502, { detail: 'No model is configured.' }],
    })
    const store = usePracticeStore()
    store.begin(TOPIC)
    expect(await store.say(AUDIO)).toBeNull()
    expect(store.error).toContain('No model is configured.')
    expect(store.awaitingReply).toBe(true)

    backend.replies['/reply'] = [200, { reply: 'Nice!', correction: null }]
    expect(await store.requestReply()).toBe('Nice!')
    expect(store.messages.map((m) => m.role)).toEqual(['tutor', 'learner', 'tutor'])
    expect(store.error).toBe('')
    expect(store.awaitingReply).toBe(false)
  })

  it('ignores a reply that arrives after the conversation was restarted', async () => {
    fakeBackend({
      '/transcribe': [200, heard('I go to the beach.')],
      '/reply': [200, { reply: 'Nice!', correction: null }],
    })
    const store = usePracticeStore()
    store.begin(TOPIC)
    const pending = store.say(AUDIO)
    store.begin(TOPIC)
    expect(await pending).toBeNull()
    expect(store.messages).toHaveLength(1)
    expect(store.phase).toBe('idle')
  })
})
