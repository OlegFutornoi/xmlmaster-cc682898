
-- Додаємо поле display_order до таблиці template_xml_parameters
ALTER TABLE template_xml_parameters 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Додаємо поле display_order до таблиці store_template_parameters
ALTER TABLE store_template_parameters 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Оновлюємо існуючі записи, встановлюючи порядок за замовчуванням
UPDATE template_xml_parameters 
SET display_order = 0 
WHERE display_order IS NULL;

UPDATE store_template_parameters 
SET display_order = 0 
WHERE display_order IS NULL;
