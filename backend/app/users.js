import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/user.js';
import nodemailer from 'nodemailer';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
                    uniqueName: `user_${profile.id.slice(0,5)}`,
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    isVerified: true,
                    role: 'user'
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

// --- REGISTRAZIONE & LOGIN --------------------

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
        const savedUser = await newUser.save();

        // GENERAZIONE TOKEN DI VERIFICA E CREAZIONE LINK
        const verifyToken = jwt.sign({ id: savedUser._id }, process.env.SECRET_KEY, { expiresIn: '1d' });
        const verificationLink = `${req.protocol}://${req.get('host')}/api/v1/users/verify/${verifyToken}`;
        
        // --- INIZIO NUOVO CODICE PER L'INVIO EMAIL ---
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.body.email, 
            subject: 'Hobby Lobby - Confirm your account',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #4f46e5;">Welcome to Hobby Lobby!</h2>
                    <p>We're happy to have you on board. Click the button below to confirm your account:</p>
                    <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">
                        Confirm Account
                    </a>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't request this registration, please ignore this email.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully to:", req.body.email);
            
            // Invia la risposta SOLO se la mail è partita con successo
            res.status(201).json({ 
                message: "Registration successful. Check your email to verify your account.",
                userId: savedUser._id
            });
        } catch (mailError) {
            console.error("Error while sending email:", mailError);
            return res.status(500).json({ error: "User created, but error sending verification email" });
        }

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(400).json({ message: 'Registration error', error: error.message });
    }
});

//VERIFICA LINK EMAIL
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        await User.findByIdAndUpdate(decoded.id, { isVerified: true });
        //reindirizza alla pagina di Login del frontend
        res.redirect(`${FRONTEND_URL}/login?verified=true`);
    } catch (error) {
        res.status(400).send("<h1>Link not valid or expired. Please try registering again.</h1>");
    }
});

//LOGIN CLASSICO
router.post('/login', async (req, res) => {
    try {
        const { loginIdentifier, password } = req.body;
        const user = await User.findOne({ 
            $or: [{ email: loginIdentifier }, { uniqueName: loginIdentifier }] 
        });
        if (!user) return res.status(404).json({ message: 'Invalid credentials' });
        if (!user.password) return res.status(400).json({ message: 'Use Google login instead' });
        if (!user.isVerified) return res.status(403).json({ message: 'You must first verify your email!' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '7d' }); // Token dura 7 giorni
        res.status(200).json({ 
            token, 
            user: { 
                id: user._id, 
                uniqueName: user.uniqueName, 
                displayName: user.displayName,
                profilePicture: user.profilePicture,
                role: user.role 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//LOGIN CON GOOGLE
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login-failed' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.SECRET_KEY, { expiresIn: '7d' });
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&userId=${req.user._id}`);
  }
);

// --- SEZIONE PROFILO UTENTE ------------------------
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password') //nasconde password
            .populate('savedGroups')
            .populate('savedFriends', 'uniqueName displayName profilePicture');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Aggiorna profilo utente
router.patch('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;
        const allowedUpdates = ['displayName', 'description', 'profilePicture', 'hobbies'];
        const filteredUpdates = {};
        
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        const user = await User.findByIdAndUpdate(userId, filteredUpdates, { new: true });
        
        if (!user) return res.status(404).json({ message: "Utente non trovato" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Gruppi salvati
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

// Amici salvati
router.put('/:id/saved/friends/:friendId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.savedFriends.includes(req.params.friendId)) {
            return res.status(409).json({ message: 'Friend already saved' });
        }
        user.savedFriends.push(req.params.friendId);
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

router.get('/search/handle', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: "Query missing" });

        const user = await User.findOne({ uniqueName: query })
            .select('uniqueName displayName profilePicture');
        
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id/friends', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('savedFriends', 'displayName uniqueName profilePicture');
        
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user.savedFriends || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// RIMUOVI AMICIZIA
router.delete('/:id/friends/:friendId', async (req, res) => {
    try {
        const { id, friendId } = req.params;
        await User.findByIdAndUpdate(id, { $pull: { savedFriends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { savedFriends: id } });
        
        res.status(200).json({ message: "Friendship removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ELIMINA ACCOUNT
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.status(200).json({ message: "Account deleted permanently" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;