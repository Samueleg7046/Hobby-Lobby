import express from 'express';
import Place from './models/place.js';
//import User from './models/user.js';
import { ReviewSchema } from './models/review.js';

const router = express.Router({mergeParams: true});

//CREAZIONE LUOGO

router.post('/places', async (req, res) => {
    try{
        //1. mancato inserimento dei parametri obbligatori

       const {
            placeID,
            placeName,
            indirizzo,
            orarioChiusura,
            orarioApertura,
            attivita,
            tags,
            descrizione_luogo,    
       } = req.body;

        if (!placeName || !indirizzo || !orarioApertura || !orarioChiusura){
            return res.status(400).json({message: "Inserire dei parametri validi"})
        }

        //2. check se il luogo esiste di già

        const existing = await Place.findOne({placeID: placeID});
        if (existing) {
            return res.status(401).json({message: "Il luogo indicato e' già registrato"})
        }

        //3. Luogo creato con successo

        const newPlace = new Place({
            placeID,
            placeName,
            indirizzo,
            orarioApertura,
            orarioChiusura,
            attivita: attivita || "",
            tags: tags || [],
            descrizione_luogo: descrizione_luogo || ""
        });

        const savedPlace = await newPlace.save();

        res.status(201).json(savedPlace);

        }

    catch (error){
        res.status(500).json({message: "Server Error", error: error.message });

    }    
    
});

//RICERCA LUOGO PER ID

router.get('/places/:placeID', async (req, res) => {
   
   try{
    const placeId = req.params.placeID;

    //1. Luogo non trovato

    const p = await Place.findById(placeId);

    if (!p){
        return res.status(404).json({ message: 'Nessun risultato' });
    }

    //2. Luogo trovato
    res.status(200).json(p);

   }

   catch(error){
        res.status(500).json({message: "Server Error", error: error.message});
   }
});

//GET LUOGHI IN BASE AI TAG

router.get ('/places', async (req, res) =>{
    try {
        
        const { tagInserito } = req.query;
        
        const filter = tagInserito ? { attivita: tagInserito } : {};
        let places = await Place.find(filter)
        
            if (!places || places.lenght === 0) {
                return res.status(204).send();
            }
        
            const response = places.map(p => ({
                placeID: p.placeID,
                self: `/api/v1/places/${p._id}`,
                placeName: p.placeName,
                media_recensioni: p.media_recensioni,
                attivita: p.attivita,
                tags: p.tags,
                descrizione_luogo: p. descrizione_luogo,
                orarioApertura: p. orarioApertura,
                orarioChiusura: p.orarioChiusura,
                indirizzo: p.indirizzo,
                problemi: p.problemi,
                rev: p.rev ? p.rev.map(r => ({
                                placeID: r.placeID,
                                userID: r.userID,
                                description: r.description,
                                valutazione: r.valutazione
                })) : []
            }));
        
            res.status(200).json(response);
    }

    catch (error){
        res.status(500).json({message: "Server Error", error: error.message});
    }

})

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

