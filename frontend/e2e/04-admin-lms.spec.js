import { test, expect } from '@playwright/test';

test.describe('Admin LMS Control Center', () => {

  test('should login as admin, navigate to admin dashboard, view stats and user table', async ({ page }) => {
    await page.goto('/');

    // Quick Demo Admin Login
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.getByRole('button', { name: /Quick Demo Admin Access/i }).click();
    await expect(page.getByText('⭐ Admin')).toBeVisible();

    // Click Admin button in Navbar
    await page.getByTitle('Admin Dashboard').click();

    // Verify Admin Dashboard header
    await expect(page.getByText('Admin LMS Control Center')).toBeVisible();
    await expect(page.getByText('Registered Users')).toBeVisible();
    await expect(page.getByText('Watch Hours')).toBeVisible();

    // User management search bar
    const userSearchInput = page.getByPlaceholder(/Search users by username or email…/i);
    await expect(userSearchInput).toBeVisible();
    await userSearchInput.fill('admin');

    // Switch to Real-Time Activity Feed tab
    await page.getByRole('button', { name: /Real-Time Activity Feed/i }).click();
    await expect(page.getByText('Platform Activity Stream')).toBeVisible();

    // Switch to Active Watch Parties tab
    await page.getByRole('button', { name: /Active Watch Parties/i }).click();
    await expect(page.getByText('Active Watch Party Rooms')).toBeVisible();

    // Return to Lobby via Exit LMS button
    await page.getByRole('button', { name: /Exit LMS/i }).click();
    await expect(page.getByText(/Next-Gen Watch Party Experience/i)).toBeVisible();
  });

});
