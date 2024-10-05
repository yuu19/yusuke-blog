import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
    alias: {
      $articles: path.resolve('./articles')
    }
  },
	build: {
	  rollupOptions: {
			external: ['fs'],
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
