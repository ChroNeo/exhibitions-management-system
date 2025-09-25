import styles from "./ExhibitionList.module.css";
import ExhibitionCard from "./ExhibitionCard";
import type { Exhibition } from "./../../types/exhibition";

export default function ExhibitionList({
  items,
  onEdit,
  onSelect,
}: {
  items: Exhibition[];
  onEdit?: (id: string) => void;
  onSelect?: (id: string) => void;
}) {
  if (!items.length)
    return <div className={styles.empty}>ยังไม่มีนิทรรศการ</div>;
  return (
    <div className={styles.list}>
      {items.map((e) => (
        <ExhibitionCard
          key={e.id}
          item={e}
          onEdit={onEdit}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
