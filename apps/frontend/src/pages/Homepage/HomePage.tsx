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

  const slides = data?.featureImages ?? [];
  const exhibitions = data?.exhibitions ?? [];

  // index ของ slideTrack (มีสไลด์หลอกหัว-ท้าย)
  const [index, setIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);

  // fullscreen stuff
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

  // โหมด hero เต็มหน้า (ไร้ header/รายการด้านล่าง)
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

  // autoplay
  useEffect(() => {
    if (extendedSlides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => i + 1), 4000);
    return () => clearInterval(t);
  }, [extendedSlides.length]);

  // ปุ่ม
  const next = () => setIndex((i) => i + 1);
  const prev = () => setIndex((i) => i - 1);

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
            <div className={styles.slideWrapper}>
              <div
                className={styles.slideTrack}
                style={{
                  transform: `translateX(-${index * 100}%)`,
                  transition: enableTransition ? undefined : "none",
                }}
                onTransitionEnd={() => {
                  if (slides.length > 1) {
                    if (index === extendedSlides.length - 1) {
                      // ถึงสไลด์ปลอมท้าย -> กระโดดกลับสไลด์จริงตัวแรก
                      setEnableTransition(false);
                      setIndex(1);
                      // รอ 50ms ก่อนเปิด transition กลับ
                      setTimeout(() => setEnableTransition(true), 50);
                    } else if (index === 0) {
                      // ถึงสไลด์ปลอมหน้า -> กระโดดไปสไลด์จริงตัวสุดท้าย
                      setEnableTransition(false);
                      setIndex(extendedSlides.length - 2);
                      setTimeout(() => setEnableTransition(true), 50);
                    }
                  }
                }}
              >
                {extendedSlides.map((slide: any, i: number) => (
                  <div
                    key={`${slide.ref_id}-${i}`}
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
            </div>

            {slides.length > 1 && (
              <div className={styles.dots}>
                {slides.map((_: any, i: number) => {
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
                      status: (ex.status as "draft" | "published" | "ongoing" | "ended" | "archived") ?? "draft",
                      isPinned: false,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
