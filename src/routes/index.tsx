import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChevronRight, CircleCheck, Shirt, Sparkles, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCategories } from "@/lib/catalog";
import { KEYS, readStored } from "@/lib/storage";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "@/data/products";
import type { CategoryRegistryItem, Product } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jersey Fit | Custom Team Jerseys & Sportswear" },
      { name: "description", content: "Design custom team jerseys or shop ready-to-wear sportswear from Jersey Fit." },
      { property: "og:title", content: "Jersey Fit | Custom Team Jerseys & Sportswear" },
      { property: "og:description", content: "Custom printed jerseys and ready-made sportswear for every team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  component: StorefrontHome,
});

function StorefrontHome() {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<CategoryRegistryItem[]>(SEED_CATEGORIES);
  useEffect(() => {
    setProducts(readStored(KEYS.products, SEED_PRODUCTS));
    setCategories(getCategories());
    const sync = () => { setProducts(readStored(KEYS.products, SEED_PRODUCTS)); setCategories(getCategories()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const featured = products.slice(0, 6);
  return <main className="storefront-page">
    <section className="storefront-hero">
      <div className="storefront-hero-copy"><Badge variant="outline" className="storefront-eyebrow"><Sparkles className="size-3.5" />YOUR TEAM. YOUR COLORS.</Badge><h1>MADE TO<br /><span>MOVE AS ONE.</span></h1><p>Custom team jerseys and everyday sportswear, designed around the way your team plays.</p><div className="storefront-actions"><Button size="lg" className="storefront-cta" onClick={() => document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" })}>Explore the collection <ArrowRight className="size-4" /></Button><a href="#featured">Shop bestsellers <ArrowUpRight className="size-4" /></a></div><div className="storefront-proof"><span><CircleCheck />Made for your team</span><span><Truck />Pan-India delivery</span><span><Star />Built to perform</span></div></div>
      <div className="storefront-jersey-art" aria-label="Jersey Fit custom sports jersey display"><div className="jersey-orbit jersey-orbit-one" /><div className="jersey-orbit jersey-orbit-two" /><div className="jersey-number">07</div><div className="jersey-label">JF / MATCH KIT</div><div className="jersey-collar" /><div className="jersey-sleeve left" /><div className="jersey-sleeve right" /><div className="jersey-crest">JF</div><span className="jersey-caption">TEAM ISSUE · 2026</span></div>
    </section>
    <section className="storefront-collection" id="collections"><div className="storefront-section-heading"><div><p>FIND YOUR FIT</p><h2>SHOP BY COLLECTION</h2></div><a href="#featured">All collections <ChevronRight className="size-4" /></a></div><div className="collection-strip">{categories.filter((category) => !category.slug.startsWith("custom-") || category.slug === "custom-premium").slice(0, 6).map((category, index) => <a className={`collection-tile tile-${index % 4}`} href="#featured" key={category.slug}><span className="collection-number">0{index + 1}</span><span className="collection-icon"><Shirt /></span><h3>{category.label}</h3><p>{category.family === "readymade" ? "Ready to wear" : "Made for your team"}</p><ArrowUpRight className="collection-arrow" /></a>)}</div></section>
    <section className="storefront-featured" id="featured"><div className="storefront-section-heading"><div><p>BUILT FOR THE MOMENT</p><h2>TOP PICKS FOR YOUR SQUAD</h2></div><Button variant="outline" className="storefront-outline">Browse all <ArrowRight className="size-4" /></Button></div><div className="featured-grid">{featured.map((product, index) => <article className="featured-product" key={product.id}><div className={`product-art product-art-${index % 4}`}>{product.images[0] ? <img src={product.images[0]} alt={product.name} /> : <><span className="product-art-mark">{product.family === "customisable" ? "CUSTOM" : "JF / SPORT"}</span><div className="product-jersey-number">{String(index + 7).padStart(2, "0")}</div><span className="product-art-line" /></>}<Badge className="product-family">{product.family === "customisable" ? "CUSTOM KIT" : "READY TO WEAR"}</Badge><button aria-label={`View ${product.name}`} className="product-arrow"><ArrowUpRight className="size-4" /></button></div><div className="mt-3 flex items-start justify-between gap-3"><div><h3>{product.name}</h3><p>{product.section}</p></div><span className="product-rating"><Star className="size-3" fill="currentColor" /> {product.rating.toFixed(1)}</span></div><div className="mt-2 flex items-center gap-2"><span className="product-price">₹{product.price}</span><span className="product-mrp">₹{product.mrp}</span></div></article>)}</div></section>
    <section className="storefront-bottom-band"><div><p>BUILT AROUND YOUR GAME</p><h2>THE WHOLE TEAM.<br />ONE KIT.</h2></div><Button className="storefront-cta" onClick={() => window.location.href = "/admin/login"}>Open store admin demo <ArrowRight className="size-4" /></Button></section>
  </main>;
}
