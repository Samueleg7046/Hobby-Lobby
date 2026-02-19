import express from 'express';
import groups from './groups.js';
import meetings from './meetings.js';
import places from './places.js';
import reviews from './reviews.js';
//import flags from "./flags.js";
import friendsRouter from './friends.js';
import cors from 'cors';
import users from './users.js'; 
import chats from './chats.js';
import notifications from './notifications.js';
import notificationsRouter from './notifications.js';
import chatsRouter from './chats.js';

const app = express();

app.use(cors());
// parsing body of request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// resource routing
app.use('/api/v1/groups', groups);
app.use('/api/v1/places', places);
//app.use('/api/v1/flags', flags);
app.use('/api/v1/groups/:group_id/meetings', meetings);
app.use('/api/v1/places/:place_id/reviews', reviews);
app.use('/api/v1/users', users);
app.use('/api/v1/chats', chats);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/friends', friendsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/chats', chatsRouter);

export default app;
