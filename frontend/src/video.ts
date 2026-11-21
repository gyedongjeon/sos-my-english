import type { VideoLine } from './types'

/** The sentence being said at a time of the video: the last one that has started; -1 before the first. */
export function lineAt(lines: VideoLine[], time: number): number {
  let found = -1
  for (let i = 0; i < lines.length && lines[i].start <= time; i++) found = i
  return found
}

/** The sentence one step forward or back from another, kept inside the list. */
export const stepFrom = (lines: VideoLine[], index: number, step: 1 | -1): number =>
  Math.min(lines.length - 1, Math.max(0, index < 0 ? 0 : index + step))

/** A time of the video as it is written on a player: 1:05, 1:02:05. */
export function clock(seconds: number): string {
  const whole = Math.floor(seconds)
  const [h, m, s] = [Math.floor(whole / 3600), Math.floor((whole % 3600) / 60), whole % 60]
  const two = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`
}
