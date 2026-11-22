/**
 * Host half of the desktop title bar plugin.
 *
 * The bar is browser presentation: the client bundle registers it into the
 * frame's `shell.overlay` seat. This module exists so the profile loader has a
 * plugin to activate and the bundle patch has a row to insert.
 * @module index
 */

/** Row name this package answers to. */
export const name = 'desktop-titlebar'

/** The host half requires no services. */
export const inject: string[] = []

/** Nothing to do on the host side. */
export function apply(): void {}
