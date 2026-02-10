import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/user.js';

console.log("DEBUG - SECRET_KEY:", process.env.SECRET_KEY);
const router = express.Router();

// --- CONFIGURAZIONE PASSPORT GOOGLE ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });
            
            if (user) {
                user.googleId = profile.id;
                user.isVerified = true;
                await user.save();
            } else {
                user = new User({
                    googleId: profile.id,
                    uniqueName: `user_${profile.id.slice(0,5)}`, // Nome provvisorio
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    isVerified: true
                });
                await user.save();
            }
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
  }
));

// REGISTRAZIONE & LOGIN -----------------------------------

//REGISTRAZIONE CLASSICA
router.post('/', async (req, res) => {
    try {
        const { uniqueName, displayName, email, password, birthDate } = req.body;
        const existingUser = await User.findOne({ 
            $or: [{ email: email }, { uniqueName: uniqueName }] 
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Username o email già esistenti' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            uniqueName,
            displayName,
            email,
            password: hashedPassword,
            birthDate,
            role: 'user',
            isVerified: false
        });
        // Per debug: verifica che la chiave segreta sia letta correttamente
        console.log("SECRET_KEY LETTA:", process.env.SECRET_KEY);
        const savedUser = await newUser.save();

        // SIMULAZIONE INVIO EMAIL
        const verifyToken = jwt.sign({ id: savedUser._id }, process.env.SECRET_KEY, { expiresIn: '1d' });
        console.log(`📧 [SIMULAZIONE EMAIL] Ciao ${savedUser.displayName}, clicca qui per confermare: http://localhost:8080/api/v1/users/verify/${verifyToken}`);

        res.status(201).json({ 
            message: "Utente registrato. Controlla la console per il link di verifica!",
            userId: savedUser._id,
            uniqueName: savedUser.uniqueName,
            email: savedUser.email
        });

    } catch (error) {
        res.status(400).json({ message: 'Errore registrazione', error: error.message });
    }
});
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        
        await User.findByIdAndUpdate(decoded.id, { isVerified: true });
        res.send("<h1>Email verificata con successo! Ora puoi fare login.</h1>");
    } catch (error) {
        res.status(400).send("<h1>Link non valido o scaduto</h1>");
    }
});

// LOGIN CLASSICO
router.post('/login', async (req, res) => {
    try {
        const { loginIdentifier, password } = req.body;
        const user = await User.findOne({ 
            $or: [{ email: loginIdentifier }, { uniqueName: loginIdentifier }] 
        });

        if (!user) return res.status(404).json({ message: 'Utente non trovato' });
        if (!user.password) return res.status(400).json({ message: 'Usa il login con Google' });
        if (!user.isVerified) return res.status(403).json({ message: 'Devi prima confermare la tua email!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Credenziali non valide' });
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
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

// LOGIN CON GOOGLE
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login-failed' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
    // dopo: res.redirect(`http://localhost:3000/login-success?token=${token}`);
    res.json({ message: "Login Google riuscito!", token, user: req.user });
  }
);

// SEZIONE PROFILO E GESTIONE DATI ------------------------------

// Recupero profilo utente
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password') // Nascondi password
            .populate('savedActivities')
            .populate('savedGroups')
            .populate('savedFriends', 'uniqueName displayName profilePicture');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Attività Salvate
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

// Gruppi Salvati
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

// Amici/Utenti Salvati
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

export default router;
