"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  GameManagerLocal,
  type GameState,
  type Player,
  type ChatMessage,
  generateGameId,
  generatePlayerId,
  getPlayerColors,
  getPlayerAvatars,
} from "@/lib/game-logic-local"
import { generateGameBoard, generatePlayerStory } from "@/lib/gemini"

export function useGameLocal() {
  const [gameManager, setGameManager] = useState<GameManagerLocal | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const gameManagerRef = useRef<GameManagerLocal | null>(null)
  const gameIdRef = useRef<string>("")
  const playerIdRef = useRef<string>("")
  const isInitializedRef = useRef(false)

  // Initialize game manager
  const initializeGame = useCallback((gameId?: string, playerId?: string) => {
    try {
      // If we already have a game manager with the same IDs, just return it
      if (
        gameManagerRef.current &&
        gameIdRef.current === (gameId || gameIdRef.current) &&
        playerIdRef.current === (playerId || playerIdRef.current)
      ) {
        console.log("Game manager already initialized with same IDs")
        return { gameId: gameIdRef.current, playerId: playerIdRef.current }
      }

      // Clean up existing manager if we're reinitializing with different IDs
      if (gameManagerRef.current) {
        console.log("Cleaning up existing game manager before reinitializing")
        gameManagerRef.current.cleanup()
      }

      const finalGameId = gameId || generateGameId()
      const finalPlayerId = playerId || generatePlayerId()

      console.log("Initializing local game:", { finalGameId, finalPlayerId })

      gameIdRef.current = finalGameId
      playerIdRef.current = finalPlayerId

      const manager = new GameManagerLocal(finalGameId)
      setGameManager(manager)
      gameManagerRef.current = manager
      isInitializedRef.current = true

      // Set up listeners
      manager.onGameStateChange((newGameState) => {
        console.log("Game state changed:", newGameState?.id)
        setGameState(newGameState)

        // Find current player
        if (newGameState?.players && playerIdRef.current) {
          const player = newGameState.players[playerIdRef.current]
          if (player) {
            setCurrentPlayer(player)
          }
        }
      })

      manager.onChatMessages((newMessages) => {
        console.log("Chat messages updated:", newMessages.length)
        setChatMessages(newMessages)
      })

      return { gameId: finalGameId, playerId: finalPlayerId }
    } catch (err) {
      console.error("Error initializing game:", err)
      setError("Failed to initialize game manager")
      return { gameId: "", playerId: "" }
    }
  }, [])

  // Create new game
  const createGame = useCallback(
    async (playerName: string, theme: string) => {
      setLoading(true)
      setError(null)

      try {
        console.log("Creating local game with theme:", theme, "for player:", playerName)

        // Ensure we have a game manager
        if (!gameManagerRef.current) {
          console.log("No game manager available, initializing first...")
          initializeGame()
        }

        if (!gameManagerRef.current) {
          throw new Error("Failed to initialize game manager")
        }

        // Generate game board
        const board = await generateGameBoard(theme, 4)
        console.log("Generated board with", board.tiles.length, "tiles")

        // Get random avatar and color
        const colors = getPlayerColors()
        const avatars = getPlayerAvatars()

        // Create host player
        const hostPlayer: Player = {
          id: playerIdRef.current,
          name: playerName,
          avatar: avatars[Math.floor(Math.random() * avatars.length)],
          karma: 0,
          position: 0,
          isHost: true,
          isReady: true,
          actions: [],
          color: colors[Math.floor(Math.random() * colors.length)],
        }

        console.log("Created host player:", hostPlayer)
        setCurrentPlayer(hostPlayer)

        // Create game
        const gameId = await gameManagerRef.current.createGame(hostPlayer, theme, board)
        console.log("Local game created with ID:", gameId)

        // Store game data in localStorage for persistence
        const gameData = {
          gameId,
          playerId: playerIdRef.current,
          playerName,
          theme,
          isHost: true,
          gameMode: "local",
        }
        localStorage.setItem("storyforge-local-game", JSON.stringify(gameData))

        return gameId
      } catch (err) {
        console.error("Error creating game:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to create game"
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [initializeGame],
  )

  // Load existing game from localStorage
  const loadGame = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const gameDataStr = localStorage.getItem("storyforge-local-game")
      if (!gameDataStr) {
        console.log("No local game data found")
        setError("No local game data found")
        setLoading(false)
        return false
      }

      const gameData = JSON.parse(gameDataStr)
      console.log("Loading local game:", gameData)

      if (!gameData.gameId) {
        setError("Invalid game data: missing game ID")
        setLoading(false)
        return false
      }

      // Initialize with stored IDs
      const { gameId, playerId } = initializeGame(gameData.gameId, gameData.playerId)

      if (!gameId) {
        setError("Failed to initialize game with stored IDs")
        setLoading(false)
        return false
      }

      // If we have a game manager but no game state yet, try to load from localStorage
      const savedGameState = localStorage.getItem("storyforge-local-game-state")
      if (savedGameState && gameManagerRef.current) {
        try {
          const parsedState = JSON.parse(savedGameState)
          gameManagerRef.current.loadGameState(parsedState)
          console.log("Loaded game state from localStorage")
        } catch (e) {
          console.error("Failed to load game state from localStorage:", e)
        }
      }

      setLoading(false)
      return true
    } catch (error) {
      console.error("Error loading local game:", error)
      setError("Failed to load game: " + (error instanceof Error ? error.message : String(error)))
      setLoading(false)
      return false
    }
  }, [initializeGame])

  // Add player to existing game
  const addPlayer = useCallback(async (playerName: string) => {
    if (!gameManagerRef.current) {
      console.error("No game manager available for adding player")
      return false
    }

    const colors = getPlayerColors()
    const avatars = getPlayerAvatars()

    // Get used colors and avatars
    const gameState = gameManagerRef.current.getGameState()
    const usedColors = gameState ? Object.values(gameState.players).map((p) => p.color) : []
    const usedAvatars = gameState ? Object.values(gameState.players).map((p) => p.avatar) : []

    // Find available color and avatar
    const availableColors = colors.filter((color) => !usedColors.includes(color))
    const availableAvatars = avatars.filter((avatar) => !usedAvatars.includes(avatar))

    const player: Player = {
      id: generatePlayerId(),
      name: playerName,
      avatar: availableAvatars[0] || avatars[Math.floor(Math.random() * avatars.length)],
      karma: 0,
      position: 0,
      isHost: false,
      isReady: true,
      actions: [],
      color: availableColors[0] || colors[Math.floor(Math.random() * colors.length)],
    }

    console.log("Adding player:", player)
    const result = await gameManagerRef.current.addPlayer(player)

    // Save updated game state to localStorage
    if (result && gameManagerRef.current) {
      const currentState = gameManagerRef.current.getGameState()
      if (currentState) {
        localStorage.setItem("storyforge-local-game-state", JSON.stringify(currentState))
      }
    }

    return result
  }, [])

  // Game actions
  const startGame = useCallback(async () => {
    if (!gameManagerRef.current) return false
    console.log("Starting local game...")
    const result = await gameManagerRef.current.startGame()

    // Update localStorage to indicate game has started
    if (result) {
      const gameDataStr = localStorage.getItem("storyforge-local-game")
      if (gameDataStr) {
        const gameData = JSON.parse(gameDataStr)
        gameData.gamePhase = "playing"
        localStorage.setItem("storyforge-local-game", JSON.stringify(gameData))
      }

      // Save full game state
      const currentState = gameManagerRef.current.getGameState()
      if (currentState) {
        localStorage.setItem("storyforge-local-game-state", JSON.stringify(currentState))
      }
    }

    return result
  }, [])

  const rollDice = useCallback(async () => {
    if (!gameManagerRef.current) return 0
    console.log("Rolling dice...")
    const result = await gameManagerRef.current.rollDice()

    // Save updated game state
    const currentState = gameManagerRef.current.getGameState()
    if (currentState) {
      localStorage.setItem("storyforge-local-game-state", JSON.stringify(currentState))
    }

    return result
  }, [])

  const movePlayer = useCallback(async (playerId: string, steps: number) => {
    if (!gameManagerRef.current) return null
    console.log("Moving player:", playerId, "steps:", steps)
    const result = await gameManagerRef.current.movePlayer(playerId, steps)

    // Save updated game state
    const currentState = gameManagerRef.current.getGameState()
    if (currentState) {
      localStorage.setItem("storyforge-local-game-state", JSON.stringify(currentState))
    }

    return result
  }, [])

  const resolveEvent = useCallback(async (playerId: string, success: boolean, choice?: string) => {
    if (!gameManagerRef.current) return
    console.log("Resolving event for player:", playerId, "success:", success, "choice:", choice)
    await gameManagerRef.current.resolveEvent(playerId, success, choice)

    // Save updated game state
    const currentState = gameManagerRef.current.getGameState()
    if (currentState) {
      localStorage.setItem("storyforge-local-game-state", JSON.stringify(currentState))
    }
  }, [])

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!gameManagerRef.current || !currentPlayer) return
      console.log("Sending chat message:", message)
      await gameManagerRef.current.sendChatMessage(currentPlayer.id, currentPlayer.name, message)
    },
    [currentPlayer],
  )

  const endGame = useCallback(async () => {
    if (!gameManagerRef.current) return
    console.log("Ending game...")
    await gameManagerRef.current.endGame()

    // Save final game state for story page
    const finalState = gameManagerRef.current.getGameState()
    if (finalState) {
      localStorage.setItem("storyforge-final-game", JSON.stringify(finalState))
    }
  }, [])

  // Generate stories for all players
  const generateStories = useCallback(async () => {
    if (!gameState) {
      console.log("No game state available for story generation")
      return {}
    }

    console.log("Generating stories for", Object.keys(gameState.players).length, "players")

    const stories: { [playerId: string]: string } = {}
    const players = Object.values(gameState.players)

    // Determine winner
    const sortedPlayers = players.sort((a, b) => b.karma - a.karma)
    const winner = sortedPlayers[0]

    // Generate story for each player
    for (const player of players) {
      try {
        console.log("Generating story for:", player.name)
        const story = await generatePlayerStory(
          player.name,
          gameState.theme,
          player.karma,
          player.actions,
          player.position,
          player.id === winner.id,
        )
        stories[player.id] = story
        console.log("Generated story for:", player.name)
      } catch (error) {
        console.error(`Error generating story for ${player.name}:`, error)
        // Fallback story
        stories[player.id] =
          `${player.name} embarked on an incredible journey through "${gameState.theme}". With ${player.karma} karma points, they showed their true character through every choice and challenge.`
      }
    }

    return stories
  }, [gameState])

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("Cleaning up local game manager...")
    if (gameManagerRef.current) {
      gameManagerRef.current.cleanup()
    }
    gameManagerRef.current = null
    setGameManager(null)
    setGameState(null)
    setChatMessages([])
    setCurrentPlayer(null)
    setLoading(false)
    setError(null)
    isInitializedRef.current = false
  }, [])

  // Auto-initialize if we have stored game data
  useEffect(() => {
    if (!isInitializedRef.current) {
      const gameDataStr = localStorage.getItem("storyforge-local-game")
      if (gameDataStr) {
        console.log("Auto-loading local game from storage")
        loadGame().then(() => {
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }
  }, [loadGame])

  return {
    gameManager,
    gameState,
    chatMessages,
    currentPlayer,
    loading,
    error,
    isConnected: true, // Always connected in local mode
    initializeGame,
    createGame,
    loadGame,
    addPlayer,
    startGame,
    rollDice,
    movePlayer,
    resolveEvent,
    sendChatMessage,
    endGame,
    generateStories,
    cleanup,
  }
}
