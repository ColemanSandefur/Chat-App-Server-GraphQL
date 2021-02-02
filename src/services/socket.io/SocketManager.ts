import * as SocketIO from "socket.io";
import SocketAuthentication from "../authentication/SocketAuthentication";

export class SocketManager {
    static sockets: {[key: string]: SocketIO.Socket} = {}

    static addListeners(socket: SocketIO.Socket) {
        this.sockets[socket.id] = socket;
        console.log(`client ${socket.id} connected; there are ${Object.keys(this.sockets).length} clients`);

        socket.on("disconnect", (reason) => {
            console.log(`socket ${socket.id} disconnected: ${reason}`);

            delete this.sockets[socket.id];
        });

        //will make sure that the socket has a key (cookie)
        SocketAuthentication.authSocket(socket);
    }
}