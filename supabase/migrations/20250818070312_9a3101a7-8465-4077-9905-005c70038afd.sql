
-- Додаємо нові колонки до таблиці template_xml_parameters для зберігання всіх можливих полів
ALTER TABLE template_xml_parameters ADD COLUMN IF NOT EXISTS multilingual_values JSONB DEFAULT NULL;
ALTER TABLE template_xml_parameters ADD COLUMN IF NOT EXISTS cdata_content TEXT DEFAULT NULL;
ALTER TABLE template_xml_parameters ADD COLUMN IF NOT EXISTS element_attributes JSONB DEFAULT NULL;

-- Створюємо таблицю для зберігання розпарсених даних з XML
CREATE TABLE IF NOT EXISTS xml_parsed_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES template_xml(id) ON DELETE CASCADE,
  element_name TEXT NOT NULL,
  element_value TEXT,
  element_path TEXT NOT NULL,
  element_attributes JSONB DEFAULT '{}',
  cdata_content TEXT,
  multilingual_values JSONB DEFAULT NULL,
  parent_element_id UUID REFERENCES xml_parsed_elements(id) ON DELETE CASCADE,
  element_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Додаємо RLS політики для нової таблиці
ALTER TABLE xml_parsed_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage parsed elements" ON xml_parsed_elements FOR ALL USING (true);
CREATE POLICY "Users can view parsed elements" ON xml_parsed_elements FOR SELECT USING (true);

-- Створюємо індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_xml_parsed_elements_template_id ON xml_parsed_elements(template_id);
CREATE INDEX IF NOT EXISTS idx_xml_parsed_elements_element_name ON xml_parsed_elements(element_name);
CREATE INDEX IF NOT EXISTS idx_xml_parsed_elements_path ON xml_parsed_elements(element_path);

-- Додаємо тригер для оновлення updated_at
CREATE OR REPLACE TRIGGER update_xml_parsed_elements_updated_at
  BEFORE UPDATE ON xml_parsed_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
