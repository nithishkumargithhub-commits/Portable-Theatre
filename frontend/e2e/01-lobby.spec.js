import { test, expect } from '@playwright/test';

test.describe('Cinema Lobby & Navigation', () => {

  test('should load the lobby home page with brand header and navigation controls', async ({ page }) => {
    await page.goto('/');

    // Check page title & brand heading
    await expect(page).toHaveTitle(/Portable Theatre/i);
    await expect(page.getByRole('heading', { name: 'PORTABLE THEATRE' })).toBeVisible();

    // Check key navigation inputs & buttons
    await expect(page.getByPlaceholder(/Room code…/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Party/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('should display cinema hero banner and features', async ({ page }) => {
    await page.goto('/');

    // Check hero header text & CTA
    await expect(page.getByText('Next-Gen Watch Party Experience')).toBeVisible();
    await expect(page.getByText('Stream Together')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start a Party Room/i })).toBeVisible();
  });

  test('should load public party rooms section', async ({ page }) => {
    await page.goto('/');

    // Check Live Public Parties section
    await expect(page.getByText('Live Public Parties')).toBeVisible();
  });

});
