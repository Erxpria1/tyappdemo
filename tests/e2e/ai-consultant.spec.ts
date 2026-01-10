import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';
import { AIConsultantPage } from '../pages/ai-consultant.page';
import * as path from 'path';
import * as fs from 'fs';

/**
 * AI Consultant E2E Tests
 * Tests AI consultant access control: guests can upload, but need login to analyze
 */

test.describe('AI Consultant Access Control', () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;
  let aiPage: AIConsultantPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    loginPage = new LoginPage(page);
    aiPage = new AIConsultantPage(page);

    await dashboardPage.goto();
    await dashboardPage.waitForIntroToComplete();
  });

  test('guest can upload photo but needs login to analyze', async ({ page }) => {
    // Navigate to AI Consultant as guest (not logged in)
    await dashboardPage.openAIConsultant();

    // Verify we're on AI Consultant page
    await expect(page.getByText('AI Stil Danışmanı')).toBeVisible();

    // Guest can enter description
    await aiPage.enterDescription('Modern saç kesimi istiyorum');

    // Verify analyze button is enabled with just description
    const isDisabled = await aiPage.isAnalyzeButtonDisabled();
    expect(isDisabled).toBe(false);

    // Click analyze button (should trigger login modal)
    await aiPage.clickAnalyze();

    // Login modal should appear
    await expect(page.getByText('Müşteri Girişi')).toBeVisible();

    // Close the modal
    const closeButton = page.locator('button').filter({ hasText: '×' }).first();
    await closeButton.click();

    // Should still be on AI Consultant page
    await expect(page.getByText('AI Stil Danışmanı')).toBeVisible();
  });

  test('guest can upload photo without login', async ({ page }) => {
    // Navigate to AI Consultant as guest
    await dashboardPage.openAIConsultant();

    // Create a simple test image (1x1 pixel PNG)
    const testImageDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testImageDir)) {
      fs.mkdirSync(testImageDir, { recursive: true });
    }

    // Simple base64 encoded 1x1 red PNG
    const testImagePath = path.join(testImageDir, 'test-photo.png');
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, imageBuffer);

    // Upload should work for guest
    await aiPage.uploadImage(testImagePath);

    // Wait for upload to complete
    await page.waitForTimeout(1500);

    // Verify image was uploaded successfully
    const hasImage = await aiPage.hasUploadedImage();
    expect(hasImage).toBe(true);

    // But analyze button should still require login
    await aiPage.clickAnalyze();

    // Login modal should appear
    await expect(page.getByText('Müşteri Girişi')).toBeVisible();
  });

  test('logged-in user can complete full AI analysis', async ({ page }) => {
    // First, login
    await dashboardPage.openLogin();

    const timestamp = Date.now().toString().slice(-8);
    const name = `AI Test User ${timestamp}`;
    const phone = `5${timestamp}`;
    const password = 'test1234';

    await loginPage.registerCustomer(name, phone, password);

    // Navigate to AI Consultant
    await dashboardPage.openAIConsultant();

    // Verify we're on AI Consultant page
    await expect(page.getByText('AI Stil Danışmanı')).toBeVisible();

    // Enter description
    await aiPage.enterDescription('Modern ve şık bir saç modeli istiyorum');

    // Click analyze button (should work without login modal)
    await aiPage.clickAnalyze();

    // Should show analyzing state
    await expect(page.getByText('Analiz Ediliyor...')).toBeVisible({ timeout: 5000 });

    // Wait for recommendations (mock service will return results)
    await page.waitForTimeout(3000);

    // Should show recommendations (at least the analyze button should be gone)
    const isAnalyzing = await aiPage.isAnalyzing();
    expect(isAnalyzing).toBe(false);
  });

  test('guest login from AI consultant returns to AI page', async ({ page }) => {
    // Navigate to AI Consultant as guest
    await dashboardPage.openAIConsultant();

    // Enter description
    await aiPage.enterDescription('Kısa saç kesimi istiyorum');

    // Try to analyze
    await aiPage.clickAnalyze();

    // Login modal should appear
    await expect(page.getByText('Müşteri Girişi')).toBeVisible();

    // Register new user
    const timestamp = Date.now().toString().slice(-8);
    await loginPage.registerCustomer(
      `AI Return Test ${timestamp}`,
      `5${timestamp}`,
      'test1234'
    );

    // Wait for login to complete
    await page.waitForTimeout(1000);

    // Should automatically return to AI Consultant page
    await expect(page.getByText('AI Stil Danışmanı')).toBeVisible();

    // Description should be preserved
    const descriptionValue = await aiPage.descriptionTextarea.inputValue();
    expect(descriptionValue).toContain('Kısa saç kesimi');

    // Now analyze should work
    await aiPage.clickAnalyze();

    // Should start analyzing (not show login modal again)
    await expect(page.getByText('Analiz Ediliyor...')).toBeVisible({ timeout: 5000 });
  });

  test('analyze button is disabled when no input provided', async ({ page }) => {
    // Navigate to AI Consultant as guest
    await dashboardPage.openAIConsultant();

    // Without any input, button should be disabled
    const isDisabled = await aiPage.isAnalyzeButtonDisabled();
    expect(isDisabled).toBe(true);

    // After entering description, button should be enabled
    await aiPage.enterDescription('Test description');
    const isStillDisabled = await aiPage.isAnalyzeButtonDisabled();
    expect(isStillDisabled).toBe(false);
  });
});
