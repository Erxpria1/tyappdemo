import { type Page, type Locator } from '@playwright/test';

/**
 * AI Hair Consultant Page Object Model
 * Encapsulates all interactions with the AI Consultant feature
 */
export class AIConsultantPage {
  readonly page: Page;
  readonly descriptionTextarea: Locator;
  readonly analyzeButton: Locator;
  readonly uploadInput: Locator;
  readonly uploadArea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.descriptionTextarea = page.getByPlaceholder(/Örn: Modern, kısa/i);
    this.analyzeButton = page.getByText('Stilimi Bul');
    this.uploadInput = page.locator('input[type="file"]');
    this.uploadArea = page.locator('.border-dashed').first();
  }

  async enterDescription(text: string) {
    await this.descriptionTextarea.fill(text);
  }

  async uploadImage(filePath: string) {
    await this.uploadInput.setInputFiles(filePath);
    // Wait for upload progress to complete
    await this.page.waitForTimeout(1000);
  }

  async clickAnalyze() {
    await this.analyzeButton.click();
  }

  async waitForRecommendations() {
    // Wait for recommendation cards to appear
    await this.page.waitForSelector('.glass-card', { timeout: 15000 });
  }

  async getRecommendationCount(): Promise<number> {
    const cards = await this.page.locator('.glass-card').count();
    // Subtract 1 for the main input card
    return Math.max(0, cards - 1);
  }

  async isAnalyzeButtonDisabled(): Promise<boolean> {
    return await this.analyzeButton.isDisabled();
  }

  async isAnalyzing(): Promise<boolean> {
    const analyzingText = this.page.getByText('Analiz Ediliyor...');
    return await analyzingText.isVisible();
  }

  async hasUploadedImage(): Promise<boolean> {
    // Check if preview image exists
    const preview = this.page.locator('img[alt="Preview"]');
    return await preview.isVisible();
  }
}
