import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Place', new Schema({
    placeName: {
        type: String,
        required: true,
        maxLength: 40,
        minLength: 1
    },
    imageUrl: {
        type: String,
        default: null
    },
    media_recensioni: {
        type: Number, 
        default: 0 
    },
    attivita: {
        type: String,
        default: "No activity specified"
    },
    tags: {
        type: [String],
        required: true,
        validate: v => Array.isArray(v) && v.length > 0
    },
    descrizione_luogo: {
        type: String,
        maxLength: 500,
        default: "No description provided"
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
        maxLength: 50
    },
    problemi: {
        type: [String],
        default: []
    },
    rev: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Review' }]
    }
}));