import { Page } from "@playwright/test";
import { expect } from 'playwright-test-coverage';
import { User, Role } from "../src/service/pizzaService";

export async function basicInit(page: Page) {
    let loggedInUser: User | undefined;

    // --- Users ---
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
            roles: [{ role: Role.Diner }, { role: Role.Franchisee, objectId: '1' }],
        },
        'a@jwt.com': {
            id: '5',
            name: '常用名字',
            email: 'a@jwt.com',
            password: 'admin',
            roles: [{ role: Role.Admin }],
        },
    };

    // Start with the three users
    let mockUsers: User[] = Object.values(validUsers);

    mockUsers = [
        ...mockUsers,
        { id: '7', name: 'Alice', email: 'alice@test.com', password: 'alice', roles: [{ role: Role.Diner }] },
        { id: '8', name: 'Bob', email: 'bob@test.com', password: 'bob', roles: [{ role: Role.Diner }] },
        { id: '9', name: 'Jim', email: 'jim@test.com', password: 'jim', roles: [{ role: Role.Diner }] },
        { id: '10', name: 'Liza', email: 'liza@test.com', password: 'liza', roles: [{ role: Role.Diner }] },
        { id: '11', name: 'Ellie', email: 'ellie@test.com', password: 'ellie', roles: [{ role: Role.Diner }] },
        { id: '12', name: 'Mito', email: 'chondria@test.com', password: 'powerhouse', roles: [{ role: Role.Diner }] },
        { id: '13', name: 'Cat', email: 'black@test.com', password: 'unlucky', roles: [{ role: Role.Diner }] },
        { id: '14', name: 'Double', email: 'seven@test.com', password: 'doubleseven', roles: [{ role: Role.Diner }] },
    ];

    // --- Stores ---
    let mockStores = [
        { id: 1, name: "Lehi", totalRevenue: 1200.5 },
        { id: 2, name: "Provo", totalRevenue: 850.0 },
    ];

    // --- Franchises ---
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

    // --- GET logged-in user ---
    await page.route('*/**/api/user/me', async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();
        await route.fulfill({ status: loggedInUser ? 200 : 401, contentType: 'application/json', json: loggedInUser || {} });
    });

    // --- UPDATE & DELETE USER ---
    await page.route(/\/api\/user\/\d+$/, async route => {
        const method = route.request().method();
        const userId = route.request().url().split('/').pop()!;
        if (method === 'PUT') {
            const body = route.request().postDataJSON();
            mockUsers = mockUsers.map(u => u.id === userId ? { ...u, ...body } : u);
            if (loggedInUser?.id === userId) loggedInUser = { ...loggedInUser, ...body };
            await route.fulfill({ status: 200, json: { user: mockUsers.find(u => u.id === userId), token: 'abcdef' } });
            return;
        }
        if (method === 'DELETE') {
            mockUsers = mockUsers.filter(u => u.id !== userId);
            if (loggedInUser?.id === userId) loggedInUser = undefined;
            await route.fulfill({ status: 200, json: { message: 'user deleted' } });
            return;
        }
        return route.fallback();
    });

    // --- LIST USERS ---
    await page.route(/\/api\/user(\?.*)?$/, async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();

        const url = new URL(route.request().url());
        const pageParam = parseInt(url.searchParams.get('page') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const filter = url.searchParams.get('filter')?.replace(/\*/g, '').toLowerCase() || '';

        // Filter users
        const filteredUsers = mockUsers.filter(u =>
            u.name?.toLowerCase().includes(filter) ||
            u.email?.toLowerCase().includes(filter)
        );

        // Slice current page
        const pagedUsers = filteredUsers.slice(pageParam * limit, (pageParam + 1) * limit);

        // Check if **next page has any users**
        const nextPageUsers = filteredUsers.slice((pageParam + 1) * limit, (pageParam + 2) * limit);
        const more = nextPageUsers.length > 0;

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: { users: pagedUsers, more }
        });
    });

    // --- AUTH ---
    await page.route("*/**/api/auth", async (route) => {
        const method = route.request().method();
        const body = route.request().postDataJSON();

        // REGISTER
        if (method === 'POST') {
            loggedInUser = { id: '6', name: body.name, email: body.email, password: body.password, roles: [{ role: Role.Diner }] };
            mockUsers.push(loggedInUser);
            await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
            return;
        }

        // LOGIN
        if (method === 'PUT') {
            const user = validUsers[body.email];
            if (!user || user.password !== body.password) return route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
            loggedInUser = user;
            await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
            return;
        }

        return route.fallback();
    });

    // --- MENU ---
    await page.route('*/**/api/order/menu', async (route) => {
        expect(route.request().method()).toBe('GET');
        await route.fulfill({
            json: [
                { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
                { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
            ]
        });
    });

    // --- FRANCHISEE FRANCHISE ---
    await page.route(/\/api\/franchise\/\d+$/, async (route) => {
        await route.fulfill({
            json: [
                { id: 2, name: "pizzaPocket", admins: [{ id: 4, name: "pizza franchisee", email: "f@jwt.com" }], stores: mockStores }
            ]
        });
    });

    // --- FRANCHISES LIST ---
    await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: { franchises: mockFranchises } });
    });

    // --- ADD FRANCHISE ---
    await page.route(/\/api\/franchise$/, async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        const reqBody = route.request().postDataJSON();
        const newFranchise = { id: Math.floor(Math.random() * 1000), name: reqBody.name, admins: [{ id: 5, name: "常用名字", email: "a@jwt.com" }], stores: [] };
        mockFranchises.push(newFranchise);
        await route.fulfill({ status: 200, json: newFranchise });
    });

    // --- DELETE FRANCHISE ---
    await page.route(/\/api\/franchise\/\d+$/, async (route) => {
        if (route.request().method() !== 'DELETE') return route.fallback();
        const urlParts = route.request().url().split('/');
        const franchiseId = parseInt(urlParts[urlParts.length - 1]);
        mockFranchises = mockFranchises.filter(f => f.id !== franchiseId);
        await route.fulfill({ status: 200, json: { message: 'franchise deleted' } });
    });

    // --- CREATE STORE ---
    await page.route(/\/api\/franchise\/\d+\/store$/, async (route) => {
        expect(route.request().method()).toBe('POST');
        const body = route.request().postDataJSON();
        const storeResp = { id: Math.floor(Math.random() * 1000), franchiseId: body.franchiseId, name: body.name, totalRevenue: 0 };
        mockStores.push(storeResp);
        await route.fulfill({ status: 200, json: storeResp });
    });

    // --- DELETE STORE ---
    await page.route(/\/api\/franchise\/\d+\/store\/\d+$/, async (route) => {
        expect(route.request().method()).toBe('DELETE');
        const storeId = parseInt(route.request().url().split('/').pop()!);
        mockStores = mockStores.filter(s => s.id !== storeId);
        await route.fulfill({ status: 200, json: { message: 'store deleted' } });
    });

    // --- ORDER ---
    await page.route("*/**/api/order", async (route) => {
        const method = route.request().method();
        if (method === 'POST') {
            const orderReq = route.request().postDataJSON();
            await route.fulfill({ json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' } });
            return;
        }
        if (method === 'GET') {
            await route.fulfill({
                json: {
                    dinerId: 2,
                    orders: [
                        { id: 166, franchiseId: 2, storeId: 4, date: "2025-09-12T22:14:00.000Z", items: [{ id: 782, menuId: 1, description: "Veggie", price: 0.0038 }] },
                        { id: 167, franchiseId: 2, storeId: 3, date: "2025-09-12T22:16:33.000Z", items: [{ id: 783, menuId: 1, description: "Veggie", price: 0.0038 }] },
                    ],
                    page: 1
                }
            });
            return;
        }
        return route.fallback();
    });

    await page.goto('/');
}