"use client"

/**
 * ADVENTURE.EXE: a 1979-style two-word text adventure set in a 1995
 * software office, played from the MS-DOS prompt.
 *
 * The engine is pure: `newGame` builds a state, `advance` takes a state
 * and one typed line and returns the next state plus the lines to print.
 * The DOS window owns nothing but the state object, which is what makes
 * the whole game walkable from a test.
 *
 * The goal: it is the night before launch. Find the SOURCE, feed the
 * BUILD MACHINE, carry the GOLD MASTER to the DUPLICATOR in shipping,
 * and ship it. Fourteen rooms, four locks, no deaths.
 */

type RoomId =
  | "lobby"
  | "closet"
  | "breakroom"
  | "cubicles"
  | "printer"
  | "meeting"
  | "manager"
  | "basement"
  | "shipping"
  | "dock"
  | "stairwell"
  | "server"
  | "qa"
  | "roof"

type ItemId =
  | "flashlight"
  | "tin"
  | "mug"
  | "quarter"
  | "pretzels"
  | "coffee"
  | "keycard"
  | "brasskey"
  | "source"
  | "gold"
  | "bug"

/** Where an item is: a room, your pockets, or consumed. */
type ItemLoc = RoomId | "inv" | "gone" | "hidden"

export interface AdvState {
  room: RoomId
  items: Record<ItemId, ItemLoc>
  /** One boolean per puzzle gate. */
  flags: {
    programmerAwake: boolean
    codeKnown: boolean
    managerUnlocked: boolean
    serverOpen: boolean
    deskSearched: boolean
    printerSearched: boolean
    visited: Partial<Record<RoomId, boolean>>
  }
  moves: number
  /** True once QUIT or the win line has run; the prompt goes back to DOS. */
  over: boolean
  won: boolean
}

interface Room {
  name: string
  desc: (s: AdvState) => string[]
  exits: Partial<Record<"n" | "s" | "e" | "w" | "u" | "d", RoomId>>
}

interface Item {
  /** The word the player types. */
  word: string
  aliases: string[]
  takeable: boolean
  look: (s: AdvState) => string
  /** How the item is announced in a room description. */
  here?: string
}

const ROOMS: Record<RoomId, Room> = {
  lobby: {
    name: "Lobby",
    desc: () => [
      "The lobby of MICROSERF SYSTEMS INC. It is 2:04 AM.",
      "A banner reads SHIP DAY TOMORROW. Someone has crossed",
      "out TOMORROW and written TONIGHT.",
      "The cubicle farm is NORTH, the break room EAST, a supply",
      "closet WEST. Stairs lead UP. A dark doorway leads DOWN.",
    ],
    exits: { n: "cubicles", e: "breakroom", w: "closet", u: "stairwell", d: "basement" },
  },
  closet: {
    name: "Supply closet",
    desc: () => [
      "A supply closet. Shelves of toner, one thousand pens that",
      "do not work, and three that do. The lobby is EAST.",
    ],
    exits: { e: "lobby" },
  },
  breakroom: {
    name: "Break room",
    desc: () => [
      "The break room. A coffee POT squats on a scorched hotplate.",
      "A VENDING machine hums the only tune it knows. The lobby",
      "is WEST.",
    ],
    exits: { w: "lobby" },
  },
  cubicles: {
    name: "Cubicle farm",
    desc: (s) => [
      "The cubicle farm, lit by one flickering tube. A PROGRAMMER",
      s.flags.programmerAwake
        ? "types at his TERMINAL at an alarming rate."
        : "is asleep face-down on his keyboard. His TERMINAL is",
      ...(s.flags.programmerAwake ? [] : ["printing the letter J forever."]),
      "The meeting room is NORTH, the printer nook EAST, the",
      "manager's office WEST, the lobby SOUTH.",
    ],
    exits: { n: "meeting", e: "printer", w: "manager", s: "lobby" },
  },
  printer: {
    name: "Printer nook",
    desc: () => [
      "The printer nook. The PRINTER displays PC LOAD LETTER,",
      "which clarifies nothing. The cubicles are WEST.",
    ],
    exits: { w: "cubicles" },
  },
  meeting: {
    name: "Meeting room",
    desc: () => [
      "The meeting room. Chairs face a WHITEBOARD with great",
      "reluctance. The cubicles are SOUTH.",
    ],
    exits: { s: "cubicles" },
  },
  manager: {
    name: "Manager's office",
    desc: () => [
      "The manager's office. A vast DESK, a POSTER of a cat",
      "hanging from a branch, and a window with the good view.",
      "The cubicles are EAST.",
    ],
    exits: { e: "cubicles" },
  },
  basement: {
    name: "Basement",
    desc: () => [
      "The basement, by flashlight. A furnace breathes slowly.",
      "Hooks line one wall. Shipping is EAST, the lobby UP.",
    ],
    exits: { u: "lobby", e: "shipping" },
  },
  shipping: {
    name: "Shipping room",
    desc: () => [
      "The shipping room. A DUPLICATOR the size of a piano waits",
      "with its mouth open. Flattened boxes everywhere. The",
      "basement is WEST, the loading dock EAST.",
    ],
    exits: { w: "basement", e: "dock" },
  },
  dock: {
    name: "Loading dock",
    desc: () => [
      "The loading dock. A TRUCK idles, driverless. The night is",
      "exactly the colour of an unplugged monitor. Shipping is",
      "WEST.",
    ],
    exits: { w: "shipping" },
  },
  stairwell: {
    name: "Second floor landing",
    desc: () => [
      "The second floor landing. The server room is NORTH behind",
      "a keypad. The QA lab is EAST. The roof is UP, the lobby",
      "DOWN.",
    ],
    exits: { n: "server", e: "qa", u: "roof", d: "lobby" },
  },
  server: {
    name: "Server room",
    desc: () => [
      "The server room. Racks hum in a cold wind. In the middle",
      "stands the BUILD machine, a tower with one slot and one",
      "green eye. The landing is SOUTH.",
    ],
    exits: { s: "stairwell" },
  },
  qa: {
    name: "QA lab",
    desc: () => [
      "The QA lab. On a pedestal, lit like a relic: the REGISTER,",
      "glowing gently. A logbook lies open beside a taped-in moth",
      "labelled BUG. The landing is WEST.",
    ],
    exits: { w: "stairwell" },
  },
  roof: {
    name: "Roof",
    desc: () => [
      "The roof. Gravel, one folding chair, a PIGEON with strong",
      "opinions. The city glitters like a motherboard. The",
      "stairwell is DOWN.",
    ],
    exits: { d: "stairwell" },
  },
}

const ITEMS: Record<ItemId, Item> = {
  flashlight: {
    word: "FLASHLIGHT",
    aliases: ["LIGHT", "TORCH"],
    takeable: true,
    here: "A heavy FLASHLIGHT hangs on a nail.",
    look: () => "Government surplus. It could club a bear or light one.",
  },
  tin: {
    word: "TIN",
    aliases: ["COFFEE TIN", "GROUNDS"],
    takeable: true,
    here: "A TIN of coffee grounds sits at eye level.",
    look: () => "MAXIMUM HOUSE brand. Best before a date that has been.",
  },
  mug: {
    word: "MUG",
    aliases: ["CUP"],
    takeable: true,
    here: "Someone abandoned a MUG that says WORLD'S OKAYEST DEV.",
    look: () => "WORLD'S OKAYEST DEV. The honesty is refreshing.",
  },
  quarter: {
    word: "QUARTER",
    aliases: ["COIN"],
    takeable: true,
    here: "A QUARTER glints on the floor.",
    look: () => "1983. A good year for quarters.",
  },
  pretzels: {
    word: "PRETZELS",
    aliases: ["SNACK", "SNACKS"],
    takeable: true,
    here: "A bag of PRETZELS lies in the vending tray.",
    look: () => "Fortified with nothing. You feel a strange loyalty to them.",
  },
  coffee: {
    word: "COFFEE",
    aliases: ["BREW"],
    takeable: true,
    look: () => "Black, vengeful, and exactly what the night calls for.",
  },
  keycard: {
    word: "KEYCARD",
    aliases: ["CARD", "BADGE"],
    takeable: true,
    look: () => "DAVE, ENGINEERING. The photo has seen things.",
  },
  brasskey: {
    word: "KEY",
    aliases: ["BRASS KEY", "BRASSKEY"],
    takeable: true,
    here: "A brass KEY hangs from the last hook, labelled MGMT.",
    look: () => "Brass, stamped MGMT. Management never comes down here.",
  },
  source: {
    word: "SOURCE",
    aliases: ["DISK", "SOURCE DISK", "FLOPPY"],
    takeable: true,
    here: "The SOURCE disk rests where you found it.",
    look: () => "A 3.5 inch floppy: WIN95 FINAL FINAL 2 REAL. This is it.",
  },
  gold: {
    word: "GOLD",
    aliases: ["GOLD MASTER", "MASTER"],
    takeable: true,
    here: "The GOLD master gleams where the build machine left it.",
    look: () => "The gold master. Every light in the building bends to it.",
  },
  bug: {
    word: "BUG",
    aliases: ["MOTH", "LOGBOOK"],
    takeable: true,
    here: "The famous BUG is taped into its logbook.",
    look: () => "A moth, taped under the words FIRST ACTUAL CASE OF BUG",
  },
}

/** Props you can EXAMINE but never pocket, and where they live. */
const PROPS: Record<string, { room: RoomId; aliases: string[]; look: (s: AdvState) => string[] }> = {
  POT: {
    room: "breakroom",
    aliases: ["COFFEE POT", "HOTPLATE", "MACHINE"],
    look: () => ["Empty, scorched, undefeated. It wants GROUNDS and a MUG."],
  },
  VENDING: {
    room: "breakroom",
    aliases: ["VENDING MACHINE"],
    look: () => ["Row C is all pretzels. It takes exactly one QUARTER."],
  },
  PROGRAMMER: {
    room: "cubicles",
    aliases: ["DAVE", "DEVELOPER", "MAN"],
    look: (s) => [
      s.flags.programmerAwake
        ? "Dave, awake, typing like weather. He nods at you between keystrokes."
        : "He sleeps the sleep of the crunched. A post-it on his monitor reads: DO NOT WAKE WITHOUT COFFEE.",
    ],
  },
  TERMINAL: {
    room: "cubicles",
    aliases: ["COMPUTER", "SCREEN"],
    look: (s) => [
      s.flags.programmerAwake
        ? "Dave's terminal scrolls a build log too fast to read."
        : "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",
    ],
  },
  PRINTER: {
    room: "printer",
    aliases: ["LASERJET"],
    look: (s) =>
      s.flags.printerSearched
        ? ["PC LOAD LETTER. It has said this since 1993 and means it."]
        : ["PC LOAD LETTER. You look behind it, as everyone eventually", "does, and a QUARTER drops to the floor."],
  },
  WHITEBOARD: {
    room: "meeting",
    aliases: ["BOARD"],
    look: () => ["In big letters: THE BUILD IS SACRED. FEED IT THE SOURCE.", "Below, smaller: and then SHIP IT. Duplicator is in shipping."],
  },
  DESK: {
    room: "manager",
    aliases: ["DRAWER", "DRAWERS"],
    look: (s) =>
      s.flags.deskSearched
        ? ["Paperclips, a stress ball shaped like a smaller stress ball."]
        : ["You go through the drawers. Under a folder marked SYNERGY", "you find it: the SOURCE disk."],
  },
  POSTER: {
    room: "manager",
    aliases: ["CAT"],
    look: () => ["HANG IN THERE. The cat has been hanging since 1987. It has", "outlasted three reorgs."],
  },
  REGISTER: {
    room: "qa",
    aliases: ["PEDESTAL"],
    look: () => ["The REGISTER glows and holds a single value:", "", "    0x1995", "", "Four digits. The kind a keypad might respect."],
  },
  BUILD: {
    room: "server",
    aliases: ["BUILD MACHINE", "TOWER"],
    look: (s) => [
      s.items.gold === "gone" || s.items.gold === "inv" || s.items.gold === "server"
        ? "The build machine idles, satisfied. Its slot is empty."
        : "One floppy slot, one green eye. It is waiting for the SOURCE.",
    ],
  },
  DUPLICATOR: {
    room: "shipping",
    aliases: ["DUP", "PIANO"],
    look: () => ["A mouth of a machine. It duplicates whatever master you", "feed it, ten thousand times, with love."],
  },
  TRUCK: {
    room: "dock",
    aliases: ["LORRY"],
    look: () => ["Its manifest reads: SOFTWARE, ASSORTED, 1 (ONE) MIRACLE."],
  },
  PIGEON: {
    room: "roof",
    aliases: ["BIRD"],
    look: () => ["The pigeon regards you as middle management. It is not", "wrong tonight."],
  },
  FURNACE: {
    room: "basement",
    aliases: ["HOOKS"],
    look: () => ["The furnace breathes. The hooks hold winter coats and one", "brass KEY, if nobody has taken it."],
  },
}

const DIRS: Record<string, "n" | "s" | "e" | "w" | "u" | "d"> = {
  N: "n", NORTH: "n", S: "s", SOUTH: "s", E: "e", EAST: "e", W: "w", WEST: "w",
  U: "u", UP: "u", D: "d", DOWN: "d",
}

const HELP = [
  "Two words will carry you far:",
  "  NORTH SOUTH EAST WEST UP DOWN   or N S E W U D",
  "  LOOK              look around      X <thing>   examine",
  "  TAKE <thing>      DROP <thing>     I           inventory",
  "  USE <a> ON <b>    GIVE <a> TO <b>  HELP        QUIT",
]

/** Finds an item id by any of its names, or null. */
function itemByWord(word: string): ItemId | null {
  const up = word.toUpperCase()
  for (const [id, it] of Object.entries(ITEMS) as [ItemId, Item][]) {
    if (it.word === up || it.aliases.includes(up)) return id
  }
  return null
}

/** Finds a prop visible in the current room by name, or null. */
function propByWord(s: AdvState, word: string): string | null {
  const up = word.toUpperCase()
  for (const [name, p] of Object.entries(PROPS)) {
    if (p.room !== s.room) continue
    if (name === up || p.aliases.includes(up)) return name
  }
  return null
}

function describe(s: AdvState): string[] {
  const room = ROOMS[s.room]
  const out = [`-- ${room.name} --`, ...room.desc(s)]
  for (const [id, loc] of Object.entries(s.items) as [ItemId, ItemLoc][]) {
    if (loc === s.room && ITEMS[id].here) out.push(ITEMS[id].here as string)
  }
  return out
}

export function newGame(): { state: AdvState; out: string[] } {
  const state: AdvState = {
    room: "lobby",
    items: {
      flashlight: "closet",
      tin: "closet",
      mug: "meeting",
      quarter: "hidden",
      pretzels: "hidden",
      coffee: "hidden",
      keycard: "hidden",
      brasskey: "basement",
      source: "hidden",
      gold: "hidden",
      bug: "qa",
    },
    flags: {
      programmerAwake: false,
      codeKnown: false,
      managerUnlocked: false,
      serverOpen: false,
      deskSearched: false,
      printerSearched: false,
      visited: { lobby: true },
    },
    moves: 0,
    over: false,
    won: false,
  }
  return {
    state,
    out: [
      "ADVENTURE.EXE  (c) 1982-ish, extended 1995",
      "",
      "It is the night before Windows 95 ships and the gold",
      "master does not exist yet. Somebody has to build it,",
      "carry it downstairs, and feed the duplicator.",
      "Everyone else went home. So: you.",
      "",
      "Type HELP for verbs. Type QUIT to give up, coward.",
      "",
      ...describe(state),
      "",
    ],
  }
}

/**
 * Runs one typed line against the state. Returns the next state and the
 * lines to print. Never mutates its input.
 */
export function advance(prev: AdvState, line: string): { state: AdvState; out: string[] } {
  const s: AdvState = structuredClone(prev)
  const words = line.trim().toUpperCase().split(/\s+/).filter(Boolean)
  const done = (...out: string[]) => ({ state: s, out: [...out, ""] })
  if (words.length === 0) return done("Say something. The night is short.")
  s.moves += 1

  const [verb, ...rest] = words
  const restStr = rest.join(" ")

  // -- movement ------------------------------------------------------------
  const dirWord = DIRS[verb] ?? (verb === "GO" && rest[0] ? DIRS[rest[0]] : undefined)
  if (dirWord) return move(s, dirWord, done)

  switch (verb) {
    case "QUIT":
    case "EXIT":
      s.over = true
      return done("You wake at the C:\\ prompt. The office keeps humming", "without you. Somebody else will ship it. Probably.")

    case "HELP":
    case "?":
      return done(...HELP)

    case "LOOK":
    case "L":
      return done(...describe(s))

    case "INVENTORY":
    case "INV":
    case "I": {
      const held = (Object.entries(s.items) as [ItemId, ItemLoc][]).filter(([, l]) => l === "inv")
      if (held.length === 0) return done("You are carrying nothing but responsibility.")
      return done("You are carrying:", ...held.map(([id]) => `  ${ITEMS[id].word}`))
    }

    case "EXAMINE":
    case "X":
    case "READ": {
      if (!restStr) return done("Examine what?")
      const prop = propByWord(s, restStr)
      if (prop) return examineProp(s, prop, done)
      const id = itemByWord(restStr)
      if (id && (s.items[id] === "inv" || s.items[id] === s.room)) return done(ITEMS[id].look(s))
      return done("You see no such thing here.")
    }

    case "TAKE":
    case "GET":
    case "GRAB": {
      if (!restStr) return done("Take what?")
      const prop = propByWord(s, restStr)
      if (prop === "REGISTER") {
        s.flags.codeKnown = true
        return done("Bolted down. But its glow spells out the one number", "this company remembers: 0x1995. That stays with you.")
      }
      if (prop) return done("It belongs to the building. The building would notice.")
      const id = itemByWord(restStr)
      if (!id || s.items[id] !== s.room) return done("You see no such thing here.")
      if (!ITEMS[id].takeable) return done("It will not move.")
      s.items[id] = "inv"
      return done(`You take the ${ITEMS[id].word}.`)
    }

    case "DROP": {
      const id = itemByWord(restStr)
      if (!id || s.items[id] !== "inv") return done("You are not carrying that.")
      if (id === "gold") return done("Your hands refuse. Not after everything.")
      s.items[id] = s.room
      return done(`You set the ${ITEMS[id].word} down.`)
    }

    case "BREW":
      return brew(s, done)

    case "USE":
    case "GIVE": {
      const onAt = rest.findIndex((w) => w === "ON" || w === "TO" || w === "WITH" || w === "IN")
      const aWord = onAt === -1 ? restStr : rest.slice(0, onAt).join(" ")
      const bWord = onAt === -1 ? "" : rest.slice(onAt + 1).join(" ")
      return applyUse(s, aWord, bWord, done)
    }

    case "SHIP":
      return done("First the build, then the basement, then the ship.")

    case "XYZZY":
      return done("A hollow voice says: wrong game. Try the minefield.")

    case "HELLO":
    case "HI":
      return done("The fluorescent lights flicker in a friendly way.")

    default:
      return done("That verb never compiled. Type HELP.")
  }
}

// ---------------------------------------------------------------------------

function move(
  s: AdvState,
  dir: "n" | "s" | "e" | "w" | "u" | "d",
  done: (...out: string[]) => { state: AdvState; out: string[] },
) {
  const dest = ROOMS[s.room].exits[dir]
  if (!dest) return done("The wall disagrees.")

  // The four locks.
  if (s.room === "lobby" && dest === "basement" && s.items.flashlight !== "inv") {
    return done("Pitch black down there. You would trip on the very first", "thing. A FLASHLIGHT would change the argument.")
  }
  if (s.room === "lobby" && dest === "stairwell" && s.items.keycard !== "inv") {
    return done("The stairwell door has a card reader. It blinks red at", "you, personally.")
  }
  if (s.room === "cubicles" && dest === "manager" && !s.flags.managerUnlocked) {
    if (s.items.brasskey === "inv") {
      s.flags.managerUnlocked = true
      return enter(s, dest, done, "The brass key turns like it has waited years.")
    }
    return done("Locked. A brass keyhole, management grade.")
  }
  if (s.room === "stairwell" && dest === "server" && !s.flags.serverOpen) {
    if (s.flags.codeKnown) {
      s.flags.serverOpen = true
      return enter(s, dest, done, "You tap 1 9 9 5. The lock thinks it over and agrees.")
    }
    return done("A keypad. Four digits. You do not know them. Somewhere,", "something in this building must remember a number.")
  }
  return enter(s, dest, done)
}

function enter(
  s: AdvState,
  dest: RoomId,
  done: (...out: string[]) => { state: AdvState; out: string[] },
  ...pre: string[]
) {
  s.room = dest
  const first = !s.flags.visited[dest]
  s.flags.visited[dest] = true
  // A room re-describes in full on first entry, by name after that.
  return done(...pre, ...(first ? describe(s) : [`-- ${ROOMS[dest].name} --`]))
}

function examineProp(
  s: AdvState,
  name: string,
  done: (...out: string[]) => { state: AdvState; out: string[] },
) {
  const lines = PROPS[name].look(s)
  if (name === "REGISTER") s.flags.codeKnown = true
  if (name === "DESK" && !s.flags.deskSearched) {
    s.flags.deskSearched = true
    s.items.source = "manager"
  }
  if (name === "PRINTER" && !s.flags.printerSearched) {
    s.flags.printerSearched = true
    s.items.quarter = "printer"
  }
  return done(...lines)
}

function brew(s: AdvState, done: (...out: string[]) => { state: AdvState; out: string[] }) {
  if (s.room !== "breakroom") return done("Not without the pot. The pot lives in the break room.")
  if (s.items.tin !== "inv") return done("No grounds, no coffee. The TIN is the whole trick.")
  if (s.items.mug !== "inv") return done("You almost brew straight onto the hotplate. History", "would not forgive it. You need a MUG.")
  s.items.tin = "gone"
  s.items.coffee = "inv"
  return done("The pot gurgles, chokes, and delivers. The MUG fills with", "COFFEE strong enough to refactor a man.")
}

function applyUse(
  s: AdvState,
  aWord: string,
  bWord: string,
  done: (...out: string[]) => { state: AdvState; out: string[] },
) {
  const a = itemByWord(aWord)
  const bProp = bWord ? propByWord(s, bWord) : null

  // Brew: USE TIN ON POT.
  if (a === "tin" && (bProp === "POT" || !bWord)) return brew(s, done)

  // Vending: USE QUARTER ON VENDING.
  if (a === "quarter" && (bProp === "VENDING" || !bWord)) {
    if (s.room !== "breakroom") return done("Nothing here takes quarters.")
    if (s.items.quarter !== "inv") return done("You are not carrying a quarter.")
    s.items.quarter = "gone"
    s.items.pretzels = "breakroom"
    return done("The coil turns forever, considers keeping them, and drops", "the PRETZELS at last.")
  }

  // Coffee to the programmer: the keycard changes hands.
  if (a === "coffee" && (bProp === "PROGRAMMER" || !bWord)) {
    if (s.items.coffee !== "inv") return done("You have no coffee. Only the idea of coffee.")
    if (s.room !== "cubicles") return done("Nobody here needs it more than you do.")
    if (s.flags.programmerAwake) return done("Dave waves it off. He has ascended beyond caffeine.")
    s.items.coffee = "gone"
    s.flags.programmerAwake = true
    s.items.keycard = "inv"
    return done(
      "Dave surfaces on the third sip. He looks at the clock,",
      "says a word you will not repeat, and slaps his KEYCARD",
      "into your hand: 'Server room. Build it. GO.'",
    )
  }

  // The build: USE SOURCE ON BUILD.
  if (a === "source" && (bProp === "BUILD" || !bWord)) {
    if (s.items.source !== "inv") return done("You do not have the source. It exists, somewhere. It must.")
    if (s.room !== "server") return done("Nothing here can compile it. The BUILD machine is upstairs.")
    s.items.source = "gone"
    s.items.gold = "inv"
    return done(
      "The slot takes the disk with intent. Fans rise to a note",
      "the racks have never sung. Lines scroll. Time passes the",
      "way it does in credits. Then: a clunk, a tray, and",
      "",
      "    THE GOLD MASTER.",
      "",
      "It is warm. Get it to the DUPLICATOR in shipping.",
    )
  }

  // The win: USE GOLD ON DUPLICATOR.
  if (a === "gold" && (bProp === "DUPLICATOR" || !bWord)) {
    if (s.items.gold !== "inv") return done("You have nothing worth duplicating. Yet.")
    if (s.room !== "shipping") return done("The duplicator is in the shipping room, downstairs.")
    s.items.gold = "gone"
    s.over = true
    s.won = true
    return done(
      "The duplicator accepts the master like a communion wafer.",
      "Ten thousand drives begin to write at once. Through the",
      "wall you hear the truck's engine change its mind about",
      "the night.",
      "",
      "Out on the dock, dawn is compiling.",
      "",
      "*** You have shipped WINDOWS 95 ***",
      `*** in ${s.moves} moves ***`,
      "",
      "You wake at the C:\\ prompt, and it was worth it.",
    )
  }

  if (a && s.items[a] !== "inv" && s.items[a] !== s.room) return done("You do not have that.")
  if (!a && !bProp) return done("Use what?")
  return done("Nothing happens, which is its own kind of answer.")
}
