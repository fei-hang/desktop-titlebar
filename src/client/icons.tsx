/**
 * The two glyphs the bar draws, kept local on purpose: a client bundle only
 * resolves the modules its package lists as inject edges, and these shapes are
 * small enough to own.
 * @module icons
 */
import type { JSX, ReactNode } from 'react'

/** Props every glyph accepts. */
export interface GlyphProps {
  /** Edge length in pixels; defaults to 16. */
  readonly size?: number
}

/**
 * Build a 16-grid stroked icon from its children.
 * @param children - the shape elements.
 * @returns the icon component.
 */
function glyph(children: ReactNode): (props: GlyphProps) => JSX.Element {
  return function Icon({ size }: GlyphProps) {
    return (
      <svg
        width={size ?? 16}
        height={size ?? 16}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {children}
      </svg>
    )
  }
}

/** New-session glyph: a page with a plus. */
export const IconNewChat = glyph([
  <path key="body" d="M13.5 9.5v3a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h3" />,
  <path key="plus" d="M11.5 1.5v4M9.5 3.5h4" />,
])

/** Menu glyph: four stacked bars. */
export const IconMenu = glyph([
  <path key="a" d="M2.5 4h11" />,
  <path key="b" d="M2.5 6.7h11" />,
  <path key="c" d="M2.5 9.3h11" />,
  <path key="d" d="M2.5 12h11" />,
])

/** Session-history glyph: a clock face. */
export const IconClock = glyph([
  <circle key="dial" cx={8} cy={8} r={6} />,
  <path key="hands" d="M8 4.6V8l2.4 1.5" />,
])

