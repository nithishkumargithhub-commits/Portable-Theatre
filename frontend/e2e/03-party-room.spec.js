import { test, expect } from '@playwright/test';

test.describe('Party Room Creation, Playback & Real-Time Chat', () => {

  test('should create a party room, send chat messages, trigger reactions, and leave room', async ({ page }) => {
    page.on('console', msg => console.log('[BROWSER LOG]:', msg.text()));
    page.on('pageerror', err => console.log('[BROWSER ERROR]:', err));

    await page.goto('/');

    // Click Create Party button in Navbar
    await page.getByRole('button', { name: /Create Party/i }).first().click();

    // Verify Create Party modal is open
    await expect(page.getByText('Host a Party Room')).toBeVisible();

    // Fill in room details
    await page.getByPlaceholder(/Saturday Night Movie Stream/i).fill('Playwright Test Watch Party');
    await page.getByPlaceholder(/Tell viewers what you're watching…/i).fill('Automated end-to-end testing room');

    // Launch Party
    await page.getByRole('button', { name: /Start Party Room/i }).click();

    // Should navigate into Party Room stage
    await expect(page.getByRole('button', { name: /Leave/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('Type a message…')).toBeVisible();

    // Test sending chat message
    const chatInput = page.getByPlaceholder('Type a message…');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('Hello everyone! Testing room chat.');
    await chatInput.press('Enter');

    // Verify chat message appears
    await expect(page.getByText('Hello everyone! Testing room chat.')).toBeVisible();

    // Test sending reaction emoji (e.g. 🍿) by title attribute
    await page.getByTitle('React with 🍿').click();

    // Leave party room back to lobby
    await page.getByRole('button', { name: /Leave/i }).first().click();

    // Should be back on Lobby page
    await expect(page.getByText(/Next-Gen Watch Party Experience/i)).toBeVisible();
  });

});
