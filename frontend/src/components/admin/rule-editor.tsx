import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FamilyBadge, PageHeader } from "@/components/admin/shared";
import type { DiscountTier, PricingConfig, ProductFamily, RuleOverrides } from "@/types";
import { callBackendApi } from "@/lib/api-client";

type RuleKind = "discounts" | "moq" | "print-settings";
type Target = { category: string; subcategory?: string };
const KIND_KEYS: Record<RuleKind, Array<keyof RuleOverrides>> = {
  discounts: ["discountTiers"],
  moq: ["moq", "maxQty"],
  "print-settings": ["printTypes", "printChargesByType", "printDescriptionsByType"],
};

const defaultPrintCharges = { logo: 40, name: 30, number: 30 };
const defaultDescriptions = {
  logo: "Logo print per piece",
  name: "Name print per piece",
  number: "Number print per piece",
};

export function RuleEditor({ kind }: { kind: RuleKind }) {
  const { categories, settings, setSettings } = useAdmin();
  const [target, setTarget] = useState<Target>(() => ({
    category: categories[0]?.slug ?? "custom-team-jersey",
  }));
  const selectedCategory =
    categories.find((category) => category.slug === target.category) ?? categories[0];
  const family: ProductFamily = selectedCategory?.family ?? "customisable";
  const overrideKey = target.subcategory
    ? `${target.category}:${target.subcategory}`
    : target.category;
  const customDisabled = family === "readymade" && kind !== "moq";
  const title =
    kind === "print-settings"
      ? "Print settings"
      : kind === "moq"
        ? "MOQ & quantities"
        : "Volume discounts";
  const inherited: RuleOverrides = useMemo(() => {
    const global = settings.globalRules[family];
    const category = settings.categoryRules[target.category];
    const subcategory = target.subcategory ? settings.subcategoryRules[overrideKey] : undefined;
    return { ...global, ...category, ...subcategory };
  }, [family, overrideKey, settings, target.category, target.subcategory]);
  const [draft, setDraft] = useState<RuleOverrides>(inherited);

  useEffect(() => setDraft(inherited), [inherited]);

  const patch = <K extends keyof RuleOverrides>(key: K, value: RuleOverrides[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  // const save = () => {
  //   const changed = Object.fromEntries(
  //     KIND_KEYS[kind].filter((key) => draft[key] !== undefined).map((key) => [key, draft[key]]),
  //   ) as RuleOverrides;
  //   const next = {
  //     ...settings,
  //     categoryRules: { ...settings.categoryRules },
  //     subcategoryRules: { ...settings.subcategoryRules },
  //   };
  //   if (target.subcategory)
  //     next.subcategoryRules[overrideKey] = { ...next.subcategoryRules[overrideKey], ...changed };
  //   else
  //     next.categoryRules[target.category] = { ...next.categoryRules[target.category], ...changed };
  //   setSettings(next);
  //   toast.success(`${title} saved`);
  // };
    const save = async () => {
    const changed = Object.fromEntries(
      KIND_KEYS[kind].filter((key) => draft[key] !== undefined).map((key) => [key, draft[key]]),
    ) as RuleOverrides;

    try {
      await callBackendApi("admin.rules.save", {
        scope: target.subcategory ? "subcategory" : "category",
        family,
        categorySlug: target.category,
        ...(target.subcategory ? { subcategorySlug: target.subcategory } : {}),
        kind,
        values: changed,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save to server");
      return;
    }

    const next = { ...settings, categoryRules: { ...settings.categoryRules }, subcategoryRules: { ...settings.subcategoryRules } };
    if (target.subcategory) next.subcategoryRules[overrideKey] = { ...next.subcategoryRules[overrideKey], ...changed };
    else next.categoryRules[target.category] = { ...next.categoryRules[target.category], ...changed };
    setSettings(next);
    toast.success(`${title} saved`);
  };
  // const reset = () => {
  //   const strip = (rules: RuleOverrides | undefined): RuleOverrides => {
  //     const copy: RuleOverrides = { ...rules };
  //     for (const key of KIND_KEYS[kind]) delete copy[key];
  //     return copy;
  //   };
  //   const next = {
  //     ...settings,
  //     categoryRules: { ...settings.categoryRules },
  //     subcategoryRules: { ...settings.subcategoryRules },
  //   };
  //   if (target.subcategory)
  //     next.subcategoryRules[overrideKey] = strip(next.subcategoryRules[overrideKey]);
  //   else next.categoryRules[target.category] = strip(next.categoryRules[target.category]);
  //   setSettings(next);
  //   toast.success("Reset to inherited settings");
  // };
    const reset = async () => {
    try {
      await callBackendApi("admin.rules.reset", {
        scope: target.subcategory ? "subcategory" : "category",
        family,
        categorySlug: target.category,
        ...(target.subcategory ? { subcategorySlug: target.subcategory } : {}),
        kind,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reset on server");
      return;
    }
    const strip = (rules: RuleOverrides | undefined): RuleOverrides => {
      const copy: RuleOverrides = { ...rules };
      for (const key of KIND_KEYS[kind]) delete copy[key];
      return copy;
    };
    const next = { ...settings, categoryRules: { ...settings.categoryRules }, subcategoryRules: { ...settings.subcategoryRules } };
    if (target.subcategory) next.subcategoryRules[overrideKey] = strip(next.subcategoryRules[overrideKey]);
    else next.categoryRules[target.category] = strip(next.categoryRules[target.category]);
    setSettings(next);
    toast.success("Reset to inherited settings");
  };

  const tiers = draft.discountTiers ?? inherited.discountTiers ?? [];
  const printTypes = (draft.printTypes ?? inherited.printTypes ?? []).filter(
    (type) => type !== "No Print",
  );
  const chargesByType = draft.printChargesByType ??
    inherited.printChargesByType ?? {
      "Sublimation Print": defaultPrintCharges,
      "DTF Print": defaultPrintCharges,
    };
  const descriptionsByType = draft.printDescriptionsByType ??
    inherited.printDescriptionsByType ?? {
      "Sublimation Print": defaultDescriptions,
      "DTF Print": defaultDescriptions,
    };

  return (
    <>
      <PageHeader
        title={title}
        description="Choose a category or subcategory, adjust its values, then save your changes."
      />
      <div className="grid gap-4 lg:grid-cols-[270px_1fr]">
        <Card className="admin-panel h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Category tree</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((category) => (
              <div key={category.slug}>
                <button
                  type="button"
                  onClick={() => setTarget({ category: category.slug })}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${target.category === category.slug && !target.subcategory ? "bg-admin-blue/10 text-admin-blue" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <span className="truncate">{category.label}</span>
                  <FamilyBadge family={category.family} />
                </button>
                {category.subcategories.map((sub) => (
                  <button
                    type="button"
                    key={sub.slug}
                    onClick={() => setTarget({ category: category.slug, subcategory: sub.slug })}
                    className={`ml-3 mt-1 flex w-[calc(100%-0.75rem)] items-center rounded-lg px-3 py-2 text-left text-xs ${target.category === category.slug && target.subcategory === sub.slug ? "bg-admin-blue/10 text-admin-blue" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <span className="truncate">↳ {sub.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="admin-panel">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  {target.subcategory
                    ? selectedCategory?.subcategories.find(
                        (item) => item.slug === target.subcategory,
                      )?.label
                    : selectedCategory?.label}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {target.subcategory
                    ? `Overrides category: ${selectedCategory?.label}`
                    : "Category values override family defaults"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void reset()}><RotateCcw className="size-4" />Reset to inherited</Button><Button onClick={() => void save()}>Save changes</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {customDisabled ? (
              <div className="rounded-lg border border-admin-orange/20 bg-admin-orange/5 p-4 text-sm text-admin-orange">
                Readymade products have no discounts or print customisation.
              </div>
            ) : kind === "discounts" ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Discounts apply to product price only, never print charges.
                </p>
                {tiers.map((tier, index) => (
                  <div
                    key={`tier-${index}`}
                    className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  >
                    <label className="space-y-1 text-xs">
                      Minimum pieces
                      <Input
                        type="number"
                        min="1"
                        value={tier.min}
                        onChange={(event) => {
                          const next = [...tiers];
                          next[index] = { ...tier, min: Number(event.target.value) };
                          patch("discountTiers", next);
                        }}
                      />
                    </label>
                    <label className="space-y-1 text-xs">
                      Maximum pieces
                      <Input
                        type="number"
                        min={tier.min}
                        placeholder="No limit"
                        value={tier.max ?? ""}
                        onChange={(event) => {
                          const next = [...tiers];
                          next[index] = {
                            ...tier,
                            max: event.target.value ? Number(event.target.value) : null,
                          };
                          patch("discountTiers", next);
                        }}
                      />
                    </label>
                    <label className="space-y-1 text-xs">
                      Discount %
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={tier.pct}
                        onChange={(event) => {
                          const next = [...tiers];
                          next[index] = { ...tier, pct: Number(event.target.value) };
                          patch("discountTiers", next);
                        }}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="self-end text-destructive"
                      aria-label={`Remove tier ${index + 1}`}
                      onClick={() =>
                        patch(
                          "discountTiers",
                          tiers.filter((_, tierIndex) => tierIndex !== index),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const last: DiscountTier | undefined = tiers.at(-1);
                    patch("discountTiers", [
                      ...tiers,
                      { min: last?.max ? last.max + 1 : (last?.min ?? 0) + 1, max: null, pct: 0 },
                    ]);
                  }}
                >
                  <Plus className="size-4" />
                  Add more tier
                </Button>
                <div className="rounded-lg bg-muted/50 p-3 text-xs">
                  Example: 25 pieces at ₹699 with a 20% tier = <strong>₹13,980</strong> before
                  printing, add-ons, and GST.
                </div>
              </>
            ) : kind === "moq" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-xs">
                  Minimum quantity
                  <Input
                    type="number"
                    min="1"
                    value={draft.moq ?? (family === "customisable" ? 5 : 1)}
                    onChange={(event) => patch("moq", Number(event.target.value))}
                  />
                </label>
                {family === "readymade" && (
                  <label className="space-y-1 text-xs">
                    Maximum pieces per order
                    <Input
                      type="number"
                      min={draft.moq ?? 1}
                      value={draft.maxQty ?? 3}
                      onChange={(event) => patch("maxQty", Number(event.target.value))}
                    />
                  </label>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["Sublimation Print", "DTF Print"] as const).map((printType) => (
                    <label
                      key={printType}
                      className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-xs"
                    >
                      {printType}
                      <Switch
                        checked={printTypes.includes(printType)}
                        onCheckedChange={(checked) =>
                          patch(
                            "printTypes",
                            checked
                              ? [...printTypes, printType]
                              : printTypes.filter((type) => type !== printType),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
                {(["Sublimation Print", "DTF Print"] as const).map((printType) => (
                  <section
                    key={printType}
                    className="space-y-3 rounded-lg border border-border/70 p-4"
                  >
                    <h3 className="text-sm font-semibold">{printType} add-ons</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      {(["logo", "name", "number"] as const).map((addon) => (
                        <div key={addon} className="space-y-2">
                          <label className="space-y-1 text-xs">
                            {addon[0]?.toUpperCase()}
                            {addon.slice(1)} · price per piece (₹)
                            <Input
                              type="number"
                              min="0"
                              value={
                                chargesByType[printType]?.[addon] ?? defaultPrintCharges[addon]
                              }
                              onChange={(event) =>
                                patch("printChargesByType", {
                                  ...chargesByType,
                                  [printType]: {
                                    ...(chargesByType[printType] ?? defaultPrintCharges),
                                    [addon]: Number(event.target.value),
                                  },
                                })
                              }
                            />
                          </label>
                          <label className="space-y-1 text-xs">
                            Description
                            <Input
                              value={descriptionsByType[printType]?.[addon] ?? ""}
                              onChange={(event) =>
                                patch("printDescriptionsByType", {
                                  ...descriptionsByType,
                                  [printType]: {
                                    ...(descriptionsByType[printType] ?? defaultDescriptions),
                                    [addon]: event.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function resolveRuleOverride(
  settings: ReturnType<typeof useAdmin>["settings"],
  target: Target,
  family: ProductFamily,
): RuleOverrides {
  const subKey = target.subcategory ? `${target.category}:${target.subcategory}` : "";
  return {
    ...settings.globalRules[family],
    ...settings.categoryRules[target.category],
    ...(target.subcategory ? settings.subcategoryRules[subKey] : {}),
  };
}
