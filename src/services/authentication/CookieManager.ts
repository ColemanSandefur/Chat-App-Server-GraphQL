import SocketIO from "socket.io";
import cookieParser = require("cookie");

export default class CookieManager {
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