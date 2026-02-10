// import { test, expect } from 'playwright-test-coverage';

// test('updateUser', async ({ page }) => { // only works with backend running rn -> when pushing either have it running
//     const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`; // or change this up to mock
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

/*
There are still other tests that we need to write
in order for us to be fully comfortable with the new update user functionality. 
This includes changing the password and email address, 
and changing user information using different roles. 
Go ahead and write those tests now and commit those changes also.
*/