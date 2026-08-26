import { test, expect } from '@playwright/test';

test.describe('User Watch History & Metrics', () => {

  test('should login and navigate to watch history page to view user watch metrics', async ({ page }) => {
    await page.goto('/');

    // Demo Admin Login
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.getByRole('button', { name: /Quick Demo Admin Access/i }).click();
    await expect(page.getByText('⭐ Admin')).toBeVisible();

    // Click History button in Navbar
    await page.getByTitle('Watch History').click();

    // Verify Watch History header & metric cards
    await expect(page.getByRole('heading', { name: 'Watch History', exact: true })).toBeVisible();
    await expect(page.getByText('Total Watch Time')).toBeVisible();
    await expect(page.getByText('Party Sessions')).toBeVisible();
    await expect(page.getByText('Sync Rating')).toBeVisible();

    // Return to Lobby via Back to Lobby button
    await page.getByRole('button', { name: /Back to Lobby/i }).click();
    await expect(page.getByText(/Next-Gen Watch Party Experience/i)).toBeVisible();
  });

});
