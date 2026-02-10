type MarkdownToHtml = (
	text: string,
	options?: {
		embedOrigin?: string;
	}
) => string;

let cachedMarkdownToHtml: MarkdownToHtml | null = null;

function toRecord(value: unknown): Record<string, unknown> | null {
	if (value !== null && typeof value === 'object') {
		return value as Record<string, unknown>;
	}

	return null;
}

function resolveMarkdownToHtml(value: unknown): MarkdownToHtml | null {
	if (typeof value === 'function') {
		return value as MarkdownToHtml;
	}

	const record = toRecord(value);
	if (!record) {
		return null;
	}

	if (typeof record.default === 'function') {
		return record.default as MarkdownToHtml;
	}

	if (typeof record['module.exports'] === 'function') {
		return record['module.exports'] as MarkdownToHtml;
	}

	if (record.default) {
		const nestedDefault = resolveMarkdownToHtml(record.default);
		if (nestedDefault) {
			return nestedDefault;
		}
	}

	if (record['module.exports']) {
		const nestedModuleExports = resolveMarkdownToHtml(record['module.exports']);
		if (nestedModuleExports) {
			return nestedModuleExports;
		}
	}

	return null;
}

export async function getZennMarkdownToHtml(): Promise<MarkdownToHtml> {
	if (cachedMarkdownToHtml) {
		return cachedMarkdownToHtml;
	}

	const markdownModule = await import('zenn-markdown-html');
	const markdownToHtml = resolveMarkdownToHtml(markdownModule);

	if (!markdownToHtml) {
		throw new Error('Failed to resolve zenn-markdown-html renderer');
	}

	cachedMarkdownToHtml = markdownToHtml;
	return markdownToHtml;
}
