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
import { formatCurrency } from "@/lib/currency";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface DeliveryFee {
  id: string;
  type: 'FIXED';
  fixedValue: number | null;
  isActive: boolean;
}

export default function AdminFeesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [newFee, setNewFee] = useState<Omit<DeliveryFee, 'id'>>({
    type: 'FIXED',
    fixedValue: 0,
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

  const handleInputChange = (field: 'type' | 'fixedValue' | 'isActive', value: string | number | boolean) => {
    setNewFee(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (value: 'FIXED') => {
    setNewFee(prev => ({
      ...prev,
      type: value,
    }));
  };

  const addFee = async () => {
    if (newFee.fixedValue === null || newFee.fixedValue < 0) {
      toast({
        title: "Erro",
        description: "É necessário informar um valor fixo",
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
            <LoadingSpinner />
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
                      onValueChange={(value: 'FIXED') => handleTypeChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">Fixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                            Taxa Fixa por entrega: {formatCurrency(fee.fixedValue || 0)}
                          </div>
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