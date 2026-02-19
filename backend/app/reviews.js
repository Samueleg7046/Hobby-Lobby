import express from 'express';
import Place from './models/place.js';
import Review from './models/review.js';

const router = express.Router({mergeParams: true}); 

// aggiorna media voti di un luogo in automatico
const updatePlaceRating = async (placeId) => {
    const place = await Place.findById(placeId).populate('rev');
    if (!place) return;
    
    if (!place.rev || place.rev.length === 0) {
        place.media_recensioni = 0;
    } else {
        const total = place.rev.reduce((sum, r) => sum + r.valutazione, 0);
        place.media_recensioni = parseFloat((total / place.rev.length).toFixed(1));
    }
    await place.save();
};

// CREAZIONE REVIEW
router.post ('', async (req, res) => {
    try{
        const { place_id } = req.params;
        const { userID, description, valutazione } = req.body;

        if (!valutazione || !userID){
            return res.status(400).json({message: "Insert valid parameters (rating and userID are required)"});
        }

        const place = await Place.findById(place_id);
        if (!place){
            return res.status(404).json({message: 'Place not found' });
        }

        // existing review check
        const existingReview = await Review.findOne({ placeID: place_id, userID: userID });
        if (existingReview) {
            return res.status(409).json({ message: 'You have already reviewed this place.' });
        }

        const newReview = await Review.create({
            placeID: place_id,
            userID,
            description: description || "",
            valutazione
        });

        place.rev.push(newReview._id);
        await place.save();
        await updatePlaceRating(place_id);

        res.status(201).json({ message: 'Review created successfully', review: newReview });
    }
    catch(error){
        res.status(500).json({message: "Server Error", error: error.message});
    }
});

// RECUPERO RECENSIONI PLACE
router.get('', async (req, res) => {
    try {
        const { place_id } = req.params;
        const reviews = await Review.find({ placeID: place_id }).populate('userID', 'displayName uniqueName profilePicture');
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// ELIMINA REVIEW
router.delete('/:review_id', async (req, res) => {
    try {
        const { place_id, review_id } = req.params;
        const { userID, role } = req.body;

        const rev = await Review.findById(review_id);
        if (!rev) {
            return res.status(404).json({ message: 'Review not found' });
        }
        if (rev.userID.toString() !== userID && role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to delete this review' });
        }
        await rev.deleteOne();
        const place = await Place.findById(place_id);
        if (place) {
            place.rev = place.rev.filter(rId => rId.toString() !== review_id);
            await place.save();
            await updatePlaceRating(place_id);
        }
        return res.status(200).json({ message: 'Review deleted successfully' });
    }
    catch(error){
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

export default router;