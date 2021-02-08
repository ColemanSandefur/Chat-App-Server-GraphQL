import * as MongoDB from "mongodb";

const uri = "mongodb://localhost:27017/";

export default class MongoDBConnector {
    static client = new MongoDB.MongoClient(uri, {useUnifiedTopology: true, serverSelectionTimeoutMS: 1500});;
    static database: MongoDB.Db;

    static async connect() {
        await this.client.connect();

        this.database = this.client.db("discordDB");
    }

    static async queryData(collection: MongoDB.Collection<any>, query: MongoDB.FilterQuery<any>) {
        let result = collection.find(query);

        let array = await result.toArray();

        return array;
    }

    static async insertDocument(collection: MongoDB.Collection<any>, data: any[]) {
        let d = await collection.insertMany(data);
        
        return d;
    }

    static async findOneAndUpdate(collection: MongoDB.Collection<any>, filter: MongoDB.FilterQuery<any>, update: any) {
        let d = await collection.findOneAndUpdate(filter, update);

        return d; //returns updated document
    }
}