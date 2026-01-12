import { io } from "socket.io-client";

// In production, this URL should probably be an env var
const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
console.log("Connecting to socket at:", URL);

export const socket = io(URL, {
    autoConnect: false,
});

socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err);
});
