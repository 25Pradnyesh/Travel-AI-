import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white scroll-smooth">
      <Navbar />

      <Hero />

      <section
        id="discover"
        className="flex min-h-screen items-center justify-center border-t border-white/5 bg-zinc-950 px-6"
      >
        <div className="text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-blue-400">
            Discover
          </p>

          <h2 className="text-4xl font-bold md:text-6xl">
            Your next destination
            <br />
            starts here.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-zinc-500">
            Drop a travel reel and let Travel AI uncover the place behind it.
          </p>
        </div>
      </section>
    </main>
  );
}
