import UserType from "./mongodb/types/UserType";

export default class UserData {
    availableChats: string[];
    userID: string;

    constructor(data: UserType) {
        this.userID = data._id;
        this.availableChats = data.availableChats;
    }
}