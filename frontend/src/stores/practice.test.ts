import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Topic } from '../types'
import { usePracticeStore } from './practice'

const TOPIC: Topic = { id: 1, title: 'Small talk', situation: 'A relaxed chat.', opener: 'How has your week been?' }
const CORRECTION = { original: 'I go', improved: 'I went', explanation: 'Past tense.' }
const AUDIO = new Blob(['audio'])

// A tiny backend: answers each path with the prepared [status, body], and records the requests
// it got, with the JSON they carried. Starting and saving a conversation work unless overridden.
function fakeBackend(overrides: Record<string, [number, unknown]>) {
  const replies: Record<string, [number, unknown]> = {
    '/conversations': [201, { id: 7 }],
    '/conversations/7/messages': [201, {}],
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
      '/conversations/7/reply': [200, { reply: 'Nice! Who with?', correction: CORRECTION }],
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
    // The conversation is saved as it happens: started on the first thing said, then each line.
    expect(backend.calls).toEqual(['/transcribe', '/conversations', '/conversations/7/messages', '/conversations/7/reply'])
    expect(backend.sent['/conversations']).toEqual({ topic_id: 1 })
    expect(backend.sent['/conversations/7/messages']).toEqual({
      text: 'I go to the beach.',
      delivery: { clarity: 80, unclear_words: ['beach'], words_per_minute: null },
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
      '/conversations/7/reply': [502, { detail: 'No model is configured.' }],
    })
    const store = usePracticeStore()
    store.begin(TOPIC)
    expect(await store.say(AUDIO)).toBeNull()
    expect(store.error).toContain('No model is configured.')
    expect(store.awaitingReply).toBe(true)

    backend.replies['/conversations/7/reply'] = [200, { reply: 'Nice!', correction: null }]
    backend.calls.length = 0
    expect(await store.requestReply()).toBe('Nice!')
    // What was said is already saved; only the reply is asked for again.
    expect(backend.calls).toEqual(['/conversations/7/reply'])
    expect(store.messages.map((m) => m.role)).toEqual(['tutor', 'learner', 'tutor'])
    expect(store.error).toBe('')
    expect(store.awaitingReply).toBe(false)
  })

  it('saves a line again when saving it failed, before asking for the reply', async () => {
    const backend = fakeBackend({
      '/transcribe': [200, heard('I go to the beach.')],
      '/conversations/7/messages': [500, { detail: 'The disk is full.' }],
      '/conversations/7/reply': [200, { reply: 'Nice!', correction: null }],
    })
    const store = usePracticeStore()
    store.begin(TOPIC)
    expect(await store.say(AUDIO)).toBeNull()
    expect(store.error).toContain('The disk is full.')
    expect(store.messages.map((m) => m.role)).toEqual(['tutor', 'learner'])

    backend.replies['/conversations/7/messages'] = [201, {}]
    backend.calls.length = 0
    expect(await store.requestReply()).toBe('Nice!')
    expect(backend.calls).toEqual(['/conversations/7/messages', '/conversations/7/reply'])
  })

  it('keeps one saved conversation for the turns of a session, and starts another after a restart', async () => {
    const backend = fakeBackend({
      '/transcribe': [200, heard('I go to the beach.')],
      '/conversations/7/reply': [200, { reply: 'Nice!', correction: null }],
    })
    const store = usePracticeStore()
    store.begin(TOPIC)
    await store.say(AUDIO)
    await store.say(AUDIO)
    expect(backend.calls.filter((path) => path === '/conversations')).toHaveLength(1)
    store.begin(TOPIC)
    await store.say(AUDIO)
    expect(backend.calls.filter((path) => path === '/conversations')).toHaveLength(2)
  })

  it('ignores a reply that arrives after the conversation was restarted', async () => {
    fakeBackend({
      '/transcribe': [200, heard('I go to the beach.')],
      '/conversations/7/reply': [200, { reply: 'Nice!', correction: null }],
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
