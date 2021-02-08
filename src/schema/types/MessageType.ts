import { 
    GraphQLID,
    GraphQLList,
    GraphQLObjectType,
    GraphQLString,
} from "graphql";

const MessageType: GraphQLObjectType = new GraphQLObjectType({
    name: "Message",
    description: "A user's message",
    
    fields: () => ({
        text: {type: GraphQLString},
        id: {
            type: GraphQLString,
            resolve: (root) => {
                return root._id;
            }
        },
        userID: {type: GraphQLString}
    })
});

export default MessageType