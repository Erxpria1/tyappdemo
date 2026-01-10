import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';
import { BookingWizardPage } from '../pages/booking-wizard.page';

/**
 * Guest Booking Flow E2E Tests
 * Tests the complete guest booking flow: select service -> login -> complete booking
 */

test.describe('Guest Booking Flow', () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;
  let bookingWizard: BookingWizardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    loginPage = new LoginPage(page);
    bookingWizard = new BookingWizardPage(page);

    await dashboardPage.goto();
    await dashboardPage.waitForIntroToComplete();
  });

  test('should complete guest booking flow with login', async ({ page }) => {
    // Start booking as guest (not logged in)
    await dashboardPage.startBooking();

    // Step 1: Select service
    await bookingWizard.selectService('Premium Saç Kesimi');

    // Step 2: Select staff
    await bookingWizard.selectStaff('Ahmet Makas');

    // Step 3: Select date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await bookingWizard.selectDate(dateStr);
    await bookingWizard.selectTime('14:00');

    // Should now be at GUEST_CONFIRM step with 2 options
    await expect(page.getByText('Randevu Detayları')).toBeVisible();
    await expect(page.getByText('Giriş Yap ve Randevuyu Tamamla')).toBeVisible();
    await expect(page.getByText('WhatsApp ile Randevu Planla')).toBeVisible();

    // Click "Login and Complete" button
    const loginButton = page.getByText('Giriş Yap ve Randevuyu Tamamla');
    await loginButton.click();

    // Login modal should appear
    await expect(page.getByText('Müşteri Girişi')).toBeVisible();

    // Register a new customer
    const timestamp = Date.now().toString().slice(-8);
    const name = `Guest User ${timestamp}`;
    const phone = `5${timestamp}`;
    const password = 'test1234';

    await loginPage.registerCustomer(name, phone, password);

    // After login, should automatically transition to CONFIRM step
    // (not GUEST_CONFIRM anymore because now user is logged in)
    await page.waitForTimeout(1000); // Give time for state transition

    await expect(page.getByText('Randevu Özeti')).toBeVisible();
    await expect(page.getByText('Randevuyu Onayla')).toBeVisible();

    // Confirm the booking
    const confirmButton = page.getByText('Randevuyu Onayla');
    await confirmButton.click();

    // Should see success and return to dashboard with appointments
    await page.waitForTimeout(1000);
    await expect(page.getByText('Randevularım')).toBeVisible();
    await expect(page.getByText('Premium Saç Kesimi')).toBeVisible();
  });

  test('should allow guest to use WhatsApp booking', async ({ page }) => {
    // Start booking as guest
    await dashboardPage.startBooking();

    // Quick selections
    await bookingWizard.selectService('Sakal Tasarımı & Bakım');
    await bookingWizard.selectStaff('Tarık Yalçın');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await bookingWizard.selectDate(dateStr);
    await bookingWizard.selectTime('16:00');

    // Should be at GUEST_CONFIRM
    await expect(page.getByText('WhatsApp ile Randevu Planla')).toBeVisible();

    // Click WhatsApp button (we won't actually open WhatsApp in test)
    const whatsappButton = page.getByText('WhatsApp ile Randevu Planla');

    // Verify button exists and is clickable
    await expect(whatsappButton).toBeVisible();
    await expect(whatsappButton).toBeEnabled();
  });

  test('should preserve booking selection during login', async ({ page }) => {
    // Start booking as guest
    await dashboardPage.startBooking();

    // Select specific service and details
    await bookingWizard.selectService('Cilt Bakımı & Maske');
    await bookingWizard.selectStaff('Ahmet Makas');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await bookingWizard.selectDate(dateStr);
    await bookingWizard.selectTime('11:30');

    // Click login button from GUEST_CONFIRM
    await page.getByText('Giriş Yap ve Randevuyu Tamamla').click();

    // Register new user
    const timestamp = Date.now().toString().slice(-8);
    const name = `Preserve Test ${timestamp}`;
    const phone = `5${timestamp}`;
    const password = 'test1234';

    await loginPage.registerCustomer(name, phone, password);

    // Wait for transition
    await page.waitForTimeout(1000);

    // Verify the booking details are still preserved in the CONFIRM step
    const summary = await bookingWizard.getSummary();
    expect(summary).toContain('Cilt Bakımı & Maske');
    expect(summary).toContain('Ahmet Makas');
    expect(summary).toContain(dateStr);
    expect(summary).toContain('11:30');
  });

  test('should show correct progress bar for guest vs logged-in', async ({ page }) => {
    // As guest, start booking
    await dashboardPage.startBooking();

    // Select through to time selection
    await bookingWizard.selectService('Premium Saç Kesimi');
    await bookingWizard.selectStaff('Ahmet Makas');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await bookingWizard.selectDate(dateStr);
    await bookingWizard.selectTime('15:00');

    // Should show "Randevu Detayları" title for guest
    await expect(page.getByText('Randevu Detayları')).toBeVisible();

    // Now login
    await page.getByText('Giriş Yap ve Randevuyu Tamamla').click();

    const timestamp = Date.now().toString().slice(-8);
    await loginPage.registerCustomer(
      `Progress Test ${timestamp}`,
      `5${timestamp}`,
      'test1234'
    );

    await page.waitForTimeout(1000);

    // After login, should show "Randevu Özeti" title (logged-in version)
    await expect(page.getByText('Randevu Özeti')).toBeVisible();
  });
});
