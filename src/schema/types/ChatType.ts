import { 
    GraphQLID,
    GraphQLList,
    GraphQLObjectType,
    GraphQLString,
} from "graphql";
import QueryManager from "../../services/mongodb/QueryManager";
import { Authenticate, AuthenticationDataTypes, AuthenticationPropArgs } from "../../services/authentication/Authentication";
import MessageType from "./MessageType";

const ChatType: GraphQLObjectType = new GraphQLObjectType({
    name: "Chats",
    description: "A chat is a group of messages and other things",
    
    fields: () => ({
        chatID: {
            type: GraphQLString,
            resolve: (root) => {
                return root._id;
            }
        },
        imageURL: {
            type: GraphQLString,
            resolve: (root) => {
                return root.imageURL + "";
            }
        },
        chatName: {
            type: GraphQLString
        },
        message: {
            type: GraphQLList(MessageType),
            args: {
                ...AuthenticationPropArgs,
                id: {type: GraphQLString}
            },
            resolve: async (root, args) => {
                // if (!Authenticate(<AuthenticationDataTypes>args)) {
                //     return null;
                // }

                if (args.id != null) {
                    let messages = await QueryManager.getMessage({id: args.id, chatID: root._id});

                    return messages;
                }

                let messages = await QueryManager.getMessage({chatID: root._id});

                return messages;
            },
        },
    })
});

export default ChatType