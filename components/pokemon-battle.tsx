"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"

interface PokemonBattleProps {
  onClose: () => void
}

// Define all Pokémon types
type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy"

// Update the Pokemon interface to include an id for easier tracking
interface Pokemon {
  id: number
  name: string
  hp: number
  maxHp: number
  level: number
  moves: Move[]
  sprite: string
  types: PokemonType[] // Change from type string to types array of PokemonType
  isEnemy?: boolean
  fainted: boolean
  gender?: "male" | "female" | "none"
}

interface Move {
  name: string
  power: number
  type: PokemonType // Use PokemonType for move types
  pp: number
  maxPp: number
}

// Type effectiveness chart - first index is attacking type, second is defending type
const typeEffectivenessChart: Record<PokemonType, Record<PokemonType, number>> = {
  normal: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 0.5,
    ghost: 0,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  fire: {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 1,
    grass: 2,
    ice: 2,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 2,
    rock: 0.5,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 2,
    fairy: 1,
  },
  water: {
    normal: 1,
    fire: 2,
    water: 0.5,
    electric: 1,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 2,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 2,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 1,
    fairy: 1,
  },
  electric: {
    normal: 1,
    fire: 1,
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 0,
    flying: 2,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 1,
    fairy: 1,
  },
  grass: {
    normal: 1,
    fire: 0.5,
    water: 2,
    electric: 1,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    psychic: 1,
    bug: 0.5,
    rock: 2,
    ghost: 1,
    dragon: 0.5,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  ice: {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 1,
    grass: 2,
    ice: 0.5,
    fighting: 1,
    poison: 1,
    ground: 2,
    flying: 2,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 2,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  fighting: {
    normal: 2,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 2,
    fighting: 1,
    poison: 0.5,
    ground: 1,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dragon: 1,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 2,
    ice: 1,
    fighting: 1,
    poison: 0.5,
    ground: 0.5,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 0.5,
    ghost: 0.5,
    dragon: 1,
    dark: 1,
    steel: 0,
    fairy: 2,
  },
  ground: {
    normal: 1,
    fire: 2,
    water: 1,
    electric: 2,
    grass: 0.5,
    ice: 1,
    fighting: 1,
    poison: 2,
    ground: 1,
    flying: 0,
    psychic: 1,
    bug: 0.5,
    rock: 2,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 2,
    fairy: 1,
  },
  flying: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 0.5,
    grass: 2,
    ice: 1,
    fighting: 2,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 2,
    rock: 0.5,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  psychic: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 2,
    poison: 2,
    ground: 1,
    flying: 1,
    psychic: 0.5,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 1,
    dark: 0,
    steel: 0.5,
    fairy: 1,
  },
  bug: {
    normal: 1,
    fire: 0.5,
    water: 1,
    electric: 1,
    grass: 2,
    ice: 1,
    fighting: 0.5,
    poison: 0.5,
    ground: 1,
    flying: 0.5,
    psychic: 2,
    bug: 1,
    rock: 1,
    ghost: 0.5,
    dragon: 1,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    normal: 1,
    fire: 2,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 2,
    fighting: 0.5,
    poison: 1,
    ground: 0.5,
    flying: 2,
    psychic: 1,
    bug: 2,
    rock: 1,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 1,
  },
  ghost: {
    normal: 0,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 0,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 2,
    bug: 1,
    rock: 1,
    ghost: 2,
    dragon: 1,
    dark: 0.5,
    steel: 1,
    fairy: 1,
  },
  dragon: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 2,
    dark: 1,
    steel: 0.5,
    fairy: 0,
  },
  dark: {
    normal: 1,
    fire: 1,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 0.5,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 2,
    bug: 1,
    rock: 1,
    ghost: 2,
    dragon: 1,
    dark: 0.5,
    steel: 1,
    fairy: 0.5,
  },
  steel: {
    normal: 1,
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    grass: 1,
    ice: 2,
    fighting: 1,
    poison: 1,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 2,
    ghost: 1,
    dragon: 1,
    dark: 1,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    normal: 1,
    fire: 0.5,
    water: 1,
    electric: 1,
    grass: 1,
    ice: 1,
    fighting: 2,
    poison: 0.5,
    ground: 1,
    flying: 1,
    psychic: 1,
    bug: 1,
    rock: 1,
    ghost: 1,
    dragon: 2,
    dark: 2,
    steel: 0.5,
    fairy: 1,
  },
}

// Helper function to get type effectiveness multiplier
const getTypeEffectiveness = (attackType: PokemonType, defenderTypes: PokemonType[]): number => {
  let effectiveness = 1.0

  // Apply effectiveness for each of defender's types
  for (const defenderType of defenderTypes) {
    effectiveness *= typeEffectivenessChart[attackType][defenderType]
  }

  return effectiveness
}

// Helper function to describe type effectiveness
const getTypeEffectivenessDescription = (multiplier: number): string => {
  if (multiplier === 0) return "It had no effect..."
  if (multiplier < 1) return "It's not very effective..."
  if (multiplier > 1) return "It's super effective!"
  return "" // Normal effectiveness
}

// Helper function to generate random level between 30-40
const getRandomLevel = () => Math.floor(Math.random() * 11) + 30 // 30-40

// Helper function to calculate HP based on level
const calculateHP = (baseHP: number, level: number) => {
  return Math.floor(baseHP * (level / 5))
}

// Update the component to include teams of Windows 95-themed Pokémon
export default function PokemonBattle({ onClose }: PokemonBattleProps) {
  // Animation states
  const [attackAnimation, setAttackAnimation] = useState<{
    isActive: boolean
    isPlayerAttacking: boolean
    effect: string
  }>({
    isActive: false,
    isPlayerAttacking: false,
    effect: "none",
  })

  // New fainting animation state
  const [faintingAnimation, setFaintingAnimation] = useState<{
    isActive: boolean
    isPlayerPokemon: boolean
  }>({
    isActive: false,
    isPlayerPokemon: false,
  })

  // Create arrays of Windows 95-themed Pokémon for both player and enemy with randomized levels
  const [playerTeam, setPlayerTeam] = useState<Pokemon[]>([
    {
      id: 1,
      name: "VIRUSITE",
      level: getRandomLevel(),
      types: ["poison", "bug"],
      gender: "male",
      sprite: "/images/pokemon/PARASECT.png", // PARASECT
      moves: [
        { name: "INFECT DRIVE", power: 70, type: "poison", pp: 15, maxPp: 15 },
        { name: "SPORE SPAM", power: 60, type: "bug", pp: 20, maxPp: 20 },
        { name: "ROOT ACCESS", power: 50, type: "grass", pp: 25, maxPp: 25 },
        { name: "SYSTEM DRAIN", power: 80, type: "dark", pp: 10, maxPp: 10 },
      ],
      hp: 0, // Will be calculated after initialization
      maxHp: 0, // Will be calculated after initialization
      fainted: false,
    },
    {
      id: 2,
      name: "MIMICTREE",
      level: getRandomLevel(),
      types: ["rock", "grass"],
      gender: "male",
      sprite: "/images/pokemon/SUDOWOODO.png", // SUDOWOODO
      moves: [
        { name: "FAKE FOLDER", power: 80, type: "normal", pp: 15, maxPp: 15 },
        { name: "ROCK FIREWALL", power: 60, type: "rock", pp: 20, maxPp: 20 },
        { name: "BRANCH LOGIC", power: 50, type: "grass", pp: 25, maxPp: 25 },
        { name: "SUDO COMMAND", power: 70, type: "psychic", pp: 15, maxPp: 15 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 3,
      name: "VOLTCORE",
      level: getRandomLevel(),
      types: ["electric", "fighting"],
      gender: "male",
      sprite: "/images/pokemon/ELECTIVIRE.png", // ELECTIVIRE
      moves: [
        { name: "POWER SURGE", power: 90, type: "electric", pp: 10, maxPp: 10 },
        { name: "CPU OVERLOAD", power: 60, type: "psychic", pp: 20, maxPp: 20 },
        { name: "THUNDER PUNCH", power: 75, type: "electric", pp: 15, maxPp: 15 },
        { name: "PROCESSOR BURN", power: 80, type: "fire", pp: 10, maxPp: 10 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 4,
      name: "DATASTRIPE",
      level: getRandomLevel(),
      types: ["normal", "dark"],
      gender: "female",
      sprite: "/images/pokemon/LINOONE.png", // LINOONE
      moves: [
        { name: "QUICK SEARCH", power: 80, type: "normal", pp: 15, maxPp: 15 },
        { name: "STRIPE READ", power: 60, type: "psychic", pp: 20, maxPp: 20 },
        { name: "DISK SCRATCH", power: 70, type: "dark", pp: 15, maxPp: 15 },
        { name: "RAPID ACCESS", power: 50, type: "normal", pp: 25, maxPp: 25 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 5,
      name: "RAMFANG",
      level: getRandomLevel(),
      types: ["fairy", "fighting"],
      gender: "female",
      sprite: "/images/pokemon/GRANBULL.png", // GRANBULL
      moves: [
        { name: "MEMORY BITE", power: 80, type: "dark", pp: 15, maxPp: 15 },
        { name: "CACHE CRUSH", power: 70, type: "fighting", pp: 15, maxPp: 15 },
        { name: "FAIRY PROCESS", power: 60, type: "fairy", pp: 20, maxPp: 20 },
        { name: "INTIMIDATE EXE", power: 50, type: "normal", pp: 25, maxPp: 25 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 6,
      name: "TENTANET",
      level: getRandomLevel(),
      types: ["water", "poison"],
      gender: "male",
      sprite: "/images/pokemon/TENTACRUEL.png", // TENTACRUEL
      moves: [
        { name: "NETWORK STING", power: 70, type: "poison", pp: 15, maxPp: 15 },
        { name: "HYDRO PACKET", power: 50, type: "water", pp: 25, maxPp: 25 },
        { name: "TENTACLE WIRE", power: 60, type: "electric", pp: 20, maxPp: 20 },
        { name: "DATA STREAM", power: 80, type: "water", pp: 10, maxPp: 10 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
  ])

  const [enemyTeam, setEnemyTeam] = useState<Pokemon[]>([
    {
      id: 1,
      name: "DARKBYTE",
      level: getRandomLevel(),
      types: ["dark", "dragon"],
      gender: "male",
      isEnemy: true,
      sprite: "/images/pokemon/MIGHTY.png", // Updated to local path
      moves: [
        { name: "SHADOW HACK", power: 70, type: "dark", pp: 15, maxPp: 15 },
        { name: "DRAGON FORCE", power: 80, type: "dragon", pp: 15, maxPp: 15 },
        { name: "CORRUPT CODE", power: 60, type: "poison", pp: 20, maxPp: 20 },
        { name: "VOID STRIKE", power: 50, type: "ghost", pp: 25, maxPp: 25 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 2,
      name: "NIGHTOWL",
      level: getRandomLevel(),
      types: ["flying", "psychic"],
      gender: "male",
      isEnemy: true,
      sprite: "/images/pokemon/NOCTOWL.png", // Updated to local path
      moves: [
        { name: "NIGHT SCAN", power: 90, type: "dark", pp: 10, maxPp: 10 },
        { name: "AIR PROTOCOL", power: 60, type: "flying", pp: 20, maxPp: 20 },
        { name: "MIND PROBE", power: 70, type: "psychic", pp: 15, maxPp: 15 },
        { name: "SILENT WING", power: 50, type: "flying", pp: 25, maxPp: 25 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 3,
      name: "CYBERSHARK",
      level: getRandomLevel(),
      types: ["water", "dark"],
      gender: "male",
      isEnemy: true,
      sprite: "/images/pokemon/SHARPEDO.png", // Updated to local path
      moves: [
        { name: "DATA BREACH", power: 80, type: "dark", pp: 15, maxPp: 15 },
        { name: "HYDRO CRASH", power: 60, type: "water", pp: 20, maxPp: 20 },
        { name: "BINARY BITE", power: 70, type: "steel", pp: 15, maxPp: 15 },
        { name: "DEEP DIVE", power: 50, type: "water", pp: 25, maxPp: 25 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 4,
      name: "MALWARAT",
      level: getRandomLevel(),
      types: ["normal", "dark"],
      gender: "male",
      isEnemy: true,
      sprite: "/images/pokemon/BRUTICATE.png", // Updated to local path
      moves: [
        { name: "TROJAN GNAW", power: 70, type: "dark", pp: 15, maxPp: 15 },
        { name: "BACKDOOR", power: 60, type: "ghost", pp: 20, maxPp: 20 },
        { name: "SYSTEM INFILTRATE", power: 50, type: "poison", pp: 25, maxPp: 25 },
        { name: "BRUTE FORCE", power: 80, type: "fighting", pp: 10, maxPp: 10 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 5,
      name: "BONEGUARD",
      level: getRandomLevel(),
      types: ["ground", "ghost"],
      gender: "male",
      isEnemy: true,
      sprite: "/images/pokemon/MAROWAK.png", // Updated to local path
      moves: [
        { name: "FIREWALL CLUB", power: 60, type: "fire", pp: 20, maxPp: 20 },
        { name: "BONE KERNEL", power: 50, type: "ground", pp: 25, maxPp: 25 },
        { name: "GHOST PROCESS", power: 70, type: "ghost", pp: 15, maxPp: 15 },
        { name: "SKULL BASH", power: 40, type: "normal", pp: 30, maxPp: 30 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
    {
      id: 6,
      name: "IRONWING",
      level: getRandomLevel(),
      types: ["steel", "flying"],
      gender: "male",
      isEnemy: true,
      sprite: "/images/pokemon/SKARMORY.png", // Updated to local path
      moves: [
        { name: "STEEL DEFENSE", power: 80, type: "steel", pp: 10, maxPp: 10 },
        { name: "BLADE SERVER", power: 70, type: "steel", pp: 15, maxPp: 15 },
        { name: "AIR SLASH", power: 60, type: "flying", pp: 20, maxPp: 20 },
        { name: "METAL WING", power: 50, type: "steel", pp: 25, maxPp: 25 },
      ],
      hp: 0,
      maxHp: 0,
      fainted: false,
    },
  ])

  // Initialize HP values based on level
  useEffect(() => {
    // Calculate HP for player team
    const updatedPlayerTeam = playerTeam.map((pokemon) => {
      const baseHP = 50 // Base HP value
      const maxHp = calculateHP(baseHP, pokemon.level)
      return {
        ...pokemon,
        hp: maxHp,
        maxHp: maxHp,
      }
    })
    setPlayerTeam(updatedPlayerTeam)

    // Calculate HP for enemy team
    const updatedEnemyTeam = enemyTeam.map((pokemon) => {
      const baseHP = 50 // Base HP value
      const maxHp = calculateHP(baseHP, pokemon.level)
      return {
        ...pokemon,
        hp: maxHp,
        maxHp: maxHp,
      }
    })
    setEnemyTeam(updatedEnemyTeam)
  }, [])

  // Track the current active Pokemon for both sides
  const [currentPlayerPokemon, setCurrentPlayerPokemon] = useState<number>(0)
  const [currentEnemyPokemon, setCurrentEnemyPokemon] = useState<number>(0)

  // Track selected move in the move grid
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(0)

  // Track selected menu option
  const [selectedMenuOption, setSelectedMenuOption] = useState<string>("FIGHT")

  // Track selected Pokemon in the selection screen
  const [selectedPokemonIndex, setSelectedPokemonIndex] = useState<number>(0)

  // Flag to track if we're in the middle of handling a fainted Pokemon
  const [handlingFaintedPokemon, setHandlingFaintedPokemon] = useState<boolean>(false)

  // Update the battle state to include Pokemon selection
  const [battleState, setBattleState] = useState<
    "start" | "playerTurn" | "enemyTurn" | "playerWin" | "enemyWin" | "menu" | "selectPokemon"
  >("start")
  const [battleText, setBattleText] = useState<string>(`A wild ${enemyTeam[0]?.name || "POKEMON"} appeared!`)
  const [showMoves, setShowMoves] = useState<boolean>(false)
  const [showPokemonSelection, setShowPokemonSelection] = useState<boolean>(false)
  const [selectedMove, setSelectedMove] = useState<Move | null>(null)

  // Sound states remain the same
  const [battleMusic, setBattleMusic] = useState<HTMLAudioElement | null>(null)
  const [attackSound, setAttackSound] = useState<HTMLAudioElement | null>(null)
  const [victorySound, setVictorySound] = useState<HTMLAudioElement | null>(null)
  const [defeatSound, setDefeatSound] = useState<HTMLAudioElement | null>(null)
  const [menuSound, setMenuSound] = useState<HTMLAudioElement | null>(null)
  const [faintSound, setFaintSound] = useState<HTMLAudioElement | null>(null)

  // Reference to the battle container for keyboard focus
  const battleContainerRef = useRef<HTMLDivElement>(null)

  // Initialize sounds (same as before)
  useEffect(() => {
    const battle = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pokemon-battle.mp3")
    battle.loop = true
    battle.volume = 0.3

    const attack = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pokemon-hit.mp3")
    attack.volume = 0.4

    const victory = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pokemon-victory.mp3")
    victory.volume = 0.4

    const defeat = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pokemon-defeat.mp3")
    defeat.volume = 0.4

    const menu = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pokemon-menu.mp3")
    menu.volume = 0.4

    // For the fainting sound, we'll use a simple beep for now
    const faint = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...")
    faint.volume = 0.4

    setBattleMusic(battle)
    setAttackSound(attack)
    setVictorySound(victory)
    setDefeatSound(defeat)
    setMenuSound(menu)
    setFaintSound(faint)

    battle.play().catch((err) => console.log("Audio playback failed:", err))

    return () => {
      battle.pause()
      attack.pause()
      victory.pause()
      defeat.pause()
      menu.pause()
      faint.pause()
    }
  }, [])

  // Calculate HP percentage for the health bars
  const playerHpPercent =
    playerTeam[currentPlayerPokemon]?.hp && playerTeam[currentPlayerPokemon]?.maxHp
      ? (playerTeam[currentPlayerPokemon].hp / playerTeam[currentPlayerPokemon].maxHp) * 100
      : 100

  const enemyHpPercent =
    enemyTeam[currentEnemyPokemon]?.hp && enemyTeam[currentEnemyPokemon]?.maxHp
      ? (enemyTeam[currentEnemyPokemon].hp / enemyTeam[currentEnemyPokemon].maxHp) * 100
      : 100

  // Update the text in the start battle sequence
  useEffect(() => {
    if (battleState === "start") {
      const timer = setTimeout(() => {
        setBattleText(`What will ${playerTeam[currentPlayerPokemon]?.name || "POKEMON"} do?`)
        setBattleState("menu")
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [battleState, currentPlayerPokemon, playerTeam])

  // Check if all Pokemon in a team have fainted
  const checkTeamFainted = (team: Pokemon[]): boolean => {
    return team.every((pokemon) => pokemon.hp <= 0)
  }

  // Handle menu selection
  const handleMenuSelect = (option: string) => {
    if (battleState !== "menu") return

    setSelectedMenuOption(option)

    if (menuSound) {
      menuSound.currentTime = 0
      menuSound.play().catch((err) => console.log("Audio playback failed:", err))
    }

    switch (option) {
      case "FIGHT":
        setShowMoves(true)
        setBattleState("playerTurn")
        setSelectedMoveIndex(0) // Reset to first move
        break
      case "PKMN":
        setShowPokemonSelection(true)
        setBattleState("selectPokemon")
        setSelectedPokemonIndex(0) // Reset to first Pokemon that isn't current
        break
      case "BAG":
        setBattleText("No items in bag!")
        setTimeout(() => {
          setBattleText(`What will ${playerTeam[currentPlayerPokemon]?.name || "POKEMON"} do?`)
          setBattleState("menu")
        }, 1500)
        break
      case "RUN":
        setBattleText("Got away safely!")
        setTimeout(() => {
          handleBattleEnd()
        }, 1500)
        break
    }
  }

  // Handle move selection in the grid
  const handleMoveSelect = (index: number) => {
    if (battleState !== "playerTurn") return

    // Play menu sound
    if (menuSound) {
      menuSound.currentTime = 0
      menuSound.play().catch((err) => console.log("Audio playback failed:", err))
    }

    setSelectedMoveIndex(index)

    // Immediately execute the attack when a move is selected
    const selectedMove = playerTeam[currentPlayerPokemon]?.moves[index]
    if (selectedMove && selectedMove.pp > 0) {
      handleAttack(selectedMove)
    }
  }

  const handleAttack = (selectedMove: Move) => {
    if (!selectedMove) return

    // Get the current player and enemy Pokemon
    const currentPlayer = playerTeam[currentPlayerPokemon]
    const currentEnemy = enemyTeam[currentEnemyPokemon]

    if (!currentPlayer || !currentEnemy) return

    // Hide the moves menu immediately when attack is selected
    setShowMoves(false)

    // Get type effectiveness
    const typeEffectiveness = getTypeEffectiveness(selectedMove.type, currentEnemy.types || ["normal"])
    const isCritical = Math.random() > 0.9 // 10% chance of critical hit
    const criticalMultiplier = isCritical ? 1.5 : 1.0

    // Calculate damage with type effectiveness
    const baseDamage = Math.floor(selectedMove.power * (currentPlayer.level / 30 || 1))
    const damage = Math.floor(baseDamage * typeEffectiveness * criticalMultiplier)

    // Update move PP
    const updatedPlayerTeam = [...playerTeam]
    updatedPlayerTeam[currentPlayerPokemon].moves = updatedPlayerTeam[currentPlayerPokemon].moves.map((m) =>
      m.name === selectedMove.name ? { ...m, pp: m.pp - 1 } : m,
    )
    setPlayerTeam(updatedPlayerTeam)

    // Show attack text
    setBattleText(`${currentPlayer.name} used ${selectedMove.name}!`)

    // Start attack animation
    setAttackAnimation({
      isActive: true,
      isPlayerAttacking: true,
      effect: getMoveEffect(selectedMove.type),
    })

    // Play attack sound
    if (attackSound) {
      attackSound.currentTime = 0
      attackSound.play().catch((err) => console.log("Audio playback failed:", err))
    }

    // After a delay, show damage and update enemy HP
    setTimeout(() => {
      // End attack animation
      setAttackAnimation({
        isActive: false,
        isPlayerAttacking: true,
        effect: "none",
      })

      // Show effectiveness message
      const effectivenessMessage = getTypeEffectivenessDescription(typeEffectiveness)

      if (effectivenessMessage) {
        setBattleText(effectivenessMessage)

        // After effectiveness message, show critical hit message if applicable
        setTimeout(() => {
          if (isCritical) {
            setBattleText("A critical hit!")
            setTimeout(() => {
              if (typeEffectiveness > 0) {
                setBattleText(`It did ${damage} damage!`)
              }

              setTimeout(() => {
                updateEnemyHealth(damage)
              }, 1000)
            }, 1000)
          } else {
            if (typeEffectiveness > 0) {
              setBattleText(`It did ${damage} damage!`)
              setTimeout(() => {
                updateEnemyHealth(damage)
              }, 1000)
            } else {
              updateEnemyHealth(damage)
            }
          }
        }, 1000)
      } else {
        // No effectiveness message, check for critical hit
        if (isCritical) {
          setBattleText("A critical hit!")
          setTimeout(() => {
            setBattleText(`It did ${damage} damage!`)
            setTimeout(() => {
              updateEnemyHealth(damage)
            }, 1000)
          }, 1000)
        } else {
          setBattleText(`It did ${damage} damage!`)
          setTimeout(() => {
            updateEnemyHealth(damage)
          }, 1000)
        }
      }
    }, 1500)
  }

  // Also update the updateEnemyHealth function to not immediately show battle text:

  const updateEnemyHealth = (damage: number) => {
    const updatedEnemyTeam = [...enemyTeam]
    if (updatedEnemyTeam[currentEnemyPokemon]) {
      updatedEnemyTeam[currentEnemyPokemon].hp = Math.max(0, updatedEnemyTeam[currentEnemyPokemon].hp - damage)
      updatedEnemyTeam[currentEnemyPokemon].fainted = updatedEnemyTeam[currentEnemyPokemon].hp <= 0
      setEnemyTeam(updatedEnemyTeam)
    }

    // Check if enemy Pokemon fainted
    if (updatedEnemyTeam[currentEnemyPokemon]?.hp <= 0) {
      // Start faint animation for enemy Pokemon
      setFaintingAnimation({
        isActive: true,
        isPlayerPokemon: false,
      })

      // Play faint sound
      if (faintSound) {
        faintSound.currentTime = 0
        faintSound.play().catch((err) => console.log("Audio playback failed:", err))
      }

      // After animation completes, continue
      setTimeout(() => {
        // Reset faint animation
        setFaintingAnimation({
          isActive: false,
          isPlayerPokemon: false,
        })

        setBattleText(`${enemyTeam[currentEnemyPokemon]?.name || "POKEMON"} fainted!`)

        // Check if all enemy Pokemon have fainted
        if (checkTeamFainted(updatedEnemyTeam)) {
          setTimeout(() => {
            setBattleText("All enemy POKéMON have fainted!")
            setBattleState("playerWin")

            // Play victory sound
            if (battleMusic) battleMusic.pause()
            if (victorySound) {
              victorySound.play().catch((err) => console.log("Audio playback failed:", err))
            }
          }, 1500)
        } else {
          // Enemy sends out next Pokemon
          let nextPokemon = currentEnemyPokemon + 1
          while (nextPokemon < enemyTeam.length && enemyTeam[nextPokemon]?.hp <= 0) {
            nextPokemon++
          }

          if (nextPokemon < enemyTeam.length) {
            setTimeout(() => {
              setCurrentEnemyPokemon(nextPokemon)
              setBattleText(`Enemy sent out ${enemyTeam[nextPokemon]?.name || "POKEMON"}!`)

              setTimeout(() => {
                setBattleState("menu")
                setBattleText(`What will ${playerTeam[currentPlayerPokemon]?.name || "POKEMON"} do?`)
              }, 1500)
            }, 1500)
          } else {
            setBattleState("playerWin")
          }
        }
      }, 1000) // Faint animation duration
    } else {
      // Back to enemy's turn after a delay
      setTimeout(() => {
        setBattleState("enemyTurn")
        handleEnemyAttack()
      }, 1000)
    }
  }

  // Also update the handleMoveSelect function to ensure it works correctly:

  // Function to update player health
  const handleUpdatePlayerHealth = (damage: number) => {
    const updatedPlayerTeam = [...playerTeam]
    if (updatedPlayerTeam[currentPlayerPokemon]) {
      updatedPlayerTeam[currentPlayerPokemon].hp = Math.max(0, updatedPlayerTeam[currentPlayerPokemon].hp - damage)
      updatedPlayerTeam[currentPlayerPokemon].fainted = updatedPlayerTeam[currentPlayerPokemon].hp <= 0
      setPlayerTeam(updatedPlayerTeam)
    }

    // Check if player Pokemon fainted
    if (updatedPlayerTeam[currentPlayerPokemon]?.hp <= 0) {
      // Start faint animation for player Pokemon
      setFaintingAnimation({
        isActive: true,
        isPlayerPokemon: true,
      })

      // Play faint sound
      if (faintSound) {
        faintSound.currentTime = 0
        faintSound.play().catch((err) => console.log("Audio playback failed:", err))
      }

      // After animation completes, continue
      setTimeout(() => {
        // Reset faint animation
        setFaintingAnimation({
          isActive: false,
          isPlayerPokemon: true,
        })

        setBattleText(`${playerTeam[currentPlayerPokemon]?.name || "POKEMON"} fainted!`)

        // Check if all player Pokemon have fainted
        if (checkTeamFainted(updatedPlayerTeam)) {
          setTimeout(() => {
            setBattleText("All your POKéMON have fainted!")
            setBattleState("enemyWin")

            // Play defeat sound
            if (battleMusic) battleMusic.pause()
            if (defeatSound) {
              defeatSound.play().catch((err) => console.log("Audio playback failed:", err))
            }
          }, 1500)
        } else {
          // Player sends out next Pokemon
          setShowPokemonSelection(true)
          setBattleState("selectPokemon")
          setSelectedPokemonIndex(0) // Reset to first Pokemon that isn't current
        }
      }, 1000) // Faint animation duration
    } else {
      // Back to player's turn after a delay
      setTimeout(() => {
        setBattleState("menu")
        setBattleText(`What will ${playerTeam[currentPlayerPokemon]?.name || "POKEMON"} do?`)
      }, 1000)
    }
  }

  // Function to handle enemy's attack
  const handleEnemyAttack = () => {
    // Select a random move for the enemy
    const currentEnemy = enemyTeam[currentEnemyPokemon]
    if (!currentEnemy) return

    const availableMoves = currentEnemy.moves.filter((move) => move.pp > 0)

    if (availableMoves.length === 0) {
      setBattleText(`${currentEnemy.name} has no moves left!`)

      // Enemy sends out next Pokemon
      let nextPokemon = currentEnemyPokemon + 1
      while (nextPokemon < enemyTeam.length && enemyTeam[nextPokemon]?.hp <= 0) {
        nextPokemon++
      }

      if (nextPokemon < enemyTeam.length) {
        setTimeout(() => {
          setCurrentEnemyPokemon(nextPokemon)
          setBattleText(`Enemy sent out ${enemyTeam[nextPokemon]?.name || "POKEMON"}!`)

          setTimeout(() => {
            setBattleText(`What will ${playerTeam[currentPlayerPokemon]?.name || "POKEMON"} do?`)
            setBattleState("menu")
          }, 800)
        }, 1500)
      } else {
        setBattleState("playerWin")
      }
      return
    }

    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)]

    // Get type effectiveness
    const typeEffectiveness = getTypeEffectiveness(
      randomMove.type,
      playerTeam[currentPlayerPokemon].types || ["normal"],
    )
    const isCritical = Math.random() > 0.9 // 10% chance of critical hit
    const criticalMultiplier = isCritical ? 1.5 : 1.0

    // Calculate damage with type effectiveness
    const baseDamage = Math.floor(randomMove.power * (currentEnemy.level / 30 || 1))
    const damage = Math.floor(baseDamage * typeEffectiveness * criticalMultiplier)

    // Update move PP
    const updatedEnemyTeam = [...enemyTeam]
    updatedEnemyTeam[currentEnemyPokemon].moves = updatedEnemyTeam[currentEnemyPokemon].moves.map((m) =>
      m.name === randomMove.name ? { ...m, pp: m.pp - 1 } : m,
    )
    setEnemyTeam(updatedEnemyTeam)

    // Show attack text
    setBattleText(`${currentEnemy.name} used ${randomMove.name}!`)

    // Start attack animation
    setAttackAnimation({
      isActive: true,
      isPlayerAttacking: false,
      effect: getMoveEffect(randomMove.type),
    })

    // Play attack sound
    if (attackSound) {
      attackSound.currentTime = 0
      attackSound.play().catch((err) => console.log("Audio playback failed:", err))
    }

    // After a delay, show damage and update player HP
    setTimeout(() => {
      // End attack animation
      setAttackAnimation({
        isActive: false,
        isPlayerAttacking: false,
        effect: "none",
      })

      // Show effectiveness message
      const effectivenessMessage = getTypeEffectivenessDescription(typeEffectiveness)

      if (effectivenessMessage) {
        setBattleText(effectivenessMessage)

        // After effectiveness message, show critical hit message if applicable
        setTimeout(() => {
          if (isCritical) {
            setBattleText("A critical hit!")
            setTimeout(() => {
              if (typeEffectiveness > 0) {
                setBattleText(`It did ${damage} damage!`)
              }

              handleUpdatePlayerHealth(damage)
            }, 1000)
          } else {
            if (typeEffectiveness > 0) {
              setBattleText(`It did ${damage} damage!`)
            }

            handleUpdatePlayerHealth(damage)
          }
        }, 1000)
      } else {
        // No effectiveness message, check for critical hit
        if (isCritical) {
          setBattleText("A critical hit!")
          setTimeout(() => {
            setBattleText(`It did ${damage} damage!`)
            handleUpdatePlayerHealth(damage)
          }, 1000)
        } else {
          setBattleText(`It did ${damage} damage!`)
          handleUpdatePlayerHealth(damage)
        }
      }
    }, 1500)
  }

  // Handle battle end
  const handleBattleEnd = () => {
    // Stop all sounds
    if (battleMusic) battleMusic.pause()
    if (victorySound) victorySound.pause()
    if (defeatSound) defeatSound.pause()

    onClose()
  }

  const handleBackToMenu = () => {
    setShowMoves(false)
    setShowPokemonSelection(false)
    setBattleState("menu")
    setBattleText(`What will ${playerTeam[currentPlayerPokemon]?.name || "POKEMON"} do?`)
  }

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Play menu sound for navigation
      const playMenuSound = () => {
        if (menuSound) {
          menuSound.currentTime = 0
          menuSound.play().catch((err) => console.log("Audio playback failed:", err))
        }
      }

      // Don't handle keys during animations or transitions
      if (
        attackAnimation.isActive ||
        faintingAnimation.isActive ||
        battleState === "start" ||
        battleState === "playerWin" ||
        battleState === "enemyWin"
      ) {
        return
      }

      // Handle menu navigation
      if (battleState === "menu") {
        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            if (selectedMenuOption === "BAG") {
              setSelectedMenuOption("FIGHT")
              playMenuSound()
            } else if (selectedMenuOption === "RUN") {
              setSelectedMenuOption("PKMN")
              playMenuSound()
            }
            break
          case "ArrowDown":
          case "s":
          case "S":
            if (selectedMenuOption === "FIGHT") {
              setSelectedMenuOption("BAG")
              playMenuSound()
            } else if (selectedMenuOption === "PKMN") {
              setSelectedMenuOption("RUN")
              playMenuSound()
            }
            break
          case "ArrowLeft":
          case "a":
          case "A":
            if (selectedMenuOption === "PKMN") {
              setSelectedMenuOption("FIGHT")
              playMenuSound()
            } else if (selectedMenuOption === "RUN") {
              setSelectedMenuOption("BAG")
              playMenuSound()
            }
            break
          case "ArrowRight":
          case "d":
          case "D":
            if (selectedMenuOption === "FIGHT") {
              setSelectedMenuOption("PKMN")
              playMenuSound()
            } else if (selectedMenuOption === "BAG") {
              setSelectedMenuOption("RUN")
              playMenuSound()
            }
            break
          case "Enter":
          case " ":
            handleMenuSelect(selectedMenuOption)
            break
          case "Escape":
          case "Backspace":
            // No action in main menu
            break
        }
      }
      // Handle move selection
      else if (battleState === "playerTurn" && showMoves) {
        const moves = playerTeam[currentPlayerPokemon]?.moves || []
        const moveCount = Math.min(moves.length, 4)

        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            if (selectedMoveIndex >= 2 && selectedMoveIndex < moveCount) {
              setSelectedMoveIndex(selectedMoveIndex - 2)
              playMenuSound()
            }
            break
          case "ArrowDown":
          case "s":
          case "S":
            if (selectedMoveIndex < 2 && selectedMoveIndex + 2 < moveCount) {
              setSelectedMoveIndex(selectedMoveIndex + 2)
              playMenuSound()
            }
            break
          case "ArrowLeft":
          case "a":
          case "A":
            if (selectedMoveIndex % 2 === 1) {
              setSelectedMoveIndex(selectedMoveIndex - 1)
              playMenuSound()
            }
            break
          case "ArrowRight":
          case "d":
          case "D":
            if (selectedMoveIndex % 2 === 0 && selectedMoveIndex + 1 < moveCount) {
              setSelectedMoveIndex(selectedMoveIndex + 1)
              playMenuSound()
            }
            break
          case "Enter":
          case " ":
            if (moves[selectedMoveIndex] && moves[selectedMoveIndex].pp > 0) {
              handleMoveSelect(selectedMoveIndex)
            }
            break
          case "Escape":
          case "Backspace":
            handleBackToMenu()
            break
        }
      }
      // Handle Pokemon selection
      else if (battleState === "selectPokemon" && showPokemonSelection) {
        // Get available Pokemon (not fainted and not current)
        const availablePokemon = playerTeam
          .map((pokemon, index) => ({ pokemon, index }))
          .filter(({ pokemon, index }) => pokemon.hp > 0 && index !== currentPlayerPokemon)

        if (availablePokemon.length === 0) return

        // Find the current selected Pokemon in the available list
        const currentSelectedIndex = availablePokemon.findIndex(({ index }) => index === selectedPokemonIndex)

        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            if (currentSelectedIndex > 0) {
              setSelectedPokemonIndex(availablePokemon[currentSelectedIndex - 1].index)
              playMenuSound()
            }
            break
          case "ArrowDown":
          case "s":
          case "S":
            if (currentSelectedIndex < availablePokemon.length - 1) {
              setSelectedPokemonIndex(availablePokemon[currentSelectedIndex + 1].index)
              playMenuSound()
            }
            break
          case "Enter":
          case " ":
            handlePokemonSelect(selectedPokemonIndex)
            break
          case "Escape":
          case "Backspace":
            if (playerTeam[currentPlayerPokemon]?.hp > 0 && !handlingFaintedPokemon) {
              handleBackToMenu()
            }
            break
        }
      }
    },
    [
      battleState,
      selectedMenuOption,
      selectedMoveIndex,
      selectedPokemonIndex,
      showMoves,
      showPokemonSelection,
      playerTeam,
      currentPlayerPokemon,
      attackAnimation.isActive,
      faintingAnimation.isActive,
      menuSound,
      handlingFaintedPokemon,
      handlePokemonSelect,
    ],
  )

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)

    // Focus the battle container for keyboard navigation
    if (battleContainerRef.current) {
      battleContainerRef.current.focus()
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Format Pokemon types for display
  const formatPokemonTypes = (types: PokemonType[]): string => {
    return types.map((type) => type.charAt(0).toUpperCase() + type.slice(1)).join("/")
  }

  // Render the battle screen using a portal to ensure it's on top of everything
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      ref={battleContainerRef}
      tabIndex={0} // Make the container focusable
    >
      <div className="relative w-full h-full overflow-hidden">
        {/* Battle background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-green-800"
          style={{
            backgroundImage: `url('/images/pokemon/forest-background.webp')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            imageRendering: "pixelated",
            zIndex: 0,
          }}
        ></div>

        <div className="absolute inset-0 flex flex-col" style={{ zIndex: 1 }}>
          {/* Top battle area */}
          <div className="flex-1 relative">
            {/* Enemy Pokemon info - Styled like classic Pokemon */}
            <div className="absolute top-[20%] left-[15%] w-[320px]">
              <div className="relative">
                {/* Main info box with shadow */}
                <div className="absolute -bottom-3 -right-3 w-full h-full bg-gray-700 rounded-lg"></div>
                <div className="relative bg-[#f8f0d0] border-4 border-[#58a040] rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="font-pixel text-xl uppercase text-[#383020]">
                      {enemyTeam[currentEnemyPokemon]?.name || "POKEMON"}
                      <span className="ml-1">
                        {enemyTeam[currentEnemyPokemon]?.gender === "male"
                          ? "♂"
                          : enemyTeam[currentEnemyPokemon]?.gender === "female"
                            ? "♀"
                            : ""}
                      </span>
                    </div>
                    <div className="font-pixel text-lg text-[#383020]">
                      Lv{enemyTeam[currentEnemyPokemon]?.level || "?"}
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="font-pixel text-sm text-[#383020] mb-1">HP</div>
                    <div className="h-[10px] bg-[#a0a0a0] border border-[#383020] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          enemyTeam[currentEnemyPokemon]?.hp <= 0
                            ? "bg-gray-400"
                            : enemyHpPercent > 50
                              ? "bg-[#30c020]"
                              : enemyHpPercent > 20
                                ? "bg-[#f8b000]"
                                : "bg-[#e82010]"
                        }`}
                        style={{ width: `${enemyHpPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enemy Pokemon sprite */}
            <div
              className={`absolute top-[35%] right-[22%] ${
                attackAnimation.isActive && !attackAnimation.isPlayerAttacking
                  ? "animate-attack-out"
                  : attackAnimation.isActive && attackAnimation.isPlayerAttacking
                    ? "animate-hit"
                    : faintingAnimation.isActive && !faintingAnimation.isPlayerPokemon
                      ? "animate-faint"
                      : ""
              }`}
            >
              <img
                src={enemyTeam[currentEnemyPokemon]?.sprite || "/placeholder.svg"}
                alt={enemyTeam[currentEnemyPokemon]?.name || "POKEMON"}
                className={`w-[260px] h-[260px] object-contain pixelated ${
                  (faintingAnimation.isActive && !faintingAnimation.isPlayerPokemon) ||
                  enemyTeam[currentEnemyPokemon]?.hp <= 0
                    ? "opacity-0 transition-opacity duration-1000"
                    : ""
                }`}
                style={{ imageRendering: "pixelated" }}
              />

              {/* Attack effect overlay */}
              {attackAnimation.isActive && attackAnimation.isPlayerAttacking && (
                <div className={`absolute inset-0 ${getAttackEffectClass(attackAnimation.effect)}`}></div>
              )}
            </div>

            {/* Player Pokemon info - Styled like classic Pokemon */}
            <div className="absolute bottom-[3%] right-[20%] w-[320px]">
              <div className="relative">
                {/* Main info box with shadow */}
                <div className="absolute -bottom-3 -right-3 w-full h-full bg-gray-700 rounded-lg"></div>
                <div className="relative bg-[#f8f0d0] border-4 border-[#58a040] rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="font-pixel text-xl uppercase text-[#383020]">
                      {playerTeam[currentPlayerPokemon]?.name || "POKEMON"}
                      <span className="ml-1">
                        {playerTeam[currentPlayerPokemon]?.gender === "male"
                          ? "♂"
                          : playerTeam[currentPlayerPokemon]?.gender === "female"
                            ? "♀"
                            : ""}
                      </span>
                    </div>
                    <div className="font-pixel text-lg text-[#383020]">
                      Lv{playerTeam[currentPlayerPokemon]?.level || "?"}
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="font-pixel text-sm text-[#383020] mb-1">HP</div>
                    <div className="h-[10px] bg-[#a0a0a0] border border-[#383020] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          playerTeam[currentPlayerPokemon]?.hp <= 0
                            ? "bg-gray-400"
                            : playerHpPercent > 50
                              ? "bg-[#30c020]"
                              : playerHpPercent > 20
                                ? "bg-[#f8b000]"
                                : "bg-[#e82010]"
                        }`}
                        style={{ width: `${playerHpPercent}%` }}
                      ></div>
                    </div>
                    <div className="font-pixel text-sm text-right mt-1 text-[#383020]">
                      {playerTeam[currentPlayerPokemon]?.hp || "?"}/{playerTeam[currentPlayerPokemon]?.maxHp || "?"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Pokemon sprite */}
            <div
              className={`absolute bottom-[-10%] left-[15%] ${
                attackAnimation.isActive && attackAnimation.isPlayerAttacking
                  ? "animate-attack-out"
                  : attackAnimation.isActive && !attackAnimation.isPlayerAttacking
                    ? "animate-hit"
                    : faintingAnimation.isActive && faintingAnimation.isPlayerPokemon
                      ? "animate-faint"
                      : ""
              }`}
            >
              <img
                src={playerTeam[currentPlayerPokemon]?.sprite || "/placeholder.svg"}
                alt={playerTeam[currentPlayerPokemon]?.name || "POKEMON"}
                className={`w-[260px] h-[260px] object-contain pixelated ${
                  (faintingAnimation.isActive && faintingAnimation.isPlayerPokemon) ||
                  playerTeam[currentPlayerPokemon]?.hp <= 0
                    ? "opacity-0 transition-opacity duration-1000"
                    : ""
                }`}
                style={{ imageRendering: "pixelated" }}
              />

              {/* Attack effect overlay */}
              {attackAnimation.isActive && !attackAnimation.isPlayerAttacking && (
                <div className={`absolute inset-0 ${getAttackEffectClass(attackAnimation.effect)}`}></div>
              )}
            </div>
          </div>

          {/* Bottom menu area - Styled like classic Pokemon */}
          <div className="h-[200px] flex">
            {/* When in normal menu state or when showing battle text (excluding playerTurn with showMoves) */}
            {(!showMoves || battleState !== "playerTurn") && (
              <>
                {/* Text box - Styled like classic Pokemon */}
                <div className="w-1/2 relative">
                  <div className="absolute inset-0 border-4 border-[#d8b048]">
                    <div className="absolute inset-[2px] border-4 border-[#483078]">
                      <div className="absolute inset-0 bg-[#104068] p-4">
                        <div className="font-pixel text-xl leading-relaxed text-white">{battleText}</div>

                        {/* Battle end buttons */}
                        {(battleState === "playerWin" || battleState === "enemyWin") && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={handleBattleEnd}
                              className="px-6 py-2 bg-white border-4 border-black text-xl font-pixel hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            >
                              {battleState === "playerWin" ? "VICTORY!" : "TRY AGAIN"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu box - Styled like classic Pokemon */}
                <div className="w-1/2 relative">
                  <div className="absolute inset-0 border-4 border-[#d8b048]">
                    <div className="absolute inset-[2px] border-4 border-[#483078]">
                      <div className="absolute inset-0 bg-white p-4">
                        <div className="h-full">
                          {battleState === "menu" && (
                            <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                              <button
                                onClick={() => handleMenuSelect("FIGHT")}
                                className={`font-pixel text-xl text-left flex items-center ${
                                  selectedMenuOption === "FIGHT" ? "bg-gray-200" : ""
                                }`}
                              >
                                {selectedMenuOption === "FIGHT" && <span className="mr-2">▶</span>}
                                FIGHT
                              </button>
                              <button
                                onClick={() => handleMenuSelect("BAG")}
                                className={`font-pixel text-xl text-left flex items-center ${
                                  selectedMenuOption === "BAG" ? "bg-gray-200" : ""
                                }`}
                              >
                                {selectedMenuOption === "BAG" && <span className="mr-2">▶</span>}
                                BAG
                              </button>
                              <button
                                onClick={() => handleMenuSelect("PKMN")}
                                className={`font-pixel text-xl text-left flex items-center ${
                                  selectedMenuOption === "PKMN" ? "bg-gray-200" : ""
                                }`}
                              >
                                {selectedMenuOption === "PKMN" && <span className="mr-2">▶</span>}
                                POKéMON
                              </button>
                              <button
                                onClick={() => handleMenuSelect("RUN")}
                                className={`font-pixel text-xl text-left flex items-center ${
                                  selectedMenuOption === "RUN" ? "bg-gray-200" : ""
                                }`}
                              >
                                {selectedMenuOption === "RUN" && <span className="mr-2">▶</span>}
                                RUN
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Show moves menu across entire bottom when showMoves is true */}
            {showMoves && battleState === "playerTurn" && (
              <div className="w-full flex justify-center">
                <div className="w-full h-full flex">
                  {/* Left panel - Move list */}
                  <div className="w-2/3 relative">
                    <div className="absolute inset-0 border-4 border-[#483078]">
                      <div className="absolute inset-0 bg-white">
                        <div className="grid grid-cols-2 grid-rows-2 h-full">
                          {playerTeam[currentPlayerPokemon]?.moves.slice(0, 4).map((move, index) => (
                            <button
                              key={move.name}
                              onClick={() => handleMoveSelect(index)}
                              disabled={move.pp <= 0}
                              className={`font-pixel text-left relative ${move.pp <= 0 ? "opacity-50" : ""} ${
                                index === selectedMoveIndex ? "bg-gray-200" : ""
                              }`}
                            >
                              <div
                                className="flex items-center h-full px-4"
                                style={{
                                  fontSize: "24px !important",
                                  lineHeight: "1.2",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                {index === selectedMoveIndex && (
                                  <div
                                    className="absolute left-1 top-1/2 -translate-y-1/2"
                                    style={{
                                      width: 0,
                                      height: 0,
                                      borderTop: "12px solid transparent",
                                      borderLeft: "24px solid black",
                                      borderBottom: "12px solid transparent",
                                    }}
                                  ></div>
                                )}
                                <span
                                  className={`uppercase pl-8 ${index === selectedMoveIndex ? "font-bold" : ""}`}
                                  style={{ fontSize: "28px !important" }}
                                >
                                  {move.name}
                                </span>
                              </div>
                            </button>
                          ))}
                          {/* Fill empty slots if less than 4 moves */}
                          {Array.from({
                            length: Math.max(0, 4 - (playerTeam[currentPlayerPokemon]?.moves.length || 0)),
                          }).map((_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="font-pixel text-left px-10 flex items-center"
                              style={{ fontSize: "32px !important" }}
                            >
                              -
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right panel - Move details */}
                  <div className="w-1/3 relative">
                    <div className="absolute inset-0 border-4 border-[#483078]">
                      <div className="absolute inset-0 bg-white">
                        <div className="flex flex-col h-full justify-between p-4">
                          <div>
                            {playerTeam[currentPlayerPokemon]?.moves.length > 0 && (
                              <>
                                <div className="font-pixel mb-4">
                                  <div className="flex justify-between" style={{ fontSize: "32px !important" }}>
                                    <span style={{ fontSize: "32px !important" }}>PP</span>
                                    <span style={{ fontSize: "32px !important" }}>
                                      {playerTeam[currentPlayerPokemon]?.moves[selectedMoveIndex]?.pp || 0}/
                                      {playerTeam[currentPlayerPokemon]?.moves[selectedMoveIndex]?.maxPp || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="font-pixel">
                                  <div style={{ fontSize: "32px !important" }}>
                                    TYPE/
                                    {playerTeam[currentPlayerPokemon]?.moves[selectedMoveIndex]?.type
                                      .toUpperCase()
                                      .substring(0, 6) || "NORMAL"}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          <div>
                            <button onClick={handleBackToMenu} className="font-pixel text-left">
                              <span className="mr-2" style={{ fontSize: "32px !important" }}>
                                ◀
                              </span>
                              <span style={{ fontSize: "32px !important" }}>BACK</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pokemon selection screen */}
            {showPokemonSelection && (
              <div className="fixed inset-0 z-[1001] bg-[#0a5c4c]">
                {/* Striped background pattern */}
                <div
                  className="absolute inset-0 bg-[#0a5c4c]"
                  style={{
                    backgroundImage:
                      "linear-gradient(0deg, rgba(10,92,76,0.7) 0%, rgba(10,92,76,0.7) 50%, rgba(10,92,76,1) 50%, rgba(10,92,76,1) 100%)",
                    backgroundSize: "100% 10px",
                  }}
                ></div>

                <div className="relative z-10 h-full flex flex-col p-6 max-w-[900px] mx-auto">
                  {/* Active Pokemon (left side) */}
                  <div className="flex h-[calc(100%-120px)] gap-4">
                    <div className="w-[380px] h-[220px] bg-[#4a94e0] border-4 border-white rounded-lg p-4 flex flex-col">
                      <div className="flex items-center">
                        <img
                          src={
                            playerTeam[currentPlayerPokemon]?.sprite.replace(".png", ".gif") ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          alt={playerTeam[currentPlayerPokemon]?.name || "POKEMON"}
                          className="w-[120px] h-[120px] object-contain pixelated"
                        />
                        <div className="ml-3">
                          <div className="font-pixel text-white text-3xl">
                            {playerTeam[currentPlayerPokemon]?.name || "POKEMON"}
                          </div>
                          <div className="font-pixel text-white text-lg">
                            Lv{playerTeam[currentPlayerPokemon]?.level || "?"}
                            <span className="ml-2">
                              {playerTeam[currentPlayerPokemon]?.gender === "male"
                                ? "♂"
                                : playerTeam[currentPlayerPokemon]?.gender === "female"
                                  ? "♀"
                                  : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center">
                          <div className="font-pixel text-white text-lg mr-2">HP</div>
                          <div className="flex-1 h-[14px] bg-[#1a3a5a] rounded-full overflow-hidden border border-[#0a1a2a]">
                            <div
                              className={`h-full ${
                                playerTeam[currentPlayerPokemon]?.hp <= 0 ? "bg-gray-400" : "bg-[#38f868]"
                              }`}
                              style={{
                                width: `${((playerTeam[currentPlayerPokemon]?.hp || 0) / (playerTeam[currentPlayerPokemon]?.maxHp || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="font-pixel text-white text-right mt-1 text-lg">
                          {playerTeam[currentPlayerPokemon]?.hp || "?"}/{playerTeam[currentPlayerPokemon]?.maxHp || "?"}
                        </div>
                      </div>
                    </div>

                    {/* Right side Pokemon list */}
                    <div className="flex-1 flex flex-col gap-3">
                      {playerTeam.map(
                        (pokemon, index) =>
                          index !== currentPlayerPokemon && (
                            <button
                              key={pokemon.id}
                              onClick={() => handlePokemonSelect(index)}
                              disabled={pokemon.hp <= 0}
                              className={`w-full h-[110px] bg-[#4a94e0] border-4 border-white rounded-lg p-3 flex items-center ${pokemon.hp <= 0 ? "opacity-50" : ""}`}
                            >
                              <img
                                src={pokemon.sprite.replace(".png", ".gif") || "/placeholder.svg"}
                                alt={pokemon.name}
                                className="w-[70px] h-[70px] object-contain pixelated"
                              />
                              <div className="ml-3 flex-1 overflow-hidden">
                                <div className="flex justify-between">
                                  <div className="font-pixel text-white text-2xl truncate max-w-[180px]">
                                    {pokemon.name}
                                  </div>
                                  <div className="font-pixel text-white text-lg whitespace-nowrap">
                                    Lv{pokemon.level}
                                    <span className="ml-1">
                                      {pokemon.gender === "male" ? "♂" : pokemon.gender === "female" ? "♀" : ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center mt-2">
                                  <div className="font-pixel text-white text-lg mr-2">HP</div>
                                  <div className="flex-1 h-[14px] bg-[#1a3a5a] rounded-full overflow-hidden border border-[#0a1a2a]">
                                    <div
                                      className={`h-full ${pokemon.hp <= 0 ? "bg-gray-400" : "bg-[#38f868]"}`}
                                      style={{ width: `${(pokemon.hp / pokemon.maxHp) * 100}%` }}
                                    ></div>
                                  </div>
                                  <div className="font-pixel text-white ml-2 text-lg">
                                    {pokemon.hp}/{pokemon.maxHp}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ),
                      )}
                    </div>
                  </div>

                  {/* Bottom message box */}
                  <div className="mt-auto">
                    <div className="bg-white border-4 border-[#a8a8a8] rounded-lg p-4 h-[120px] flex flex-col">
                      <div className="font-pixel text-3xl">Choose a Pokémon.</div>
                      <div className="mt-auto flex justify-end">
                        {!handlingFaintedPokemon && (
                          <button
                            onClick={handleBackToMenu}
                            className="bg-black text-white font-pixel px-6 py-2 rounded-md border-2 border-gray-700"
                          >
                            <span className="text-xl">Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )

  // Function to handle Pokemon selection
  function handlePokemonSelect(index: number) {
    if (battleState !== "selectPokemon") return

    // Play menu sound
    if (menuSound) {
      menuSound.currentTime = 0
      menuSound.play().catch((err) => console.log("Audio playback failed:", err))
    }

    // Set handling fainted Pokemon to true
    setHandlingFaintedPokemon(true)

    // Set the new current Pokemon
    setCurrentPlayerPokemon(index)

    // Hide the Pokemon selection screen
    setShowPokemonSelection(false)

    // Set battle text
    setBattleText(`Go! ${playerTeam[index]?.name || "POKEMON"}!`)

    // After a delay, go back to the menu
    setTimeout(() => {
      setBattleText(`What will ${playerTeam[index]?.name || "POKEMON"} do?`)
      setBattleState("menu")
      setHandlingFaintedPokemon(false)
    }, 1500)
  }
}

// Helper function to get attack effect class based on move type
function getAttackEffectClass(effect: string): string {
  switch (effect) {
    case "fire":
      return "bg-red-500 bg-opacity-50 animate-pulse"
    case "water":
      return "bg-blue-500 bg-opacity-50 animate-ripple"
    case "electric":
      return "bg-yellow-400 bg-opacity-70 animate-electric"
    case "grass":
      return "bg-green-500 bg-opacity-50 animate-grow"
    case "poison":
      return "bg-purple-600 bg-opacity-50 animate-pulse"
    case "psychic":
      return "bg-pink-500 bg-opacity-50 animate-psychic"
    case "dark":
      return "bg-gray-800 bg-opacity-70 animate-fade"
    case "ghost":
      return "bg-indigo-800 bg-opacity-50 animate-fade"
    case "dragon":
      return "bg-indigo-600 bg-opacity-50 animate-pulse"
    case "steel":
      return "bg-gray-400 bg-opacity-70 animate-flash"
    case "flying":
      return "bg-blue-300 bg-opacity-50 animate-float"
    case "fighting":
      return "bg-red-700 bg-opacity-50 animate-shake"
    case "rock":
      return "bg-yellow-700 bg-opacity-50 animate-shake"
    case "fairy":
      return "bg-pink-300 bg-opacity-50 animate-sparkle"
    case "bug":
      return "bg-green-600 bg-opacity-50 animate-wiggle"
    case "ice":
      return "bg-blue-100 bg-opacity-70 animate-freeze"
    default:
      return "bg-gray-500 bg-opacity-30 animate-pulse"
  }
}

function getMoveEffect(type: PokemonType): string {
  switch (type) {
    case "fire":
      return "fire"
    case "water":
      return "water"
    case "electric":
      return "electric"
    case "grass":
      return "grass"
    case "poison":
      return "poison"
    case "psychic":
      return "psychic"
    case "dark":
      return "dark"
    case "ghost":
      return "ghost"
    case "dragon":
      return "dragon"
    case "steel":
      return "steel"
    case "flying":
      return "flying"
    case "fighting":
      return "fighting"
    case "rock":
      return "rock"
    case "fairy":
      return "fairy"
    case "bug":
      return "bug"
    case "ice":
      return "ice"
    default:
      return "normal"
  }
}

/* Add CSS for the fainting animation */
import { createGlobalStyle } from "styled-components"

const GlobalStyle = createGlobalStyle`
  @keyframes faint {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(50px);
      opacity: 0;
    }
  }
  
  .animate-faint {
    animation: faint 1s ease-in-out forwards;
  }

  @keyframes freeze {
    0%, 100% {
      opacity: 0.7;
    }
    50% {
      opacity: 0.9;
    }
  }

  .animate-freeze {
    animation: freeze 0.8s ease-in-out infinite;
  }
`
