import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, Menu, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { AUDIO_SRC, MEDIA, NAV_SECTIONS, TRACK_TITLE } from "@/data/lectureData";
import { BackgroundVideo, Reveal } from "./components/Media";
import { ThinkerSections } from "./components/ThinkerSections";
import { PracticeSections } from "./components/PracticeSections";
import { DiscussionSection } from "./components/DiscussionSection";

function Eq({ active }: { active: boolean }) {
  return (
    <span className="inline-flex h-3.5 items-end gap-[2.5px]" aria-hidden="true">
      {[0, 0.22, 0.45, 0.1].map((d, i) => (
        <i key={i} className={`eq-bar ${active ? "eq-bar-active" : ""}`} style={active ? { animationDelay: `${d}s` } : undefined} />
      ))}
    </span>
  );
}

function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(55);
  const [muted, setMuted] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a || missing) return;
    // gentle fade-in
    const target = muted ? 0 : volume / 100;
    a.volume = 0;
    a.play()
      .then(() => {
        let v = 0;
        const step = () => {
          v = Math.min(target, v + target / 30);
          a.volume = v;
          if (v < target) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      })
      .catch(() => {});
  }, [missing, muted, volume]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) play();
    else a.pause();
  }, [play]);

  const element = (
    <audio
      ref={audioRef}
      src={AUDIO_SRC}
      preload="metadata"
      loop
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onError={() => setMissing(true)}
    />
  );

  return { element, isPlaying, volume, setVolume, muted, setMuted, missing, play, toggle };
}

export default function App() {
  const audio = useAudio();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>("top");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
        setProgress(doc.scrollTop / max);
        setScrolled(doc.scrollTop > 40);
        let current = "top";
        for (const sec of NAV_SECTIONS) {
          const el = document.getElementById(sec.id);
          if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = sec.id;
        }
        setActive(current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const activeIdx = NAV_SECTIONS.findIndex((s) => s.id === active);
  const activeLabel = activeIdx >= 0 ? NAV_SECTIONS[activeIdx].label : "Начало";

  const start = () => {
    audio.play();
    document.getElementById("vvedenie")?.scrollIntoView({ behavior: "smooth" });
  };

  const heroWords = ["Новая", "философия", "образования"];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg text-ink">
      <div className="grain" aria-hidden="true" />
      {audio.element}

      {/* HEADER */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "border-b border-line bg-bg/70 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-10">
          <a href="#top" className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold text-[13px] text-gold">Ф</span>
            <span className="hidden sm:inline">Философия образования</span>
          </a>

          <div className="ml-auto hidden items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-ink-dim uppercase md:flex">
            <span className="text-gold">{activeIdx >= 0 ? String(activeIdx + 1).padStart(2, "0") : "—"}</span>
            <span className="h-px w-6 bg-line-strong" />
            <span className="w-44 truncate">{activeLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="ml-auto inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-bg/40 px-4 py-2 text-sm font-semibold text-ink backdrop-blur transition-colors hover:border-gold md:ml-0"
            aria-expanded={menuOpen}
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            Содержание
          </button>
        </div>
        <div className="h-px w-full bg-transparent">
          <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </header>

      {/* FULLSCREEN MENU */}
      <div
        className={`fixed inset-0 z-[70] transition-all duration-700 ease-[var(--ease-out-expo)] ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Содержание лекции"
      >
        <div className="absolute inset-0 bg-bg/95 backdrop-blur-2xl" onClick={() => setMenuOpen(false)} />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col px-5 py-5 sm:px-10">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] tracking-[0.24em] text-ink-faint uppercase">Содержание · {NAV_SECTIONS.length} глав</p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-gold hover:text-gold"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-8 grid flex-1 grid-cols-1 content-start gap-x-12 overflow-y-auto md:grid-cols-2">
            {NAV_SECTIONS.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setMenuOpen(false)}
                className={`group flex items-baseline gap-5 border-b border-line py-4 transition-all duration-700 ${
                  menuOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
                style={{ transitionDelay: menuOpen ? `${80 + i * 40}ms` : "0ms" }}
              >
                <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className={`font-display text-3xl font-semibold transition-all duration-500 group-hover:translate-x-2 group-hover:text-gold sm:text-4xl ${
                    active === s.id ? "text-gold" : "text-ink"
                  }`}
                >
                  {s.label}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      <main>
        {/* HERO */}
        <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden">
          <BackgroundVideo src={MEDIA.hero.video} poster={MEDIA.hero.poster} eager />
          <div className="scrim-hero absolute inset-0" aria-hidden="true" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-32 pb-14 sm:px-10 sm:pb-20">
            <p className="rise mb-6 flex items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-gold uppercase" style={{ "--d": "200ms" } as CSSProperties}>
              <span className="h-px w-10 bg-gold" />
              Интерактивная веб-лекция · 11 глав
            </p>
            <h1 className="max-w-6xl text-[3.4rem] leading-[0.95] font-semibold text-ink sm:text-8xl lg:text-[8.5rem]">
              {heroWords.map((w, i) => (
                <span key={w} className="word-mask mr-[0.22em]">
                  <span style={{ "--d": `${350 + i * 140}ms` } as CSSProperties} className={i === 1 ? "text-gold italic" : ""}>
                    {w}
                  </span>
                </span>
              ))}
            </h1>

            <div className="mt-10 grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <p className="rise font-display text-2xl text-ink/90 italic sm:text-3xl" style={{ "--d": "900ms" } as CSSProperties}>
                  От передачи информации к интеллектуальной самостоятельности
                </p>
                <p className="rise mt-5 max-w-xl text-sm leading-relaxed text-ink/70 sm:text-base" style={{ "--d": "1050ms" } as CSSProperties}>
                  Цель образования — не просто передать ученику как можно больше готовой информации, а развить его умение
                  задавать вопросы, самостоятельно искать решения, рассматривать проблему с разных сторон и аргументировать
                  свою позицию.
                </p>
              </div>
              <div className="rise flex flex-wrap items-center gap-4 lg:col-span-6 lg:justify-end" style={{ "--d": "1200ms" } as CSSProperties}>
                <button
                  type="button"
                  onClick={start}
                  className="group inline-flex items-center gap-3 rounded-full bg-gold py-2 pr-2 pl-7 text-sm font-semibold text-bg transition-all duration-500 hover:bg-ink"
                >
                  Начать лекцию
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-gold transition-transform duration-500 group-hover:rotate-[-45deg]">
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
                <span className="inline-flex items-center gap-2 text-xs text-ink/60">
                  <Eq active={audio.isPlaying} />
                  {audio.missing ? "Музыкальное сопровождение скоро" : `Со звуком: ${TRACK_TITLE}`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="overflow-hidden border-y border-line bg-bg-2 py-5" aria-hidden="true">
          <div className="marquee">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center">
                {["Кен Робинсон", "Сугата Митра", "Джонатан Хайдт", "По-Шен Ло", "SOLE", "Проблемное обучение", "ИИ и учитель", "Межпредметность"].map((t) => (
                  <span key={t + k} className="flex items-center gap-8 px-8 font-display text-3xl whitespace-nowrap text-ink/70 italic">
                    {t}
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <ThinkerSections />
        <PracticeSections />
        <DiscussionSection />
      </main>

      {/* FOOTER — steppe */}
      <footer className="relative flex min-h-[80svh] items-end overflow-hidden">
        <BackgroundVideo src={MEDIA.steppe.video} poster={MEDIA.steppe.poster} />
        <div className="scrim-chapter absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-10 sm:px-10">
          <Reveal className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] tracking-[0.28em] text-gold uppercase">Музыкальное сопровождение</p>
              <h2 className="mt-4 text-5xl font-semibold text-ink sm:text-7xl">
                Құрманғазы — <em className="text-gold">«Көңіл толқыны»</em>
              </h2>
              <p className="mt-5 max-w-lg text-ink/75">
                Кюй Құрманғазы Сағырбайұлы для домбры — «Волнение души». Музыка степи как фон для размышлений о свободе мысли.
              </p>
              <button
                type="button"
                onClick={audio.toggle}
                disabled={audio.missing}
                className="mt-8 inline-flex items-center gap-3 rounded-full border border-ink/30 bg-bg/40 px-6 py-3 text-sm font-semibold text-ink backdrop-blur transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
              >
                {audio.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {audio.missing ? "Трек скоро будет добавлен" : audio.isPlaying ? "Пауза" : "Слушать кюй"}
              </button>
            </div>
            <div className="flex justify-start lg:col-span-5 lg:justify-end">
              <button
                type="button"
                onClick={audio.toggle}
                disabled={audio.missing}
                aria-label={audio.isPlaying ? "Пауза" : "Слушать кюй"}
                className="group relative flex h-44 w-44 items-center justify-center rounded-full border border-ink/25 bg-bg/30 text-ink backdrop-blur-md transition-colors duration-500 hover:border-gold hover:text-gold disabled:opacity-60 sm:h-56 sm:w-56"
              >
                {audio.isPlaying && (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full border border-gold/40 [animation-duration:2.4s]" />
                    <span className="absolute inset-6 animate-ping rounded-full border border-gold/30 [animation-delay:0.8s] [animation-duration:2.4s]" />
                  </>
                )}
                <span className="flex flex-col items-center gap-3">
                  {audio.isPlaying ? <Pause className="h-9 w-9" /> : <Play className="ml-1 h-9 w-9" />}
                  <span className="font-mono text-[10px] tracking-[0.24em] uppercase">
                    {audio.missing ? "скоро" : audio.isPlaying ? "звучит" : "слушать"}
                  </span>
                </span>
              </button>
            </div>
          </Reveal>

          <div className="mt-16 mb-20 flex flex-col gap-4 border-t border-line-strong pt-6 sm:mb-16 text-xs text-ink/55 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-lg text-ink/85">Новая философия образования · интерактивная веб-лекция</p>
            <p className="max-w-xl sm:text-right">
              Портреты: Wikimedia Commons (CC BY / CC BY-SA), poshenloh.com. Видео: Mixkit (Mixkit Free License). Музыка: Құрманғазы Сағырбайұлы — кюй «Көңіл толқыны» (домбыра).
            </p>
          </div>
        </div>
      </footer>

      {/* FLOATING PLAYER */}
      <div className="fixed bottom-4 left-4 z-50 sm:bottom-6 sm:left-6">
        <div className="glass flex items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5 shadow-2xl">
          <button
            type="button"
            onClick={audio.toggle}
            disabled={audio.missing}
            aria-label={audio.isPlaying ? "Пауза" : "Включить музыку"}
            aria-pressed={audio.isPlaying}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-bg transition-transform hover:scale-105 disabled:bg-panel-2 disabled:text-ink-faint"
          >
            {audio.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="font-mono text-[9px] tracking-[0.2em] text-ink-faint uppercase">
              {audio.missing ? "Трек скоро" : audio.isPlaying ? "Сейчас звучит" : "Кюй"}
            </span>
            <span className="max-w-[190px] truncate text-xs font-medium text-ink">{TRACK_TITLE}</span>
          </div>
          <span className="text-gold">
            <Eq active={audio.isPlaying} />
          </span>
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => audio.setMuted(!audio.muted)}
              aria-label={audio.muted ? "Включить звук" : "Выключить звук"}
              className="text-ink-dim hover:text-ink"
            >
              {audio.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={audio.volume}
              onChange={(e) => {
                audio.setVolume(Number(e.target.value));
                audio.setMuted(false);
              }}
              aria-label="Громкость музыки"
              className="w-20 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* BACK TO TOP */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Наверх"
        className={`glass fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full text-ink transition-all duration-500 hover:text-gold sm:right-6 sm:bottom-6 ${
          progress > 0.06 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" />
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="1.5"
            strokeDasharray={138.2}
            strokeDashoffset={138.2 * (1 - progress)}
          />
        </svg>
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}
