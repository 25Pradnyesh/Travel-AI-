import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main className="min-h-screen scroll-smooth bg-black text-white">
      <Navbar />

      <Hero />

      <section
        id="discover"
        className="flex min-h-screen items-center justify-center border-t border-white/5 bg-zinc-950 px-6"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-blue-400">
            Discover
          </p>

          <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
            From a reel
            <br />
            to somewhere real.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-500 md:text-lg">
            Find the places hidden inside the content you already love.
          </p>
        </div>
      </section>
    </main>
  );
}
