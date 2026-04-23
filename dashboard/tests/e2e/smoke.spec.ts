import { expect, test } from "@playwright/test"

const E2E_EMAIL = process.env.E2E_EMAIL ?? "admin@koperasi.id"
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "admin123"

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel("Email").fill(E2E_EMAIL)
  await page.getByLabel("Password").fill(E2E_PASSWORD)
  await page.getByRole("button", { name: "Masuk" }).click()

  await expect(page).toHaveURL(/\/dashboard\/?$/)
}

test("@smoke login redirects to dashboard", async ({ page }) => {
  await login(page)
  await expect(page.getByText("Dashboard Overview")).toBeVisible()
})

test("@smoke dashboard renders quick menu", async ({ page }) => {
  await login(page)
  await expect(page.getByText("Quick Menu")).toBeVisible()
  await expect(page.getByText("Total Nasabah Aktif")).toBeVisible()
})

test("@smoke nasabah list flow", async ({ page }) => {
  await login(page)
  await page.goto("/nasabah")

  await expect(page).toHaveURL(/\/nasabah(?:\?.*)?$/)
  await expect(page.getByRole("heading", { name: "Master Nasabah" })).toBeVisible()
  await expect(page.getByText("Daftar Nasabah")).toBeVisible()
})
