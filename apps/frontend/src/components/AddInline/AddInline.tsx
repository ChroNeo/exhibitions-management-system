import styles from './AddInline.module.css';

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function AddInline({ onClick }: { onClick?: () => void }) {
    return (
        <div className={styles.wrap}>
            <button className={styles.btn} onClick={onClick} aria-label="เพิ่มนิทรรศการ">
                <PlusIcon />
            </button>
        </div>
    );
}
