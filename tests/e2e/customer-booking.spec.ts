import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';
import { BookingWizardPage } from '../pages/booking-wizard.page';

/**
 * Customer Booking Flow E2E Tests
 * Tests complete booking flow, occupied slots, and cancellation
 */

test.describe('Customer Booking Flow', () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;
  let bookingWizard: BookingWizardPage;

  // Helper to login before each test
  async function setupCustomer(page: any) {
    dashboardPage = new DashboardPage(page);
    loginPage = new LoginPage(page);
    bookingWizard = new BookingWizardPage(page);

    await dashboardPage.goto();
    await dashboardPage.waitForIntroToComplete();

    // Register and login a customer
    const timestamp = Date.now().toString().slice(-8);
    const name = `Booking Test ${timestamp}`;
    const phone = `5${timestamp}`;
    const password = 'test1234';

    await dashboardPage.openLogin();
    await loginPage.registerCustomer(name, phone, password);

    return { name, phone };
  }

  test('should complete full booking flow', async ({ page }) => {
    await setupCustomer(page);

    // Start booking
    await dashboardPage.startBooking();

    // Step 1: Select service
    await bookingWizard.selectService('Premium Saç Kesimi');

    // Step 2: Select staff
    await bookingWizard.selectStaff('Ahmet Makas');

    // Step 3: Select date (tomorrow) and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await bookingWizard.selectDate(dateStr);
    await bookingWizard.selectTime('14:00');

    // Step 4: Confirm
    await bookingWizard.confirmBooking();

    // Verify booking successful - should see appointments section
    await expect(page.getByText('Randevularım')).toBeVisible();
  });

  test('should show occupied slots as disabled', async ({ page }) => {
    await setupCustomer(page);

    // First create a booking at 14:00
    await dashboardPage.startBooking();
    await bookingWizard.selectService('Sakal Tasarımı & Bakım');
    await bookingWizard.selectStaff('Ahmet Makas');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await bookingWizard.selectDate(dateStr);
    await bookingWizard.selectTime('14:00');
    await bookingWizard.confirmBooking();

    // Now try to book the same slot again
    await dashboardPage.startBooking();
    await bookingWizard.selectService('Cilt Bakımı & Maske');
    await bookingWizard.selectStaff('Ahmet Makas');
    await bookingWizard.selectDate(dateStr);

    // The 14:00 slot should be disabled
    const isDisabled = await bookingWizard.isSlotDisabled('14:00');
    expect(isDisabled).toBeTruthy();
  });

  test('should display correct booking summary', async ({ page }) => {
    await setupCustomer(page);

    await dashboardPage.startBooking();
    await bookingWizard.selectService('TYRANDEVU Özel Paket');
    await bookingWizard.selectStaff('Tarık Yalçın');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await bookingWizard.selectDate(dateStr);
    await bookingWizard.selectTime('15:30');

    // Check summary before confirming
    const summary = await bookingWizard.getSummary();
    expect(summary).toContain('TYRANDEVU Özel Paket');
    expect(summary).toContain('Tarık Yalçın');
    expect(summary).toContain(dateStr);
    expect(summary).toContain('15:30');
    expect(summary).toContain('₺1000');
  });

  test('should navigate back through booking steps', async ({ page }) => {
    await setupCustomer(page);

    await dashboardPage.startBooking();

    // Select service and go to staff
    await bookingWizard.selectService('Premium Saç Kesimi');

    // Go back
    const backButton = page.getByText('Geri');
    await backButton.click();

    // Should be back at service selection
    await expect(page.getByText('Premium Saç Kesimi')).toBeVisible();
  });

  test('should cancel booking with back button', async ({ page }) => {
    await setupCustomer(page);

    await dashboardPage.startBooking();

    // Click the close/X button
    const closeButton = page.locator('button[title="Kapat"]').first();
    await closeButton.click();

    // Should return to dashboard
    await expect(page.getByText('Hoşgeldiniz')).toBeVisible();
  });
});
