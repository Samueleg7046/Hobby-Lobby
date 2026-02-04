import express from 'express';
import cors from 'cors';
import groups from './groups.js';
import meetings from './meetings.js';


const app = express();

app.use(cors());
// parsing body of request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// resource routing
app.use('/api/v1/groups', groups);
app.use('/api/v1/groups/:group_id/meetings', meetings);

export default app;