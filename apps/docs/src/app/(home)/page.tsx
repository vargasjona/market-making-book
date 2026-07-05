import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-fd-muted-foreground text-xs uppercase tracking-widest">
        A practitioner&apos;s manual
      </p>
      <h1 className="font-bold text-4xl">The Market Making Book</h1>
      <p className="max-w-xl text-fd-muted-foreground">
        From zero to state of the art: order books, the mathematics of optimal
        quoting, six real venues, an algorithm catalog, a hands-on crypto
        practicum, and six original strategy proposals — with 30 interactive
        figures.
      </p>
      <Link
        className="mt-2 rounded-lg border px-5 py-2.5 font-medium transition-colors hover:bg-fd-accent"
        href="/docs"
      >
        Start reading →
      </Link>
    </div>
  );
}
