"use client";

import { useState, useEffect } from "react";
import { ClientHeader } from "@/components/client/client-header";
import { ProductCard } from "@/components/client/product-card";
import { Input } from "@/components/ui/input";
import { Search, Star, Tag, Sparkles } from "lucide-react";
import { PromotionBanner } from "@/components/promotion-banner";

interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  categoryId: string;
  unit: string;
  stock: number;
  featured: boolean;
  category?: Category;
}

interface PromotionCard {
  id: string;
  title: string;
  description?: string;
  discountPrice?: number;
  backgroundImage?: string;
  productImage?: string;
  config: any;
  productId?: string;
}

export default function PromotionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [promotionProducts, setPromotionProducts] = useState<Product[]>([]);
  const [promotionBanners, setPromotionBanners] = useState<PromotionCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, bannersRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/promotion-banners")
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setFeaturedProducts(data.featuredProducts);
          setPromotionProducts(data.promotionProducts);
        }
        
        if (bannersRes.ok) {
          const banners = await bannersRes.json();
          setPromotionBanners(banners);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader showBack />
      <main className="space-y-8">
        <div className="sticky top-0 z-10 bg-background px-4 py-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar promoções..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Promotion Banners Section */}
        {promotionBanners.length > 0 && (
          <div className="px-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-bold">Ofertas Especiais</h2>
            </div>
            <div className="space-y-6">
              {promotionBanners.map((banner) => (
                <PromotionBanner key={banner.id} data={banner} />
              ))}
            </div>
          </div>
        )}

        {/* Featured Products Section */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Produtos em Destaque</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p>Carregando...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum produto em destaque</p>
            </div>
          )}
        </div>

        {/* Promotion Products Section */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-bold">Mais Ofertas</h2>
          </div>
          
          {loading ? (
             <div className="flex items-center justify-center h-32">
              <p>Carregando...</p>
            </div>
          ) : promotionProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {promotionProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma oferta adicional</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
