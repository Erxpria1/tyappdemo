import { type Page, type Locator } from '@playwright/test';

/**
 * Login Modals Page Object Model
 * Handles both Customer and Admin login flows
 */
export class LoginPage {
  readonly page: Page;
  readonly customerLoginButton: Locator;
  readonly adminLoginButton: Locator;
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly registerTab: Locator;
  readonly loginTab: Locator;
  readonly submitButton: Locator;
  readonly switchToAdminButton: Locator;
  readonly switchToCustomerButton: Locator;
  readonly adminPhoneInput: Locator;
  readonly adminPasswordInput: Locator;
  readonly modalOverlay: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use more specific locators to avoid strict mode violations
    this.registerTab = page.locator('button').filter({ hasText: 'Kayıt Ol' }).first();
    this.loginTab = page.locator('button').filter({ hasText: 'Giriş Yap' }).first();
    // Registration form inputs
    this.nameInput = page.locator('input[placeholder*="Örn: Ahmet"]');
    this.phoneInput = page.locator('input[placeholder*="0555"]');
    this.passwordInput = page.locator('input[placeholder*="••••"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.switchToAdminButton = page.getByText('Personel / Yönetici Girişi');
    this.switchToCustomerButton = page.getByText('Müşteri Girişine Dön');
    // Admin login form inputs
    this.adminPhoneInput = page.locator('input[placeholder*="Kullanıcı No"]');
    this.adminPasswordInput = page.locator('input[placeholder*="Şifre"]');
    // Modal overlay (z-[60])
    this.modalOverlay = page.locator('.z-\\[60\\]').first();
  }

  /**
   * Open customer login modal
   */
  async openCustomerLogin() {
    // Use the main login button with data-testid to avoid conflicts
    const loginBtn = this.page.getByTestId('login-button');
    await loginBtn.click();
  }

  /**
   * Ensure any open modal is closed before proceeding
   */
  async ensureModalClosed() {
    const isVisible = await this.modalOverlay.isVisible().catch(() => false);
    if (isVisible) {
      // Try multiple methods to close modal
      // 1. Press Escape
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);

      // 2. If still open, click outside (top left corner)
      const stillVisible = await this.modalOverlay.isVisible().catch(() => false);
      if (stillVisible) {
        await this.page.mouse.click(10, 10);
        await this.page.waitForTimeout(500);
      }

      // 3. Final wait for modal to be hidden
      await this.modalOverlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  }

  /**
   * Switch to registration tab
   */
  async goToRegister() {
    await this.registerTab.click({ force: true });
  }

  /**
   * Switch to login tab within modal
   */
  async goToLogin() {
    await this.loginTab.click({ force: true });
  }

  /**
   * Register a new customer
   */
  async registerCustomer(name: string, phone: string, password: string) {
    await this.goToRegister();
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    // Wait for form submission to process
    await this.page.waitForTimeout(1500);

    // Ensure modal is closed
    await this.ensureModalClosed();
  }

  /**
   * Login as customer
   */
  async loginCustomer(phone: string, password: string) {
    await this.goToLogin();
    // Customer login uses phoneInput and passwordInput (not admin inputs)
    await this.phoneInput.fill(phone);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    // Wait for form submission to process
    await this.page.waitForTimeout(1500);

    // Ensure modal is closed after successful login
    await this.ensureModalClosed();
  }

  /**
   * Switch to admin login
   */
  async switchToAdmin() {
    await this.switchToAdminButton.click({ force: true });
  }

  /**
   * Switch back to customer login
   */
  async switchToCustomer() {
    await this.switchToCustomerButton.click({ force: true });
  }

  /**
   * Login as admin
   */
  async loginAdmin(phone: string, password: string) {
    await this.adminPhoneInput.fill(phone);
    await this.adminPasswordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Get error message if present
   */
  async getErrorMessage(): Promise<string | null> {
    const errorBox = this.page.locator('.text-red-400, .bg-red-400\\/10');
    if (await errorBox.count() > 0) {
      return await errorBox.textContent() || null;
    }
    return null;
  }
}
