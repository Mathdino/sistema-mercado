"use client";

import { useState, useEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 396,
    height: 220,
  });
  const [leftContentWidth, setLeftContentWidth] = useState<number>(220);
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
    titleWidth,
    descriptionWidth,
  } = config || {};
  const PREVIEW_W = 396;
  const PREVIEW_H = 220;
  const baseSize = Math.max(
    60,
    Math.round(160 * (containerDimensions.height / PREVIEW_H))
  );
  const scaleVal = Number(productTransform?.scale ?? 1);
  const xRaw = Number(productTransform?.pos?.x ?? 0);
  const yRaw = Number(productTransform?.pos?.y ?? 0);
  const scaleW = Math.min(1, containerDimensions.width / PREVIEW_W);
  const scaleH = Math.min(1, containerDimensions.height / PREVIEW_H);
  const uiScale = Math.min(scaleW, scaleH);
  const titleBase =
    fontSize === "small"
      ? 18
      : fontSize === "large"
      ? 32
      : fontSize === "xl"
      ? 48
      : 24;
  const descBase = fontSize === "small" ? 14 : fontSize === "large" ? 18 : 16;
  const pillPadY = Math.round(6 * uiScale);
  const pillPadX = Math.round(12 * uiScale);
  const labelBase = 12;
  const priceBase = 20;

  // Update container dimensions when mounted/resized
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
      }
      if (leftContentRef.current) {
        const { width } = leftContentRef.current.getBoundingClientRect();
        setLeftContentWidth(width);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Make positioning responsive based on actual container dimensions
  const getImagePosition = (
    containerWidth: number,
    containerHeight: number
  ) => {
    const scaleX = containerWidth / PREVIEW_W;
    const scaleY = containerHeight / PREVIEW_H;
    const scaledImageSize = baseSize * scaleVal;
    const maxX = Math.max(0, containerWidth - scaledImageSize - 20);
    const maxY = Math.max(0, containerHeight - scaledImageSize - 20);
    const targetX = xRaw * scaleX;
    const targetY = yRaw * scaleY;
    const leftGutter = Math.max(
      0,
      Math.round((leftContentWidth - 104) * scaleX)
    );
    const safeX = Math.max(leftGutter, Math.min(maxX, targetX));
    const safeY = Math.max(0, Math.min(maxY, targetY));

    return { safeX, safeY };
  };

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
      ref={containerRef}
      className={`relative w-full h-[220px] overflow-hidden rounded-xl shadow-lg flex flex-row my-2 ${className}`}
      style={{
        background:
          backgroundType === "gradient"
            ? `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`
            : backgroundColor,
      }}
    >
      {/* Left Content */}
      <div
        ref={leftContentRef}
        className="relative z-10 flex-1 flex flex-col p-6 justify-center items-start text-left h-full min-w-0"
      >
        <h2
          className={`font-bold mb-2 leading-tight w-full break-words ${getFontFamily(
            fontFamily
          )} ${getFontSizeClass(fontSize)}`}
          style={{
            color: textColor,
            width: titleWidth ? `${titleWidth}px` : undefined,
            fontSize: `${Math.round(titleBase * uiScale)}px`,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            className={`mb-4 opacity-90 w-full break-words ${getFontFamily(
              fontFamily
            )}`}
            style={{
              color: textColor,
              fontSize: `${Math.round(descBase * uiScale)}px`,
              width: descriptionWidth ? `${descriptionWidth}px` : undefined,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </p>
        )}

        {discountPrice && (
          <div
            className="mt-auto bg-white/90 backdrop-blur-sm rounded-full shadow-lg inline-flex items-center whitespace-nowrap"
            style={{ padding: `${pillPadY}px ${pillPadX}px` }}
          >
            <span
              className="text-gray-500 font-medium mr-2"
              style={{ fontSize: `${Math.round(labelBase * uiScale)}px` }}
            >
              Por apenas
            </span>
            <span
              className="font-bold text-green-600"
              style={{ fontSize: `${Math.round(priceBase * uiScale)}px` }}
            >
              {formatCurrency(discountPrice)}
            </span>
          </div>
        )}
      </div>

      {/* Right Product Image */}
      {productImage && (
        <div
          className={`absolute ${getAnimationClass(animation)}`}
          style={(() => {
            // Get responsive positioning based on actual container size
            const { safeX, safeY } = getImagePosition(
              containerDimensions.width,
              containerDimensions.height
            );

            return {
              left: `${safeX}px`,
              top: `${safeY}px`,
              width: `${baseSize}px`,
              height: `${baseSize}px`,
              zIndex: 20,
            };
          })()}
        >
          <div
            className="w-full h-full"
            style={{
              transformOrigin: "center",
              transform: `scale(${scaleVal}) rotate(${
                productTransform.rotate ?? 0
              }deg)`,
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
              left: `${t.x * (containerDimensions.width / PREVIEW_W)}px`,
              top: `${t.y * (containerDimensions.height / PREVIEW_H)}px`,
              color: t.color,
              width: t.width
                ? `${Math.round(
                    t.width * (containerDimensions.width / PREVIEW_W)
                  )}px`
                : undefined,
              fontSize: `${Math.round(
                (t.fontSize === "small"
                  ? 14 * uiScale
                  : t.fontSize === "large"
                  ? 24 * uiScale
                  : 16 * uiScale) as number
              )}px`,
              fontWeight: 700,
              zIndex: 30,
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {t.content}
          </div>
        )
      )}
    </div>
  );
}
