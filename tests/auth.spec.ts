import { test, expect } from 'playwright-test-coverage';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
//await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();

await page.getByRole('link', { name: 'Register' }).click();
await page.getByRole('textbox', { name: 'Full name' }).click();
await page.getByRole('textbox', { name: 'Full name' }).fill('John Steven Spielberg');
await page.getByRole('textbox', { name: 'Email address' }).click();
await page.getByRole('textbox', { name: 'Email address' }).fill('spiel@gmail.com');
await page.getByRole('textbox', { name: 'Password' }).click();
await page.getByRole('textbox', { name: 'Password' }).fill('password');
await page.getByRole('button', { name: 'Register' }).click();
await page.getByRole('link', { name: 'JS' }).click();
await page.getByText('spiel@gmail.com').click();
});
