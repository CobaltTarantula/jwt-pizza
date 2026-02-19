import { Page } from "@playwright/test";
import { expect } from 'playwright-test-coverage';
import { User, Role } from "../src/service/pizzaService";


export async function basicInit(page: Page) {
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

    await page.route(/\/api\/user\/\d+$/, async (route) => {
        if (route.request().method() !== 'PUT') return route.fallback();

        const body = route.request().postDataJSON();
        if (!loggedInUser) return route.fulfill({ status: 401 });

        // Merge updates
        loggedInUser = { ...loggedInUser, ...body };

        // Return in the format frontend expects
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: { user: loggedInUser, token: 'abcdef' },
        });
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