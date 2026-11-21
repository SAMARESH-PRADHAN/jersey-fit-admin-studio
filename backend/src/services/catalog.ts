import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  categories,
  productImages,
  products,
  subcategories,
} from "../db/schema/catalog.js";
import type {
  categoryCreateInputSchema,
  productCreateInputSchema,
} from "../validators/index.js";
import type { z } from "zod";

export class CatalogService {
  static async listCategories() {
    const allCategories = await db.select().from(categories);
    const allSubs = await db.select().from(subcategories);

    return allCategories.map((cat) => ({
      ...cat,
      subcategories: allSubs
        .filter((sub) => sub.categorySlug === cat.slug)
        .map((s) => ({
          slug: s.slug,
          label: s.label,
          description: s.description ?? undefined,
          image: s.image ?? undefined,
        })),
    }));
  }

  static async createCategory(input: z.infer<typeof categoryCreateInputSchema>) {
    return await db.transaction(async (tx) => {
      const [category] = await tx
        .insert(categories)
        .values({
          slug: input.slug,
          label: input.label,
          image: input.image,
          description: input.description,
          family: input.family,
          type: input.type,
          section: input.section,
        })
        .returning();

      if (input.subcategories.length > 0) {
        await tx.insert(subcategories).values(
          input.subcategories.map((sub) => ({
            categorySlug: input.slug,
            slug: sub.slug,
            label: sub.label,
            description: sub.description ?? "",
            image: sub.image ?? "",
          })),
        );
      }

      return category;
    });
  }

  static async updateCategory(
    slug: string,
    input: z.infer<typeof categoryCreateInputSchema>,
  ) {
    return await db.transaction(async (tx) => {
      const [category] = await tx
        .update(categories)
        .set({
          label: input.label,
          family: input.family,
          type: input.type,
          section: input.section,
          updatedAt: new Date(),
        })
        .where(eq(categories.slug, slug))
        .returning();

      await tx
        .delete(subcategories)
        .where(eq(subcategories.categorySlug, slug));

      if (input.subcategories.length > 0) {
        await tx.insert(subcategories).values(
          input.subcategories.map((sub) => ({
            categorySlug: slug,
            slug: sub.slug,
            label: sub.label,
            description: sub.description ?? "",
            image: sub.image ?? "",
          })),
        );
      }

      return category;
    });
  }

  static async deleteCategory(slug: string) {
    const linkedProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.category, slug))
      .limit(1);

    if (linkedProducts.length > 0) {
      throw new Error(
        "Cannot delete category: Reassign or remove this category's products first.",
      );
    }

    await db.delete(categories).where(eq(categories.slug, slug));
    return { success: true };
  }

  static async listProducts(filter?: {
    search?: string;
    family?: "customisable" | "readymade" | "all";
    section?: string;
    category?: string;
    subCategory?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 8;
    const offset = (page - 1) * pageSize;

    const all = await db.select().from(products);
    const images = await db.select().from(productImages);

    const imageMap = new Map<string, string[]>();
    for (const img of images.sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
      imageMap.get(img.productId)!.push(img.url);
    }

    const filtered = all
      .filter((p) => {
        if (filter?.family && filter.family !== "all" && p.family !== filter.family) return false;
        if (filter?.section && filter.section !== "all" && p.section !== filter.section) return false;
        if (filter?.category && filter.category !== "all" && p.category !== filter.category) return false;
        if (filter?.subCategory && filter.subCategory !== "all") {
          if (filter.subCategory === "__none__") {
            if (p.subCategory) return false;
          } else {
            if (p.subCategory !== filter.subCategory) return false;
          }
        }
        if (filter?.search) {
          const s = filter.search.toLowerCase();
          const target = `${p.name} ${p.code} ${p.category} ${p.subCategory ?? ""}`.toLowerCase();
          if (!target.includes(s)) return false;
        }
        return true;
      })
      .map((p) => ({
        ...p,
        rating: Number(p.rating),
        images: imageMap.get(p.id) ?? [],
      }));

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated = filtered.slice(offset, offset + pageSize);

    return {
      products: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  static async getProduct(id: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) return null;

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id));

    return {
      ...product,
      rating: Number(product.rating),
      images: images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.url),
    };
  }

  static async createProduct(input: z.infer<typeof productCreateInputSchema>) {
    const id = input.id || `product-${Date.now()}`;
    return await db.transaction(async (tx) => {
      // Upsert: handle cases where product was already inserted or client re-sent create
      const [product] = await tx
        .insert(products)
        .values({
          id,
          code: input.code,
          name: input.name,
          family: input.family,
          section: input.section,
          category: input.category,
          subCategory: input.subCategory,
          price: input.price,
          mrp: input.mrp,
          material: input.material || "Dry-fit polyester",
          description: input.description || "",
          overview: input.overview || "",
          washCare: input.washCare || "",
          designGuidelines: input.designGuidelines || "",
          rating: input.rating !== undefined ? String(input.rating) : "4.5",
          tag: input.tag,
          isExclusiveTopWear: input.isExclusiveTopWear,
          active: input.active,
          demo: input.demo,
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            code: input.code,
            name: input.name,
            family: input.family,
            section: input.section,
            category: input.category,
            subCategory: input.subCategory,
            price: input.price,
            mrp: input.mrp,
            material: input.material,
            description: input.description,
            overview: input.overview,
            washCare: input.washCare,
            designGuidelines: input.designGuidelines,
            rating: input.rating !== undefined ? String(input.rating) : "4.5",
            tag: input.tag,
            isExclusiveTopWear: input.isExclusiveTopWear,
            active: input.active,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (input.images.length > 0) {
        await tx.delete(productImages).where(eq(productImages.productId, id));
        await tx.insert(productImages).values(
          input.images.slice(0, 4).map((url, index) => ({
            productId: id,
            url,
            sortOrder: index,
          })),
        );
      }

      return {
        ...product,
        rating: Number(product.rating),
        images: input.images.slice(0, 4),
      };
    });
  }

  static async updateProduct(
    id: string,
    input: Partial<z.infer<typeof productCreateInputSchema>>,
  ) {
    return await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (input.code) updateData.code = input.code;
      if (input.name) updateData.name = input.name;
      if (input.family) updateData.family = input.family;
      if (input.section) updateData.section = input.section;
      if (input.category) updateData.category = input.category;
      if (input.subCategory !== undefined) updateData.subCategory = input.subCategory;
      if (input.price !== undefined) updateData.price = input.price;
      if (input.mrp !== undefined) updateData.mrp = input.mrp;
      if (input.material) updateData.material = input.material;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.overview !== undefined) updateData.overview = input.overview;
      if (input.washCare !== undefined) updateData.washCare = input.washCare;
      if (input.designGuidelines !== undefined) updateData.designGuidelines = input.designGuidelines;
      if (input.rating !== undefined) updateData.rating = String(input.rating);
      if (input.tag !== undefined) updateData.tag = input.tag;
      if (input.isExclusiveTopWear !== undefined) updateData.isExclusiveTopWear = input.isExclusiveTopWear;
      if (input.active !== undefined) updateData.active = input.active;

      const [product] = await tx
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();

      if (input.images !== undefined) {
        await tx.delete(productImages).where(eq(productImages.productId, id));
        if (input.images.length > 0) {
          await tx.insert(productImages).values(
            input.images.slice(0, 4).map((url, idx) => ({
              productId: id,
              url,
              sortOrder: idx,
            })),
          );
        }
      }

      const currentImages = await tx
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id));

      return {
        ...product,
        rating: Number(product.rating),
        images: currentImages.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.url),
      };
    });
  }

  static async deleteProduct(id: string) {
    await db.delete(products).where(eq(products.id, id));
    return { success: true };
  }

  static async bulkDeleteProducts(ids: string[]) {
    for (const id of ids) {
      await db.delete(products).where(eq(products.id, id));
    }
    return { success: true, count: ids.length };
  }
}
