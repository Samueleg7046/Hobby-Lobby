import express from 'express';
import groups from './groups.js';
import meetings from './meetings.js';
import users from './users.js'; 
import chats from './chats.js';
import notifications from './notifications.js';

const app = express();

// parsing body of request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// resource routing
app.use('/api/v1/groups', groups);
app.use('/api/v1/groups/:group_id/meetings', meetings);
app.use('/api/v1/users', users);
app.use('/api/v1/chats', chats);
app.use('/api/v1/notifications', notifications);

export default app;
