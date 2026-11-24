import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Textured earthy background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, #e8d5be55 0%, transparent 60%), " +
            "radial-gradient(ellipse at 80% 20%, #a8d0ae33 0%, transparent 55%), " +
            "radial-gradient(ellipse at 60% 80%, #d4b08a44 0%, transparent 50%), " +
            "#fdf8f3",
        }}
      />

      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      {/* Decorative corner leaves */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-15 select-none pointer-events-none">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 Q60 10 90 60 Q40 80 0 120Z" fill="#2d7340" />
          <path d="M0 0 Q30 50 10 110" stroke="#2d7340" strokeWidth="1.5" fill="none" opacity="0.5" />
        </svg>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-15 select-none pointer-events-none scale-x-[-1]">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 Q60 10 90 60 Q40 80 0 120Z" fill="#2d7340" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32 opacity-15 select-none pointer-events-none scale-y-[-1]">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 Q60 10 90 60 Q40 80 0 120Z" fill="#a8683a" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-15 select-none pointer-events-none scale-[-1]">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 Q60 10 90 60 Q40 80 0 120Z" fill="#a8683a" />
        </svg>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center px-6 py-16 max-w-2xl w-full text-center">

        {/* Coming soon badge */}
        <div
          className="animate-float-up mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold tracking-widest uppercase"
          style={{
            borderColor: "#c08b5c",
            color: "#8b5230",
            background: "#f5ede0",
            letterSpacing: "0.18em",
          }}
        >
          <span
            className="animate-blink-dot inline-block w-2 h-2 rounded-full"
            style={{ background: "#2d7340" }}
          />
          Coming Soon
        </div>

        {/* Logo */}
        <div className="animate-float-up delay-200 mb-6">
          <Image
            src="/logo-icon.png"
            alt="Bhoomi Art — The beauty of Mother Earth"
            width={300}
            height={240}
            priority
            className="mx-auto drop-shadow-xl"
            style={{ width: "300px", height: "auto" }}
          />
        </div>

        {/* Brand name */}
        <h1
          className="animate-float-up delay-300 leading-tight mb-1"
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2.4rem, 7vw, 3.8rem)",
            fontWeight: 800,
            color: "#1f5a30",
            letterSpacing: "0.04em",
            textShadow: "2px 3px 10px rgba(168,104,58,0.18)",
          }}
        >
          BHOOMI ART
        </h1>
        <p
          className="animate-float-up delay-400 mb-1"
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)",
            color: "#8b5230",
            letterSpacing: "0.06em",
          }}
        >
          The beauty of Mother Earth
        </p>

        {/* Divider */}
        <div className="animate-float-up delay-600 flex items-center gap-3 my-5 w-full max-w-xs">
          <div className="flex-1 h-px" style={{ background: "#d4b08a" }} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2z" fill="#c08b5c" opacity="0.6" />
            <path d="M12 6v12M6 12h12" stroke="#fdf8f3" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="flex-1 h-px" style={{ background: "#d4b08a" }} />
        </div>

        {/* Announcement text */}
        <p
          className="animate-float-up delay-600 text-base md:text-lg leading-relaxed mb-8 max-w-md"
          style={{
            color: "#522e1c",
            fontFamily: "var(--font-lato)",
            fontWeight: 300,
          }}
        >
          We are crafting something beautiful from the earth. Our website is on its way — 
          stay tuned for unique, customized terracotta pieces shaped with love and tradition.
        </p>

        {/* CTA */}
        <div className="animate-float-up delay-800 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="mailto:ba4bhoomiart@gmail.com"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #2d7340 0%, #1f5a30 100%)",
              color: "#fdf8f3",
              boxShadow: "0 4px 20px rgba(45,115,64,0.35)",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Get in Touch
          </a>

          <a
            href="https://www.instagram.com/ba4bhoomiart"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #e1306c 0%, #c13584 50%, #833ab4 100%)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(193,53,132,0.35)",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
            </svg>
            Follow Us
          </a>
        </div>

        {/* Footer note */}
        <p
          className="animate-fade-in delay-1200 mt-8 text-xs tracking-wider uppercase"
          style={{ color: "#c08b5c", letterSpacing: "0.15em" }}
        >
          Rooted in Earth · Shaped by Hand · Born with Love
        </p>
      </div>
    </main>
  );
}
