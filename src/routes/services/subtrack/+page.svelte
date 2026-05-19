<script lang="ts">
	import {
		ArrowRight,
		Bell,
		CalendarDays,
		ChartPie,
		CheckCircle2,
		CreditCard,
		Database,
		ExternalLink,
		Globe2,
		Smartphone,
		Tags,
		WifiOff
	} from 'lucide-svelte';

	const serviceUrl = 'https://subtracknotify.com';
	const pageUrl = '/services/subtrack';
	const ogImage = '/images/services/subtrack/subscriptions.png';

	const featureCards = [
		{
			title: 'サブスク登録とタグ管理',
			description:
				'サービス名、料金、支払い周期、初回支払日、タグ、通知タイミングをまとめて登録できます。',
			image: '/images/services/subtrack/subscriptions.png',
			alt: 'SubTrackのサブスク管理画面',
			icon: Tags
		},
		{
			title: '支払日カレンダー',
			description:
				'登録した支払い予定をカレンダー上に展開し、月ごとの更新タイミングを確認できます。',
			image: '/images/services/subtrack/calendar.png',
			alt: 'SubTrackの支払日カレンダー画面',
			icon: CalendarDays
		},
		{
			title: '通知とPWA導線',
			description:
				'通知方法を選び、スマートフォンからも繰り返し開きやすい導線を用意しています。',
			image: '/images/services/subtrack/notification.png',
			alt: 'SubTrackの通知設定画面',
			icon: Bell
		}
	] as const;

	const capabilities = [
		{
			title: '支出分析',
			description: '月間・年間の支出額と、サービスごとの割合を確認可能。',
			icon: ChartPie
		},
		{
			title: '通知',
			description: 'プッシュ通知、メール通知、両方の受け取り方法を選択可能。',
			icon: Bell
		},
		{
			title: 'オフライン補助',
			description: '表示済みデータのキャッシュと、通信復帰後の同期待ち状態を扱う設計。',
			icon: WifiOff
		},
		{
			title: '料金プラン',
			description: '無料枠、Premium、買い切り導線を分けて案内。',
			icon: CreditCard
		},
		{
			title: '多言語UI',
			description: '日本語と英語のメッセージを持つアプリ構成。',
			icon: Globe2
		}
	] as const;

	const implementationHighlights = [
		'SvelteKit と Cloudflare Workers を前提にしたフルスタック構成',
		'D1 / Drizzle を中心にしたサブスクデータ管理',
		'IndexedDB を使ったオフラインキャッシュと同期待ちキュー',
		'Better Auth、Stripe、Resend、Web Push を組み合わせたユーザー・課金・通知基盤'
	] as const;
</script>

<svelte:head>
	<title>SubTrack | 作ったサービス | Yusuke Blog</title>
	<meta
		name="description"
		content="SubTrackは、サブスクの支払日、金額、通知、支出分析をまとめて扱うために作ったWebアプリです。"
	/>
	<link rel="canonical" href={pageUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:title" content="SubTrack | 作ったサービス" />
	<meta
		property="og:description"
		content="サブスクの支払日、金額、通知、支出分析をまとめて扱うWebアプリの開発実績です。"
	/>
	<meta property="og:url" content={pageUrl} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:alt" content="SubTrackのサブスク管理画面" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="SubTrack | 作ったサービス" />
	<meta
		name="twitter:description"
		content="サブスクの支払日、金額、通知、支出分析をまとめて扱うWebアプリの開発実績です。"
	/>
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<div class="-mx-4 -my-6 bg-white text-slate-950">
	<section class="relative isolate flex min-h-[72vh] items-end overflow-hidden bg-slate-950">
		<img
			src="/images/services/subtrack/subscriptions.png"
			alt="SubTrackのサブスク管理画面"
			class="absolute inset-0 h-full w-full object-cover"
			width="1600"
			height="1000"
			fetchpriority="high"
		/>
		<div
			class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20"
		></div>
		<div
			class="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-14 pt-28 sm:px-8 lg:px-10"
		>
			<div class="flex max-w-3xl flex-col gap-6">
				<div class="flex items-center gap-3">
					<img
						src="/images/services/subtrack/logo-512.png"
						alt="SubTrack logo"
						class="h-12 w-12 rounded-lg border border-white/20 bg-white"
						width="512"
						height="512"
					/>
					<p class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
						Service Portfolio
					</p>
				</div>

				<div class="space-y-5">
					<h1 class="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
						SubTrack
					</h1>
					<p class="max-w-2xl text-lg leading-8 text-slate-100 sm:text-xl">
						サブスクの支払日、金額、通知、支出分析をひとつの場所で扱うために作った Webアプリです。
					</p>
				</div>

				<div class="flex flex-wrap gap-3">
					<a
						href={serviceUrl}
						target="_blank"
						rel="noreferrer noopener"
						class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-200"
					>
						SubTrackを開く
						<ExternalLink class="h-4 w-4" />
					</a>
					<a
						href="#features"
						class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-200"
					>
						機能を見る
						<ArrowRight class="h-4 w-4" />
					</a>
				</div>
			</div>
		</div>
	</section>

	<section class="border-b border-slate-200 bg-white px-5 py-10 sm:px-8">
		<div class="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
			<div class="rounded-lg border border-cyan-200 bg-cyan-50 p-5">
				<p class="text-sm font-semibold text-cyan-900">Purpose</p>
				<p class="mt-2 text-lg font-semibold text-slate-950">更新日を忘れない</p>
			</div>
			<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
				<p class="text-sm font-semibold text-emerald-900">Focus</p>
				<p class="mt-2 text-lg font-semibold text-slate-950">月額・年額支出を見える化</p>
			</div>
			<div class="rounded-lg border border-orange-200 bg-orange-50 p-5">
				<p class="text-sm font-semibold text-orange-900">Build</p>
				<p class="mt-2 text-lg font-semibold text-slate-950">PWA・通知・課金まで実装</p>
			</div>
		</div>
	</section>

	<section id="features" class="bg-slate-50 px-5 py-16 sm:px-8 lg:py-20">
		<div class="mx-auto max-w-6xl">
			<div class="max-w-3xl">
				<p class="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Core Features</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
					支払い予定を、入力・確認・振り返りまでつなげる
				</h2>
				<p class="mt-4 text-base leading-7 text-slate-600">
					単なるメモではなく、支払日・通知・集計を同じデータから扱えるようにしています。
				</p>
			</div>

			<div class="mt-10 grid gap-6 lg:grid-cols-3">
				{#each featureCards as feature (feature.title)}
					{@const Icon = feature.icon}
					<article class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
						<img
							src={feature.image}
							alt={feature.alt}
							class="aspect-[16/10] w-full object-cover"
							width="1600"
							height="1000"
							loading="lazy"
						/>
						<div class="space-y-3 p-5">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700"
							>
								<Icon class="h-5 w-5" />
							</div>
							<h3 class="text-xl font-semibold text-slate-950">{feature.title}</h3>
							<p class="leading-7 text-slate-600">{feature.description}</p>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="bg-white px-5 py-16 sm:px-8 lg:py-20">
		<div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
			<div class="max-w-xl">
				<p class="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
					Product Details
				</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
					日常利用で必要になる状態をひと通り持たせる
				</h2>
				<p class="mt-4 leading-7 text-slate-600">
					通知、オフライン、プラン差分、多言語化など、継続利用するWebアプリで後から効いてくる部分も含めて作っています。
				</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				{#each capabilities as capability (capability.title)}
					{@const Icon = capability.icon}
					<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
						>
							<Icon class="h-5 w-5" />
						</div>
						<h3 class="mt-4 text-lg font-semibold text-slate-950">{capability.title}</h3>
						<p class="mt-2 leading-7 text-slate-600">{capability.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="bg-slate-950 px-5 py-16 text-white sm:px-8 lg:py-20">
		<div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
			<div>
				<p class="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
					Implementation
				</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
					個人開発でも、運用を見据えた構成にする
				</h2>
				<p class="mt-4 leading-7 text-slate-300">
					画面だけでなく、認証、通知、課金、データ保存、通信が不安定なときの扱いまで含めて設計したサービスです。
				</p>
				<ul class="mt-8 space-y-4">
					{#each implementationHighlights as item (item)}
						<li class="flex gap-3 text-slate-100">
							<CheckCircle2 class="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-lg border border-white/10 bg-white/5 p-5">
					<Smartphone class="h-6 w-6 text-cyan-300" />
					<h3 class="mt-4 text-lg font-semibold">PWA</h3>
					<p class="mt-2 text-sm leading-6 text-slate-300">
						スマートフォンでも繰り返し開きやすい体験を意識。
					</p>
				</div>
				<div class="rounded-lg border border-white/10 bg-white/5 p-5">
					<Database class="h-6 w-6 text-emerald-300" />
					<h3 class="mt-4 text-lg font-semibold">Data</h3>
					<p class="mt-2 text-sm leading-6 text-slate-300">
						サーバーDBとローカルキャッシュの役割を分離。
					</p>
				</div>
				<div class="rounded-lg border border-white/10 bg-white/5 p-5">
					<Bell class="h-6 w-6 text-orange-300" />
					<h3 class="mt-4 text-lg font-semibold">Reminder</h3>
					<p class="mt-2 text-sm leading-6 text-slate-300">支払日前に気づける通知導線を実装。</p>
				</div>
				<div class="rounded-lg border border-white/10 bg-white/5 p-5">
					<CreditCard class="h-6 w-6 text-rose-300" />
					<h3 class="mt-4 text-lg font-semibold">Billing</h3>
					<p class="mt-2 text-sm leading-6 text-slate-300">
						継続課金と買い切りの導線を分けて扱う構成。
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class="bg-white px-5 py-16 sm:px-8 lg:py-20">
		<div class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
			<div class="space-y-4">
				<p class="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Try It</p>
				<h2 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
					実際のサービスを開く
				</h2>
				<p class="leading-7 text-slate-600">
					SubTrackは公開URLから確認できます。ログイン後、サブスク登録やカレンダー表示などの動きを試せます。
				</p>
			</div>
			<div class="rounded-lg border border-slate-200 bg-slate-50 p-6">
				<img
					src="/images/services/subtrack/notification.png"
					alt="SubTrackの通知設定画面"
					class="aspect-[16/10] w-full rounded-lg object-cover"
					width="1600"
					height="1100"
					loading="lazy"
				/>
				<a
					href={serviceUrl}
					target="_blank"
					rel="noreferrer noopener"
					class="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
				>
					SubTrackを開く
					<ExternalLink class="h-4 w-4" />
				</a>
			</div>
		</div>
	</section>
</div>
