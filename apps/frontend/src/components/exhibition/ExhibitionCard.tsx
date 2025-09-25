import styles from './ExhibitionCard.module.css';
import { Edit2 } from 'lucide-react';
import type { Exhibition } from './../../types/exhibition';

export default function ExhibitionCard({ item, onEdit }: { item: Exhibition; onEdit?: (id: string) => void; }) {
    return (
        <div className={styles.card}>
            <div className={styles.inner}>
                {item.coverUrl
                    ? <img src={item.coverUrl} alt={item.title} className={styles.cover} />
                    : <div className={styles.cover} />}
                <div>
                    <h3 className={styles.title}>
                        {item.title}
                        {item.isPinned && <span style={{ width: 8, height: 8, borderRadius: 999, background: '#38bdf8' }} />}
                    </h3>
                    {item.description && <p className={styles.desc}>{item.description}</p>}
                    <p className={styles.meta}>{item.dateText}</p>
                    <p className={styles.meta}>สถานที่ {item.location}</p>
                </div>
                <div>
                    <button className={styles.editBtn} onClick={() => onEdit?.(item.id)} title="แก้ไข">
                        <Edit2 size={16} /> แก้ไข
                    </button>
                </div>
            </div>
        </div>
    );
}
