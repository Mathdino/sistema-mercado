import type React from "react";
import { Button } from "@/components/ui/button";

export function GoogleOAuthProvider({
  children,
  clientId,
}: {
  children: React.ReactNode;
  clientId?: string;
}) {
  return <>{children}</>;
}

export function GoogleLogin({
  onSuccess,
  onError,
}: {
  onSuccess: (res: any) => void;
  onError: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        if (onError) onError();
      }}
    >
      Continuar com Google
    </Button>
  );
}
