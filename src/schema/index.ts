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
    chatName: string,
    imageURL?: string,
    messages: {[id: number]: message},
    messageArray: message[];
}

let chats: {
    [chatID: number]: chat
} = {
    [0]: {
        chatID: 0,
        chatName: "First Chat",
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
        chatName: "Test Chat",
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

const getUserData = (authKey: string) => {
    return SocketAuthentication.authKeys[authKey]?.userData;
}

const createMessage = (text: string, id: number, userID: number): message => {
    return {
        text: text,
        userID: userID,
        id: id
    }
}

const addMessage = (message: message, chatID: number) => {
    chats[chatID].messages[message.id] = message;
    chats[chatID].messageArray.push(message);
}

const createChat = (chatID: number, chatName: string) => {
    let chat: chat = {
        chatID: chatID,
        chatName: chatName,
        messages: {},
        messageArray: []
    };

    return chat;
}

const addChat = (chat: chat) => {
    chats[chat.chatID] = chat;
}

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

                let userData = getUserData(dataArgs.authKey);

                if (!userData.availableChats.includes(parseInt(args.chatID))) {
                    console.log("not authorized to post here");
                    return null;
                }

                if (dataArgs.message.trim().length == 0) {
                    console.log("no message");
                    return null
                }

                let id = numMessages;
                
                let item = createMessage(args.message, id, userData.userID);
                addMessage(item, args.chatID);

                //need to change emits message to everyone even if they don't have access
                getIO()?.emit("New-Message", (id));

                numMessages++;

                return item;
            }
        },

        createChat: {
            type: ChatType,
            args: {
                ...AuthenticationPropArgs,
                chatName: {type: GraphQLString}
            },
            resolve: (root, args) => {
                let dataArgs = <AuthenticationDataTypes & {chatName: string}> args;
                if (!Authenticate(dataArgs)) {
                    return null;
                }

                let userData = getUserData(dataArgs.authKey);

                let chatID = Object.keys(chats).length;

                let chat = createChat(chatID, dataArgs.chatName);

                userData.availableChats.push(chatID);

                addChat(chat);

                return chat;
            }
        }
    })
})

export default new GraphQLSchema({
    query: QueryType,
    mutation: MutationType
})