const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send("Chess Server is Running");
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev, restrict in prod
        methods: ["GET", "POST"]
    }
});

const games = {}; // Store game states: { roomId: fenString }

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`);

        const room = io.sockets.adapter.rooms.get(data);
        const size = room ? room.size : 0;
        console.log(`Room ${data} size: ${size}`);

        // If game exists in this room, load it for the joining player
        if (games[data]) {
            socket.emit('load_game', games[data]);
        }

        if (size === 2) {
            io.to(data).emit('game_start');
            console.log(`Game started in room: ${data}`);
        } else if (size > 2) {
            // Optional: Kick extra users or handle spectators
            console.log(`Room ${data} is full!`);
        }
    });

    socket.on('send_move', (data) => {
        console.log("Move received: ", data);

        // Update stored game state
        if (data.fen) {
            games[data.roomId] = data.fen;
        }

        socket.to(data.roomId).emit('receive_move', data.move);
    });

    socket.on('resign', (data) => {
        socket.to(data.roomId).emit('player_resigned', 'Opponent');
        // Optional: Clean up game state
        delete games[data.roomId];
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
