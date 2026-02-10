"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  SmartPhone01Icon,
  DollarCircleIcon,
  Tired01Icon,
  Download01Icon,
  Search01Icon,
  MoreVerticalIcon,
} from "hugeicons-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@prisma/client";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

  return (
    <DashboardLayout>
      <div className="p-8 bg-onyx min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-wide">
              {isSuperAdmin ? "GESTIÓN DE ORGANIZACIONES" : "MI ORGANIZACIÓN"}
            </h1>
            <p className="text-silver-400 mt-1">
              Control centralizado de clientes y suscripciones corporativas
            </p>
          </div>
          {isSuperAdmin && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="gap-2 border-silver-400 text-white hover:bg-carbon_black"
              >
                <Download01Icon size={16} />
                Exportar Reporte
              </Button>
              <Button className="gap-2 bg-mahogany_red hover:bg-mahogany_red-600 text-white">
                <span className="text-lg">+</span>
                Nueva Organización
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="TOTAL DISPOSITIVOS"
            value="12,482"
            trend={{ value: "+8.4% este mes", isPositive: true }}
            icon={SmartPhone01Icon}
            iconColor="bg-mahogany_red"
          />
          <StatCard
            title="INGRESOS GLOBALES"
            value="$142,500.00"
            subtitle="MRR ACTUAL"
            icon={DollarCircleIcon}
            iconColor="bg-mahogany_red"
          />
          <StatCard
            title="TASA DE RECUPERACIÓN"
            value="94.2%"
            trend={{ value: "-1.2% v. anterior", isPositive: false }}
            icon={Tired01Icon}
            iconColor="bg-mahogany_red"
          />
        </div>

        <Card className="border-carbon_black-600 shadow-sm bg-carbon_black">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search01Icon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-400"
                />
                <Input
                  placeholder="Buscar por empresa o administrador..."
                  className="pl-10 bg-onyx-600 border-carbon_black-700 text-white placeholder:text-silver-400 focus:border-mahogany_red focus:ring-mahogany_red"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-silver-400 uppercase tracking-wide">
                  FILTRAR POR PLAN:
                </span>
                <select className="px-3 py-2 bg-onyx-600 border border-carbon_black-700 rounded-lg text-sm text-white focus:border-mahogany_red focus:ring-mahogany_red">
                  <option>Todos los planes</option>
                  <option>Enterprise</option>
                  <option>Pro</option>
                  <option>Starter</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-carbon_black-700 text-left text-xs text-silver-400 uppercase tracking-wide">
                    <th className="pb-3 font-medium">EMPRESA / ADMIN</th>
                    <th className="pb-3 font-medium">DISPOSITIVOS TOTALES</th>
                    <th className="pb-3 font-medium">SUSCRIPCIÓN</th>
                    <th className="pb-3 font-medium">ÚTLIMA ACTIVIDAD</th>
                    <th className="pb-3 font-medium">NIVEL DE RIESGO</th>
                    <th className="pb-3 font-medium">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ORGANIZATIONS.map((org) => (
                    <tr
                      key={org.id}
                      className="border-b border-carbon_black-700 hover:bg-onyx-600 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-onyx-600 border border-mahogany_red rounded-lg flex items-center justify-center font-semibold text-mahogany_red">
                            {org.initials}
                          </div>
                          <div>
                            <p className="font-medium text-white">{org.name}</p>
                            <p className="text-sm text-silver-400">
                              Admin: {org.admin}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-medium text-white">
                          {org.devices.toLocaleString()}
                        </p>
                        <p className="text-sm text-silver-400">dispositivos</p>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded border text-xs font-medium uppercase tracking-wide ${
                            org.plan === "ENTERPRISE"
                              ? "border-mahogany_red text-mahogany_red"
                              : org.plan === "PRO"
                                ? "border-strawberry_red text-strawberry_red"
                                : "border-silver-400 text-silver-400"
                          }`}
                        >
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-silver-400">
                        {org.lastActivity}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-1 w-12 rounded-full ${
                              org.risk === "BAJO"
                                ? "bg-dark_garnet-700"
                                : org.risk === "MEDIO"
                                  ? "bg-strawberry_red"
                                  : "bg-mahogany_red"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium uppercase tracking-wide ${
                              org.risk === "BAJO"
                                ? "text-dark_garnet-700"
                                : org.risk === "MEDIO"
                                  ? "text-strawberry_red"
                                  : "text-mahogany_red"
                            }`}
                          >
                            {org.risk}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <button className="p-2 hover:bg-onyx-600 rounded-lg transition-colors">
                          <MoreVerticalIcon
                            size={16}
                            className="text-silver-400"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-carbon_black-700">
              <p className="text-sm text-silver-400 uppercase tracking-wide">
                MOSTRANDO 4 DE 128 ORGANIZACIONES
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-carbon_black-700 text-silver-400 hover:bg-onyx-600 uppercase tracking-wide"
                >
                  ANTERIOR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-carbon_black-700 text-white hover:bg-onyx-600 uppercase tracking-wide"
                >
                  SIGUIENTE
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

const MOCK_ORGANIZATIONS = [
  {
    id: "1",
    name: "TechLogistics S.A.",
    initials: "TL",
    admin: "Roberto Méndez",
    devices: 1250,
    plan: "ENTERPRISE",
    lastActivity: "Hace 15 min",
    risk: "BAJO",
  },
  {
    id: "2",
    name: "Retail Solutions",
    initials: "RS",
    admin: "Lucía Torres",
    devices: 432,
    plan: "PRO",
    lastActivity: "Ayer, 14:20",
    risk: "CRÍTICO",
  },
  {
    id: "3",
    name: "FastCorp Int.",
    initials: "FC",
    admin: "Kevin Smith",
    devices: 85,
    plan: "STARTER",
    lastActivity: "Hace 3 horas",
    risk: "MEDIO",
  },
  {
    id: "4",
    name: "Delivery Masters",
    initials: "DM",
    admin: "Carlos Ruiz",
    devices: 3120,
    plan: "ENTERPRISE",
    lastActivity: "Hace 5 min",
    risk: "BAJO",
  },
];
