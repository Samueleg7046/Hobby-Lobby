import express from 'express';
import Flag from './models/flag.js';
import User from './models/user.js';

const router = express.Router({mergeParams: true});

// CREAZIONE FLAG

router.post ('', async (req, res) => {
try{
    const {user_id} = req.params;
    const {motivazione, operatore_ID} = req.body;

        const user = await User.findById(user_id);

        //1. mancato inserimento parametri obbligatori/ operatore_ID non definito

        if (!motivazione || !operatore_ID){
            return res.status(400).json({message: "Inserire dei parametri validi"})
        }

        //2. L'utente non esiste/ non è valido
        if (!user){
            return res.status(404).json({message: 'Utente non trovato' });
        }

        if (user_id === undefined){
            return res.status(400).json({message: 'user id non valido'});
        }

        //3. L'operatore non esiste/ non è valido

        const admin = await User.findById(req.body.operatore_ID);

        if (!admin){
            return res.status(404).json({message: 'Operatore non trovato' });
        }

        //4. Flag creato

        const newFlag = await Flag.create({
            motivazione,
            operatore_ID,
            utente_ID: user_id
        });

        res.status(200).json({ message: 'Recensione creata', flag: newFlag });

    }

    catch(error){
        res.status(500).json({message: "Server Error", error: error.message});
    }
});

// STORICO FLAG ASSEGNATI AD UN UTENTE

router.get('', async (req, res) => {
    try{
        const {user_id} = req.query;

        let flagExists = await Flag.find(user_id);

        //1. Flags non trovati

        if (!flagExists || flagExists.lenght === 0) {
            return res.status(404).json({error: 'Lista non disponibile'});
        }

        //2. Lista flags

        const result = flagExists.map(f => ({
                    motivazione: f.motivazione,
                    operatore_ID: f.operatore_ID,
                    utente_ID: f.utente_ID,
                    self: `/api/v1/users/${user_id}/flags`,
                    _id: f._id
                }));
        
        res.status(200).json(result);
    
    }

    catch (error){
        res.status(500).json({message: "Server Error", error: error.message});
    }
});

// RICERCA FLAG SPECIFICO TRAMITE ID

router.get('/:flag_id', async (req, res) => {
   
   try{
    const userId = req.params.user_id;
    const flagId = req.params.flag_id;

    //1. Flag non trovato

    const f = await Flag.findById(flagId);

    if (!f){
        return res.status(404).json({ message: 'Flag non trovata' });
    }

    //2. Controllo user_id

    if (u.userID.toString() !== userId){
        return res.status(400).json({ message: 'Errore user_id' });
    }

    //3. Flag trovato
    res.status(200).json(f);

   }

   catch(error){
        res.status(500).json({message: "Server Error", error: error.message});
   }
});

//ELIMINAZIONE FLAG

router.delete ('/:flag_id', async (req, res) => {
    try {
        const {user_id} = req.params;
        const {flag_id}= req.params;
        const f = await Flag.findById(flag_id)

        //1: Flag da eliminare non trovata
        
        if (!f) {
            return res.status(404).json({ message: 'Flag non trovato' });
        }

        //aggiungere controllo user e admin
        
        //2. Flag eliminato

        await f.deleteOne();
        return res.status(201).json({ message: 'Il flag è stato rimosso correttamente'})
    }

    catch(error){
        res.status(500).json({ error: 'Server error' });
    }
});

//MODIFICA FLAG

router.patch('/:flag_id', async (req, res) => {
    try {
        const {user_id} = req.params;
        const {flag_id}= req.params;
        const {motivazione, operatore_ID} = req.body;

    const f = await Flag.findById(flag_id)

    //1. Flag non trovato

    if (!f){
        return res.status(404).json({ message: 'Flag non trovato'})
    }

    //2. Tentativo non autorizzato di modificare flag 
    if (f.operatore_ID.toString() !== req.body.operatore_ID){
        return res.status(403).json({ message: 'Non autorizzato a modificare questo flag' });
    }

    //3. flag modificato

    f.motivazione = req.body.motivazione;

    const updateFlag = await f.save();

    res.status(200).json({message: 'Flag modificato'}, updateFlag);

    }

    catch(error){
        res.status(500).json({ error: 'Server error' });
    }

});


export default router;
       