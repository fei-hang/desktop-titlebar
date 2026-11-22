/**
 * Host half of the desktop title bar plugin.
 *
 * The bar itself is browser presentation, but restarting DSH needs a process
 * that outlives the one answering the click: this module registers a route the
 * bar posts to, and that route hands the actual work to a short-lived script
 * started through WMI. WMI is the only spawn path proven here to survive its
 * parent's death - a plain detached child is reaped with the process group.
 * @module index
 */

import { spawn } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'

/** Row name this package answers to. */
export const name = 'desktop-titlebar'

/** The restart route is the only service this half needs. */
export const inject = ['webServer']

/** Path the bar posts to. */
const RESTART_PATH = '/dsh-titlebar/restart'

/** Milliseconds the helper waits before it kills the running application. */
const KILL_DELAY_MS = 2000

/** Milliseconds the helper waits between the kill and the relaunch. */
const RELAUNCH_DELAY_MS = 3000

/** The slice of the Host web server this plugin uses. */
interface WebServerLike {
  register(route: {
    readonly kind: 'exact'
    readonly path: string
    readonly handler: (request: IncomingMessage, response: ServerResponse) => void
  }): () => void
}

/**
 * Write a JSON response, tolerating a socket the client already dropped.
 * @param response - the Host response.
 * @param status - HTTP status code.
 * @param payload - body, serialized as JSON.
 */
function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  if (response.writableEnded) return
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': String(body.byteLength),
  })
  response.end(body)
}

/**
 * Write the helper script: wait, kill every DSH process, wait, start the app
 * again, then delete itself.
 *
 * It is a VBScript rather than a batch file on purpose. WMI starts console
 * programs with a visible console window, and a program launched from that
 * console dies with it - closing the black window used to close DSH. `wscript`
 * is a GUI-subsystem host, so nothing is drawn, and every child it starts with
 * window style 0 stays invisible too.
 * @param executable - absolute path of the desktop executable.
 * @returns absolute path of the written script.
 */
function writeHelper(executable: string): string {
  const file = join(tmpdir(), 'dsh-titlebar-restart.vbs')
  const lines = [
    'Set shell = CreateObject("WScript.Shell")',
    // The Host runs as ELECTRON_RUN_AS_NODE; a relaunch that inherits it would
    // start the executable as a Node script instead of the desktop app.
    'On Error Resume Next',
    'Set env = shell.Environment("PROCESS")',
    'env.Remove "ELECTRON_RUN_AS_NODE"',
    'env.Remove "DSH_DESKTOP_NODE_EXECUTABLE"',
    'On Error GoTo 0',
    `WScript.Sleep ${String(KILL_DELAY_MS)}`,
    `shell.Run "taskkill /F /IM ""${basename(executable)}""", 0, True`,
    `WScript.Sleep ${String(RELAUNCH_DELAY_MS)}`,
    `shell.Run """${executable}""", 1, False`,
    'On Error Resume Next',
    'CreateObject("Scripting.FileSystemObject").DeleteFile WScript.ScriptFullName',
    '',
  ]
  writeFileSync(file, lines.join('\r\n'), 'utf8')
  return file
}

/**
 * Ask WMI to start the helper outside this process tree.
 * @param script - absolute path of the helper script.
 * @returns the invocation child process.
 */
function startHelper(script: string): ReturnType<typeof spawn> {
  // `//B` keeps wscript silent: no window, no error dialogs.
  const command = `$ErrorActionPreference='Stop'; Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = 'wscript.exe //B "${script}"' } | Out-Null`
  return spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-WindowStyle', 'Hidden',
    '-Command', command,
  ], { stdio: 'ignore', windowsHide: true })
}

/**
 * Register the restart route.
 * @param ctx - Host Cordis context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => {
    const server = ctx.get('webServer') as WebServerLike | undefined
    if (server === undefined) return () => {}

    const handler = (request: IncomingMessage, response: ServerResponse): void => {
      // The body carries nothing; drain it so the socket can be reused.
      request.resume()
      if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'method not allowed' })
        return
      }
      if (process.platform !== 'win32') {
        sendJson(response, 501, { error: 'restart is only implemented on Windows' })
        return
      }
      const executable = process.execPath
      if (!executable.toLowerCase().endsWith('.exe') || !existsSync(executable)) {
        sendJson(response, 500, { error: 'cannot locate the desktop executable' })
        return
      }
      try {
        const script = writeHelper(executable)
        const child = startHelper(script)
        child.on('error', (error: unknown) => {
          console.warn('[dsh-desktop-titlebar] restart helper failed', error)
        })
      } catch (error) {
        console.warn('[dsh-desktop-titlebar] restart failed', error)
        sendJson(response, 500, { error: 'restart failed' })
        return
      }
      // The helper waits first, so this answer reaches the bar before the app goes away.
      sendJson(response, 202, { status: 'restarting', delaySeconds: KILL_DELAY_MS / 1000 })
    }

    const dispose = server.register({ kind: 'exact', path: RESTART_PATH, handler })
    return () => { dispose() }
  }, 'desktop-titlebar: restart route')
}
