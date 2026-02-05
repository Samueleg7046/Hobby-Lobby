import mongoose from 'mongoose';
import {Schema} from mongoose;

export default mongoose.model('Flag', new Schema (
    {
        motivazione: {
            type: String,
            required: true,
            maxLenght: 50
        },

        operatore_ID: {
            type: Schema.Types.ObjectId,
            /*ref: 'User',*/
            required: true
        },

        utente_ID: {
            type: Schema.Types.ObjectId,
            /*ref: 'User',*/
            required: true
        }

    },

    { 
        timestamps: true 
    }
))