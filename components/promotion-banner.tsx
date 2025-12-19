"use client";

import { formatCurrency } from "@/lib/currency";

interface PromotionBannerProps {
  data: {
    id: string;
    title: string;
    description?: string;
    discountPrice?: number;
    backgroundImage?: string;
    productImage?: string;
    config: any;
    productId?: string;
  };
  className?: string;
}

export function PromotionBanner({
  data,
  className = "",
}: PromotionBannerProps) {
  const {
    title,
    description,
    discountPrice,
    backgroundImage,
    productImage,
    config,
  } = data;

  const {
    backgroundType = "solid",
    backgroundColor = "#f3f4f6",
    gradientStart = "#ef4444",
    gradientEnd = "#b91c1c",
    gradientDirection = "to right",
    fontFamily = "sans",
    textColor = "#000000",
    fontSize = "medium",
    animation = "none",
    productTransform = { scale: 1, rotate: 0, pos: { x: 0, y: 0 } },
    extraTexts = [],
  } = config || {};

  const getFontFamily = (font: string) => {
    switch (font) {
      case "serif":
        return "font-serif";
      case "mono":
        return "font-mono";
      case "cursive":
        return "font-cursive";
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
        return "animate-float-slow";
      case "pulse":
        return "animate-pulse";
      case "spin":
        return "animate-spin-slow";
      case "zoom":
        return "animate-zoom-in";
      case "slide":
        return "animate-slide-in-left";
      case "rotate3d":
        return "animate-rotate-3d";
      default:
        return "";
    }
  };

  return (
    <div
      className={`relative w-[396px] h-[220px] overflow-hidden rounded-xl shadow-lg flex flex-row ${className}`}
      style={{
        background:
          backgroundType === "gradient"
            ? `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`
            : backgroundColor,
      }}
    >
      {/* Left Content */}
      <div className="relative z-10 flex-1 flex flex-col p-3 sm:p-6 justify-center items-start text-left h-full min-w-0">
        <h2
          className={`font-bold mb-1 sm:mb-2 leading-tight w-full break-words ${getFontFamily(
            fontFamily
          )} ${getFontSizeClass(fontSize)}`}
          style={{ color: textColor }}
        >
          {title}
        </h2>

        {description && (
          <p
            className={`mb-2 sm:mb-4 opacity-90 w-full break-words ${getFontFamily(
              fontFamily
            )}`}
            style={{
              color: textColor,
              fontSize: fontSize === "small" ? "0.75rem" : "0.875rem",
            }}
          >
            {description}
          </p>
        )}

        {discountPrice && (
          <div className="mt-auto mb-2 sm:mb-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-lg inline-flex items-center whitespace-nowrap">
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium mr-1.5 sm:mr-2">
              Por apenas
            </span>
            <span className="text-base sm:text-xl font-bold text-green-600">
              {formatCurrency(discountPrice)}
            </span>
          </div>
        )}
      </div>

      {/* Right Product Image */}
      <div
        className="relative z-10 w-[40%] h-full flex items-center justify-center p-2 sm:p-4 shrink-0"
        style={{ perspective: "800px" }}
      >
        {productImage && (
          <div
            className={`w-full h-full relative ${getAnimationClass(animation)}`}
          >
            <div
              className="w-full h-full"
              style={{
                transformOrigin: "center",
                transform: `translate(${productTransform.pos?.x ?? 0}px, ${
                  productTransform.pos?.y ?? 0
                }px) scale(${productTransform.scale ?? 1}) rotate(${
                  productTransform.rotate ?? 0
                }deg)`,
                willChange: "transform",
              }}
            >
              <img
                src={productImage}
                alt={title}
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>
          </div>
        )}
      </div>
      {/* Extra Texts Overlay */}
      {extraTexts.map(
        (t: {
          id: string;
          content: string;
          color: string;
          fontSize: "small" | "medium" | "large";
          x: number;
          y: number;
          width?: number;
        }) => (
          <div
            key={t.id}
            className="absolute"
            style={{
              left: `${t.x}px`,
              top: `${t.y}px`,
              color: t.color,
              maxWidth: t.width ? `${t.width}px` : undefined,
              fontSize:
                t.fontSize === "small"
                  ? "0.875rem"
                  : t.fontSize === "large"
                  ? "1.5rem"
                  : "1rem",
              fontWeight: 700,
              zIndex: 30,
            }}
          >
            {t.content}
          </div>
        )
      )}
    </div>
  );
}
