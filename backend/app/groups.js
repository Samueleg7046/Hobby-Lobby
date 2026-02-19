import express from 'express';
import Group from './models/group.js';
import User from './models/user.js'
import Chat from './models/chat.js';

const router = express.Router();

// feed dei places
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
            return res.status(200).json([]);
        }

    const response = groups.map(g => ({
        self: `/api/v1/groups/${g._id}`,
        groupName: g.groupName,
        groupId: g._id,
        chatId: g.chatId,
        description: g.description ?? null,
        imageUrl: g.imageUrl,
        tags: g.tags,
        membersCount: g.members.length,
        isRecruiting: g.isRecruiting,
        creationDate: g.createdAt,
        duration: g.duration,
        frequency: g.frequency,
        // I don't send meetings list, we don't need that for feed
        meetings: [],
        members: g.members.map(memberId => ({ userId: memberId }))
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
        .populate('members', 'displayName uniqueName profilePicture')
        .populate({
            path: 'meetings',
            match: { date: { $gte: new Date().toISOString().split('T')[0] } }, // Only future meetings  ( da vedere come salvare data su db)
            options: {  
                sort: { date: 1, time: 1 }, // Show upcoming meetings first 
            }
        })
        .exec();

    if (!groups || groups.length === 0) {
        return res.status(204).send();
    }

    const response = groups.map(g => ({
        groupId: g._id,
        self: `/api/v1/groups/${g._id}`,
        groupName: g.groupName,
        chatId: g.chatId,
        // if description is null/undefined, then null
        description: g.description ?? null,
        imageUrl: g.imageUrl,
        tags: g.tags,
        duration: g.duration,
        frequency: g.frequency,
        isRecruiting: g.isRecruiting,
        creationDate: g.createdAt,
        membersCount: g.members.length,
        members: g.members.map(m => ({
            userId: m._id,
            self: `/api/v1/users/${m._id}`,
            displayName: m.displayName,
            uniqueName: m.uniqueName,
            profilePicture: m.profilePicture
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

// Join group
router.post('/:id/join', async (req, res) => {
    const groupId = req.params.id;
    const { userId } = req.body; 

    try {
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        // Check if already a member
        if (group.members.includes(userId)) {
            return res.status(409).json({ error: "User is already a member" });
        }
        const updateGroup = Group.findByIdAndUpdate(groupId, { 
            $addToSet: { members: userId } 
        });
        const updateChat = Chat.findByIdAndUpdate(group.chatId, { 
            $addToSet: { participants: userId } 
        });
        await Promise.all([updateGroup, updateChat]);
        res.status(200).json({ message: "Joined successfully", groupId: groupId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// leave group
router.delete('/:id/leave', async (req, res) => {
    const groupId = req.params.id;
    const { userId } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        // Avoid admin leaving group
        if (group.createdBy.toString() === userId) {
            return res.status(400).json({ 
                error: "The group owner cannot leave. Delete the group." 
            });
        }

        // Check if user is member
        if (!group.members.includes(userId)) {
            return res.status(400).json({ error: "User is not a member of this group" });
        }
        const updateGroup = Group.findByIdAndUpdate(groupId, { 
            $pull: { members: userId } 
        });
        let updateChat = Promise.resolve();
        if (group.chatId) {
            updateChat = Chat.findByIdAndUpdate(group.chatId, { 
                $pull: { participants: userId } 
            });
        }
        await Promise.all([updateGroup, updateChat]);
        res.status(200).json({ message: "Left group successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('', async (req, res) => {
    const { groupName, description, tags, duration, frequency, imageUrl } = req.body;
    const userId = req.body.userId;

    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const newGroup = new Group({
            groupName: groupName,
            description, 
            tags,
            duration,
            frequency,
            imageUrl,
            createdBy: userId,
            members: [userId],
            isRecruiting: true
        });

        const newChat = new Chat({
            chatType: 'group',
            participants: [userId],
            groupName: groupName,
            groupImage: imageUrl,
            relatedGroupId: newGroup._id
        });

        const savedChat = await newChat.save();

        newGroup.chatId = savedChat._id;

        await newGroup.save();

        const response = {
            groupId: newGroup._id,
            self: `/api/v1/groups/${newGroup._id}`,
            groupName: newGroup.groupName,
            chatId: newGroup.chatId,
            description: newGroup.description ?? null,
            imageUrl: newGroup.imageUrl,
            tags: newGroup.tags,
            duration: newGroup.duration,
            frequency: newGroup.frequency,
            isRecruiting: newGroup.isRecruiting,
            creationDate: newGroup.createdAt,
            membersCount: 1,
            members: [{      
                userId: userId,
                self: `/api/v1/users/${userId}`,
                displayName: user.displayName,
                uniqueName: user.uniqueName,
                profilePicture: user.profilePicture 
            }],
            meetings: [] 
        };

        res.location(`/api/v1/groups/${newGroup._id}`).status(201).json(response);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Find group by ID
router.get('/:id', async (req, res) =>{
    const groupId = req.params.id;

    const g = await Group   
        .findById(groupId)
        .populate('members', '-password -__v')
        .populate({
            path: 'meetings',
            match: { date: { $gte: new Date().toISOString().split('T')[0] } }, // Only future meetings  ( da vedere come salvare data su db)
            options: {  
                sort: { date: 1, time: 1 }, // Show upcoming meetings first 
            }
        })
        .exec();

    if (!g) {
        return res.status(404).json({error: "Group not found"});
    }

    const result = {
        groupId: g._id,
        self: `/api/v1/groups/${g._id}`,
        groupName: g.groupName,
        chatId: g.chatId,
        description: g.description ?? null,
        imageUrl: g.imageUrl,
        tags: g.tags,
        duration: g.duration,
        frequency: g.frequency,
        isRecruiting: g.isRecruiting,
        createdBy: g.createdBy,
        creationDate: g.createdAt,
        membersCount: g.members.length,
        members: g.members.map(m => ({
            userId: m._id,
            self: `/api/v1/users/${m._id}`,
            email: m.email        
        })),
        meetings: g.meetings ? g.meetings.map(meet => ({
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
        })) : []
    };

    return res.status(200).json(result);
});

router.patch('/:id', async (req, res) => {
    try {
        // doesn't allow to manually change some fields
        const updates = req.body;
        delete updates._id;
        delete updates.createdBy;
        delete updates.members;
        delete updates.meetings;
        delete updates.chatId;

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!group) return res.status(404).json({ error: "Group not found" });

        // updates groupName both in group and chat
        if (updates.groupName && group.chatId) {
            await Chat.findByIdAndUpdate(group.chatId, { 
                groupName: updates.groupName 
            });
        }

        res.status(200).json({
            self: `/api/v1/groups/${group._id}`,
            groupName: group.groupName,
            chatId: group.chatId,
            description: group.description,
            imageUrl: group.imageUrl,
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