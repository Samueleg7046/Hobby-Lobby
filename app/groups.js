import express from 'express';
import Group from './models/group.js';

const router = express.Router();

// List of groups
router.get('', async (req, res) => {
    
    // groups is an array of populated groups
    let groups = await Group
        .find()
        .populate('members', '-password -__v')
        .populate('meetings')
        .exec();

    if (groups.length === 0) {
        return res.status(204).send();
    }

    groups = groups.map(g => ({
        groupId: g._id.toString(),
        self: `/api/v1/groups/${g._id}`,
        groupName: g.groupName,
        // if description is null/undefined, then null
        description: g.description ?? null,
        tags: g.tags,
        members: g.members.map(m => ({
            userId: m._id.toString(),
            self: `/api/v1/users/${m._id}`,
            email: m.email         // altro??Qui
        })),
        meetings: g.meetings.map(meet => ({
            meetingId: meet._id.toString(),
            groupId: g._id.toString(),
            self: `/api/v1/groups/${g._id}/meetings/${meet._id}`,
            date: meet.date,
            time: meet.time,
            place: meet.place,
            description: meet.description ?? null,
            status: meet.status,
            totalMembers: meet.totalMembers,
            currentVotes: meet.currentVotes,
            memberVotes: meet.memberVotes.map(vote => ({
                userId: vote.userId,
                response: vote.response,
                changeProposal: vote.changeProposal ?? null,
                respondedAt: vote.respondedAt
            }))
        }))
    }));

    res.status(200).json(groups);
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
            memberVotes: meet.memberVotes.map(vote => ({
                userId: vote.userId,
                response: vote.response,
                changeProposal: vote.changeProposal ?? null,
                respondedAt: vote.respondedAt
            }))
        }))
    };

    return res.status(200).json(result);
});

export default router;