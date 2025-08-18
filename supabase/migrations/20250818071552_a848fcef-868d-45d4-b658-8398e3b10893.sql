
-- Очищуємо старі дані та створюємо правильну структуру для зберігання розпарсених XML елементів
DROP TABLE IF EXISTS xml_parsed_elements CASCADE;

-- Створюємо нову таблицю для зберігання всіх розпарсених елементів
CREATE TABLE xml_parsed_structure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES template_xml(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL, -- 'shop_info', 'currency', 'category', 'offer', 'param'
  element_name TEXT NOT NULL,
  element_value TEXT,
  element_path TEXT NOT NULL,
  parent_id UUID REFERENCES xml_parsed_structure(id) ON DELETE CASCADE,
  attributes JSONB DEFAULT '{}',
  cdata_content TEXT,
  multilingual_values JSONB DEFAULT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Додаємо RLS політики
ALTER TABLE xml_parsed_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage parsed structure" ON xml_parsed_structure FOR ALL USING (true);
CREATE POLICY "Users can view parsed structure" ON xml_parsed_structure FOR SELECT USING (true);

-- Створюємо індекси
CREATE INDEX idx_xml_parsed_structure_template_id ON xml_parsed_structure(template_id);
CREATE INDEX idx_xml_parsed_structure_type ON xml_parsed_structure(element_type);
CREATE INDEX idx_xml_parsed_structure_parent ON xml_parsed_structure(parent_id);

-- Додаємо тригер для updated_at
CREATE OR REPLACE TRIGGER update_xml_parsed_structure_updated_at
  BEFORE UPDATE ON xml_parsed_structure
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Оновлюємо таблицю template_xml_parameters для кращого зберігання параметрів
ALTER TABLE template_xml_parameters 
ADD COLUMN IF NOT EXISTS multilingual_values JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cdata_content TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS element_attributes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS param_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS value_id TEXT DEFAULT NULL;
