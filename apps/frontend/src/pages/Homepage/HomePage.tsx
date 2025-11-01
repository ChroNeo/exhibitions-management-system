import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import ExhibitionCard from "../../components/exhibition/ExhibitionCard";
import { useFeature } from "../../hook/useFeature";
import styles from "./HomePage.module.css";
import { toFileUrl } from "../../utils/url";

export default function HomePage() {
  const { data, isLoading } = useFeature();

  const slides = data?.featureImages ?? [];
  const exhibitions = data?.exhibitions ?? [];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <>
      <HeaderBar active="home" />
      <main className={styles.container}>
        {/* HERO */}
        {slides.length > 0 && (
          <section className={styles.hero}>
            <div className={styles.slideWrapper}>
              <div
                className={styles.slideTrack}
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {slides.map((slide) => (
                  <Link
                    key={slide.ref_id}
                    to={slide.href}
                    className={styles.slide}
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
                    </div>
                  </Link>
                ))}
              </div>

              <button
                className={`${styles.arrow} ${styles.left}`}
                onClick={prev}
              >
                ❮
              </button>
              <button
                className={`${styles.arrow} ${styles.right}`}
                onClick={next}
              >
                ❯
              </button>
            </div>

            <div className={styles.dots}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${
                    i === index ? styles.active : ""
                  }`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </section>
        )}

        {/* EXHIBITIONS */}
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
