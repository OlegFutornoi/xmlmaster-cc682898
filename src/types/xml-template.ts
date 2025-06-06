
// Типи для роботи з XML-шаблонами
export interface XMLTemplate {
  id: string;
  name: string;
  structure: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parameters?: XMLTemplateParameter[];
}

export interface XMLTemplateParameter {
  id: string;
  template_id: string;
  parameter_name: string;
  parameter_value: string | null;
  xml_path: string;
  is_active: boolean;
  is_required: boolean;
  parameter_type: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedXMLData {
  id: string;
  template_id: string | null;
  user_id: string;
  file_name: string;
  parsed_data: Record<string, any>;
  raw_xml: string | null;
  status: string;
  created_at: string;
}

export interface XMLUploadRequest {
  name: string;
  method: 'file' | 'url';
  file?: File;
  url?: string;
}
