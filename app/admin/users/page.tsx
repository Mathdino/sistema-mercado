"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockUser } from "@/lib/mock-data"
import { useOrderStore } from "@/lib/store"
import { formatDate } from "@/lib/currency"
import { Search, Mail, Phone, MapPin } from "lucide-react"

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { orders } = useOrderStore()

  // In a real app, this would fetch from a database
  const users = [mockUser]

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()),
  )

  const getUserOrderCount = (userId: string) => {
    return orders.filter((order) => order.userId === userId).length
  }

  return (
    <AuthGuard requireRole="admin">
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">Gerencie os usuários cadastrados</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuários..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{user.name}</h3>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Cliente desde {formatDate(user.createdAt)}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{user.phone}</span>
                          </div>
                          {user.addresses[0] && (
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              <span>
                                {user.addresses[0].street}, {user.addresses[0].number} -{" "}
                                {user.addresses[0].neighborhood}, {user.addresses[0].city}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{getUserOrderCount(user.id)}</p>
                        <p className="text-xs text-muted-foreground">Pedidos</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Nenhum usuário encontrado</div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
