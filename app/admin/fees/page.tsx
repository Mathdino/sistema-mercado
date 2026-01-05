"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryFee {
  id: string;
  type: 'FIXED' | 'PER_KM';
  fixedValue: number | null;
  perKmValue: number | null;
  minValue: number | null;
  minRange: number | null;
  isActive: boolean;
}

export default function AdminFeesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [newFee, setNewFee] = useState<Omit<DeliveryFee, 'id'>>({
    type: 'fixed',
    fixedValue: 0,
    perKmValue: null,
    minValue: null,
    minRange: null,
    isActive: true,
  });

  // Fetch delivery fees data
  useEffect(() => {
    const fetchDeliveryFees = async () => {
      try {
        const response = await fetch("/api/admin/fees");
        if (response.ok) {
          const data = await response.json();
          setDeliveryFees(data.fees || []);
        } else {
          toast({
            title: "Erro",
            description: "Falha ao carregar as taxas de entrega",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching delivery fees:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar as taxas de entrega",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryFees();
  }, []);

  const handleInputChange = (field: keyof Omit<DeliveryFee, 'id'>, value: string | number | boolean) => {
    setNewFee(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (value: 'FIXED' | 'PER_KM') => {
    setNewFee(prev => ({
      ...prev,
      type: value,
      // Reset other values when type changes
      fixedValue: value === 'FIXED' ? (prev.fixedValue || 0) : null,
      perKmValue: value === 'PER_KM' ? (prev.perKmValue || 0) : null,
    }));
  };

  const addFee = async () => {
    if (newFee.type === 'FIXED' && (newFee.fixedValue === null || newFee.fixedValue < 0)) {
      toast({
        title: "Erro",
        description: "Para taxas fixas, é necessário informar um valor fixo",
        variant: "destructive",
      });
      return;
    }

    if (newFee.type === 'PER_KM' && (newFee.perKmValue === null || newFee.perKmValue < 0)) {
      toast({
        title: "Erro",
        description: "Para taxas por KM, é necessário informar um valor por KM",
        variant: "destructive",
      });
      return;
    }

    if (newFee.minValue !== null && newFee.minRange === null) {
      toast({
        title: "Erro",
        description: "Para valor mínimo, é necessário informar o raio de alcance mínimo",
        variant: "destructive",
      });
      return;
    }

    if (newFee.minRange !== null && newFee.minValue === null) {
      toast({
        title: "Erro",
        description: "Para raio de alcance mínimo, é necessário informar o valor mínimo",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFee),
      });

      if (response.ok) {
        const result = await response.json();
        setDeliveryFees(prev => [...prev, result.fee]);
        setNewFee({
          type: 'FIXED',
          fixedValue: 0,
          perKmValue: null,
          minValue: null,
          minRange: null,
          isActive: true,
        });
        toast({
          title: "Sucesso",
          description: "Taxa de entrega adicionada com sucesso!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Falha ao adicionar a taxa de entrega",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding delivery fee:", error);
      toast({
        title: "Erro",
        description: "Falha na conexão ao adicionar a taxa de entrega",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFeeStatus = async (id: string, currentStatus: boolean) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/fees/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setDeliveryFees(prev => 
          prev.map(fee => 
            fee.id === id ? { ...fee, isActive: !currentStatus } : fee
          )
        );
        toast({
          title: "Sucesso",
          description: `Taxa ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Falha ao atualizar o status da taxa",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating fee status:", error);
      toast({
        title: "Erro",
        description: "Falha na conexão ao atualizar o status da taxa",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteFee = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta taxa de entrega?")) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/fees/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeliveryFees(prev => prev.filter(fee => fee.id !== id));
        toast({
          title: "Sucesso",
          description: "Taxa de entrega excluída com sucesso!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Falha ao excluir a taxa de entrega",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting delivery fee:", error);
      toast({
        title: "Erro",
        description: "Falha na conexão ao excluir a taxa de entrega",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requireRole="admin">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <p>Carregando...</p>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Taxas de Entrega</h1>
            <p className="text-muted-foreground">
              Gerencie as taxas de entrega do seu estabelecimento
            </p>
          </div>

          <div className="grid gap-6">
            {/* Add New Fee Card */}
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Nova Taxa de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Taxa</Label>
                    <Select 
                      value={newFee.type} 
                      onValueChange={(value: 'fixed' | 'per_km') => handleTypeChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de taxa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">Fixa</SelectItem>
                        <SelectItem value="PER_KM">Por KM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newFee.type === 'FIXED' && (
                    <div className="space-y-2">
                      <Label htmlFor="fixedValue">Valor Fixo (R$)</Label>
                      <Input
                        id="fixedValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newFee.fixedValue ?? ''}
                        onChange={(e) => handleInputChange("fixedValue", parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 10.00"
                      />
                    </div>
                  )}

                  {newFee.type === 'PER_KM' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="perKmValue">Valor por KM (R$)</Label>
                        <Input
                          id="perKmValue"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newFee.perKmValue ?? ''}
                          onChange={(e) => handleInputChange("perKmValue", parseFloat(e.target.value) || 0)}
                          placeholder="Ex: 1.50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minValue">Valor Mínimo de Entrega (R$)</Label>
                        <Input
                          id="minValue"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newFee.minValue ?? ''}
                          onChange={(e) => handleInputChange("minValue", parseFloat(e.target.value) || 0)}
                          placeholder="Ex: 5.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minRange">Raio de Alcance Mínimo (KM)</Label>
                        <Input
                          id="minRange"
                          type="number"
                          step="0.01"
                          min="0"
                          value={newFee.minRange ?? ''}
                          onChange={(e) => handleInputChange("minRange", parseFloat(e.target.value) || 0)}
                          placeholder="Ex: 3.00"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={addFee} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving ? "Adicionando..." : "Adicionar Taxa"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Fees List */}
            <Card>
              <CardHeader>
                <CardTitle>Taxas de Entrega Cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                {deliveryFees.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma taxa de entrega cadastrada</p>
                ) : (
                  <div className="space-y-4">
                    {deliveryFees.map((fee) => (
                      <div 
                        key={fee.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {fee.type === 'FIXED' 
                              ? `Taxa Fixa: R$ ${fee.fixedValue?.toFixed(2)}` 
                              : `Taxa por KM: R$ ${fee.perKmValue?.toFixed(2)}/km`}
                          </div>
                          {fee.minValue !== null && fee.minRange !== null && (
                            <div className="text-sm text-muted-foreground">
                              Valor mínimo: R$ {fee.minValue.toFixed(2)} para até {fee.minRange} km
                            </div>
                          )}
                          <div className={`text-sm ${fee.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            Status: {fee.isActive ? 'Ativa' : 'Inativa'}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFeeStatus(fee.id, fee.isActive)}
                          >
                            {fee.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteFee(fee.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}