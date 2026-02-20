import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import User from './models/user.js';

describe('Test sulle rotte di Users (/api/v1/users)', () => {

  let findOneSpy;
  let findByIdAndUpdateSpy;
  let findByIdAndDeleteSpy;

  beforeAll(() => {
    findOneSpy = jest.spyOn(User, 'findOne').mockImplementation((criteria) => {
      const mockSelect = {
        select: jest.fn().mockImplementation(() => {
          if (criteria.uniqueName === 'utente_test') {
            return Promise.resolve({ uniqueName: 'utente_test', displayName: 'Mario Rossi' });
          }
          return Promise.resolve(null);
        })
      };
      return mockSelect;
    });

    findByIdAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockImplementation((id, updates, options) => {
      if (id === '123valid') {
        return Promise.resolve({ _id: '123valid', ...updates });
      }
      return Promise.resolve(null);
    });

    findByIdAndDeleteSpy = jest.spyOn(User, 'findByIdAndDelete').mockImplementation((id) => {
      if (id === '123valid') {
        return Promise.resolve({ _id: '123valid' });
      }
      return Promise.resolve(null);
    });
  });

  afterAll(() => {
    findOneSpy.mockRestore();
    findByIdAndUpdateSpy.mockRestore();
    findByIdAndDeleteSpy.mockRestore();
  });

  describe('GET /api/v1/users/search/handle', () => {
    test('ritorna 400 se manca la query', async () => {
      const response = await request(app).get('/api/v1/users/search/handle');
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Query missing');
    });

    test('ritorna 404 se l\'utente non esiste', async () => {
      const response = await request(app).get('/api/v1/users/search/handle?query=utente_inesistente');
      expect(response.statusCode).toBe(404);
    });

    test('ritorna 200 e i dati dell\'utente se trovato', async () => {
      const response = await request(app).get('/api/v1/users/search/handle?query=utente_test');
      expect(response.statusCode).toBe(200);
      expect(response.body.uniqueName).toBe('utente_test');
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    test('ritorna 404 se si tenta di aggiornare un utente inesistente', async () => {
      const response = await request(app)
        .patch('/api/v1/users/invalid_id')
        .send({ displayName: 'Nuovo Nome' });
      expect(response.statusCode).toBe(404);
    });

    test('ritorna 200 e aggiorna solo i campi permessi', async () => {
      const response = await request(app)
        .patch('/api/v1/users/123valid')
        .send({ displayName: 'Nuovo Nome', role: 'admin' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.displayName).toBe('Nuovo Nome');
      expect(response.body.role).toBeUndefined();
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    test('ritorna 404 se si tenta di eliminare un utente non trovato', async () => {
      const response = await request(app).delete('/api/v1/users/invalid_id');
      expect(response.statusCode).toBe(404);
    });

    test('ritorna 200 alla corretta eliminazione dell\'account', async () => {
      const response = await request(app).delete('/api/v1/users/123valid');
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Account deleted permanently');
    });
  });
});