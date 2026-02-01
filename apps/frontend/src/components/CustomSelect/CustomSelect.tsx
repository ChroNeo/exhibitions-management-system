import { useEffect, useRef, useState } from "react";
import styles from "./CustomSelect.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CustomSelect({ options, value, onChange, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? "";

  return (
    <div className={styles.dropdown} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedLabel}
        <span className={styles.arrow}>▾</span>
      </button>
      {open && (
        <ul className={styles.menu}>
          {options.map((o) => (
            <li
              key={o.value}
              className={`${styles.option} ${value === o.value ? styles.optionActive : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
