"use client";

import { useState, useEffect } from "react";
import { ClientHeader } from "@/components/client/client-header";
import { BottomNav } from "@/components/client/bottom-nav";
import { LoginModal } from "@/components/client/login-modal";
import { CategoryGrid } from "@/components/client/category-grid";
import { PromoBanner } from "@/components/client/promo-banner";
import { PromotionCarousel } from "@/components/client/promotion-carousel";
import { FeaturedProducts } from "@/components/client/featured-products";
import { useAuthStore } from "@/lib/store";

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

interface Market {
  id: string;
  name: string;
  address: string;
  phone: string;
  openingHours: string;
  deliveryFee: number;
  minOrderValue: number;
  estimatedDeliveryTime: string;
  rating: number;
  logo: string;
  banner: string;
}

export default function ClientPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [promotionProducts, setPromotionProducts] = useState<Product[]>([]);
  const [promotionBanners, setPromotionBanners] = useState<any[]>([]);
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setLoading(true);
        const [homepageRes, bannersRes] = await Promise.all([
          fetch("/api/homepage"),
          fetch("/api/promotion-banners"),
        ]);

        if (homepageRes.ok) {
          const data = await homepageRes.json();
          setCategories(data.categories);
          setFeaturedProducts(data.featuredProducts);
          setPromotionProducts(data.promotionProducts);
          setMarket(data.market);
        }

        if (bannersRes.ok) {
          const banners = await bannersRes.json();
          setPromotionBanners(banners);
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  const handleLoginSuccess = () => {
    // User successfully logged in
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <ClientHeader />
        <main className="flex items-center justify-center h-screen">
          <p>Carregando...</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClientHeader />
      <main className="space-y-6 px-4 py-6">
        {promotionBanners.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold mb-4">Promoções</h2>
            <PromotionCarousel banners={promotionBanners} />
          </section>
        ) : (
          <PromoBanner market={market} />
        )}
        <CategoryGrid categories={categories} />
        <FeaturedProducts products={featuredProducts} />
      </main>
      <BottomNav />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
