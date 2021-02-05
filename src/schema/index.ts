import { 
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLID,
    GraphQLList,
    GraphQLString,
    GraphQLScalarType,
    GraphQLArgumentConfig
} from "graphql";

import MessageType from "./types/MessageType";
import {AuthenticationPropArgs, AuthenticationDataTypes, Authenticate} from "../services/authentication/Authentication"
import {getIO} from "../main";
import ChatType from "./types/ChatType";
import SocketAuthentication from "../services/authentication/SocketAuthentication";

interface message {
    text: string, 
    id: number,
    userID: number
}

interface chat {
    chatID: number,
    imageURL?: string,
    messages: {[id: number]: message},
    messageArray: message[];
}

let chats: {
    [chatID: number]: chat
} = {
    [0]: {
        chatID: 0,
        imageURL: "http://localhost:5000/images/3e273ca3b0f177232784b5c1a998feb620633dd9_full.jpg",
        messages: {
            [0]: {text: "Sup", id: 0, userID: 0},
            [1]: {text: "How are you", id: 1, userID: 1}
        },
        messageArray: [
            {text: "Sup", id: 0, userID: 0},
            {text: "How are you", id: 1, userID: 1}
        ]
    },
    [1]: {
        chatID: 1,
        messages: {
            [0]: {text: "Welcome to chat 1", id: 2, userID: 1}
        },
        messageArray: [
            {text: "Welcome to chat 1", id: 2, userID: 1}
        ]
    }
}

let mapToArray = <T>(data: {[key: number]: T}) => {
    return Object.keys(data).map((chatID: unknown) => {
        return data[<number>chatID];
    })
}

let numMessages = 3;

export {chats, numMessages};

const QueryType = new GraphQLObjectType({
    name: "Query", 
    description: "All queries",

    fields: () => ({
        chat: {
            type: GraphQLList(ChatType),
            args: {
                ...AuthenticationPropArgs,
                chatID: {type: GraphQLID}
            },
            resolve: (root, args) => {
                let dataArgs = <AuthenticationDataTypes & {chatID: number}> args;
                
                if (!Authenticate(dataArgs)) {
                    console.log("failed to auth");
                    return null;
                }

                let userData = SocketAuthentication.authKeys[dataArgs.authKey].userData;

                if (dataArgs.chatID === undefined) {
                    let data = userData.availableChats.map((value) => {
                        return chats[value];
                    });

                    return data;
                }

                let chatID = parseInt(dataArgs.chatID + "");
                let arr = userData.availableChats;

                if (!(arr.includes(chatID + 0))) {
                    console.log("Don't have access to chat");
                    return null;
                }
                
                return [chats[args.chatID]]
            }
        }
    }),
});

const MutationType = new GraphQLObjectType({
    name: "Mutation",
    description: "...",

    fields: () => ({
        addMessage: {
            type: MessageType,
            args: {
                ...AuthenticationPropArgs,
                message: {type: GraphQLString},
                chatID: {type: GraphQLID}
            },
            resolve: (root, args) => {
                let dataArgs = <AuthenticationDataTypes & {message: string, chatID: number}> args;

                if (!Authenticate(dataArgs)) {
                    console.log("failed to auth");
                    return null;
                }

                let userData = SocketAuthentication.authKeys[dataArgs.authKey].userData

                if (!userData.availableChats.includes(parseInt(args.chatID))) {
                    console.log("not authorized to post here");
                    return null;
                }

                if (dataArgs.message.trim().length == 0) {
                    console.log("no message");
                    return null
                }

                let id = numMessages;
                
                let item = {text: args.message, id: id, userID: 0};
                chats[args.chatID].messages[id] = item;
                chats[args.chatID].messageArray.push(item);

                getIO()?.emit("New-Message", (id));

                numMessages++;

                return item;
            }
        }
    })
})

export default new GraphQLSchema({
    query: QueryType,
    mutation: MutationType
})