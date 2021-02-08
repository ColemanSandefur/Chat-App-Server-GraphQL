import { ObjectID } from "mongodb";
import MongoDBConnector from "./MongoDBConnector";
import ChatType from "./types/ChatType";
import MessageType from "./types/MessageType";
import UserType from "./types/UserType";


export default class QueryManager {
    private static toObjectID(id?: string) {
        return (id !== undefined)? new ObjectID(id) : undefined
    }

    public static async getMessage(data: {id?: string, chatID?: string, userID?: string}) {
        let messages = MongoDBConnector.database?.collection("messages");

        let query: {
            _id?: ObjectID,
            chatID?: ObjectID,
            userID?: ObjectID
        }= {
        };

        if (data.id !== undefined) {
            query._id = new ObjectID(data.id);
        }

        if (data.chatID !== undefined) {
            query.chatID = new ObjectID(data.chatID);
        }

        if (data.userID !== undefined) {
            query.userID = new ObjectID(data.userID);
        }

        return await MongoDBConnector.queryData(messages, query);
    }

    public static async addMessage(data: {chatID: string, userID: string, text: string}) {
        let messages = MongoDBConnector.database?.collection("messages");

        let retData = await MongoDBConnector.insertDocument(messages, [{
            text: data.text,
            userID: new ObjectID(data.userID),
            chatID: new ObjectID(data.chatID)
        }]);

        let messageData = retData.ops as MessageType[]

        return messageData;
    }

    public static async getUser(data: {userID: string}) {
        let users = MongoDBConnector.database?.collection("users");

        let query = {
            _id: new ObjectID(data.userID)
        }

        return (await MongoDBConnector.queryData(users, query))[0] as UserType;
    }

    public static async getChat(data: {chatID: string}) {
        let chats = MongoDBConnector.database?.collection("chats");

        let query = {
            _id: new ObjectID(data.chatID)
        }

        let chat = (await MongoDBConnector.queryData(chats, query))[0] as ChatType;

        return chat;
    }

    public static async createChat(data: {chatName: string}) {
        let chats = MongoDBConnector.database?.collection("chats");

        let retData = await MongoDBConnector.insertDocument(chats, [data]);

        let chatData = retData.ops as ChatType[];

        return chatData;
    }

    public static async giveChatAccess(data: {userID: string, chatID: string}) {
        let users = MongoDBConnector.database?.collection("users");
        
        let retData = await MongoDBConnector.findOneAndUpdate(
            users,
            {_id: new ObjectID(data.userID)},
            {
                $push: {
                    availableChats: new ObjectID(data.chatID)
                }
            }
        )

        return retData;
    }
}