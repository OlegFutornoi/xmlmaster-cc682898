
-- Додаємо колонку для зберігання вкладених значень параметрів
ALTER TABLE template_xml_parameters 
ADD COLUMN nested_values JSONB DEFAULT NULL;

-- Додаємо колонку для батьківського параметра
ALTER TABLE template_xml_parameters 
ADD COLUMN parent_parameter TEXT DEFAULT NULL;

-- Додаємо колонку для зберігання вкладених значень в параметрах магазину
ALTER TABLE store_template_parameters 
ADD COLUMN nested_values JSONB DEFAULT NULL;

-- Додаємо колонку для батьківського параметра в параметрах магазину
ALTER TABLE store_template_parameters 
ADD COLUMN parent_parameter TEXT DEFAULT NULL;

-- Додаємо індекси для кращої продуктивності
CREATE INDEX IF NOT EXISTS idx_template_xml_parameters_parent ON template_xml_parameters(parent_parameter);
CREATE INDEX IF NOT EXISTS idx_store_template_parameters_parent ON store_template_parameters(parent_parameter);
