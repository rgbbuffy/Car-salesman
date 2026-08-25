import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4173' });

test('Car Salesman end-to-end workflow verification', async ({ page }) => {
  // 1. Visit App
  await page.goto('/');

  // 2. Verify Cockpit Header & Title
  await expect(page.locator('h1')).toContainText('Owner Decision Queue');

  // 3. Verify Initial Pending Escalation
  await expect(page.getByText('Action Required')).toBeVisible();
  await expect(page.getByText('minimum floor price')).toBeVisible();

  // 4. Switch to Vehicles Tab
  await page.click('button:has-text("Vehicles")');
  await expect(page.getByText('Verified Vehicle Specifications')).toBeVisible();
  await expect(page.getByText('NHTSA_vPIC_API').first()).toBeVisible();

  // 5. Switch to Buyer Chat Tab
  await page.click('button:has-text("Buyer Chat")');
  await expect(page.getByText('Active Buyer Leads')).toBeVisible();

  // 6. Simulate Below-Floor Offer
  await page.click('button:has-text("Submit Below-Floor Offer")');
  await expect(page.getByText('requires owner review').first()).toBeVisible();

  // 7. Request Appointment in Chat
  await page.click('button:has-text("Request Appointment / Test Drive")');
  await expect(page.getByText('tentative slot for Tomorrow').first()).toBeVisible();

  // 8. Return to Today Inbox & Approve Offer
  await page.click('button:has-text("Today Inbox")');
  await page.getByRole('button', { name: /Approve Offer/i }).first().click();

  // 9. Take Screenshot for Verification
  await page.screenshot({ path: 'verification.png', fullPage: true });
});
