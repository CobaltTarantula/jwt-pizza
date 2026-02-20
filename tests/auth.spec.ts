import { test, expect } from 'playwright-test-coverage';
import { basicInit } from './basicInit'

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

test('not found', async ({ page }) => {
  await basicInit(page);

  await page.goto('/fake');

  await expect(page.getByText('Oops')).toBeVisible();
  await expect(
    page.getByText('It looks like we have dropped')
  ).toBeVisible();
});

test('about', async ({ page }) =>{
  await basicInit(page);
  await page.getByRole('link', { name: 'About' }).click();
  
  // validate
  await page.getByText('The secret sauce').click();
});

test('history', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'History' }).click();

  // validate
  await page.getByText('Mama Rucci, my my').click();
});

test("register", async ({ page }) => {
  await basicInit(page);
  const testName = randomName();

  await page.getByRole("link", { name: "Register" }).click();

  await expect(page.getByRole("heading")).toContainText("Welcome to the party");

  await page.getByRole("textbox", { name: "Full name" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill(testName);
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill(testName + "@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("randomPass");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByRole("heading")).toContainText("The web's best pizza");
});

test('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'pd' })).toBeVisible();
});

test('login then logout', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'pd' })).toBeVisible();

  await page.getByRole('navigation', { name: 'Global' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('navigation', { name: 'Global' }).click();
})

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away', { timeout: 10000 });
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2', { timeout: 10000 });
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('diner');

  // Click login and wait for navigation or main content update
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.getByRole('button', { name: 'Login' }).click(),
  ]);

  // Wait for order confirmation content
  const main = page.getByRole('main');
  await main.locator('text=Send me those 2 pizzas right now!').waitFor({ timeout: 15000 });

  // Assert order confirmation details
  await expect(main).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie', { timeout: 10000 });
  await expect(page.locator('tbody')).toContainText('Pepperoni', { timeout: 10000 });
  await expect(page.locator('tfoot')).toContainText('0.008 ₿', { timeout: 10000 });

  // Complete payment
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible({ timeout: 10000 });
});

test('diner dashboard', async ({ page }) => {
  await basicInit(page);

  // login
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  // diner dashboard
  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole("heading")).toContainText("Your pizza kitchen");
  await expect(page.getByRole("main")).toContainText("d@jwt.com");
  await expect(page.getByRole("main")).toContainText("diner");
});

test('login admin', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: '常' })).toBeVisible();
});

test('admin open then close franchise', async ({ page }) => {
  await basicInit(page);
  const randomFranchiseName = randomName();

  // login as admin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  // create franchise
  await expect(page.getByRole("button", { name: "Add Franchise" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Franchise" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Add Franchise");

  await page.getByRole("button", { name: "Add Franchise" }).click();
  await page.getByRole("textbox", { name: "franchise name" }).click();
  await page
    .getByRole("textbox", { name: "franchise name" })
    .fill(randomFranchiseName);
  await page.getByRole("textbox", { name: "franchisee admin email" }).click();
  await page
    .getByRole("textbox", { name: "franchisee admin email" })
    .fill("a@jwt.com");
  await expect(page.getByRole("heading")).toContainText("Create franchise");
  await expect(page.getByText("Want to create franchise?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create" })).toBeVisible();

  // validate franchise
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("table", {name: "Franchises"})).toContainText(randomFranchiseName);
  await expect(page.getByRole("table", {name: "Franchises"})).toContainText("常用名字");

  await expect(
    page
      .getByRole("row", { name: `${randomFranchiseName} 常用名字 Close` })
      .getByRole("button"),
  ).toBeVisible();
  await expect(page.getByRole("table", {name: "Franchises"})).toContainText("Close");
  await page
    .getByRole("row", { name: `${randomFranchiseName} 常用名字 Close` })
    .getByRole("button")
    .click();
  await expect(page.getByRole("heading")).toContainText("Sorry to see you go");
  await expect(page.getByRole("main")).toContainText("Close");
  await expect(page.getByRole("main")).toContainText(
    `Are you sure you want to close the ${randomFranchiseName} franchise? This will close all associated stores and cannot be restored. All outstanding revenue will not be refunded.`,
  );
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("table", {name: "Franchises"})).not.toContainText(randomFranchiseName);
});

test('admin delete user', async ({ page }) => {
  await basicInit(page);

  // login as admin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  const usersTable = page.getByRole('table', { name: /users/i });
  const userRow = usersTable.getByRole('row', { name: /alice@test\.com/i });

  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await userRow.getByRole('button', { name: 'Delete' }).click();

  await expect(
    usersTable.getByRole('row', { name: /alice@test\.com/i })
  ).toHaveCount(0);
});

test('admin filter users', async ({ page }) => {
  await basicInit(page);

  // login as admin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  const usersTable = page.getByRole('table', { name: /users/i });
  const tbody = usersTable.locator('tbody');

  // Filter for Alice
  await page.getByPlaceholder('Filter users').fill('alice@test.com');
  await page.getByRole('button', { name: 'Search' }).click();

  // Assert Alice row exists (tbody only)
  const aliceRow = tbody.getByRole('row', {
    name: /alice@test\.com/i,
  });

  await expect(aliceRow).toHaveCount(1);
  await expect(aliceRow).toBeVisible();

  // Assert Bob does NOT appear
  await expect(
    tbody.getByRole('row', { name: /bob@test\.com/i })
  ).toHaveCount(0);
});

test('admin next then previous page of users', async ({ page }) => {
  await basicInit(page);

  // Login as admin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  const usersTable = page.getByRole('table', { name: /users/i });
  const nextButton = usersTable.getByRole('button', { name: '»' });
  const prevButton = usersTable.getByRole('button', { name: '«' });

  // Wait for the first user row to be visible
  await expect(usersTable.locator('tbody tr').first()).toBeVisible();

  // Initial state
  await expect(prevButton).toBeDisabled();
  await expect(nextButton).toBeEnabled();

  // Go to next page
  await nextButton.click();

  // Wait for table to update for next page
  await expect(usersTable.locator('tbody tr').first()).toBeVisible();

  // After moving forward
  await expect(prevButton).toBeEnabled();

  // Go back
  await prevButton.click();

  // Wait for table to update for previous page
  await expect(usersTable.locator('tbody tr').first()).toBeVisible();

  // Back at start
  await expect(prevButton).toBeDisabled();
});

test('login franchisee', async ({ page }) =>{
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'pf' })).toBeVisible();
});

test('franchisee open then close store', async ({ page }) => {
  await basicInit(page);
  const randomStoreName = randomName();

  // login
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("franchisee");
  await page.getByRole("button", { name: "Login" }).click();

  // franchise dashboard
  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();

  // create store
  await expect(page.getByRole("main")).toContainText("Create store");
  await page.getByRole("button", { name: "Create store" }).click();
  await expect(page.getByRole("heading")).toContainText("Create store");
  await expect(page.locator("form")).toContainText("Cancel");
  await expect(page.locator("form")).toContainText("Create");
  await page.getByRole("textbox", { name: "store name" }).click();
  await page.getByRole("textbox", { name: "store name" }).fill(randomStoreName);
  await page.getByRole("button", { name: "Create" }).click();

  // validate store
  await expect(page.locator("tbody")).toContainText(randomStoreName);

  // delete store
  await page
    .getByRole("row", { name: `${randomStoreName} 0 ₿ Close` })
    .getByRole("button")
    .click();
  await expect(page.getByRole("heading")).toContainText("Sorry to see you go");
  await expect(page.getByRole("main")).toContainText(
    `Are you sure you want to close the pizzaPocket store ${randomStoreName} ? This cannot be restored. All outstanding revenue will not be refunded.`,
  );
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("tbody")).not.toContainText(randomStoreName);
});
