import mongoose from 'mongoose';
const { Schema } = mongoose;


export default mongoose.model('Place', new Schema ({
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

        rev: {
             type: [{ type: Schema.Types.ObjectId, ref: 'Review' }]
        }
    }
));
