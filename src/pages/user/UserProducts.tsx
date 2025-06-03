import React, { useState, useRef, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    store_id: string;
    supplier_id: string;
    archived: boolean;
    created_at: string;
    updated_at: string;
}

interface Store {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    name: string;
}

const UserProducts = () => {
    const [urlInput, setUrlInput] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [importedProducts, setImportedProducts] = useState<Product[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [selectedStore, setSelectedStore] = useState<string | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [stores, setStores] = useState<Store[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [savingProducts, setSavingProducts] = useState(false);
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
    const [productToArchive, setProductToArchive] = useState<Product | null>(null);
    const [isUnarchiveDialogOpen, setIsUnarchiveDialogOpen] = useState(false);
    const [productToUnarchive, setProductToUnarchive] = useState<Product | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast()

    const handleLoadFromUrl = async () => {
        if (!urlInput.trim()) {
            toast({
                title: "Помилка",
                description: "Будь ласка, введіть URL",
                variant: "destructive",
            });
            return;
        }

        setIsLoadingUrl(true);
        try {
            let response;
            try {
                response = await fetch(urlInput);
            } catch (corsError) {
                console.log('CORS error, trying proxy:', corsError);
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`;
                const proxyResponse = await fetch(proxyUrl);
                const proxyData = await proxyResponse.json();

                if (!proxyData.contents) {
                    throw new Error('Не вдалося отримати дані через проксі');
                }

                response = {
                    ok: true,
                    text: () => Promise.resolve(proxyData.contents)
                };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const xmlText = await response.text();
            console.log('XML content preview:', xmlText.substring(0, 500));

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            if (xmlDoc.querySelector('parsererror')) {
                throw new Error('Невірний формат XML');
            }

            const products = parseXMLProducts(xmlDoc);

            if (products.length === 0) {
                toast({
                    title: "Попередження",
                    description: "Товари не знайдені в XML файлі",
                    variant: "destructive",
                });
                return;
            }

            setImportedProducts(products);
            setShowPreview(true);

            toast({
                title: "Успіх",
                description: `Завантажено ${products.length} товарів`,
            });

        } catch (error) {
            console.error('Error loading from URL:', error);
            toast({
                title: "Помилка",
                description: error instanceof Error ? error.message : "Не вдалося завантажити файл з URL",
                variant: "destructive",
            });
        } finally {
            setIsLoadingUrl(false);
        }
    };

    const parseXMLProducts = (xmlDoc: XMLDocument): Product[] => {
        const products: Product[] = [];
        
        // Try different XML structures
        let items = xmlDoc.querySelectorAll('item');
        if (items.length === 0) {
            items = xmlDoc.querySelectorAll('product');
        }
        if (items.length === 0) {
            items = xmlDoc.querySelectorAll('товар');
        }
        if (items.length === 0) {
            items = xmlDoc.querySelectorAll('offer');
        }

        items.forEach(item => {
            // Try different field names for name
            let name = item.querySelector('name')?.textContent || 
                      item.querySelector('title')?.textContent || 
                      item.querySelector('назва')?.textContent ||
                      item.querySelector('название')?.textContent ||
                      item.getAttribute('name') || '';

            // Try different field names for description
            let description = item.querySelector('description')?.textContent || 
                             item.querySelector('desc')?.textContent || 
                             item.querySelector('опис')?.textContent ||
                             item.querySelector('описание')?.textContent || '';

            // Try different field names for price
            let priceText = item.querySelector('price')?.textContent || 
                           item.querySelector('ціна')?.textContent ||
                           item.querySelector('цена')?.textContent ||
                           item.querySelector('cost')?.textContent ||
                           item.getAttribute('price') || '0';

            // Try different field names for image
            let imageUrl = item.querySelector('image')?.textContent || 
                          item.querySelector('img')?.textContent || 
                          item.querySelector('picture')?.textContent ||
                          item.querySelector('фото')?.textContent ||
                          item.getAttribute('image') || '';

            // Clean and validate price
            priceText = priceText.replace(/[^\d.,]/g, '').replace(',', '.');
            const price = isNaN(Number(priceText)) ? 0 : Number(priceText);

            // Skip empty products
            if (!name.trim()) {
                return;
            }

            const id = uuidv4();

            products.push({
                id: id,
                name: name.trim(),
                description: description.trim(),
                price,
                imageUrl: imageUrl.trim(),
                store_id: selectedStore || '',
                supplier_id: selectedSupplier || '',
                archived: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        });

        return products;
    };

    const handleCheckboxChange = (productId: string) => {
        const product = importedProducts.find(p => p.id === productId);
        if (product) {
            if (selectedProducts.find(p => p.id === productId)) {
                setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
            } else {
                setSelectedProducts([...selectedProducts, product]);
            }
        }
    };

    const handleSelectAllChange = () => {
        setIsSelectAll(!isSelectAll);
        if (!isSelectAll) {
            setSelectedProducts([...importedProducts]);
        } else {
            setSelectedProducts([]);
        }
    };

    useEffect(() => {
        const fetchStoresAndSuppliers = async () => {
            try {
                const { data: storesData, error: storesError } = await supabase
                    .from('user_stores')
                    .select('*');

                if (storesError) {
                    console.error('Error fetching stores:', storesError);
                    toast({
                        title: "Помилка",
                        description: "Не вдалося завантажити список магазинів",
                        variant: "destructive",
                    });
                    return;
                }

                const { data: suppliersData, error: suppliersError } = await supabase
                    .from('suppliers')
                    .select('*');

                if (suppliersError) {
                    console.error('Error fetching suppliers:', suppliersError);
                    toast({
                        title: "Помилка",
                        description: "Не вдалося завантажити список постачальників",
                        variant: "destructive",
                    });
                    return;
                }

                setStores(storesData || []);
                setSuppliers(suppliersData || []);
            } catch (error) {
                console.error('Unexpected error:', error);
                toast({
                    title: "Помилка",
                    description: "Не вдалося завантажити дані",
                    variant: "destructive",
                });
            }
        };

        fetchStoresAndSuppliers();
    }, [toast]);

    const handleSaveProducts = async () => {
        if (!selectedStore || !selectedSupplier) {
            toast({
                title: "Помилка",
                description: "Оберіть магазин і постачальника",
                variant: "destructive",
            });
            return;
        }

        if (selectedProducts.length === 0) {
            toast({
                title: "Помилка",
                description: "Оберіть товари для збереження",
                variant: "destructive",
            });
            return;
        }

        setSavingProducts(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Помилка",
                    description: "Користувач не авторизований",
                    variant: "destructive",
                });
                return;
            }

            const productsToInsert = selectedProducts.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                store_id: selectedStore,
                supplier_id: selectedSupplier,
                user_id: user.id,
            }));

            const { error: insertError } = await supabase
                .from('products')
                .insert(productsToInsert);

            if (insertError) {
                console.error('Error inserting products:', insertError);
                toast({
                    title: "Помилка",
                    description: "Не вдалося зберегти товари",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Успіх",
                description: `Збережено ${selectedProducts.length} товарів`,
            });

            setSelectedProducts([]);
            setShowPreview(false);
            setImportedProducts([]);

            // Refresh products list
            const { data } = await supabase
                .from('products')
                .select('*');
            setProducts(data || []);

        } catch (error) {
            console.error('Error saving products:', error);
            toast({
                title: "Помилка",
                description: "Не вдалося зберегти товари",
                variant: "destructive",
            });
        } finally {
            setSavingProducts(false);
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*');

                if (error) {
                    console.error('Error fetching products:', error);
                    setError('Failed to load products.');
                } else {
                    setProducts(data || []);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
                setError('Failed to load products.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleArchive = async (product: Product) => {
        setProductToArchive(product);
        setIsArchiveDialogOpen(true);
    };

    const handleConfirmArchive = async () => {
        if (!productToArchive) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', productToArchive.id);

            if (error) {
                console.error('Error archiving product:', error);
                toast({
                    title: "Помилка",
                    description: "Не вдалося архівувати товар",
                    variant: "destructive",
                });
                return;
            }

            setProducts(products.map(p =>
                p.id === productToArchive.id ? { ...p, archived: true } : p
            ));

            toast({
                title: "Успіх",
                description: "Товар успішно архівовано",
            });

        } catch (error) {
            console.error('Unexpected error:', error);
            toast({
                title: "Помилка",
                description: "Не вдалося архівувати товар",
                variant: "destructive",
            });
        } finally {
            setIsArchiveDialogOpen(false);
            setProductToArchive(null);
        }
    };

    const handleUnarchive = async (product: Product) => {
        setProductToUnarchive(product);
        setIsUnarchiveDialogOpen(true);
    };

    const handleConfirmUnarchive = async () => {
        if (!productToUnarchive) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: true })
                .eq('id', productToUnarchive.id);

            if (error) {
                console.error('Error unarchiving product:', error);
                toast({
                    title: "Помилка",
                    description: "Не вдалося розархівувати товар",
                    variant: "destructive",
                });
                return;
            }

            setProducts(products.map(p =>
                p.id === productToUnarchive.id ? { ...p, archived: false } : p
            ));

            toast({
                title: "Успіх",
                description: "Товар успішно розархівовано",
            });

        } catch (error) {
            console.error('Unexpected error:', error);
            toast({
                title: "Помилка",
                description: "Не вдалося розархівувати товар",
                variant: "destructive",
            });
        } finally {
            setIsUnarchiveDialogOpen(false);
            setProductToUnarchive(null);
        }
    };

    const handleDelete = async (product: Product) => {
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productToDelete.id);

            if (error) {
                console.error('Error deleting product:', error);
                toast({
                    title: "Помилка",
                    description: "Не вдалося видалити товар",
                    variant: "destructive",
                });
                return;
            }

            setProducts(products.filter(p => p.id !== productToDelete.id));

            toast({
                title: "Успіх",
                description: "Товар успішно видалено",
            });

        } catch (error) {
            console.error('Unexpected error:', error);
            toast({
                title: "Помилка",
                description: "Не вдалося видалити товар",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Керування Товарами</h1>

            <div className="flex gap-4 mb-6">
                <Input
                    id="url-input"
                    type="url"
                    placeholder="Введіть URL XML файлу"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1"
                />
                <Button 
                    id="load-url-button"
                    onClick={handleLoadFromUrl} 
                    disabled={isLoadingUrl}
                >
                    {isLoadingUrl ? 'Завантаження...' : 'Завантажити з URL'}
                </Button>
            </div>

            {showPreview && (
                <div className="mb-8 p-6 border rounded-lg bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4">Попередній перегляд товарів</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Select onValueChange={setSelectedStore}>
                            <SelectTrigger id="store-select">
                                <SelectValue placeholder="Оберіть магазин" />
                            </SelectTrigger>
                            <SelectContent>
                                {stores.map(store => (
                                    <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={setSelectedSupplier}>
                            <SelectTrigger id="supplier-select">
                                <SelectValue placeholder="Оберіть постачальника" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map(supplier => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <ScrollArea className="h-96 w-full border rounded">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            id="select-all-checkbox"
                                            checked={isSelectAll}
                                            onCheckedChange={handleSelectAllChange}
                                        />
                                    </TableHead>
                                    <TableHead>Назва</TableHead>
                                    <TableHead>Опис</TableHead>
                                    <TableHead>Ціна</TableHead>
                                    <TableHead>Зображення</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {importedProducts.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <Checkbox
                                                id={`product-checkbox-${product.id}`}
                                                checked={!!selectedProducts.find(p => p.id === product.id)}
                                                onCheckedChange={() => handleCheckboxChange(product.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="max-w-xs truncate">{product.description}</TableCell>
                                        <TableCell>{product.price} ₴</TableCell>
                                        <TableCell>
                                            {product.imageUrl && (
                                                <img 
                                                    src={product.imageUrl} 
                                                    alt={product.name} 
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-600">
                            Вибрано: {selectedProducts.length} з {importedProducts.length} товарів
                        </div>
                        <Button 
                            id="save-products-button"
                            onClick={handleSaveProducts} 
                            disabled={savingProducts || selectedProducts.length === 0 || !selectedStore || !selectedSupplier}
                        >
                            {savingProducts ? 'Збереження...' : `Зберегти товари (${selectedProducts.length})`}
                        </Button>
                    </div>
                </div>
            )}

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Список Товарів</h2>
                    <Input
                        id="search-input"
                        type="text"
                        placeholder="Пошук за назвою"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>

                {loading && <div className="text-center py-4">Завантаження...</div>}
                {error && <div className="text-center py-4 text-red-500">Помилка: {error}</div>}
                
                {!loading && !error && (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Назва</TableHead>
                                    <TableHead>Опис</TableHead>
                                    <TableHead>Ціна</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead>Дії</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="max-w-xs truncate">{product.description}</TableCell>
                                        <TableCell>{product.price} ₴</TableCell>
                                        <TableCell>
                                            <Badge variant={product.is_active ? "default" : "secondary"}>
                                                {product.is_active ? 'Активний' : 'Архівований'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {product.is_active ? (
                                                    <Button 
                                                        id={`archive-button-${product.id}`}
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleArchive(product)}
                                                    >
                                                        Архівувати
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        id={`unarchive-button-${product.id}`}
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleUnarchive(product)}
                                                    >
                                                        Розархівувати
                                                    </Button>
                                                )}
                                                <Button 
                                                    id={`delete-button-${product.id}`}
                                                    variant="destructive" 
                                                    size="sm"
                                                    onClick={() => handleDelete(product)}
                                                >
                                                    Видалити
                                                </Button>
                                                <Button 
                                                    id={`edit-button-${product.id}`}
                                                    variant="secondary" 
                                                    size="sm"
                                                    onClick={() => navigate(`/user/products/${product.id}`)}
                                                >
                                                    Редагувати
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Товари не знайдені
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Archive Dialog */}
            <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Підтвердження архівації</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ви впевнені, що хочете архівувати цей товар?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToArchive(null)}>
                            Скасувати
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmArchive}>Архівувати</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unarchive Dialog */}
            <AlertDialog open={isUnarchiveDialogOpen} onOpenChange={setIsUnarchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Підтвердження розархівації</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ви впевнені, що хочете розархівувати цей товар?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToUnarchive(null)}>
                            Скасувати
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmUnarchive}>Розархівувати</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ви впевнені, що хочете видалити цей товар? Цю дію не можна буде скасувати.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToDelete(null)}>
                            Скасувати
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Видалити</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UserProducts;
