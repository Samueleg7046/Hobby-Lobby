import express from 'express';
import Group from './models/group.js';

const router = express.Router();

// get feed of groups with isRecruiting = true
router.get('/feed', async (req, res) => {  // da aggiungere logica per recommended
    const {filter, tags } = req.query;

    let query = { isRecruiting: true };

    if (tags) {
        query.tags = { $in: tags.split(',') };
    }
    
    let groups = await Group.find(query);

    // trending shows the groups with the most members
    if (filter === 'trending') {
        groups.sort((a, b) => a.members.length - b.members.length);
    } else if (filter === 'recommended') {
        // implementare logica
    } else {  //new shows the most recent groups
        groups.sort((a, b) => b.createdAt - a.createdAt);
    }

    if (!groups || groups.length === 0) {
        return res.status(204).end();
    }

    const response = groups.map(g => ({
        self: `/api/v1/groups/${g._id}`,
        groupName: g.groupName,
        description: g.description,
        tags: g.tags,
        membersCount: g.members.length,
        isRecruiting: g.isRecruiting,
        creationDate: g.createdAt,
        duration: g.duration,
        frequency: g.frequency,
        // I don't send members and meetings lists, we don't need that for feed
        meetings: [],
        members: []
    }));

    res.status(200).json(response);

});

// List of groups
router.get('', async (req, res) => {

    const { userId } = req.query;

    // returns olny user's groups if userId is specified
    const filter = userId ? { members: userId } : {};
    
    // groups is an array of populated groups
    let groups = await Group
        .find(filter)
        .populate('members', '-password -__v')
        .populate('meetings')
        .exec();

    if (!groups || groups.length === 0) {
        return res.status(204).send();
    }

    const response = groups.map(g => ({
        groupId: g._id,
        self: `/api/v1/groups/${g._id}`,
        groupName: g.groupName,
        // if description is null/undefined, then null
        description: g.description ?? null,
        tags: g.tags,
        duration: g.duration,
        frequency: g.frequency,
        isRecruiting: g.isRecruiting,
        creationDate: g.createdAt,
        membersCount: g.members.length,
        members: g.members.map(m => ({
            userId: m._id,
            self: `/api/v1/users/${m._id}`,
            email: m.email         // altro??Qui
        })),
        meetings: g.meetings.map(meet => ({
            meetingId: meet._id,
            groupId: g._id.toString(),
            self: `/api/v1/groups/${g._id}/meetings/${meet._id}`,
            date: meet.date,
            time: meet.time,
            place: meet.place,
            description: meet.description ?? null,
            status: meet.status,
            totalMembers: meet.totalMembers,
            currentVotes: meet.currentVotes,
            memberVotes: meet.memberVotes ? meet.memberVotes.map(vote => ({
                userId: vote.userId,
                response: vote.response,
                changeProposal: vote.changeProposal ?? null,
                respondedAt: vote.respondedAt
            })) : []
        }))
    }));

    res.status(200).json(response);
});


router.post('', async (req, res) => { // aggiungere codice 401, utente non autenticato
    const { groupName, description, tags, duration, frequency } = req.body;
    const userId = req.body.userId;

    try {
        const newGroup = new Group({
            groupName: groupName,
            description, 
            tags,
            duration,
            frequency,
            createdBy: userId,
            members: [userId],
            isRecruiting: true
        });

        await newGroup.save();

        res.location(`/api/v1/groups/"${newGroup._id}`).status(201).json(newGroup);
    } catch (err) {
        res.status(400).json({ errore: err.message });
    }
});

//Find group by ID
router.get('/:id', async (req, res) =>{
    const groupId = req.params.id;

    const g = await Group   
        .findById(groupId)
        .populate('members', '-password -__v')
        .populate('meetings')
        .exec();

    if (!g) {
        return res.status(404).json({error: "Group not found"});
    }

    const result = {
        groupId: g._id,
        self: `/api/v1/groups/${g._id}`,
        groupName: g.groupName,
        description: g.description ?? null,
        tags: g.tags,
        duration: g.duration,
        frequency: g.frequency,
        isRecruiting: g.isRecruiting,
        creationDate: g.createdAt,
        membersCount: g.members.length,
        members: g.members.map(m => ({
            userId: m._id,
            self: `/api/v1/users/${m._id}`,
            email: m.email         //altro??
        })),
        meetings: g.meetings.map(meet => ({
            meetingId: meet._id,
            groupId: g._id,
            self: `/api/v1/groups/${g._id}/meetings/${meet._id}`,
            date: meet.date,
            time: meet.time,
            place: meet.place,
            description: meet.description ?? null,
            status: meet.status,
            totalMembers: meet.totalMembers,
            currentVotes: meet.currentVotes,
            memberVotes: meet.memberVotes ? meet.memberVotes.map(vote => ({
                userId: vote.userId,
                response: vote.response,
                changeProposal: vote.changeProposal ?? null,
                respondedAt: vote.respondedAt
            })) : []
        }))
    };

    return res.status(200).json(result);
});

router.patch('/:id', async (req, res) => {
    try {
        const updates = req.body;
        delete updates._id;
        delete updates.createdBy;
        delete updates.members;
        delete updates.meetings;

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!group) return res.status(404).json({ error: "Group not found" });

        res.status(200).json({
            self: `/api/v1/groups/$group._id}`,
            groupName: group.groupName,
            description: group.description,
            tags: group.tags,
            duration: group.duration,
            frequency: group.frequency,
            isRecruiting: group.isRecruiting,
            creationDate: group.createdAt,
            membersCount: group.members.length
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

export default router;