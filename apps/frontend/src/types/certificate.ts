export interface LayoutFieldConfig {
  x: number;
  y: number;
  font_size: number;
  color: string;
  align: "left" | "center" | "right";
}

export interface LayoutConfig {
  participant_name?: LayoutFieldConfig;
  exhibition_title?: LayoutFieldConfig;
  date?: LayoutFieldConfig;
  organizer_name?: LayoutFieldConfig;
  [key: string]: LayoutFieldConfig | undefined;
}

export interface CertificateTemplate {
  template_id: number;
  exhibition_id: number;
  exhibition_code: string;
  exhibition_title: string;
  organizer_name: string;
  background_url: string;
  layout_config: LayoutConfig | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCertificateTemplatePayload {
  file: File;
  layout_config?: LayoutConfig;
}

export interface UpdateCertificateTemplatePayload {
  file?: File;
  layout_config?: LayoutConfig;
}
