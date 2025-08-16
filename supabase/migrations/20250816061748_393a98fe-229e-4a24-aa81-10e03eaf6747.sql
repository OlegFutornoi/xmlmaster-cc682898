
-- Створюємо нову таблицю для зберігання повної структури XML шаблону
CREATE TABLE IF NOT EXISTS template_xml_structure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES template_xml(id) ON DELETE CASCADE,
  structure_type TEXT NOT NULL, -- 'shop', 'currency', 'category', 'offer', 'characteristic'
  element_name TEXT NOT NULL,
  element_value TEXT,
  xml_path TEXT NOT NULL,
  parent_id UUID REFERENCES template_xml_structure(id) ON DELETE CASCADE,
  attributes JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Створюємо індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_template_xml_structure_template_id ON template_xml_structure(template_id);
CREATE INDEX IF NOT EXISTS idx_template_xml_structure_type ON template_xml_structure(structure_type);
CREATE INDEX IF NOT EXISTS idx_template_xml_structure_parent ON template_xml_structure(parent_id);

-- Додаємо RLS політики
ALTER TABLE template_xml_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template structure" 
  ON template_xml_structure 
  FOR ALL 
  USING (true);

CREATE POLICY "Users can view template structure" 
  ON template_xml_structure 
  FOR SELECT 
  USING (true);

-- Тригер для автоматичного оновлення updated_at
CREATE OR REPLACE TRIGGER update_template_xml_structure_updated_at
    BEFORE UPDATE ON template_xml_structure
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Створюємо таблицю для зберігання параметрів товарів з множинними значеннями
CREATE TABLE IF NOT EXISTS template_offer_parameters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES template_xml(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  parameter_values JSONB NOT NULL DEFAULT '[]', -- масив значень з мовами
  xml_path TEXT NOT NULL,
  parameter_type TEXT DEFAULT 'text',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Створюємо індекси
CREATE INDEX IF NOT EXISTS idx_template_offer_parameters_template_id ON template_offer_parameters(template_id);

-- Додаємо RLS політики
ALTER TABLE template_offer_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage offer parameters" 
  ON template_offer_parameters 
  FOR ALL 
  USING (true);

CREATE POLICY "Users can view offer parameters" 
  ON template_offer_parameters 
  FOR SELECT 
  USING (true);

-- Тригер для автоматичного оновлення updated_at
CREATE OR REPLACE TRIGGER update_template_offer_parameters_updated_at
    BEFORE UPDATE ON template_offer_parameters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
