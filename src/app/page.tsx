"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shader, ChromaFlow, Swirl } from "shaders/react";
import { useAppStore } from "@/store/AppContext";

/* ─── Magnetic Button Component ─── */
function MagneticButton({
  children,
  className = "",
  variant = "primary",
  size = "default",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "lg";
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>();

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    posRef.current = { x, y };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
    });
  };

  const handleMouseLeave = () => {
    posRef.current = { x: 0, y: 0 };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.style.transform = "translate3d(0, 0, 0)";
      }
    });
  };

  const variants: Record<string, string> = {
    primary: "lp-mag-btn lp-mag-primary",
    secondary: "lp-mag-btn lp-mag-secondary",
    ghost: "lp-mag-btn lp-mag-ghost",
  };

  const sizes: Record<string, string> = {
    default: "",
    lg: "lp-mag-lg",
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      style={{ transform: "translate3d(0, 0, 0)", contain: "layout style paint" }}
    >
      <span className="lp-mag-inner">{children}</span>
    </button>
  );
}

/* ─── Grain Overlay ─── */
function GrainOverlay() {
  return (
    <div
      className="lp-grain"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/* ─── Custom Cursor ─── */
function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const isPointer = useRef(false);
  const scaleOuter = useRef(1);
  const scaleInner = useRef(1);

  useEffect(() => {
    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
    let raf: number;

    const update = () => {
      pos.current.x = lerp(pos.current.x, target.current.x, 0.15);
      pos.current.y = lerp(pos.current.y, target.current.y, 0.15);

      const targetScaleOuter = isPointer.current ? 1.5 : 1;
      const targetScaleInner = isPointer.current ? 0.5 : 1;
      scaleOuter.current = lerp(scaleOuter.current, targetScaleOuter, 0.12);
      scaleInner.current = lerp(scaleInner.current, targetScaleInner, 0.12);

      if (outerRef.current) outerRef.current.style.transform = `translate3d(${pos.current.x}px,${pos.current.y}px,0) translate(-50%,-50%) scale(${scaleOuter.current})`;
      if (innerRef.current) innerRef.current.style.transform = `translate3d(${pos.current.x}px,${pos.current.y}px,0) translate(-50%,-50%) scale(${scaleInner.current})`;
      raf = requestAnimationFrame(update);
    };

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      const t = e.target as HTMLElement;
      isPointer.current = window.getComputedStyle(t).cursor === "pointer" || t.tagName === "BUTTON" || t.tagName === "A" || t.closest("button") !== null || t.closest("a") !== null;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(update);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={outerRef} className="lp-cursor-outer" style={{ contain: "layout style paint" }}>
        <div className="lp-cursor-ring" />
      </div>
      <div ref={innerRef} className="lp-cursor-inner" style={{ contain: "layout style paint" }}>
        <div className="lp-cursor-dot" />
      </div>
    </>
  );
}

/* ─── useReveal hook ─── */
function useReveal(threshold = 0.3) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.unobserve(el);
  }, [threshold]);

  return { ref, isVisible };
}

/* ─── Landing Page ─── */
export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const shaderContainerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoaded, setIsLoaded] = useState(false);
  const sectionCount = 5;

  /* Detect shader canvas ready (matching reference) */
  useEffect(() => {
    const checkShaderReady = () => {
      if (shaderContainerRef.current) {
        const canvas = shaderContainerRef.current.querySelector("canvas");
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          setIsLoaded(true);
          return true;
        }
      }
      return false;
    };

    if (checkShaderReady()) return;

    const intervalId = setInterval(() => {
      if (checkShaderReady()) {
        clearInterval(intervalId);
      }
    }, 100);

    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => {
      clearInterval(intervalId);
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (user) {
      router.replace(user.role === "admin" ? "/admin/dashboard" : "/home");
    }
  }, [user, router]);


  const scrollToSection = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.offsetWidth;
    scrollRef.current.scrollTo({ left: w * index, behavior: "smooth" });
    setCurrentSection(index);
  }, []);

  // Diarahkan dari navbar dengan ?login=1 atau ?register=1
  useEffect(() => {
    if (!isLoaded) return;
    if (searchParams.get("login") === "1") {
      setAuthMode("login");
      scrollToSection(4);
    } else if (searchParams.get("register") === "1") {
      setAuthMode("register");
      scrollToSection(4);
    }
  }, [searchParams, isLoaded, scrollToSection]);

  /* Vertical wheel → horizontal scroll */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();

        if (!scrollRef.current) return;

        scrollRef.current.scrollBy({
          left: e.deltaY,
          behavior: "instant",
        });

        const sectionWidth = scrollRef.current.offsetWidth;
        const newSection = Math.round(scrollRef.current.scrollLeft / sectionWidth);
        if (newSection !== currentSection) {
          setCurrentSection(newSection);
        }
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [currentSection]);

  /* Track scroll position (throttled) */
  const scrollThrottleRef = useRef<number>();
  useEffect(() => {
    const handleScroll = () => {
      if (scrollThrottleRef.current) return;

      scrollThrottleRef.current = requestAnimationFrame(() => {
        if (!scrollRef.current) {
          scrollThrottleRef.current = undefined;
          return;
        }

        const sectionWidth = scrollRef.current.offsetWidth;
        const scrollLeft = scrollRef.current.scrollLeft;
        const newSection = Math.round(scrollLeft / sectionWidth);

        if (newSection !== currentSection && newSection >= 0 && newSection < sectionCount) {
          setCurrentSection(newSection);
        }

        scrollThrottleRef.current = undefined;
      });
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (scrollThrottleRef.current) {
        cancelAnimationFrame(scrollThrottleRef.current);
      }
    };
  }, [currentSection]);

  if (user) return null;

  const navItems = ["Beranda", "Fitur", "Layanan", "Tentang", "Masuk"];

  return (
    <main className="lp-main">
      <CustomCursor />
      <GrainOverlay />

      {/* Animated Background — WebGL Shader */}
      <div ref={shaderContainerRef} className={`lp-bg-shader ${isLoaded ? "lp-loaded" : ""}`} style={{ contain: "strict" }}>
        <Shader className="lp-shader-canvas">
          <Swirl colorA="#ffffff" colorB="#ffffff" speed={0.8} detail={0.8} blend={50} coarseX={40} coarseY={40} mediumX={40} mediumY={40} fineX={40} fineY={40} />
          <ChromaFlow baseColor="#ffffff" upColor="#eeecec" downColor="#b8b8b8" leftColor="#c8c8c8" rightColor="#c8c8c8" intensity={0.9} radius={1.8} momentum={25} maskType="alpha" opacity={0.97} />
        </Shader>
        <div className="lp-bg-overlay" />
      </div>

      {/* Navbar */}
      <nav className={`lp-topnav ${isLoaded ? "lp-loaded" : ""}`}>
        <button className="lp-nav-brand" onClick={() => scrollToSection(0)}>
          <div className="lp-brand-icon">
            <span>S</span>
          </div>
          <span className="lp-brand-text">SIMATA</span>
        </button>

        <div className="lp-topnav-links">
          {navItems.map((item, i) => (
            <button
              key={item}
              onClick={() => {
                if (i === 4) setAuthMode("login");
                scrollToSection(i);
              }}
              className={`lp-topnav-link ${currentSection === i ? "active" : ""}`}
            >
              {item}
              <span className={`lp-topnav-underline ${currentSection === i ? "active" : ""}`} />
            </button>
          ))}
        </div>
      </nav>

      {/* Horizontal Scroll Sections */}
      <div ref={scrollRef} className={`lp-scroll-container ${isLoaded ? "lp-loaded" : ""}`}>
        {/* ── Section 0: Hero ── */}
        <section className="lp-section lp-hero-section">
          <div className="lp-hero-content">
            <motion.h1 className="lp-hero-title" initial={{ opacity: 0, y: 40 }} animate={isLoaded ? { opacity: 1, y: 0 } : {}} transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <span style={{ textWrap: "balance" }}>
                Perjalanan
                <br />
                <span className="lp-hero-title-accent">tanpa batas</span>
                <br />
                <span className="lp-hero-title-accent">untuk Anda</span>
              </span>
            </motion.h1>
            <motion.p className="lp-hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={isLoaded ? { opacity: 1, y: 0 } : {}} transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <span style={{ textWrap: "pretty" }}>Platform pemesanan tiket bus modern yang menghubungkan ribuan rute di seluruh Nusantara dengan pengalaman pemesanan instan terbaik.</span>
            </motion.p>
            <motion.div className="lp-hero-actions" initial={{ opacity: 0, y: 20 }} animate={isLoaded ? { opacity: 1, y: 0 } : {}} transition={{ duration: 1, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <MagneticButton
                size="lg"
                variant="primary"
                onClick={() => {
                  setAuthMode("login");
                  scrollToSection(4);
                }}
              >
                Masuk
              </MagneticButton>
              <MagneticButton
                size="lg"
                variant="secondary"
                onClick={() => {
                  setAuthMode("register");
                  scrollToSection(4);
                }}
              >
                Daftar
              </MagneticButton>
            </motion.div>
          </div>

          <motion.div className="lp-scroll-hint" initial={{ opacity: 0 }} animate={isLoaded ? { opacity: 1 } : {}} transition={{ duration: 1, delay: 1.2 }}>
            <p>Scroll untuk menjelajahi</p>
            <div className="lp-scroll-pill">
              <div className="lp-scroll-dot" />
            </div>
          </motion.div>
        </section>

        {/* ── Section 1: Featured / Fitur ── */}
        <FeaturedSection />

        {/* ── Section 2: Services / Layanan ── */}
        <ServicesSection />

        {/* ── Section 3: About / Tentang ── */}
        <AboutSection scrollToSection={scrollToSection} />

        {/* ── Section 4: Masuk ── */}
        <MasukSection mode={authMode} onModeChange={setAuthMode} />
      </div>

      <style jsx global>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}

/* ─── Featured Section (Work Section adapted) ─── */
function FeaturedSection() {
  const { ref, isVisible } = useReveal(0.3);

  const features = [
    {
      number: "01",
      title: "Reservasi Instan",
      category: "Pemesanan Tiket",
      direction: "left",
    },
    {
      number: "02",
      title: "E-Tiket Digital",
      category: "QR Code & Paperless",
      direction: "right",
    },
    {
      number: "03",
      title: "100% Aman",
      category: "Enkripsi Berlapis",
      direction: "left",
    },
  ];

  return (
    <section ref={ref as React.Ref<HTMLElement>} className="lp-section lp-work-section">
      <div className="lp-section-inner">
        <div className={`lp-section-heading lp-anim-base ${isVisible ? "revealed" : "hidden-left"}`}>
          <h2>Fitur Unggulan</h2>
          <p className="lp-mono-sub">/ Apa yang membuat SIMATA berbeda</p>
        </div>

        <div className="lp-project-list">
          {features.map((f, i) => (
            <div
              key={i}
              className={`lp-project-card lp-anim-base ${isVisible ? "revealed" : f.direction === "left" ? "hidden-left" : "hidden-right"}`}
              style={{
                transitionDelay: `${i * 150}ms`,
              }}
            >
              <div className="lp-project-left">
                <span className="lp-project-num">{f.number}</span>
                <div>
                  <h3>{f.title}</h3>
                  <p className="lp-project-cat">{f.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Services Section ─── */
function ServicesSection() {
  const { ref, isVisible } = useReveal(0.3);

  const services = [
    {
      title: "Pemesanan Online",
      description: "Pesan tiket bus kapan saja, di mana saja melalui platform digital terpadu",
      direction: "top",
    },
    {
      title: "Pilih Kursi",
      description: "Pilih kursi favorit Anda secara real-time dengan visualisasi layout bus",
      direction: "right",
    },
    {
      title: "Pembayaran Digital",
      description: "Bayar dengan QRIS, E-Wallet, atau transfer bank — aman dan instan",
      direction: "left",
    },
    {
      title: "Manajemen Armada",
      description: "Sistem terpadu untuk PO Bus mengelola jadwal, rute, dan armada",
      direction: "bottom",
    },
  ];

  const dirClass = (dir: string) => {
    if (isVisible) return "revealed";
    switch (dir) {
      case "left":
        return "hidden-left";
      case "right":
        return "hidden-right";
      case "top":
        return "hidden-top";
      case "bottom":
        return "hidden-bottom";
      default:
        return "hidden-bottom";
    }
  };

  return (
    <section ref={ref as React.Ref<HTMLElement>} className="lp-section lp-services-section">
      <div className="lp-section-inner">
        <div className={`lp-section-heading lp-anim-base ${isVisible ? "revealed" : "hidden-top"}`}>
          <h2>Layanan</h2>
          <p className="lp-mono-sub">/ Yang kami tawarkan</p>
        </div>
        <div className="lp-services-grid">
          {services.map((s, i) => (
            <div key={i} className={`lp-service-card lp-anim-base ${dirClass(s.direction)}`} style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="lp-service-num">
                <div className="lp-service-line" />
                <span>0{i + 1}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── About Section ─── */
function AboutSection({ scrollToSection }: { scrollToSection: (i: number) => void }) {
  const { ref, isVisible } = useReveal(0.3);

  const stats = [
    { value: "150+", label: "Proyek", sublabel: "Terselesaikan dengan baik" },
    { value: "8", label: "Tahun", sublabel: "Inovasi berkelanjutan" },
    { value: "12", label: "Penghargaan", sublabel: "Pengakuan industri" },
  ];

  return (
    <section ref={ref as React.Ref<HTMLElement>} className="lp-section lp-about-section">
      <div className="lp-section-inner">
        <div className="lp-about-grid">
          <div className="lp-about-left">
            <div className={`lp-section-heading lp-anim-base ${isVisible ? "revealed" : "hidden-top"}`}>
              <h2>
                Membangun
                <br />
                masa depan
                <br />
                <span className="lp-text-faded">digital</span>
              </h2>
            </div>
            <div className={`lp-about-desc lp-anim-base ${isVisible ? "revealed" : "hidden-bottom"}`} style={{ transitionDelay: "200ms" }}>
              <p>Kami adalah tim kreatif yang berfokus membangun pengalaman digital modern dengan pendekatan desain dan teknologi yang matang.</p>
              <p>Setiap produk kami rancang untuk memberikan nilai nyata, performa tinggi, dan pengalaman pengguna yang berkesan.</p>
            </div>

            <div className={`lp-about-actions lp-anim-base ${isVisible ? "revealed" : "hidden-bottom"}`} style={{ transitionDelay: "500ms" }}>
              <MagneticButton size="lg" variant="primary" onClick={() => scrollToSection(4)}>
                Mulai Proyek
              </MagneticButton>
              <MagneticButton size="lg" variant="secondary" onClick={() => scrollToSection(1)}>
                Lihat Fitur
              </MagneticButton>
            </div>
          </div>

          <div className="lp-stats-grid">
            {stats.map((st, i) => (
              <div
                key={i}
                className={`lp-stat-row lp-anim-base ${isVisible ? "revealed" : i % 2 === 0 ? "hidden-left" : "hidden-right"}`}
                style={{
                  transitionDelay: `${300 + i * 150}ms`,
                }}
              >
                <div className="lp-stat-value">{st.value}</div>
                <div>
                  <div className="lp-stat-label">{st.label}</div>
                  <div className="lp-stat-sub">{st.sublabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Masuk Section ─── */
function MasukSection({ mode, onModeChange }: { mode: "login" | "register"; onModeChange: (mode: "login" | "register") => void }) {
  const router = useRouter();
  const { ref, isVisible } = useReveal(0.3);
  const { login, register } = useAppStore();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  const switchMode = () => {
    onModeChange(isLogin ? "register" : "login");
    setError("");
    setFormData({ name: "", email: "", password: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    let ok = false;
    let loggedInUser = null;
    if (isLogin) {
      let customerOk = await login(formData.email, formData.password, "customer");
      let adminOk = !customerOk ? await login(formData.email, formData.password, "admin") : false;
      let providerOk = !customerOk && !adminOk ? await login(formData.email, formData.password, "provider") : false;
      ok = customerOk || adminOk || providerOk;
      if (!ok) {
        setError("Email atau password salah.");
      } else {
        // we have to check what role user actually has
        loggedInUser = { role: adminOk ? "admin" : providerOk ? "provider" : "customer" };
      }
    } else {
      if (!formData.name.trim()) {
        setError("Nama wajib diisi.");
        setIsSubmitting(false);
        return;
      }
      ok = await register(formData.name.trim(), formData.email, formData.password, "customer");
      if (!ok) {
        setError("Email sudah terdaftar atau terjadi kesalahan.");
      } else {
        loggedInUser = { role: "customer" };
      }
    }

    setIsSubmitting(false);
    if (ok) {
      router.push(loggedInUser?.role === "admin" || loggedInUser?.role === "provider" ? "/admin/dashboard" : "/home");
    }
  };

  return (
    <section ref={ref as React.Ref<HTMLElement>} className="lp-section lp-contact-section">
      <div className="lp-section-inner">
        <div className="lp-contact-grid">
          {/* Left side */}
          <div className="lp-contact-left-col">
            <div className={`lp-section-heading lp-anim-base ${isVisible ? "revealed" : "hidden-left"}`}>
              <h2>{isLogin ? "Masuk" : "Daftar"}</h2>

            </div>

          </div>

          {/* Right side — Contact Form */}
          <div className="lp-contact-form-col">
            <form onSubmit={handleSubmit} className="lp-contact-form" autoComplete="off">
              {!isLogin && (
                <div className={`lp-form-group lp-anim-base ${isVisible ? "revealed" : "hidden-right"}`} style={{ transitionDelay: "200ms" }}>
                  <label className="lp-form-label">Nama</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required={!isLogin} className="lp-form-input" placeholder="Nama Anda" autoComplete="off" />
                </div>
              )}

              <div className={`lp-form-group lp-anim-base ${isVisible ? "revealed" : "hidden-right"}`} style={{ transitionDelay: isLogin ? "200ms" : "350ms" }}>
                <label className="lp-form-label">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="lp-form-input" placeholder="contoh@gmail.com" autoComplete="off" />
              </div>

              <div className={`lp-form-group lp-anim-base ${isVisible ? "revealed" : "hidden-right"}`} style={{ transitionDelay: isLogin ? "350ms" : "500ms" }}>
                <label className="lp-form-label">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="lp-form-input" placeholder="••••••••" autoComplete="new-password" />
              </div>


              {error && <p className="lp-form-error">{error}</p>}

              <div className={`lp-anim-base ${isVisible ? "revealed" : "hidden-bottom"}`} style={{ transitionDelay: "650ms", display: "flex", gap: "12px" }}>
                <MagneticButton variant="primary" size="lg" className="lp-form-submit">
                  {isSubmitting ? (isLogin ? "Masuk..." : "Mendaftar...") : isLogin ? "Masuk" : "Daftar"}
                </MagneticButton>
                <MagneticButton
                  variant="ghost"
                  size="lg"
                  className="lp-form-submit"
                  onClick={() => {
                    router.push("/home");
                  }}
                >
                  Masuk tanpa login{" "}
                </MagneticButton>
              </div>
            </form>{" "}
            <p className={`lp-auth-switch lp-anim-base ${isVisible ? "revealed" : "hidden-bottom"}`} style={{ transitionDelay: "760ms" }}>
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button type="button" onClick={switchMode} className="lp-admin-link lp-auth-switch-btn">
                {isLogin ? "Daftar" : "Masuk"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
