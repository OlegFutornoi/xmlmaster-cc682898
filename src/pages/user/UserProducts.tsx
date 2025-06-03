
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Plus, Search, Upload, Download, Trash2, Edit, Eye, Archive, RotateCcw, Filter, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Компонент UserProducts - Сторінка управління товарами
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  old_price?: number;
  sale_price?: number;
  sku?: string;
  vendor_code?: string;
  vendor?: string;
  stock_quantity: number;
  category_id?: string;
  store_id: string;
  supplier_id: string;
  user_id: string;
  currency: string;
  external_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imageUrl?: string;
}

interface ImportedProduct {
  name: string;
  description?: string;
  price: number;
  old_price?: number;
  sale_price?: number;
  sku?: string;
  vendor_code?: string;
  vendor?: string;
  stock_quantity: number;
  category?: string;
  currency?: string;
  external_id?: string;
  imageUrl?: string;
}

interface Store {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: string;
  name: string;
  url?: string;
  file_path?: string;
  product_count: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  external_id?: string;
  store_id?: string;
  supplier_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const UserProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importData, setImportData] = useState<ImportedProduct[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    old_price: 0,
    sale_price: 0,
    sku: '',
    vendor_code: '',
    vendor: '',
    stock_quantity: 0,
    category_id: '',
    currency: 'UAH',
    external_id: '',
    imageUrl: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchStores();
      fetchSuppliers();
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStore && selectedSupplier) {
      fetchProducts();
    }
  }, [selectedStore, selectedSupplier, selectedCategory]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stores')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити магазини",
        variant: "destructive",
      });
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити постачальників",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити категорії",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id);

      if (selectedStore) {
        query = query.eq('store_id', selectedStore);
      }

      if (selectedSupplier) {
        query = query.eq('supplier_id', selectedSupplier);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Перетворюємо дані з Supabase до формату Product
      const productsWithImageUrl = (data || []).map(product => ({
        ...product,
        imageUrl: product.external_id || ''
      }));

      setProducts(productsWithImageUrl);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити товари",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedStore || !selectedSupplier) {
      toast({
        title: "Помилка",
        description: "Оберіть магазин та постачальника",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        ...newProduct,
        store_id: selectedStore,
        supplier_id: selectedSupplier,
        user_id: user?.id,
        is_active: true,
        external_id: newProduct.imageUrl || null
      };

      delete productData.imageUrl; // Видаляємо imageUrl перед збереженням

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: "Товар успішно додано",
      });

      setShowAddDialog(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        old_price: 0,
        sale_price: 0,
        sku: '',
        vendor_code: '',
        vendor: '',
        stock_quantity: 0,
        category_id: '',
        currency: 'UAH',
        external_id: '',
        imageUrl: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося додати товар",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      const updateData = {
        ...editingProduct,
        external_id: editingProduct.imageUrl || null
      };

      delete updateData.imageUrl; // Видаляємо imageUrl перед збереженням

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: "Товар успішно оновлено",
      });

      setShowEditDialog(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити товар",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: "Товар успішно видалено",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити товар",
        variant: "destructive",
      });
    }
  };

  const handleArchiveProduct = async (productId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !archive })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: archive ? "Товар архівовано" : "Товар відновлено",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error archiving product:', error);
      toast({
        title: "Помилка",
        description: archive ? "Не вдалося архівувати товар" : "Не вдалося відновити товар",
        variant: "destructive",
      });
    }
  };

  const handleImportProducts = async () => {
    if (!selectedStore || !selectedSupplier) {
      toast({
        title: "Помилка",
        description: "Оберіть магазин та постачальника",
        variant: "destructive",
      });
      return;
    }

    try {
      const productsToImport = importData.map(product => ({
        ...product,
        store_id: selectedStore,
        supplier_id: selectedSupplier,
        user_id: user?.id,
        is_active: true,
        external_id: product.imageUrl || null,
        currency: product.currency || 'UAH'
      }));

      // Видаляємо imageUrl перед збереженням
      const cleanedProducts = productsToImport.map(product => {
        const { imageUrl, category, ...cleanProduct } = product;
        return cleanProduct;
      });

      const { error } = await supabase
        .from('products')
        .insert(cleanedProducts);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: `Імпортовано ${importData.length} товарів`,
      });

      setShowImportDialog(false);
      setImportData([]);
      fetchProducts();
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося імпортувати товари",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const products: ImportedProduct[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const product: ImportedProduct = {
              name: values[headers.indexOf('name')] || '',
              description: values[headers.indexOf('description')] || '',
              price: parseFloat(values[headers.indexOf('price')] || '0'),
              old_price: parseFloat(values[headers.indexOf('old_price')] || '0') || undefined,
              sale_price: parseFloat(values[headers.indexOf('sale_price')] || '0') || undefined,
              sku: values[headers.indexOf('sku')] || '',
              vendor_code: values[headers.indexOf('vendor_code')] || '',
              vendor: values[headers.indexOf('vendor')] || '',
              stock_quantity: parseInt(values[headers.indexOf('stock_quantity')] || '0'),
              category: values[headers.indexOf('category')] || '',
              currency: values[headers.indexOf('currency')] || 'UAH',
              external_id: values[headers.indexOf('external_id')] || '',
              imageUrl: values[headers.indexOf('imageUrl')] || ''
            };
            products.push(product);
          }
        }
        
        setImportData(products);
        toast({
          title: "Успіх",
          description: `Завантажено ${products.length} товарів для імпорту`,
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося обробити файл",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const exportProducts = () => {
    const csvContent = [
      'name,description,price,old_price,sale_price,sku,vendor_code,vendor,stock_quantity,currency,external_id',
      ...filteredProducts.map(product => 
        `"${product.name}","${product.description || ''}",${product.price},${product.old_price || ''},${product.sale_price || ''},"${product.sku || ''}","${product.vendor_code || ''}","${product.vendor || ''}",${product.stock_quantity},"${product.currency}","${product.external_id || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Без категорії';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Невідома категорія';
  };

  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.name || 'Невідомий магазин';
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'Невідомий постачальник';
  };

  if (!selectedStore || !selectedSupplier) {
    return (
      <div id="products-page" className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Товари</h1>
            <p className="text-gray-600">Керування товарами ваших магазинів</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Оберіть магазин та постачальника</CardTitle>
              <CardDescription>
                Для роботи з товарами спочатку оберіть магазин та постачальника
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="store-select">Магазин</Label>
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger id="store-select">
                      <SelectValue placeholder="Оберіть магазин" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supplier-select">Постачальник</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger id="supplier-select">
                      <SelectValue placeholder="Оберіть постачальника" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div id="products-page" className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Товари</h1>
          <p className="text-gray-600">
            Магазин: {getStoreName(selectedStore)} | Постачальник: {getSupplierName(selectedSupplier)}
          </p>
        </div>

        {/* Панель управління */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-products"
                    placeholder="Пошук товарів..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    id="toggle-filters-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Фільтри
                  </Button>

                  <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'archived') => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі</SelectItem>
                      <SelectItem value="active">Активні</SelectItem>
                      <SelectItem value="archived">Архівні</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button id="import-products-btn" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Імпорт
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Імпорт товарів</DialogTitle>
                      <DialogDescription>
                        Завантажте CSV файл з товарами
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="import-file">CSV файл</Label>
                        <Input
                          id="import-file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                        />
                      </div>
                      {importData.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            Знайдено {importData.length} товарів для імпорту
                          </p>
                          <div className="max-h-32 overflow-y-auto border rounded p-2">
                            {importData.slice(0, 5).map((product, index) => (
                              <div key={index} className="text-sm py-1">
                                {product.name} - {product.price} {product.currency}
                              </div>
                            ))}
                            {importData.length > 5 && (
                              <div className="text-sm text-gray-500">
                                ...та ще {importData.length - 5} товарів
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        id="cancel-import-btn"
                        variant="outline"
                        onClick={() => {
                          setShowImportDialog(false);
                          setImportData([]);
                        }}
                      >
                        Скасувати
                      </Button>
                      <Button
                        id="confirm-import-btn"
                        onClick={handleImportProducts}
                        disabled={importData.length === 0}
                      >
                        Імпортувати
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button id="export-products-btn" variant="outline" size="sm" onClick={exportProducts}>
                  <Download className="h-4 w-4 mr-2" />
                  Експорт
                </Button>

                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button id="add-product-btn" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Додати товар
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Додати товар</DialogTitle>
                      <DialogDescription>
                        Заповніть інформацію про новий товар
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-product-name">Назва *</Label>
                        <Input
                          id="new-product-name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-sku">SKU</Label>
                        <Input
                          id="new-product-sku"
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-price">Ціна *</Label>
                        <Input
                          id="new-product-price"
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-old-price">Стара ціна</Label>
                        <Input
                          id="new-product-old-price"
                          type="number"
                          step="0.01"
                          value={newProduct.old_price}
                          onChange={(e) => setNewProduct({...newProduct, old_price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-sale-price">Ціна зі знижкою</Label>
                        <Input
                          id="new-product-sale-price"
                          type="number"
                          step="0.01"
                          value={newProduct.sale_price}
                          onChange={(e) => setNewProduct({...newProduct, sale_price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-quantity">Кількість</Label>
                        <Input
                          id="new-product-quantity"
                          type="number"
                          value={newProduct.stock_quantity}
                          onChange={(e) => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-vendor-code">Код постачальника</Label>
                        <Input
                          id="new-product-vendor-code"
                          value={newProduct.vendor_code}
                          onChange={(e) => setNewProduct({...newProduct, vendor_code: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-vendor">Постачальник</Label>
                        <Input
                          id="new-product-vendor"
                          value={newProduct.vendor}
                          onChange={(e) => setNewProduct({...newProduct, vendor: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-category">Категорія</Label>
                        <Select
                          value={newProduct.category_id}
                          onValueChange={(value) => setNewProduct({...newProduct, category_id: value})}
                        >
                          <SelectTrigger id="new-product-category">
                            <SelectValue placeholder="Оберіть категорію" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Без категорії</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-product-currency">Валюта</Label>
                        <Select
                          value={newProduct.currency}
                          onValueChange={(value) => setNewProduct({...newProduct, currency: value})}
                        >
                          <SelectTrigger id="new-product-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UAH">UAH</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="new-product-description">Опис</Label>
                        <Textarea
                          id="new-product-description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="new-product-image">URL зображення</Label>
                        <Input
                          id="new-product-image"
                          value={newProduct.imageUrl}
                          onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button id="cancel-add-product-btn" variant="outline" onClick={() => setShowAddDialog(false)}>
                        Скасувати
                      </Button>
                      <Button id="confirm-add-product-btn" onClick={handleAddProduct}>
                        Додати товар
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Розширені фільтри */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="filter-store">Магазин</Label>
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                      <SelectTrigger id="filter-store">
                        <SelectValue placeholder="Всі магазини" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filter-supplier">Постачальник</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger id="filter-supplier">
                        <SelectValue placeholder="Всі постачальники" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filter-category">Категорія</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="filter-category">
                        <SelectValue placeholder="Всі категорії" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Всі категорії</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    id="clear-filters-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory('');
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Очистити фільтри
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Список товарів */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Завантаження товарів...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Товари не знайдено</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Назва</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Ціна</TableHead>
                      <TableHead>Кількість</TableHead>
                      <TableHead>Категорія</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {product.price} {product.currency}
                            </span>
                            {product.old_price && product.old_price > product.price && (
                              <span className="text-sm text-gray-500 line-through">
                                {product.old_price} {product.currency}
                              </span>
                            )}
                            {product.sale_price && product.sale_price < product.price && (
                              <span className="text-sm text-green-600">
                                {product.sale_price} {product.currency}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                            {product.stock_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>{getCategoryName(product.category_id)}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Активний" : "Архівний"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              id={`view-product-${product.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowEditDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              id={`edit-product-${product.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              id={`archive-product-${product.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchiveProduct(product.id, product.is_active)}
                            >
                              {product.is_active ? (
                                <Archive className="h-4 w-4" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  id={`delete-product-${product.id}`}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Видалити товар?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ця дія не може бути скасована. Товар буде назавжди видалений з системи.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                    Видалити
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Діалог редагування товару */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редагувати товар</DialogTitle>
              <DialogDescription>
                Внесіть зміни до інформації про товар
              </DialogDescription>
            </DialogHeader>
            {editingProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-product-name">Назва *</Label>
                  <Input
                    id="edit-product-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-sku">SKU</Label>
                  <Input
                    id="edit-product-sku"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-price">Ціна *</Label>
                  <Input
                    id="edit-product-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-old-price">Стара ціна</Label>
                  <Input
                    id="edit-product-old-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.old_price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, old_price: parseFloat(e.target.value) || undefined})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-sale-price">Ціна зі знижкою</Label>
                  <Input
                    id="edit-product-sale-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.sale_price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, sale_price: parseFloat(e.target.value) || undefined})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-quantity">Кількість</Label>
                  <Input
                    id="edit-product-quantity"
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-vendor-code">Код постачальника</Label>
                  <Input
                    id="edit-product-vendor-code"
                    value={editingProduct.vendor_code || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, vendor_code: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-vendor">Постачальник</Label>
                  <Input
                    id="edit-product-vendor"
                    value={editingProduct.vendor || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, vendor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-category">Категорія</Label>
                  <Select
                    value={editingProduct.category_id || ''}
                    onValueChange={(value) => setEditingProduct({...editingProduct, category_id: value || undefined})}
                  >
                    <SelectTrigger id="edit-product-category">
                      <SelectValue placeholder="Оберіть категорію" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Без категорії</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-product-currency">Валюта</Label>
                  <Select
                    value={editingProduct.currency}
                    onValueChange={(value) => setEditingProduct({...editingProduct, currency: value})}
                  >
                    <SelectTrigger id="edit-product-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAH">UAH</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-product-description">Опис</Label>
                  <Textarea
                    id="edit-product-description"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-product-image">URL зображення</Label>
                  <Input
                    id="edit-product-image"
                    value={editingProduct.imageUrl || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                id="cancel-edit-product-btn"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingProduct(null);
                }}
              >
                Скасувати
              </Button>
              <Button id="confirm-edit-product-btn" onClick={handleEditProduct}>
                Зберегти зміни
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserProducts;
