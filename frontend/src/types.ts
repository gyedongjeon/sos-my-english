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

/** A review of a whole conversation, written when the learner wraps it up. */
export interface Review {
  summary: string
  /** What went well, and what to work on next; a few short sentences each. */
  strengths: string[]
  focus: string[]
  /** Expressions that would have fit the conversation, with what they mean. */
  phrases: { english: string; note: string }[]
}

/** A line of a saved conversation, as the backend returns it. */
export interface SavedMessage {
  role: 'tutor' | 'learner'
  text: string
  correction: Correction | null
  delivery: { clarity: number; unclear_words: string[]; words_per_minute: number | null } | null
}

/** A saved conversation with all its lines. */
export interface SavedConversation {
  id: number
  /** Null once the topic it was held on has been removed. */
  topic_id: number | null
  title: string
  situation: string
  started_at: string
  messages: SavedMessage[]
  /** Written when the conversation is wrapped up; null until then. */
  review: Review | null
}

/** A saved conversation in the history list. */
export interface ConversationSummary {
  id: number
  topic_id: number | null
  title: string
  started_at: string
  /** How many times the learner spoke, and how many of those lines were corrected. */
  turns: number
  corrections: number
}

/** A correction made in a saved conversation, and how often it was practised since. */
export interface SavedCorrection {
  /** The id of the learner's line it was made on. */
  id: number
  conversation_id: number
  title: string
  original: string
  improved: string
  explanation: string
  /** How many times the better sentence was said right, and when it last was. */
  practiced: number
  practiced_at: string | null
}

export type Phase = 'idle' | 'transcribing' | 'thinking' | 'reviewing'

/** A model the app downloads on first use, and how far its download is. */
export interface ModelStatus {
  id: 'speech-to-text' | 'voice'
  label: string
  state: 'missing' | 'downloading' | 'ready' | 'error'
  /** Bytes on disk so far, and the expected size when it is known. */
  downloaded: number
  total: number | null
  error: string | null
}

/** The AI model in use. The API key never reaches the page, only its last characters. */
export interface LLMSettings {
  model: string | null
  source: 'app' | 'env' | null
  key_hint: string | null
}
