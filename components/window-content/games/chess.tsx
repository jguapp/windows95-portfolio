"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

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
}

// Board themes
interface BoardTheme {
  name: string
  lightSquare: string
  darkSquare: string
  selected: string
  validMove: string
}

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
  const [moveSound, setMoveSound] = useState<HTMLAudioElement | null>(null)
  const [captureSound, setCaptureSound] = useState<HTMLAudioElement | null>(null)
  const [checkSound, setCheckSound] = useState<HTMLAudioElement | null>(null)
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const boardRef = useRef<HTMLDivElement>(null)
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false)
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false)
  const [playerColor, setPlayerColor] = useState<PieceColor>("white")
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [showStartScreen, setShowStartScreen] = useState<boolean>(true)
  const [isThinking, setIsThinking] = useState<boolean>(false)
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null)

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

  // Initialize sounds
  useEffect(() => {
    setMoveSound(new Audio("/sounds/chess-move.mp3"))
    setCaptureSound(new Audio("/sounds/chess-capture.mp3"))
    setCheckSound(new Audio("/sounds/chess-check.mp3"))
  }, [])

  // Initialize the board
  useEffect(() => {
    if (gameMode) {
      initializeBoard()
    }
  }, [gameMode, playerColor])

  // Bot move effect
  useEffect(() => {
    if (gameMode === "bot" && currentPlayer !== playerColor && !isCheckmate && !isStalemate) {
      const botMoveTimeout = setTimeout(() => {
        makeBotMove()
      }, 1000)

      return () => clearTimeout(botMoveTimeout)
    }
  }, [currentPlayer, gameMode, isCheckmate, isStalemate])

  // Play sounds
  const playMoveSound = () => {
    if (moveSound) {
      moveSound.currentTime = 0
      moveSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  const playCaptureSound = () => {
    if (captureSound) {
      captureSound.currentTime = 0
      captureSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  const playCheckSound = () => {
    if (checkSound) {
      checkSound.currentTime = 0
      checkSound.play().catch((err) => console.log("Audio playback failed:", err))
    }
  }

  // Start a new game with selected options
  const startGame = (mode: GameMode, color: PieceColor) => {
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
      playCaptureSound()
    } else {
      playMoveSound()
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

    if (isInCheck) {
      playCheckSound()
      const hasValidMoves = hasAnyValidMoves(newBoard, nextPlayer)
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
      playCaptureSound()
    } else {
      playMoveSound()
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

    if (isInCheck) {
      playCheckSound()
      const hasValidMoves = hasAnyValidMoves(newBoard, nextPlayer)
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

  // Close the context menu
  const closeMenu = () => {
    setShowMenu(false)
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
            const movingPiece = newBoard[row][col]
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

    // Sort moves by score (highest first)
    allMoves.sort((a, b) => b.score - a.score)

    // Make the best move after a delay
    setTimeout(() => {
      if (allMoves.length > 0) {
        const bestMove = allMoves[0]
        movePiece(bestMove.from, bestMove.to)
      }
      setIsThinking(false)
    }, 500)
  }

  // Render the start screen
  const renderStartScreen = () => {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-4">
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-6 shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <img src="/images/chess/king.png" alt="Chess" className="w-10 h-10 mr-3" />
            <h2 className="text-xl font-bold text-center">Windows 95 Chess</h2>
          </div>

          <div className="mb-8">
            <h3 className="font-bold mb-3 text-center border-b border-gray-400 pb-1">Select Game Mode</h3>
            <div className="grid grid-cols-1 gap-3 mt-4">
              <button
                className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-3 hover:bg-gray-300 active:border-t-[#5a5a5a] active:border-l-[#5a5a5a] active:border-r-white active:border-b-white flex items-center"
                onClick={() => setGameMode("local")}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  2P
                </div>
                <span className="font-bold">Local Game (2 Players)</span>
              </button>
              <button
                className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-3 hover:bg-gray-300 active:border-t-[#5a5a5a] active:border-l-[#5a5a5a] active:border-r-white active:border-b-white flex items-center"
                onClick={() => setGameMode("bot")}
              >
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  AI
                </div>
                <span className="font-bold">Play Against Computer</span>
              </button>
            </div>
          </div>

          {gameMode && (
            <div className="mb-8">
              <h3 className="font-bold mb-3 text-center border-b border-gray-400 pb-1">Select Your Color</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-3 hover:bg-gray-300 active:border-t-[#5a5a5a] active:border-l-[#5a5a5a] active:border-r-white active:border-b-white flex flex-col items-center"
                  onClick={() => startGame(gameMode, "white")}
                >
                  <div className="bg-gray-100 rounded-full p-2 mb-2">
                    <img src="/images/chess/king.png" alt="White King" className="w-12 h-12" />
                  </div>
                  <span className="font-bold">White</span>
                  <span className="text-xs mt-1">(Moves First)</span>
                </button>
                <button
                  className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] p-3 hover:bg-gray-300 active:border-t-[#5a5a5a] active:border-l-[#5a5a5a] active:border-r-white active:border-b-white flex flex-col items-center"
                  onClick={() => startGame(gameMode, "black")}
                >
                  <div className="bg-gray-800 rounded-full p-2 mb-2">
                    <img src="/images/chess/king1.png" alt="Black King" className="w-12 h-12" />
                  </div>
                  <span className="font-bold">Black</span>
                  <span className="text-xs mt-1">(Moves Second)</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#5a5a5a] border-b-[#5a5a5a] px-4 py-2 hover:bg-gray-300 active:border-t-[#5a5a5a] active:border-l-[#5a5a5a] active:border-r-white active:border-b-white"
              onClick={onReturn}
            >
              Return to Games
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#c0c0c0] overflow-auto">
      {/* Windows 95 Title Bar */}
      <div className="w-full bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/images/games/chess-logo-king.png" alt="Chess" className="w-5 h-5 mr-2" />
          <span className="font-bold">Chess</span>
        </div>
        <button
          onClick={onReturn}
          className="bg-[#c0c0c0] text-black px-2 py-0.5 rounded-sm border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] hover:bg-[#d0d0d0] text-xs"
        >
          X
        </button>
      </div>

      {/* Menu Bar */}
      <div className="w-full bg-[#c0c0c0] border-b border-[#5a5a5a] px-2 py-1 flex space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowStartScreen(true)}
            className="px-2 py-0.5 hover:bg-[#000080] hover:text-white text-sm"
          >
            New Game
          </button>
        </div>
        <div className="relative">
          <button onClick={undoMove} className="px-2 py-0.5 hover:bg-[#000080] hover:text-white text-sm">
            Undo
          </button>
        </div>
        <div className="relative">
          <button onClick={flipBoard} className="px-2 py-0.5 hover:bg-[#000080] hover:text-white text-sm">
            Flip Board
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="px-2 py-0.5 hover:bg-[#000080] hover:text-white text-sm"
          >
            Theme
          </button>
        </div>
        <div className="relative">
          <button onClick={onReturn} className="px-2 py-0.5 hover:bg-[#000080] hover:text-white text-sm">
            Exit
          </button>
        </div>
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
                          `}
                          style={{
                            height: "100%",
                            width: "100%",
                          }}
                          onClick={() => handleCellClick(row, col)}
                        >
                          {piece && getPieceImagePath(piece) && (
                            <div className="w-full h-full flex items-center justify-center">
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
              <div className="text-sm">
                {moveHistory.map((move, index) => {
                  const moveNumber = Math.floor(index / 2) + 1
                  const isWhiteMove = index % 2 === 0
                  const fromCoord = `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}`
                  const toCoord = `${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`
                  const pieceType = move.piece.type.charAt(0).toUpperCase()
                  const captureSymbol = move.captured ? "x" : "-"

                  return (
                    <div key={index} className="mb-1">
                      {isWhiteMove && `${moveNumber}. `}
                      <span className={isWhiteMove ? "text-gray-800" : "text-gray-600"}>
                        {pieceType} {fromCoord}
                        {captureSymbol}
                        {toCoord}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setShowStartScreen(true)}
                className="px-3 py-1 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
              >
                New Game
              </button>
              <button
                onClick={onReturn}
                className="px-3 py-1 bg-[#c0c0c0] border border-white border-r-[#5a5a5a] border-b-[#5a5a5a] text-sm active:border-[#5a5a5a] active:border-r-white active:border-b-white"
              >
                Return to Games
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
