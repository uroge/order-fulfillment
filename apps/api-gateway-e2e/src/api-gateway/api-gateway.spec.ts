import axios from 'axios';

describe('API Gateway', () => {
  it('returns app data and sets a correlation id', async () => {
    const res = await axios.get('/api/app');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
    expect(res.headers['x-correlation-id']).toBeTruthy();
  });

  it('echoes a provided correlation id', async () => {
    const correlationId = 'e2e-test-correlation-id';
    const res = await axios.get('/api/app', {
      headers: { 'x-correlation-id': correlationId },
    });

    expect(res.headers['x-correlation-id']).toBe(correlationId);
  });

  it('rejects protected route without jwt', async () => {
    const res = await axios.get('/api/test/protected', {
      validateStatus: () => true,
    });

    expect(res.status).toBe(401);
  });
});
