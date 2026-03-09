<script lang="ts">
	import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { ContactFormData } from '$lib/server/contact-issue';
	import type { PageProps } from './$types';

	const categoryOptions = ['記事の誤り報告', '技術的な質問', 'お仕事の相談', 'その他'] as const;
	type ContactFormMessage = {
		text: string;
		issueUrl?: string;
		issueNumber?: number;
		issueTitle?: string;
	};

	let { data }: PageProps = $props();

	const contactForm = superForm<ContactFormData, ContactFormMessage>(untrack(() => data.form), {
		resetForm: true,
		clearOnSubmit: 'none'
	});

	const {
		form: formData,
		errors,
		constraints,
		message: formMessage,
		submitting,
		enhance
	} = contactForm;
</script>

<svelte:head>
	<title>お問い合わせ | Yusuke Blog</title>
	<meta
		name="description"
		content="記事の誤り報告、技術的な質問、お仕事のご相談を受け付けています。送信内容はGitHubの公開Issueとして投稿されます。"
	/>
</svelte:head>

<section class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
	<div class="mx-auto max-w-2xl">
		<Card class="border-slate-200 bg-white/90 shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-800">
			<CardHeader class="space-y-3">
				<CardTitle class="text-2xl font-bold text-slate-900 dark:text-slate-100">お問い合わせ</CardTitle>
				<CardDescription class="text-slate-600 dark:text-slate-300">
					記事の誤り報告、技術的な質問、お仕事のご相談を受け付けています。
				</CardDescription>
			</CardHeader>

			<CardContent class="space-y-6">
				<Alert class="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
					<AlertCircle class="h-4 w-4" />
					<AlertDescription>
						送信内容は GitHub の公開Issueとして投稿されます。個人情報・機密情報は入力しないでください。
					</AlertDescription>
				</Alert>

				{#if !data.githubAvailable}
					<Alert class="border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
						<AlertCircle class="h-4 w-4" />
						<AlertDescription>
							現在お問い合わせ機能を利用できません。管理者が設定を確認中です。
						</AlertDescription>
					</Alert>
				{/if}

				{#if $errors._errors?.length}
					<Alert class="border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
						<AlertCircle class="h-4 w-4" />
						<AlertDescription>
							{$errors._errors[0]}
						</AlertDescription>
					</Alert>
				{/if}

				{#if $formMessage?.issueUrl}
					<Alert class="border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100">
						<CheckCircle class="h-4 w-4" />
						<AlertDescription class="space-y-2">
							<p>{$formMessage.text}</p>
							<a
								class="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
								href={$formMessage.issueUrl}
								target="_blank"
								rel="noreferrer noopener"
							>
								Issue #{$formMessage.issueNumber}: {$formMessage.issueTitle}
								<ExternalLink class="h-4 w-4" />
							</a>
						</AlertDescription>
					</Alert>
				{/if}

				<form method="POST" use:enhance class="space-y-5">
					<div class="space-y-2">
						<Label for="name">お名前</Label>
						<Input
							id="name"
							name="name"
							placeholder="例: 山田 太郎"
							bind:value={$formData.name}
							{...$constraints.name}
							disabled={!data.githubAvailable || $submitting}
						/>
						{#if $errors.name?._errors?.length}
							<p class="text-sm text-red-600 dark:text-red-300">{$errors.name._errors[0]}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="contact">連絡先（任意）</Label>
						<Input
							id="contact"
							name="contact"
							placeholder="例: Xアカウント / メールアドレス"
							bind:value={$formData.contact}
							maxlength={200}
							required={false}
							disabled={!data.githubAvailable || $submitting}
						/>
						{#if $errors.contact?._errors?.length}
							<p class="text-sm text-red-600 dark:text-red-300">{$errors.contact._errors[0]}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="category">お問い合わせ種別</Label>
						<select
							id="category"
							name="category"
							bind:value={$formData.category}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!data.githubAvailable || $submitting}
						>
							{#each categoryOptions as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
						{#if $errors.category?._errors?.length}
							<p class="text-sm text-red-600 dark:text-red-300">{$errors.category._errors[0]}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="message">本文</Label>
						<Textarea
							id="message"
							name="message"
							rows={8}
							placeholder="お問い合わせ内容を入力してください。"
							bind:value={$formData.message}
							{...$constraints.message}
							disabled={!data.githubAvailable || $submitting}
						/>
						{#if $errors.message?._errors?.length}
							<p class="text-sm text-red-600 dark:text-red-300">{$errors.message._errors[0]}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<label for="consentPublic" class="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
							<input
								id="consentPublic"
								name="consentPublic"
								type="checkbox"
								class="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
								bind:checked={$formData.consentPublic}
								disabled={!data.githubAvailable || $submitting}
							/>
							<span>送信内容が公開Issueとして投稿されることに同意します。</span>
						</label>
						{#if $errors.consentPublic?._errors?.length}
							<p class="text-sm text-red-600 dark:text-red-300">{$errors.consentPublic._errors[0]}</p>
						{/if}
					</div>

					<div class="hidden" aria-hidden="true">
						<Label for="website">Website</Label>
						<Input
							id="website"
							name="website"
							autocomplete="off"
							tabindex={-1}
							bind:value={$formData.website}
						/>
					</div>

					<Button
						type="submit"
						class="w-full"
						disabled={!data.githubAvailable || $submitting || !$formData.consentPublic}
					>
						{#if $submitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							送信中...
						{:else}
							Issueを作成する
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</section>
