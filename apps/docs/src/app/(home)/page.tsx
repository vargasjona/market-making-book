import Link from "next/link";

import { bookJsonLd, serializeJsonLd } from "@/lib/json-ld";

import "./home.css";

const homeJsonLd = serializeJsonLd(bookJsonLd());

const ASKS = [
	{ price: "99.56", size: "2,410", width: "w-[82%]", pace: "home-depth-5" },
	{ price: "99.54", size: "1,730", width: "w-[64%]", pace: "home-depth-4" },
	{ price: "99.52", size: "980", width: "w-[42%]", pace: "home-depth-3" },
	{ price: "99.50", size: "410", width: "w-[24%]", pace: "home-depth-2" },
];

const BIDS = [
	{ price: "99.48", size: "520", width: "w-[28%]", pace: "home-depth-1" },
	{ price: "99.46", size: "1,140", width: "w-[48%]", pace: "home-depth-3" },
	{ price: "99.44", size: "1,960", width: "w-[70%]", pace: "home-depth-2" },
	{ price: "99.42", size: "2,880", width: "w-[88%]", pace: "home-depth-4" },
];

const TOPICS = [
	"Order books",
	"Inventory risk",
	"Adverse selection",
	"Avellaneda–Stoikov",
	"Microstructure signals",
	"Kalshi",
	"Polymarket",
	"Hyperliquid",
	"Binance",
	"IBKR & Alpaca",
	"Algorithm catalog",
	"Risk & operations",
];

const STATS = [
	{ value: "20", label: "chapters" },
	{ value: "6", label: "real venues" },
	{ value: "30", label: "interactive figures" },
	{ value: "6", label: "strategy proposals" },
];

const PILLARS = [
	{
		title: "Foundations",
		body: "What an order book is, how exchanges match trades, and what a market maker actually does — assuming zero prior trading knowledge.",
	},
	{
		title: "The mathematics",
		body: "Inventory risk, adverse selection, and the optimal-quoting models behind every serious desk — built up step by step with interactive figures.",
	},
	{
		title: "Practice",
		body: "Six real venues from Kalshi to Binance, a catalog of production algorithms, a hands-on crypto practicum, and six original strategy proposals.",
	},
];

function OrderBookRow({
	row,
	side,
}: {
	row: (typeof ASKS)[number];
	side: "ask" | "bid";
}) {
	const barColor = side === "ask" ? "bg-rose-500/15" : "bg-emerald-500/15";
	const priceColor =
		side === "ask"
			? "text-rose-600 dark:text-rose-400"
			: "text-emerald-600 dark:text-emerald-400";

	return (
		<div className="relative flex items-center justify-between px-2 py-1">
			<div
				className={`home-depth ${row.pace} absolute inset-y-0.5 left-0 rounded-sm ${barColor} ${row.width}`}
			/>
			<span className={`relative ${priceColor}`}>{row.price}</span>
			<span className="relative text-fd-muted-foreground">{row.size}</span>
		</div>
	);
}

function OrderBookCard() {
	return (
		<div
			aria-hidden="true"
			className="home-float w-full max-w-sm rounded-2xl border border-fd-border bg-fd-card p-4 shadow-lg"
		>
			<div className="mb-3 flex items-center justify-between font-mono text-[10px] text-fd-muted-foreground uppercase tracking-widest">
				<span className="flex items-center gap-2">
					<span className="home-dot size-2 rounded-full bg-emerald-500" />
					quoting both sides
				</span>
				<span>L2 · simulated</span>
			</div>

			<div className="font-mono text-xs">
				<div className="mb-1 flex items-center justify-between px-2 text-[10px] text-fd-muted-foreground uppercase tracking-widest">
					<span>Price</span>
					<span>Size</span>
				</div>

				{ASKS.map((row) => (
					<OrderBookRow key={row.price} row={row} side="ask" />
				))}

				<div className="my-1.5 flex items-center justify-between border-fd-border border-y px-2 py-1.5">
					<span className="home-flash font-semibold text-sm">99.49</span>
					<span className="text-[10px] text-fd-muted-foreground uppercase tracking-widest">
						spread 0.02
					</span>
				</div>

				{BIDS.map((row) => (
					<OrderBookRow key={row.price} row={row} side="bid" />
				))}
			</div>

			<p className="mt-3 border-fd-border border-t pt-3 text-center font-mono text-[10px] text-fd-muted-foreground uppercase tracking-widest">
				the spread is the product — learn to price it
			</p>
		</div>
	);
}

function TopicsTicker() {
	return (
		<div className="relative overflow-hidden border-fd-border border-y py-3">
			<div className="home-marquee flex w-max items-center">
				{[false, true].map((duplicate) => (
					<div
						aria-hidden={duplicate}
						className="flex items-center"
						key={duplicate ? "copy" : "original"}
					>
						{TOPICS.map((topic) => (
							<span
								className="flex items-center gap-6 pr-6 font-mono text-fd-muted-foreground text-xs uppercase tracking-widest"
								key={topic}
							>
								{topic}
								<span className="text-fd-primary">·</span>
							</span>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col">
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from constants, "<" escaped by serializeJsonLd
				dangerouslySetInnerHTML={{ __html: homeJsonLd }}
				type="application/ld+json"
			/>
			<section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-10 px-6 py-16 lg:flex-row lg:justify-between lg:py-24">
				<div className="home-glow pointer-events-none absolute inset-0 -z-10" />

				<div className="flex max-w-xl flex-col items-center gap-5 text-center lg:items-start lg:text-left">
					<p className="home-rise home-rise-1 font-mono text-fd-muted-foreground text-xs uppercase tracking-widest">
						A practitioner&apos;s manual · free to read
					</p>
					<h1 className="home-rise home-rise-2 font-bold text-4xl leading-tight sm:text-5xl">
						Learn how market makers{" "}
						<span className="text-fd-primary">price the spread</span>
					</h1>
					<p className="home-rise home-rise-3 text-fd-muted-foreground">
						Every market has someone quoting both sides. This book explains who
						they are, why the spread exists, and how to compute it — taking you
						from your first order book to designing, testing, and operating
						market-making algorithms on real venues.
					</p>
					<div className="home-rise home-rise-4 mt-2 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
						<Link
							className="group rounded-lg bg-fd-primary px-5 py-2.5 font-medium text-fd-primary-foreground transition-transform hover:scale-[1.03]"
							href="/docs"
						>
							Start reading{" "}
							<span className="inline-block transition-transform group-hover:translate-x-1">
								→
							</span>
						</Link>
						<Link
							className="rounded-lg border border-fd-border px-5 py-2.5 font-medium transition-colors hover:bg-fd-accent"
							href="/docs/06-optimal-quoting-math"
						>
							Skip to the math
						</Link>
					</div>
					<dl className="home-rise home-rise-5 mt-4 grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
						{STATS.map((stat) => (
							<div
								className="flex flex-col items-center lg:items-start"
								key={stat.label}
							>
								<dt className="order-2 font-mono text-[10px] text-fd-muted-foreground uppercase tracking-widest">
									{stat.label}
								</dt>
								<dd className="order-1 font-bold text-2xl text-fd-primary">
									{stat.value}
								</dd>
							</div>
						))}
					</dl>
				</div>

				<div className="home-rise home-rise-3 flex justify-center">
					<OrderBookCard />
				</div>
			</section>

			<TopicsTicker />

			<section className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-14 sm:grid-cols-3">
				{PILLARS.map((pillar) => (
					<div
						className="rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-primary/50"
						key={pillar.title}
					>
						<h2 className="mb-2 font-semibold">{pillar.title}</h2>
						<p className="text-fd-muted-foreground text-sm">{pillar.body}</p>
					</div>
				))}
			</section>
		</main>
	);
}
