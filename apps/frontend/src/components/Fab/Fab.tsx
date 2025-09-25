import { Plus } from 'lucide-react';
import styles from './Fab.module.css';
export default function Fab({ onClick }: { onClick?: () => void }) {
    return <button className={styles.fab} onClick={onClick} aria-label="เพิ่มนิทรรศการ"><Plus size={22} /></button>;
}
