import mongoose from 'mongoose';
const { Schema } = mongoose;

export const MeetingVoteSchema = new Schema({  // uso schema e non model perché dipendono da meeting
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    response: {
        type: String,
        enum: ['confirmed', 'rejected', 'proposedChange'],
        required: true
    },
    changeProposal: {
        date: {
            type: String,
            default: null
        },
        time: {
            type: String,
            default: null
        },
        place: {            // Da modificare quando aggiungiamo luoghi
            type: String,
            default: null
        }
    },
    respondedAt: {
        type: String,
        required: true
    }
}, {_id: false});   