"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Package, Truck } from "lucide-react";

export default function OrderSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to orders page after 5 seconds
    const timer = setTimeout(() => {
      router.push("/client/orders");
    }, 5000);

    // Cleanup timer if component unmounts
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-green-500 flex flex-col items-center justify-between p-4">
      {/* Top section with content */}
      <div className="flex-grow flex flex-col items-center justify-center w-full pt-8">
        {/* Success Icon */}
        <div className="mb-8 animate-bounce">
          <CheckCircle className="h-24 w-24 text-white" />
        </div>

        {/* Main Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pedido Confirmado!
          </h1>
          <p className="text-xl text-green-100 max-w-md">
            Seu pedido foi enviado para o mercado com sucesso
          </p>
        </div>

        {/* Animated Icons */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="animate-pulse">
            <Package className="h-12 w-12 text-white opacity-80" />
          </div>
          <div className="animate-ping">
            <Truck className="h-12 w-12 text-white" />
          </div>
          <div className="animate-pulse">
            <Package className="h-12 w-12 text-white opacity-80" />
          </div>
        </div>

        {/* Redirect Message */}
        <div className="text-center">
          <p className="text-green-100 text-lg">
            Você será redirecionado para seus pedidos em breve...
          </p>
        </div>
      </div>

      {/* Progress bar at the bottom */}
      <div className="w-full max-w-md pb-8">
        <div className="w-full h-2 bg-green-400 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress"></div>
        </div>
      </div>

      {/* Custom CSS for progress bar animation */}
      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 5s linear forwards;
        }
      `}</style>
    </div>
  );
}