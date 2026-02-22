
// src/app/admin/products/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Product, ProductCategory, ProductStatus, Tag, ProductVariant } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { columns, type ProductRow } from './columns';
import { DataTable } from '@/components/ui/data-table/data-table';
import { ProductTableToolbar } from './product-table-toolbar';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState, PaginationState } from '@tanstack/react-table';
import { DataTableSkeleton } from '@/components/ui/data-table/data-table-skeleton';
import { ProductDetailModal } from './product-detail-modal';
import type { Occasion } from '@/lib/definitions';
import { ProductForm } from './product-form';

// Importación directa de datos de prueba
import { allProducts } from '@/lib/data/product-data';
import { allCategories } from '@/lib/data/category-data';
import { allOccasions } from '@/lib/data/occasion-data';
import { allTags } from '@/lib/data/tag-data';

export default function ProductsPage() {
  const { toast } = useToast();
  
  // Estado local para manejar todos los datos de la aplicación
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

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  
  useEffect(() => {
    // Cargar todos los datos de prueba en el estado local
    setIsLoading(true);
    setProducts(allProducts);
    setCategories(allCategories);
    setOccasions(allOccasions);
    setTags(allTags);
    setIsLoading(false);
  }, []);

  const flattenedProducts = useMemo((): ProductRow[] => {
    return products.flatMap(p => {
      const parentRow: ProductRow = { ...p, isVariant: false };
      if (!p.has_variants || !p.variants || p.variants.length === 0) {
        return [parentRow];
      }
      
      const variantRows: ProductRow[] = p.variants.map(v => ({
        ...p, // Inherit parent data
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
    await new Promise(r => setTimeout(r, 500)); // Simular delay
    setProducts(prev => prev.filter(p => p.slug !== slug));
    toast({ title: '¡Producto Eliminado!', description: 'El producto ha sido eliminado correctamente.', variant: 'success' });
  }, []);

  const handleToggleStatus = useCallback(async (product: Product) => {
    const newStatus = product.status === 'publicado' ? 'oculto' : 'publicado';
    setUpdatingStatusId(product.slug);
    await new Promise(r => setTimeout(r, 500)); // Simular delay
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    toast({ title: '¡Estado Actualizado!', description: `El estado del producto ha sido cambiado a ${newStatus}.`, variant: 'success' });
    setUpdatingStatusId(null);
  }, []);

  const handleSaveProduct = useCallback(async (productData: any, imageFiles: any, originalProduct?: Product | null) => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000)); // Simular delay

    const isEditing = !!originalProduct && !isCopyMode;
    
    if (isEditing) {
        setProducts(prev => prev.map(p => p.id === originalProduct.id ? { ...p, ...productData, id: originalProduct.id } : p));
    } else {
        const newId = `prod_${Math.max(...products.map(p => parseInt(p.id.split('_')[1])), 0) + 1}`;
        const newProduct: Product = { 
            ...productData, 
            id: newId,
            slug: productData.name.toLowerCase().replace(/ /g, '-'), // simple slug generation
            variants: productData.variants || [],
        };
        setProducts(prev => [newProduct, ...prev]);
    }

    toast({ title: isEditing ? '¡Producto Actualizado!' : '¡Producto Creado!', description: `El producto se ha guardado exitosamente.`, variant: 'success' });
    setIsFormOpen(false);
    setIsSaving(false);
  }, [isCopyMode, products]);


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
    await new Promise(r => setTimeout(r, 1000)); // Simular delay

    if (action === 'delete') {
        setProducts(prev => prev.filter(p => !selectedSlugs.includes(p.slug)));
    } else {
        const newStatus = action === 'publish' ? 'publicado' : 'oculto';
        setProducts(prev => prev.map(p => selectedSlugs.includes(p.slug) ? { ...p, status: newStatus } : p));
    }

    toast({ title: '¡Acción en lote exitosa!', description: `${selectedSlugs.length} productos se han actualizado.`, variant: 'success' });
    table.resetRowSelection();
    setIsDeleting(false);
  }, [table]);

  if (isLoading) {
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
