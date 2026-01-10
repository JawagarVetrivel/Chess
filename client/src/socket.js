import { io } from "socket.io-client";

// In production, this URL should probably be an env var
const URL = "http://localhost:3001";

export const socket = io(URL, {
    autoConnect: false
});
