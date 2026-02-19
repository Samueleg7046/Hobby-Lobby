import express from 'express';
import Place from './models/place.js';
import Review from './models/review.js';

const router = express.Router({mergeParams: true}); 

//CREAZIONE DI UNA RECENSIONE

router.post ('', async (req, res) => {
    try{
        const {place_id} = req.params;
        const {userID, description, valutazione} = req.body;

        const place = await Place.findById(place_id);

        //1. mancato inserimento parametri obbligatori

        if (!valutazione){
            return res.status(400).json({message: "Inserire dei parametri validi"})
        }

        //2. Il posto selezionato non esiste
        if (!place){
            return res.status(404).json({message: 'Luogo non trovato' });
        }

        if (userID === undefined){
            return res.status(400).json({message: 'user id non valido'});
        }

        const newReview = await Review.create({
            placeID: place_id,
            userID,
            descrizione: description || "",
            valutazione
        });

        res.status(200).json({ message: 'Recensione creata', review: newReview });

    }

    catch(error){
        res.status(500).json({message: "Server Error", error: error.message});
    }

})

// LISTA RECENSIONI DI UN POSTO

router.get('', async (req, res) => {
    try{
        const {place_id} = req.query;

        let reviewExists = await Review.find(place_id);

        //1. Recensioni non trovate

        if (!reviewExists || reviewExists.lenght === 0) {
            return res.status(404).json({error: 'Lista non disponibile'});
        }

        //2. Lista recensioni

        const result = reviewExists.map(r => ({
                    placeID: r.placeID,
                    self: `/api/v1/places/${place_id}/reviews`,
                    userID: r.userID,
                    description: r.description,
                    valutazione: r.valutazione,
                    _id: r._id
                }));
        
        res.status(200).json(result);
    
    }

    catch (error){
        res.status(500).json({message: "Server Error", error: error.message});
    }
});

// DETTAGLI RECENSIONE

router.get('/:review_id', async (req, res) => {
   
   try{
    const placeId = req.params.place_id;
    const reviewId = req.params.review_id;

    //1. Recensione non trovata

    const r = await Review.findById(reviewId);

    if (!r){
        return res.status(404).json({ message: 'Recensione non trovata' });
    }

    //2. Controllo place_id

    if (r.placeID.toString() !== placeId){
        return res.status(400).json({ message: 'Errore place_id' });
    }

    //3. Recensione trovata
    res.status(200).json(r);

   }

   catch(error){
        res.status(500).json({message: "Server Error", error: error.message});
   }
});

//ELIMINAZIONE RECENSIONE

router.delete ('/:review_id', async (req, res) => {
    try {
        const {place_id} = req.params;
        const {review_id}= req.params;
        const rev = await Review.findById(review_id)

        //1: Recensione da eliminare non trovata
        
        if (!rev) {
            return res.status(404).json({ message: 'Recensione non trovata' });
        }
        
        //2. Recensione eliminata

        await rev.deleteOne();
        return res.status(201).json({ message: 'La recensione è stata rimossa correttamente'})
    }

    catch(error){
        res.status(500).json({ error: 'Server error' });
    }
});

//MODIFICA RECENSIONE
router.patch('/:review_id', async (req, res) => {
    try {
        const {place_id} = req.params;
        const {review_id}= req.params;
        const {userID, description, valutazione} = req.body;

    const rev = await Review.findById(review_id)

    //1. Recensione non trovata

    if (!rev){
        return res.status(404).json({ message: 'Recensione non trovata'})
    }

    //2. Tentativo di modificare rencensione non propria
    if (rev.userID.toString() !== req.body.userID){
        return res.status(403).json({ message: 'Non autorizzato a modificare questa recensione' });
    }

    //3. Recensione modificata

    rev.description = req.body.description;
    rev.valutazione = req.body.valutazione;

    const updateRev = await rev.save();

    res.status(200).json({message: 'Recensione modificata'}, updateRev);

    }

    catch(error){
        res.status(500).json({ error: 'Server error' });
    }

});

export default router;