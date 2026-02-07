import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    uniqueName: { 
        type: String, 
        required: true,
        unique: true
    },
    
    displayName: { 
        type: String, 
        required: true 
    },
    
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: [/.+\@.+\..+/, 'Per favore inserisci una email valida'] // Controllo formato email
    },
    
    password: { 
        type: String, 
        required: true 
    },
    
    role: { 
        type: String, 
        enum: ['user', 'operator'],
        default: 'user'
    },
    
    description: { 
        type: String, 
        default: ''
    },
    
    hobbies: [{ 
        type: String 
    }],
    
    birthDate: { 
        type: Date 
    },
    
    phoneNumber: { 
        type: String 
    },
    
    profilePicture: { 
        type: String,
        default: '' 
    },

    savedActivities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
    }],
    
    savedGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    
    savedFriends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    isPublic: {
        type: Boolean,
        default: true
    },

    notificationPreferences: {
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        marketingNotifications: { type: Boolean, default: false }
    },
    
    flagsReceived: {
        type: Number,
        default: 0
    }

    //possibili aggiunte \(°3°)/

}, {
    timestamps: true // Aggiunge automaticamente createdAt e updatedAt
});

const User = mongoose.model('User', userSchema);

export default User;
