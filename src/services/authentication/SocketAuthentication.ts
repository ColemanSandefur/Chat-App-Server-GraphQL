import SocketIO, { Socket } from "socket.io";
import cookieParser = require("cookie");

export default class SocketAuthentication {
    static authKeys: {[cookie: string]: {socket: SocketIO.Socket, expireCallback: NodeJS.Timeout, isExpired: boolean}} = {}

    static authSocket(socket: SocketIO.Socket) {
        let userCookies = this.getCookies(socket);
        let authCookie = userCookies.authCookie;

        if (authCookie === undefined || this.authKeys[authCookie] === undefined) {
            authCookie = this.generateCookie(32);
            socket.emit("Send-Auth-Cookie", authCookie);
        }
        
        userCookies.authCookie = authCookie;
        
        this.setCookies(socket, this.cookiesToString(userCookies));
        this.addCookie(socket, authCookie);

        console.log(this.getCookies(socket));

        socket.on("*", () => {
            this.resetCookieExpiration(this.getCookies(socket).authCookie);
            console.log("updated cookie");
        })
    }

    private static addCookie(socket: SocketIO.Socket, authCookie: string) {
        this.removeCookie(authCookie);

        this.authKeys[authCookie] = {
            socket: socket,
            expireCallback: this.expireCallback(authCookie),
            isExpired: false
        };
    }

    private static removeCookie(authCookie: string) {
        if (this.authKeys[authCookie] !== undefined) {
            this.authKeys[authCookie].socket.emit("Send-Auth-Cookie", "");
            this.authKeys[authCookie].isExpired = true;
            clearTimeout(this.authKeys[authCookie].expireCallback);

            delete this.authKeys[authCookie];
        }
    }

    private static expireCallback(authCookie: string) {
        return setTimeout(() => {
            this.removeCookie(authCookie);
        }, 10000)
    }

    public static resetCookieExpiration(authCookie: string) {
        if (this.authKeys[authCookie] !== undefined && this.authKeys[authCookie].isExpired === false) {
            clearTimeout(this.authKeys[authCookie]?.expireCallback);

            this.authKeys[authCookie].expireCallback = this.expireCallback(authCookie);
        }
    }

    static getCookies(socket: SocketIO.Socket) {
        return cookieParser.parse(socket.request.headers.cookie + "");
    }

    static cookiesToString(data: {[key: string]: string}) {
        let output = "";
        Object.keys(data).forEach(key => {
            output += `${key}=${data[key]}; `;
        });
        output = output.substr(0, output.length - 2);
        return output;
    }

    static setCookies(socket: SocketIO.Socket, data: string) {
        socket.request.headers.cookie = data;
    }

    static generateCookie(length: number) {
        let data = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_/";
        let cookie = "";

        for (let i = 0; i < length; i++) {
            cookie += data.charAt(Math.random() * data.length);
        }

        return cookie;
    }
}