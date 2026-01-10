import { io } from "socket.io-client";

// In production, this URL should probably be an env var
const URL = "https://chess-server-fqa7.onrender.com";

export const socket = io(URL, {
    autoConnect: false
});
