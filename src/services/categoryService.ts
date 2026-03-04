import { prisma } from '@/lib/prisma';
import { UserFacingError } from '@/utils/errors';
import type { ProductCategory } from '@/lib/definitions';
import slugify from 'slugify';
import { saveCategoryImage, deleteManagedFile } from './file.service';
import { getPublicUrlForPath } from '@/utils/file-utils';

type CategoryInput = Partial<ProductCategory> & {
  parent_id?: number | null;
  show_on_home?: boolean;
  image_url?: string | null;
};

function normalizeCategoryInput(data: CategoryInput) {
  return {
    name: data.name,
    slug: data.slug,
    prefix: data.prefix,
    description: data.description,
    parentId: data.parentId ?? data.parent_id ?? null,
    showOnHome: data.showOnHome ?? data.show_on_home ?? false,
    imageUrl: data.imageUrl ?? data.image_url ?? null,
  };
}

function mapCategoryForOutput<T extends { imageUrl: string | null }>(category: T): T {
  return {
    ...category,
    imageUrl: getPublicUrlForPath(category.imageUrl) || '/placehold.webp',
  };
}

export const categoryService = {
  async getAllCategories() {
    const categories = await prisma.productCategory.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
      include: {
        children: {
          where: { isDeleted: false },
        },
      },
    });

    return categories.map((category) =>
      mapCategoryForOutput({
        ...category,
        children: category.children.map((child) => mapCategoryForOutput(child)),
      }),
    );
  },

  async getMainCategories() {
    const categories = await prisma.productCategory.findMany({
      where: {
        parentId: null,
        isDeleted: false,
      },
      include: {
        children: {
          where: { isDeleted: false },
        },
      },
      orderBy: { id: 'asc' },
    });

    return categories.map((category) =>
      mapCategoryForOutput({
        ...category,
        children: category.children.map((child) => mapCategoryForOutput(child)),
      }),
    );
  },

  async getHomePageCategories() {
    const categories = await prisma.productCategory.findMany({
      where: {
        showOnHome: true,
        isDeleted: false,
      },
      orderBy: { id: 'asc' },
      include: {
        children: {
          where: { isDeleted: false },
        },
      },
    });

    return categories.map((category) =>
      mapCategoryForOutput({
        ...category,
        children: category.children.map((child) => mapCategoryForOutput(child)),
      }),
    );
  },

  async getCategoryBySlug(slug: string) {
    const category = await prisma.productCategory.findFirst({
      where: {
        slug,
        isDeleted: false,
      },
      include: {
        children: {
          where: { isDeleted: false },
        },
        parent: true,
      },
    });

    if (!category) return null;

    return mapCategoryForOutput({
      ...category,
      parent: category.parent ? mapCategoryForOutput(category.parent) : null,
      children: category.children.map((child) => mapCategoryForOutput(child)),
    });
  },

  async getCategoryById(id: number) {
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        children: {
          where: { isDeleted: false },
        },
      },
    });

    if (!category || category.isDeleted) return null;

    return mapCategoryForOutput({
      ...category,
      children: category.children.map((child) => mapCategoryForOutput(child)),
    });
  },

  async createCategory(data: CategoryInput, imageFile: File | null = null, _creatorId?: number) {
    const normalized = normalizeCategoryInput(data);

    let slug = normalized.slug;
    if (!slug && normalized.name) {
      slug = slugify(normalized.name, { lower: true, strict: true });
    }

    if (!slug) throw new UserFacingError('El slug es requerido o no se pudo generar.');
    if (!normalized.name) throw new UserFacingError('El nombre de la categoría es requerido.');

    const existing = await prisma.productCategory.findUnique({ where: { slug } });
    if (existing) throw new UserFacingError(`Ya existe una categoría con el slug "${slug}".`);

    const created = await prisma.productCategory.create({
      data: {
        name: normalized.name,
        slug,
        prefix: normalized.prefix || 'CAT',
        description: normalized.description,
        imageUrl: normalized.imageUrl,
        parentId: normalized.parentId,
        showOnHome: normalized.showOnHome,
      },
    });

    if (!imageFile) {
      return mapCategoryForOutput(created);
    }

    const uploadedUrl = await saveCategoryImage(imageFile, created.id);
    const updated = await prisma.productCategory.update({
      where: { id: created.id },
      data: { imageUrl: uploadedUrl },
    });

    return mapCategoryForOutput(updated);
  },

  async updateCategory(id: number, data: CategoryInput, imageFile: File | null = null, _editorId?: number) {
    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw new UserFacingError('Categoría no encontrada.');

    const normalized = normalizeCategoryInput(data);

    let slug = normalized.slug ?? existing.slug;
    if (!slug && normalized.name) {
      slug = slugify(normalized.name, { lower: true, strict: true });
    }

    if (slug !== existing.slug) {
      const duplicate = await prisma.productCategory.findUnique({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        throw new UserFacingError('Este slug ya está en uso por otra categoría.');
      }
    }

    let imageUrlToSave = normalized.imageUrl ?? existing.imageUrl;
    if (imageFile) {
      if (existing.imageUrl) {
        await deleteManagedFile(existing.imageUrl);
      }
      imageUrlToSave = await saveCategoryImage(imageFile, id);
    }

    const updated = await prisma.productCategory.update({
      where: { id },
      data: {
        name: normalized.name,
        slug,
        prefix: normalized.prefix,
        description: normalized.description,
        imageUrl: imageUrlToSave,
        parentId: normalized.parentId,
        showOnHome: normalized.showOnHome,
      },
    });

    return mapCategoryForOutput(updated);
  },

  async toggleCategoryShowOnHome(id: number, showOnHome: boolean, _editorId?: number) {
    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw new UserFacingError('Categoría no encontrada.');

    const updated = await prisma.productCategory.update({
      where: { id },
      data: { showOnHome },
    });

    return mapCategoryForOutput(updated);
  },

  async deleteCategory(id: number, _deleterId?: number) {
    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw new UserFacingError('Categoría no encontrada.');

    const hasChildren = await prisma.productCategory.count({
      where: { parentId: id, isDeleted: false },
    });
    if (hasChildren > 0) {
      throw new UserFacingError('No se puede eliminar la categoría porque tiene subcategorías activas.');
    }

    const hasProducts = await prisma.product.count({
      where: { categoryId: id, isDeleted: false },
    });
    if (hasProducts > 0) {
      throw new UserFacingError('No se puede eliminar la categoría porque tiene productos activos.');
    }

    return prisma.productCategory.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  },
};
