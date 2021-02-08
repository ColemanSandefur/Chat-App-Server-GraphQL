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
import {AuthenticationPropArgs, AuthenticationDataTypes, Authenticate, HasChatAccess} from "../services/authentication/Authentication"
import {getIO, io} from "../main";
import ChatType from "./types/ChatType";
import SocketAuthentication from "../services/authentication/SocketAuthentication";
import QueryManager from "../services/mongodb/QueryManager";

const getUserData = (authKey: string) => {
    return SocketAuthentication.authKeys[authKey]?.userData;
}

const QueryType = new GraphQLObjectType({
    name: "Query", 
    description: "All queries",

    fields: () => ({
        chat: {
            type: GraphQLList(ChatType),
            args: {
                ...AuthenticationPropArgs,
                chatID: {type: GraphQLString}
            },
            resolve: async (root, args) => {
                let dataArgs = <AuthenticationDataTypes & {chatID: string}> args;
                
                if (!Authenticate(dataArgs)) {
                    console.log("failed to auth");
                    return null;
                }

                let userData = SocketAuthentication.authKeys[dataArgs.authKey].userData;

                if (dataArgs.chatID === undefined) {
                    let promiseArr = userData.availableChats.map((value) => {
                        return QueryManager.getChat({chatID: value});
                    });

                    let data = await Promise.all(promiseArr);

                    return data;
                }

                if (!HasChatAccess(userData, dataArgs.chatID)) {
                    console.log("Don't have access to chat");
                    return null;
                }

                let chat = await QueryManager.getChat({chatID: dataArgs.chatID});

                return [chat];
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
                chatID: {type: GraphQLString}
            },
            resolve: async (root, args) => {
                let dataArgs = <AuthenticationDataTypes & {message: string, chatID: string}> args;

                if (!Authenticate(dataArgs)) {
                    console.log("failed to auth");
                    return null;
                }

                let userData = getUserData(dataArgs.authKey);

                if (!HasChatAccess(userData, dataArgs.chatID)) {
                    console.log("Don't have access to chat");
                    return null;
                }

                if (dataArgs.message.trim().length == 0) {
                    console.log("no message");
                    return null
                }

                let messages = await QueryManager.addMessage({chatID: dataArgs.chatID, text: dataArgs.message, userID: userData.userID});

                SocketAuthentication.getChatRoom(dataArgs.chatID).emit("New-Message", (messages[0]._id));

                return messages[0];
            }
        },

        createChat: {
            type: ChatType,
            args: {
                ...AuthenticationPropArgs,
                chatName: {type: GraphQLString}
            },
            resolve: async (root, _args) => {
                let args = <AuthenticationDataTypes & {chatName: string}> _args;

                if (!Authenticate(args)) {
                    return null;
                }

                let userData = getUserData(args.authKey);

                let chats = await QueryManager.createChat({chatName: args.chatName})

                userData.availableChats.push(chats[0]._id);

                QueryManager.giveChatAccess({userID: userData.userID, chatID: chats[0]._id});

                return chats;
            }
        }
    })
})

export default new GraphQLSchema({
    query: QueryType,
    mutation: MutationType
})