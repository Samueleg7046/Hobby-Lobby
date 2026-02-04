const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Registrazione nuovo utente
router.post('/', async (req, res) => {
    try {
        const { uniqueName, displayName, email, password, birthDate } = req.body;

        // Verifica se l'utente esiste già per email o username
        const existingUser = await User.findOne({ 
            $or: [{ email: email }, { uniqueName: uniqueName }] 
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }

        // Criptazione password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            uniqueName,
            displayName,
            email,
            password: hashedPassword,
            birthDate,
            role: 'user'
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            userId: savedUser._id,
            uniqueName: savedUser.uniqueName,
            displayName: savedUser.displayName,
            email: savedUser.email,
            role: savedUser.role
        });

    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error: error.message });
    }
});

// Login utente
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Confronto tra pw inserita e quella nel DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generazione del token JWT
        const token = jwt.sign({ id: user._id }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });

        res.status(200).json({ 
            token, 
            user: { 
                id: user._id, 
                uniqueName: user.uniqueName,
                displayName: user.displayName,
                role: user.role
            } 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Recupero profilo utente
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('savedActivities')
            .populate('savedGroups')
            .populate('savedFriends', 'uniqueName displayName profilePicture');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            userId: user._id,
            uniqueName: user.uniqueName,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            description: user.description,
            hobbies: user.hobbies,
            profilePicture: user.profilePicture,
            savedActivities: user.savedActivities,
            savedGroups: user.savedGroups,
            savedFriends: user.savedFriends
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Gestione Attività Salvate
router.put('/:id/saved/activities/:activityId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const activityId = req.params.activityId;

        if (user.savedActivities.includes(activityId)) {
            return res.status(409).json({ message: 'Activity already saved' });
        }

        user.savedActivities.push(activityId);
        await user.save();

        res.status(200).json(user.savedActivities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id/saved/activities/:activityId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.savedActivities.pull(req.params.activityId);
        await user.save();

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Gestione Gruppi Salvati
router.put('/:id/saved/groups/:groupId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const groupId = req.params.groupId;

        if (user.savedGroups.includes(groupId)) {
            return res.status(409).json({ message: 'Group already saved' });
        }

        user.savedGroups.push(groupId);
        await user.save();

        res.status(200).json(user.savedGroups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id/saved/groups/:groupId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.savedGroups.pull(req.params.groupId);
        await user.save();

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Gestione Amici/Utenti Salvati
router.put('/:id/saved/friends/:friendId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const friendId = req.params.friendId;

        if (user.savedFriends.includes(friendId)) {
            return res.status(409).json({ message: 'Friend already saved' });
        }

        user.savedFriends.push(friendId);
        await user.save();

        res.status(200).json(user.savedFriends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id/saved/friends/:friendId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.savedFriends.pull(req.params.friendId);
        await user.save();

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;