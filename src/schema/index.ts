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

interface message {
    text: string, 
    id: number,
    userID: number
}

interface chat {
    chatID: number,
    messages: {[id: number]: message},
    messageArray: message[];
}

let chats: {
    [chatID: number]: chat
} = {
    [0]: {
        chatID: 0,
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

                if (dataArgs.chatID === undefined) {
                    return mapToArray(chats);
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
                let dataArgs = <AuthenticationDataTypes & {message: string}> args;

                if (!Authenticate(dataArgs)) {
                    console.log("failed to auth");
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