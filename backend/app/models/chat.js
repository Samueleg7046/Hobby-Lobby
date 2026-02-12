import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    chatType: {
        type: String,
        enum: ['private', 'group'],
        required: true
    },

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    groupName: {
        type: String,
        default: ''
    },

    // (Opzionale URL)
    groupImage: {
        type: String,
        default: ''
    },

    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },

    relatedGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    }

}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
