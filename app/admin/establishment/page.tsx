"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface Establishment {
  id: string;
  name: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Apply phone mask: (XX) XXXXX-XXXX
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2');
}

export default function AdminEstablishmentPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishment, setEstablishment] = useState<Establishment>({
    id: "",
    name: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    phone: "",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    phone: "",
  });
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Fetch establishment data
  useEffect(() => {
    const fetchEstablishmentData = async () => {
      try {
        const response = await fetch("/api/admin/establishment");
        if (response.ok) {
          const data = await response.json();
          if (data.establishment) {
            // Format phone number when loading establishment data
            const formattedEstablishment = {
              ...data.establishment,
              phone: formatPhone(data.establishment.phone)
            };
            setEstablishment(formattedEstablishment);
          }
          if (data.employees) {
            // Format phone numbers for employees
            const formattedEmployees = data.employees.map((emp: Employee) => ({
              ...emp,
              phone: formatPhone(emp.phone)
            }));
            setEmployees(formattedEmployees);
          }
        } else {
          // If no establishment exists, create a default one
          setEstablishment({
            id: "",
            name: "",
            cep: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
            phone: "",
          });
        }
      } catch (error) {
        console.error("Error fetching establishment data:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar os dados do estabelecimento",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishmentData();
  }, []);

  // Handle CEP lookup
  const handleCepChange = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setEstablishment(prev => ({
            ...prev,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching address from CEP:", error);
      }
    }
  };

  const handleEstablishmentChange = (field: keyof Establishment, value: string) => {
    if (field === 'phone') {
      // Apply phone mask: (XX) XXXXX-XXXX
      const phoneValue = value.replace(/\D/g, '');
      // Limit to 11 digits maximum
      const limitedPhoneValue = phoneValue.slice(0, 11);
      const formattedPhone = limitedPhoneValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{4})$/, '$1-$2');
      setEstablishment(prev => ({
        ...prev,
        phone: formattedPhone
      }));
    } else {
      setEstablishment(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEmployeeChange = (field: keyof typeof newEmployee, value: string) => {
    if (field === 'phone') {
      // Apply phone mask: (XX) XXXXX-XXXX
      const phoneValue = value.replace(/\D/g, '');
      // Limit to 11 digits maximum
      const limitedPhoneValue = phoneValue.slice(0, 11);
      const formattedPhone = limitedPhoneValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{4})$/, '$1-$2');
      setNewEmployee(prev => ({
        ...prev,
        phone: formattedPhone
      }));
    } else {
      setNewEmployee(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addEmployee = () => {
    if (!newEmployee.name.trim() || !newEmployee.role.trim() || !newEmployee.phone.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos do funcionário",
        variant: "destructive",
      });
      return;
    }

    const employee: Employee = {
      id: Date.now().toString(),
      name: newEmployee.name,
      role: newEmployee.role,
      phone: newEmployee.phone,
    };

    setEmployees(prev => [...prev, employee]);
    setNewEmployee({ name: "", role: "", phone: "" });
    setIsAddingEmployee(false);
  };

  const removeEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Remove formatting from phone numbers before sending to API
      const cleanEstablishmentPhone = establishment.phone.replace(/\D/g, '');
      const cleanEmployees = employees.map(emp => ({
        ...emp,
        phone: emp.phone.replace(/\D/g, '')
      }));
      
      const response = await fetch("/api/admin/establishment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...establishment,
          phone: cleanEstablishmentPhone, // Send clean phone number to API
          employees: cleanEmployees
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Dados do estabelecimento salvos com sucesso!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Falha ao salvar os dados do estabelecimento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving establishment:", error);
      toast({
        title: "Erro",
        description: "Falha na conexão ao salvar os dados",
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
            <h1 className="text-3xl font-bold">Informações do Estabelecimento</h1>
            <p className="text-muted-foreground">
              Gerencie as informações do seu estabelecimento
            </p>
          </div>

          <div className="grid gap-6">
            {/* Establishment Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Estabelecimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Mercado</Label>
                    <Input
                      id="name"
                      value={establishment.name}
                      onChange={(e) => handleEstablishmentChange("name", e.target.value)}
                      placeholder="Ex: Mercado do Bairro"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={establishment.phone}
                      onChange={(e) => handleEstablishmentChange("phone", e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      maxLength={15} // Max length for formatted phone
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={establishment.cep}
                      onChange={(e) => {
                        const cepValue = e.target.value.replace(/\D/g, '');
                        if (cepValue.length <= 8) {
                          handleEstablishmentChange("cep", cepValue);
                          if (cepValue.length === 8) {
                            handleCepChange(cepValue);
                          }
                        }
                      }}
                      placeholder="Ex: 12345-678"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={establishment.street}
                      onChange={(e) => handleEstablishmentChange("street", e.target.value)}
                      placeholder="Ex: Rua Principal"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={establishment.number}
                      onChange={(e) => handleEstablishmentChange("number", e.target.value)}
                      placeholder="Ex: 123"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={establishment.complement}
                      onChange={(e) => handleEstablishmentChange("complement", e.target.value)}
                      placeholder="Ex: Sala 101"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={establishment.neighborhood}
                      onChange={(e) => handleEstablishmentChange("neighborhood", e.target.value)}
                      placeholder="Ex: Centro"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={establishment.city}
                      onChange={(e) => handleEstablishmentChange("city", e.target.value)}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={establishment.state}
                      onChange={(e) => handleEstablishmentChange("state", e.target.value)}
                      placeholder="Ex: SP"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employees Card */}
            <Card>
              <CardHeader>
                <CardTitle>Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Employee Form */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Adicionar Funcionário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="emp-name">Nome Completo</Label>
                        <Input
                          id="emp-name"
                          value={newEmployee.name}
                          onChange={(e) => handleEmployeeChange("name", e.target.value)}
                          placeholder="Ex: João Silva"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="emp-role">Cargo</Label>
                        <Input
                          id="emp-role"
                          value={newEmployee.role}
                          onChange={(e) => handleEmployeeChange("role", e.target.value)}
                          placeholder="Ex: Gerente"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="emp-phone">Telefone</Label>
                        <Input
                          id="emp-phone"
                          value={newEmployee.phone}
                          onChange={(e) => handleEmployeeChange("phone", e.target.value)}
                          placeholder="Ex: (11) 99999-9999"
                          maxLength={15} // Max length for formatted phone
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-3">
                      <Button onClick={addEmployee}>Adicionar Funcionário</Button>
                    </div>
                  </div>

                  {/* Employee List */}
                  {employees.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Funcionários Cadastrados</h3>
                      <div className="space-y-2">
                        {employees.map((employee) => (
                          <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">{employee.role} - {employee.phone}</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeEmployee(employee.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Salvando..." : "Salvar Informações"}
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}