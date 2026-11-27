import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Activity, ArrowDown, ArrowDownRight, ArrowUpRight, BarChart3, Box, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, CloudUpload, CreditCard, Download, Eye, FileSpreadsheet, Filter, Gift, LayoutDashboard, LogOut, Menu, Moon, MoreHorizontal, Package, Pencil, Plus, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Sun, Tag, Trash2, TrendingUp, Truck, Users, Wallet, X } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { KEYS, readStored, writeStored } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CategoryRegistryItem, Order, Product, ProductFamily, ShowcaseCustomer } from "@/types";

const groups: Array<{ title: string; entries: ReadonlyArray<readonly [string, string, typeof LayoutDashboard]> }> = [
  { title: "OVERVIEW", entries: [["Overview", "/admin", LayoutDashboard], ["Analytics", "/admin/analytics", BarChart3]] as const },
  // { title: "CATALOG", entries: [["Products", "/admin/products", Package], ["Custom design", "/admin/custom-design", Sparkles], ["Categories", "/admin/categories", Box], ["Discounts", "/admin/discounts", Tag], ["MOQ & quantities", "/admin/moq", SlidersHorizontal], ["Print settings", "/admin/print-settings", Sparkles], ["Coupons", "/admin/coupons", Gift]] as const },
  { title: "CATALOG", entries: [["Products", "/admin/products", Package], ["Custom design", "/admin/custom-design", Sparkles], ["Discounts", "/admin/discounts", Tag], ["MOQ & quantities", "/admin/moq", SlidersHorizontal], ["Print settings", "/admin/print-settings", Sparkles], ["Coupons", "/admin/coupons", Gift]] as const },
  { title: "SALES", entries: [["Orders", "/admin/orders", ShoppingBag], ["Order status", "/admin/order-status", Truck], ["Payments", "/admin/payments", CreditCard]] as const },
  { title: "CUSTOMERS", entries: [["Customers", "/admin/customers", Users], ["Our customers", "/admin/our-customers", Eye]] as const },
  { title: "SETTINGS", entries: [["Review analysis", "/admin/reviews", Eye]] as const },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">(() => readStored(KEYS.theme, "dark"));useEffect(() => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("admin-dark", theme === "dark");
  root.classList.toggle("admin-light", theme === "light");
}, [theme]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const signedIn = readStored<{ email?: string } | null>(KEYS.session, null);
  const logout = () => { localStorage.removeItem(KEYS.session); toast.success("Signed out"); void navigate({ to: "/admin/login" }); };
  const toggleTheme = () => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); writeStored(KEYS.theme, next); };
  const current = groups.flatMap((group) => group.entries).find((item) => item[1] === location.pathname);
  const pageTitle = current?.[0] ?? (location.pathname.includes("/products/new") ? "New product" : location.pathname.includes("/products/") ? "Product details" : location.pathname.includes("/orders/") ? "Order details" : location.pathname.includes("/customers/") ? "Customer details" : "Jersey Fit Admin");
  const navContent = <>
    <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><span className="font-display text-xl">JF</span></div>
      <div className="min-w-0"><p className="font-display text-lg leading-none">JERSEY FIT</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Commerce studio</p></div>
      <span className="ml-auto rounded-full border border-sidebar-border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Admin</span>
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group) => <div className="mb-5" key={group.title}>
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">{group.title}</p>
        <div className="space-y-1">{group.entries.map(([label, href, Icon]) => {
          const active = location.pathname === href || (href !== "/admin" && location.pathname.startsWith(`${href}/`));
          return <Link key={href} to={href} onClick={() => setMobileOpen(false)} className={`group flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-admin-glow" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
            <Icon className="size-[17px] shrink-0" /><span className="truncate">{label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-current" />}
          </Link>;
        })}</div>
      </div>)}
    </div>
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/70 p-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-admin-lime/15 text-admin-lime"><ShieldCheck className="size-4" /></div>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{signedIn?.email ?? "Admin"}</p><p className="text-[10px] text-muted-foreground">Store administrator</p></div>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Sign out" onClick={logout}><LogOut className="size-4" /></Button>
      </div>
    </div>
  </>;
  return <div className={`admin-theme ${theme === "dark" ? "admin-dark" : "admin-light"}`}>
    <div className="admin-frame flex min-h-screen w-full">
      <aside className="admin-sidebar hidden h-screen w-[256px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:flex">{navContent}</aside>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-foreground/35" onClick={() => setMobileOpen(false)} /><aside className="admin-sidebar relative flex h-full w-[min(300px,85vw)] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl">{navContent}</aside></div>}
      <main className="min-w-0 flex-1">
        <header className="admin-topbar sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-border/75 px-4 sm:px-6 lg:px-8">
          <Button variant="outline" size="icon" className="size-9 lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="hidden size-9 lg:inline-flex" aria-label="Toggle compact navigation" onClick={(event) => { const aside = event.currentTarget.closest(".admin-frame")?.querySelector(".admin-sidebar"); aside?.classList.toggle("admin-sidebar-compact"); }}><ChevronLeft className="size-4" /></Button>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span>Jersey Fit</span><ChevronRight className="size-3" /><span className="font-semibold text-foreground">{pageTitle}</span></div>
          <div className="ml-auto" />
          <Button variant="ghost" size="icon" className="size-9" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={toggleTheme}><motion.span key={theme} initial={{ rotate: -70, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}><>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</></motion.span></Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="size-9 rounded-full bg-admin-gradient p-0 text-xs font-bold text-primary-foreground" aria-label="Admin profile">JF</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="admin-dialog"><div className="px-2 py-1.5"><p className="text-xs font-semibold">Store administrator</p><p className="text-xs text-muted-foreground">{signedIn?.email ?? "Admin"}</p></div><DropdownMenuSeparator /><DropdownMenuItem onClick={() => toast.info(signedIn?.email ?? "Admin profile")}>Profile</DropdownMenuItem><DropdownMenuItem onClick={logout}><LogOut className="mr-2 size-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </header>
        <div className="mx-auto w-full max-w-[1480px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>{children}</motion.div>
        </div>
      </main>
    </div>
  </div>;
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-blue">JERSEY FIT / OPERATIONS</p><h1 className="font-display text-3xl tracking-normal sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action && <div className="flex shrink-0 gap-2">{action}</div>}</div>;
}

export function StatCard({ title, value, change, icon: Icon, accent = "blue", foot }: { title: string; value: string; change?: string | undefined; icon: typeof TrendingUp; accent?: "blue" | "orange" | "lime" | "teal"; foot?: string | undefined }) {
  return <Card className="admin-stat overflow-hidden border-border/75 bg-card/85 shadow-admin-card transition-transform duration-200 hover:-translate-y-0.5"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{title}</p><p className="mt-3 font-display text-3xl tracking-normal">{value}</p></div><div className={`flex size-10 items-center justify-center rounded-xl ${accent === "orange" ? "bg-admin-orange/12 text-admin-orange" : accent === "lime" ? "bg-admin-lime/12 text-admin-lime" : accent === "teal" ? "bg-admin-teal/12 text-admin-teal" : "bg-admin-blue/12 text-admin-blue"}`}><Icon className="size-5" /></div></div><div className="mt-4 flex items-center gap-1.5 text-[11px]">{change && <><span className="inline-flex items-center gap-0.5 font-semibold text-admin-lime"><ArrowUpRight className="size-3.5" />{change}</span><span className="text-muted-foreground">vs last month</span></>}{foot && <span className="text-muted-foreground">{foot}</span>}</div></CardContent></Card>;
}

export function FamilyBadge({ family }: { family: ProductFamily }) {
  return <Badge variant="outline" className={family === "customisable" ? "border-admin-blue/30 bg-admin-blue/10 text-admin-blue" : "border-admin-orange/30 bg-admin-orange/10 text-admin-orange"}>{family === "customisable" ? "Customisable" : "Readymade"}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "Delivered" || status === "Collected" || status === "Active" ? "bg-admin-lime/12 text-admin-lime" : status === "Pending" || status === "Placed" ? "bg-admin-orange/12 text-admin-orange" : status === "Cancelled" ? "bg-destructive/10 text-destructive" : "bg-admin-blue/12 text-admin-blue";
  return <Badge variant="outline" className={`border-transparent ${tone}`}>{status}</Badge>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-5 py-12 text-center"><div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-admin-blue/10 text-admin-blue"><Package className="size-5" /></div><h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function DataTable<T>({ columns, rows, allRows = rows, searchText, onRowClick, emptyTitle = "No matching records", emptyDetail = "Try changing the filters or search terms." }: { columns: Array<{ key: string; label: string; render: (row: T) => ReactNode; hide?: boolean; csvValue?: (row: T) => string | number | boolean | undefined }>; rows: T[]; allRows?: T[]; searchText?: string; onRowClick?: (row: T) => void; emptyTitle?: string; emptyDetail?: string }) {
  const [page, setPage] = useState(0);
  const pageSize = 8;
  const shown = useMemo(() => rows.slice(page * pageSize, (page + 1) * pageSize), [page, rows]);
  const exportCsv = (records: T[], scope: "filtered" | "all") => {
    const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [columns.filter((column) => !column.hide).map((column) => csvCell(column.label)).join(","), ...records.map((row) => columns.filter((column) => !column.hide).map((column) => {
      const record = row as Record<string, unknown>;
      const value = column.csvValue?.(row) ?? record[column.key] ?? record[column.label.toLowerCase().replaceAll(" ", "")] ?? "";
      return csvCell(typeof value === "object" ? JSON.stringify(value) : value);
    }).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `jersey-fit-${scope}-export.csv`; anchor.click(); URL.revokeObjectURL(url); toast.success(`${scope === "all" ? "All" : "Filtered"} data exported`);
  };
  useEffect(() => setPage(0), [searchText]);
  return <div className="overflow-hidden rounded-xl border border-border/75 bg-card/75"><div className="flex items-center justify-between border-b border-border/70 px-4 py-3"><p className="text-xs text-muted-foreground">{rows.length} records</p><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><Download className="mr-2 size-3.5" />Download CSV<ChevronDown className="ml-2 size-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="admin-dialog"><DropdownMenuItem onClick={() => exportCsv(rows, "filtered")}>Export filtered view ({rows.length})</DropdownMenuItem><DropdownMenuItem onClick={() => exportCsv(allRows, "all")}>Export all data ({allRows.length})</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>{rows.length === 0 ? <EmptyState title={emptyTitle} detail={emptyDetail} /> : <><Table><TableHeader><TableRow>{columns.filter((column) => !column.hide).map((column) => <TableHead key={column.key} className="whitespace-nowrap text-[11px] uppercase tracking-wider">{column.label}</TableHead>)}</TableRow></TableHeader><TableBody>{shown.map((row, index) => <TableRow key={index} className={onRowClick ? "cursor-pointer" : ""} onClick={(event) => {
  const target = event.target as HTMLElement;

  // Do not navigate when clicking buttons, links,
  // or other interactive elements inside the row.
  if (
    target.closest(
      "button, a, [role='button'], [data-row-action='true']"
    )
  ) {
    return;
  }

  onRowClick?.(row);
}}>{columns.filter((column) => !column.hide).map((column) => <TableCell key={column.key} className="whitespace-nowrap py-3">{column.render(row)}</TableCell>)}</TableRow>)}</TableBody></Table><div className="flex items-center justify-between border-t border-border/70 px-4 py-3"><span className="text-xs text-muted-foreground">Page {page + 1} of {Math.max(1, Math.ceil(rows.length / pageSize))}</span><div className="flex gap-1"><Button variant="outline" size="icon" className="size-8" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon" className="size-8" aria-label="Next page" disabled={(page + 1) * pageSize >= rows.length} onClick={() => setPage((current) => Math.min(Math.max(0, Math.ceil(rows.length / pageSize) - 1), current + 1))}><ChevronRight className="size-4" /></Button></div></div></>}</div>;
}

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@jerseyfit.in");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Connect to backend auth.login
      const { callBackendApi } = await import("@/lib/api-client");
      const res = await callBackendApi<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
        "auth.login",
        { email, password }
      );
      writeStored(KEYS.session, {
        email: res.user.email,
        name: res.user.name,
        role: res.user.role,
        token: res.token,
        signedInAt: new Date().toISOString(),
      });
      toast.success("Welcome to Jersey Fit Admin");
      window.location.href = "/admin";
    } catch (err: any) {
      // Fallback for local demo mode if backend is unreachable
      if (email.trim().toLowerCase() === "admin@jerseyfit.in" && password === "admin123") {
        writeStored(KEYS.session, { email, signedInAt: new Date().toISOString() });
        toast.success("Welcome to Jersey Fit Admin (Offline)");
        window.location.href = "/admin";
      } else {
        setError(err.message || "Email or password is incorrect.");
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="admin-theme admin-dark min-h-screen"><div className="admin-login-bg flex min-h-screen items-center justify-center px-5 py-12"><div className="grid w-full max-w-[930px] overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-2xl backdrop-blur md:grid-cols-[1.05fr_0.95fr]"><div className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-admin-login-panel p-10 md:flex"><div className="relative z-10"><div className="flex size-12 items-center justify-center rounded-xl bg-admin-gradient font-display text-xl text-primary-foreground">JF</div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-admin-lime">JERSEY FIT / CONTROL ROOM</p><h1 className="mt-4 max-w-sm font-display text-5xl leading-[1.03]">YOUR STORE.<br />YOUR PLAYBOOK.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">One clear view of your catalog, orders and the people wearing your team colors.</p></div><div className="relative z-10 flex items-center gap-3 border-t border-border/50 pt-5 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-admin-lime" /> Private demo workspace <span className="ml-auto">INDIA · ₹ INR</span></div></div><form onSubmit={submit} className="flex flex-col justify-center p-7 sm:p-10"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-admin-blue">WELCOME BACK</p><h2 className="mt-2 font-display text-3xl">Admin sign in</h2><p className="mt-2 text-sm text-muted-foreground">Sign in to manage your Jersey Fit store.</p><label className="mt-8 text-xs font-semibold" htmlFor="admin-email">Email address</label><Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11" autoComplete="username" required /><label className="mt-5 text-xs font-semibold" htmlFor="admin-password">Password</label><Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11" autoComplete="current-password" required />{error && <p className="mt-3 text-xs text-destructive" role="alert">{error}</p>}<Button type="submit" className="mt-6 h-11 w-full bg-admin-gradient text-primary-foreground hover:opacity-90">Sign in <ChevronRight className="size-4" /></Button><div className="mt-6 rounded-lg border border-border/70 bg-muted/40 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Demo access</p><p className="mt-1 text-xs"><span className="text-muted-foreground">Email</span><span className="float-right font-medium">admin@jerseyfit.in</span></p><p className="mt-1 text-xs"><span className="text-muted-foreground">Password</span><span className="float-right font-medium">admin123</span></p></div></form></div></div></div>;
}

export function ProductEditor({ product, initialDraft, onSave, onClose }: { product?: Product | undefined; initialDraft?: Product | undefined; onSave: (product: Product) => void; onClose: () => void }) {
  const { categories } = useAdmin();
  const [draft, setDraft] = useState<Product>(() => product ?? initialDraft ?? { id: `product-${Date.now()}`, code: "", name: "", family: "customisable", section: "Custom Team Jersey", category: "custom-team-jersey", subCategory: "all-over-print", price: 699, mrp: 999, material: "Dry-fit polyester", description: "", overview: "", washCare: "", designGuidelines: "", images: [], rating: 0, isExclusiveTopWear: false, active: true });
  const selected = categories.find((category) => category.slug === draft.category);
  const availableSubs = selected?.subcategories ?? [];
  const readymade = draft.family === "readymade";
  const update = (field: keyof Product, value: string | number | boolean | string[]) => setDraft((current) => ({ ...current, [field]: value }));
  const changeCategory = (category: CategoryRegistryItem) => setDraft((current) => {
    const { subCategory: _oldSubCategory, ...rest } = current;
    return { ...rest, category: category.slug, family: category.family, section: category.section, isExclusiveTopWear: category.family === "readymade", ...(category.subcategories[0] ? { subCategory: category.subcategories[0].slug } : {}) };
  });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!draft.name.trim() || draft.mrp < draft.price || !selected || (availableSubs.length > 0 && !draft.subCategory)) { toast.error("Check the required fields and pricing."); return; } onSave(draft); onClose(); };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="admin-dialog max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{product ? "Edit product" : "Add a product"}</DialogTitle><DialogDescription>Product details and storefront pricing.</DialogDescription></DialogHeader><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
    <Field label="Product name" required><Input value={draft.name} onChange={(event) => update("name", event.target.value)} required placeholder="e.g. Aero Match Jersey" /></Field><Field label="Product code"><Input value={draft.code} onChange={(event) => update("code", event.target.value.toUpperCase())} required /></Field>
    <Field label="Category" required><Select value={draft.category} onValueChange={(slug) => { const category = categories.find((item) => item.slug === slug); if (category) changeCategory(category); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.slug} value={category.slug}>{category.label} · {category.family === "readymade" ? "Ready" : "Custom"}</SelectItem>)}</SelectContent></Select></Field>
    {availableSubs.length > 0 && <Field label="Subcategory" required><Select value={draft.subCategory ?? ""} onValueChange={(value) => update("subCategory", value)}><SelectTrigger><SelectValue placeholder="Select a subcategory" /></SelectTrigger><SelectContent>{availableSubs.map((item) => <SelectItem value={item.slug} key={item.slug}>{item.label}</SelectItem>)}</SelectContent></Select></Field>}
    <Field label="Price (₹)" required><Input type="number" min="0" value={draft.price} onChange={(event) => update("price", Number(event.target.value))} required /></Field><Field label="MRP (₹) · must be ≥ price" required><Input type="number" min={draft.price} value={draft.mrp} onChange={(event) => update("mrp", Number(event.target.value))} required /></Field>
    <Field label="Material"><Input value={draft.material} onChange={(event) => update("material", event.target.value)} /></Field>
    <Field label="Tag / badge"><Input value={draft.tag ?? ""} onChange={(event) => update("tag", event.target.value)} placeholder="Bestseller" /></Field><Field label="Section"><Input value={draft.section} readOnly /></Field>
    <Field label="Product description" wide><textarea value={draft.description} onChange={(event) => update("description", event.target.value)} className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></Field>
    <Field label="Product overview · key features and fabric specifications" wide><textarea value={draft.overview} onChange={(event) => update("overview", event.target.value)} className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></Field>
    <Field label="Wash care" wide><textarea value={draft.washCare} onChange={(event) => update("washCare", event.target.value)} className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></Field>
    {!readymade && <Field label="Design guidelines · resolution and print-safe zones" wide><textarea value={draft.designGuidelines} onChange={(event) => update("designGuidelines", event.target.value)} className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></Field>}
    <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border/70 p-3"><div><p className="text-xs font-semibold">Product visibility</p><p className="text-xs text-muted-foreground">Inactive products remain in admin but are hidden from storefront use.</p></div><Switch checked={draft.active} onCheckedChange={(active) => update("active", active)} aria-label="Product active status" /></div>
    <Field label="Product images · up to 4" wide><ImageUpload value={draft.images} onChange={(images) => update("images", images)} multiple /></Field>
    <div className="sm:col-span-2">{readymade ? <div className="rounded-xl border border-admin-orange/20 bg-admin-orange/5 p-4 text-sm"><div className="flex items-center gap-2 font-semibold text-admin-orange"><Truck className="size-4" />Readymade rules</div><p className="mt-2 text-muted-foreground">MOQ 1 · maximum 3 pieces · no customisation · full payment only.</p></div> : <div className="rounded-xl border border-admin-blue/20 bg-admin-blue/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-admin-blue"><Sparkles className="size-4" />Effective custom rules</div><p className="mt-2 text-xs text-muted-foreground">MOQ 5 · volume price discounts · Sublimation / DTF / No Print · add-ons ₹40 / ₹30 / ₹30 per piece.</p><div className="mt-4 rounded-lg border border-border/70 bg-card p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Live product preview</p><p className="mt-2 font-semibold">{draft.name || "Your new jersey"}</p><p className="text-sm text-muted-foreground">₹{draft.price.toLocaleString("en-IN")} <span className="ml-2 line-through">₹{draft.mrp.toLocaleString("en-IN")}</span></p></div></div>}</div>
    <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" className="bg-admin-blue text-primary-foreground hover:opacity-90">Save product</Button></DialogFooter></form></DialogContent></Dialog>;
}

function Field({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: ReactNode }) { return <label className={`block space-y-1.5 text-xs font-medium ${wide ? "sm:col-span-2" : ""}`}>{label}{required && <span className="text-destructive"> *</span>}{children}</label>; }

export function ImageUpload({ value, onChange, multiple = false }: { value: string[]; onChange: (images: string[]) => void; multiple?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const accepted: string[] = [];
    setUploading(true);
    try {
      const fileList = Array.from(files).slice(0, multiple ? 4 - value.length : 1);
      for (const file of fileList) {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is over 5 MB`); continue; }
        
        // Try uploading to S3 via backend presigned URL
        try {
          const { callBackendApi } = await import("@/lib/api-client");
          const presigned = await callBackendApi<{ uploadUrl: string; fileUrl: string; key: string }>(
            "storage.getPresignedUploadUrl",
            {
              filename: file.name,
              contentType: file.type || "image/jpeg",
              folder: "products",
              isPublic: true,
            }
          );

          if (presigned?.uploadUrl) {
            const putRes = await fetch(presigned.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type || "image/jpeg" },
              body: file,
            });
            if (putRes.ok) {
              accepted.push(presigned.fileUrl);
              continue;
            }
          }
        } catch {
          // Fall back to compressed local data URL if S3 is unavailable or offline
        }

        const image = await compressImage(file);
        if (image) accepted.push(image);
      }
    } finally {
      setUploading(false);
    }
    onChange(multiple ? [...value, ...accepted].slice(0, 4) : accepted);
  };
  return <div><label className={`flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center transition-colors hover:border-admin-blue/50 ${uploading ? "opacity-50 pointer-events-none" : ""}`}><CloudUpload className="mb-2 size-5 text-admin-blue" /><span className="text-xs text-muted-foreground">{uploading ? "Uploading media..." : "Drop an image or browse · max 5 MB each"}</span><input aria-label="Upload product image" className="sr-only" type="file" accept="image/*" multiple={multiple} disabled={uploading} onChange={(event) => { void addFiles(event.target.files); event.currentTarget.value = ""; }} /></label>{value.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{value.map((src, index) => <div key={`${src.slice(0, 20)}-${index}`} className="relative size-16 overflow-hidden rounded-lg border border-border"><img src={src} className="size-full object-cover" alt={`Uploaded image ${index + 1}`} /><button type="button" aria-label="Remove image" className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5" onClick={() => onChange(value.filter((_, i) => i !== index))}><X className="size-3" /></button></div>)}</div>}</div>;
}

async function compressImage(file: File): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return null; }
  const source = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("Image could not be read")); img.src = URL.createObjectURL(file); });
  const scale = Math.min(1, 900 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(source.width * scale)); canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d"); if (!context) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/jpeg", 0.8);
}

export function ShowcaseEditor({ onSave, onClose }: { onSave: (entry: ShowcaseCustomer) => void; onClose: () => void }) {
  const { categories, products } = useAdmin();
  const [category, setCategory] = useState(""); const [subCategory, setSubCategory] = useState(""); const [image, setImage] = useState("");
  const [name, setName] = useState(""); const [location, setLocation] = useState(""); const [description, setDescription] = useState(""); const [productId, setProductId] = useState("");
  const subs = categories.find((item) => item.slug === category)?.subcategories ?? [];
  const choices = products.filter((product) => (!category || product.category === category) && (!subCategory || product.subCategory === subCategory));
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="admin-dialog max-w-xl"><DialogHeader><DialogTitle>Showcase a customer</DialogTitle><DialogDescription>Share a Jersey Fit moment with the community.</DialogDescription></DialogHeader><form onSubmit={(event) => { event.preventDefault(); if (!image || !name.trim() || !location.trim() || !description.trim()) { toast.error("Image, client, location and description are required."); return; } onSave({ id: `showcase-${Date.now()}`, image, name, location, description, ...(category ? { category } : {}), ...(subCategory ? { subCategory } : {}), ...(productId ? { productId } : {}) }); }} className="space-y-4"><Field label="Customer image" required><ImageUpload value={image ? [image] : []} onChange={(items) => setImage(items[0] ?? "")} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Client name" required><Input value={name} onChange={(event) => setName(event.target.value)} required /></Field><Field label="Location" required><Input value={location} onChange={(event) => setLocation(event.target.value)} required placeholder="City, India" /></Field></div><Field label="Description" required><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required /></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Category (optional)"><Select value={category || "none"} onValueChange={(value) => { setCategory(value === "none" ? "" : value); setSubCategory(""); setProductId(""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No category</SelectItem>{categories.map((item) => <SelectItem value={item.slug} key={item.slug}>{item.label}</SelectItem>)}</SelectContent></Select></Field><Field label="Subcategory"><Select value={subCategory || "none"} onValueChange={(value) => { setSubCategory(value === "none" ? "" : value); setProductId(""); }} disabled={!category}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No subcategory</SelectItem>{subs.map((item) => <SelectItem value={item.slug} key={item.slug}>{item.label}</SelectItem>)}</SelectContent></Select></Field><Field label="Product"><Select value={productId || "none"} onValueChange={(value) => setProductId(value === "none" ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No product</SelectItem>{choices.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field></div><DialogFooter><Button variant="outline" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Add showcase entry</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function DeleteDialog({
  title,
  onConfirm,
  children,
}: {
  title: string;
  onConfirm: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="admin-dialog max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>

          <DialogDescription>
            This cannot be undone. Demo records linked to this entry may remain
            in history.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
            }}
            asChild
          >
            <DialogClose>Cancel</DialogClose>
          </Button>

          <DialogClose asChild>
            <Button
              type="button"
              variant="destructive"
              onClick={(event) => {
                event.stopPropagation();
                onConfirm();
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function formatMoney(value: number): string { return `₹${Math.round(value).toLocaleString("en-IN")}`; }
export function SectionTabs({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) { return <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-1">{options.map((option) => <Button key={option} size="sm" variant={value === option ? "secondary" : "ghost"} className="h-8 shrink-0 text-xs" onClick={() => onChange(option)}>{option}</Button>)}</div>; }
