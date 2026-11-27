import { expect, test } from "@playwright/test";

test("home page shows the CRM heading and tab title", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "CRM" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("CRM — Digital System Pros");
});
