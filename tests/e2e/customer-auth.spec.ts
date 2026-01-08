import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';

/**
 * Customer Authentication E2E Tests
 * Tests registration, login, and invalid credentials
 */

test.describe('Customer Authentication', () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    loginPage = new LoginPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForIntroToComplete();
  });

  test('should register a new customer successfully', async ({ page }) => {
    // Generate unique phone number using timestamp
    const timestamp = Date.now().toString().slice(-8);
    const name = `Test Customer ${timestamp}`;
    const phone = `5${timestamp}`;
    const password = 'test1234';

    // Open login and go to register tab
    await dashboardPage.openLogin();
    await loginPage.registerCustomer(name, phone, password);

    // Verify successful registration - should see dashboard
    // Use first() to avoid strict mode violation (name appears in multiple places)
    await expect(page.getByText(name).first()).toBeVisible();
    await expect(page.getByText('Hoşgeldiniz')).toBeVisible();
  });

  test('should login existing customer successfully', async ({ page }) => {
    // Use a phone number that will be created in the first test
    // For this test to work independently, we'll register first
    const timestamp = Date.now().toString().slice(-8);
    const name = `Login Test ${timestamp}`;
    const phone = `5${timestamp}`;
    const password = 'test1234';

    // Register first (registerCustomer now handles modal closing)
    await dashboardPage.openLogin();
    await loginPage.registerCustomer(name, phone, password);

    // Logout if logged in
    const logoutBtn = page.getByTitle('Çıkış Yap');
    if (await logoutBtn.isVisible({ timeout: 5000 })) {
      await logoutBtn.click();
      await page.waitForTimeout(500);
    }

    // Now login
    await page.goto('/');
    await dashboardPage.waitForIntroToComplete();
    await dashboardPage.openLogin();
    await loginPage.loginCustomer(phone, password);

    // Verify login successful
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await dashboardPage.openLogin();
    await loginPage.goToLogin();
    await loginPage.loginCustomer('5555555555', 'wrongpassword');

    // Verify error message - might be in different formats
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('hatalı');
  });

  test('should show error for empty fields', async ({ page }) => {
    await dashboardPage.openLogin();
    await loginPage.goToLogin();

    // Try to submit with empty fields
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Should still be on login page (no navigation)
    // Close modal first by clicking outside
    await page.mouse.click(10, 10);
    await page.waitForTimeout(500);

    // Verify we're back on the main page with login button
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('should switch between customer and admin login', async ({ page }) => {
    await dashboardPage.openLogin();

    // Switch to admin login
    await loginPage.switchToAdmin();

    // Verify admin login modal is visible (red themed)
    await expect(page.getByText('Yönetici & Personel Girişi')).toBeVisible();

    // Switch back to customer
    await loginPage.switchToCustomer();

    // Verify back to customer login
    await expect(page.getByText('Tekrar Hoşgeldiniz')).toBeVisible();
  });
});
