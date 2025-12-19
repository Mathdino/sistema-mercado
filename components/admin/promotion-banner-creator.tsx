"use client";

import { useState, useEffect, useRef } from "react";
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
  // Product Transform
  const [productScale, setProductScale] = useState<number>(
    initialData?.config?.productTransform?.scale ?? 1
  );
  const [productRotate, setProductRotate] = useState<number>(
    initialData?.config?.productTransform?.rotate ?? 0
  );
  const [productPos, setProductPos] = useState<{ x: number; y: number }>(
    initialData?.config?.productTransform?.pos ?? { x: 0, y: 0 }
  );
  const draggingRef = useRef<{
    type: "product" | "text";
    index?: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const productAreaRef = useRef<HTMLDivElement | null>(null);
  // Extra texts
  const [extraTexts, setExtraTexts] = useState<
    {
      id: string;
      content: string;
      color: string;
      fontSize: "small" | "medium" | "large";
      x: number;
      y: number;
      width?: number;
    }[]
  >(initialData?.config?.extraTexts || []);
  const [selected, setSelected] = useState<{
    type: "product" | "text";
    index?: number;
  } | null>(null);

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
  const [titleWidth, setTitleWidth] = useState<number | undefined>(
    initialData?.config?.titleWidth
  );
  const [descriptionWidth, setDescriptionWidth] = useState<number | undefined>(
    initialData?.config?.descriptionWidth
  );

  // Animation
  const [animation, setAnimation] = useState(
    initialData?.config?.animation || "none"
  );

  // Debug animation state
  useEffect(() => {
    // Force re-render of animation
    if (animation !== "none") {
      const previewElement = document.querySelector(".preview-animation-test");
      if (previewElement) {
        // Remove and re-add animation class to trigger restart
        previewElement.classList.remove(getAnimationClass(animation));
        setTimeout(() => {
          previewElement.classList.add(getAnimationClass(animation));
        }, 10);
      }
    }
  }, [animation]);

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
          productTransform: {
            scale: productScale,
            rotate: productRotate,
            pos: productPos,
          },
          extraTexts,
          titleWidth,
          descriptionWidth,
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
        return "animate-float-slow"; // Slower float animation
      case "pulse":
        return "animate-pulse";
      case "spin":
        return "animate-spin-slow"; // Slow spin
      case "zoom":
        return "animate-zoom-in"; // New zoom animation
      case "slide":
        return "animate-slide-in-left"; // New slide animation
      case "rotate3d":
        return "animate-rotate-3d"; // New 3D rotation
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
            <div className="space-y-4">
              <Label>Imagem do Produto</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Escala</Label>
                  <Slider
                    defaultValue={[productScale]}
                    min={0.5}
                    max={1.5}
                    step={0.01}
                    onValueChange={(v) => setProductScale(v[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    x{productScale.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rotação</Label>
                  <Slider
                    defaultValue={[productRotate]}
                    min={-30}
                    max={30}
                    step={1}
                    onValueChange={(v) => setProductRotate(v[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    {productRotate}°
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setProductPos({ x: 0, y: 0 })}
                >
                  Resetar posição
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dica: arraste a imagem no preview para reposicionar.
              </p>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Largura do Título (px)</Label>
                <Input
                  type="number"
                  value={String(titleWidth ?? "")}
                  onChange={(e) =>
                    setTitleWidth(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Largura da Descrição (px)</Label>
                <Input
                  type="number"
                  value={String(descriptionWidth ?? "")}
                  onChange={(e) =>
                    setDescriptionWidth(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Textos Extras</Label>
                <Button
                  variant="outline"
                  onClick={() =>
                    setExtraTexts((prev) => [
                      ...prev,
                      {
                        id: crypto.randomUUID(),
                        content: "Novo texto",
                        color: "#ffffff",
                        fontSize: "medium",
                        x: 10,
                        y: 80,
                      },
                    ])
                  }
                >
                  Adicionar Texto
                </Button>
              </div>
              <div className="space-y-3">
                {extraTexts.map((t, idx) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-2 gap-3 items-center"
                  >
                    <Input
                      value={t.content}
                      onChange={(e) =>
                        setExtraTexts((prev) =>
                          prev.map((et) =>
                            et.id === t.id
                              ? { ...et, content: e.target.value }
                              : et
                          )
                        )
                      }
                      placeholder="Conteúdo"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        value={t.color}
                        onChange={(e) =>
                          setExtraTexts((prev) =>
                            prev.map((et) =>
                              et.id === t.id
                                ? { ...et, color: e.target.value }
                                : et
                            )
                          )
                        }
                      />
                      <Input
                        type="number"
                        className="w-24"
                        value={String(t.width ?? 160)}
                        onChange={(e) =>
                          setExtraTexts((prev) =>
                            prev.map((et) =>
                              et.id === t.id
                                ? {
                                    ...et,
                                    width: Number(e.target.value || "0"),
                                  }
                                : et
                            )
                          )
                        }
                        placeholder="Largura (px)"
                      />
                      <Select
                        value={t.fontSize}
                        onValueChange={(val) =>
                          setExtraTexts((prev) =>
                            prev.map((et) =>
                              et.id === t.id
                                ? { ...et, fontSize: val as any }
                                : et
                            )
                          )
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          setExtraTexts((prev) =>
                            prev.filter((et) => et.id !== t.id)
                          )
                        }
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Dica: arraste cada texto no preview para reposicionar.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="animation" className="space-y-4 mt-3">
            <div className="space-y-2">
              <Label className="mb-2">Animação do Produto</Label>
              <Select
                value={animation}
                onValueChange={(value) => {
                  setAnimation(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="float">Flutuar (Lento)</SelectItem>
                  <SelectItem value="pulse">Pulsar</SelectItem>
                  <SelectItem value="spin">Girar (Muito Lento)</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="slide">Deslizar da Esquerda</SelectItem>
                  <SelectItem value="rotate3d">Rotação 3D</SelectItem>
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
          className="relative w-[396px] h-[220px] rounded-lg shadow-xl flex flex-row overflow-hidden"
          style={{
            background:
              backgroundType === "gradient"
                ? `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`
                : backgroundColor,
          }}
          ref={previewRef}
          onMouseMove={(e) => {
            if (!draggingRef.current) return;
            const rect = previewRef.current?.getBoundingClientRect();
            if (!rect) return;
            const dx = e.clientX - draggingRef.current.startX;
            const dy = e.clientY - draggingRef.current.startY;
            const newX = draggingRef.current.origX + dx;
            const newY = draggingRef.current.origY + dy;
            if (draggingRef.current.type === "product") {
              const base = 160;
              const productW = base * productScale;
              const productH = base * productScale;
              setProductPos({
                x: Math.max(0, Math.min(rect.width - productW, newX)),
                y: Math.max(0, Math.min(rect.height - productH, newY)),
              });
            } else if (draggingRef.current.type === "resize_product") {
              const newWidth = Math.max(
                60,
                Math.min(
                  rect.width - productPos.x,
                  (draggingRef.current as any).origWidth + dx
                )
              );
              const scaleFromWidth = newWidth / 160;
              setProductScale(scaleFromWidth);
            } else if (draggingRef.current.type === "resize_text") {
              const idx = draggingRef.current.index!;
              setExtraTexts((prev) =>
                prev.map((et, i) =>
                  i === idx
                    ? {
                        ...et,
                        width: Math.max(
                          60,
                          Math.min(
                            rect.width - et.x,
                            ((draggingRef.current as any).origWidth ||
                              et.width ||
                              160) + dx
                          )
                        ),
                      }
                    : et
                )
              );
            } else {
              const idx = draggingRef.current.index!;
              setExtraTexts((prev) =>
                prev.map((et, i) =>
                  i === idx
                    ? {
                        ...et,
                        x: Math.max(
                          0,
                          Math.min(rect.width - (et.width ?? 160), newX)
                        ),
                        y: Math.max(0, Math.min(rect.height - 24, newY)),
                      }
                    : et
                )
              );
            }
          }}
          onMouseUp={() => {
            draggingRef.current = null;
          }}
        >
          {/* Left Content */}
          <div className="relative z-10 flex-1 flex flex-col p-6 justify-center items-start text-left h-full">
            <h2
              className={`font-bold mb-2 leading-tight ${getFontFamily(
                fontFamily
              )} ${getFontSizeClass(fontSize)}`}
              style={{
                color: textColor,
                width: titleWidth ? `${titleWidth}px` : undefined,
              }}
            >
              {title || "Título da Promoção"}
            </h2>

            {description && (
              <p
                className={`mb-4 opacity-90 max-w-[90%] ${getFontFamily(
                  fontFamily
                )}`}
                style={{
                  color: textColor,
                  width: descriptionWidth ? `${descriptionWidth}px` : undefined,
                }}
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
            {/* Extra Texts Overlay */}
            {extraTexts.map((t, idx) => (
              <div
                key={t.id}
                className="absolute cursor-move"
                style={{
                  left: `${t.x}px`,
                  top: `${t.y}px`,
                  color: t.color,
                  width: `${t.width ?? 160}px`,
                  fontSize:
                    t.fontSize === "small"
                      ? "0.875rem"
                      : t.fontSize === "large"
                      ? "1.5rem"
                      : "1rem",
                  fontWeight: 700,
                  zIndex: 30,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  border:
                    selected?.type === "text" && selected.index === idx
                      ? "1px dashed rgba(0,0,0,0.5)"
                      : undefined,
                  boxSizing: "border-box",
                }}
                onMouseDown={(e) => {
                  const rect = previewRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setSelected({ type: "text", index: idx });
                  draggingRef.current = {
                    type: "text",
                    index: idx,
                    startX: e.clientX,
                    startY: e.clientY,
                    origX: t.x,
                    origY: t.y,
                  };
                }}
              >
                {t.content}
                {selected?.type === "text" && selected.index === idx && (
                  <div
                    style={{
                      position: "absolute",
                      right: -6,
                      bottom: -6,
                      width: 12,
                      height: 12,
                      background: "#ffffff",
                      border: "1px solid rgba(0,0,0,0.6)",
                      borderRadius: 2,
                      cursor: "nwse-resize",
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelected({ type: "text", index: idx });
                      draggingRef.current = {
                        type: "resize_text",
                        index: idx,
                        startX: e.clientX,
                        startY: e.clientY,
                        origX: t.x,
                        origY: t.y,
                        // @ts-expect-error
                        origWidth: t.width ?? 160,
                      } as any;
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Product Image Overlay */}
          {productImage && (
            <div
              className={`absolute ${getAnimationClass(animation)}`}
              style={{
                left: `${productPos.x}px`,
                top: `${productPos.y}px`,
                width: "160px",
                height: "160px",
                zIndex: 20,
                border:
                  selected?.type === "product"
                    ? "1px dashed rgba(0,0,0,0.5)"
                    : undefined,
                boxSizing: "border-box",
              }}
              onMouseDown={(e) => {
                const rect = previewRef.current?.getBoundingClientRect();
                if (!rect) return;
                setSelected({ type: "product" });
                draggingRef.current = {
                  type: "product",
                  startX: e.clientX,
                  startY: e.clientY,
                  origX: productPos.x,
                  origY: productPos.y,
                };
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  transformOrigin: "center",
                  transform: `scale(${productScale}) rotate(${productRotate}deg)`,
                }}
              >
                <img
                  src={productImage}
                  alt="Product"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              {selected?.type === "product" && (
                <div
                  style={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    width: 12,
                    height: 12,
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.6)",
                    borderRadius: 2,
                    cursor: "nwse-resize",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelected({ type: "product" });
                    draggingRef.current = {
                      type: "resize_product",
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: productPos.x,
                      origY: productPos.y,
                      // @ts-expect-error
                      origWidth: 160 * productScale,
                    } as any;
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
