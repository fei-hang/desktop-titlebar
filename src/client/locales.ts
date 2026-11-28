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
  | 'action.menu'
  | 'menu.settings'
  | 'menu.checkUpdates'
  | 'menu.restart'
  | 'restart.confirm.title'
  | 'restart.confirm.body'
  | 'restart.confirm.cancel'
  | 'restart.confirm.ok'
  | 'restart.confirm.close'
  | 'restart.loading'
  | 'restart.loading.hint'
  | 'restart.failed'
  | 'history.search'
  | 'history.empty'
  | 'history.untitled'
  | 'history.archived'
  | 'history.running'
  | 'unread.count.one'
  | 'unread.count.other'
  | 'unread.list'
  | 'jobs.count.one'
  | 'jobs.count.other'
  | 'jobs.list'
  | 'jobs.status.running'
  | 'jobs.status.stopping'

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
  'action.menu': '菜单',
  'menu.settings': '设置',
  'menu.checkUpdates': '检查更新',
  'menu.restart': '重启',
  'restart.confirm.title': '确定要重启吗？',
  'restart.confirm.body': 'DSH 的所有进程都会关闭，然后自动重新启动。未发送的输入会丢失。',
  'restart.confirm.cancel': '取消',
  'restart.confirm.ok': '立即重启',
  'restart.confirm.close': '关闭',
  'restart.loading': '正在重启…',
  'restart.loading.hint': '窗口稍后会自己回来，请不要手动关闭。',
  'restart.failed': '重启请求没能发出去，请稍后再试。',
  'history.search': '搜索会话',
  'history.empty': '还没有会话',
  'history.untitled': '未命名会话',
  'history.archived': '已归档',
  'history.running': '进行中',
  'unread.count.one': '{count} 条未读消息',
  'unread.count.other': '{count} 条未读消息',
  'unread.list': '未读消息',
  'jobs.count.one': '{count} 个后台任务',
  'jobs.count.other': '{count} 个后台任务',
  'jobs.list': '后台任务',
  'jobs.status.running': '运行中',
  'jobs.status.stopping': '正在停止',
}

/** English copy. */
export const en: Record<TitlebarKey, string> = {
  'action.new': 'New session',
  'action.history': 'Session history',
  'action.menu': 'Menu',
  'menu.settings': 'Settings',
  'menu.checkUpdates': 'Check for updates',
  'menu.restart': 'Restart',
  'restart.confirm.title': 'Restart DSH?',
  'restart.confirm.body': 'Every DSH process will close and the app will start again by itself. Unsent input is lost.',
  'restart.confirm.cancel': 'Cancel',
  'restart.confirm.ok': 'Restart now',
  'restart.confirm.close': 'Close',
  'restart.loading': 'Restarting…',
  'restart.loading.hint': 'The window comes back on its own; no need to close anything.',
  'restart.failed': 'The restart request did not go through. Please try again.',
  'history.search': 'Search sessions',
  'history.empty': 'No sessions yet',
  'history.untitled': 'Untitled session',
  'history.archived': 'Archived',
  'history.running': 'Running',
  'unread.count.one': '{count} unread',
  'unread.count.other': '{count} unread',
  'unread.list': 'Unread messages',
  'jobs.count.one': '{count} running',
  'jobs.count.other': '{count} running',
  'jobs.list': 'Background jobs',
  'jobs.status.running': 'Running',
  'jobs.status.stopping': 'Stopping',
}
