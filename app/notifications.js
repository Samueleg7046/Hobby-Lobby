const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');

// Middleware simulato per autenticazione)
const authenticateToken = (req, res, next) => {
    const userId = req.headers['x-user-id']; 
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });
    req.user = { id: userId };
    next();
};

// GET /notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const filter = { targetUserId: req.user.id };
        // Se nell'URL c'è ?read=false, mostriamo solo quelle non lette
        if (req.query.read === 'false') {
            filter.read = false;
        }
        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 }); // Le + recenti in cima

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /notifications
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, targetUserId } = req.body;

        if (!title || !description || !targetUserId) {
            return res.status(400).json({ message: 'Missing mandatory fields' });
        }

        const newNotification = new Notification({
            title,
            description,
            targetUserId
        });

        const savedNotification = await newNotification.save();
        res.status(201).json(savedNotification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /notifications/:id - Dettaglio singola notifica
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Controllo che la notifica appartenga all'utente che sta chiamando
        if (notification.targetUserId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /notifications/:id - Segna come letta
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { read } = req.body;
        
        // cerca notifica e controllo
        const notification = await Notification.findOne({ 
            _id: req.params.id, 
            targetUserId: req.user.id 
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found or access denied' });
        }
y
        if (read !== undefined) {
            notification.read = read;
        }

        await notification.save();
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;