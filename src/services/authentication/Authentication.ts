import { GraphQLArgumentConfig, GraphQLString } from "graphql";
import SocketAuthentication from "./SocketAuthentication";


let AuthenticationPropArgs: {[key: string]: GraphQLArgumentConfig} = {
    authKey: {type: GraphQLString}
}

export {AuthenticationPropArgs};

export interface AuthenticationDataTypes {
    authKey: string
}

export function Authenticate(data: AuthenticationDataTypes) {
    return Object.keys(SocketAuthentication.authKeys).includes(data.authKey);
}