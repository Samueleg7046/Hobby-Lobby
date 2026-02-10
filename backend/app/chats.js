import express from 'express';
import jwt from 'jsonwebtoken';
import Chat from './models/chat.js';
import Message from './models/message.js';
import Notification from './models/notification.js';

const router = express.Router();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        const userId = req.headers['x-user-id'];
        if (userId) {
            req.user = { id: userId };
            next();
        } else {
            res.sendStatus(401);
        }
    }
};

// GET /chats - Lista chat dell'utente
router.get('/', authenticateToken, async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'uniqueName displayName profilePicture') 
            .populate('lastMessage') 
            .sort({ updatedAt: -1 });
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
        if (chatType === 'private') {
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
        const newMessage = new Message({
            chatId,
            senderId: req.user.id,
            content,
            messageType: messageType || 'text',
            readBy: [req.user.id]
        });
        const savedMessage = await newMessage.save();
        // Aggiorna la chat (Last message e updatedAt per l'ordinamento)
        const chat = await Chat.findByIdAndUpdate(
            chatId, 
            { lastMessage: savedMessage._id }, 
            { new: true }
        );

        // Genera notifiche per gli altri partecipanti
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
        const filter = { chatId: req.params.chatId };
        const messages = await Message.find(filter)
            .sort({ createdAt: 1 }); // Dal più vechio al più nuovo
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /chats/:chatId - Modifica gruppo (o partecipanti)
router.patch('/:chatId', authenticateToken, async (req, res) => {
    try {
        const { groupName, groupImage, participantsAdd, participantsRemove } = req.body;
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        // Modifica solo se è un gruppo
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

export default router;
