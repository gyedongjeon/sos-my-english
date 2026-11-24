import { describe, expect, it } from 'vitest'
import { legacyDataMove } from '../src/legacy'

const appData = '/Users/me/Library/Application Support'
const userData = `${appData}/SOS My Language`
const legacy = `${appData}/SOS My English/data`

describe('legacyDataMove', () => {
  it('moves the data of the app under its old name into the renamed app', () => {
    const exists = (path: string) => path === legacy
    expect(legacyDataMove({ appData, userData, exists })).toEqual({ from: legacy, to: `${userData}/data` })
  })

  it('leaves the data alone once the renamed app has its own', () => {
    const exists = (path: string) => path === legacy || path === `${userData}/data`
    expect(legacyDataMove({ appData, userData, exists })).toBeNull()
  })

  it('has nothing to move when the app was never installed under its old name', () => {
    expect(legacyDataMove({ appData, userData, exists: () => false })).toBeNull()
  })
})
