const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    content: {
        type: String,
        required: true
    },

    messageType: {
        type: String,
        enum: ['text', 'image'],    // Possibili aggiunte da vedere
        default: 'text'
    },

    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]

}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;