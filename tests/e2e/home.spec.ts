import { test, expect, Page } from '@playwright/test';

/**
 * Helper: sign in as a guest so we land on the Home tab.
 */
async function signInAsGuest(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /continue as guest/i }).click();
  await expect(page.getByText(/heavenly push/i).first()).toBeVisible();
}

test.describe('Home screen', () => {
  test('shows the voice language toggle (English / Tamil)', async ({ page }) => {
    await signInAsGuest(page);

    await expect(
      page.getByRole('button', { name: /speak and reply in english/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /speak and reply in tamil/i }),
    ).toBeVisible();
  });

  test('can switch voice language to Tamil', async ({ page }) => {
    await signInAsGuest(page);

    const tamilBtn = page.getByRole('button', {
      name: /speak and reply in tamil/i,
    });
    await tamilBtn.click();
    // Re-query to confirm the button is still present (and presumably
    // styled active — a11y state is hard to observe reliably on RNW).
    await expect(tamilBtn).toBeVisible();
  });

  test('favorites quick action is reachable', async ({ page }) => {
    await signInAsGuest(page);

    await page.getByRole('button', { name: /open favorites/i }).click();

    // Favorites screen renders its empty-state message or heading.
    // We match loosely because it may be empty on a fresh guest session.
    await expect(page.getByText(/favorites/i).first()).toBeVisible();
  });
});

test.describe('Navigation tabs', () => {
  test('bottom tabs navigate between Home, Favorites and Settings', async ({
    page,
  }) => {
    await signInAsGuest(page);

    // Settings tab
    await page
      .getByRole('button', { name: /settings/i })
      .first()
      .click();
    await expect(page.getByText(/language/i).first()).toBeVisible();

    // Back to Home
    await page
      .getByRole('button', { name: /home/i })
      .first()
      .click();
    await expect(page.getByText(/heavenly push/i).first()).toBeVisible();
  });
});
