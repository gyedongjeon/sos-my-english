import type { Message, SavedMessage } from './types'

/** A line as the backend stores it, in the shape the conversation pages show. */
export function fromSaved(saved: SavedMessage): Message {
  const spoken = saved.delivery
  return {
    role: saved.role,
    text: saved.text,
    correction: saved.correction,
    delivery: spoken && {
      clarity: spoken.clarity,
      unclearWords: spoken.unclear_words,
      wordsPerMinute: spoken.words_per_minute,
    },
  }
}

/** When a conversation was held, in the reader's own date format. */
export const startedOn = (startedAt: string) =>
  new Date(startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
