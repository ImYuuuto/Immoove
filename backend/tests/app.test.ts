import http from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app';

describe('request body limits', () => {
  test('returns 413 when a JSON request exceeds the configured limit', async () => {
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const { port } = server.address() as AddressInfo;
    const body = JSON.stringify({ value: 'x'.repeat(102_400) });

    try {
      const response = await new Promise<{ status: number; body: string }>(
        (resolve, reject) => {
          const request = http.request(
            {
              hostname: '127.0.0.1',
              port,
              path: '/api/v1/auth/login',
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body),
              },
            },
            (result) => {
              let responseBody = '';
              result.setEncoding('utf8');
              result.on('data', (chunk) => (responseBody += chunk));
              result.on('end', () =>
                resolve({ status: result.statusCode || 0, body: responseBody }),
              );
            },
          );
          request.on('error', reject);
          request.end(body);
        },
      );

      expect(response.status).toBe(413);
      expect(JSON.parse(response.body)).toEqual({
        error: { message: 'Request body exceeds the allowed size' },
      });
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});

describe('retired moderator routes', () => {
  test('does not expose the legacy moderation API', async () => {
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/moderation/queue`);
      expect(response.status).toBe(404);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
