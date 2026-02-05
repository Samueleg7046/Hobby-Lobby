import express from 'express';
import groups from './groups.js';
import meetings from './meetings.js';
import places from './places.js';


const app = express();

// parsing body of request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// resource routing
app.use('/api/v1/groups', groups);
app.use('/api/v1/groups', meetings);
app.use('/api/v1/places', places);
app.use('/api/v1/flags', flags);

export default app;