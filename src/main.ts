import express from 'express';
const app = express();
app.set("port", 5000);
import { graphqlHTTP } from "express-graphql";
const cors = require("cors");
import bodyParser = require("body-parser");
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
import SocketAuthentication from './services/authentication/SocketAuthentication';
import { SocketManager } from './services/socket.io/SocketManager';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

server.listen(5000, () => {
    console.log("running on localhost:5000");
});

io.on("connection", (socket: SocketIO.Socket) => {
    SocketManager.addListeners(socket);
});

io.use((socket, next) => {
    SocketAuthentication.resetCookieExpiration(SocketAuthentication.getCookies(socket).authCookie);
    next();
})

let getIO = () => {
    return io;
}

export {getIO}

app.use('/graphql', graphqlHTTP({
    schema: MyQuery,
    graphiql: true
}));

app.post("/login", (req, res) => {
    if (req.body.username === undefined || <string>req.body.password === undefined) {
        res.send({error: "please enter a username and password"});
        return;
    }

    let username = (<string>req.body.username).substr(0, 32);
    let password = (<string>req.body.password).substr(0, 32);

    if (username == null || username.trim().length == 0 || password == null || password.trim().length == 0){
        res.send({error: "please enter a valid username and password"});
        return;
    }
    
    if (req.body.authCookie === undefined) {
        res.send({error: "no cookie found"});
        return;
    }

    let authCookie = req.body.authCookie;
    let socket = SocketManager.sockets[authCookie]
    let didLogin = SocketAuthentication.login(username, password, socket, authCookie);

    if (didLogin) {
        res.send({message: "logged in"});
    } else {
        res.send({error: "please enter a valid username and password"});
    }
})