import { GraphQLArgumentConfig, GraphQLString } from "graphql";
import UserData from "../UserData";
import SocketAuthentication from "./SocketAuthentication";


let AuthenticationPropArgs: {[key: string]: GraphQLArgumentConfig} = {
    authKey: {type: GraphQLString}
}

export {AuthenticationPropArgs};

export interface AuthenticationDataTypes {
    authKey: string
}

export function Authenticate(data: AuthenticationDataTypes) {
    if (Object.keys(SocketAuthentication.authKeys).includes(data.authKey)) {
        SocketAuthentication.resetAuthKeyExpiration(data.authKey);
        
        return true;
    }
    return false;
}

export function HasChatAccess(userData: UserData, chatID: string) {
    return true;

    return userData.availableChats.includes(chatID);
}