import mongoose from 'mongoose';
import { MeetingVoteSchema } from './meetingVote.js';
const { Schema } = mongoose;

export default mongoose.model('Meeting', new Schema({
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    place: {       
        type: String,
        required: true
    },
    description: {
        type: String,
        default: null
    },
    minParticipants: {
        type: Number,
        min: 1,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected'],
        default: 'pending'
    },
    totalMembers: {
        type: Number,
        min: 1,
        required: true
    },
    currentVotes: {
        confirmed: {
            type: Number,
            default: 0
        },
        rejected: {
            type: Number,
            default: 0
        },
        proposedChange: {
            type: Number,
            default: 0
        }
    },
    memberVotes: [MeetingVoteSchema]

}, { timestamps: true }));