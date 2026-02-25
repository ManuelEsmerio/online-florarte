import { prisma } from '@/lib/prisma';
import type { ProductCategory } from '@/lib/definitions';
import { z } from 'zod'; // Assuming you are using zod for validation
import slugify from 'slugify';

// Define the shape based on your Prisma Schema and Definitions
// We map Prisma fields to your application interface

export const categoryService = {
  // --- Get All (Flattened or Tree) ---
  async getAllCategories() {
    const categories = await prisma.productCategory.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' }, // Or sortOrder if you add it later
      include: {
        children: {
          where: { isDeleted: false },
        },
      },
    });
    return categories;
  },

  // --- Get Main Categories (Roots) ---
  async getMainCategories() {
    return await prisma.productCategory.findMany({
      where: {
        parentId: null,
        isDeleted: false,
      },
      include: {
        children: {
          where: { isDeleted: false },
        },
      },
    });
  },

  // --- Get Home Page Categories ---
  async getHomePageCategories() {
    return await prisma.productCategory.findMany({
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
  },

  // --- Get by Slug ---
  async getCategoryBySlug(slug: string) {
    const category = await prisma.productCategory.findFirst({
      where: {
        slug: slug,
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
    return category;
  },

  // --- Get by ID ---
  async getCategoryById(id: number) {
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        children: {
          where: { isDeleted: false },
        },
      },
    });
    
    // Check logical deletion manually if needed, though findUnique returns null if not found
    if (category?.isDeleted) return null;
    
    return category;
  },

  // --- Create ---
  async createCategory(data: Partial<ProductCategory>) {
    // Generate Slug if not provided
    let slug = data.slug;
    if (!slug && data.name) {
      slug = slugify(data.name, { lower: true, strict: true });
    }

    if (!slug) throw new Error('Slug is required or could not be generated');
    if (!data.name) throw new Error('Name is required');

    // Check slug uniqueness
    const existing = await prisma.productCategory.findUnique({
      where: { slug },
    });
    if (existing) throw new Error(`Category with slug "${slug}" already exists.`);

    return await prisma.productCategory.create({
      data: {
        name: data.name,
        slug: slug,
        prefix: data.prefix || 'CAT',
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
        showOnHome: data.showOnHome ?? false,
      },
    });
  },

  // --- Update ---
  async updateCategory(id: number, data: Partial<ProductCategory>) {
    // Check if exists
    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) throw new Error('Category not found');

    // Handle slug update check
    if (data.slug && data.slug !== existing.slug) {
      const duplicate = await prisma.productCategory.findUnique({
        where: { slug: data.slug },
      });
      if (duplicate && duplicate.id !== id) {
        throw new Error('Slug already in use by another category.');
      }
    }

    return await prisma.productCategory.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        prefix: data.prefix,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
        showOnHome: data.showOnHome,
      },
    });
  },

  // --- Delete (Soft Delete) ---
  async deleteCategory(id: number) {
    // Check for children or products before deleting
    const hasChildren = await prisma.productCategory.count({
      where: { parentId: id, isDeleted: false },
    });
    if (hasChildren > 0) {
      throw new Error('Cannot delete category with active subcategories.');
    }
    
    const hasProducts = await prisma.product.count({
      where: { categoryId: id, isDeleted: false }
    });
    
    if (hasProducts > 0) {
        throw new Error('Cannot delete category containing active products.');
    }

    return await prisma.productCategory.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  },
};