export default class UserData {
    availableChats: number[];
    userID: number;

    constructor(userID: number, availableChats: number[]) {
        this.userID = userID;
        this.availableChats = availableChats;
    }
}