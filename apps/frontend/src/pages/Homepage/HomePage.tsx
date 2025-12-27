import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import ExhibitionCard from "../../components/exhibition/ExhibitionCard";
import { useFeature } from "../../hook/useFeature";
import styles from "./HomePage.module.css";
import { toFileUrl } from "../../utils/url";

export default function HomePage() {
  const { data, isLoading } = useFeature();
  const location = useLocation();
  const navigate = useNavigate();

  const slides = useMemo(
    () =>
      (data?.featureImages ?? []).filter(
        (slide) =>
          typeof slide.image === "string" && slide.image.trim().length > 0
      ),
    [data?.featureImages]
  );
  const exhibitions = data?.exhibitions ?? [];

  // index ของ slideTrack (มีสไลด์หลอกหัว-ท้าย)
  const [index, setIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);

  // fullscreen
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const onFsChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && heroRef.current) {
        await heroRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Failed to toggle fullscreen", err);
    }
  };

  const params = new URLSearchParams(location.search);
  const isHeroFull = params.get("hero") === "full";

  // ทำสไลด์หลอกหัวท้ายเพื่อให้ loop เนียน
  const extendedSlides = useMemo(() => {
    if (slides.length <= 1) return slides;
    const first = slides[0];
    const last = slides[slides.length - 1];
    return [last, ...slides, first];
  }, [slides]);

  // เริ่มที่สไลด์จริงตัวแรกเสมอ
  useEffect(() => {
    setEnableTransition(false);
    setIndex(slides.length > 1 ? 1 : 0);
    const id = setTimeout(() => setEnableTransition(true), 0);
    return () => clearTimeout(id);
  }, [slides.length]);

  // ล็อกกันสแปมคลิก
  const animLock = useRef(false);
  const lock = (ms = 450) => {
    animLock.current = true;
    setTimeout(() => (animLock.current = false), ms);
  };

  const next = () => {
    if (animLock.current) return;
    lock();
    setIndex((i) => Math.min(i + 1, extendedSlides.length - 1));
  };
  const prev = () => {
    if (animLock.current) return;
    lock();
    setIndex((i) => Math.max(i - 1, 0));
  };

  // Auto play (กัน index หลุดช่วง)
  useEffect(() => {
    if (extendedSlides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i >= extendedSlides.length - 1 ? 1 : i + 1));
    }, 10000);
    return () => clearInterval(t);
  }, [extendedSlides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    if (index === extendedSlides.length - 1) {
      // ถึงปลายขวา
      setTimeout(() => {
        setEnableTransition(false);
        setIndex(1);
        requestAnimationFrame(() => setEnableTransition(true));
      }, 500);
    } else if (index === 0) {
      // ถึงปลายซ้าย
      setTimeout(() => {
        setEnableTransition(false);
        setIndex(extendedSlides.length - 2);
        requestAnimationFrame(() => setEnableTransition(true));
      }, 500);
    }
  }, [index, slides.length, extendedSlides.length]);

  return (
    <>
      {!isHeroFull && <HeaderBar active="home" />}

      <main className={isHeroFull ? styles.fullContainer : styles.container}>
        {/* HERO */}
        {slides.length > 0 && (
          <section
            className={`${styles.hero} ${styles.fullBleed} ${
              isHeroFull ? styles.heroFull : styles.heroTall
            }`}
            ref={heroRef}
          >
            <div
              className={styles.slideTrack}
              style={{
                transform: `translateX(-${index * 100}%)`,
                transition: enableTransition ? undefined : "none",
              }}
              onTransitionEnd={() => {
                animLock.current = false; // ปลดล็อกเมื่อแอนิเมตจบ
              }}
            >
              {extendedSlides.map((slide: { image: string; title: string; start_date: string; end_date: string; location: string }, i: number) => (
                <div
                  key={i}
                  className={styles.slide}
                  role="group"
                  aria-label={slide.title}
                >
                  <div className={styles.slideAspect}>
                    <img
                      className={styles.slideImg}
                      src={toFileUrl(slide.image)}
                      alt={slide.title}
                    />
                  </div>

                  <div className={styles.overlay}>
                    <h3 className={styles.slideTitle}>{slide.title}</h3>
                    <p className={styles.slideMeta}>
                      {new Date(slide.start_date).toLocaleDateString()} –{" "}
                      {new Date(slide.end_date).toLocaleDateString()} •{" "}
                      {slide.location}
                    </p>

                    <div className={styles.fsRow}>
                      {!isHeroFull && !isFs && (
                        <button
                          type="button"
                          className={styles.fsBtn}
                          onClick={toggleFullscreen}
                          aria-label="แสดงเต็มจอ"
                          title="แสดงเต็มจอ"
                        >
                          แสดงเต็มจอ
                        </button>
                      )}
                      {isHeroFull && (
                        <button
                          type="button"
                          className={styles.fsBtn}
                          onClick={() =>
                            navigate({
                              pathname: location.pathname,
                              search: "",
                            })
                          }
                          title="ปิดโหมดประกาศ"
                        >
                          ปิดโหมดประกาศ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {slides.length > 1 && (
              <>
                <button
                  className={`${styles.arrow} ${styles.left}`}
                  onClick={prev}
                  aria-label="Previous slide"
                >
                  ❮
                </button>
                <button
                  className={`${styles.arrow} ${styles.right}`}
                  onClick={next}
                  aria-label="Next slide"
                >
                  ❯
                </button>
              </>
            )}

            {slides.length > 1 && (
              <div className={styles.dots}>
                {slides.map((_: { image: string; title: string; start_date: string; end_date: string; location: string }, i: number) => {
                  const active =
                    (index - 1 + slides.length) % slides.length === i;
                  return (
                    <button
                      key={i}
                      className={`${styles.dot} ${active ? styles.active : ""}`}
                      onClick={() => setIndex(i + 1)}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* EXHIBITIONS */}
        {!isHeroFull && (
          <section className={styles.listSection}>
            <h2 className={styles.sectionTitle}>รายการนิทรรศการทั้งหมด</h2>
            {isLoading && <p>กำลังโหลด...</p>}

            <div className={styles.grid}>
              {exhibitions.map((ex) => (
                <Link
                  key={ex.exhibition_id}
                  to={`/exhibitions/${ex.exhibition_id}`}
                  className={styles.cardLink}
                >
                  <div className={styles.forceVertical}>
                    <ExhibitionCard
                      item={{
                        id: String(ex.exhibition_id),
                        title: ex.title,
                        location: ex.location,
                        coverUrl: `${ex.picture_path}`,
                        dateText: `${new Date(
                          ex.start_date
                        ).toLocaleDateString()} - ${new Date(
                          ex.end_date
                        ).toLocaleDateString()}`,
                        picture_path: ex.picture_path,
                        start_date: ex.start_date,
                        end_date: ex.end_date,
                        organizer_name: "",
                        description: "",
                        status:
                          (ex.status as
                            | "draft"
                            | "published"
                            | "ongoing"
                            | "ended"
                            | "archived") ?? "draft",
                        isPinned: false,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
