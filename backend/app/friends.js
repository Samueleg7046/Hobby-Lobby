import express from 'express';
import User from './models/user.js';
import FriendRequest from './models/friendRequest.js';

const router = express.Router();
router.post('/request', async (req, res) => {
    const { requesterId, recipientId } = req.body;

    if (requesterId === recipientId) {
        return res.status(400).json({ message: "Non puoi inviarti la richiesta da solo" });
    }

    try {
        // check se sono già amici
        const user = await User.findById(requesterId);
        if (user.savedFriends.includes(recipientId)) {
            return res.status(400).json({ message: "Siete già amici!" });
        }
        //pending request check
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId }
            ],
            status: 'pending'
        });
        if (existingRequest) {
            return res.status(409).json({ message: "Esiste già una richiesta in sospeso." });
        }
        //new req
        const newRequest = new FriendRequest({
            requester: requesterId,
            recipient: recipientId
        });
        await newRequest.save();
        res.status(201).json({ message: "Richiesta inviata", request: newRequest });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//who
router.get('/requests/:userId', async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            recipient: req.params.userId,
            status: 'pending'
        }).populate('requester', 'displayName uniqueName profilePicture');

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//status
router.get('/status/:myId/:otherId', async (req, res) => {
    try {
        const { myId, otherId } = req.params;
        const me = await User.findById(myId);
        if (me.savedFriends.includes(otherId)) {
            return res.json({ status: 'friends' });
        }
        const request = await FriendRequest.findOne({
            $or: [
                { requester: myId, recipient: otherId },
                { requester: otherId, recipient: myId }
            ],
            status: 'pending'
        });

        if (!request) return res.json({ status: 'none' });
        if (request.requester.toString() === myId) {
            return res.json({ status: 'sent' });
        } else {
            return res.json({ status: 'received' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//azione sulla richiesta
router.put('/respond/:requestId', async (req, res) => {
    const { action } = req.body;
    try {
        const request = await FriendRequest.findById(req.params.requestId);
        if (!request) return res.status(404).json({ message: "Richiesta non trovata" });
        if (action === 'reject') {
            await FriendRequest.findByIdAndDelete(req.params.requestId);
            return res.status(200).json({ message: "Richiesta rifiutata" });
        }
        if (action === 'accept') {
            request.status = 'accepted';
            await request.save();
            await User.findByIdAndUpdate(request.requester, { $addToSet: { savedFriends: request.recipient } });
            await User.findByIdAndUpdate(request.recipient, { $addToSet: { savedFriends: request.requester } });
            return res.status(200).json({ message: "Amicizia accettata!" });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;