import { 
    GraphQLID,
    GraphQLList,
    GraphQLObjectType,
    GraphQLString,
} from "graphql";
import { Authenticate, AuthenticationDataTypes, AuthenticationPropArgs } from "../../services/authentication/Authentication";
import MessageType from "./MessageType";

const ChatType: GraphQLObjectType = new GraphQLObjectType({
    name: "Chats",
    description: "A chat is a group of messages and other things",
    
    fields: () => ({
        chatID: {
            type: GraphQLID,
            resolve: (root) => {
                return root.chatID
            }
        },
        imageURL: {
            type: GraphQLString,
            resolve: (root) => {
                return root.imageURL + "";
            }
        },
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
                    return [root.messages[args.id]];
                }

                return root.messageArray;
            },
        },
    })
});

export default ChatType