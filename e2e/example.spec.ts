import { test, expect } from '@playwright/test';

test.describe('blog e2e', () => {
	test('home to article detail navigation works', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1, name: '技術メモ' })).toBeVisible();

		const firstArticleCard = page.locator('a[href^="/articles/"]').first();
		await expect(firstArticleCard).toBeVisible();

		const cardTitle = (await firstArticleCard.getByRole('heading').first().textContent())?.trim() ?? '';
		await firstArticleCard.click();

		await expect(page).toHaveURL(/\/articles\/[^/]+$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		if (cardTitle.length > 0) {
			await expect(page.getByRole('heading', { level: 1 })).toContainText(cardTitle);
		}
	});

	test('search and reset on /articles works', async ({ page }) => {
		await page.goto('/articles');
		await expect(page.getByRole('heading', { level: 1, name: '記事と本を検索' })).toBeVisible();

		const hitCount = page.locator('p', { hasText: '件ヒット' }).first();
		const searchInput = page.getByPlaceholder('タイトル・概要・タグで検索...');

		await expect(hitCount).toBeVisible();
		await expect(searchInput).toBeVisible();

		await searchInput.fill('__no_hit_keyword__');
		await expect(hitCount).toContainText('0件ヒット');
		await expect(page.getByText('該当する記事はありません。')).toBeVisible();
		await expect(page.getByText('該当する本はありません。')).toBeVisible();

		await page.getByRole('button', { name: 'フィルターをリセット' }).click();
		await expect(searchInput).toHaveValue('');
		await expect(hitCount).not.toContainText('0件ヒット');
	});
});
