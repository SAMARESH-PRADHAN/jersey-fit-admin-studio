import { AuthService } from "../services/auth.js";
import { CatalogService } from "../services/catalog.js";
import { RulesService } from "../services/rules.js";
import { CouponService } from "../services/coupons.js";
import { PricingEngine } from "../services/pricing.js";
import { OrderService } from "../services/orders.js";
import { CustomerService, PaymentService } from "../services/customers.js";
import { SettingsService } from "../services/settings.js";
import { StorageService } from "../services/storage.js";
import { ReportsService } from "../services/reports.js";
import { BackupService } from "../services/backup.js";
import { AuditService } from "../services/audit.js";

export interface RequestContext {
  token?: string;
  admin?: {
    userId: string;
    email: string;
    role: "admin" | "staff";
    name: string;
  };
}

export class ApiHandler {
  /**
   * Helper to verify admin auth from Authorization Bearer header
   */
  static async authenticate(authHeader?: string): Promise<RequestContext> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {};
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const admin = await AuthService.verifyToken(token);
    return admin ? { token, admin } : {};
  }

  /**
   * Main dispatch router for backend RPC / serverFn calls
   */
  static async dispatch(
    action: string,
    params: any,
    ctx: RequestContext,
  ): Promise<any> {
    // Check admin requirements
    const requireAdmin = () => {
      if (!ctx.admin) {
        throw new Error("Unauthorized: Admin privileges required.");
      }
    };

    switch (action) {
      // --- Public Storefront Endpoints ---
      case "storefront.getPublicSettings":
        return await SettingsService.getSettings();

      case "storefront.listProducts":
        return await CatalogService.listProducts(params);

      case "storefront.getProduct":
        return await CatalogService.getProduct(params.id);

      case "storefront.listCategories":
        return await CatalogService.listCategories();

      case "storefront.resolvePricingConfig":
        return await RulesService.resolvePricingConfig(params);

      case "storefront.validateCoupon":
        return await CouponService.validate(params.code, params.subtotal);

      case "storefront.priceCart":
        return await PricingEngine.priceCart(params.cart, params.couponCode);

      case "storefront.createOrder":
        return await OrderService.createOrder(params);

      case "storefront.getCustomerOrders":
        return await OrderService.getCustomerOrders(params.email || params.userId);

      case "storefront.listShowcase":
        return await SettingsService.listShowcase();

      case "storefront.listCustomDesignOptions":
        return await SettingsService.listCustomDesignOptions();

      case "storefront.listProductReviews":
        return await SettingsService.listReviews(params?.productId);

      case "storefront.createReview":
        return await SettingsService.createReview(params);

      case "storefront.signup":
        return await CustomerService.signup(params);

      case "storefront.login":
        return await CustomerService.login(params.email, params.password);

      // --- Auth ---
      case "auth.login": {
        const res = await AuthService.login(params.email, params.password);
        await AuditService.log({
          actorId: res.user.id,
          actorEmail: res.user.email,
          action: "auth.login",
          entity: "admin_users",
          entityId: res.user.id,
        });
        return res;
      }

      case "auth.me":
        requireAdmin();
        return { user: ctx.admin };

      // --- Admin Catalog ---
      case "admin.products.list":
        requireAdmin();
        return await CatalogService.listProducts(params);

      case "admin.products.create": {
        requireAdmin();
        const p = await CatalogService.createProduct(params);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "product.create",
          entity: "product",
          entityId: p.id,
          diff: params,
        });
        return p;
      }

      case "admin.products.update": {
        requireAdmin();
        const p = await CatalogService.updateProduct(params.id, params.data);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "product.update",
          entity: "product",
          entityId: params.id,
          diff: params.data,
        });
        return p;
      }

      case "admin.products.delete": {
        requireAdmin();
        const res = await CatalogService.deleteProduct(params.id);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "product.delete",
          entity: "product",
          entityId: params.id,
        });
        return res;
      }

      case "admin.products.bulkDelete": {
        requireAdmin();
        const res = await CatalogService.bulkDeleteProducts(params.ids);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "product.bulk_delete",
          entity: "product",
          entityId: params.ids.join(","),
        });
        return res;
      }

      case "admin.categories.create": {
        requireAdmin();
        const c = await CatalogService.createCategory(params);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "category.create",
          entity: "category",
          entityId: c.slug,
          diff: params,
        });
        return c;
      }

      case "admin.categories.update": {
        requireAdmin();
        const c = await CatalogService.updateCategory(params.slug, params.data);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "category.update",
          entity: "category",
          entityId: params.slug,
          diff: params.data,
        });
        return c;
      }

      case "admin.categories.delete": {
        requireAdmin();
        const res = await CatalogService.deleteCategory(params.slug);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "category.delete",
          entity: "category",
          entityId: params.slug,
        });
        return res;
      }

      // --- Admin Rules ---
      case "admin.rules.save": {
        requireAdmin();
        const res = await RulesService.saveRule(params);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "rule.save",
          entity: "pricing_rule",
          entityId: `${params.scope}:${params.family}:${params.categorySlug ?? ""}`,
          diff: params.values,
        });
        return res;
      }

      case "admin.rules.reset": {
        requireAdmin();
        const res = await RulesService.resetRule(params);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "rule.reset",
          entity: "pricing_rule",
          entityId: `${params.scope}:${params.family}:${params.categorySlug}`,
        });
        return res;
      }

      // --- Admin Coupons ---
      case "admin.coupons.list":
        requireAdmin();
        return await CouponService.list();

      case "admin.coupons.create": {
        requireAdmin();
        const c = await CouponService.create(params);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "coupon.create",
          entity: "coupon",
          entityId: c.code,
          diff: params,
        });
        return c;
      }

      case "admin.coupons.update": {
        requireAdmin();
        const c = await CouponService.update(params.code, params.data);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "coupon.update",
          entity: "coupon",
          entityId: params.code,
          diff: params.data,
        });
        return c;
      }

      case "admin.coupons.toggleActive": {
        requireAdmin();
        const c = await CouponService.toggleActive(params.code, params.active);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "coupon.toggle_active",
          entity: "coupon",
          entityId: params.code,
          diff: { active: params.active },
        });
        return c;
      }

      case "admin.coupons.delete": {
        requireAdmin();
        const res = await CouponService.delete(params.code);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "coupon.delete",
          entity: "coupon",
          entityId: params.code,
        });
        return res;
      }

      // --- Admin Orders ---
      case "admin.orders.list":
        requireAdmin();
        return await OrderService.listOrders(params);

      case "admin.orders.get":
        requireAdmin();
        return await OrderService.getOrder(params.id);

      case "admin.orders.updateStatus": {
        requireAdmin();
        const ord = await OrderService.updateOrderStatus(params.id, params.status, params.note);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "order.update_status",
          entity: "order",
          entityId: params.id,
          diff: { status: params.status, note: params.note },
        });
        return ord;
      }

      case "admin.orders.markBalancePaid": {
        requireAdmin();
        const ord = await OrderService.markBalancePaid(params.orderId);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "order.mark_balance_paid",
          entity: "order",
          entityId: params.orderId,
        });
        return ord;
      }

      // --- Admin Customers & Payments ---
      case "admin.customers.list":
        requireAdmin();
        return await CustomerService.listCustomers(params?.search);

      case "admin.customers.get":
        requireAdmin();
        return await CustomerService.getCustomerDetail(params.id);

      case "admin.payments.list":
        requireAdmin();
        return await PaymentService.listPayments();

      case "admin.payments.summary":
        requireAdmin();
        return await PaymentService.getPaymentsSummary();

      // --- Admin Settings & Options ---
      case "admin.settings.get":
        requireAdmin();
        return await SettingsService.getSettings();

      case "admin.settings.update": {
        requireAdmin();
        const s = await SettingsService.updateSettings(params);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "settings.update",
          entity: "store_settings",
          entityId: "1",
          diff: params,
        });
        return s;
      }

      case "admin.customDesign.update": {
        requireAdmin();
        const opt = await SettingsService.updateCustomDesignOption(params.id, params.data);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "custom_design.update",
          entity: "custom_design_option",
          entityId: params.id,
          diff: params.data,
        });
        return opt;
      }

      case "admin.showcase.create": {
        requireAdmin();
        const sc = await SettingsService.createShowcase(params);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "showcase.create",
          entity: "showcase",
          entityId: sc.id,
        });
        return sc;
      }

      case "admin.showcase.delete": {
        requireAdmin();
        const res = await SettingsService.deleteShowcase(params.id);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "showcase.delete",
          entity: "showcase",
          entityId: params.id,
        });
        return res;
      }

      // --- Storage ---
      case "storage.getPresignedUploadUrl":
        return await StorageService.getPresignedUploadUrl(params);

      case "storage.getPresignedDownloadUrl":
        requireAdmin();
        return await StorageService.getPresignedDownloadUrl(params.key);

      // --- Reports & Backup ---
      case "admin.reports.getDashboardStats":
        requireAdmin();
        return await ReportsService.getDashboardStats(params.period);

      case "admin.reports.getAnalytics":
        requireAdmin();
        return await ReportsService.getAnalytics(params.range, params.family);

      case "admin.reports.exportCsv":
        requireAdmin();
        return await ReportsService.exportCsv(params.entity, params.records);

      case "admin.backup.export":
        requireAdmin();
        return await BackupService.exportBackup();

      case "admin.backup.restore": {
        requireAdmin();
        const res = await BackupService.restoreBackup(params.backup);
        await AuditService.log({
          actorId: ctx.admin?.userId,
          actorEmail: ctx.admin!.email,
          action: "system.restore_backup",
          entity: "backup",
          entityId: "system",
        });
        return res;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}
