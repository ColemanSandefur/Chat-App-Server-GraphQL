import express from 'express';
const app = express();
app.set("port", 5000);
import { graphqlHTTP } from "express-graphql";
const cors = require("cors");
import http = require("http");
const server = http.createServer(app);
import SocketIO from "socket.io"

const io: SocketIO.Server = new SocketIO.Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

import MyQuery from "./schema"
import { SocketManager } from './services/socket.io/SocketManager';

app.use(cors());

server.listen(5000, () => {
    console.log("running on localhost:5000");
});

io.on("connection", (socket: SocketIO.Socket) => {
    SocketManager.addListeners(socket);
});

let getIO = () => {
    return io;
}

export {getIO}

app.use('/graphql', graphqlHTTP({
    schema: MyQuery,
    graphiql: true
}));

app.post('/setCookies', (req, res) => {
    console.log("set cookies");
    res.cookie("testAuth", "whatIsUp");
    res.send("");
})