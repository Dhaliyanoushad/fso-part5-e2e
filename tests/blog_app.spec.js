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
    test("a blog can be liked", async ({ page }) => {
      await page.getByRole("button", { name: "New Blog" }).click();
      await page.getByPlaceholder("Title").fill("Likeable Blog");
      await page.getByPlaceholder("Author").fill("Liker");
      await page.getByPlaceholder("URL").fill("https://likeblog.com");
      await page.getByRole("button", { name: "Create" }).click();

      await page.getByRole("button", { name: "view" }).click();

      await page.getByRole("button", { name: "like" }).click();

      await expect(page.getByTestId("likes")).toHaveText("1 likes");
    });
    test("a blog can be deleted by the user who created it", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Blog" }).click();

      await page.getByPlaceholder("Title").fill("Blog to be deleted");
      await page.getByPlaceholder("Author").fill("Author X");
      await page.getByPlaceholder("URL").fill("https://deletableblog.com");

      await page.getByRole("button", { name: "Create" }).click();

      await page.getByRole("button", { name: "view" }).click();

      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toContain("Remove blog");
        await dialog.accept();
      });

      await page.getByTestId("delete-button").click();
      await expect(
        page.getByText("Blog to be deleted", { exact: true })
      ).not.toBeVisible();
    });
  });

  describe("Remove Button", () => {
    beforeEach(async ({ page, request }) => {
      await request.post("http://localhost:3001/api/testing/reset");

      // Create user1 (creator)
      await request.post("http://localhost:3001/api/users", {
        data: {
          username: "creator",
          name: "Creator User",
          password: "secret",
        },
      });

      // Create user2 (another user)
      await request.post("http://localhost:3001/api/users", {
        data: {
          username: "otheruser",
          name: "Other User",
          password: "pass",
        },
      });

      // Log in as creator
      await page.goto("http://localhost:5173");
      await page.getByPlaceholder("Username").fill("creator");
      await page.getByPlaceholder("Password").fill("secret");
      await page.getByRole("button", { name: "login" }).click();

      // Create blog
      await page.getByRole("button", { name: "New Blog" }).click();
      await page.getByPlaceholder("Title").fill("Visible Blog");
      await page.getByPlaceholder("Author").fill("Author");
      await page.getByPlaceholder("URL").fill("https://example.com");
      await page.getByRole("button", { name: "Create" }).click();

      // Logout
      await page.getByRole("button", { name: "Logout" }).click();
    });

    test("creator sees delete button", async ({ page }) => {
      await page.getByPlaceholder("Username").fill("creator");
      await page.getByPlaceholder("Password").fill("secret");
      await page.getByRole("button", { name: "login" }).click();

      await page.getByRole("button", { name: "view" }).click();
      await expect(page.getByTestId("delete-button")).toBeVisible();
    });

    test("non-creator does not see delete button", async ({ page }) => {
      await page.getByPlaceholder("Username").fill("otheruser");
      await page.getByPlaceholder("Password").fill("pass");
      await page.getByRole("button", { name: "login" }).click();

      await page.getByRole("button", { name: "view" }).click();
      await expect(page.getByTestId("delete-button")).not.toBeVisible();
    });
  });

  test("blogs are ordered by number of likes (descending)", async ({
    page,
    request,
  }) => {
    // Reset database
    await request.post("http://localhost:3001/api/testing/reset");

    // Create user
    await request.post("http://localhost:3001/api/users", {
      data: {
        username: "silsilah",
        name: "Test User",
        password: "solaman",
      },
    });

    // Login
    await page.goto("http://localhost:5173");
    await page.getByPlaceholder("Username").fill("silsilah");
    await page.getByPlaceholder("Password").fill("solaman");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page.getByText("Welcome, Test User!")).toBeVisible();

    // Add blogs with different likes
    const blogs = [
      {
        title: "First Blog",
        author: "Author A",
        url: "http://a.com",
        likes: 2,
      },
      {
        title: "Second Blog",
        author: "Author B",
        url: "http://b.com",
        likes: 10,
      },
      {
        title: "Third Blog",
        author: "Author C",
        url: "http://c.com",
        likes: 5,
      },
    ];

    for (const blog of blogs) {
      await page.getByRole("button", { name: "New Blog" }).click();
      await page.getByPlaceholder("Title").fill(blog.title);
      await page.getByPlaceholder("Author").fill(blog.author);
      await page.getByPlaceholder("URL").fill(blog.url);

      await page.getByRole("button", { name: "Create" }).click();

      const viewBtn = page.getByRole("button", { name: /view/i }).last();
      await viewBtn.click();

      for (let i = 0; i < blog.likes; i++) {
        await page.getByRole("button", { name: "like" }).last().click();
      }

      await page.reload(); // Ensure sorting is refreshed
    }

    // Expand all to get likes
    const viewButtons = await page.getByRole("button", { name: /view/i }).all();
    for (const button of viewButtons) {
      await button.click();
    }

    // Grab likes
    const likeTexts = await page
      .locator('[data-testid="likes"]')
      .allTextContents();
    const likeCounts = likeTexts.map((text) => parseInt(text.split(" ")[0]));
    const sorted = [...likeCounts].sort((a, b) => b - a);

    expect(likeCounts).toEqual(sorted);
  });
});
