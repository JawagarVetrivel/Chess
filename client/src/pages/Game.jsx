import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { socket } from '../socket'

export default function Game() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [game, setGame] = useState(new Chess())
    const [whiteTime, setWhiteTime] = useState(600) // 10 minutes default
    const [blackTime, setBlackTime] = useState(600)
    const [orientation, setOrientation] = useState('white') // Dynamic later?
    const [hasGameStarted, setHasGameStarted] = useState(false)
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

    // Theme Logic
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    // Timer Logic
    useEffect(() => {
        if (game.isGameOver() || !hasGameStarted) return;

        const timer = setInterval(() => {
            if (game.turn() === 'w') {
                setWhiteTime(t => Math.max(0, t - 1))
            } else {
                setBlackTime(t => Math.max(0, t - 1))
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [game, hasGameStarted])

    useEffect(() => {
        if (!socket.connected) socket.connect()
        socket.emit('join_room', roomId)

        socket.on('receive_move', (move) => {
            setGame((g) => {
                const copy = new Chess(g.fen())
                try {
                    copy.move(move)
                } catch (e) {
                    console.error("Invalid move received", e)
                }
                return copy
            })
        })

        socket.on('player_resigned', (color) => {
            alert(`${color} resigned!`)
            // Ideally stop game or show modal
        })

        socket.on('game_start', () => {
            setHasGameStarted(true)
        })

        return () => {
            socket.off('receive_move')
            socket.off('player_resigned')
            socket.off('game_start')
        }
    }, [roomId])

    function onDrop(sourceSquare, targetSquare) {
        try {
            const move = {
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            }

            const gameCopy = new Chess(game.fen())
            const result = gameCopy.move(move)

            if (result === null) return false

            setGame(gameCopy)
            socket.emit('send_move', { roomId, move })
            return true
        } catch (error) {
            return false
        }
    }

    const handleResign = () => {
        socket.emit('resign', { roomId })
        navigate('/')
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white p-4 font-sans transition-colors duration-300">

            {/* Theme Toggle & Room Info */}
            <div className="absolute top-4 right-4 flex gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-white dark:bg-zinc-800 shadow border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition"
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">

                {/* Player 1 (Black for now if view is white) */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 flex flex-col items-center gap-4 w-full h-full justify-center transition-colors duration-300">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-2xl font-bold">♟️</div>
                    <div className="text-xl font-bold text-gray-700 dark:text-zinc-300">Opponent</div>
                    <div className={`text-4xl font-mono p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 border-2 transition-colors ${game.turn() === 'b' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500'}`}>
                        {formatTime(blackTime)}
                    </div>
                </div>

                {/* Board */}
                <div className="flex flex-col items-center gap-4">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl text-gray-600 dark:text-zinc-400">Room: <span className="font-mono text-emerald-600 dark:text-emerald-400">{roomId}</span></h2>
                        <div className="h-6 flex items-center justify-center gap-2">
                            {game.isCheck() && <span className="text-red-500 font-bold animate-pulse">CHECK!</span>}
                            {game.isGameOver() && <span className="text-emerald-600 dark:text-emerald-400 font-bold">GAME OVER</span>}
                        </div>
                    </div>

                    <div className="w-[80vw] max-w-[500px] aspect-square bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-700 transition-colors duration-300">
                        <Chessboard
                            position={game.fen()}
                            onPieceDrop={onDrop}
                            boardOrientation={orientation}
                            customDarkSquareStyle={{ backgroundColor: theme === 'dark' ? '#059669' : '#059669' }}
                            customLightSquareStyle={{ backgroundColor: theme === 'dark' ? '#d1fae5' : '#f0fdf4' }}
                            customPieces={{
                                // Can add custom pieces here if requested, sticking to default for now
                            }}
                        />
                    </div>
                </div>

                {/* Player 2 (You/White) */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 flex flex-col items-center gap-4 w-full h-full justify-center transition-colors duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white">♙</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">You</div>
                    <div className={`text-4xl font-mono p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 border-2 transition-colors ${game.turn() === 'w' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500'}`}>
                        {formatTime(whiteTime)}
                    </div>

                    <button
                        onClick={handleResign}
                        className="mt-4 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-bold transition-all w-full"
                    >
                        Resign
                    </button>
                </div>

            </div>
        </div>
    )
}
