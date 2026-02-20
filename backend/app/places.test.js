import { jest } from '@jest/globals';
import request from 'supertest';
import app from './app.js';
import Place from './models/place.js';

describe('Test sulle rotte di Places (/api/v1/places)', () => {
  beforeAll(() => {
    jest.spyOn(Place, 'findOne').mockImplementation((query) => {
      if (query.placeName === 'esistente123') {
        return Promise.resolve({ placeName: 'esistente123' });
      }
      return Promise.resolve(null);
    });

    jest.spyOn(Place.prototype, 'save').mockResolvedValue({ 
      _id: 'new_id', 
      placeName: 'Test' 
    });

    jest.spyOn(Place, 'findById').mockImplementation((id) => {
      if (id === '6581f1') return Promise.resolve({ _id: '6581f1', placeName: 'Parco' });
      return Promise.resolve(null);
    });
    jest.spyOn(Place, 'find').mockImplementation((filter) => {
      const isSport =
        filter.$or &&
        filter.$or.some(
          (o) =>
            (o.attivita && o.attivita.$regex === 'sport') ||
            (o.tags && o.tags.$regex === 'sport')
        );

      const results = isSport
        ? [{ _id: 'id1', placeName: 'Palestra', attivita: 'sport', tags: ['sport'], rev: [] }]
        : [];

      return {
        sort: jest.fn().mockResolvedValue(results)
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('POST /places - ritorna 409 se il luogo esiste già', async () => {
    const res = await request(app).post('/api/v1/places').send({
      placeName: 'esistente123',
      indirizzo: 'Via Roma 1',
      orarioApertura: '08:00',
      orarioChiusura: '20:00',
      tags: ['test']
    });
    expect(res.statusCode).toBe(409);
  });

  test('GET /places/:id - ritorna 404 se non trovato', async () => {
    const res = await request(app).get('/api/v1/places/id_non_valido');
    expect(res.statusCode).toBe(404);
  });

  test('GET /places - ritorna 200 con array vuoto se nessun match', async () => {
    const res = await request(app).get('/api/v1/places?tagInserito=cinema');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET /places - ritorna 200 e dati se il filtro combacia', async () => {
    const res = await request(app).get('/api/v1/places?q=sport');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].placeName).toBe('Palestra');
  });
});