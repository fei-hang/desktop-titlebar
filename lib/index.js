/**
 * Host half of dsh-desktop-titlebar.
 *
 * The plugin contributes client UI only: the bar is registered from
 * lib/client.js into the "shell.overlay" slot. This module exists so the
 * profile loader has a plugin to activate (and a bundle patch to insert).
 */

export const name = 'desktop-titlebar'

export const inject = []

export function apply() {
  // Nothing to do on the host side; the client bundle owns the title bar.
}
