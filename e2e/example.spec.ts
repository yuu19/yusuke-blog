import { test, expect } from '@playwright/test';

test.describe('blog e2e', () => {
	test('home to article detail navigation works', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1, name: '技術メモ' })).toBeVisible();

		const firstArticleCard = page.locator('a[href^="/articles/"]').first();
		await expect(firstArticleCard).toBeVisible();

		const cardTitle =
			(await firstArticleCard.getByRole('heading').first().textContent())?.trim() ?? '';
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

		await expect(searchInput).toBeEnabled();
		const initialHitCount = await hitCount.innerText();

		await searchInput.fill('__no_hit_keyword__');
		await expect(hitCount).toHaveText('0件ヒット: 記事 0件 / 本 0冊');
		await expect(page.getByText('該当する記事はありません。')).toBeVisible();
		await expect(page.getByText('該当する本はありません。')).toBeVisible();

		await page.getByRole('button', { name: 'フィルターをリセット' }).click();
		await expect(searchInput).toHaveValue('');
		await expect(hitCount).toHaveText(initialHitCount);
		await expect(page.getByText('該当する記事はありません。')).not.toBeVisible();
		await expect(page.locator('a[href^="/articles/"]').first()).toBeVisible();

		// A second search must still work after the animated list is restored.
		await searchInput.fill('__another_no_hit_keyword__');
		await expect(hitCount).toHaveText('0件ヒット: 記事 0件 / 本 0冊');
		await expect(page.getByText('該当する記事はありません。')).toBeVisible();
		await searchInput.fill('');
		await expect(hitCount).toHaveText(initialHitCount);
	});

	test('search stays disabled until hydration finishes', async ({ page }) => {
		let releaseScripts!: () => void;
		const scriptsReady = new Promise<void>((resolve) => {
			releaseScripts = resolve;
		});
		await page.route('**/*', async (route) => {
			if (route.request().resourceType() === 'script') await scriptsReady;
			await route.continue();
		});

		const searchInput = page.getByPlaceholder('タイトル・概要・タグで検索...');
		try {
			await page.goto('/articles', { waitUntil: 'commit' });
			await expect(searchInput).toBeVisible();
			await expect(searchInput).toBeDisabled();
		} finally {
			releaseScripts();
		}

		await expect(searchInput).toBeEnabled();
		await searchInput.fill('__no_hit_keyword__');
		await expect(page.locator('p', { hasText: '件ヒット' }).first()).toHaveText(
			'0件ヒット: 記事 0件 / 本 0冊'
		);
		await expect(page.getByText('該当する記事はありません。')).toBeVisible();
		await expect(page.getByText('該当する本はありません。')).toBeVisible();
	});

	test('profile links to SubTrack service page', async ({ page }) => {
		await page.goto('/profiles');
		await page.getByRole('link', { name: /SubTrack を見る/ }).click();

		await expect(page).toHaveURL(/\/services\/subtrack$/);
		await expect(page.getByRole('heading', { level: 1, name: 'SubTrack' })).toBeVisible();

		const serviceLink = page.getByRole('link', { name: 'SubTrackを開く' }).first();
		await expect(serviceLink).toHaveAttribute('href', /^https:\/\/subtracknotify\.com\/?$/);
	});
});
