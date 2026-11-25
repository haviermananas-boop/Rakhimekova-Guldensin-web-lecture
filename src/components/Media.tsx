import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Background video that only downloads when near the viewport and pauses off-screen. */
export function BackgroundVideo({
  src,
  poster,
  className = "",
  eager = false,
}: {
  src: string;
  poster: string;
  className?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [load, setLoad] = useState(eager);
  const [ready, setReady] = useState(false);
  const [reduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <img src={poster} alt="" className="kenburns absolute inset-0 h-full w-full object-cover" />
      {!reduced && (
        <video
          ref={ref}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ${ready ? "opacity-100" : "opacity-0"}`}
          src={load ? src : undefined}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay={eager}
          preload={eager ? "auto" : "none"}
          onCanPlay={() => setReady(true)}
        />
      )}
    </div>
  );
}

/** Fade-up when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "figure";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ "--d": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Full-bleed cinematic chapter opener with background video. */
export function ChapterCover({
  id,
  number,
  kicker,
  title,
  lead,
  media,
}: {
  id: string;
  number: string;
  kicker: string;
  title: ReactNode;
  lead?: string;
  media: { video: string; poster: string };
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        setShift((r.top + r.height / 2 - vh / 2) / vh);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header id={id} ref={ref} className="relative flex min-h-[88svh] items-end overflow-hidden">
      <div className="absolute inset-[-8%_0]" style={{ transform: `translate3d(0, ${shift * -60}px, 0)` }}>
        <BackgroundVideo src={media.video} poster={media.poster} />
      </div>
      <div className="scrim-chapter absolute inset-0" aria-hidden="true" />

      <span
        aria-hidden="true"
        className="text-outline pointer-events-none absolute top-[14%] right-[-2vw] font-display text-[38vw] leading-none font-bold select-none sm:text-[26vw]"
        style={{ transform: `translate3d(0, ${shift * 80}px, 0)` }}
      >
        {number}
      </span>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 sm:px-10 sm:pb-24">
        <Reveal>
          <p className="mb-5 flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] text-gold uppercase">
            <span className="h-px w-10 bg-gold" />
            {kicker}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="max-w-5xl text-[2.6rem] font-semibold text-ink sm:text-7xl lg:text-[5.6rem]">{title}</h2>
        </Reveal>
        {lead && (
          <Reveal delay={240}>
            <p className="mt-6 max-w-xl text-base text-ink/80 sm:text-lg">{lead}</p>
          </Reveal>
        )}
      </div>
    </header>
  );
}
