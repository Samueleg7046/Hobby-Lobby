import mongoose from 'mongoose';
import { ReviewSchema } from './review.js';
const { Schema } = mongoose;


export default mongoose.model('Place', new Schema ({
        placeID: {
            type: String,
            unique: true,
            required: true,
            maxLenght: 20,
            trim: true
        },

        placeName: {
            type: String,
            required: true,
            maxLenght: 40,
            minLenght: 1
        },

        media_recensioni: {
            type: Number, 
            default: null
        },

        attivita: {
            type: String,
            dafault: null
        },

        tags: {
            type: [String],
            required: true,
            validate: v => Array.isArray(v) && v.length > 0
        },

        descrizione_luogo: {
            type: String,
            maxLenght: 500,
            minLenght: 1
        },

        orarioApertura: {
            type: String,
            required: true,
            trim: true
        },

        orarioChiusura: {
            type: String,
            required: true,
            trim: true
        },

        indirizzo: {
            type: String,
            required: true,
            maxLenght: 50,
            minLenght: 1
        },

        problemi: {
            type: [String],
            default: null
        },

        rev: [ReviewSchema]
    }
));
