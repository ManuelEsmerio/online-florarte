
'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from '@/components/ProductCard';
import type { Product, ProductCategory, Occasion, Announcement, Tag, ProductRow } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AdCard } from '@/components/AdCard';
import { Search, Loader2, Filter, SlidersHorizontal, X, LayoutGrid } from 'lucide-react';
import { handleApiResponse } from '@/utils/handleApiResponse';
import dynamic from 'next/dynamic';

const QuickView = dynamic(() => import('@/components/QuickView'), { ssr: false });
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';


type SortOption = 'recommended' | 'price-asc' | 'price-desc';
const PRODUCT_LIMIT = 200;
const ITEMS_PER_PAGE = 16;

type HomeDataCache = {
  categories: ProductCategory[];
  occasions: Occasion[];
  testimonials: any[];
  announcements: Announcement[];
  tags: Tag[];
};

let homeDataMemoryCache: HomeDataCache | null = null;
let homeDataInFlight: Promise<HomeDataCache> | null = null;

interface CategoryPageClientProps {
  categorySlug?: string | null;
  pageType: 'category' | 'all' | 'occasion';
  occasionSlug?: string | null;
}

export function CategoryPageClient({ 
    categorySlug,
    pageType,
    occasionSlug
}: CategoryPageClientProps) {
  
  const { apiFetch } = useAuth();
  const searchParams = useSearchParams();
  const initialOccasionSlug = searchParams.get('occasion');


  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [allOccasions, setAllOccasions] = useState<Occasion[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const isFetched = useRef(false);

  const fetchInitialData = useCallback(async () => {
    if (isFetched.current) return;
    isFetched.current = true;
    
    setIsLoading(true);
    try {
        let productsUrl = `/api/products?limit=${PRODUCT_LIMIT}`;
        if (pageType === 'category' && categorySlug) {
            productsUrl += `&category=${categorySlug}`;
        }
        
        const productsPromise = apiFetch(productsUrl);
        const cachedHomeData = homeDataMemoryCache;
        let homeDataPromise: Promise<HomeDataCache>;

        if (cachedHomeData) {
          homeDataPromise = Promise.resolve(cachedHomeData);
        } else {
          if (!homeDataInFlight) {
            homeDataInFlight = (async () => {
              const homeDataRes = await apiFetch('/api/home');
              const homeData = await handleApiResponse(homeDataRes);

              return {
                categories: homeData.categories || [],
                occasions: homeData.occasions || [],
                testimonials: homeData.testimonials || [],
                announcements: homeData.announcements || [],
                tags: homeData.tags || [],
              } as HomeDataCache;
            })();
          }

          homeDataPromise = homeDataInFlight;
        }

        const [productsRes, homeData] = await Promise.all([productsPromise, homeDataPromise]);
        
        const productsData = await handleApiResponse(productsRes);
        if (!cachedHomeData) {
          homeDataMemoryCache = homeData;
          homeDataInFlight = null;
        }
        
        setAllProducts(productsData.products || []);
        setAllCategories(homeData.categories || []);
        setAllOccasions(homeData.occasions || []);
        setAllTags(homeData.tags || []);
        setAnnouncements(homeData.announcements || []);

    } catch (error) {
      homeDataInFlight = null;
        console.error("Failed to fetch initial page data:", error);
    } finally {
        setIsLoading(false);
    }
  }, [pageType, categorySlug, apiFetch]);
  
  useEffect(() => {
    // Reset fetched status if category slug changes
    isFetched.current = false;
  }, [categorySlug]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number]>([5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(initialOccasionSlug ? [initialOccasionSlug] : []);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);

  const { currentCategory, subcategories } = useMemo(() => {
    let currentCategory: ProductCategory | null = null;
    if (pageType === 'category' && categorySlug) {
      currentCategory = allCategories.find(c => c.slug === categorySlug) || null;
    }
  
    const subcategories = currentCategory
      ? allCategories.filter(c => c.parent_id === currentCategory!.id)
      : [];
  
    return { currentCategory, subcategories };
  }, [pageType, categorySlug, allCategories]);

  const currentOccasion = useMemo(() => {
    if (pageType === 'occasion' && (occasionSlug || initialOccasionSlug)) {
        return allOccasions.find(o => o.slug === (occasionSlug || initialOccasionSlug)) || null;
    }
    return null;
  }, [pageType, occasionSlug, initialOccasionSlug, allOccasions]);
  
  const maxPrice = useMemo(() => {
    if (allProducts.length === 0) return 5000;
    const allPrices = allProducts.flatMap(p =>
      p.has_variants && p.variants ? p.variants.map(v => v.price) : [p.price]
    );
    return Math.ceil(Math.max(...allPrices, 0) / 100) * 100;
  }, [allProducts]);

  // Expand products-with-variants so each variant becomes its own catalog entry.
  const expandedProducts = useMemo(() => {
    const result: any[] = [];
    for (const product of allProducts) {
      if (product.has_variants && product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          const imgs = (variant as any).images as any[] | undefined;
          const variantImg =
            imgs?.find((img: any) => img.isPrimary)?.src ??
            imgs?.[0]?.src ??
            (product as any).image ??
            null;
          result.push({
            ...product,
            _cardKey: `${product.id}-${variant.id}`,
            name: `${product.name} – ${variant.name}`,
            price: variant.price,
            sale_price: (variant as any).sale_price ?? null,
            salePrice: (variant as any).salePrice ?? null,
            image: variantImg,
            mainImage: variantImg,
            stock: variant.stock,
            variants: [variant],
          });
        }
      } else {
        result.push({ ...product, _cardKey: String(product.id) });
      }
    }
    return result;
  }, [allProducts]);

  useEffect(() => {
    setPriceRange([maxPrice]);
    setSelectedCategories([]);
    setSelectedOccasions(initialOccasionSlug ? [initialOccasionSlug] : []);
    setSelectedTags([]);
    setVisibleCount(ITEMS_PER_PAGE); // Reset count on category change
  }, [maxPrice, currentCategory, subcategories, pageType, currentOccasion, initialOccasionSlug]);
  
  const filteredClientProducts = useMemo(() => {
    let filtered = expandedProducts.filter((product: any) => {
        const searchMatch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.code.toLowerCase().includes(searchTerm.toLowerCase());
        
        const productPrice =
            product.sale_price ??
            product.variants?.[0]?.sale_price ??
            product.variants?.[0]?.price ??
            product.price;
        
        const priceMatch = productPrice <= priceRange[0];

        let categoryMatch = true;
        if (pageType === 'all') {
            categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category.slug);
        } else if (pageType === 'category' && currentCategory) {
            const isFilteringSubcategories = selectedCategories.length > 0;
            if(isFilteringSubcategories) {
                categoryMatch = selectedCategories.includes(product.category.slug);
            } else {
                const descendantSlugs = allCategories.filter(c => c.parent_id === currentCategory.id).map(c => c.slug);
                categoryMatch = product.category.slug === currentCategory.slug || descendantSlugs.includes(product.category.slug);
            }
        }
        
        const occasionMatch = selectedOccasions.length === 0 || product.occasions?.some(occ => selectedOccasions.includes(occ.slug));
        const tagMatch = selectedTags.length === 0 || product.tags?.some(tag => selectedTags.includes(tag.name));

        let initialOccasionMatch = true;
        if(pageType === 'occasion' && currentOccasion) {
            initialOccasionMatch = product.occasions?.some(o => o.id === currentOccasion.id) || false;
        }

        return searchMatch && priceMatch && categoryMatch && occasionMatch && tagMatch && initialOccasionMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
        const priceA = a.sale_price ?? (a.variants?.[0]?.sale_price ?? a.variants?.[0]?.price ?? a.price);
        const priceB = b.sale_price ?? (b.variants?.[0]?.sale_price ?? b.variants?.[0]?.price ?? b.price);

        switch (sortOption) {
            case 'price-asc':
                return priceA - priceB;
            case 'price-desc':
                return priceB - priceA;
            case 'recommended':
            default:
                const isARecommended = a.tags?.some(t => t.name === 'más vendido');
                const isBRecommended = b.tags?.some(t => t.name === 'más vendido');
                if (isARecommended && !isBRecommended) return -1;
                if (!isARecommended && isBRecommended) return 1;
                return 0; 
        }
    });

    return sorted;
  }, [searchTerm, priceRange, selectedCategories, selectedOccasions, selectedTags, sortOption, expandedProducts, allCategories, pageType, currentCategory, currentOccasion]);

  // Reset count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchTerm, selectedCategories, selectedOccasions, selectedTags, priceRange, sortOption]);

  const displayedProducts = useMemo(() => {
    return filteredClientProducts.slice(0, visibleCount);
  }, [filteredClientProducts, visibleCount]);

  const hasMore = visibleCount < filteredClientProducts.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategories(prev => {
        let newSelection = new Set(prev);
        const categoryClicked = allCategories.find(c => c.slug === slug);
        if (!categoryClicked) return Array.from(newSelection);

        const isParent = !categoryClicked.parent_id;
        const isCurrentlySelected = newSelection.has(slug);

        if (isCurrentlySelected) {
            newSelection.delete(slug);
            if (isParent) {
                const children = allCategories.filter(c => c.parent_id === categoryClicked.id);
                children.forEach(child => newSelection.delete(child.slug));
            } else {
                const parent = allCategories.find(c => c.id === categoryClicked.parent_id);
                if (parent) newSelection.delete(parent.slug);
            }
        } else {
            newSelection.add(slug);
            if (isParent) {
                const children = allCategories.filter(c => c.parent_id === categoryClicked.id);
                children.forEach(child => newSelection.add(child.slug));
            } else {
                const parent = allCategories.find(c => c.id === categoryClicked.parent_id);
                if (parent) {
                    const siblings = allCategories.filter(c => c.parent_id === parent.id);
                    const allSiblingsSelected = siblings.every(sibling => newSelection.has(sibling.slug));
                    if (allSiblingsSelected) newSelection.add(parent.slug);
                }
            }
        }
        return Array.from(newSelection);
    });
  };

  const handleOccasionChange = (slug: string) => {
    setSelectedOccasions(prev => {
        const newSelection = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
        return newSelection;
    });
  };

  const handleTagChange = (name: string) => {
      setSelectedTags(prev => {
        const newSelection = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
        return newSelection;
      });
  };

  const itemsWithAds = useMemo(() => {
    if (announcements.length === 0) {
      return displayedProducts;
    }
  
    const shuffledAds = [...announcements].sort(() => 0.5 - Math.random());
    const items: (Product | { isAd: true; adDetails: any })[] = [];
    let adIndex = 0;
    
    for (let i = 0; i < displayedProducts.length; i++) {
      items.push(displayedProducts[i]);
      
      if ((i + 1) % 8 === 0 && adIndex < shuffledAds.length) {
        const ad = shuffledAds[adIndex];
        items.push({ 
          isAd: true, 
          adDetails: { ...ad, size: 'double' } 
        });
        adIndex++;
      }
    }
    
    return items;
  }, [displayedProducts, announcements]);


  const handleQuickViewOpen = (product: ProductRow) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const mainCategories = useMemo(() => {
    return allCategories.filter(c => !c.parent_id);
  }, [allCategories]);

  const getSubcategories = (parentId: number) => allCategories.filter(c => c.parent_id === parentId);

  const { pageTitle, pageDescription } = useMemo(() => {
    if (pageType === 'category' && currentCategory) {
      return {
        pageTitle: currentCategory.name,
        pageDescription: currentCategory.description
      }
    }
    if (pageType === 'occasion' && currentOccasion) {
      return {
        pageTitle: `Ocasión: ${currentOccasion.name}`,
        pageDescription: currentOccasion.description
      }
    }
    return {
      pageTitle: 'Todos los Productos',
      pageDescription: 'Descubre toda la magia floral en un solo lugar. Explora nuestra colección completa de flores y detalles.'
    }
  }, [pageType, currentCategory, currentOccasion]);

  const FiltersContent = () => (
    <div className="space-y-8">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl"
            />
        </div>
      
        {pageType === 'all' && (
            <div className="space-y-4">
                <h3 className="font-bold uppercase text-muted-foreground text-xs tracking-widest">Categoría</h3>
                <div className="space-y-3">
                    {mainCategories.map(cat => (
                        <div key={cat.id}>
                            <div className="flex items-center space-x-2">
                                <Checkbox id={cat.slug} checked={selectedCategories.includes(cat.slug)} onCheckedChange={() => handleCategoryChange(cat.slug)} />
                                <Label htmlFor={cat.slug} className="font-semibold text-sm">{cat.name}</Label>
                            </div>
                            {getSubcategories(cat.id).length > 0 && (
                                <div className="pl-6 mt-3 space-y-3">
                                    {getSubcategories(cat.id).map(sub => (
                                        <div key={sub.id} className="flex items-center space-x-2">
                                            <Checkbox id={sub.slug} checked={selectedCategories.includes(sub.slug)} onCheckedChange={() => handleCategoryChange(sub.slug)} />
                                            <Label htmlFor={sub.slug} className="font-normal text-sm text-muted-foreground">{sub.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div>
          <h3 className="font-bold uppercase text-muted-foreground text-xs tracking-widest mb-6">Precio Máximo</h3>
          <Slider
              max={maxPrice}
              step={50}
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number])}
              className="py-4"
          />
          <div className="flex justify-between text-sm font-bold text-primary mt-2">
              <span>$0</span>
              <span>${priceRange[0]}</span>
          </div>
        </div>

        <div className="space-y-4">
            <h3 className="font-bold uppercase text-muted-foreground text-xs tracking-widest">Ocasión</h3>
            <div className="flex flex-wrap gap-2">
                {allOccasions.map(occ => (
                    <Button
                        key={occ.id}
                        variant={selectedOccasions.includes(occ.slug) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleOccasionChange(occ.slug)}
                        className="rounded-full h-9 px-4"
                    >
                        {occ.name}
                    </Button>
                ))}
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="font-bold uppercase text-muted-foreground text-xs tracking-widest">Etiquetas</h3>
            <div className="grid grid-cols-2 gap-3">
                {allTags.map(tag => (
                    <div key={tag.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                        <Checkbox id={`tag-${tag.id}`} checked={selectedTags.includes(tag.name)} onCheckedChange={() => handleTagChange(tag.name)} />
                        <Label htmlFor={`tag-${tag.id}`} className="font-medium text-xs">{tag.name}</Label>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <>
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-12">
           <Breadcrumb className="mb-6 md:mb-10 hidden md:flex">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    {pageType === 'category' && currentCategory ? (
                        <><BreadcrumbItem><BreadcrumbLink href="/products/all">Productos</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{currentCategory.name}</BreadcrumbPage></BreadcrumbItem></>
                    ) : (
                        <BreadcrumbItem><BreadcrumbPage>Catálogo</BreadcrumbPage></BreadcrumbItem>
                    )}
                </BreadcrumbList>
            </Breadcrumb>
          
          <div className="mb-8 md:mb-12">
            {isLoading ? (
              <Skeleton className="h-10 w-2/3 mx-auto md:mx-0 mb-3" />
            ) : (
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-headline mb-3 text-center md:text-left animate-fade-in-up">
                {pageTitle}
              </h1>
            )}
            
            {isLoading ? (
              <Skeleton className="h-4 w-full mt-2" />
            ) : (
              <p className="text-muted-foreground text-sm md:text-lg max-w-3xl text-center md:text-left mx-auto md:mx-0 leading-relaxed">
                {pageDescription}
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 sticky top-20 z-30 bg-background/95 backdrop-blur-md py-4 -mx-4 px-4 md:static md:bg-transparent md:py-0 md:px-0 md:mx-0">
              <div className="flex items-center gap-3 w-full md:w-auto">
                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                      <SelectTrigger className="flex-1 md:w-[240px] h-11 md:h-10 rounded-xl bg-background border-none shadow-sm">
                          <SelectValue placeholder="Ordenar por..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="recommended">Destacados</SelectItem>
                          <SelectItem value="price-asc">Precio: Menor a mayor</SelectItem>
                          <SelectItem value="price-desc">Precio: Mayor a menor</SelectItem>
                      </SelectContent>
                  </Select>
                  
                  <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" className="h-11 md:h-10 px-4 rounded-xl bg-background border-none shadow-sm text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-2 font-bold">
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Filtros</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 border-none shadow-2xl">
                        <SheetHeader className="p-6 border-b">
                            <SheetTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                                <Filter className="w-6 h-6 text-primary" />
                                Filtrar Catálogo
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex-grow overflow-y-auto px-6 py-8">
                            <FiltersContent />
                        </div>
                        <SheetFooter className="p-6 border-t mt-auto">
                            <SheetClose asChild>
                                <Button className="w-full h-14 rounded-2xl text-lg font-bold">Ver Resultados</Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                  </Sheet>
              </div>
              <div className="hidden md:block text-sm font-bold text-muted-foreground">
                {isLoading ? <Skeleton className="h-5 w-24" /> : `${filteredClientProducts.length} arreglos encontrados`}
              </div>
          </div>

        <div className="min-h-[400px]">
             {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)}
                </div>
             ) : itemsWithAds.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {itemsWithAds.map((item, index) => 
                        'isAd' in item && item.isAd ? (
                            <AdCard key={`ad-${index}`} ad={item.adDetails} className="hidden lg:flex" />
                        ) : 'slug' in item ? (
                            <ProductCard
                            key={(item as any)._cardKey ?? item.id}
                            product={item as any}
                            index={index}
                            onQuickViewOpen={handleQuickViewOpen}
                            variant="compact"
                            />
                        ) : null
                        )}
                    </div>
                    
                    {hasMore && (
                        <div className="mt-16 flex justify-center pb-12 animate-fade-in">
                            <Button 
                                onClick={handleLoadMore} 
                                variant="outline" 
                                size="lg" 
                                className="rounded-full h-14 px-12 border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold text-lg shadow-lg shadow-primary/10 transition-all active:scale-95 group"
                            >
                                Ver más arreglos
                                <LayoutGrid className="ml-2 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            </Button>
                        </div>
                    )}
                </>
             ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="p-6 bg-muted rounded-full mb-6">
                    <Search className="w-12 h-12 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">No encontramos resultados</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">Intenta ajustar los filtros o busca con palabras más generales.</p>
                <Button variant="link" className="mt-4" onClick={() => { setSearchTerm(''); setPriceRange([maxPrice]); setSelectedCategories([]); setSelectedOccasions([]); setSelectedTags([]); }}>Limpiar todos los filtros</Button>
              </div>
            )}
        </div>
      </div>
      {selectedProduct && (
        <QuickView
            isOpen={isQuickViewOpen}
            onOpenChange={setIsQuickViewOpen}
            product={selectedProduct}
        />
      )}
    </>
  );
}
