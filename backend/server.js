import express  from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";


import connectToMongoDB from "./db/connectToMongoDB.js";
import { server } from "./socket/socket.js";
// import { server } from "./socket/socket.js";
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

const app = express();
dotenv.config();
app.use(express.json());    // to purse incoming requests with JSON payloads {from req.body}
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
// app.get("/", (req, res) => {
//     //root route http://localhost:5000
//     res.send("hello world...!!")
// });

app.use(express.static(path.join(__dirname, "/frontend/Sjx_chat/dist")));

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "frontend", "Sjx_chat", "dist", "index.html"));
});


server.listen(PORT,() => {
    connectToMongoDB();
    console.log(`server running on port ${PORT}`)
});
