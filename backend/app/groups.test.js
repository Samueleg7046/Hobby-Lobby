import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import Group from './models/group.js';
import User from './models/user.js';
import Chat from './models/chat.js';
import Notification from './models/notification.js';

describe('Test sulle rotte di Groups (/api/v1/groups)', () => {

  let findSpy, findByIdSpy, findByIdAndUpdateSpy, chatUpdateSpy, userFindSpy, notificationCreateSpy, groupDeleteSpy, chatDeleteSpy;

  beforeAll(() => {
    findSpy = jest.spyOn(Group, 'find').mockImplementation((query) => {
      let mockData = [];
      if (query && query.tags && query.tags.$in && query.tags.$in.includes('sport')) {
        mockData = [{ _id: 'g1', groupName: 'Calcetto', members: ['u1'], createdAt: new Date(), tags: ['sport'] }];
      }

      return {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockData),
        then: function(resolve) { resolve(mockData); }
      };
    });

    findByIdSpy = jest.spyOn(Group, 'findById').mockImplementation((id) => {
      if (id === '123valid') {
        return Promise.resolve({ _id: '123valid', groupName: 'Test Group', members: ['u1'], chatId: 'c1', createdBy: 'u1' });
      }
      return Promise.resolve(null);
    });

    findByIdAndUpdateSpy = jest.spyOn(Group, 'findByIdAndUpdate').mockResolvedValue(true);
    chatUpdateSpy = jest.spyOn(Chat, 'findByIdAndUpdate').mockResolvedValue(true);
    userFindSpy = jest.spyOn(User, 'findById').mockResolvedValue({ displayName: 'Nuovo Utente' });
    notificationCreateSpy = jest.spyOn(Notification, 'create').mockResolvedValue(true);


    groupDeleteSpy = jest.spyOn(Group, 'findByIdAndDelete').mockResolvedValue(true);
    chatDeleteSpy = jest.spyOn(Chat, 'findByIdAndDelete').mockResolvedValue(true);
  });

  afterAll(() => {
    jest.restoreAllMocks(); 
  });

  // --- TEST GET /feed ---
  describe('GET /api/v1/groups/feed', () => {
    test('ritorna 200 e un array vuoto se non ci sono gruppi corrispondenti ai filtri', async () => {
      const response = await request(app).get('/api/v1/groups/feed?tags=cinema');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('ritorna 200 e la lista dei gruppi se trovati', async () => {
      const response = await request(app).get('/api/v1/groups/feed?tags=sport');
      expect(response.statusCode).toBe(200);
      expect(response.body[0].groupName).toBe('Calcetto');
    });
  });

  // --- TEST POST /:id/join ---
  describe('POST /api/v1/groups/:id/join', () => {
    test('ritorna 404 se il gruppo non esiste', async () => {
      const response = await request(app)
        .post('/api/v1/groups/invalid_id/join')
        .send({ userId: 'u2' });
      expect(response.statusCode).toBe(404);
    });

    test('ritorna 409 se l\'utente fa già parte del gruppo', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123valid/join')
        .send({ userId: 'u1' });
      expect(response.statusCode).toBe(409);
      expect(response.body.error).toBe('User is already a member');
    });

    test('ritorna 200 se l\'utente viene aggiunto con successo', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123valid/join')
        .send({ userId: 'u2' }); 
      expect(response.statusCode).toBe(200);
      expect(findByIdAndUpdateSpy).toHaveBeenCalled();
      expect(chatUpdateSpy).toHaveBeenCalled();
    });
  });

  // --- TEST DELETE /:id ---
  describe('DELETE /api/v1/groups/:id', () => {
    test('ritorna 404 se il gruppo da eliminare non esiste', async () => {
      const response = await request(app).delete('/api/v1/groups/invalid_id');
      expect(response.statusCode).toBe(404);
    });

    test('ritorna 200 ed elimina gruppo e chat associata', async () => {
      const response = await request(app).delete('/api/v1/groups/123valid');
      expect(response.statusCode).toBe(200);
      expect(groupDeleteSpy).toHaveBeenCalledWith('123valid');
      expect(chatDeleteSpy).toHaveBeenCalledWith('c1');
    });
  });
});