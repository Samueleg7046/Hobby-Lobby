import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // sender
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ricevitore
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true });
friendRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true }); // limita numeroricheste

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
export default FriendRequest;