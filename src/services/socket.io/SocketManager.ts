import * as SocketIO from "socket.io";
import SocketAuthentication from "../authentication/SocketAuthentication";

export class SocketManager {
    //Holds all connected sockets by their authCookie (not all are actually logged in)
    static sockets: {[key: string]: SocketIO.Socket} = {}

    static addListeners(socket: SocketIO.Socket) {

        //will make sure that the socket has a key (cookie)
        const authCookie = SocketAuthentication.authSocket(socket);

        this.sockets[authCookie] = socket;

        socket.on("disconnect", (reason) => {
            delete this.sockets[authCookie];
        });
    }
}