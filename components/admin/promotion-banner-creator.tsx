"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import {
  Loader2,
  Palette,
  Type,
  Layout,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface PromotionBannerCreatorProps {
  products: Product[];
  onSuccess: () => void;
  initialData?: any; // For editing
  onCancel: () => void;
}

export function PromotionBannerCreator({
  products,
  onSuccess,
  initialData,
  onCancel,
}: PromotionBannerCreatorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialData?.productId || ""
  );

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [discountPrice, setDiscountPrice] = useState(
    initialData?.discountPrice?.toString() || ""
  );

  // Visuals
  const [backgroundType, setBackgroundType] = useState(
    initialData?.config?.backgroundType || "solid"
  );
  const [backgroundColor, setBackgroundColor] = useState(
    initialData?.config?.backgroundColor || "#ef4444" // Default red-500
  );
  const [gradientStart, setGradientStart] = useState(
    initialData?.config?.gradientStart || "#ef4444"
  );
  const [gradientEnd, setGradientEnd] = useState(
    initialData?.config?.gradientEnd || "#b91c1c"
  );
  const [gradientDirection, setGradientDirection] = useState(
    initialData?.config?.gradientDirection || "to right"
  );
  const [productImage, setProductImage] = useState(
    initialData?.productImage || ""
  );

  // Typography
  const [fontFamily, setFontFamily] = useState(
    initialData?.config?.fontFamily || "sans"
  );
  const [textColor, setTextColor] = useState(
    initialData?.config?.textColor || "#000000"
  );
  const [fontSize, setFontSize] = useState(
    initialData?.config?.fontSize || "medium"
  );

  // Animation
  const [animation, setAnimation] = useState(
    initialData?.config?.animation || "none"
  );

  // Effect to pre-fill data when product is selected
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId);
      if (product) {
        if (!title) setTitle(product.name);
        if (!productImage) setProductImage(product.image);
        // Don't auto-set price as it's a discount
      }
    }
  }, [selectedProductId, products]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        title,
        description,
        discountPrice,
        backgroundImage: null, // Removed background image support
        productImage,
        productId: selectedProductId,
        config: {
          backgroundType,
          backgroundColor,
          gradientStart,
          gradientEnd,
          gradientDirection,
          fontFamily,
          textColor,
          fontSize,
          animation,
        },
      };

      const url = initialData
        ? `/api/admin/promotion-cards/${initialData.id}`
        : "/api/admin/promotion-cards";

      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save promotion banner");

      toast({
        title: "Sucesso",
        description: "Banner de promoção salvo com sucesso!",
      });
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Erro ao salvar banner. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Preview Styles
  const getFontFamily = (font: string) => {
    switch (font) {
      case "serif":
        return "font-serif";
      case "mono":
        return "font-mono";
      case "cursive":
        return "font-cursive"; // Might need custom class
      default:
        return "font-sans";
    }
  };

  const getFontSizeClass = (size: string) => {
    switch (size) {
      case "small":
        return "text-lg";
      case "large":
        return "text-4xl";
      case "xl":
        return "text-6xl";
      default:
        return "text-2xl";
    }
  };

  const getAnimationClass = (anim: string) => {
    switch (anim) {
      case "float":
        return "animate-bounce"; // Simplified float
      case "pulse":
        return "animate-pulse";
      case "spin":
        return "animate-spin-slow"; // Need to ensure this exists or use style
      default:
        return "";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">
              <Layout className="w-4 h-4 mr-2" /> Conteúdo
            </TabsTrigger>
            <TabsTrigger value="visual">
              <Palette className="w-4 h-4 mr-2" /> Visual
            </TabsTrigger>
            <TabsTrigger value="typography">
              <Type className="w-4 h-4 mr-2" /> Texto
            </TabsTrigger>
            <TabsTrigger value="animation">
              <Sparkles className="w-4 h-4 mr-2" /> Animação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label>Produto (Opcional)</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - {formatCurrency(p.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título Principal</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Promoção de Verão"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição / Subtítulo</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes da oferta..."
              />
            </div>

            <div className="space-y-2">
              <Label>Preço Promocional (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </TabsContent>

          <TabsContent value="visual" className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Fundo</Label>
              <Select
                value={backgroundType}
                onValueChange={(val) => setBackgroundType(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Cor Sólida</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {backgroundType === "solid" ? (
              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-1"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cor Inicial</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={gradientStart}
                        onChange={(e) => setGradientStart(e.target.value)}
                      />
                      <Input
                        value={gradientStart}
                        onChange={(e) => setGradientStart(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Final</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={gradientEnd}
                        onChange={(e) => setGradientEnd(e.target.value)}
                      />
                      <Input
                        value={gradientEnd}
                        onChange={(e) => setGradientEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Direção</Label>
                  <Select
                    value={gradientDirection}
                    onValueChange={setGradientDirection}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to right">Para Direita</SelectItem>
                      <SelectItem value="to left">Para Esquerda</SelectItem>
                      <SelectItem value="to bottom">Para Baixo</SelectItem>
                      <SelectItem value="to top">Para Cima</SelectItem>
                      <SelectItem value="to bottom right">
                        Diagonal (Baixo-Direita)
                      </SelectItem>
                      <SelectItem value="to top right">
                        Diagonal (Cima-Direita)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>URL da Imagem do Produto</Label>
              <Input
                value={productImage}
                onChange={(e) => setProductImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4">
            <div className="space-y-2">
              <Label>Fonte</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans">Sans Serif (Padrão)</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="mono">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tamanho do Título</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                  <SelectItem value="xl">Extra Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  className="w-12 h-10 p-1"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
                <Input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="animation" className="space-y-4">
            <div className="space-y-2">
              <Label>Animação do Produto</Label>
              <Select value={animation} onValueChange={setAnimation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="float">Flutuar</SelectItem>
                  <SelectItem value="pulse">Pulsar</SelectItem>
                  <SelectItem value="spin">Girar (Lento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Banner
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="border rounded-xl p-4 bg-gray-50 flex items-center justify-center min-h-[400px]">
        <div
          className="relative w-full h-[250px] rounded-lg shadow-xl flex flex-row overflow-hidden"
          style={{
            background:
              backgroundType === "gradient"
                ? `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`
                : backgroundColor,
          }}
        >
          {/* Left Content */}
          <div className="relative z-10 flex-1 flex flex-col p-6 justify-center items-start text-left h-full">
            <h2
              className={`font-bold mb-2 leading-tight ${getFontFamily(
                fontFamily
              )} ${getFontSizeClass(fontSize)}`}
              style={{ color: textColor }}
            >
              {title || "Título da Promoção"}
            </h2>

            {description && (
              <p
                className={`mb-4 opacity-90 max-w-[90%] ${getFontFamily(
                  fontFamily
                )}`}
                style={{ color: textColor }}
              >
                {description}
              </p>
            )}

            {discountPrice && (
              <div className="mt-auto bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg inline-flex items-center">
                <span className="text-xs text-gray-500 font-medium mr-2">
                  Por apenas
                </span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(parseFloat(discountPrice))}
                </span>
              </div>
            )}
          </div>

          {/* Right Product Image */}
          <div className="relative z-10 w-[40%] h-full flex items-center justify-center p-4">
            {productImage && (
              <div
                className={`w-full h-full relative ${getAnimationClass(
                  animation
                )}`}
              >
                <img
                  src={productImage}
                  alt="Product"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
