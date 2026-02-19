import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // campi per chat di Gruppo
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupImage: { type: String },
    // anteprima ultimo messaggio
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;