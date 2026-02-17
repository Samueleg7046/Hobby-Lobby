import express from 'express';
import Meeting from './models/meeting.js'
import Group from './models/group.js';

const router = express.Router({mergeParams: true}); 

const formatMeeting = (m, groupId) => {
    return {
        meetingId: m._id,
        groupId: groupId.toString(),
        self: `/api/v1/groups/${groupId}/meetings/${m._id}`, 
        date: m.date,
        time: m.time,
        placeId: m.placeId,
        description: m.description ?? null,
        status: m.status,
        totalMembers: m.totalMembers,
        createdBy: {
            userId: m.createdBy._id,
            displayName: m.createdBy.displayName,
            profilePicture: m.createdBy.profilePicture
        },

        currentVotes: {
            // if currentVotes exists in m, take confirmed, else use 0
            confirmed: m.currentVotes?.confirmed || 0,
            rejected: m.currentVotes?.rejected || 0,
            proposedChange: m.currentVotes?.proposedChange || 0
        },

        memberVotes: m.memberVotes ? m.memberVotes.map(vote => ({
            userId: vote.userId,
            response: vote.response,
            changeProposal: vote.changeProposal ? {
                date: vote.changeProposal.date ?? null,
                time: vote.changeProposal.time ?? null,
                placeId: vote.changeProposal.placeId ?? null
            } : null,
            respondedAt: vote.respondedAt
        })) : []
    };
};

router.get('', async (req, res) => {
    const groupId = req.params.group_id;

    const groupExists = await Group.exists({ _id: groupId });

    if (!groupExists) {
        return res.status(404).json({error: 'Group not found'});
    }

    const meetings = await Meeting.find({ group: groupId })
        .populate('placeId')
        .populate('createdBy', 'displayName uniqueName profilePicture')
        .sort({ date: 1, time: 1 });
    
    if (!meetings || meetings.length === 0) {
        return res.status(200).json([]);
    }

    const result = meetings.map(m => formatMeeting(m, groupId));
    
    res.status(200).json(result);
});

router.post('', async (req, res) => {   // da aggiungere anche codice 401: utente non autenticato
    const groupId = req.params.group_id;

    const userId = req.body.userId;  // da cambiare con autenticazione

    try {
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({error: 'Group not found'});
        }

        const newMeeting = new Meeting({
            date: req.body.date,
            time: req.body.time,
            placeId: req.body.placeId,
            description: req.body.description,
            group: groupId,
            createdBy: userId, 
            totalMembers: group.members.length,
            status: 'pending',
            currentVotes: { confirmed: 0, rejected: 0, proposedChange: 0 }
        });

        const savedMeeting = await newMeeting.save();

        group.meetings.push(savedMeeting._id);
        await group.save();

        res.location(`/api/v1/groups/${groupId}/meetings/${savedMeeting._id}`).status(201).json(formatMeeting(savedMeeting, groupId));
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
});

router.get('/:meeting_id', async (req, res) => {
    const groupId = req.params.group_id;
    const meetingId = req.params.meeting_id;

    const meeting = await Meeting.findOne({
        _id: meetingId,
        group: groupId
    }).populate('placeId');

    if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found in this group' });
    }

    res.status(200).json(formatMeeting(meeting, groupId));

});

router.patch('/:meeting_id', async (req, res) => {
    const groupId = req.params.group_id;
    const meetingId = req.params.meeting_id;

    const userId = req.body.userId; // da cambiare con autenticazione

    try {
        const meeting = await Meeting.findOne({
            _id: meetingId,
            group: groupId
        });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (meeting.status === 'confirmed' || meeting.status === 'rejected') {   // anche rejected o solo confirmed?
            return res.status(409).json({ error: 'Meeting cannot be updated (already confirmed/rejected)' });
        }

        if (meeting.createdBy.toString() !== userId) {   
            return res.status(403).json({ error: 'Only the creator can modify this meeting' });
        }

        // aggiungere res.status(401), utente non autenticato

        if (req.body.date) meeting.date = req.body.date;
        if (req.body.time) meeting.time = req.body.time;
        if (req.body.placeId) meeting.placeId = req.body.placeId;
        if (req.body.description !== undefined) meeting.description = req.body.description;

        const updateMeeting = await meeting.save();
        res.status(200).json(formatMeeting(updateMeeting, groupId));

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:meeting_id', async (req, res) => {
    // aggiungere 401

    const groupId = req.params.group_id;
    const meetingId = req.params.meeting_id;
    const userId = req.body.userId  // da modificare

    const meeting = await Meeting.findOne({
        _id: meetingId,
        group: groupId
    });

    if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.createdBy.toString() !== userId) {   
        return res.status(403).json({ error: 'Only the creator can delete this meeting' });
    }

    await meeting.deleteOne();

    await Group.updateOne(
        { _id: groupId },
        { $pull: { meetings: meetingId } }
    );

    return res.status(200).json({ message: 'Meeting deleted successfully'})

});

router.post('/:meeting_id/vote', async (req, res) => {
    const groupId = req.params.group_id;
    const meetingId = req.params.meeting_id;

    const { userId, response, changeProposal } = req.body; // userId da modificare

    try {
        const meeting = await Meeting.findOne({ 
            _id: meetingId,
            group: groupId        
        });

        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
        if (meeting.status !== 'pending') return res.status(409).json({ error: 'Voting is closed' });

        const alreadyVoted = meeting.memberVotes.find(v => v.userId.toString() === userId);
        if (alreadyVoted) return res.status(409).json({ error: 'User has already voted' });

        let proposalData = null;
        if (response === 'proposedChange' && changeProposal) {
            proposalData = {
                date: changeProposal.date || null,
                time: changeProposal.time || null, 
                placeId: changeProposal.placeId || null
            };
        }

        const newVote = {
            userId: userId,
            response: response,
            changeProposal: proposalData,
            respondedAt: new Date().toISOString()    // In memberVote schema, respondedAt is String
        };

        meeting.memberVotes.push(newVote);

        if (response === 'confirmed') meeting.currentVotes.confirmed++;
        else if (response === 'rejected') meeting.currentVotes.rejected++;
        else if (response === 'proposedChange') meeting.currentVotes.proposedChange++;
    
        await meeting.save();

        return res.status(201).json({ 
            userId: newVote.userId,
            response: newVote.response,
            changeProposal: newVote.changeProposal,
            respondedAt: newVote.respondedAt
        });

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});


export default router;

