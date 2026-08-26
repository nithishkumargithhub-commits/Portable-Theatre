import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('WebRTC Screen Sharing Verification', () => {

  test('should successfully start screen sharing, display live stream UI, and stop screen sharing', async ({ page }) => {
    const artifactDir = 'C:/Users/nithi/.gemini/antigravity-ide/brain/af142660-f941-49f2-aa79-35cdf2ce6a44';

    // 1. Navigate to home
    await page.goto('/');

    // 2. Open Create Party modal
    await page.getByRole('button', { name: /Create Party/i }).first().click();
    await expect(page.getByText('Host a Party Room')).toBeVisible();

    // 3. Create room
    await page.getByPlaceholder(/Saturday Night Movie Stream/i).fill('Screen Sharing Test Room');
    await page.getByPlaceholder(/Tell viewers what you're watching…/i).fill('Automated WebRTC screen share test');
    await page.getByRole('button', { name: /Start Party Room/i }).click();

    // 4. Verify inside party room
    await expect(page.getByRole('button', { name: /Leave/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder('Type a message…')).toBeVisible();

    // 5. Trigger Screen Share
    const shareButton = page.getByTitle('Share Screen');
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    // 6. Verify Screen Sharing Canvas appears with live badges
    await expect(page.getByText('LIVE SCREEN SHARE')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('YOU ARE SHARING YOUR SCREEN')).toBeVisible();

    // 7. Verify video element is rendered inside screen share canvas
    const screenShareVideo = page.locator('video:not(.hidden)');
    await expect(screenShareVideo).toBeVisible();

    // 8. Capture screenshot of working Screen Share UI
    await page.screenshot({ path: path.join(artifactDir, 'screen_share_active.png'), fullPage: true });

    // 9. Stop Screen Sharing
    const stopButton = page.getByTitle('Stop Screen Share');
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // 10. Verify Screen Share badges disappear and normal player returns
    await expect(page.getByText('LIVE SCREEN SHARE')).not.toBeVisible({ timeout: 10000 });

    // 11. Capture screenshot after stopping
    await page.screenshot({ path: path.join(artifactDir, 'screen_share_stopped.png'), fullPage: true });
  });

});
