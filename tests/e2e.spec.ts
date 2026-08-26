import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4173' });

test('Car Salesman complete navigation and cockpit E2E workflow', async ({ page }) => {
  // 1. Visit App
  await page.goto('/');

  // 2. Dashboard View
  await expect(page.getByText('Dealership Overview')).toBeVisible();
  await expect(page.getByText('Active Inventory')).toBeVisible();

  // 3. Navigate to Inventory
  await page.click('button:has-text("Inventory")');
  await expect(page.getByText('Honda')).toBeVisible();
  await expect(page.getByText('Tesla')).toBeVisible();

  // 4. Open Sales Cockpit
  await page.click('button:has-text("Sales Cockpit")');
  await expect(page.getByText('NHTSA Verified Vehicle Specifications')).toBeVisible();
  await expect(page.getByText('Owner Pricing Guardrails')).toBeVisible();

  // 5. Navigate to Leads
  await page.click('button:has-text("Leads")');
  await expect(page.getByText('Lead Management')).toBeVisible();
  await expect(page.getByText('Alex Rivera')).toBeVisible();

  // 6. Navigate to Appointments
  await page.click('button:has-text("Appointments")');
  await expect(page.getByText('Scheduled Test Drive Appointments')).toBeVisible();

  // 7. Navigate to Escalations Queue & Approve Offer
  await page.click('button:has-text("Escalations Queue")');
  await expect(page.getByText('Owner Escalation Queue')).toBeVisible();
  await page.getByRole('button', { name: /Approve Offer/i }).first().click();

  // 8. Navigate to Settings
  await page.click('button:has-text("Settings")');
  await expect(page.getByText('Application & Service Settings')).toBeVisible();

  // Take Verification Screenshot
  await page.screenshot({ path: 'verification.png', fullPage: true });
});
