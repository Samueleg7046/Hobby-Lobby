import express from 'express';
import Activity from './models/activity.js';

const router = express.Router({ mergeParams: true });

router.post('', async (req, res) => {   // da aggiungere 401, user non autenticato

    try{
        const newActivity = new Activity({
            ...req.body,   // copia direttamente i dati 
            
        })
    } catch (err) {

    }

});

export default router;

