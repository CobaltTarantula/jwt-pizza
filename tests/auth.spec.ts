import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';
import { User, Role } from '../src/service/pizzaService';

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    'd@jwt.com': {
      id: '3',
      name: 'pizza diner',
      email: 'd@jwt.com',
      password: 'diner',
      roles: [{ role: Role.Diner }]
    },
    'f@jwt.com': {
      id: '4',
      name: 'pizza franchisee',
      email: 'f@jwt.com',
      password: 'franchisee',
      roles: [{role: Role.Diner}, { role: Role.Franchisee, objectId: '1' }],
    },
    'a@jwt.com': {
      id: '5',
      name: '常用名字',
      email: 'a@jwt.com',
      password: 'admin',
      roles: [{ role: Role.Admin }],
    },
  };

  let mockStores = [
    { id: 1, name: "Lehi", totalRevenue: 1200.5 },
    { id: 2, name: "Provo", totalRevenue: 850.0 },
  ];

  let mockFranchises = [
    {
      id: 2,
      name: "LotaPizza",
      stores: [
        { id: 4, name: "Lehi" },
        { id: 5, name: "Springville" },
        { id: 6, name: "American Fork" },
      ],
    },
    { id: 3, name: "PizzaCorp", stores: [{ id: 7, name: "Spanish Fork" }] },
    { id: 4, name: "topSpot", stores: [] },
  ];

  await page.route("*/**/api/auth", async (route) => {
    const method = route.request().method();

    // register
    if (method === "POST") {
      const body = route.request().postDataJSON();

      loggedInUser = {
        id: "6",
        name: body.name,
        email: body.email,
        password: body.password,
        roles: [{ role: Role.Diner }],
      };

      return route.fulfill({
        json: { user: loggedInUser, token: "abcdef" },
      });
    }

    // login
    if (method === "PUT") {
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];

      if (!user || user.password !== loginReq.password) {
        return route.fulfill({ status: 401, json: { error: "Unauthorized" } });
      }

      loggedInUser = user;
      return route.fulfill({
        json: { user: loggedInUser, token: "abcdef" },
      });
    }

    return route.fallback();
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  // Get a franchisee's franchise
  await page.route(/\/api\/franchise\/\d+$/, async (route) => {
    const userFranchiseRes = [
      {
        id: 2,
        name: "pizzaPocket",
        admins: [{ id: 4, name: "pizza franchisee", email: "f@jwt.com" }],
        stores: mockStores,
      },
    ];

    await route.fulfill({ json: userFranchiseRes });
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }

    const franchiseRes = {
      franchises: mockFranchises
    };
    
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  // Add franchises
  await page.route(/\/api\/franchise$/, async (route) => {
    if (route.request().method() !== "POST") {
      return route.fallback();
    }

    const requestBody = route.request().postDataJSON();
    const newFranchise = {
      id: Math.floor(Math.random() * 1000),
      name: requestBody.name,
      admins: [{ id: 5, name: "常用名字", email: "a@jwt.com" }],
      stores: [],
    };

    mockFranchises.push(newFranchise);

    await route.fulfill({
      status: 200,
      json: newFranchise,
    });
  });

  // Delete franchise
  await page.route(/\/api\/franchise\/\d+$/, async (route) => {
    if (route.request().method() !== "DELETE") {
      return route.fallback();
    }

    const urlParts = route.request().url().split("/");
    const franchiseIdToDelete = parseInt(urlParts[urlParts.length - 1]);

    mockFranchises = mockFranchises.filter((f) => f.id !== franchiseIdToDelete);

    await route.fulfill({
      status: 200,
      json: { message: "franchise deleted" },
    });
  });

  // Create store
  await page.route(/\/api\/franchise\/\d+\/store$/, async (route) => {
    const requestBody = route.request().postDataJSON();
    const storeResponse = {
      id: Math.floor(Math.random() * 1000),
      franchiseId: requestBody.franchiseId,
      name: requestBody.name,
      totalRevenue: 0,
    };

    mockStores.push(storeResponse);
    expect(route.request().method()).toBe("POST");
    await route.fulfill({
      status: 200,
      json: storeResponse,
    });
  });

  // Delete store
  await page.route(/\/api\/franchise\/\d+\/store\/\d+$/, async (route) => {
    const urlParts = route.request().url().split("/");
    const storeIdToDelete = parseInt(urlParts[urlParts.length - 1]);

    expect(route.request().method()).toBe("DELETE");

    mockStores = mockStores.filter((store) => store.id !== storeIdToDelete);

    await route.fulfill({
      status: 200,
      json: { message: "store deleted" },
    });
  });

  // Order a pizza.
  await page.route('*/**/api/order', async (route) => {
    const orderReq = route.request().postDataJSON();
    const orderRes = {
      order: { ...orderReq, id: 23 },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: orderRes });
  });

  // Get a person's orders
  await page.route("*/**/api/order", async (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }

    const orderRes = {
      dinerId: 2,
      orders: [
        {
          id: 166,
          franchiseId: 2,
          storeId: 4,
          date: "2025-09-12T22:14:00.000Z",
          items: [
            {
              id: 782,
              menuId: 1,
              description: "Veggie",
              price: 0.0038,
            },
          ],
        },
        {
          id: 167,
          franchiseId: 2,
          storeId: 3,
          date: "2025-09-12T22:16:33.000Z",
          items: [
            {
              id: 783,
              menuId: 1,
              description: "Veggie",
              price: 0.0038,
            },
          ],
        },
      ],
      page: 1,
    };

    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: orderRes });
  });

  await page.goto('/');
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
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
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
  await expect(page.locator("tfoot")).toContainText("Submit");
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
  await expect(page.getByRole("table")).toContainText(randomFranchiseName);
  await expect(page.getByRole("table")).toContainText("常用名字");

  await expect(
    page
      .getByRole("row", { name: `${randomFranchiseName} 常用名字 Close` })
      .getByRole("button"),
  ).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Close");
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
  await expect(page.getByRole("table")).not.toContainText(randomFranchiseName);
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
