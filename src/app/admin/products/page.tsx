'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Product, ProductCategory, ProductStatus, Occasion, Tag } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, ShoppingCart, Eye, Clock3, ExternalLink, PenSquare } from 'lucide-react';
import { columns, type ProductRow } from './columns';
import { DataTable } from '@/components/ui/data-table/data-table';
import { ProductTableToolbar } from './product-table-toolbar';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { ProductDetailModal } from './product-detail-modal';
import { ProductForm } from './product-form';
import { useAuth } from '@/context/AuthContext';
import { pickMainProductImage } from '@/lib/product-images';
import Link from 'next/link';

const PRODUCT_META_CACHE_VERSION = 'v1';
const PRODUCT_META_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const PRODUCT_META_CACHE_KEYS = {
  categories: `admin-products-categories-${PRODUCT_META_CACHE_VERSION}`,
  occasions: `admin-products-occasions-${PRODUCT_META_CACHE_VERSION}`,
  tags: `admin-products-tags-${PRODUCT_META_CACHE_VERSION}`,
};

type CachedMeta<T> = {
  timestamp: number;
  data: T;
};

const mapUiStatusToApi = (status: unknown): 'PUBLISHED' | 'HIDDEN' | 'DRAFT' => {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === 'publicado' || normalized === 'published') return 'PUBLISHED';
  if (normalized === 'oculto' || normalized === 'hidden') return 'HIDDEN';
  return 'DRAFT';
};

const adaptCategory = (category: any): ProductCategory => ({
  ...category,
  parent_id: category?.parent_id ?? category?.parentId ?? null,
  image_url: category?.image_url ?? category?.imageUrl ?? null,
  show_on_home: Boolean(category?.show_on_home ?? category?.showOnHome ?? false),
  is_deleted: Boolean(category?.is_deleted ?? category?.isDeleted ?? false),
  created_at: category?.created_at ?? category?.createdAt ?? null,
  updated_at: category?.updated_at ?? category?.updatedAt ?? null,
}) as any;

const adaptProduct = (product: any): Product => {
  const preferredMainImage = pickMainProductImage(product);
  const category = product?.category ? adaptCategory(product.category) : null;

  const tags = Array.isArray(product?.tags)
    ? product.tags.map((tag: any) => ({ ...tag }))
    : [];

  const occasions = Array.isArray(product?.occasions)
    ? product.occasions.map((occasion: any) => ({ ...occasion }))
    : [];

  const images = Array.isArray(product?.images)
    ? product.images.map((img: any, index: number) => ({
        ...img,
        is_primary: Boolean(img?.is_primary ?? img?.isPrimary ?? index === 0),
      }))
    : [];

  const specifications = Array.isArray(product?.specifications)
    ? product.specifications.map((spec: any) => ({ ...spec }))
    : [];

  const variants = Array.isArray(product?.variants)
    ? product.variants.map((variant: any) => ({
        ...variant,
        sale_price: variant?.sale_price ?? variant?.salePrice ?? null,
        short_description: variant?.short_description ?? variant?.shortDescription ?? null,
        is_deleted: Boolean(variant?.is_deleted ?? variant?.isDeleted ?? false),
        specifications: Array.isArray(variant?.specifications) ? variant.specifications : [],
        images: Array.isArray(variant?.images)
          ? variant.images.map((img: any, index: number) => ({
              ...img,
              is_primary: Boolean(img?.is_primary ?? img?.isPrimary ?? index === 0),
            }))
          : [],
      }))
    : [];

  return {
    ...product,
    description: product?.description ?? '',
    short_description: product?.short_description ?? product?.shortDescription ?? '',
    price: Number(product?.price ?? 0),
    sale_price: product?.sale_price ?? product?.salePrice ?? null,
    stock: Number(product?.stock ?? 0),
    has_variants: Boolean(product?.has_variants ?? product?.hasVariants ?? false),
    image: preferredMainImage,
    mainImage: product?.mainImage ?? product?.main_image ?? preferredMainImage,
    badgeText: product?.badgeText ?? product?.badge_text ?? null,
    badge_text: product?.badge_text ?? product?.badgeText ?? null,
    allow_photo: Boolean(product?.allow_photo ?? product?.allowPhoto ?? false),
    photo_price: product?.photo_price ?? product?.photoPrice ?? null,
    category,
    category_id: product?.category_id ?? product?.categoryId ?? category?.id ?? 0,
    tags,
    occasions,
    images,
    specifications,
    variants,
    is_deleted: Boolean(product?.is_deleted ?? product?.isDeleted ?? false),
    created_at: product?.created_at ?? product?.createdAt ?? new Date().toISOString(),
    updated_at: product?.updated_at ?? product?.updatedAt ?? new Date().toISOString(),
  } as any;
};

export default function ProductsPage() {
  const { toast } = useToast();
  const { apiFetch } = useAuth();

  const apiFetchRef = useRef(apiFetch);
  const toastRef = useRef(toast);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);

  const readCachedMeta = useCallback(<T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedMeta<T>;
      if (!parsed?.timestamp || Date.now() - parsed.timestamp > PRODUCT_META_CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }, []);

  const writeCachedMeta = useCallback(<T,>(key: string, data: T) => {
    if (typeof window === 'undefined') return;
    try {
      const payload: CachedMeta<T> = { timestamp: Date.now(), data };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // ignore cache write errors
    }
  }, []);

  const fetchAppData = useCallback(async (opts?: { includeMeta?: boolean }) => {
    setIsLoading(true);
    try {
      const cachedCategories = readCachedMeta<ProductCategory[]>(PRODUCT_META_CACHE_KEYS.categories);
      const cachedOccasions = readCachedMeta<Occasion[]>(PRODUCT_META_CACHE_KEYS.occasions);
      const cachedTags = readCachedMeta<Tag[]>(PRODUCT_META_CACHE_KEYS.tags);
      const hasUsableCategoriesCache = Array.isArray(cachedCategories) && cachedCategories.length > 0;
      const hasUsableOccasionsCache = Array.isArray(cachedOccasions) && cachedOccasions.length > 0;
      const hasUsableTagsCache = Array.isArray(cachedTags) && cachedTags.length > 0;

      if (hasUsableCategoriesCache && categories.length === 0) {
        setCategories(cachedCategories.map((c: any) => adaptCategory(c)));
      }
      if (hasUsableOccasionsCache && occasions.length === 0) {
        setOccasions(cachedOccasions);
      }
      if (hasUsableTagsCache && tags.length === 0) {
        setTags(cachedTags);
      }

      const hasCategoriesLoaded = Array.isArray(categories) && categories.length > 0;
      const needsMeta = opts?.includeMeta ?? (!(hasCategoriesLoaded || hasUsableCategoriesCache) || !(hasUsableOccasionsCache && hasUsableTagsCache));
      const response = await apiFetchRef.current(`/api/admin/products?includeMeta=${needsMeta ? '1' : '0'}`);
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'No se pudieron cargar los productos.');
      }

      const payload = result?.data ?? {};
      const adaptedProducts = (payload?.products ?? []).map((p: any) => adaptProduct(p));
      const adaptedCategories = (payload?.categories ?? []).map((c: any) => adaptCategory(c));

      setProducts(adaptedProducts);
      if (Array.isArray(payload?.categories)) {
        setCategories(adaptedCategories);
        writeCachedMeta(PRODUCT_META_CACHE_KEYS.categories, payload.categories);
      }

      if (Array.isArray(payload?.occasions)) {
        setOccasions(payload.occasions);
        writeCachedMeta(PRODUCT_META_CACHE_KEYS.occasions, payload.occasions);
      }

      if (Array.isArray(payload?.tags)) {
        setTags(payload.tags);
        writeCachedMeta(PRODUCT_META_CACHE_KEYS.tags, payload.tags);
      }
    } catch (error: any) {
      toastRef.current({
        title: 'Error al cargar productos',
        description: error?.message || 'No se pudieron obtener los productos.',
        variant: 'destructive',
      });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [categories.length, occasions.length, readCachedMeta, tags.length, writeCachedMeta]);

  useEffect(() => {
    apiFetchRef.current = apiFetch;
  }, [apiFetch]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    fetchAppData();
  }, [fetchAppData]);

  const flattenedProducts = useMemo((): ProductRow[] => {
    return products.flatMap((p: any) => {
      const parentRow: ProductRow = {
        ...p,
        isVariant: false,
        searchIndex: `${String(p?.name ?? '')} ${String(p?.code ?? '')}`.toLowerCase(),
      } as any;
      if (!p.has_variants || !p.variants || p.variants.length === 0) {
        return [parentRow];
      }

      const variantRows: ProductRow[] = p.variants.map((v: any) => ({
        ...p,
        price: v.price,
        sale_price: v.sale_price,
        stock: v.stock,
        code: v.code || 'N/A',
        isVariant: true,
        variantName: v.name,
        variantId: v.id,
        searchIndex: `${String(v?.product_name ?? v?.productName ?? p?.name ?? '')} ${String(v?.name ?? '')} ${String(v?.code ?? '')}`.toLowerCase(),
      } as any));

      return [parentRow, ...variantRows];
    });
  }, [products]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsCopyMode(false);
    setIsFormOpen(true);
  };

  const resolveProductFromRow = useCallback((productRow: Product): Product | null => {
    const rowAny = productRow as any;
    const byId = products.find((p: any) => Number(p?.id) === Number(rowAny?.id));
    if (byId) return byId;

    if (rowAny?.slug) {
      const bySlug = products.find((p: any) => String(p?.slug) === String(rowAny?.slug));
      if (bySlug) return bySlug;
    }

    if (rowAny?.id || rowAny?.slug || rowAny?.name) {
      return adaptProduct(rowAny);
    }

    return null;
  }, [products]);

  const handleEditProduct = (productRow: Product) => {
    const productToEdit = resolveProductFromRow(productRow);
    setSelectedProduct(productToEdit);
    setIsCopyMode(false);
    setIsFormOpen(true);
  };

  const handleCopyProduct = (productRow: Product) => {
    const productToCopy = resolveProductFromRow(productRow);
    setSelectedProduct(productToCopy);
    setIsCopyMode(true);
    setIsFormOpen(true);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleDeleteProduct = useCallback(async (slug: string) => {
    try {
      const response = await apiFetchRef.current(`/api/admin/products/${slug}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'No se pudo eliminar el producto.');
      }

      toastRef.current({ title: '¡Producto Eliminado!', description: 'El producto ha sido eliminado correctamente.', variant: 'success' });
      await fetchAppData({ includeMeta: false });
    } catch (error: any) {
      toastRef.current({ title: 'Error', description: error?.message || 'Error al eliminar producto.', variant: 'destructive' });
    }
  }, [fetchAppData]);

  const handleToggleStatus = useCallback(async (product: Product) => {
    const currentStatus = (product as any).status as ProductStatus;
    const nextStatus: ProductStatus = currentStatus === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    const nextLabel = nextStatus === 'PUBLISHED' ? 'Publicado' : 'Oculto';

    setUpdatingStatusId(product.slug);
    try {
      const response = await apiFetchRef.current(`/api/admin/products/${product.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isStatusUpdate: true,
          productData: { status: nextStatus },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'No se pudo cambiar el estado.');
      }

      toastRef.current({ title: '¡Estado Actualizado!', description: `El estado del producto cambió a ${nextLabel}.`, variant: 'success' });
      await fetchAppData({ includeMeta: false });
    } catch (error: any) {
      toastRef.current({ title: 'Error', description: error?.message || 'No se pudo actualizar estado.', variant: 'destructive' });
    } finally {
      setUpdatingStatusId(null);
    }
  }, [fetchAppData]);

  const buildFormDataPayload = (
    productData: any,
    imageFiles: { main: File[]; variants: { index: number; files: File[] }[] },
  ) => {
    const payload = {
      ...productData,
      status: mapUiStatusToApi(productData?.status),
    };

    const formData = new FormData();
    formData.append('productData', JSON.stringify(payload));

    (imageFiles?.main ?? []).forEach((file) => {
      formData.append('images', file);
    });

    (imageFiles?.variants ?? []).forEach((entry) => {
      entry.files.forEach((file) => {
        formData.append(`variant_${entry.index}_images`, file);
      });
    });

    return formData;
  };

  const handleSaveProduct = useCallback(async (
    productData: any,
    imageFiles: { main: File[]; variants: { index: number; files: File[] }[] },
    originalProduct?: Product | null,
  ) => {
    setIsSaving(true);

    const isEditing = Boolean(originalProduct && !isCopyMode);
    const endpoint = isEditing ? `/api/admin/products/${originalProduct!.slug}` : '/api/admin/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const formData = buildFormDataPayload(productData, imageFiles);
      const response = await apiFetchRef.current(endpoint, {
        method,
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'No se pudo guardar el producto.');
      }

      toastRef.current({
        title: isEditing ? '¡Producto Actualizado!' : '¡Producto Creado!',
        description: 'El producto se guardó exitosamente.',
        variant: 'success',
      });

      setIsFormOpen(false);
      setSelectedProduct(null);
      await fetchAppData({ includeMeta: false });
    } catch (error: any) {
      toastRef.current({
        title: 'Error al guardar',
        description: error?.message || 'No se pudo guardar el producto.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [fetchAppData, isCopyMode]);

  const tableColumns = useMemo(() => columns({
    onEdit: handleEditProduct,
    onCopy: handleCopyProduct,
    onDelete: handleDeleteProduct,
    onToggleStatus: handleToggleStatus,
    onViewDetails: handleViewDetails,
    updatingStatusId,
  }), [handleDeleteProduct, handleToggleStatus, updatingStatusId]);

  const filteredProducts = useMemo(() => {
    const filters = columnFilters;
    if (filters.length === 0) return flattenedProducts;

    return flattenedProducts.filter((product: any) => {
      return filters.every((filter) => {
        const { id: columnId, value: filterValue } = filter;

        if (columnId === 'name') {
          const searchTerm = String(filterValue ?? '').trim().toLowerCase();
          if (!searchTerm) return true;
          const searchIndex = String((product as any).searchIndex ?? `${product.name ?? ''} ${product.code ?? ''}`).toLowerCase();
          return searchIndex.includes(searchTerm);
        }
        if (columnId === 'status') {
          if (Array.isArray(filterValue) && filterValue.length > 0) return filterValue.includes(product.status);
          return true;
        }
        if (columnId === 'category') {
          if (Array.isArray(filterValue) && filterValue.length > 0 && product.category) return filterValue.includes(product.category.slug);
          return true;
        }
        return true;
      });
    });
  }, [flattenedProducts, columnFilters]);

  const table = useReactTable({
    data: filteredProducts,
    columns: tableColumns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => (row.isVariant ? `product-${row.id}-variant-${row.variantId}` : `product-${String(row.id)}`),
    enableRowSelection: (row) => !row.original.isVariant,
  });

  useEffect(() => {
    if (!filteredProducts.length) {
      setFocusedRowId(null);
      return;
    }

    const focusedStillExists = filteredProducts.some((item: any) => {
      const rowId = item.isVariant
        ? `product-${item.id}-variant-${item.variantId}`
        : `product-${String(item.id)}`;
      return rowId === focusedRowId;
    });

    if (!focusedStillExists) {
      const firstParent = filteredProducts.find((item: any) => !item.isVariant) as any;
      if (firstParent) {
        setFocusedRowId(`product-${String(firstParent.id)}`);
      }
    }
  }, [filteredProducts, focusedRowId]);

  const focusedRow = useMemo(() => {
    if (!focusedRowId) return null;
    return filteredProducts.find((item: any) => {
      const rowId = item.isVariant
        ? `product-${item.id}-variant-${item.variantId}`
        : `product-${String(item.id)}`;
      return rowId === focusedRowId;
    }) as any;
  }, [filteredProducts, focusedRowId]);

  const focusedProduct = useMemo(() => {
    if (!focusedRow) return null;
    return products.find((p: any) => Number(p.id) === Number(focusedRow.id)) || null;
  }, [focusedRow, products]);

  const focusedVariant = useMemo(() => {
    if (!focusedProduct || !focusedRow?.isVariant) return null;
    return (focusedProduct as any)?.variants?.find((variant: any) => Number(variant.id) === Number(focusedRow.variantId)) || null;
  }, [focusedProduct, focusedRow]);

  const previewPriceText = useMemo(() => {
    if (!focusedProduct) return '$0.00';

    if ((focusedProduct as any).has_variants && Array.isArray((focusedProduct as any).variants) && (focusedProduct as any).variants.length > 0) {
      const prices = (focusedProduct as any).variants
        .map((v: any) => Number(v.price ?? 0))
        .filter((n: number) => Number.isFinite(n));

      if (!prices.length) return '$0.00';
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
      if (minPrice === maxPrice) return formatter.format(minPrice);
      return `${formatter.format(minPrice)} - ${formatter.format(maxPrice)}`;
    }

    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number((focusedProduct as any).price ?? 0));
  }, [focusedProduct]);

  const handleBulkAction = useCallback(async (action: 'publish' | 'hide' | 'delete') => {
    const selectedSlugs = table.getFilteredSelectedRowModel().rows.map((row) => row.original.slug);
    if (selectedSlugs.length === 0) return;

    setIsDeleting(action === 'delete');

    try {
      if (action === 'delete') {
        const response = await apiFetchRef.current('/api/admin/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: selectedSlugs }),
        });
        const result = await response.json();
        if (!response.ok || !result?.success) throw new Error(result?.message || 'No se pudieron eliminar productos.');
      } else {
        const response = await apiFetchRef.current('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slugs: selectedSlugs,
            status: action === 'publish' ? 'PUBLISHED' : 'HIDDEN',
          }),
        });
        const result = await response.json();
        if (!response.ok || !result?.success) throw new Error(result?.message || 'No se pudieron actualizar productos.');
      }

      toastRef.current({ title: '¡Acción en lote exitosa!', description: `${selectedSlugs.length} productos se actualizaron.`, variant: 'success' });
      table.resetRowSelection();
      await fetchAppData({ includeMeta: false });
    } catch (error: any) {
      toastRef.current({ title: 'Error en acción en lote', description: error?.message || 'No se pudo completar la acción.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }, [fetchAppData, table]);

  if (isLoading) {
    return (
      <div className="flex-1 mx-auto space-y-8 p-6 md:p-10 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Productos</h2>
          <div className="flex items-center space-x-2"><Button disabled className="rounded-full h-12 px-7 font-semibold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Agregar Producto</Button></div>
        </div>
        <DataTableSkeleton columnCount={8} />
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Productos</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddProduct} className="rounded-full h-12 px-7 font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <ProductForm
        key={`${selectedProduct?.id ?? 'new'}-${isCopyMode ? 'copy' : 'edit'}`}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveProduct}
        product={selectedProduct}
        isCopyMode={isCopyMode}
        categories={categories}
        occasions={occasions}
        tags={tags}
        isSaving={isSaving}
      />

      {selectedProduct && (
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          product={selectedProduct}
          onEditProduct={(productToEdit) => {
            setIsDetailModalOpen(false);
            handleEditProduct(productToEdit);
          }}
        />
      )}

      <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 min-h-[calc(100vh-230px)]">
        <div className="flex-1 min-w-0">
          <DataTable
            table={table}
            columns={tableColumns}
            data={filteredProducts}
            toolbar={<ProductTableToolbar table={table} categories={categories} onBulkAction={handleBulkAction} isDeleting={isDeleting} />}
            isLoading={isLoading}
            onRowClick={(rowData: any) => {
              const rowId = rowData?.isVariant
                ? `product-${rowData.id}-variant-${rowData.variantId}`
                : `product-${String(rowData.id)}`;
              setFocusedRowId(rowId);
            }}
            selectedRowId={focusedRowId}
            className="h-full"
          />
        </div>

        <div className="hidden xl:block w-px bg-border/40" />

        <aside className="w-full xl:w-[35%] space-y-4 overflow-y-auto custom-scrollbar">
          <div className="rounded-2xl border border-border/50 bg-background dark:bg-zinc-900/50 overflow-hidden">
            <div className="relative group">
              <img
                src={(focusedVariant as any)?.images?.[0]?.src || (focusedProduct as any)?.mainImage || (focusedProduct as any)?.image || '/placehold.webp'}
                alt={(focusedProduct as any)?.name || 'Producto'}
                className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-2xl font-bold leading-tight">{focusedProduct?.name || 'Sin selección'}</h2>
                <p className="text-xs text-white/80">Cód: {(focusedVariant as any)?.code || (focusedProduct as any)?.code || 'N/A'}</p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Vendidos</span>
                  </div>
                  <p className="text-xl font-bold">
                    {focusedVariant?.salesCount ?? focusedProduct?.salesCount ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Vistas hoy</span>
                  </div>
                  <p className="text-xl font-bold">{Math.max(82, Number((focusedProduct as any)?.stock ?? 0) * 8)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Descripción</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {(focusedVariant as any)?.description || (focusedProduct as any)?.description || 'Sin descripción disponible para este producto.'}
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-between items-end gap-4">
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Categoría</h3>
                  <span className="text-sm font-medium">{(focusedProduct as any)?.category?.name || 'N/A'}</span>
                </div>
                <div className="text-right">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Precio</h3>
                  <span className="text-3xl font-black text-primary">{previewPriceText}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                <span>
                  Última venta: {(() => {
                    const lastSale = focusedVariant?.lastSale ?? focusedProduct?.lastSale;
                    if (!lastSale) return 'N/A';
                    const date = typeof lastSale === 'string' ? new Date(lastSale) : lastSale;
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffMin = Math.floor(diffMs / 60000);
                    if (diffMin < 1) return 'hace menos de 1 minuto';
                    if (diffMin < 60) return `hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`;
                    const diffHrs = Math.floor(diffMin / 60);
                    if (diffHrs < 24) return `hace ${diffHrs} hora${diffHrs === 1 ? '' : 's'}`;
                    const diffDays = Math.floor(diffHrs / 24);
                    return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
                  })()}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  className="w-full h-11 rounded-xl font-bold"
                  variant="secondary"
                  onClick={() => focusedProduct && handleEditProduct(focusedProduct as any)}
                  disabled={!focusedProduct}
                >
                  <PenSquare className="h-4 w-4 mr-2" />
                  Editar Producto
                </Button>

                {focusedProduct?.slug && (
                  <Button asChild variant="ghost" className="w-full h-10 rounded-xl text-primary font-semibold">
                    <Link href={`/products/${focusedProduct.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Tienda
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background dark:bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold">Variaciones ({(focusedProduct as any)?.variants?.length || 0})</h4>
              <span className="text-xs text-primary font-medium">Gestionar</span>
            </div>

            <div className="space-y-2">
              {Array.isArray((focusedProduct as any)?.variants) && (focusedProduct as any).variants.length > 0 ? (
                (focusedProduct as any).variants.map((variant: any) => (
                  <div
                    key={variant.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      Number(variant.id) === Number((focusedVariant as any)?.id)
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/50 bg-muted/20'
                    }`}
                  >
                    <span className="text-xs">{variant.name}</span>
                    <span className="text-xs font-bold">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(variant.price ?? 0))}
                    </span>
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {variant.salesCount ?? 0} ventas
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">Este producto no tiene variaciones.</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
