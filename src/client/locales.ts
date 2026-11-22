/**
 * Copy for the title bar, in the two locales DSH ships dictionaries for, plus
 * the namespace declaration that types the `t` seat the slot framework injects.
 * @module locales
 */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Dictionary namespace this package owns. */
export const NS = 'desktop-titlebar'

/** Every key this package's copy answers to. */
export type TitlebarKey =
  | 'action.new'
  | 'action.history'
  | 'history.search'
  | 'history.empty'
  | 'history.untitled'
  | 'history.archived'
  | 'history.running'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Title bar actions and the session-history popover. */
    'desktop-titlebar': TitlebarKey
  }
}

/** Chinese copy. */
export const zh: Record<TitlebarKey, string> = {
  'action.new': '新建会话',
  'action.history': '会话历史',
  'history.search': '搜索会话',
  'history.empty': '还没有会话',
  'history.untitled': '未命名会话',
  'history.archived': '已归档',
  'history.running': '进行中',
}

/** English copy. */
export const en: Record<TitlebarKey, string> = {
  'action.new': 'New session',
  'action.history': 'Session history',
  'history.search': 'Search sessions',
  'history.empty': 'No sessions yet',
  'history.untitled': 'Untitled session',
  'history.archived': 'Archived',
  'history.running': 'Running',
}
