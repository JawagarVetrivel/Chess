import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'

export default function Home() {
    const [username, setUsername] = useState('')
    const [room, setRoom] = useState('')
    const navigate = useNavigate()

    const joinRoom = (e) => {
        e.preventDefault()
        if (username && room) {
            // Send username to server during handshake or just separate event?
            // For now, we will just connect.
            // Save username for persistence
            localStorage.setItem('username', username)
            socket.auth = { username }
            socket.connect()
            navigate(`/game/${room}`)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-8 p-4">
            <div className="text-center space-y-2">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                    Chess Real-Time
                </h1>
                <p className="text-zinc-400">Enter a room ID to play with a friend</p>
            </div>

            <form onSubmit={joinRoom} className="flex flex-col gap-4 w-full max-w-sm bg-zinc-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl border border-zinc-700/50">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-zinc-300">Username</label>
                    <input
                        type="text"
                        placeholder="Grandmaster_1"
                        className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500 transition-all"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-zinc-300">Room ID</label>
                    <input
                        type="text"
                        placeholder="room-123"
                        className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-zinc-500 transition-all"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="mt-4 p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Join Game
                </button>
            </form>
        </div>
    )
}
