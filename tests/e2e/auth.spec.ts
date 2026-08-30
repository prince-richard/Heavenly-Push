import { test, expect } from '@playwright/test';

/**
 * Auth gate smoke tests.
 *
 * The app is gated behind an AuthScreen. Before anything else works we
 * need to confirm that the auth screen renders and that "Continue as
 * Guest" lets us through into the main app.
 */
test.describe('Auth screen', () => {
  test('renders Google and guest sign-in options', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: /sign in with google/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /continue as guest/i }),
    ).toBeVisible();
  });

  test('guest sign-in unlocks the home screen', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('button', { name: /continue as guest/i })
      .click();

    // Home screen shows the "Heavenly Push" headline and the mic hero.
    await expect(page.getByText(/heavenly push/i).first()).toBeVisible();
  });
});
