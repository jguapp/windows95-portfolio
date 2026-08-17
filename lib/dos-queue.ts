"use client"

/**
 * A command waiting for the MS-DOS Prompt.
 *
 * Start > Documents > VIRUS.EXE has to do two things in one click: open the
 * window and type at it. Dispatching an event for the second part loses the
 * race, because the window mounts on a later render and its listener is not
 * there yet to hear it. So the command is left here instead, and the prompt
 * collects it when it arrives, whether that is this render or the next.
 *
 * Taking a command clears it, so a queued line runs exactly once.
 */

let pending: string | null = null

/** Leaves a command for the prompt, replacing any earlier one. */
export function queueDosCommand(command: string) {
  pending = command
  // A nudge for a prompt that is already open and has nothing to wait for.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("runDosCommand"))
  }
}

/** Collects the waiting command, if there is one, and clears it. */
export function takeDosCommand(): string | null {
  const command = pending
  pending = null
  return command
}
