export type ImageLike = {
  id?: number | string;
  src?: string | null;
  alt?: string | null;
  is_primary?: boolean;
  isPrimary?: boolean;
};

const PLACEHOLDER_IMAGE = '/placehold.webp';

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const getImageSrc = (image: any): string | null => {
  const src = image?.src ?? image?.url ?? null;
  return isNonEmptyString(src) ? src : null;
};

const getImageAlt = (image: any, fallback: string) => {
  const alt = image?.alt;
  return isNonEmptyString(alt) ? alt : fallback;
};

type NormalizedImage = { src: string; alt: string };

const normalizeImages = (images: any[] | undefined | null, fallbackAlt: string): NormalizedImage[] => {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => {
      const src = getImageSrc(img);
      if (!src) return null;
      return { src, alt: getImageAlt(img, fallbackAlt) };
    })
    .filter((img): img is NormalizedImage => img !== null);
};

export const pickMainProductImage = (product: any, fallback = PLACEHOLDER_IMAGE): string => {
  if (!product) return fallback;

  const direct = [product?.mainImage, product?.main_image, product?.image];
  const directHit = direct.find(isNonEmptyString);
  if (directHit) return directHit;

  const productImages = normalizeImages(product?.images, product?.name ?? 'Producto');
  if (productImages.length > 0) {
    const primary = Array.isArray(product?.images)
      ? product.images.find((img: any) => Boolean(img?.is_primary ?? img?.isPrimary))
      : null;
    const primarySrc = getImageSrc(primary);
    return primarySrc || productImages[0].src;
  }

  const firstVariantWithImage = Array.isArray(product?.variants)
    ? product.variants.find((variant: any) => Array.isArray(variant?.images) && variant.images.length > 0)
    : null;

  if (firstVariantWithImage?.images?.length) {
    const firstVariantSrc = getImageSrc(firstVariantWithImage.images[0]);
    if (firstVariantSrc) return firstVariantSrc;
  }

  return fallback;
};

export const resolveProductGalleryImages = (product: any, selectedVariant?: any): Array<{ id: number | string; src: string; alt: string; is_primary: boolean }> => {
  if (!product) {
    return [{ id: 0, src: PLACEHOLDER_IMAGE, alt: 'Producto', is_primary: true }];
  }

  const variantImages = normalizeImages(selectedVariant?.images, selectedVariant?.name ?? product?.name ?? 'Producto');
  const productImages = normalizeImages(product?.images, product?.name ?? 'Producto');

  const firstVariantWithImages = Array.isArray(product?.variants)
    ? product.variants.find((variant: any) => Array.isArray(variant?.images) && variant.images.length > 0)
    : null;

  const fallbackVariantImages = normalizeImages(firstVariantWithImages?.images, firstVariantWithImages?.name ?? product?.name ?? 'Producto');

  const source = variantImages.length > 0 ? variantImages : productImages.length > 0 ? productImages : fallbackVariantImages;

  if (source.length === 0) {
    return [{ id: 0, src: pickMainProductImage(product), alt: product?.name ?? 'Producto', is_primary: true }];
  }

  return source.map((img, index) => ({
    id: index,
    src: img.src,
    alt: img.alt,
    is_primary: index === 0,
  }));
};
