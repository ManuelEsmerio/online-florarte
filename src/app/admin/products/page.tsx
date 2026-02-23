
// src/app/admin/products/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Product, ProductStatus } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { columns, type ProductRow } from './columns';
import { DataTable } from '@/components/ui/data-table/data-table';
import { ProductTableToolbar } from './product-table-toolbar';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState, PaginationState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { ProductDetailModal } from './product-detail-modal';
import { ProductForm } from './product-form';
import { useProductContext } from '@/context/ProductContext';

import { allProducts } from '@/lib/data/product-data';
import { productCategories } from '@/lib/data/categories-data';
import { allOccasions } from '@/lib/data/occasion-data';
import { allTags } from '@/lib/data/tag-data';

export default function ProductsPage() {
  const { toast } = useToast();
  const {
    products,
    categories,
    occasions,
    tags,
    isLoading: isContextLoading,
    fetchAppData
  } = useProductContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [isDeleting, setIsDeleting] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    setIsLoading(isContextLoading);
  }, [isContextLoading]);

  const flattenedProducts = useMemo((): ProductRow[] => {
    return products.flatMap(p => {
      const parentRow: ProductRow = { ...p, isVariant: false };
      if (!p.has_variants || !p.variants || p.variants.length === 0) {
        return [parentRow];
      }

      const variantRows: ProductRow[] = p.variants.map(v => ({
        ...p,
        price: v.price,
        sale_price: v.sale_price,
        stock: v.stock,
        code: v.code || 'N/A',
        isVariant: true,
        variantName: v.name,
        variantId: v.id
      }));

      return [parentRow, ...variantRows];
    });
  }, [products]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsCopyMode(false);
    setIsFormOpen(true);
  };

  const handleEditProduct = (productRow: ProductRow) => {
    const productToEdit = products.find(p => p.id === productRow.id) || null;
    setSelectedProduct(productToEdit);
    setIsCopyMode(false);
    setIsFormOpen(true);
  };

  const handleCopyProduct = (productRow: ProductRow) => {
    const productToCopy = products.find(p => p.id === productRow.id) || null;
    setSelectedProduct(productToCopy);
    setIsCopyMode(true);
    setIsFormOpen(true);
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleDeleteProduct = useCallback(async (slug: string) => {
    const idx = allProducts.findIndex(p => p.slug === slug);
    if (idx === -1) {
      toast({ title: 'Error', description: 'Producto no encontrado.', variant: 'destructive' });
      return;
    }
    allProducts.splice(idx, 1);
    toast({ title: '¡Producto Eliminado!', description: 'El producto ha sido eliminado correctamente.', variant: 'success' });
    await fetchAppData();
  }, [fetchAppData, toast]);

  const handleToggleStatus = useCallback(async (product: Product) => {
    const newStatus: ProductStatus = product.status === 'publicado' ? 'oculto' : 'publicado';
    setUpdatingStatusId(product.slug);
    const idx = allProducts.findIndex(p => p.slug === product.slug);
    if (idx > -1) {
      allProducts[idx] = { ...allProducts[idx], status: newStatus };
    }
    await fetchAppData();
    toast({ title: '¡Estado Actualizado!', description: `El estado del producto ha sido cambiado a ${newStatus}.`, variant: 'success' });
    setUpdatingStatusId(null);
  }, [toast, fetchAppData]);

  const handleSaveProduct = useCallback(async (productData: any, imageFiles: { main: File[], variants: { index: number, files: File[] }[] }, originalProduct?: Product | null) => {
    setIsSaving(true);

    const isEditing = !!originalProduct && !isCopyMode;

    // Resolve related entities from source arrays
    const category = productCategories.find(c => c.id === productData.category_id) ?? null;
    const resolvedOccasions = (productData.occasion_ids ?? []).map((id: number) => allOccasions.find(o => o.id === id)).filter(Boolean);
    const resolvedTags = (productData.tag_ids ?? []).map((id: number) => allTags.find(t => t.id === id)).filter(Boolean);

    // For new image files, generate object URLs as temporary preview
    const mainImageUrl = imageFiles.main.length > 0
      ? URL.createObjectURL(imageFiles.main[0])
      : (originalProduct?.image ?? 'https://picsum.photos/seed/new-product/600/600');

    const resolvedImages = (productData.images ?? []).map((img: any, i: number) => {
      if (img.isNew && img.file) {
        return { src: URL.createObjectURL(img.file), alt: img.alt || productData.name, is_primary: i === 0 };
      }
      return { src: img.src, alt: img.alt, is_primary: i === 0 };
    });

    const resolvedVariants = (productData.variants ?? [])
      .filter((v: any) => !v.is_deleted)
      .map((v: any, vIdx: number) => {
        const variantImages = (v.images ?? []).map((img: any, i: number) => {
          const newFiles = imageFiles.variants.find(vi => vi.index === vIdx)?.files ?? [];
          if (img.isNew && newFiles.length > 0) {
            return { src: URL.createObjectURL(newFiles[0]), alt: img.alt || v.name, is_primary: i === 0 };
          }
          return { src: img.src, alt: img.alt, is_primary: i === 0 };
        });
        return {
          id: v.id ?? (Date.now() + vIdx),
          name: v.name,
          price: v.price,
          sale_price: v.sale_price ?? null,
          stock: v.stock,
          code: v.code ?? '',
          images: variantImages,
        };
      });

    const slug = isEditing
      ? (originalProduct!.slug)
      : (productData.name as string).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    if (isEditing) {
      const idx = allProducts.findIndex(p => p.slug === originalProduct!.slug);
      if (idx > -1) {
        allProducts[idx] = {
          ...allProducts[idx],
          ...productData,
          slug,
          category,
          occasions: resolvedOccasions,
          tags: resolvedTags,
          image: mainImageUrl,
          images: resolvedImages.length > 0 ? resolvedImages : allProducts[idx].images,
          variants: productData.has_variants ? resolvedVariants : [],
          updated_at: new Date().toISOString(),
        };
      }
      toast({ title: '¡Producto Actualizado!', description: 'El producto se ha guardado exitosamente.', variant: 'success' });
    } else {
      const newId = Math.max(...allProducts.map(p => p.id), 0) + 1;
      const newProduct: Product = {
        id: newId,
        name: productData.name,
        slug,
        code: productData.code ?? '',
        description: productData.description ?? '',
        short_description: productData.short_description ?? '',
        price: productData.price,
        sale_price: productData.sale_price ?? null,
        stock: productData.stock,
        has_variants: productData.has_variants ?? false,
        status: productData.status ?? 'publicado',
        category,
        occasions: resolvedOccasions,
        tags: resolvedTags,
        image: mainImageUrl,
        images: resolvedImages,
        variants: productData.has_variants ? resolvedVariants : [],
        specifications: productData.specifications ?? [],
        care: productData.care ?? '',
        allow_photo: productData.allow_photo ?? false,
        photo_price: productData.photo_price ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Product;
      allProducts.push(newProduct);
      toast({ title: '¡Producto Creado!', description: 'El producto se ha guardado exitosamente.', variant: 'success' });
    }

    setIsFormOpen(false);
    await fetchAppData();
    setIsSaving(false);
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

    return flattenedProducts.filter(product => {
      return filters.every(filter => {
        const { id: columnId, value: filterValue } = filter;

        if (columnId === 'name') {
          const searchTerm = String(filterValue).toLowerCase();
          const nameMatch = product.name?.toLowerCase().includes(searchTerm);
          const codeMatch = product.code?.toLowerCase().includes(searchTerm);
          const variantNameMatch = product.isVariant && product.variantName?.toLowerCase().includes(searchTerm);
          return nameMatch || codeMatch || variantNameMatch;
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
    enableRowSelection: true,
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

  const handleBulkAction = useCallback(async (action: 'publish' | 'hide' | 'delete') => {
    const selectedSlugs = table.getFilteredSelectedRowModel().rows.map(row => row.original.slug);
    if (selectedSlugs.length === 0) return;

    setIsDeleting(action === 'delete');

    for (const slug of selectedSlugs) {
      if (action === 'delete') {
        const idx = allProducts.findIndex(p => p.slug === slug);
        if (idx > -1) allProducts.splice(idx, 1);
      } else {
        const newStatus: ProductStatus = action === 'publish' ? 'publicado' : 'oculto';
        const idx = allProducts.findIndex(p => p.slug === slug);
        if (idx > -1) allProducts[idx] = { ...allProducts[idx], status: newStatus };
      }
    }

    toast({ title: '¡Acción en lote exitosa!', description: `${selectedSlugs.length} productos se han actualizado.`, variant: 'success' });
    table.resetRowSelection();
    await fetchAppData();
    setIsDeleting(false);
  }, [fetchAppData, toast, table]);

  if (isLoading || isContextLoading) {
    return (
       <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Productos</h2>
            <div className="flex items-center space-x-2"><Button disabled className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" />Agregar Producto</Button></div>
        </div>
        <DataTableSkeleton columnCount={8} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-4xl font-bold font-headline tracking-tight text-slate-900 dark:text-white">Productos</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddProduct} className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all transform hover:-translate-y-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <ProductForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} onSave={handleSaveProduct} product={selectedProduct} isCopyMode={isCopyMode} categories={categories} occasions={occasions} tags={tags} isSaving={isSaving} />
      {selectedProduct && <ProductDetailModal isOpen={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} product={selectedProduct} />}
      <DataTable table={table} columns={tableColumns} data={filteredProducts} toolbar={<ProductTableToolbar table={table} categories={categories} onBulkAction={handleBulkAction} isDeleting={isDeleting}/>} isLoading={isLoading} />
    </div>
  );
}
