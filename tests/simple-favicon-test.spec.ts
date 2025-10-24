// @ts-nocheck
import { test, expect } from '@playwright/test';

test('Simple favicon test', async ({ page }) => {
  console.log('🧪 Testing favicon extraction...');

  // Go to dashboard
  await page.goto('https://bookmarkhub-web.vercel.app/dashboard');
  
  // Take screenshot to see current state
  await page.screenshot({ path: 'favicon-test-start.png', fullPage: true });
  
  // Look for any bookmark creation form or button
  const addButton = page.locator('button').filter({ hasText: /add|new|\+/i }).first();
  
  if (await addButton.isVisible({ timeout: 5000 })) {
    await addButton.click();
    
    // Fill form if it appears
    await page.fill('input[name="title"]', 'Test GitHub Favicon');
    await page.fill('input[name="url"]', 'https://github.com');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait and screenshot result
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'favicon-test-result.png', fullPage: true });
    
    console.log('✅ Test completed - check screenshots');
  } else {
    console.log('⚠️ No add button found');
    await page.screenshot({ path: 'favicon-test-no-button.png', fullPage: true });
  }
});
