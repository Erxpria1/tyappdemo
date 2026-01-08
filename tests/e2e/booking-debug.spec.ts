import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';

/**
 * Booking Wizard Debug Test
 */
test('debug - check booking wizard staff display', async ({ page }) => {
  // Set test environment flag
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT__ = true;
  });

  // Listen for console messages
  page.on('console', msg => {
    if (msg.text().includes('[MOCK]') || msg.text().includes('staff') || msg.text().includes('Staff')) {
      console.log('Browser console:', msg.text());
    }
  });

  const dashboardPage = new DashboardPage(page);
  const loginPage = new LoginPage(page);

  await dashboardPage.goto();
  await dashboardPage.waitForIntroToComplete();

  // Login as customer (register first)
  const timestamp = Date.now().toString().slice(-8);
  const name = `Booking Debug ${timestamp}`;
  const phone = `5${timestamp}`;
  const password = 'test1234';

  await dashboardPage.openLogin();
  await loginPage.registerCustomer(name, phone, password);

  // Wait for modal to close
  await page.waitForTimeout(2000);

  // Click booking button
  await dashboardPage.startBooking();

  // Wait for wizard to appear
  await page.waitForTimeout(2000);

  // Take screenshot to see what's displayed
  await page.screenshot({ path: 'booking-debug-screenshot.png', fullPage: true });

  // Check if we're on the service selection step first
  const serviceStep = page.locator('text=Hizmet Seçimi');
  const serviceStepVisible = await serviceStep.count();
  console.log('Service step visible:', serviceStepVisible);

  // If on service step, click a service to go to staff step
  if (serviceStepVisible > 0) {
    console.log('On service step, clicking a service...');
    await page.locator('text=Saç Kesimi').first().click();
    await page.waitForTimeout(1000);
  }

  // Now check for staff step
  const staffStep = page.locator('text=Personel Seçimi');
  const staffStepVisible = await staffStep.count();
  console.log('Staff step visible:', staffStepVisible);

  // Take another screenshot
  await page.screenshot({ path: 'booking-debug-screenshot2.png', fullPage: true });

  // Check if any staff cards are visible
  const staffCards = page.locator('text=Ahmet Makas');
  const count = await staffCards.count();
  console.log('Staff cards found:', count);

  // Check if loading message is visible
  const loadingMsg = page.locator('text=Personel listesi yükleniyor');
  const loadingVisible = await loadingMsg.count();
  console.log('Loading message visible:', loadingVisible);

  // List all text content on page
  const bodyText = await page.locator('body').textContent();
  console.log('Page contains "Ahmet":', bodyText?.includes('Ahmet'));
  console.log('Page contains "Makas":', bodyText?.includes('Makas'));
  console.log('Page contains "Stylist":', bodyText?.includes('Stylist'));
});
