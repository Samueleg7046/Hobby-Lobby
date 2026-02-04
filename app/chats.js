const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const Message = require('../models/message');
const User = require('../models/user');
const Notification = require('../models/notification'); // Per la notifica automatica

// Middleware "finto" per simulare l'autenticazione (da sostituire con quello vero JWT)

const authenticateToken = (req, res, next) => {
    // Per ora assumiamo che l'ID arrivi nell'header 'x-user-id' per testare con Postman
    const userId = req.headers['x-user-id']; 
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });
    req.user = { id: userId };
    next();
};

// GET /chats - Lista chat dell'utente
router.get('/', authenticateToken, async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'uniqueName displayName profilePicture') // Mostra nomi, non solo ID
            .populate('lastMessage') // Mostra l'ultimo messaggio per l'anteprima
            .sort({ updatedAt: -1 }); // Le chat più recenti in alto
        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /chats - Crea una nuova chat
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { chatType, participants, groupName, groupImage } = req.body;

        if (!participants.includes(req.user.id)) {
            participants.push(req.user.id);
        }

        // CONTROLLO DUPLICATI (Solo per chat private)
        if (chatType === 'private') {
            // Cerchiamo se esiste già una chat privata con ESATTAMENTE questi 2 partecipanti
            const existingChat = await Chat.findOne({
                chatType: 'private',
                participants: { $all: participants, $size: 2 }
            });
            if (existingChat) {
                return res.status(409).json({ message: 'Private chat already exists', chatId: existingChat._id });
            }
        }

        const newChat = new Chat({
            chatType,
            participants,
            groupName: chatType === 'group' ? groupName : undefined,
            groupImage: chatType === 'group' ? groupImage : undefined
        });

        const savedChat = await newChat.save();
        
        const populatedChat = await Chat.findById(savedChat._id)
            .populate('participants', 'uniqueName displayName');

        res.status(201).json(populatedChat);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /chats/:chatId - Info chat singola
router.get('/:chatId', authenticateToken, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', 'uniqueName displayName profilePicture');
        
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /chats/:chatId/messages - Invia messaggio
router.post('/:chatId/messages', authenticateToken, async (req, res) => {
    try {
        const { content, messageType } = req.body;
        const chatId = req.params.chatId;

        //creazione messaggio
        const newMessage = new Message({
            chatId,
            senderId: req.user.id,
            content,
            messageType: messageType || 'text',
            readBy: [req.user.id] // Chi lo manda lo ha anche letto
        });
        const savedMessage = await newMessage.save();

        //aggiorna chat in cima + last message
        const chat = await Chat.findByIdAndUpdate(
            chatId, 
            { lastMessage: savedMessage._id }, 
            { new: true }
        );

        // Generiamo notifiche per gli altri partecipanti
        chat.participants.forEach(userId => {
            if (userId.toString() !== req.user.id) {
                Notification.create({
                    title: 'Nuovo messaggio',
                    description: `Hai un nuovo messaggio in ${chat.groupName || 'una chat privata'}`,
                    targetUserId: userId
                }).catch(err => console.error('Errore notifica:', err));
            }
        });

        res.status(201).json(savedMessage);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /chats/:chatId/messages - Leggi messaggi
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
    try {
        // Opzionale: filtro messaggi non letti (?unreadOnly=true)                  ????
        //const filter = { chatId: req.params.chatId };
        
        // Logica per i messaggi
        const messages = await Message.find(filter)
            .sort({ createdAt: 1 }); // dal + vecchio a + nuovo

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /chats/:chatId - Modifica gruppo -----------------------------------------------------------------------------
// non so cosa tenere o meno
router.patch('/:chatId', authenticateToken, async (req, res) => {
    try {
        const { groupName, groupImage, participantsAdd, participantsRemove } = req.body;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        // cambio nome si o no? non ricordo se era richiesto
        if (chat.chatType === 'group') {
            if (groupName) chat.groupName = groupName;
            if (groupImage) chat.groupImage = groupImage;
        }

        // Aggiungi partecipanti
        if (participantsAdd && participantsAdd.length > 0) {
            participantsAdd.forEach(userId => {
                if (!chat.participants.includes(userId)) {
                    chat.participants.push(userId);
                }
            });
        }

        // Rimuovi partecipanti
        if (participantsRemove && participantsRemove.length > 0) {
            chat.participants = chat.participants.filter(
                id => !participantsRemove.includes(id.toString())
            );
        }

        await chat.save();
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;