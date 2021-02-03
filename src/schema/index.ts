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

let messages: {
    text: string, 
    id: number,
    userID: number
}[] = [
    {text: "Sup", id: 0, userID: 0},
    {text: "How are you", id: 1, userID: 1}
];

const QueryType = new GraphQLObjectType({
    name: "Query", 
    description: "...",

    fields: () => ({
        message: {
            type: GraphQLList(MessageType),
            args: {
                ...AuthenticationPropArgs,
                id: {type: GraphQLID}
            },
            resolve: (root, args) => {
                if (!Authenticate(<AuthenticationDataTypes>args)) {
                    return null;
                }

                if (args.id != null) {
                    return [messages[args.id]];
                }

                return messages
            },
        },

        
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
                message: {type: GraphQLString}
            },
            resolve: (root, args) => {
                let dataArgs = <AuthenticationDataTypes & {message: string}> args;

                if (!Authenticate(dataArgs)) {
                    return null;
                }

                if (dataArgs.message.trim().length == 0) {
                    return null
                }

                let id = messages.length;
                
                let item = {text: args.message, id: id, userID: 0};
                messages.push(item);

                getIO()?.emit("New-Message", (id));

                return item;
            }
        }
    })
})

export default new GraphQLSchema({
    query: QueryType,
    mutation: MutationType
})