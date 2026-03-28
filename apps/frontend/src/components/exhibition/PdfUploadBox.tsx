import { X } from "lucide-react";
import { FaRegFilePdf } from "react-icons/fa6";
import UploadBox from "./UploadBox";

type Props = {
  fileName?: string;
  onRemove: () => void;
  onFileChange: (file: File | undefined) => void;
};

export default function PdfUploadBox({
  fileName,
  onRemove,
  onFileChange,
}: Props) {
  if (fileName) {
    return (
      <div style={{ position: "relative", marginTop: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            border: "1.5px solid #cbd5e1",
            borderRadius: "8px",
            background: "#fff",
          }}
        >
          <FaRegFilePdf size={20} style={{ color: "#3b82f6" }} />
          <span
            style={{
              fontSize: 13,
              color: "#334155",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 500,
            }}
          >
            {fileName}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(220, 50, 50, 0.8)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(0, 0, 0, 0.55)")
          }
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <UploadBox
      accept="application/pdf"
      onChange={onFileChange}
      text="คลิกเพื่อเลือกไฟล์ PDF"
      hint="PDF — สูงสุด 10MB"
    />
  );
}
