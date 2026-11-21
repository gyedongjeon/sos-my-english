/** A conversation topic: the situation the tutor plays out and the line that opens it. */
export interface Topic {
  id: number
  title: string
  situation: string
  opener: string
}

/** How a line was spoken, measured from the audio by the local Whisper model. */
export interface Delivery {
  /** 0-100: how confidently the words were recognized, a proxy for clear pronunciation. */
  clarity: number
  unclearWords: string[]
  wordsPerMinute: number | null
}

export interface Correction {
  original: string
  improved: string
  explanation: string
}

/** One line of the conversation in progress. */
export interface Message {
  role: 'tutor' | 'learner'
  text: string
  /** Learner lines only: the tutor's fix, or null when the line was fine or not reviewed yet. */
  correction?: Correction | null
  /** Learner lines only. */
  delivery?: Delivery | null
}

export type Phase = 'idle' | 'transcribing' | 'thinking'

/** The AI model in use. The API key never reaches the page, only its last characters. */
export interface LLMSettings {
  model: string | null
  source: 'app' | 'env' | null
  key_hint: string | null
}
