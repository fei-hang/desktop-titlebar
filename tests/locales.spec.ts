import { describe, expect, it } from 'vitest'
import { NS, en, zh } from '../src/client/locales.ts'

describe('dictionaries', () => {
  it('names the package namespace', () => {
    expect(NS).toBe('desktop-titlebar')
  })

  it('answer the same keys in both locales', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })

  it('carry no empty copy', () => {
    for (const dict of [zh, en]) {
      for (const [key, value] of Object.entries(dict)) expect(value.trim(), key).not.toBe('')
    }
  })
})
