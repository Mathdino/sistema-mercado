"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Search, Eye, EyeOff } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
  const router = useRouter();
  const { login, loginWithOAuth } = useAuthStore();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [cpfDigits, setCpfDigits] = useState("");
  const [cpfMasked, setCpfMasked] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 7);
    const p3 = digits.slice(7, 11);
    return [p1 && `(${p1}) `, p2, p3 && `-${p3}`].filter(Boolean).join("");
  };
  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);
    return [p1, p2 && `.${p2}`, p3 && `.${p3}`, p4 && `-${p4}`]
      .filter(Boolean)
      .join("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(cpfDigits, password);

    if (success) {
      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } else {
      toast({
        title: "Erro ao fazer login",
        description: "CPF ou senha incorretos",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleCepLookup = async () => {
    const digits = cep.replace(/\D/g, "").slice(0, 8);
    if (digits.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Informe 8 dígitos do CEP",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        toast({ title: "CEP não encontrado", variant: "destructive" });
        return;
      }
      setStreet(data.logradouro || "");
      setCity(data.localidade || "");
      setNeighborhood(data.bairro || "");
      setStateUf(data.uf || "");
    } catch {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          cpf: cpfDigits,
          phone,
          password,
          confirmPassword,
          address: {
            cep: cep.replace(/\D/g, ""),
            street,
            city,
            neighborhood,
            state: stateUf,
            number,
            complement,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        toast({
          title: "Conta criada",
          description: "Agora entre com seu CPF e senha.",
        });
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        // permanece com cpf preenchido
      } else {
        const msg =
          data?.error === "cpf_exists"
            ? "CPF já cadastrado"
            : data?.error === "password_mismatch"
            ? "Senhas não conferem"
            : data?.error === "invalid_cpf"
            ? "CPF inválido, verifique os dígitos"
            : `Erro ao criar conta${data?.details ? `: ${data.details}` : ""}`;
        toast({ title: "Erro", description: msg, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao criar conta", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <ShoppingBag className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl">Bem-vindo</DialogTitle>
          <DialogDescription>
            Entre com sua conta para continuar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === "login" ? "default" : "outline"}
              onClick={() => setMode("login")}
            >
              Entrar
            </Button>
            <Button
              variant={mode === "register" ? "default" : "outline"}
              onClick={() => setMode("register")}
            >
              Criar conta
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {mode === "login"
                  ? "Entre com seu CPF"
                  : "Preencha seus dados para criar a conta"}
              </span>
            </div>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-cpf">CPF</Label>
                <Input
                  id="modal-cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfMasked}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 11);
                    setCpfDigits(digits);
                    setCpfMasked(formatCpf(digits));
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-password">Senha</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="modal-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-fullname">Nome Completo</Label>
                <Input
                  id="modal-fullname"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="modal-cpf">CPF</Label>
                  <Input
                    id="modal-cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpfMasked}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);
                      setCpfDigits(digits);
                      setCpfMasked(formatCpf(digits));
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-phone">Telefone</Label>
                  <Input
                    id="modal-phone"
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-end">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="modal-cep">CEP</Label>
                  <Input
                    id="modal-cep"
                    type="text"
                    placeholder="00000000"
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleCepLookup}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Buscar CEP
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="modal-street">Rua</Label>
                  <Input
                    id="modal-street"
                    type="text"
                    placeholder="Rua"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-city">Cidade</Label>
                  <Input
                    id="modal-city"
                    type="text"
                    placeholder="Cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="modal-neighborhood">Bairro</Label>
                  <Input
                    id="modal-neighborhood"
                    type="text"
                    placeholder="Bairro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-state">Estado (UF)</Label>
                  <Input
                    id="modal-state"
                    type="text"
                    placeholder="UF"
                    value={stateUf}
                    onChange={(e) =>
                      setStateUf(e.target.value.slice(0, 2).toUpperCase())
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="modal-number">Número</Label>
                  <Input
                    id="modal-number"
                    type="text"
                    placeholder="Número"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-complement">Complemento</Label>
                  <Input
                    id="modal-complement"
                    type="text"
                    placeholder="Apartamento, bloco, etc."
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="modal-password">Senha</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="modal-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-confirm-password">
                    Confirmar Senha
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="modal-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={
                        showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Use seu CPF e senha para acessar.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
