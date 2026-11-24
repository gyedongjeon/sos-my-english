// The app used to be called "SOS My English", and the system names an app's folder after the
// app, so the renamed app would start without the learner's data. This finds that data so it
// can be moved over once. Only `data` (the database and the downloaded models) is moved: the
// rest of the old folder (Python, its packages, caches) holds absolute paths and is rebuilt.
//
// Nothing here imports Electron, so it can be tested with plain Node.
import { join } from 'node:path'

const LEGACY_NAME = 'SOS My English'

export interface LegacyData {
  /** The system folder every app's own folder is in (Electron's `appData`). */
  appData: string
  /** This app's own folder (Electron's `userData`). */
  userData: string
  exists: (path: string) => boolean
}

/** The folder to move and where to, or null when there is nothing to move. */
export function legacyDataMove({ appData, userData, exists }: LegacyData): { from: string; to: string } | null {
  const from = join(appData, LEGACY_NAME, 'data')
  const to = join(userData, 'data')
  return exists(from) && !exists(to) ? { from, to } : null
}
