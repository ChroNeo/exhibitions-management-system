import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import ExhibitionCard from "../../components/exhibition/ExhibitionCard";
import { useExhibitions } from "../../hook/useExhibitions";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const { data: exhibitions = [], isLoading } = useExhibitions();
  const slides = exhibitions.filter((ex) => ex.coverUrl);

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
                {slides.map((ex) => (
                  <Link
                    key={ex.id}
                    to={`/exhibitions/${ex.id}`}
                    className={styles.slide}
                  >
                    <div className={styles.slideAspect}>
                      <img
                        className={styles.slideImg}
                        src={ex.coverUrl!}
                        alt={ex.title}
                      />
                    </div>
                    <div className={styles.overlay}>
                      <h3 className={styles.slideTitle}>{ex.title}</h3>
                      <p className={styles.slideMeta}>
                        {ex.dateText} • {ex.location}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <button
                className={`${styles.arrow} ${styles.left}`}
                onClick={prev}
                aria-label="Previous"
              >
                ❮
              </button>
              <button
                className={`${styles.arrow} ${styles.right}`}
                onClick={next}
                aria-label="Next"
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
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className={styles.listSection}>
          <h2 className={styles.sectionTitle}>รายการนิทรรศการทั้งหมด</h2>
          {isLoading && <p>กำลังโหลด...</p>}

          <div className={styles.grid}>
            {exhibitions.map((ex) => (
              <Link
                key={ex.id}
                to={`/exhibitions/${ex.id}`}
                className={styles.cardLink}
              >
                <div className={styles.forceVertical}>
                  <ExhibitionCard item={ex} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
