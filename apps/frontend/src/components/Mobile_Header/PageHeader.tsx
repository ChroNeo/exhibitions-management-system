import { useState } from 'react';
import styles from './PageHeader.module.css';
import MobileMenu, { type MenuKey } from '../Burgerbar/MobileMenu';

export default function PageHeader({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const onSelect = (k: MenuKey) => console.log('mobile menu:', k);

  return (
    <div className={styles.header}>
      <div className={styles.row}>
        <button
          className={styles.burger}
          onClick={() => setOpen(true)}
          aria-label="เมนู"
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <rect x="0" y="1" width="22" height="2" rx="1" fill="white" />
            <rect x="0" y="7" width="22" height="2" rx="1" fill="white" />
            <rect x="0" y="13" width="22" height="2" rx="1" fill="white" />
          </svg>
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} onSelect={onSelect} />
    </div>
  );
}
