
-- Видаляємо старе унікальне обмеження
ALTER TABLE public.store_template_parameters 
DROP CONSTRAINT store_template_parameters_store_id_parameter_name_key;

-- Додаємо нове унікальне обмеження, що включає xml_path
ALTER TABLE public.store_template_parameters 
ADD CONSTRAINT store_template_parameters_store_id_parameter_name_xml_path_key 
UNIQUE (store_id, parameter_name, xml_path);
