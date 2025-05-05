
// Типи для роботи з постачальниками та товарами

// Тип для характеристики товару
export interface ProductAttribute {
  id?: string;
  attribute_name: string;
  attribute_value: string;
  product_id?: string;
}

// Тип для зображення товару
export interface ProductImage {
  id?: string;
  product_id?: string;
  image_url: string;
  is_main: boolean;
}

// Тип для товару
export interface Product {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  old_price?: number | null;
  sale_price?: number | null;
  currency: string;
  manufacturer?: string | null;
  category_id?: string | null;
  supplier_id: string;
  user_id?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  category_name?: string; // Для відображення в UI
}

// Тип для категорії товарів
export interface ProductCategory {
  id?: string;
  name: string;
  user_id?: string;
  supplier_id?: string | null;
  product_count: number;
  created_at?: string;
  updated_at?: string;
}

// Тип для постачальника
export interface Supplier {
  id: string;
  name: string;
  url: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_active: boolean;
  product_count: number;
}

// Тип для даних з файлу постачальника
export interface SupplierFileData {
  products: Product[];
  categories: ProductCategory[];
}

// Перечислення для типів файлів постачальників
export enum FileType {
  XML = 'XML',
  CSV = 'CSV',
  UNKNOWN = 'UNKNOWN'
}

// Результат обробки файлу
export interface FileProcessingResult {
  success: boolean;
  message: string;
  data?: SupplierFileData;
  fileType?: FileType;
}
