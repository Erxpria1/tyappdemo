import { test, expect } from '@playwright/test';

/**
 * Debug Test - Check if page loads correctly
 */
test('debug - page loads and login button exists', async ({ page }) => {
  // Set test environment flag to skip intro animation
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT__ = true;
  });

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Go to page - use commit to ensure HTML is loaded
  await page.goto('/', { waitUntil: 'commit' });

  // Wait for React to mount
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.innerHTML.length > 0;
  }, { timeout: 15000 });

  // Wait a bit for app to stabilize
  await page.waitForTimeout(6000);

  // Take screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

  // Try to find the login button by testid
  const loginBtn = page.getByTestId('login-button');
  const count = await loginBtn.count();
  console.log('Login button count:', count);

  // Check if intro is still showing
  const intro = page.locator('.fixed.inset-0.z-\\[100\\]');
  const introCount = await intro.count();
  console.log('Intro overlay count:', introCount);

  // Try clicking if found
  if (count > 0) {
    console.log('Login button found! Clicking...');
    await loginBtn.click();
    console.log('Clicked successfully!');
  } else {
    // Debug: what's on page?
    const bodyText = await page.locator('body').textContent();
    console.log('Body contains "Giriş":', bodyText?.includes('Giriş'));
    console.log('Body contains "Hoşgeldiniz":', bodyText?.includes('Hoşgeldiniz'));
  }
});
