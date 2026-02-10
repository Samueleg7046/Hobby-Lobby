import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    read: {
        type: Boolean,
        default: false
    }

    // timestamps aggiunge automaticamente 'createdAt' e 'updatedAt'
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
