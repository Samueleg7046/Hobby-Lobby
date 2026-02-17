import express from 'express';
import Place from './models/place.js';
import User from './models/user.js';

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

export default router;

