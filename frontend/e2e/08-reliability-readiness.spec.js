import { test, expect } from '@playwright/test';

test.describe('Production Reliability & Deployment Readiness Verification', () => {

  test('backend health check endpoint returns 200 OK and healthy status', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:8008/health');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('environment');
    expect(data).toHaveProperty('timestamp');
  });

  test('non-existent endpoint returns safe 404 without internal server error or stack trace', async ({ request }) => {
    const res = await request.get('/api/invalid-nonexistent-endpoint-xyz');
    expect(res.status()).toBe(404);
  });

});
