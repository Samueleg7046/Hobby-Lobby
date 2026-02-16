import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Group', new Schema({
    groupName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: null
    },
    duration: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        required: true
    },
    isRecruiting: { 
        type: Boolean, 
        default: true, 
        index: true     
    },
    tags: {
        type: [String],
        required: true,
        validate: v => Array.isArray(v) && v.length > 0
    },
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    members: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        validate: v => Array.isArray(v) && v.length > 0
    },
    meetings: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Meeting' }]
    }
}, { timestamps: true }));