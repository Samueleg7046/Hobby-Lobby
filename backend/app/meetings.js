import express from 'express';
import Meeting from './models/meeting.js'
import Group from './models/group.js';

const router = express.Router({mergeParams: true});  

router.get('/:group_id/meetings', async (req, res) => {
    const groupId = req.params.group_id;

    const groupExists = await Group.exists({ _id: groupId });

    if (!groupExists) {
        return res.status(404).json({error: 'Group not found'});
    }

    const meetings = await Meeting.find({ group: groupId });
    
    if (!meetings || meetings.length === 0) {
        return res.status(204).send();
    }

    const result = meetings.map(m => ({
        meetingId: m._id,
        groupId: groupId,
        self: `/api/v1/groups/${groupId}/meetings/${m._id}`,
        date: m.date,
        time: m.time,
        place: m.place,
        description: m.description ?? null,
        status: m.status,
        totalMembers: m.totalMembers,
        currentVotes: m.currentVotes,
        memberVotes: m.memberVotes.map(vote => ({
            userId: vote.user,
            response: vote.response,
            changeProposal: vote.changeProposal ?? null,
            respondedAt: vote.respondedAt
        }))
    }));
    
    res.status(200).json(result);
});

router.post('/:group_id/meetings', async (req, res) => {   // da aggiungere anche codice 401: utente non autenticato
    const groupId = req.params.group_id;

    const group = await Group.findById(groupId);

    if (!group) {
        return res.status(404).json({error: 'Group not found'});
    }

    try {
        const newMeeting = new Meeting({
            ...req.body,      // copia direttamente i dati
            group: groupId,
            createdBy: req.body.userId, //inserire req.user.id, com'è ora è solo per testare
            totalMembers: group.members.length
        });

        const savedMeeting = await newMeeting.save();

        group.meetings.push(savedMeeting._id);
        await group.save();

        res.status(201).json(savedMeeting)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
});

router.get('/:group_id/meetings/:meeting_id', async (req, res) => {
    const groupId = req.params.group_id;
    const meetingId = req.params.meeting_id;

    const meeting = await Meeting.findOne({
        _id: meetingId,
        group: groupId
    });

    if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found in this group' });
    }

    const result = {
        meetingId: meeting._id,
        groupId: groupId,
        self: `/api/v1/groups/${groupId}/meetings/${meeting._id}`,
        date: meeting.date,
        time: meeting.time,
        place: meeting.place,
        description: meeting.description ?? null,
        status: meeting.status,
        totalMembers: meeting.totalMembers,
        currentVotes: meeting.currentVotes,
        memberVotes: meeting.memberVotes,
        createdBy: meeting.createdBy
    }

    res.status(200).json(result);

});

router.patch('/:group_id/meetings/:meeting_id', async (req, res) => {
    const groupId = req.params.group_id;
    const meetingId = req.params.meeting_id;

    try {
        const meeting = await Meeting.findOne({
            _id: meetingId,
            group: groupId
        });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found in this group' });
        }

        if (meeting.status === 'confirmed' || meeting.status === 'rejected') {   // anche rejected o solo confirmed?
            return res.status(409).json({ error: 'Meeting cannot be updated (already confirmed/rejected)' });
        }

        if (meeting.createdBy.toString() !== req.body.userId) {  // da modificare req.body.userId 
            return res.status(403).json({ error: 'Only the creator of the meeting can modify it' });
        }

        // aggiungere res.status(401), utente non autenticato

        if (req.body.date) meeting.date = req.body.date;
        if (req.body.time) meeting.time = req.body.time;
        if (req.body.place) meeting.place = req.body.place;

        const updateMeeting = await meeting.save();
        res.status(200).json(updateMeeting);

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:group_id/meetings/:meeting_id', async (req, res) => {
    // aggiungere 401

    const meeting = await Meeting.findOne({
        _id: req.params.meeting_id,
        group: req.params.group_id
    });

    if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found in this group' });
    }

    if (meeting.createdBy.toString() !== req.body.userId) {  // da modificare req.body.userId 
        return res.status(403).json({ error: 'Only the creator of the meeting can delete it' });
    }

    await meeting.deleteOne();
    return res.status(200).json({ message: 'Meeting deleted successfully'})

});

router.post('/:group_id/meetings/:meeting_id/vote', async (req, res) => {
    const groupId = req.params.group_id;
    const meetingId = req.params.meeting_id;

    const { userId, response, changeProposal } = req.body;

    try {
        const meeting = await Meeting.findOne({ 
            _id: meetingId,
            group: groupId        
        });

        if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
        if (meeting.status !== 'pending') return res.status(409).json({ error: 'Voting is closed' });

        const alreadyVoted = meeting.memberVotes.find(v => v.user.toString() === userId);
        if (alreadyVoted) return res.status(409).json({ error: 'User has already voted' });

        let proposalData = { date: null, time: null, place: null };
        if (response === 'proposedChange' && changeProposal) {
            proposalData = {
                date: changeProposal.date || null,
                time: changeProposal.time || null, 
                place: changeProposal.place || null
            };
        }

        const newVote = {
            user: userId,
            response: response,
            changeProposal: proposalData,
            respondedAt: new Date().toISOString()    // In memberVote schema, respondedAt is String
        };

        meeting.memberVotes.push(newVote);

        if (response === 'confirmed') meeting.currentVotes.confirmed++;
        else if (response === 'rejected') meeting.currentVotes.rejected++;
        else if (response === 'proposedChange') meeting.currentVotes.proposedChange++;
    
        await meeting.save();

        return res.status(201).json({ message: 'Vote recorded', vote: newVote});

    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});


export default router;

