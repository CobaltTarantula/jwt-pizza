// only works with backend running rn -> when pushing either have it running
// or change this up to mock

import { test, expect } from 'playwright-test-coverage';
import { basicInit } from './basicInit'

// test('updateUser', async ({ page }) => { 
//     const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
//     await page.goto('/');
//     await page.getByRole('link', { name: 'Register' }).click();
//     await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
//     await page.getByRole('textbox', { name: 'Email address' }).fill(email);
//     await page.getByRole('textbox', { name: 'Password' }).fill('diner');
//     await page.getByRole('button', { name: 'Register' }).click();

//     await page.getByRole('link', { name: 'pd' }).click();

//     await expect(page.getByRole('main')).toContainText('pizza diner');

//     await page.getByRole('button', { name: 'Edit' }).click();
//     await expect(page.locator('h3')).toContainText('Edit user');
//     await page.getByRole('button', { name: 'Update' }).click();

//     await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

//     await expect(page.getByRole('main')).toContainText('pizza diner');

//     await page.getByRole('button', { name: 'Edit' }).click();
//     await expect(page.locator('h3')).toContainText('Edit user');
//     await page.getByRole('textbox').first().fill('pizza dinerx');
//     await page.getByRole('button', { name: 'Update' }).click();

//     await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

//     await expect(page.getByRole('main')).toContainText('pizza dinerx');

//     await page.getByRole('link', { name: 'Logout' }).click();
//     await page.getByRole('link', { name: 'Login' }).click();

//     await page.getByRole('textbox', { name: 'Email address' }).fill(email);
//     await page.getByRole('textbox', { name: 'Password' }).fill('diner');
//     await page.getByRole('button', { name: 'Login' }).click();

//     await page.getByRole('link', { name: 'pd' }).click();

//     await expect(page.getByRole('main')).toContainText('pizza dinerx');
// });

test('update user name', async ({ page }) => {
    await basicInit(page);

    // login
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    // open profile
    await page.getByRole('link', { name: 'pd' }).click();
    await expect(page.getByRole('main')).toContainText('pizza diner');

    // open edit dialog
    await page.getByRole('button', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // edit name
    await dialog.getByRole('textbox').first().fill('pizza diner x');

    await dialog.getByRole('button', { name: 'Update' }).click();
    await expect(dialog).toBeHidden();

    // UI updates
    await expect(page.getByRole('main')).toContainText('pizza diner x');
});

test('update user email', async ({ page }) => {
    await basicInit(page);

    // login
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    // open profile
    await page.getByRole('link', { name: 'pd' }).click();
    await expect(page.getByRole('main')).toContainText('d@jwt.com');

    // open edit dialog
    await page.getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // fill email using input id
    await dialog.locator('input[type="email"]').fill('new@jwt.com');
    await dialog.getByRole('button', { name: 'Update' }).click();

    // wait for overlay to close
    await expect(dialog).toBeHidden();

    // validate main page reflects new email
    await expect(page.getByRole('main')).toContainText('new@jwt.com');
});

test('update user password', async ({ page }) => {
    await basicInit(page);

    // login
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    // open profile
    await page.getByRole('link', { name: 'pd' }).click();
    await expect(page.getByRole('main')).toContainText('d@jwt.com');

    // open edit dialog
    await page.getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // fill password using input id
    await dialog.locator('#password').fill('newPassword123');
    await dialog.getByRole('button', { name: 'Update' }).click();

    // wait for overlay to close
    await expect(dialog).toBeHidden();

    // validate main page still shows email (password is hidden)
    await expect(page.getByRole('main')).toContainText('d@jwt.com');
});

test('diner cannot change roles', async ({ page }) => {
    await basicInit(page);

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByRole('link', { name: 'pd' }).click();
    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(
        page.getByRole('combobox', { name: /role/i })
    ).toHaveCount(0);
});

/*
There are still other tests that we need to write
in order for us to be fully comfortable with the new update user functionality. 
This includes changing the password and email address, 
and changing user information using different roles. 
Go ahead and write those tests now and commit those changes also.
*/