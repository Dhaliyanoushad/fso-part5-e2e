const { test, expect, beforeEach, describe } = require("@playwright/test");

describe("Blog app", () => {
  beforeEach(async ({ page, request }) => {
    // reset db
    await request.post("http://localhost:3001/api/testing/reset");

    // create user
    await request.post("http://localhost:3001/api/users", {
      data: {
        username: "silsilah",
        name: "Test User",
        password: "solaman",
      },
    });

    await page.goto("http://localhost:5173");
  });

  test("Login form is shown", async ({ page }) => {
    await expect(page.getByPlaceholder("Username")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  describe("Login", () => {
    test("succeeds with correct credentials", async ({ page }) => {
      await page.getByPlaceholder("Username").fill("silsilah");
      await page.getByPlaceholder("Password").fill("solaman");
      await page.getByRole("button", { name: "Login" }).click();

      await expect(page.getByText("Welcome, Test User")).toBeVisible();
    });

    test("fails with wrong credentials", async ({ page }) => {
      await page.getByPlaceholder("Username").fill("silsilah");
      await page.getByPlaceholder("Password").fill("somewrongpassword");
      await page.getByRole("button", { name: "Login" }).click();

      await expect(
        page.getByText("Unauthorized: Invalid username or password.")
      ).toBeVisible();
      await expect(page.getByText("Welcome, Test User")).not.toBeVisible();
    });
  });

  describe("When logged in", () => {
    beforeEach(async ({ page }) => {
      await page.goto("http://localhost:5173");

      await page.getByPlaceholder("Username").fill("silsilah");
      await page.getByPlaceholder("Password").fill("solaman");
      await page.getByRole("button", { name: "login" }).click();

      await expect(page.getByText("Welcome, Test User")).toBeVisible();
    });

    test("a new blog can be created", async ({ page }) => {
      // Click the "New Blog" button (Togglable)
      await page.getByRole("button", { name: "New Blog" }).click();

      // Fill the blog creation form
      await page.getByPlaceholder("Title").fill("Test Blog");
      await page.getByPlaceholder("Author").fill("Test Author");
      await page.getByPlaceholder("URL").fill("https://testblog.com");

      // Submit the form
      await page.getByRole("button", { name: "Create" }).click();

      // Verify the blog appears in the list
      await expect(page.getByText("Test Blog", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Test Author", { exact: true })
      ).toBeVisible();
    });
  });
});
