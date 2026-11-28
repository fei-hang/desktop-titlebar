/**
 * Load the built client bundle the way the Host page does: register a factory
 * through `window.__ModuleLoader__`, then call it with a `require` that only
 * answers the shared module table. Proves the artifact parses, requires
 * nothing outside that table, and registers its seat and its stylesheet.
 */
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')

const styles = []
const document = {
  querySelector: (selector) => styles.find((tag) => selector.includes(tag.dataset.pluginCss)) ?? null,
  createElement: () => ({ dataset: {}, textContent: '' }),
  head: { appendChild: (tag) => styles.push(tag) },
  addEventListener: () => {},
  removeEventListener: () => {},
}
const window = { addEventListener: () => {}, removeEventListener: () => {} }
const requested = []

globalThis.window = window
globalThis.document = document

const registrations = []
window.__ModuleLoader__ = { load: (entry) => registrations.push(entry) }
new Function('window', 'document', source)(window, document)

if (registrations.length !== 1) throw new Error(`expected one registration, got ${registrations.length}`)
const [entry] = registrations
if (entry.id !== 'dsh-desktop-titlebar') throw new Error(`unexpected id ${entry.id}`)

const react = {
  createElement: () => null,
  useState: () => [undefined, () => {}],
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
  useEffect: () => {},
  useRef: () => ({ current: null }),
  createContext: () => ({ Provider: () => null }),
  useContext: () => ({}),
  // The badges subscribe to the job roster; the stub only needs one snapshot read.
  useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
}
const table = new Map([
  ['react', react],
  ['react/jsx-runtime', { jsx: () => null, jsxs: () => null, Fragment: 'Fragment' }],
  // The restart surfaces portal to document.body; the stub only needs to pass the node through.
  ['react-dom', { createPortal: (node) => node }],
])
const stub = (name) => {
  requested.push(name)
  if (!table.has(name)) throw new Error(`bundle required "${name}", which the shared module table does not answer`)
  return table.get(name)
}

const module = entry.factory(stub)
if (typeof module.apply !== 'function') throw new Error('client bundle exports no apply()')

// Drive apply with a recording context: the bar must claim exactly one seat and
// register its dictionaries, and nothing may throw on the way.
const effects = []
const registrationsBySeat = []
const locales = []
const ctx = {
  effect: (factory, label) => {
    const disposer = factory()
    effects.push({ label, disposer: typeof disposer })
    return () => {}
  },
  locale: {
    register: (ns, dicts) => {
      locales.push({ ns, locales: Object.keys(dicts).sort() })
      return () => {}
    },
  },
  slots: {
    inject: (key, contribute) => {
      const disposer = contribute()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    register: (options, component) => {
      registrationsBySeat.push({ name: options.name, id: options.id, order: options.order, locale: options.locale, component: typeof component })
      return () => {}
    },
  },
  get: () => { throw new Error('service not ready') },
}
module.apply(ctx)

console.log(JSON.stringify({
  id: entry.id,
  exports: Object.keys(module).sort(),
  inject: module.inject,
  styles: styles.map((tag) => tag.dataset.pluginCss),
  required: [...new Set(requested)].sort(),
  effects: effects.map((item) => item.label),
  seats: registrationsBySeat,
  locales,
}, null, 2))

if (registrationsBySeat.length !== 1) throw new Error(`expected one seat registration, got ${registrationsBySeat.length}`)
const seat = registrationsBySeat[0]
if (seat.name !== 'shell.overlay' || seat.id !== 'desktop-titlebar') throw new Error(`unexpected seat ${JSON.stringify(seat)}`)
const sheets = styles.map((tag) => tag.dataset.pluginCss).sort()
const expectedSheets = ['dsh-desktop-titlebar/restart.module.css', 'dsh-desktop-titlebar/titlebar.module.css']
if (sheets.join(',') !== expectedSheets.join(',')) throw new Error(`unexpected stylesheets ${JSON.stringify(sheets)}`)
if (locales.length !== 1 || locales[0].locales.join(',') !== 'en,zh') throw new Error(`unexpected dictionaries ${JSON.stringify(locales)}`)
