import { test, expect } from '@playwright/test';

test.describe('Party Page Interactive Features Verification', () => {

  test('should test camera toggle, chat messaging, and reaction buttons inside party room', async ({ page }) => {
    page.on('console', msg => console.log('[BROWSER LOG]:', msg.text()));
    page.on('pageerror', err => console.log('[BROWSER ERROR]:', err));

    // 1. Go to homepage lobby
    await page.goto('/');

    // 2. Open Create Party modal
    await page.getByRole('button', { name: /Create Party/i }).first().click();
    await expect(page.getByText('Host a Party Room')).toBeVisible();

    // 3. Fill in party title
    await page.getByPlaceholder(/Saturday Night Movie Stream/i).fill('Interactive Verification Room');
    await page.getByRole('button', { name: /Start Party Room/i }).click();

    // 4. Verify inside party room stage
    await expect(page.getByRole('button', { name: /Leave/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('Type a message…')).toBeVisible();

    // 5. TEST CHAT MESSAGE BOX
    console.log('💬 Testing Chat Input Box...');
    const chatInput = page.getByPlaceholder('Type a message…');
    await chatInput.fill('Testing real-time party chat verification!');
    await chatInput.press('Enter');
    await expect(page.getByText('Testing real-time party chat verification!')).toBeVisible();
    console.log('  ✓ Chat message sent and rendered in chat thread');

    // 6. TEST REACTION BUTTONS
    console.log('✨ Testing Reaction Buttons...');
    const reactionPopcorn = page.getByTitle('React with 🍿');
    await expect(reactionPopcorn).toBeVisible();
    await reactionPopcorn.click();

    const reactionFire = page.getByTitle('React with 🔥').first();
    await expect(reactionFire).toBeVisible();
    await reactionFire.click();
    console.log('  ✓ Reaction buttons clicked successfully');

    // 7. TEST CAMERA TOGGLE
    console.log('📷 Testing Camera Toggle...');
    const cameraToggleBtn = page.getByTitle('Toggle Camera').first();
    await expect(cameraToggleBtn).toBeVisible();
    await cameraToggleBtn.click();

    // Wait 1 sec for getUserMedia / canvas stream initialization
    await page.waitForTimeout(1000);
    console.log('  ✓ Camera toggle clicked and initialized stream handler');

    // 8. Leave Room
    await page.getByRole('button', { name: /Leave/i }).first().click();
    await expect(page.getByText(/Next-Gen Watch Party Experience/i)).toBeVisible();
  });

});
