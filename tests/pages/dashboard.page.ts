import { type Page, type Locator } from '@playwright/test';

/**
 * Dashboard Page Object Model
 * Encapsulates all interactions with the main dashboard
 */
export class DashboardPage {
  readonly page: Page;
  readonly bookingButton: Locator;
  readonly aiConsultantButton: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  private testInitialized = false;

  constructor(page: Page) {
    this.page = page;
    // Use text-based locators for cards, testid for buttons
    this.bookingButton = page.getByText('Randevu Oluştur');
    this.aiConsultantButton = page.getByText('AI Stil Danışmanı');
    this.loginButton = page.getByTestId('login-button');
    this.logoutButton = page.getByTitle('Çıkış Yap'); // Using title attribute
  }

  async goto() {
    // Set test environment flag to skip intro animation (only once)
    if (!this.testInitialized) {
      await this.page.addInitScript(() => {
        (window as any).__PLAYWRIGHT__ = true;
      });
      this.testInitialized = true;
    }
    await this.page.goto('/');
  }

  async startBooking() {
    await this.bookingButton.click();
  }

  async openAIConsultant() {
    await this.aiConsultantButton.click();
  }

  async openLogin() {
    // Wait for button to be visible and click
    await this.loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.loginButton.click();
  }

  async logout() {
    await this.logoutButton.click();
  }

  async waitForIntroToComplete() {
    // In test mode, intro is skipped immediately via __PLAYWRIGHT__ flag
    // Just wait for React to mount
    await this.page.waitForFunction(() => {
      const root = document.getElementById('root');
      return root && root.innerHTML.length > 0;
    }, { timeout: 10000 });

    // Small wait for rendering to complete
    await this.page.waitForTimeout(500);
  }
}
