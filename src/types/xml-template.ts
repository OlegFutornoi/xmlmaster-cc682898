
// Типи для роботи з XML-шаблонами
export interface XMLTemplate {
  id: string;
  name: string;
  structure: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  shop_name?: string;
  shop_company?: string;
  shop_url?: string;
  parameters?: XMLTemplateParameter[];
  currencies?: TemplateCurrency[];
  categories?: TemplateCategory[];
  images?: TemplateImage[];
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
  parameter_category: 'parameter' | 'characteristic';
  created_at: string;
  updated_at: string;
}

export interface TemplateCurrency {
  id: string;
  template_id: string;
  currency_code: string;
  rate: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateCategory {
  id: string;
  template_id: string;
  category_name: string;
  external_id?: string;
  rz_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateImage {
  id: string;
  template_id: string;
  image_field_name: string;
  is_multiple: boolean;
  max_count?: number;
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
  shop_info?: Record<string, any>;
  currencies?: Record<string, any>[];
  categories?: Record<string, any>[];
  offers?: Record<string, any>[];
}

export interface XMLUploadRequest {
  name: string;
  method: 'file' | 'url';
  file?: File;
  url?: string;
}

export interface ParsedXMLStructure {
  shop?: {
    name?: string;
    company?: string;
    url?: string;
  };
  currencies?: Array<{
    id: string;
    rate: number;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    rz_id?: string;
  }>;
  offers?: Array<{
    id: string;
    available?: boolean;
    [key: string]: any;
  }>;
  parameters: Array<{
    name: string;
    value: any;
    path: string;
    type: 'parameter' | 'characteristic';
    category: 'shop' | 'currency' | 'category' | 'offer';
  }>;
}
