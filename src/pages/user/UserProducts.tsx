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
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { useRouter } from 'next/navigation'
import Link from 'next/link';

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
    const router = useRouter()
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
        const items = xmlDoc.querySelectorAll('item');

        items.forEach(item => {
            const name = item.querySelector('name')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const priceText = item.querySelector('price')?.textContent || '0';
            const imageUrl = item.querySelector('image')?.textContent || '';

            // Перевірка, чи priceText є валідним числом
            const price = isNaN(Number(priceText)) ? 0 : Number(priceText);

            const id = uuidv4(); // Генеруємо новий UUID для кожного продукту

            products.push({
                id: id,
                name,
                description,
                price,
                imageUrl,
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
                    .from('stores')
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
                ...product,
                store_id: selectedStore,
                supplier_id: selectedSupplier,
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
                .update({ archived: true })
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
                .update({ archived: false })
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
        <div>
            <h1>Керування Товарами</h1>

            <div>
                <Input
                    type="url"
                    placeholder="Введіть URL XML файлу"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button onClick={handleLoadFromUrl} disabled={isLoadingUrl}>
                    {isLoadingUrl ? 'Завантаження...' : 'Завантажити з URL'}
                </Button>
            </div>

            {showPreview && (
                <div>
                    <h2>Попередній перегляд товарів</h2>
                    <Select onValueChange={setSelectedStore}>
                        <SelectTrigger>
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
                        <SelectTrigger>
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

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Checkbox
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
                                            checked={!!selectedProducts.find(p => p.id === product.id)}
                                            onCheckedChange={() => handleCheckboxChange(product.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.description}</TableCell>
                                    <TableCell>{product.price}</TableCell>
                                    <TableCell>
                                        <img src={product.imageUrl} alt={product.name} style={{ width: '50px', height: '50px' }} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Button onClick={handleSaveProducts} disabled={savingProducts}>
                        {savingProducts ? 'Збереження...' : 'Зберегти товари'}
                    </Button>
                </div>
            )}

            <div>
                <h2>Список Товарів</h2>
                <Input
                    type="text"
                    placeholder="Пошук за назвою"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {loading && <p>Завантаження...</p>}
                {error && <p>Помилка: {error}</p>}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Назва</TableHead>
                            <TableHead>Опис</TableHead>
                            <TableHead>Ціна</TableHead>
                            <TableHead>Зображення</TableHead>
                            <TableHead>Дії</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map(product => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.description}</TableCell>
                                <TableCell>{product.price}</TableCell>
                                <TableCell>
                                    <img src={product.imageUrl} alt={product.name} style={{ width: '50px', height: '50px' }} />
                                </TableCell>
                                <TableCell>
                                    {!product.archived ? (
                                        <Button onClick={() => handleArchive(product)}>Архівувати</Button>
                                    ) : (
                                        <Button onClick={() => handleUnarchive(product)}>Розархівувати</Button>
                                    )}
                                    <Button onClick={() => handleDelete(product)}>Видалити</Button>
                                    <Link href={`/user/products/${product.id}`}>
                                        <Button>Редагувати</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

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
