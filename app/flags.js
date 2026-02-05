import express from 'express';
import Flag from './models/flags.js';
import User from './models/users.js';

const router = express.Router({mergeParams: true});

router.post ('/:user_id/:admin_id/flags', async (req, res) => {
    try{
        const userid = req.params.user_id;
        const adminid = req.params.admin_id;

        const userExists= await User.findById(userid);

        if (!userExists){
            return res.status(404).json({message: 'Utente non trovato'})
        }

        const adminExists= await User.findById(adminid);

        if (!adminExists){
            return res.status(404).json({message: 'Mancata autenticazione'})
        }

        const {motivazione, operatore_id, user_id} = req.body;

        if (!motivazione){
            return res.status(400).json({message: 'Mancata motivazione'})
        }
        
        const newFlag = await Flag.create({
            motivazione: req.body.motivazione,
            operatore_id:adminid,
            user_id: userid,
        });

        res.status(200).json({message: 'Flag aggiunto'});
    }

    catch(error){
        res.status(400).json({ error: err.message })
    }

})

router.get('/:user_id/flags', async (req, res) => {
    const userid = req.params.user_id;
    
        const userExists = await User.exists({ _id: userid });
    
        if (!userExists) {
            return res.status(404).json({error: 'Utente non trovato'});
        }
    
    const result = userid.map(m=> {
        
    })

})


       