import SocketIO from "socket.io";
import { getIO, io } from "../../main";
import QueryManager from "../mongodb/QueryManager";
import UserData from "../UserData";

import CookieManager from "./CookieManager";

export default class SocketAuthentication {

    //Holds all authenticated sockets, every socket that is in authKeys is logged in
    static authKeys: {[cookie: string]: {socket?: SocketIO.Socket, expireCallback: NodeJS.Timeout, isExpired: boolean, userData: UserData}} = {}
    private static afkTimeout = 10 * 60 * 1000; //10 minutes

    static authSocket(socket: SocketIO.Socket) {
        let userCookies = CookieManager.getCookies(socket);
        let authCookie = userCookies.authCookie;

        if (authCookie === undefined || this.authKeys[authCookie] === undefined) {
            authCookie = CookieManager.generateCookie(32);
            this.sendAuthCookie(authCookie, false, socket);
        }

        userCookies.authCookie = authCookie;
        
        if (this.authKeys[authCookie] !== undefined) {
            this.resetAuthKeyExpiration(authCookie);
            this.authKeys[authCookie].userData.availableChats.forEach(chatID => {
                this.addToChatRoom(chatID, socket);
            });
            this.sendAuthCookie(authCookie, true, socket);
        }

        CookieManager.setCookies(socket, CookieManager.cookiesToString(userCookies));

        return authCookie;
    }

    static login(username: string, password: string, socket: SocketIO.Socket, authCookie: string) {
        if (username === "steve" && password === "bob") {
            QueryManager.getUser({userID: "602083dc7ab2b303ca9a669c"}).then((data) => {
                this.addAuthKey(socket, authCookie, new UserData(data));
                this.authKeys[authCookie].userData.availableChats.forEach(chatID => {
                    this.addToChatRoom(chatID, socket);
                });
                this.sendAuthCookie(authCookie, true, socket);
                return true;
            });
        }

        return false;
    }

    private static addAuthKey(socket: SocketIO.Socket, authCookie: string, userData: UserData) {
        this.removeAuthKey(authCookie);

        this.authKeys[authCookie] = {
            socket: socket,
            expireCallback: this.expireCallback(authCookie),
            isExpired: false,
            userData: userData
        };
    }

    public static removeAuthKey(authCookie: string) {
        if (this.authKeys[authCookie] !== undefined) {
            this.sendAuthCookie(authCookie, false, this.authKeys[authCookie].socket);

            this.authKeys[authCookie].isExpired = true;
            clearTimeout(this.authKeys[authCookie].expireCallback);

            delete this.authKeys[authCookie];
        }
    }

    private static expireCallback(authCookie: string) {
        return setTimeout(() => {
            this.removeAuthKey(authCookie);
        }, this.afkTimeout);
    }

    public static resetAuthKeyExpiration(authCookie: string) {
        if (this.authKeys[authCookie] !== undefined && this.authKeys[authCookie].isExpired === false) {
            clearTimeout(this.authKeys[authCookie]?.expireCallback);

            this.authKeys[authCookie].expireCallback = this.expireCallback(authCookie);
        }
    }

    private static sendAuthCookie(authCookie: string, loggedIn: boolean, socket?: SocketIO.Socket) {

        if (loggedIn) {
            socket?.emit("Send-Auth-Cookie", authCookie, true, {
                userID: this.authKeys[authCookie].userData.userID
            });
        } else {
            socket?.emit("Send-Auth-Cookie", authCookie, false);
        }
    }

    public static addToChatRoom(chatID: string, socket?: SocketIO.Socket) {
        socket?.join(`chat-${chatID}`);
    }

    public static getChatRoom(chatID: string) {
        return io.to(`chat-${chatID}`);
    }
}