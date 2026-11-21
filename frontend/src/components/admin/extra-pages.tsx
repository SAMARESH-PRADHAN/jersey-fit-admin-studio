import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/store/admin";
import { formatMoney, PageHeader } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CustomDesignOption } from "@/types";

export function CustomDesignPage() {
  const { customDesignOptions, setCustomDesignOptions } = useAdmin();
  const [draft, setDraft] = useState(customDesignOptions);
  const update = (id: string, changes: Partial<CustomDesignOption>) => setDraft((current) => current.map((option) => option.id === id ? { ...option, ...changes } : option));
  return <>
    <PageHeader title="Custom Your Design" description="Manage the three print options on their dedicated storefront page." action={<Button onClick={() => { setCustomDesignOptions(draft); toast.success("Custom design options saved"); }}>Save changes</Button>} />
    <div className="grid gap-4 lg:grid-cols-3">{draft.map((option) => <Card key={option.id} className="admin-panel"><CardContent className="space-y-4 p-5"><div><p className="text-xs font-semibold text-admin-blue">PRINT OPTION</p><h2 className="mt-1 text-lg font-semibold">{option.name}</h2></div><label className="block space-y-1 text-xs">Price (₹)<Input type="number" min="0" value={option.price} onChange={(event) => update(option.id, { price: Number(event.target.value) })} /></label><label className="block space-y-1 text-xs">Description<textarea value={option.description} onChange={(event) => update(option.id, { description: event.target.value })} className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label><p className="text-xs text-muted-foreground">Current price: {formatMoney(option.price)}</p></CardContent></Card>)}</div>
  </>;
}

export function ReviewAnalysisPage() {
  const { reviews } = useAdmin();
  const [search, setSearch] = useState("");
  const filtered = reviews.filter((review) => `${review.productName} ${review.customerName} ${review.text}`.toLowerCase().includes(search.toLowerCase()));
  const counts = ["Positive", "Neutral", "Needs attention"] as const;
  return <>
    <PageHeader title="Review analysis" description="Review customer feedback, ratings, and sentiment across the catalog." />
    <div className="mb-4 grid gap-3 sm:grid-cols-3">{counts.map((status) => <Card className="admin-panel" key={status}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{status}</p><p className="mt-1 font-display text-3xl">{reviews.filter((review) => review.status === status).length}</p></CardContent></Card>)}</div>
    <div className="mb-4 max-w-sm"><Input aria-label="Search reviews" placeholder="Search product, customer or review" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    <div className="space-y-3">{filtered.map((review) => <Card key={review.id} className="admin-panel"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{review.productName}</h2><span className="text-admin-orange">{"★".repeat(review.rating)}<span className="text-muted-foreground">{"★".repeat(5 - review.rating)}</span></span></div><p className="mt-1 text-xs text-muted-foreground">{review.customerName} · {new Date(review.date).toLocaleDateString("en-IN")}</p><p className="mt-3 text-sm">{review.text}</p></div><span className="w-fit rounded-full border border-border px-2.5 py-1 text-xs">{review.status}</span></CardContent></Card>)}{filtered.length === 0 && <Card className="admin-panel"><CardContent className="p-8 text-center text-sm text-muted-foreground">No reviews match your search.</CardContent></Card>}</div>
  </>;
}