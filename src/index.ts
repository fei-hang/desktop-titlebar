/**
 * Host half of the desktop title bar plugin.
 *
 * The bar itself is browser presentation, but restarting DSH needs a process
 * that outlives the one answering the click: this module registers a route the
 * bar posts to, and that route hands the actual work to a short-lived script
 * started through WMI. WMI is the only spawn path proven here to survive its
 * parent's death - a plain detached child is reaped with the process group.
 *
 * The restart keeps the window as the user left it: a maximized window comes
 * back maximized, a windowed one comes back windowed. The application itself
 * persists no window state - it always builds a 1280x820 window - so the helper
 * reads the placement of the live window before killing it and re-applies it to
 * the window the relaunched process creates.
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

/** Milliseconds the helper waits for the relaunched window before giving up. */
const WINDOW_TIMEOUT_MS = 60000

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
 * Build the PowerShell body of the helper.
 *
 * It reads the live window's placement, kills the application, starts it again,
 * and re-applies the placement. `showCmd` 3 is SW_SHOWMAXIMIZED; anything else
 * is left alone, so a windowed restart needs no second step.
 * @param executable - absolute path of the desktop executable.
 * @param windowName - process name without its extension.
 * @returns the script text.
 */
function helperScript(executable: string, windowName: string): string {
  const quote = (value: string): string => `'${value.replaceAll("'", "''")}'`
  return [
    "$ErrorActionPreference = 'Stop'",
    `$exe = ${quote(executable)}`,
    `$windowName = ${quote(windowName)}`,
    '',
    'Add-Type -TypeDefinition @"',
    'using System;',
    'using System.Runtime.InteropServices;',
    'public static class DshWindow {',
    '  [StructLayout(LayoutKind.Sequential)]',
    '  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }',
    '  [StructLayout(LayoutKind.Sequential)]',
    '  public struct POINT { public int X; public int Y; }',
    '  [StructLayout(LayoutKind.Sequential)]',
    '  public struct WINDOWPLACEMENT {',
    '    public int length; public int flags; public int showCmd;',
    '    public POINT ptMinPosition; public POINT ptMaxPosition; public RECT rcNormalPosition;',
    '  }',
    '  [DllImport("user32.dll")]',
    '  public static extern bool GetWindowPlacement(IntPtr handle, ref WINDOWPLACEMENT placement);',
    '  [DllImport("user32.dll")]',
    '  public static extern bool ShowWindow(IntPtr handle, int command);',
    '  [DllImport("user32.dll")]',
    '  public static extern bool SetWindowPos(IntPtr handle, IntPtr after, int x, int y, int width, int height, uint flags);',
    '  public static int ShowCommand(IntPtr handle) {',
    '    WINDOWPLACEMENT placement = new WINDOWPLACEMENT();',
    '    placement.length = Marshal.SizeOf(typeof(WINDOWPLACEMENT));',
    '    return GetWindowPlacement(handle, ref placement) ? placement.showCmd : 0;',
    '  }',
    '  public static int[] NormalRect(IntPtr handle) {',
    '    WINDOWPLACEMENT placement = new WINDOWPLACEMENT();',
    '    placement.length = Marshal.SizeOf(typeof(WINDOWPLACEMENT));',
    '    if (!GetWindowPlacement(handle, ref placement)) return new int[0];',
    '    return new int[] { placement.rcNormalPosition.Left, placement.rcNormalPosition.Top,',
    '      placement.rcNormalPosition.Right - placement.rcNormalPosition.Left,',
    '      placement.rcNormalPosition.Bottom - placement.rcNormalPosition.Top };',
    '  }',
    '}',
    '"@',
    '',
    'function Get-MainWindow {',
    '  $found = Get-Process -Name $windowName -ErrorAction SilentlyContinue |',
    '    Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } |',
    '    Select-Object -First 1',
    '  if ($null -eq $found) { return [IntPtr]::Zero }',
    '  return $found.MainWindowHandle',
    '}',
    '',
    `Start-Sleep -Milliseconds ${String(KILL_DELAY_MS)}`,
    '$handle = Get-MainWindow',
    '$maximized = $false',
    '$rect = @()',
    'if ($handle -ne [IntPtr]::Zero) {',
    '  $maximized = ([DshWindow]::ShowCommand($handle) -eq 3)',
    '  $rect = [DshWindow]::NormalRect($handle)',
    '}',
    '',
    '# The Host runs as ELECTRON_RUN_AS_NODE; a relaunch that inherits it would',
    '# start the executable as a Node script instead of the desktop app.',
    'Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue',
    'Remove-Item Env:DSH_DESKTOP_NODE_EXECUTABLE -ErrorAction SilentlyContinue',
    '& taskkill /F /IM "$windowName.exe" 2>$null | Out-Null',
    `Start-Sleep -Milliseconds ${String(RELAUNCH_DELAY_MS)}`,
    'Start-Process -FilePath $exe -WorkingDirectory (Split-Path -Parent $exe)',
    '',
    `$deadline = (Get-Date).AddMilliseconds(${String(WINDOW_TIMEOUT_MS)})`,
    'while ((Get-Date) -lt $deadline) {',
    '  Start-Sleep -Milliseconds 250',
    '  $handle = Get-MainWindow',
    '  if ($handle -ne [IntPtr]::Zero) { break }',
    '}',
    'if ($handle -ne [IntPtr]::Zero) {',
    '  # The window is still settling into its first layout; act after that.',
    '  Start-Sleep -Milliseconds 700',
    '  if ($maximized) {',
    '    [DshWindow]::ShowWindow($handle, 3) | Out-Null',
    '  } elseif ($rect.Count -eq 4) {',
    '    [DshWindow]::SetWindowPos($handle, [IntPtr]::Zero, $rect[0], $rect[1], $rect[2], $rect[3], 0x0004) | Out-Null',
    '  }',
    '}',
    '',
    'Remove-Item -LiteralPath $MyInvocation.MyCommand.Path -Force -ErrorAction SilentlyContinue',
    '',
  ].join('\r\n')
}

/**
 * Write the helper: a hidden PowerShell worker plus the VBScript that starts it
 * invisibly.
 *
 * The VBScript is not decoration. WMI starts console programs with a visible
 * console window, and a program launched from that console dies with it -
 * closing the black window used to close DSH. `wscript` is a GUI-subsystem
 * host, so nothing is drawn, and the PowerShell it starts with window style 0
 * stays invisible too.
 * @param executable - absolute path of the desktop executable.
 * @returns absolute path of the VBScript launcher.
 */
function writeHelper(executable: string): string {
  const windowName = basename(executable).replace(/\.exe$/iu, '')
  const worker = join(tmpdir(), 'dsh-titlebar-restart.ps1')
  const launcher = join(tmpdir(), 'dsh-titlebar-restart.vbs')
  writeFileSync(worker, helperScript(executable, windowName), 'utf8')
  const command = `powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "${worker}"`
  const lines = [
    'Set shell = CreateObject("WScript.Shell")',
    `shell.Run "${command.replaceAll('"', '""')}", 0, False`,
    'CreateObject("Scripting.FileSystemObject").DeleteFile WScript.ScriptFullName',
    '',
  ]
  writeFileSync(launcher, lines.join('\r\n'), 'utf8')
  return launcher
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
