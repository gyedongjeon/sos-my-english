import { describe, expect, it } from 'vitest'
import { fromSaved } from './history'

describe('fromSaved', () => {
  it('turns a saved line into one the conversation pages show', () => {
    const correction = { original: 'I go', improved: 'I went', explanation: 'Past tense.' }
    const saved = {
      role: 'learner' as const,
      text: 'I go to the beach.',
      correction,
      delivery: { clarity: 82, unclear_words: ['beach'], words_per_minute: 110 },
    }
    expect(fromSaved(saved)).toEqual({
      role: 'learner',
      text: 'I go to the beach.',
      correction,
      delivery: { clarity: 82, unclearWords: ['beach'], wordsPerMinute: 110 },
    })
  })

  it('keeps a line that was not measured or corrected as it is', () => {
    const saved = { role: 'tutor' as const, text: 'How was your week?', correction: null, delivery: null }
    expect(fromSaved(saved)).toEqual({ role: 'tutor', text: 'How was your week?', correction: null, delivery: null })
  })
})
