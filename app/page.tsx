"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Users,
  Sparkles,
  GamepadIcon,
  Share2,
  Wand2,
  Zap,
  Monitor,
  Wifi,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { generateRandomTheme } from "@/lib/gemini"
import { QUICK_THEMES, hasPrebuiltBoard } from "@/lib/prebuilt-boards"
import ClientWrapper from "@/components/client-wrapper"

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

function HomePageContent() {
  const [playerName, setPlayerName] = useState("")
  const [gameTheme, setGameTheme] = useState("")
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false)
  const router = useRouter()

  const generateRandomThemeHandler = async () => {
    setIsGeneratingTheme(true)
    try {
      const theme = await generateRandomTheme()
      setGameTheme(theme)
    } catch (error) {
      console.error("Failed to generate theme:", error)
      const fallbackThemes = [
        "Jungle Safari Adventure",
        "Ghost Town Road Trip",
        "Space Station Mystery",
        "Medieval Castle Quest",
        "Underwater Treasure Hunt",
      ]
      setGameTheme(fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)])
    }
    setIsGeneratingTheme(false)
  }

  const createGame = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name!")
      return
    }
    if (!gameTheme.trim()) {
      alert("Please select or generate a theme!")
      return
    }

    const gameData = {
      playerName: playerName.trim(),
      theme: gameTheme.trim(),
      isHost: true,
    }

    localStorage.setItem("storyforge-player", JSON.stringify(gameData))
    router.push("/game/lobby")
  }

  const joinGame = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name!")
      return
    }

    const gameData = {
      playerName: playerName.trim(),
      isHost: false,
    }

    localStorage.setItem("storyforge-player", JSON.stringify(gameData))
    router.push("/game/join")
  }

  const createLocalGame = () => {
    router.push("/local")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GamepadIcon className="w-12 h-12 text-yellow-400" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              StoryForge
            </h1>
          </div>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            The AI-powered board game where every story is unique. Play with friends online or locally on the same
            device!
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Wand2 className="w-3 h-3 mr-1" />
              AI-Powered Stories
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Users className="w-3 h-3 mr-1" />
              Multiplayer
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Dynamic Boards
            </Badge>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {/* Online Multiplayer */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wifi className="w-5 h-5" />
                Online Multiplayer
              </CardTitle>
              <CardDescription className="text-blue-200">
                Play with friends anywhere in the world with real-time synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Real-time sync</Badge>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Up to 4 players</Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Cross-device</Badge>
              </div>
              <p className="text-sm text-blue-200">
                Create a room and share the code with friends. Everyone plays on their own device with live updates.
              </p>
            </CardContent>
          </Card>

          {/* Local Multiplayer */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Monitor className="w-5 h-5" />
                Local Multiplayer
              </CardTitle>
              <CardDescription className="text-blue-200">
                Play on the same device - perfect for family game nights and gatherings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Same device</Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">No internet needed</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Instant start</Badge>
              </div>
              <p className="text-sm text-blue-200">
                Pass the device between players for each turn. Great for parties, family time, or when internet is
                spotty.
              </p>
              <Button
                onClick={createLocalGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Start Local Game
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Online Game Setup */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-6">Online Game Setup</h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Player Setup */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5" />
                  Player Setup
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Enter your name to begin your StoryForge adventure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-200">Your Name</label>
                  <Input
                    placeholder="Enter your name..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-blue-300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5" />
                  Game Theme
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Choose a pre-built adventure or let AI create something new
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-200">Theme</label>
                  <Input
                    placeholder="e.g., Playing with cousins, Office team building..."
                    value={gameTheme}
                    onChange={(e) => setGameTheme(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-blue-300"
                  />
                </div>

                <Button
                  onClick={generateRandomThemeHandler}
                  disabled={isGeneratingTheme}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {isGeneratingTheme ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      AI is thinking...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />🎲 Generate AI Theme!
                    </>
                  )}
                </Button>

                <div className="space-y-2">
                  <p className="text-sm text-blue-200 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Instant Play Themes:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_THEMES.slice(0, 3).map((theme, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 transition-colors p-2 text-center justify-center"
                        onClick={() => setGameTheme(theme)}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {theme}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-green-300 text-center">
                    ⚡ These themes start instantly - no AI generation delay!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Online Game Actions */}
          <div className="max-w-2xl mx-auto space-y-4">
            <Button
              onClick={createGame}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-6"
            >
              <Wifi className="w-6 h-6 mr-3" />
              Create Online Game
              {gameTheme && hasPrebuiltBoard(gameTheme) && (
                <Badge className="ml-2 bg-blue-600/20 text-blue-300 border-blue-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Instant
                </Badge>
              )}
            </Button>

            <div className="text-center">
              <span className="text-blue-300">or</span>
            </div>

            <Button
              onClick={joinGame}
              size="lg"
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 text-lg py-6"
            >
              <Share2 className="w-6 h-6 mr-3" />
              Join Existing Game
            </Button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="max-w-6xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Instant Play</h3>
              <p className="text-blue-200 text-sm">
                5 pre-built game boards ready to play immediately - no waiting for AI generation!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6 text-center">
              <Monitor className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Local & Online</h3>
              <p className="text-blue-200 text-sm">
                Play online with friends worldwide or locally on the same device for family game nights
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6 text-center">
              <Wand2 className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Stories</h3>
              <p className="text-blue-200 text-sm">
                Every game generates unique narratives and board layouts based on your theme and choices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-white mb-8">How StoryForge Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-white mb-2">Choose Mode</h3>
              <p className="text-sm text-blue-200">Pick online multiplayer or local same-device play</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-white mb-2">Set Theme</h3>
              <p className="text-sm text-blue-200">Choose an instant theme or let AI generate something unique</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-white mb-2">Play & Choose</h3>
              <p className="text-sm text-blue-200">Make decisions, complete challenges, and earn karma points</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-white mb-2">Get Your Story</h3>
              <p className="text-sm text-blue-200">Receive a personalized narrative based on your journey</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <ClientWrapper>
      <HomePageContent />
    </ClientWrapper>
  )
}
