import express from 'express';
import Place from './models/place.js';
import Review from './models/review.js';

const router = express.Router({mergeParams: true}); 

//CREAZIONE DI UNA RECENSIONE

router.post ('/:place_id/places/reviews', async (req, res) => {
    try{
        const {place_id} = req.params;

        const {userid, description, val } = req.body

    const place = await Place.findById(place_id);

    if (!place){
        return res.status(404).json({message: 'Luogo non trovato' });
    }

    if (val === undefined ){
        return res.status(400).json({message: 'Inserire valutazione'});
    }

    if (userid === undefined){
        return res.status(500).json({message: 'user id non valido'});
    }

        const newReview = await ReviewSchema.create({
            placeID: place_id,
            userID: userid,
            descrizione: description || "",
            valutazione: val
        });

        res.status(200).json({ message: 'Recensione creata' });

        //manca aggiornamento valutazione del luogo
    }

    catch(error){
        res.status(500).json({message: "Server Error", error: error.message});
    }

})

//ELIMINAZIONE RECENSIONE

router.delete ('/places/:place_id/reviews/:review_id', async (req, res) => {
    try {
        const placeid = req.params.place_id;
        const userid = req.params.user_id;
        const deleteReview = await ReviewSchema.findOne({
        placeID: placeid,
        userID: userid
     })

        //1: Recensione da eliminare non trovata
        
        if (!deleteReview) {
            return res.status(404).json({ message: 'Recensione non trovata' });
        }
        
        //2. Recensione eliminata

        await deleteReview.deleteOne();
        return res.status(201).json({ message: 'La recensione è stata rimossa'})
    }

    catch(error){
        res.status(500).json({ error: 'Server error' });
    }
});

//MODIFICA RECENSIONE
router.patch('/places/:place_id/reviews/:review_id', async (req, res) => {
    try {
    const userid= req.params.user_id;
    const placeid= req.params. place_id;

    const rev = await ReviewSchema.finOne({
        userID: userid,
        placeID: placeid
    })

    if (!rev){
        return res.status(404).json({ message: 'Recensione non trovata'})
    }

    if (req.body.descrption) rev.description = req.body.description;
    if (req.body.valtazione) rev.valutazione = req.body.valutazione;

    const updateRev = await rev.save();

    res.status(200).json({message: 'Recensione modificata'}, updateRev);

    }

    catch(error){
        res.status(400).json({ error: err.message });
    }

});

export default router;