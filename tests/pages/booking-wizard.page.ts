import { type Page, type Locator } from '@playwright/test';

/**
 * Booking Wizard Page Object Model
 * Handles the 4-step booking process
 */
export class BookingWizardPage {
  readonly page: Page;
  readonly serviceCards: Locator;
  readonly staffCards: Locator;
  readonly dateInput: Locator;
  readonly timeSlots: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly modalOverlay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.serviceCards = page.locator('[class*="glass-card"]');
    this.dateInput = page.locator('input[type="date"]');
    this.timeSlots = page.locator('button[class*="rounded"]');
    this.confirmButton = page.getByText('Randevuyu Onayla');
    this.cancelButton = page.getByRole('button').filter({ hasText: 'Kapat' });
    // Modal overlay selector (z-[60])
    this.modalOverlay = page.locator('.z-\\[60\\]').first();
  }

  /**
   * Select a service by name
   */
  async selectService(serviceName: string) {
    const card = this.page.getByText(serviceName);
    await card.click();
  }

  /**
   * Select a staff member by name
   */
  async selectStaff(staffName: string) {
    const card = this.page.getByText(staffName);
    await card.click();
  }

  /**
   * Select a date (YYYY-MM-DD format)
   */
  async selectDate(date: string) {
    await this.dateInput.fill(date);
  }

  /**
   * Select a time slot (HH:MM format)
   */
  async selectTime(time: string) {
    const slot = this.page.getByText(time);
    await slot.click();
  }

  /**
   * Confirm the booking
   */
  async confirmBooking() {
    await this.confirmButton.click();

    // Wait for modal to close after successful booking
    await this.page.waitForTimeout(2000);

    // Ensure modal is closed
    const isVisible = await this.modalOverlay.isVisible().catch(() => false);
    if (isVisible) {
      // Try pressing Escape to close
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Check if a time slot is disabled (occupied)
   */
  async isSlotDisabled(time: string): Promise<boolean> {
    const slot = this.page.getByText(time);
    const isDisabled = await slot.isDisabled();
    const hasDisabledClass = await slot.evaluate(el =>
      el.classList.contains('bg-red-500/10') ||
      el.classList.contains('cursor-not-allowed')
    );
    return isDisabled || hasDisabledClass;
  }

  /**
   * Get the summary text from confirmation page
   */
  async getSummary(): Promise<string> {
    const summary = this.page.locator('.bg-white\\/5.rounded-xl');
    return await summary.textContent() || '';
  }
}
