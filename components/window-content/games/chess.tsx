"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { getVolume, isMuted, play } from "@/lib/sound"

interface ChessProps {
  onReturn: () => void
}

// Chess piece types
type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king"
type PieceColor = "white" | "black"
type GameMode = "local" | "bot" | null

interface ChessPiece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean
}

// Position on the board
interface Position {
  row: number
  col: number
}

// Board is an 8x8 grid of optional pieces
type Board = (ChessPiece | null)[][]

// Move history for undo functionality
interface MoveRecord {
  from: Position
  to: Position
  piece: ChessPiece
  captured?: ChessPiece
  isPromotion?: boolean
  isCastle?: boolean
  isEnPassant?: boolean
  /** "+" for check and "#" for mate, filled in once the move has been made. */
  check?: "+" | "#"
}

/**
 * Standard algebraic notation for a move.
 *
 * The move list read "P e2-e4", which is not how anyone writes chess. Pawns
 * carry no letter, captures use x with the pawn's file in front, castling is
 * O-O, and promotion is written =Q.
 */
function notation(move: MoveRecord): string {
  const file = (col: number) => String.fromCharCode(97 + col)
  const square = (pos: Position) => `${file(pos.col)}${8 - pos.row}`

  if (move.isCastle || (move.piece.type === "king" && Math.abs(move.to.col - move.from.col) === 2)) {
    return (move.to.col > move.from.col ? "O-O" : "O-O-O") + (move.check ?? "")
  }

  const LETTER: Partial<Record<PieceType, string>> = { knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K" }
  const piece = LETTER[move.piece.type] ?? ""
  const takes = move.captured ? "x" : ""
  // A capturing pawn is written by its file of origin: exd5, not xd5.
  const origin = move.piece.type === "pawn" && move.captured ? file(move.from.col) : ""
  const promotion = move.isPromotion ? "=Q" : ""

  return `${piece}${origin}${takes}${square(move.to)}${promotion}${move.check ?? ""}`
}

// Board themes
interface BoardTheme {
  name: string
  lightSquare: string
  darkSquare: string
  selected: string
  validMove: string
}

/** The shipped placeholders are exactly this long; any other size is real. */
const PLACEHOLDER_BYTES = 4160

/** Which file under public/sounds/chess answers for each effect. */
const SOUND_FILES = {
  chessMove: "move-self",
  chessMoveOpponent: "move-opponent",
  chessCapture: "capture",
  chessCastle: "castle",
  chessCheck: "move-check",
  chessPromote: "promote",
  chessIllegal: "illegal",
  chessGameStart: "game-start",
  chessGameEnd: "game-end",
} as const

type SfxKey = keyof typeof SOUND_FILES

export default function Chess({ onReturn }: ChessProps) {
  // Game state
  const [board, setBoard] = useState<Board>(
    Array(8)
      .fill(null)
      .map(() => Array(8).fill(null)),
  )
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white")
  const [gameStatus, setGameStatus] = useState<string>("White's turn")
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([])
  const [capturedPieces, setCapturedPieces] = useState<{ white: ChessPiece[]; black: ChessPiece[] }>({
    white: [],
    black: [],
  })
  const [isCheck, setIsCheck] = useState<boolean>(false)
  const [isCheckmate, setIsCheckmate] = useState<boolean>(false)
  const [isStalemate, setIsStalemate] = useState<boolean>(false)
  const [showPromotionDialog, setShowPromotionDialog] = useState<boolean>(false)
  const [promotionPosition, setPromotionPosition] = useState<Position | null>(null)
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const boardRef = useRef<HTMLDivElement>(null)
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false)
  const [openBarMenu, setOpenBarMenu] = useState<string | null>(null)
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false)
  const [playerColor, setPlayerColor] = useState<PieceColor>("white")
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [showStartScreen, setShowStartScreen] = useState<boolean>(true)
  const [isThinking, setIsThinking] = useState<boolean>(false)
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null)
  /**
   * How the computer picks.
   *
   * Easy plays a legal move at random, which is beatable by anyone. Medium
   * scores each move and takes the best. Hard does the same but then checks
   * what the reply would cost it, so it stops hanging pieces.
   */
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  /** The game's own sound switch. A ref backs it so stale closures still obey. */
  const [soundOn, setSoundOn] = useState(true)
  const soundOnRef = useRef(true)

  /*
    Drop-in recordings. public/sounds/chess holds a silent placeholder for
    each effect; replacing one with a real MP3 of the same name makes the
    game play the recording instead of its synthesised effect, no code
    change involved. Real is judged by size: the shipped placeholders are
    exactly PLACEHOLDER_BYTES long, and any other length means someone has
    dropped their own file in. The probe runs once on mount.
  */
  const customSounds = useRef<Partial<Record<SfxKey, HTMLAudioElement>>>({})
  useEffect(() => {
    let live = true
    for (const [key, file] of Object.entries(SOUND_FILES) as [SfxKey, string][]) {
      fetch(`/sounds/chess/${file}.mp3`, { method: "HEAD" })
        .then((res) => {
          if (!live || !res.ok) return
          const size = Number(res.headers.get("content-length"))
          if (Number.isFinite(size) && size > 0 && size !== PLACEHOLDER_BYTES) {
            customSounds.current[key] = new Audio(`/sounds/chess/${file}.mp3`)
          }
        })
        .catch(() => {
          // No file, no recording; the synthesiser covers it.
        })
    }
    return () => {
      live = false
    }
  }, [])

  const snd: typeof play = (name, ...rest) => {
    if (!soundOnRef.current) return
    const custom = customSounds.current[name as SfxKey]
    if (custom && !isMuted()) {
      // The desktop's volume slider governs recordings and synth alike.
      custom.volume = getVolume()
      custom.currentTime = 0
      void custom.play().catch(() => {})
      return
    }
    play(name, ...rest)
  }
  const toggleSound = () =>
    setSoundOn((v) => {
      soundOnRef.current = !v
      return !v
    })

  // Board themes
  const themes: BoardTheme[] = [
    {
      name: "Brown",
      lightSquare: "bg-[#f0d9b5]",
      darkSquare: "bg-[#b58863]",
      selected: "bg-blue-400",
      validMove: "bg-yellow-300 bg-opacity-70",
    },
    {
      name: "Classic",
      lightSquare: "bg-[#ebecd0]",
      darkSquare: "bg-[#779556]",
      selected: "bg-blue-400",
      validMove: "bg-yellow-300 bg-opacity-70",
    },
    {
      name: "Blue",
      lightSquare: "bg-blue-100",
      darkSquare: "bg-blue-600",
      selected: "bg-purple-400",
      validMove: "bg-yellow-300 bg-opacity-70",
    },
    {
      name: "Gray",
      lightSquare: "bg-gray-200",
      darkSquare: "bg-gray-600",
      selected: "bg-blue-400",
      validMove: "bg-yellow-300 bg-opacity-70",
    },
    {
      name: "Purple",
      lightSquare: "bg-purple-100",
      darkSquare: "bg-purple-800",
      selected: "bg-yellow-400",
      validMove: "bg-green-300 bg-opacity-70",
    },
    {
      name: "Red",
      lightSquare: "bg-red-100",
      darkSquare: "bg-red-800",
      selected: "bg-blue-400",
      validMove: "bg-yellow-300 bg-opacity-70",
    },
  ]

  const [currentTheme, setCurrentTheme] = useState<BoardTheme>(themes[1]) // Set Classic as default

  // Initialize the board
  useEffect(() => {
    if (gameMode) {
      initializeBoard()
    }
    // initializeBoard is redefined each render; this only wants to deal a
    // fresh board when the mode or colour actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, playerColor])

  // Bot move effect
  useEffect(() => {
    if (gameMode === "bot" && currentPlayer !== playerColor && !isCheckmate && !isStalemate) {
      const botMoveTimeout = setTimeout(() => {
        makeBotMove()
      }, 1000)

      return () => clearTimeout(botMoveTimeout)
    }
    // makeBotMove closes over the live board; re-subscribing on its identity
    // would fire a second bot move for the same turn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, gameMode, isCheckmate, isStalemate])

  /**
   * One sound per move, chosen by what the move did.
   *
   * This is the rule chess.com follows, and the reason it reads so clearly: a
   * capture that gives check is a check, not both at once. Previously a
   * checking capture fired the capture sound and the check sound on top of
   * each other.
   */
  const announceMove = (o: {
    captured?: boolean
    castled?: boolean
    promoted?: boolean
    check?: boolean
    /** Checkmate or stalemate: either way the game is over. */
    gameOver?: boolean
    opponent?: boolean
  }) => {
    if (o.gameOver) return snd("chessGameEnd")
    if (o.check) return snd("chessCheck")
    if (o.promoted) return snd("chessPromote")
    if (o.castled) return snd("chessCastle")
    if (o.captured) return snd("chessCapture")
    snd(o.opponent ? "chessMoveOpponent" : "chessMove")
  }

  // Start a new game with selected options
  const startGame = (mode: GameMode, color: PieceColor) => {
    snd("chessGameStart")
    setGameMode(mode)
    setPlayerColor(color)
    setBoardFlipped(color === "black")
    setShowStartScreen(false)
  }

  // Initialize the chess board
  const initializeBoard = () => {
    const newBoard: Board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null))

    // Set up pawns
    for (let col = 0; col < 8; col++) {
      newBoard[1][col] = { type: "pawn", color: "black" }
      newBoard[6][col] = { type: "pawn", color: "white" }
    }

    // Set up rooks
    newBoard[0][0] = { type: "rook", color: "black" }
    newBoard[0][7] = { type: "rook", color: "black" }
    newBoard[7][0] = { type: "rook", color: "white" }
    newBoard[7][7] = { type: "rook", color: "white" }

    // Set up knights
    newBoard[0][1] = { type: "knight", color: "black" }
    newBoard[0][6] = { type: "knight", color: "black" }
    newBoard[7][1] = { type: "knight", color: "white" }
    newBoard[7][6] = { type: "knight", color: "white" }

    // Set up bishops
    newBoard[0][2] = { type: "bishop", color: "black" }
    newBoard[0][5] = { type: "bishop", color: "black" }
    newBoard[7][2] = { type: "bishop", color: "white" }
    newBoard[7][5] = { type: "bishop", color: "white" }

    // Set up queens
    newBoard[0][3] = { type: "queen", color: "black" }
    newBoard[7][3] = { type: "queen", color: "white" }

    // Set up kings
    newBoard[0][4] = { type: "king", color: "black" }
    newBoard[7][4] = { type: "king", color: "white" }

    setBoard(newBoard)
    setCurrentPlayer("white")
    setGameStatus(`${playerColor === "white" ? "Your" : "Black's"} turn`)
    setMoveHistory([])
    setCapturedPieces({ white: [], black: [] })
    setIsCheck(false)
    setIsCheckmate(false)
    setIsStalemate(false)
    setSelectedPosition(null)
    setValidMoves([])
    setLastMove(null)
  }

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (!board || board.length === 0 || !board[row] || board[row].length === 0) return
    if (isCheckmate || isStalemate) return
    if (gameMode === "bot" && currentPlayer !== playerColor) return // Prevent clicks during bot's turn

    // If promotion dialog is open, ignore clicks outside the dialog
    if (showPromotionDialog) return

    // Convert coordinates if board is flipped
    const actualRow = boardFlipped ? 7 - row : row
    const actualCol = boardFlipped ? 7 - col : col

    const clickedPosition: Position = { row: actualRow, col: actualCol }
    const clickedPiece = board[actualRow][actualCol]

    // If a piece is already selected
    if (selectedPosition) {
      // Check if the clicked position is a valid move
      const isValidMove = validMoves.some((pos) => pos.row === actualRow && pos.col === actualCol)

      if (isValidMove) {
        // Move the piece
        movePiece(selectedPosition, clickedPosition)
      } else if (clickedPiece && clickedPiece.color === currentPlayer) {
        // Select a different piece of the same color
        setSelectedPosition(clickedPosition)
        setValidMoves(calculateValidMoves(clickedPosition, board))
      } else {
        // An empty or enemy square that is not a legal destination: the
        // move was attempted and refused, which has its own sound.
        snd("chessIllegal")
        // Deselect the piece
        setSelectedPosition(null)
        setValidMoves([])
      }
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      // Select the piece
      setSelectedPosition(clickedPosition)
      setValidMoves(calculateValidMoves(clickedPosition, board))
    }
  }

  // Move a piece on the board
  const movePiece = (from: Position, to: Position) => {
    const newBoard = [...board.map((row) => [...row])]
    const piece = newBoard[from.row][from.col]
    const capturedPiece = newBoard[to.row][to.col]

    if (!piece) return

    // Record the move for history
    const moveRecord: MoveRecord = {
      from,
      to,
      piece: { ...piece },
      captured: capturedPiece ? { ...capturedPiece } : undefined,
    }

    // Check for pawn promotion
    if (piece.type === "pawn" && (to.row === 0 || to.row === 7)) {
      setPromotionPosition(to)
      setShowPromotionDialog(true)
      // The actual move will be completed after promotion selection
      return
    }

    // Update the piece's hasMoved property (for castling and pawn double move)
    if (!piece.hasMoved) {
      piece.hasMoved = true
    }

    // Move the piece
    newBoard[to.row][to.col] = piece
    newBoard[from.row][from.col] = null

    // Update captured pieces
    if (capturedPiece) {
      const newCapturedPieces = { ...capturedPieces }
      newCapturedPieces[capturedPiece.color].push(capturedPiece)
      setCapturedPieces(newCapturedPieces)
    }

    // Update the board
    setBoard(newBoard)
    setMoveHistory([...moveHistory, moveRecord])
    setLastMove({ from, to })
    setSelectedPosition(null)
    setValidMoves([])

    // Switch player
    const nextPlayer = currentPlayer === "white" ? "black" : "white"
    setCurrentPlayer(nextPlayer)

    // Update game status based on player color and game mode
    if (gameMode === "local") {
      setGameStatus(`${nextPlayer === "white" ? "White" : "Black"}'s turn`)
    } else if (gameMode === "bot") {
      if (nextPlayer === playerColor) {
        setGameStatus("Your turn")
      } else {
        setGameStatus("Computer is thinking...")
      }
    }

    // Check for check, checkmate, or stalemate
    const isInCheck = isKingInCheck(newBoard, nextPlayer)
    setIsCheck(isInCheck)

    // A king crossing two files is a castle; nothing else can.
    const moveKind = {
      captured: !!capturedPiece,
      castled: piece.type === "king" && Math.abs(to.col - from.col) === 2,
      opponent: gameMode === "bot" && currentPlayer !== playerColor,
    }

    if (isInCheck) {
      const hasValidMoves = hasAnyValidMoves(newBoard, nextPlayer)
      // The move list needs to know, and it is only knowable now.
      setMoveHistory((history) =>
        history.length === 0
          ? history
          : [...history.slice(0, -1), { ...history[history.length - 1], check: hasValidMoves ? "+" : "#" }],
      )
      announceMove({ ...moveKind, check: true, gameOver: !hasValidMoves })
      if (!hasValidMoves) {
        setIsCheckmate(true)
        if (gameMode === "local") {
          setGameStatus(`Checkmate! ${currentPlayer === "white" ? "White" : "Black"} wins!`)
        } else {
          setGameStatus(nextPlayer === playerColor ? "Checkmate! You lose!" : "Checkmate! You win!")
        }
      } else {
        if (gameMode === "local") {
          setGameStatus(`${nextPlayer === "white" ? "White" : "Black"} is in check!`)
        } else if (gameMode === "bot") {
          if (nextPlayer === playerColor) {
            setGameStatus("Your king is in check!")
          } else {
            setGameStatus("Computer is in check!")
          }
        }
      }
    } else {
      const hasValidMoves = hasAnyValidMoves(newBoard, nextPlayer)
      announceMove({ ...moveKind, gameOver: !hasValidMoves })
      if (!hasValidMoves) {
        setIsStalemate(true)
        setGameStatus("Stalemate! The game is a draw.")
      }
    }
  }

  // Handle pawn promotion
  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionPosition || !selectedPosition) return

    const newBoard = [...board.map((row) => [...row])]
    const piece = newBoard[selectedPosition.row][selectedPosition.col]
    const capturedPiece = newBoard[promotionPosition.row][promotionPosition.col]

    if (!piece) return

    // Create the promoted piece
    const promotedPiece: ChessPiece = {
      type: pieceType,
      color: piece.color,
      hasMoved: true,
    }

    // Record the move for history
    const moveRecord: MoveRecord = {
      from: selectedPosition,
      to: promotionPosition,
      piece: { ...piece },
      captured: capturedPiece ? { ...capturedPiece } : undefined,
      isPromotion: true,
    }

    // Update captured pieces
    if (capturedPiece) {
      const newCapturedPieces = { ...capturedPieces }
      newCapturedPieces[capturedPiece.color].push(capturedPiece)
      setCapturedPieces(newCapturedPieces)
    }

    // Move the promoted piece
    newBoard[promotionPosition.row][promotionPosition.col] = promotedPiece
    newBoard[selectedPosition.row][selectedPosition.col] = null

    // Update the board
    setBoard(newBoard)
    setMoveHistory([...moveHistory, moveRecord])
    setLastMove({ from: selectedPosition, to: promotionPosition })
    setSelectedPosition(null)
    setValidMoves([])
    setShowPromotionDialog(false)
    setPromotionPosition(null)

    // Switch player
    const nextPlayer = currentPlayer === "white" ? "black" : "white"
    setCurrentPlayer(nextPlayer)

    // Update game status based on player color and game mode
    if (gameMode === "local") {
      setGameStatus(`${nextPlayer === "white" ? "White" : "Black"}'s turn`)
    } else if (gameMode === "bot") {
      if (nextPlayer === playerColor) {
        setGameStatus("Your turn")
      } else {
        setGameStatus("Computer is thinking...")
      }
    }

    // Check for check, checkmate, or stalemate
    const isInCheck = isKingInCheck(newBoard, nextPlayer)
    setIsCheck(isInCheck)

    const moveKind = { promoted: true, captured: !!capturedPiece }

    if (isInCheck) {
      const hasValidMoves = hasAnyValidMoves(newBoard, nextPlayer)
      // The move list needs to know, and it is only knowable now.
      setMoveHistory((history) =>
        history.length === 0
          ? history
          : [...history.slice(0, -1), { ...history[history.length - 1], check: hasValidMoves ? "+" : "#" }],
      )
      announceMove({ ...moveKind, check: true, gameOver: !hasValidMoves })
      if (!hasValidMoves) {
        setIsCheckmate(true)
        if (gameMode === "local") {
          setGameStatus(`Checkmate! ${currentPlayer === "white" ? "White" : "Black"} wins!`)
        } else {
          setGameStatus(nextPlayer === playerColor ? "Checkmate! You lose!" : "Checkmate! You win!")
        }
      } else {
        if (gameMode === "local") {
          setGameStatus(`${nextPlayer === "white" ? "White" : "Black"} is in check!`)
        } else if (gameMode === "bot") {
          if (nextPlayer === playerColor) {
            setGameStatus("Your king is in check!")
          } else {
            setGameStatus("Computer is in check!")
          }
        }
      }
    } else {
      const hasValidMoves = hasAnyValidMoves(newBoard, nextPlayer)
      announceMove({ ...moveKind, gameOver: !hasValidMoves })
      if (!hasValidMoves) {
        setIsStalemate(true)
        setGameStatus("Stalemate! The game is a draw.")
      }
    }
  }

  // Calculate valid moves for a piece
  const calculateValidMoves = (position: Position, currentBoard: Board): Position[] => {
    const { row, col } = position

    if (!currentBoard || currentBoard.length === 0 || !currentBoard[row] || currentBoard[row].length === 0) return []
    const piece = currentBoard[row][col]

    if (!piece) return []

    let moves: Position[] = []

    switch (piece.type) {
      case "pawn":
        moves = calculatePawnMoves(position, currentBoard)
        break
      case "rook":
        moves = calculateRookMoves(position, currentBoard)
        break
      case "knight":
        moves = calculateKnightMoves(position, currentBoard)
        break
      case "bishop":
        moves = calculateBishopMoves(position, currentBoard)
        break
      case "queen":
        moves = [...calculateRookMoves(position, currentBoard), ...calculateBishopMoves(position, currentBoard)]
        break
      case "king":
        moves = calculateKingMoves(position, currentBoard)
        break
    }

    // Filter out moves that would put the king in check
    return moves.filter((move) => {
      const newBoard = [...currentBoard.map((row) => [...row])]
      const movingPiece = newBoard[row][col]

      // Make the move on the new board
      newBoard[move.row][move.col] = movingPiece
      newBoard[row][col] = null

      // Check if the king is in check after the move
      return !isKingInCheck(newBoard, piece.color)
    })
  }

  // Calculate valid moves for a pawn
  const calculatePawnMoves = (position: Position, currentBoard: Board): Position[] => {
    const { row, col } = position
    const piece = currentBoard[row][col]
    const moves: Position[] = []

    if (!piece || piece.type !== "pawn") return moves

    const direction = piece.color === "white" ? -1 : 1
    const startRow = piece.color === "white" ? 6 : 1

    // Move forward one square
    if (row + direction >= 0 && row + direction < 8 && !currentBoard[row + direction][col]) {
      moves.push({ row: row + direction, col })

      // Move forward two squares from starting position
      if (row === startRow && !currentBoard[row + 2 * direction][col]) {
        moves.push({ row: row + 2 * direction, col })
      }
    }

    // Capture diagonally
    const captureDirections = [
      { row: row + direction, col: col - 1 },
      { row: row + direction, col: col + 1 },
    ]

    for (const capturePos of captureDirections) {
      if (
        capturePos.row >= 0 &&
        capturePos.row < 8 &&
        capturePos.col >= 0 &&
        capturePos.col < 8 &&
        currentBoard[capturePos.row][capturePos.col] &&
        currentBoard[capturePos.row][capturePos.col]?.color !== piece.color
      ) {
        moves.push(capturePos)
      }
    }

    return moves
  }

  // Calculate valid moves for a rook
  const calculateRookMoves = (position: Position, currentBoard: Board): Position[] => {
    const { row, col } = position
    const piece = currentBoard[row][col]
    const moves: Position[] = []

    if (!piece) return moves

    // Directions: up, right, down, left
    const directions = [
      { rowDelta: -1, colDelta: 0 },
      { rowDelta: 0, colDelta: 1 },
      { rowDelta: 1, colDelta: 0 },
      { rowDelta: 0, colDelta: -1 },
    ]

    for (const direction of directions) {
      let newRow = row + direction.rowDelta
      let newCol = col + direction.colDelta

      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = currentBoard[newRow][newCol]

        if (!targetPiece) {
          // Empty square, can move here
          moves.push({ row: newRow, col: newCol })
        } else if (targetPiece.color !== piece.color) {
          // Enemy piece, can capture and then stop
          moves.push({ row: newRow, col: newCol })
          break
        } else {
          // Friendly piece, stop
          break
        }

        newRow += direction.rowDelta
        newCol += direction.colDelta
      }
    }

    return moves
  }

  // Calculate valid moves for a knight
  const calculateKnightMoves = (position: Position, currentBoard: Board): Position[] => {
    const { row, col } = position
    const piece = currentBoard[row][col]
    const moves: Position[] = []

    if (!piece) return moves

    // Knight's L-shaped moves
    const knightMoves = [
      { rowDelta: -2, colDelta: -1 },
      { rowDelta: -2, colDelta: 1 },
      { rowDelta: -1, colDelta: -2 },
      { rowDelta: -1, colDelta: 2 },
      { rowDelta: 1, colDelta: -2 },
      { rowDelta: 1, colDelta: 2 },
      { rowDelta: 2, colDelta: -1 },
      { rowDelta: 2, colDelta: 1 },
    ]

    for (const move of knightMoves) {
      const newRow = row + move.rowDelta
      const newCol = col + move.colDelta

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = currentBoard[newRow][newCol]

        if (!targetPiece || targetPiece.color !== piece.color) {
          // Empty square or enemy piece, can move here
          moves.push({ row: newRow, col: newCol })
        }
      }
    }

    return moves
  }

  // Calculate valid moves for a bishop
  const calculateBishopMoves = (position: Position, currentBoard: Board): Position[] => {
    const { row, col } = position
    const piece = currentBoard[row][col]
    const moves: Position[] = []

    if (!piece) return moves

    // Directions: up-left, up-right, down-right, down-left
    const directions = [
      { rowDelta: -1, colDelta: -1 },
      { rowDelta: -1, colDelta: 1 },
      { rowDelta: 1, colDelta: 1 },
      { rowDelta: 1, colDelta: -1 },
    ]

    for (const direction of directions) {
      let newRow = row + direction.rowDelta
      let newCol = col + direction.colDelta

      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = currentBoard[newRow][newCol]

        if (!targetPiece) {
          // Empty square, can move here
          moves.push({ row: newRow, col: newCol })
        } else if (targetPiece.color !== piece.color) {
          // Enemy piece, can capture and then stop
          moves.push({ row: newRow, col: newCol })
          break
        } else {
          // Friendly piece, stop
          break
        }

        newRow += direction.rowDelta
        newCol += direction.colDelta
      }
    }

    return moves
  }

  // Calculate basic king moves (without castling)
  const calculateBasicKingMoves = (position: Position, currentBoard: Board): Position[] => {
    const { row, col } = position
    const piece = currentBoard[row][col]
    const moves: Position[] = []

    if (!piece) return moves

    // King can move one square in any direction
    const kingMoves = [
      { rowDelta: -1, colDelta: -1 },
      { rowDelta: -1, colDelta: 0 },
      { rowDelta: -1, colDelta: 1 },
      { rowDelta: 0, colDelta: -1 },
      { rowDelta: 0, colDelta: 1 },
      { rowDelta: 1, colDelta: -1 },
      { rowDelta: 1, colDelta: 0 },
      { rowDelta: 1, colDelta: 1 },
    ]

    for (const move of kingMoves) {
      const newRow = row + move.rowDelta
      const newCol = col + move.colDelta

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = currentBoard[newRow][newCol]

        if (!targetPiece || targetPiece.color !== piece.color) {
          // Empty square or enemy piece, can move here
          moves.push({ row: newRow, col: newCol })
        }
      }
    }

    return moves
  }

  // Calculate valid moves for a king (including castling)
  const calculateKingMoves = (position: Position, currentBoard: Board): Position[] => {
    const { row, col } = position
    const piece = currentBoard[row][col]
    const moves: Position[] = calculateBasicKingMoves(position, currentBoard)

    if (!piece || piece.hasMoved) return moves

    // Check if king is in check - if so, no castling
    if (isKingInCheck(currentBoard, piece.color, true)) return moves

    // Kingside castling
    if (
      currentBoard[row][7]?.type === "rook" &&
      currentBoard[row][7]?.color === piece.color &&
      !currentBoard[row][7]?.hasMoved &&
      !currentBoard[row][6] &&
      !currentBoard[row][5]
    ) {
      // Check if squares between king and rook are not under attack
      const tempBoard1 = [...currentBoard.map((row) => [...row])]
      tempBoard1[row][5] = piece
      tempBoard1[row][4] = null

      if (!isKingInCheck(tempBoard1, piece.color, true)) {
        moves.push({ row, col: 6 })
      }
    }

    // Queenside castling
    if (
      currentBoard[row][0]?.type === "rook" &&
      currentBoard[row][0]?.color === piece.color &&
      !currentBoard[row][0]?.hasMoved &&
      !currentBoard[row][1] &&
      !currentBoard[row][2] &&
      !currentBoard[row][3]
    ) {
      // Check if squares between king and rook are not under attack
      const tempBoard2 = [...currentBoard.map((row) => [...row])]
      tempBoard2[row][3] = piece
      tempBoard2[row][4] = null

      if (!isKingInCheck(tempBoard2, piece.color, true)) {
        moves.push({ row, col: 2 })
      }
    }

    return moves
  }

  // Check if the king is in check
  const isKingInCheck = (currentBoard: Board, kingColor: PieceColor, skipKingMoves = false): boolean => {
    if (!currentBoard || currentBoard.length === 0) return false
    // Find the king's position
    let kingPosition: Position | null = null

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col]
        if (piece && piece.type === "king" && piece.color === kingColor) {
          kingPosition = { row, col }
          break
        }
      }
      if (kingPosition) break
    }

    if (!kingPosition) return false

    // Check if any opponent's piece can capture the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col]
        if (piece && piece.color !== kingColor) {
          let moves: Position[] = []

          switch (piece.type) {
            case "pawn":
              moves = calculatePawnMoves({ row, col }, currentBoard)
              break
            case "rook":
              moves = calculateRookMoves({ row, col }, currentBoard)
              break
            case "knight":
              moves = calculateKnightMoves({ row, col }, currentBoard)
              break
            case "bishop":
              moves = calculateBishopMoves({ row, col }, currentBoard)
              break
            case "queen":
              moves = [
                ...calculateRookMoves({ row, col }, currentBoard),
                ...calculateBishopMoves({ row, col }, currentBoard),
              ]
              break
            case "king":
              // Use basic king moves to avoid infinite recursion
              moves = skipKingMoves ? [] : calculateBasicKingMoves({ row, col }, currentBoard)
              break
          }

          // Check if any of the moves can capture the king
          for (const move of moves) {
            if (move.row === kingPosition.row && move.col === kingPosition.col) {
              return true
            }
          }
        }
      }
    }

    return false
  }

  // Check if the player has any valid moves
  const hasAnyValidMoves = (currentBoard: Board, playerColor: PieceColor): boolean => {
    if (!currentBoard || currentBoard.length === 0) return false
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = currentBoard[row][col]
        if (piece && piece.color === playerColor) {
          const moves = calculateValidMoves({ row, col }, currentBoard)
          if (moves.length > 0) {
            return true
          }
        }
      }
    }
    return false
  }

  // Undo the last move
  const undoMove = () => {
    if (moveHistory.length === 0) return

    // In bot mode, undo both the bot's move and the player's move
    if (gameMode === "bot" && moveHistory.length >= 2 && currentPlayer === playerColor) {
      // Undo bot's move first
      const botMove = moveHistory[moveHistory.length - 1]
      const playerMove = moveHistory[moveHistory.length - 2]

      const newBoard = [...board.map((row) => [...row])]

      // Restore bot's piece
      newBoard[botMove.from.row][botMove.from.col] = botMove.piece

      // Restore captured piece if any
      if (botMove.captured) {
        newBoard[botMove.to.row][botMove.to.col] = botMove.captured

        // Remove from captured pieces
        const newCapturedPieces = { ...capturedPieces }
        const index = newCapturedPieces[botMove.captured.color].findIndex((p) => p.type === botMove.captured?.type)
        if (index !== -1) {
          newCapturedPieces[botMove.captured.color].splice(index, 1)
        }
        setCapturedPieces(newCapturedPieces)
      } else {
        newBoard[botMove.to.row][botMove.to.col] = null
      }

      // Restore player's piece
      newBoard[playerMove.from.row][playerMove.from.col] = playerMove.piece

      // Restore captured piece if any
      if (playerMove.captured) {
        newBoard[playerMove.to.row][playerMove.to.col] = playerMove.captured

        // Remove from captured pieces
        const newCapturedPieces = { ...capturedPieces }
        const index = newCapturedPieces[playerMove.captured.color].findIndex(
          (p) => p.type === playerMove.captured?.type,
        )
        if (index !== -1) {
          newCapturedPieces[playerMove.captured.color].splice(index, 1)
        }
        setCapturedPieces(newCapturedPieces)
      } else {
        newBoard[playerMove.to.row][playerMove.to.col] = null
      }

      // Update the board
      setBoard(newBoard)

      // Remove the moves from history
      setMoveHistory(moveHistory.slice(0, -2))

      // Reset check/checkmate/stalemate status
      setIsCheck(false)
      setIsCheckmate(false)
      setIsStalemate(false)

      // Clear selection
      setSelectedPosition(null)
      setValidMoves([])
      setLastMove(null)

      setGameStatus("Your turn")

      return
    }

    // Regular undo for local game
    const lastMove = moveHistory[moveHistory.length - 1]
    const newBoard = [...board.map((row) => [...row])]

    // Move the piece back
    newBoard[lastMove.from.row][lastMove.from.col] = lastMove.piece

    // Restore captured piece if any
    if (lastMove.captured) {
      newBoard[lastMove.to.row][lastMove.to.col] = lastMove.captured

      // Remove from captured pieces
      const newCapturedPieces = { ...capturedPieces }
      const index = newCapturedPieces[lastMove.captured.color].findIndex((p) => p.type === lastMove.captured?.type)
      if (index !== -1) {
        newCapturedPieces[lastMove.captured.color].splice(index, 1)
      }
      setCapturedPieces(newCapturedPieces)
    } else {
      newBoard[lastMove.to.row][lastMove.to.col] = null
    }

    // Update the board
    setBoard(newBoard)

    // Remove the move from history
    setMoveHistory(moveHistory.slice(0, -1))

    // Switch player back
    const previousPlayer = currentPlayer === "white" ? "black" : "white"
    setCurrentPlayer(previousPlayer)

    // Update game status based on player color and game mode
    if (gameMode === "local") {
      setGameStatus(`${previousPlayer === "white" ? "White" : "Black"}'s turn`)
    } else if (gameMode === "bot") {
      if (previousPlayer === playerColor) {
        setGameStatus("Your turn")
      } else {
        setGameStatus("Computer's turn")
      }
    }

    // Reset check/checkmate/stalemate status
    setIsCheck(false)
    setIsCheckmate(false)
    setIsStalemate(false)

    // Clear selection
    setSelectedPosition(null)
    setValidMoves([])
    setLastMove(null)
  }

  // Get piece image path
  const getPieceImagePath = (piece: ChessPiece | null) => {
    if (!piece) return null

    const pieceImages = {
      white: {
        pawn: "/images/chess/pawn.png",
        rook: "/images/chess/rook.png",
        knight: "/images/chess/knight.png",
        bishop: "/images/chess/bishop.png",
        queen: "/images/chess/queen.png",
        king: "/images/chess/king.png",
      },
      black: {
        pawn: "/images/chess/pawn1.png",
        rook: "/images/chess/rook1.png",
        knight: "/images/chess/knight1.png",
        bishop: "/images/chess/bishop1.png",
        queen: "/images/chess/queen1.png",
        king: "/images/chess/king1.png",
      },
    }

    return piece && piece.color && piece.type ? pieceImages[piece.color][piece.type] : null
  }

  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()

    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      setMenuPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setShowMenu(true)
    }
  }

  // Handle menu item click
  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case "new":
        setShowStartScreen(true)
        break
      case "undo":
        undoMove()
        break
      case "flip":
        setBoardFlipped(!boardFlipped)
        break
      case "exit":
        onReturn()
        break
    }
    setShowMenu(false)
  }

  // Change the board theme
  const changeTheme = (theme: BoardTheme) => {
    setCurrentTheme(theme)
    setShowThemeSelector(false)
  }

  // Flip the board
  const flipBoard = () => {
    setBoardFlipped(!boardFlipped)
  }

  // Bot move logic
  const makeBotMove = () => {
    setIsThinking(true)

    // Get all possible moves for the bot
    const botColor = playerColor === "white" ? "black" : "white"
    const allMoves: { from: Position; to: Position; score: number }[] = []

    // Collect all possible moves with scores
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece.color === botColor) {
          const validMoves = calculateValidMoves({ row, col }, board)

          for (const move of validMoves) {
            // Create a new board with the move applied
            const newBoard = [...board.map((row) => [...row])]
            // Same square as the `piece &&` guard above, so this is non-null.
            const movingPiece = piece
            const capturedPiece = newBoard[move.row][move.col]

            // Make the move
            newBoard[move.row][move.col] = movingPiece
            newBoard[row][col] = null

            // Calculate score for this move
            let score = 0

            // Prioritize captures based on piece value
            if (capturedPiece) {
              const pieceValues: Record<PieceType, number> = {
                pawn: 1,
                knight: 3,
                bishop: 3,
                rook: 5,
                queen: 9,
                king: 100,
              }
              score += pieceValues[capturedPiece.type]
            }

            // Prioritize checking the opponent
            if (isKingInCheck(newBoard, playerColor)) {
              score += 0.5

              // Even higher priority for checkmate
              if (!hasAnyValidMoves(newBoard, playerColor)) {
                score += 100
              }
            }

            // Prioritize center control for knights and bishops
            if (movingPiece.type === "knight" || movingPiece.type === "bishop") {
              const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5)
              score += (4 - centerDistance) * 0.1
            }

            // Prioritize pawn advancement
            if (movingPiece.type === "pawn") {
              const advancementRow = botColor === "white" ? 7 - move.row : move.row
              score += advancementRow * 0.05

              // Extra points for promotion
              if ((botColor === "white" && move.row === 7) || (botColor === "black" && move.row === 0)) {
                score += 5
              }
            }

            // Add some randomness to make the bot less predictable
            score += Math.random() * 0.2

            allMoves.push({ from: { row, col }, to: move, score })
          }
        }
      }
    }

    // Hard looks one reply ahead and subtracts whatever the opponent could
    // take in return, which is the difference between a computer that grabs
    // material and one that stops leaving pieces hanging.
    if (difficulty === "hard") {
      const values: Record<PieceType, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 }
      for (const move of allMoves) {
        const after = board.map((row) => [...row])
        after[move.to.row][move.to.col] = after[move.from.row][move.from.col]
        after[move.from.row][move.from.col] = null

        let worst = 0
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = after[r][c]
            if (!piece || piece.color === botColor) continue
            for (const reply of calculateValidMoves({ row: r, col: c }, after)) {
              const target = after[reply.row][reply.col]
              if (target && target.color === botColor) worst = Math.max(worst, values[target.type])
            }
          }
        }
        move.score -= worst * 0.9
      }
    }

    // Sort moves by score (highest first)
    allMoves.sort((a, b) => b.score - a.score)

    // Make the best move after a delay
    setTimeout(() => {
      if (allMoves.length > 0) {
        // Easy takes any legal move; the others take the best one found.
        const choice = difficulty === "easy" ? allMoves[Math.floor(Math.random() * allMoves.length)] : allMoves[0]
        movePiece(choice.from, choice.to)
      }
      setIsThinking(false)
    }, difficulty === "hard" ? 700 : 500)
  }

  /**
   * The New Game dialog.
   *
   * This was a card with round blue and red badges reading 2P and AI on it,
   * which is a decade and a half after the rest of the desktop. Windows 95
   * asked this sort of question with a dialog: grouped boxes, radio buttons,
   * and OK and Cancel at the bottom right. The pieces stand in for the
   * swatches an options dialog would have shown.
   */
  const renderStartScreen = () => {
    const group = "border border-t-[#808080] border-l-[#808080] border-r-white border-b-white"

    const Radio = ({
      name,
      checked,
      onChange,
      children,
    }: {
      name: string
      checked: boolean
      onChange: () => void
      children: React.ReactNode
    }) => (
      <label className="flex cursor-default items-center gap-2 py-[3px]">
        <input type="radio" name={name} checked={checked} onChange={onChange} />
        {children}
      </label>
    )

    return (
      <div className="flex h-full w-full items-center justify-center bg-[#c0c0c0] p-4">
        <div
          data-chess-newgame
          className="w-[380px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0]"
        >
          <div className="flex items-center bg-[#000080] px-1 py-[2px] text-white">
            <img
              src="/images/win95/chess-32.png"
              alt=""
              className="mr-1 h-4 w-4"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="px-1 font-bold">New Game</span>
          </div>

          <div className="p-3">
            {/* Opponent */}
            <fieldset className={`mb-3 px-3 pb-2 ${group}`}>
              <legend className="px-1">Opponent</legend>
              <Radio name="opponent" checked={gameMode === "local"} onChange={() => setGameMode("local")}>
                <span>
                  <span className="underline">T</span>wo players, one keyboard
                </span>
              </Radio>
              <Radio name="opponent" checked={gameMode === "bot"} onChange={() => setGameMode("bot")}>
                <span>
                  Play against the <span className="underline">c</span>omputer
                </span>
              </Radio>
            </fieldset>

            {/* Colour. Disabled until an opponent is chosen, as a dialog would. */}
            <fieldset
              className={`mb-3 px-3 pb-2 ${group} ${gameMode ? "" : "text-[#808080]"}`}
              disabled={!gameMode}
            >
              <legend className="px-1">Play as</legend>
              <div className="flex gap-6 py-1">
                <button
                  type="button"
                  data-colour="white"
                  onClick={() => gameMode && startGame(gameMode, "white")}
                  className="flex flex-1 flex-col items-center gap-1 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-2 active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                >
                  <img src="/images/chess/king.png" alt="" className="h-10 w-10" />
                  <span>
                    <span className="underline">W</span>hite
                  </span>
                  <span className="text-[#404040]">moves first</span>
                </button>
                <button
                  type="button"
                  data-colour="black"
                  onClick={() => gameMode && startGame(gameMode, "black")}
                  className="flex flex-1 flex-col items-center gap-1 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-2 active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white"
                >
                  <img src="/images/chess/king1.png" alt="" className="h-10 w-10" />
                  <span>
                    <span className="underline">B</span>lack
                  </span>
                  <span className="text-[#404040]">moves second</span>
                </button>
              </div>
            </fieldset>

            <p className="text-[#404040]">
              {gameMode ? "Choose a colour to begin." : "Choose an opponent first."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="win95-type h-full w-full flex flex-col bg-[#c0c0c0] overflow-auto" style={{ fontFamily: '"MS Sans Serif", sans-serif' }}>
      {/* Menu bar, in the style every game shares. */}
      <div className="flex border-b border-[#808080] bg-[#c0c0c0] px-1" onMouseLeave={() => setOpenBarMenu(null)}>
        {(
          [
            [
              "Game",
              [
                { label: "New Game", action: () => setShowStartScreen(true) },
                { label: "Undo", action: undoMove },
                { label: "Flip Board", action: flipBoard },
                { label: "Exit", action: onReturn },
              ],
            ],
            [
              "Options",
              [
                { label: "Theme...", action: () => setShowThemeSelector(true) },
                { label: `${soundOn ? "✓ " : "   "}Sound`, action: toggleSound },
                ...(["easy", "medium", "hard"] as const).map((level) => ({
                  label: `${difficulty === level ? "\u2713 " : "\u00a0\u00a0 "}${
                    level === "easy" ? "Easy" : level === "medium" ? "Medium" : "Hard"
                  }`,
                  action: () => setDifficulty(level),
                })),
              ],
            ],
          ] as const
        ).map(([name, options]) => (
          <div key={name} className="relative">
            <button
              type="button"
              className={`px-2 py-[2px] ${openBarMenu === name ? "bg-[#000080] text-white" : ""}`}
              onClick={() => setOpenBarMenu(openBarMenu === name ? null : name)}
              onMouseEnter={() => openBarMenu && setOpenBarMenu(name)}
            >
              <span className="underline">{name[0]}</span>
              {name.slice(1)}
            </button>
            {openBarMenu === name && (
              <div className="absolute left-0 top-full z-50 min-w-[160px] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] py-1 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]">
                {options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className="flex w-full items-center px-3 py-[2px] text-left hover:bg-[#000080] hover:text-white"
                    onClick={() => {
                      option.action()
                      setOpenBarMenu(null)
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showStartScreen ? (
        renderStartScreen()
      ) : (
        <div className="flex-1 flex p-4 overflow-auto">
          {/* Chess board */}
          <div
            className="relative border-4 border-t-gray-400 border-l-gray-400 border-r-white border-b-white shadow-md"
            ref={boardRef}
            onContextMenu={handleContextMenu}
            style={{
              aspectRatio: "1/1",
              maxWidth: "min(100%, calc(100vh - 200px))",
            }}
          >
            <div className="grid grid-cols-8 h-full w-full" style={{ gridTemplateRows: "repeat(8, 1fr)" }}>
              {Array(8)
                .fill(null)
                .map((_, row) =>
                  Array(8)
                    .fill(null)
                    .map((_, col) => {
                      // If board is flipped, invert the coordinates for display
                      const displayRow = boardFlipped ? 7 - row : row
                      const displayCol = boardFlipped ? 7 - col : col

                      const isBlack = (displayRow + displayCol) % 2 === 1
                      const piece = board[displayRow][displayCol]
                      const isSelected =
                        selectedPosition && selectedPosition.row === displayRow && selectedPosition.col === displayCol
                      const isValidMove = validMoves.some((pos) => pos.row === displayRow && pos.col === displayCol)
                      // The square a piece has just landed on, which is the one
                      // that plays the slide.
                      const justArrived =
                        !!lastMove && lastMove.to.row === displayRow && lastMove.to.col === displayCol
                      // The king under attack, so check is visible and not only audible.
                      const kingInCheck =
                        isCheck && piece?.type === "king" && piece.color === currentPlayer

                      return (
                        <div
                          key={`${row}-${col}`}
                          className={`flex items-center justify-center cursor-pointer
                            ${isBlack ? currentTheme.darkSquare : currentTheme.lightSquare}
                            ${isSelected ? currentTheme.selected : ""}
                            ${isValidMove ? "relative" : ""}
                            ${
                              lastMove &&
                              (
                                (lastMove.from.row === displayRow && lastMove.from.col === displayCol) ||
                                  (lastMove.to.row === displayRow && lastMove.to.col === displayCol)
                              )
                                ? "ring-4 ring-yellow-400 ring-opacity-70 ring-inset"
                                : ""
                            }
                            ${kingInCheck ? "anim-square-alert" : ""}
                          `}
                          style={{
                            height: "100%",
                            width: "100%",
                          }}
                          onClick={() => handleCellClick(row, col)}
                        >
                          {piece && getPieceImagePath(piece) && (
                            <div
                              // Remounted on every move so the slide replays.
                              key={`${moveHistory.length}-${displayRow}-${displayCol}`}
                              className={`w-full h-full flex items-center justify-center ${
                                justArrived ? "anim-piece-slide" : ""
                              }`}
                              style={
                                justArrived && lastMove
                                  ? ({
                                      // In squares, not pixels, and negated when the
                                      // board is flipped so it still reads as travel.
                                      "--dx": (boardFlipped ? -1 : 1) * (lastMove.from.col - lastMove.to.col),
                                      "--dy": (boardFlipped ? -1 : 1) * (lastMove.from.row - lastMove.to.row),
                                    } as React.CSSProperties)
                                  : undefined
                              }
                            >
                              <img
                                src={getPieceImagePath(piece) || "/placeholder.svg"}
                                alt={`${piece.color} ${piece.type}`}
                                className="w-3/4 h-3/4 object-contain"
                                draggable={false}
                              />
                            </div>
                          )}
                          {isValidMove && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {piece ? (
                                // Circle around capturable pieces
                                <div className="absolute w-full h-full border-4 border-gray-500 border-opacity-70 rounded-full"></div>
                              ) : (
                                // Dot for empty squares
                                <div className="w-1/3 h-1/3 rounded-full bg-gray-500 bg-opacity-70"></div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    }),
                )}
            </div>

            {/* Theme selector */}
            {showThemeSelector && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] shadow-lg p-4 z-10 w-64">
                <div className="text-center mb-4 font-bold text-lg">Select Theme</div>
                <div className="grid grid-cols-1 gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      className={`px-4 py-2 text-left border ${
                        currentTheme.name === theme.name
                          ? "bg-blue-500 text-white"
                          : "bg-[#c0c0c0] border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-gray-300"
                      }`}
                      onClick={() => changeTheme(theme)}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Promotion dialog */}
            {showPromotionDialog && promotionPosition && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] shadow-lg p-4 z-10">
                <div className="text-center mb-4 font-bold text-lg">Promote to:</div>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="aspect-square flex items-center justify-center bg-[#c0c0c0] border border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-gray-300 cursor-pointer p-2"
                    onClick={() => handlePromotion("queen")}
                  >
                    <img
                      src={
                        getPieceImagePath({ type: "queen", color: currentPlayer || "/placeholder.svg" }) ||
                        "/placeholder.svg"
                      }
                      alt={`${currentPlayer} queen`}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div
                    className="aspect-square flex items-center justify-center bg-[#c0c0c0] border border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-gray-300 cursor-pointer p-2"
                    onClick={() => handlePromotion("rook")}
                  >
                    <img
                      src={
                        getPieceImagePath({ type: "rook", color: currentPlayer || "/placeholder.svg" }) ||
                        "/placeholder.svg"
                      }
                      alt={`${currentPlayer} rook`}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div
                    className="aspect-square flex items-center justify-center bg-[#c0c0c0] border border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-gray-300 cursor-pointer p-2"
                    onClick={() => handlePromotion("bishop")}
                  >
                    <img
                      src={
                        getPieceImagePath({ type: "bishop", color: currentPlayer || "/placeholder.svg" }) ||
                        "/placeholder.svg"
                      }
                      alt={`${currentPlayer} bishop`}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div
                    className="aspect-square flex items-center justify-center bg-[#c0c0c0] border border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-gray-300 cursor-pointer p-2"
                    onClick={() => handlePromotion("knight")}
                  >
                    <img
                      src={
                        getPieceImagePath({ type: "knight", color: currentPlayer || "/placeholder.svg" }) ||
                        "/placeholder.svg"
                      }
                      alt={`${currentPlayer} knight`}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Context menu */}
            {showMenu && (
              <div
                className="absolute bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] shadow-md z-10"
                style={{ top: menuPosition.y, left: menuPosition.x }}
              >
                <div
                  className="px-4 py-1 hover:bg-blue-800 hover:text-white cursor-pointer"
                  onClick={() => handleMenuItemClick("new")}
                >
                  New Game
                </div>
                <div
                  className="px-4 py-1 hover:bg-blue-800 hover:text-white cursor-pointer"
                  onClick={() => handleMenuItemClick("undo")}
                >
                  Undo Move
                </div>
                <div
                  className="px-4 py-1 hover:bg-blue-800 hover:text-white cursor-pointer"
                  onClick={() => handleMenuItemClick("flip")}
                >
                  Flip Board
                </div>
                <div className="border-t border-gray-400 my-1"></div>
                {(["easy", "medium", "hard"] as const).map((level) => (
                  <div
                    key={level}
                    data-difficulty={level}
                    className="px-4 py-1 hover:bg-blue-800 hover:text-white cursor-pointer"
                    onClick={() => {
                      setDifficulty(level)
                      setShowMenu(false)
                    }}
                  >
                    <span className="mr-2">{difficulty === level ? "\u2713" : "\u00a0"}</span>
                    {level === "easy" ? "Easy" : level === "medium" ? "Medium" : "Hard"}
                  </div>
                ))}
                <div className="border-t border-gray-400 my-1"></div>
                <div
                  className="px-4 py-1 hover:bg-blue-800 hover:text-white cursor-pointer"
                  onClick={() => handleMenuItemClick("exit")}
                >
                  Exit
                </div>
              </div>
            )}

            {/* Bot thinking indicator */}
            {isThinking && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-3 shadow-lg">
                  <div className="text-center font-bold">Computer is thinking...</div>
                </div>
              </div>
            )}
          </div>

          {/* Game info */}
          <div className="flex flex-col w-1/3 min-w-[250px] max-w-[400px] overflow-auto ml-4">
            <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-2 mb-4">
              <div className="font-bold mb-2">{gameStatus}</div>
              <div className="mb-2">
                {gameMode === "local" ? (
                  <span>Local Game</span>
                ) : (
                  <span>
                    Playing as: <span className="font-bold">{playerColor === "white" ? "White" : "Black"}</span>
                  </span>
                )}
              </div>
              <div className={`${isCheck ? "text-red-600 font-bold" : ""}`}>
                {isCheck && !isCheckmate ? "Check!" : ""}
                {isCheckmate ? "Checkmate!" : ""}
                {isStalemate ? "Stalemate!" : ""}
              </div>
            </div>

            {/* Captured pieces */}
            <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-2 mb-4">
              <div className="font-bold mb-2">Captured Pieces</div>
              <div className="mb-2">
                <span className="font-bold">White: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {capturedPieces.white.map((piece, index) => (
                    <div key={index} className="w-6 h-6">
                      <img
                        src={getPieceImagePath(piece) || "/placeholder.svg"}
                        alt={`${piece.color} ${piece.type}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-bold">Black: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {capturedPieces.black.map((piece, index) => (
                    <div key={index} className="w-6 h-6">
                      <img
                        src={getPieceImagePath(piece) || "/placeholder.svg"}
                        alt={`${piece.color} ${piece.type}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Move history */}
            <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-2 flex-1 overflow-auto">
              <div className="font-bold mb-2">Move History</div>
              <table data-moves className="w-full text-sm">
                <tbody>
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => (
                    <tr key={i}>
                      <td className="w-8 pr-1 text-right align-top text-gray-600">{i + 1}.</td>
                      <td className="pr-2 align-top">{notation(moveHistory[i * 2])}</td>
                      <td className="align-top">{moveHistory[i * 2 + 1] ? notation(moveHistory[i * 2 + 1]) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controls */}
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setShowStartScreen(true)}
                className="px-3 py-1 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
