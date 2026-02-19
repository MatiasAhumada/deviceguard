"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { saleService } from "@/services/sale.service";
import { deviceService } from "@/services/device.service";
import { clientService } from "@/services/client.service";
import { financingPlanService } from "@/services/financingPlan.service";
import { ISale, IDevice, IClient, IFinancingPlan } from "@/types";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import { Download01Icon, ShoppingCart01Icon } from "hugeicons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { SaleModal } from "@/components/sales/SaleModal";

export default function SalesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sales, setSales] = useState<ISale[]>([]);
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [clients, setClients] = useState<IClient[]>([]);
  const [financingPlans, setFinancingPlans] = useState<IFinancingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSales(debouncedSearch || undefined);
  }, [debouncedSearch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesData, clientsData, plansData] = await Promise.all([
        deviceService.getAll(),
        clientService.getAll(),
        financingPlanService.getAll(),
      ]);
      setDevices(devicesData);
      setClients(clientsData);
      setFinancingPlans(plansData);
      setSales([]);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async (search?: string) => {
    try {
      setLoading(true);
      setSales([]);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSaleCreated = async () => {
    await loadData();
    setIsModalOpen(false);
  };

  const todaySales = sales.filter(
    (sale) =>
      new Date(sale.createdAt).toDateString() === new Date().toDateString()
  );
  const todayTotal = todaySales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount),
    0
  );
  const newDevicesCount = devices.filter((d) => d.status === "ACTIVE").length;
  const pendingPayments = 14;
  const avgTicket = sales.length > 0 ? todayTotal / sales.length : 0;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 bg-onyx min-h-screen space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-carbon_black border border-carbon_black-600 rounded-lg p-6">
            <p className="text-xs text-silver-400 uppercase tracking-wide mb-2">
              VENTAS HOY
            </p>
            <p className="text-3xl font-bold text-white">
              ${todayTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-carbon_black border border-carbon_black-600 rounded-lg p-6">
            <p className="text-xs text-silver-400 uppercase tracking-wide mb-2">
              DISPOSITIVOS NUEVOS
            </p>
            <p className="text-3xl font-bold text-white">{newDevicesCount}</p>
            <p className="text-xs text-silver-400 mt-1">+12% vs ayer</p>
          </div>
          <div className="bg-carbon_black border border-carbon_black-600 rounded-lg p-6">
            <p className="text-xs text-silver-400 uppercase tracking-wide mb-2">
              PENDIENTES DE PAGO
            </p>
            <p className="text-3xl font-bold text-mahogany_red">
              {pendingPayments}
            </p>
            <p className="text-xs text-silver-400 mt-1">Requieren atención</p>
          </div>
          <div className="bg-carbon_black border border-carbon_black-600 rounded-lg p-6">
            <p className="text-xs text-silver-400 uppercase tracking-wide mb-2">
              TICKET PROMEDIO
            </p>
            <p className="text-3xl font-bold text-white">
              ${avgTicket.toFixed(2)}
            </p>
            <p className="text-xs text-silver-400 mt-1">Últimos 30 días</p>
          </div>
        </div>

        <DataTable
          title="TABLA DE REGISTRO DE VENTAS"
          subtitle="Registro histórico de transacciones y activaciones de licencias"
          columns={[
            {
              key: "client",
              label: "CLIENTE / ID DISPOSITIVO",
              render: (sale: ISale) => {
                const initials = sale.client.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border rounded-lg flex items-center justify-center font-semibold bg-onyx-600 border-mahogany_red text-mahogany_red">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {sale.client.name}
                      </p>
                      <p className="text-sm text-silver-400">
                        SN: {sale.device.serialNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "amount",
              label: "MONTO TOTAL",
              render: (sale: ISale) => (
                <div>
                  <p className="font-medium text-white">
                    ${Number(sale.totalAmount).toFixed(2)}
                  </p>
                  <p className="text-sm text-silver-400">Pago Único</p>
                </div>
              ),
            },
            {
              key: "plan",
              label: "PLAN DE FINANCIAMIENTO",
              render: (sale: ISale) => {
                const installmentCount = sale.installments || 1;
                return (
                  <div className="inline-block px-3 py-1 bg-onyx-600 border border-carbon_black-700 rounded text-sm text-white">
                    {installmentCount === 1
                      ? "CONTADO"
                      : `${installmentCount} MESES`}
                  </div>
                );
              },
            },
            {
              key: "date",
              label: "FECHA VENTA",
              render: (sale: ISale) => (
                <p className="text-sm text-white">
                  {new Date(sale.createdAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              ),
            },
            {
              key: "status",
              label: "ESTADO DE VENTA",
              render: (sale: ISale) => {
                const statusConfig = {
                  COMPLETADO: { color: "text-green-500", label: "COMPLETADO" },
                  PENDIENTE_PAGO: {
                    color: "text-strawberry_red",
                    label: "PENDIENTE PAGO",
                  },
                  EN_REVISION: { color: "text-yellow-500", label: "EN REVISIÓN" },
                };
                const status =
                  sale.device.status === "SOLD_SYNCED"
                    ? "COMPLETADO"
                    : "PENDIENTE_PAGO";
                const config = statusConfig[status];
                return (
                  <p className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                  </p>
                );
              },
            },
            {
              key: "actions",
              label: "DETALLE",
              render: () => (
                <button className="p-2 hover:bg-mahogany_red/20 rounded-lg transition-colors border border-transparent hover:border-mahogany_red">
                  <ShoppingCart01Icon size={20} className="text-silver-400" />
                </button>
              ),
            },
          ]}
          data={sales}
          keyExtractor={(sale: ISale) => sale.id}
          emptyMessage="No hay ventas registradas"
          loading={loading}
          searchPlaceholder="Buscar venta por cliente o ID de dispositivo..."
          onSearch={handleSearch}
          totalLabel={`REGISTROS: ${sales.length} | PÁGINA 1 DE ${Math.ceil(sales.length / 10)}`}
          actions={
            <>
              <Button
                variant="outline"
                className="gap-2 border-silver-400 text-white hover:bg-carbon_black flex-1 sm:flex-none text-sm"
              >
                <Download01Icon size={16} />
                <span className="hidden sm:inline">Exportar CSV</span>
              </Button>
              <Button
                className="gap-2 bg-mahogany_red hover:bg-mahogany_red-600 flex-1 sm:flex-none text-sm"
                onClick={() => setIsModalOpen(true)}
              >
                <ShoppingCart01Icon size={16} className="text-white" />
                <span className="text-white">Nueva Venta</span>
              </Button>
            </>
          }
        />

        <SaleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          devices={devices}
          clients={clients}
          financingPlans={financingPlans}
          onSuccess={handleSaleCreated}
        />
      </div>
    </DashboardLayout>
  );
}
