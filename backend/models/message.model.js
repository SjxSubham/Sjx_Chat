import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    message:{
        type: String,
        required: true,
    }//createdAt, UpdateAt => mes
}, {timestamps: true});

// 1. needed to be fixed - collection name should be messages (not Message) - mongoose will take care of it
// messages are returning to the same user

const Message = mongoose.model("Message", messageSchema);

export default Message;