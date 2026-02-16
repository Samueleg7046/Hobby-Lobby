import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    uniqueName: { 
        type: String, 
        unique: true,
        // uniqueName è obbligatorio solo se non si registra con Google (o lo generiamo noi)
        required: function() { return !this.googleId; } 
    },
    displayName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: [/.+\@.+\..+/, 'Inserisci una email valida'] 
    },
    password: { 
        type: String,
        // La password è obbligatoria SOLO se non esiste googleId !!!
        required: function() { return !this.googleId; } 
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: { 
        type: String, 
        enum: ['user', 'operator'], 
        default: 'user' 
    },
    description: { type: String, default: '' },
    hobbies: [{ type: String }],
    birthDate: { type: Date },
    phoneNumber: { type: String },
    profilePicture: { type: String, default: '' },
    
    savedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    savedFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isPublic: { type: Boolean, default: true },
    flagsReceived: { type: Number, default: 0 },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
    }

}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;