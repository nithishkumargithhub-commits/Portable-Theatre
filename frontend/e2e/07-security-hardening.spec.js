import { test, expect } from '@playwright/test';

test.describe('Strict Production Security Hardening Verification', () => {

  test('username starting with admin must NOT receive admin role (RBAC Fix)', async ({ request }) => {
    const timestamp = Date.now();
    const username = 'admin_tester_' + timestamp;
    const email = 'admin_tester_' + timestamp + '@example.com';

    // Register user with username starting with 'admin'
    const regRes = await request.post('/api/auth/register', {
      data: {
        username: username,
        email: email,
        password: 'Password123!'
      }
    });

    expect(regRes.status()).toBe(200);
    const regData = await regRes.json();
    
    // VERIFY: Role MUST be 'user', never automatically 'admin'
    expect(regData.user.role).toBe('user');

    // VERIFY: Attempting to access admin stats endpoint with this user token MUST return 403 Forbidden
    const adminAccessRes = await request.get('/api/admin/stats', {
      headers: {
        Authorization: 'Bearer ' + regData.access_token
      }
    });
    expect(adminAccessRes.status()).toBe(403);
  });

  test('genuine admin account can access admin endpoints', async ({ request }) => {
    // Authenticate via demo admin in dev environment
    const adminAuthRes = await request.post('/api/auth/demo-admin');
    expect(adminAuthRes.status()).toBe(200);
    const adminData = await adminAuthRes.json();

    expect(adminData.user.role).toBe('admin');

    // VERIFY: Genuine admin token receives 200 OK on admin stats
    const statsRes = await request.get('/api/admin/stats', {
      headers: {
        Authorization: 'Bearer ' + adminData.access_token
      }
    });
    expect(statsRes.status()).toBe(200);
    const stats = await statsRes.json();
    expect(stats).toHaveProperty('total_users');
    expect(stats).toHaveProperty('total_parties');
  });

  test('invalid or malformed JWT token is rejected with 401 Unauthorized', async ({ request }) => {
    const res = await request.get('/api/admin/stats', {
      headers: {
        Authorization: 'Bearer invalid_forged_jwt_token_payload'
      }
    });
    expect(res.status()).toBe(401);
  });

});
