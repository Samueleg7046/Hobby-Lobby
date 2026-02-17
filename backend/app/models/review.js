import mongoose from 'mongoose';
const { Schema } = mongoose;

export default mongoose.model('Review', new Schema({

       placeID: {
            type: Number,
            ref: 'Place',
            required: true
       },

       userID: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
       },

        description: {
            type: String,
            default: null
       },     

        valutazione: {
            type: Number,
            enum: [1,2,3,4,5],
            required:true
        },
    }));