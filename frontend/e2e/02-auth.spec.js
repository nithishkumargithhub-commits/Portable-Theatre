import { test, expect } from '@playwright/test';

test.describe('Authentication & User Management', () => {

  test('should open auth modal and switch between Sign In and Create Account tabs', async ({ page }) => {
    await page.goto('/');

    // Click Sign In button in navbar
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Verify modal appears
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' }).nth(0)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // Switch to Create Account mode
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Join Portable Theatre')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

    // Close modal
    await page.getByLabel('Close modal').click();
    await expect(page.getByText('Join Portable Theatre')).not.toBeVisible();
  });

  test('should successfully log in via Quick Demo Admin Access', async ({ page }) => {
    await page.goto('/');

    // Open Auth Modal
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Click Demo Admin button
    await page.getByRole('button', { name: /Quick Demo Admin Access/i }).click();

    // Verify user is logged in as admin
    await expect(page.getByText('⭐ Admin')).toBeVisible();
    await expect(page.getByTitle('Admin Dashboard')).toBeVisible();
  });

  test('should allow logging out after logging in', async ({ page }) => {
    await page.goto('/');

    // Demo Admin Login
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.getByRole('button', { name: /Quick Demo Admin Access/i }).click();
    await expect(page.getByText('⭐ Admin')).toBeVisible();

    // Click Logout button
    await page.getByTitle('Sign Out').click();

    // Verify user is logged out
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByText('⭐ Admin')).not.toBeVisible();
  });

});
