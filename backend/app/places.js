import express from 'express';
import Place from './models/place.js';
import User from './models/user.js';

const router = express.Router({mergeParams: true});

// GET FEED DI LUOGHI
router.get('/feed', async (req, res) => {
    try {
        let places = await Place.find();

        if (!places || places.length === 0) {
            return res.status(200).json([]);
        }

        const response = places.map(p => ({
            placeID: p._id,
            self: `/api/v1/places/${p._id}`,
            placeName: p.placeName,
            imageUrl: p.imageUrl,
            media_recensioni: p.media_recensioni,
            attivita: p.attivita,
            tags: p.tags,
            descrizione_luogo: p.descrizione_luogo,
            orarioApertura: p.orarioApertura,
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
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message });
    }
});

// CREAZIONE LUOGO
router.post('', async (req, res) => {
    const {
        placeName,
        indirizzo,
        orarioChiusura,
        orarioApertura,
        attivita,
        tags,
        descrizione_luogo,    
        imageUrl
    } = req.body;

    try {
        if (!placeName || !indirizzo || !orarioApertura || !orarioChiusura) {
            return res.status(400).json({message: "Inserire dei parametri validi"});
        }

        const existingPlace = await Place.findOne({ placeName });
        if (existingPlace) {
            return res.status(409).json({ message: "Un luogo con questo nome esiste già" });
        }

        const safeTags = (tags && tags.length > 0) ? tags : ["Generale"];
        const newPlace = new Place({
            placeName,
            indirizzo,
            orarioApertura,
            orarioChiusura,
            attivita: attivita || "Nessuna attività specificata",
            tags: safeTags,
            descrizione_luogo: descrizione_luogo ? descrizione_luogo : undefined, 
            imageUrl: imageUrl || null
        });

        await newPlace.save();

        const savedPlace = {
            placeID: newPlace._id,
            self: `/api/v1/places/${newPlace._id}`,
            placeName: newPlace.placeName,
            imageUrl: newPlace.imageUrl,
            media_recensioni: 0,
            indirizzo: newPlace.indirizzo,
            orarioApertura: newPlace.orarioApertura,
            orarioChiusura: newPlace.orarioChiusura,
            attivita: newPlace.attivita,
            problemi: [],
            tags: newPlace.tags,
            descrizione_luogo: newPlace.descrizione_luogo
        };

        res.location(`/api/v1/places/${newPlace._id}`).status(201).json(savedPlace);

    } catch (error) {
        console.error("ERROR WHILE SAVING PLACE:", error); 
        res.status(500).json({message: "Server Error", error: error.message });
    }    
});

// RICERCA LUOGO PER ID
router.get('/:placeID', async (req, res) => {
   try {
        const placeId = req.params.placeID;
        const p = await Place.findById(placeId);

        if (!p) {
            return res.status(404).json({ message: 'No results found for the given place ID' });
        }

        res.status(200).json(p);
   } catch(error) {
        res.status(500).json({message: "Server Error", error: error.message});
   }
});

// GET LISTA DI LUOGHI E FILTRO TAG
router.get('', async (req, res) => {
    try {
        const { tagInserito } = req.query;
        const filter = tagInserito ? { attivita: tagInserito } : {};
        let places = await Place.find(filter)
        
        if (!places || places.length === 0) {
            return res.status(204).send();
        }
    
        const response = places.map(p => ({
            placeID: p._id,
            self: `/api/v1/places/${p._id}`,
            placeName: p.placeName,
            imageUrl: p.imageUrl,
            media_recensioni: p.media_recensioni,
            attivita: p.attivita,
            tags: p.tags,
            descrizione_luogo: p.descrizione_luogo,
            orarioApertura: p.orarioApertura,
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
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
});

export default router;