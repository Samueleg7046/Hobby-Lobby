import express from 'express';
import Chat from './models/chat.js';
import Message from './models/message.js';
import User from './models/user.js';
import Notification from './models/notification.js';

const router = express.Router();

router.get('/user/:userId', async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.params.userId })
            .populate('participants', 'displayName uniqueName profilePicture')
            .populate('lastMessage') 
            .sort({ updatedAt: -1 }); //+recenti in cima

        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/private', async (req, res) => {
    const { myId, otherId } = req.body;
    if (myId === otherId) {
        return res.status(400).json({ error: "Non puoi avviare una chat con te stesso." });
    }

    try {
        let chat = await Chat.findOne({
            isGroup: false,
            participants: { $all: [myId, otherId] }
        }).populate('participants', 'displayName profilePicture');

        if (chat) {
            return res.json(chat);
        }

        const newChat = new Chat({
            participants: [myId, otherId],
            isGroup: false
        });

        await newChat.save();
        const populatedChat = await Chat.findById(newChat._id)
            .populate('participants', 'displayName profilePicture');

        res.status(201).json(populatedChat);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:chatId/messages', async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .sort({ createdAt: 1 })
            .populate('sender', 'displayName uniqueName profilePicture');

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:chatId/messages', async (req, res) => {
    const { senderId, content } = req.body;

    try {
        const newMessage = new Message({
            chat: req.params.chatId,
            sender: senderId,
            content: content
        });
        await newMessage.save();
        const chat = await Chat.findByIdAndUpdate(req.params.chatId, {
            lastMessage: newMessage._id,
            updatedAt: new Date()
        }, { new: true }).populate('participants');

        const populatedMsg = await newMessage.populate('sender', 'displayName profilePicture');

        const recipients = chat.participants.filter(p => p._id.toString() !== senderId);
        const senderName = populatedMsg.sender.displayName;

        for (const recipient of recipients) {
            await Notification.create({
                user: recipient._id,
                type: 'message',
                title: `Messaggio da ${senderName}`,
                message: content.length > 30 ? content.substring(0, 30) + '...' : content, //anteprima
                relatedId: chat._id,
                isRead: false
            });
        }
        res.status(201).json(populatedMsg);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;