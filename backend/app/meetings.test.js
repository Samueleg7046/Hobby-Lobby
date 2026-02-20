import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import Meeting from './models/meeting.js';
import Group from './models/group.js';

const EXISTING_GROUP_ID    = 'group123';
const MISSING_GROUP_ID     = 'group999';
const EXISTING_MEETING_ID  = 'meeting456';
const MISSING_MEETING_ID   = 'meeting999';
const CREATOR_ID           = 'creator000';
const MEMBER_ID            = 'user789';
const NON_MEMBER_ID        = 'outsider000';

const makeMeeting = (overrides = {}) => ({
  _id:          EXISTING_MEETING_ID,
  group:        EXISTING_GROUP_ID,
  date:         '2025-06-01',
  time:         '18:00',
  place:        'Bar Sport',
  description:  'Riunione di gruppo',
  status:       'pending',
  totalMembers: 2,
  createdBy: {
    _id:            CREATOR_ID,
    displayName:    'Mario Rossi',
    profilePicture: null,
    toString:       () => CREATOR_ID 
  },
  currentVotes: { confirmed: 0, rejected: 0, proposedChange: 0 },
  memberVotes:  [],
  save:         jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
  deleteOne:    jest.fn().mockResolvedValue({}),
  ...overrides
});

const makeGroup = (overrides = {}) => ({
  _id:      EXISTING_GROUP_ID,
  members:  [CREATOR_ID, MEMBER_ID],
  meetings: [],
  save:     jest.fn().mockResolvedValue({}),
  ...overrides
});


describe('Test sulle rotte di Meetings (/api/v1/groups/:group_id/meetings)', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(Group, 'exists').mockImplementation(({ _id }) =>
      Promise.resolve(_id === EXISTING_GROUP_ID ? { _id: EXISTING_GROUP_ID } : null)
    );

    jest.spyOn(Group, 'findById').mockImplementation((id) =>
      Promise.resolve(id === EXISTING_GROUP_ID ? makeGroup() : null)
    );

    jest.spyOn(Group, 'updateOne').mockResolvedValue({});

    jest.spyOn(Meeting, 'find').mockImplementation(() => ({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([makeMeeting()])
      })
    }));
    jest.spyOn(Meeting, 'findOne').mockImplementation(({ _id }) =>
      Promise.resolve(_id === EXISTING_MEETING_ID ? makeMeeting() : null)
    );

    jest.spyOn(Meeting.prototype, 'save').mockImplementation(function () {
      const savedDoc = {
        _id:          'new_meeting_id',
        group:        EXISTING_GROUP_ID,
        date:         this.date,
        time:         this.time,
        place:        this.place,
        description:  this.description ?? null,
        status:       'pending',
        totalMembers: 2,
        currentVotes: { confirmed: 0, rejected: 0, proposedChange: 0 },
        memberVotes:  [],
        createdBy: {
          _id:            CREATOR_ID,
          displayName:    'Mario Rossi',
          profilePicture: null,
          toString:       () => CREATOR_ID
        },
        populate: jest.fn().mockImplementation(function () {
          return Promise.resolve(savedDoc);
        })
      };
      return Promise.resolve(savedDoc);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // GET /api/v1/groups/:group_id/meetings

  describe('GET /groups/:group_id/meetings', () => {

    test('ritorna 404 se il gruppo non esiste', async () => {
      const res = await request(app).get(`/api/v1/groups/${MISSING_GROUP_ID}/meetings`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Group not found');
    });

    test('ritorna 200 con array vuoto se non ci sono meeting', async () => {
      jest.spyOn(Meeting, 'find').mockImplementation(() => ({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      }));

      const res = await request(app).get(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('ritorna 200 con la lista dei meeting', async () => {
      const res = await request(app).get(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].place).toBe('Bar Sport');
    });
  });

  // POST /api/v1/groups/:group_id/meetings
  describe('POST /groups/:group_id/meetings', () => {

    const validBody = {
      userId:  CREATOR_ID,
      date:    '2025-06-01',
      time:    '18:00',
      place:   'Bar Sport',
      description: 'Riunione'
    };

    test('ritorna 404 se il gruppo non esiste', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${MISSING_GROUP_ID}/meetings`)
        .send(validBody);
      expect(res.statusCode).toBe(404);
    });

    test('ritorna 201 e il meeting creato', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings`)
        .send(validBody);
      expect(res.statusCode).toBe(201);
      expect(res.body.place).toBe('Bar Sport');
      expect(res.body.status).toBe('pending');
    });
  });


  // GET /api/v1/groups/:group_id/meetings/:meeting_id
  describe('GET /groups/:group_id/meetings/:meeting_id', () => {

    test('ritorna 404 se il meeting non esiste', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${MISSING_MEETING_ID}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Meeting not found in this group');
    });

    test('ritorna 200 con i dati del meeting', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.place).toBe('Bar Sport');
      expect(res.body.status).toBe('pending');
    });
  });


  // PATCH /api/v1/groups/:group_id/meetings/:meeting_id
  describe('PATCH /groups/:group_id/meetings/:meeting_id', () => {

    test('ritorna 404 se il meeting non esiste', async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${MISSING_MEETING_ID}`)
        .send({ userId: CREATOR_ID, place: 'Nuovo posto' });
      expect(res.statusCode).toBe(404);
    });

    test('ritorna 409 se il meeting è già confermato', async () => {
      jest.spyOn(Meeting, 'findOne').mockResolvedValue(
        makeMeeting({ status: 'confirmed' })
      );

      const res = await request(app)
        .patch(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}`)
        .send({ userId: CREATOR_ID, place: 'Nuovo posto' });
      expect(res.statusCode).toBe(409);
    });

    test('ritorna 409 se il meeting è già rifiutato', async () => {
      jest.spyOn(Meeting, 'findOne').mockResolvedValue(
        makeMeeting({ status: 'rejected' })
      );

      const res = await request(app)
        .patch(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}`)
        .send({ userId: CREATOR_ID, place: 'Nuovo posto' });
      expect(res.statusCode).toBe(409);
    });

    test('ritorna 403 se chi modifica non è il creatore', async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}`)
        .send({ userId: MEMBER_ID, place: 'Nuovo posto' });
      expect(res.statusCode).toBe(403);
    });

    test('ritorna 200 e il meeting aggiornato', async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}`)
        .send({ userId: CREATOR_ID, place: 'Parco Sempione', time: '20:00' });
      expect(res.statusCode).toBe(200);
    });
  });

  // DELETE /api/v1/groups/:group_id/meetings/:meeting_id
  describe('DELETE /groups/:group_id/meetings/:meeting_id', () => {

    test('ritorna 404 se il meeting non esiste', async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${MISSING_MEETING_ID}`)
        .send({ userId: CREATOR_ID });
      expect(res.statusCode).toBe(404);
    });

    test('ritorna 403 se chi cancella non è il creatore', async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}`)
        .send({ userId: MEMBER_ID });
      expect(res.statusCode).toBe(403);
    });

    test('ritorna 200 dopo cancellazione riuscita', async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}`)
        .send({ userId: CREATOR_ID });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Meeting deleted successfully');
    });
  });

  // POST /api/v1/groups/:group_id/meetings/:meeting_id/vote
  describe('POST /groups/:group_id/meetings/:meeting_id/vote', () => {

    test('ritorna 404 se il gruppo non esiste', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${MISSING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}/vote`)
        .send({ userId: MEMBER_ID, response: 'confirmed' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Group not found');
    });

    test('ritorna 403 se l\'utente non è membro del gruppo', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}/vote`)
        .send({ userId: NON_MEMBER_ID, response: 'confirmed' });
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Only members can vote!');
    });

    test('ritorna 404 se il meeting non esiste', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${MISSING_MEETING_ID}/vote`)
        .send({ userId: MEMBER_ID, response: 'confirmed' });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Meeting not found');
    });

    test('ritorna 409 se il meeting non è più in pending', async () => {
      jest.spyOn(Meeting, 'findOne').mockResolvedValue(
        makeMeeting({ status: 'confirmed' })
      );

      const res = await request(app)
        .post(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}/vote`)
        .send({ userId: MEMBER_ID, response: 'confirmed' });
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('Voting is closed');
    });

    test('ritorna 409 se l\'utente ha già votato', async () => {
      jest.spyOn(Meeting, 'findOne').mockResolvedValue(
        makeMeeting({
          memberVotes: [{
            userId: { toString: () => MEMBER_ID },
            response: 'confirmed'
          }]
        })
      );

      const res = await request(app)
        .post(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}/vote`)
        .send({ userId: MEMBER_ID, response: 'confirmed' });
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('User has already voted');
    });

    test('ritorna 201 con voto registrato (confirmed)', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}/vote`)
        .send({ userId: MEMBER_ID, response: 'confirmed' });
      expect(res.statusCode).toBe(201);
      expect(res.body.userId).toBe(MEMBER_ID);
      expect(res.body.response).toBe('confirmed');
    });

    test('ritorna 201 con voto registrato (proposedChange con dettagli)', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${EXISTING_GROUP_ID}/meetings/${EXISTING_MEETING_ID}/vote`)
        .send({
          userId:   MEMBER_ID,
          response: 'proposedChange',
          changeProposal: { date: '2025-06-10', time: '19:00', place: 'Piazza Duomo' }
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.response).toBe('proposedChange');
      expect(res.body.changeProposal.place).toBe('Piazza Duomo');
    });
  });

});