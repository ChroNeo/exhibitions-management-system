import styles from './Panel.module.css';

export default function Panel({ title, children }:{ title:string; children:React.ReactNode }) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
