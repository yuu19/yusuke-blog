import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1200;
const HEIGHT = 630;
const ROOT = process.cwd();
const ARTICLES_DIR = path.resolve(ROOT, 'articles');
const OUTPUT_DIR = path.resolve(ROOT, 'static/og/articles');
const FONT_CACHE_DIR = path.resolve('/tmp', 'yusuke-blog-og-fonts');

const fontPathCache = new Map();
const emojiCache = new Map();

const escapeXml = (value) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const charUnits = (char) => (/^[\u0000-\u00ff]$/.test(char) ? 1 : 2);

function wrapTitle(title, maxUnits = 26, maxLines = 3) {
	const chars = Array.from(title.trim());
	const lines = [];
	let current = '';
	let units = 0;
	let truncated = false;

	for (let i = 0; i < chars.length; i += 1) {
		const ch = chars[i];
		if (ch === '\n') {
			if (current.trim()) lines.push(current.trim());
			current = '';
			units = 0;
			if (lines.length >= maxLines) {
				truncated = i < chars.length - 1;
				break;
			}
			continue;
		}

		const nextUnits = charUnits(ch);
		if (units + nextUnits > maxUnits) {
			if (current.trim()) lines.push(current.trim());
			current = ch;
			units = nextUnits;
			if (lines.length >= maxLines) {
				truncated = true;
				break;
			}
		} else {
			current += ch;
			units += nextUnits;
		}
	}

	if (lines.length < maxLines && current.trim()) {
		lines.push(current.trim());
	}

	if (lines.length > maxLines) {
		lines.length = maxLines;
		truncated = true;
	}

	if (truncated && lines.length > 0) {
		const idx = lines.length - 1;
		lines[idx] = `${lines[idx].replace(/[\s.。]+$/u, '')}…`;
	}

	return lines.length > 0 ? lines : ['Untitled'];
}

async function fetchWithRetry(url, options = {}, retries = 3) {
	let lastError;
	for (let i = 0; i < retries; i += 1) {
		try {
			const response = await fetch(url, options);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status} for ${url}`);
			}
			return response;
		} catch (error) {
			lastError = error;
			await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
		}
	}
	throw lastError;
}

async function getSubsetFontFile(text) {
	if (fontPathCache.has(text)) return fontPathCache.get(text);

	fs.mkdirSync(FONT_CACHE_DIR, { recursive: true });
	const hash = crypto.createHash('sha1').update(text).digest('hex');
	const fontPath = path.join(FONT_CACHE_DIR, `${hash}.woff2`);

	if (!fs.existsSync(fontPath)) {
		const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent('Noto Sans JP')}:wght@700&text=${encodeURIComponent(text)}`;
		const cssRes = await fetchWithRetry(cssUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0'
			}
		});
		const css = await cssRes.text();
		const match = css.match(/url\((https:[^)]+)\)/);
		if (!match) {
			throw new Error(`Unable to resolve subset font URL for text: ${text}`);
		}

		const fontRes = await fetchWithRetry(match[1]);
		const fontBuffer = Buffer.from(await fontRes.arrayBuffer());
		fs.writeFileSync(fontPath, fontBuffer);
	}

	fontPathCache.set(text, fontPath);
	return fontPath;
}

function emojiToCodepoints(emoji) {
	return Array.from(emoji)
		.map((char) => char.codePointAt(0).toString(16))
		.filter((codePoint) => codePoint !== 'fe0f')
		.join('-');
}

async function getTwemojiSvgBase64(emoji) {
	if (emojiCache.has(emoji)) return emojiCache.get(emoji);
	const codepoints = emojiToCodepoints(emoji);
	const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codepoints}.svg`;
	const response = await fetchWithRetry(url);
	const svgText = await response.text();
	const base64 = Buffer.from(svgText, 'utf8').toString('base64');
	emojiCache.set(emoji, base64);
	return base64;
}

function buildSvg({ emoji, titleLines, emojiSvgBase64 }) {
	const fontSize = titleLines.length >= 3 ? 56 : 64;
	const lineHeight = titleLines.length >= 3 ? 78 : 86;
	const startY = titleLines.length === 1 ? 322 : titleLines.length === 2 ? 286 : 248;

	const lineNodes = titleLines
		.map((line, idx) => {
			const y = startY + idx * lineHeight;
			return `<text x="90" y="${y}" class="title">${escapeXml(line)}</text>`;
		})
		.join('');

	const emojiNode = emojiSvgBase64
		? `<image href="data:image/svg+xml;base64,${emojiSvgBase64}" x="92" y="84" width="100" height="100" />`
		: `<text x="90" y="170" class="emoji">${escapeXml(emoji)}</text>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <style>
    .title {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: ${fontSize}px;
      font-weight: 700;
      fill: #f8fafc;
      letter-spacing: 0.02em;
    }
    .brand {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 30px;
      font-weight: 700;
      fill: #cbd5e1;
    }
    .emoji {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 100px;
      font-weight: 700;
      fill: #f8fafc;
    }
  </style>

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="60%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1020" cy="110" r="180" fill="#38bdf8" fill-opacity="0.18" />
  <circle cx="180" cy="560" r="220" fill="#22d3ee" fill-opacity="0.12" />

  ${emojiNode}

  ${lineNodes}

  <text x="90" y="560" class="brand">yusuke-blog</text>
</svg>`;
}

async function main() {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	const files = fs
		.readdirSync(ARTICLES_DIR)
		.filter((name) => name.toLowerCase().endsWith('.md'))
		.sort((a, b) => a.localeCompare(b));

	let generated = 0;

	for (const file of files) {
		const slug = file.replace(/\.md$/i, '');
		const markdown = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
		const { data } = matter(markdown);

		const title = String(data.title || slug);
		const emoji = String(data.emoji || '📝');
		const titleLines = wrapTitle(title);
		const fontPath = await getSubsetFontFile(`${titleLines.join('')}yusuke-blog`);

		let emojiSvgBase64 = null;
		try {
			emojiSvgBase64 = await getTwemojiSvgBase64(emoji);
		} catch (error) {
			console.warn(`[warn] twemoji fallback for ${slug}: ${error.message}`);
		}

		const svg = buildSvg({ emoji, titleLines, emojiSvgBase64 });
		const resvg = new Resvg(svg, {
			fitTo: { mode: 'width', value: WIDTH },
			background: 'rgba(0,0,0,0)',
			font: {
				fontFiles: [fontPath],
				loadSystemFonts: true
			}
		});

		const png = resvg.render().asPng();
		const outputPath = path.join(OUTPUT_DIR, `${slug}.png`);
		fs.writeFileSync(outputPath, png);
		generated += 1;
		console.log(`[og] ${slug}.png generated`);
	}

	console.log(`\nDone. Generated ${generated} OGP image(s) in static/og/articles.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
