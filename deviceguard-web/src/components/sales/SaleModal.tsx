"use client";

import { useState } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saleService } from "@/services/sale.service";
import { financingPlanService } from "@/services/financingPlan.service";
import { IDevice, IClient, IFinancingPlan } from "@/types";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import { ShoppingCart01Icon } from "hugeicons-react";

import { Prisma } from "@prisma/client";



import { CreateFinancingPlanModal } from "@/components/sales/CreateFinancingPlanModal";

interface SaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: IDevice[];
  clients: IClient[];
  financingPlans: IFinancingPlan[];
  onSuccess: () => void;
}

export function SaleModal({
  open,
  onOpenChange,
  devices,
  clients,
  financingPlans,
  onSuccess,
}: SaleModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<IFinancingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);

  const activeDevices = devices.filter((d) => d.status === "ACTIVE");

  const handleClose = () => {
    setStep(1);
    setSelectedDevice("");
    setSelectedClient("");
    setAmount("");
    setSelectedPlan(null);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === 1 && selectedDevice && selectedClient && amount) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    if (!selectedDevice || !selectedClient || !amount || !selectedPlan) return;

    try {
      setLoading(true);
      await saleService.create({
        deviceId: selectedDevice,
        clientId: selectedClient,
        totalAmount: parseFloat(amount),
        installments: selectedPlan.installments,
        firstWarningDay: 3,
        secondWarningDay: 5,
        blockDay: 7,
      });
      clientSuccessHandler("Venta registrada exitosamente");
      handleClose();
      onSuccess();
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const amountValue = parseFloat(amount || "0");
  const interestRate = selectedPlan ? Number(selectedPlan.interestRate) : 0;
  const totalWithInterest = selectedPlan
    ? amountValue * (1 + interestRate / 100)
    : 0;
  const monthlyPayment = selectedPlan
    ? totalWithInterest / selectedPlan.installments
    : 0;

  return (
    <GenericModal
      open={open}
      onOpenChange={handleClose}
      title="REGISTRO DE VENTA"
      description="Configuración de financiamiento rápido"
      size="4xl"
      variant="dark"
      footer={
        step === 1 ? (
          <>
            <Button variant="outline" onClick={handleClose} className="border-carbon_black-600 text-white hover:bg-carbon_black-700">
              CANCELAR
            </Button>
            <Button
              className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
              onClick={handleNext}
              disabled={!selectedDevice || !selectedClient || !amount}
            >
              SIGUIENTE PASO
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleBack} className="border-carbon_black-600 text-white hover:bg-carbon_black-700">
              ATRÁS
            </Button>
            <Button variant="outline" onClick={handleClose} className="border-carbon_black-600 text-white hover:bg-carbon_black-700">
              CANCELAR
            </Button>
            <Button
              className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
              onClick={handleSubmit}
              disabled={!selectedPlan || loading}
            >
              {loading ? "PROCESANDO..." : "REGISTRAR VENTA"}
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                1
              </div>
              <p className="text-xs text-mahogany_red mt-2 uppercase">DISPOSITIVO</p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                2
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">FINANCIACIÓN</p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                3
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">RESUMEN</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device" className="text-white">DISPOSITIVO</Label>
            <select
              id="device"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
            >
              <option value="">Seleccione un dispositivo...</option>
              {activeDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} - {device.model || "Sin dispositivo"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client" className="text-white">CLIENTE</Label>
            <select
              id="client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
            >
              <option value="">Seleccione un cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">Precio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mahogany_red text-lg">
                $
              </span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-lg bg-carbon_black border-carbon_black-600 text-white"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                1
              </div>
              <p className="text-xs text-white mt-2 uppercase">DISPOSITIVO</p>
            </div>
            <div className="w-24 h-0.5 bg-mahogany_red" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                2
              </div>
              <p className="text-xs text-mahogany_red mt-2 uppercase">
                FINANCIACIÓN
              </p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                3
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">RESUMEN</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border border-mahogany_red rounded-lg p-6">
                <Label className="text-silver-400 text-xs uppercase">
                  MONTO TOTAL DE VENTA
                </Label>
                <p className="text-5xl font-bold text-white mt-2">
                  $ {amountValue.toFixed(2)}
                </p>
                <p className="text-xs text-silver-400 italic mt-2">
                  BASADO EN: {devices.find((d) => d.id === selectedDevice)?.name || ""}
                </p>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart01Icon size={20} className="text-mahogany_red" />
                    <Label className="text-white uppercase">
                      PLAN DE FINANCIAMIENTO
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatePlanModalOpen(true)}
                    className="text-xs border-mahogany_red text-mahogany_red hover:bg-mahogany_red/10"
                  >
                    + Crear Plan
                  </Button>
                </div>

                {financingPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full p-4 border rounded-lg mb-2 text-left transition-colors ${
                      selectedPlan?.id === plan.id
                        ? "border-mahogany_red bg-mahogany_red/10"
                        : "border-carbon_black-600 hover:border-mahogany_red/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-lg">
                          {plan.installments} Meses
                          {plan.installments === 12 && " (Recomendado)"}
                        </p>
                        <p className="text-sm text-silver-400">
                          Tasa de interés: {Number(plan.interestRate)}% mensual
                        </p>
                      </div>
                      <p className="text-mahogany_red font-bold text-xl">
                        $
                        {(
                          (amountValue * (1 + Number(plan.interestRate) / 100)) /
                          plan.installments
                        ).toFixed(2)}
                        /mes
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  COSTO TOTAL PROYECTADO
                </Label>
                <p className="text-5xl font-bold text-white mt-2">
                  ${totalWithInterest.toFixed(2)}
                </p>
                <p className="text-sm text-mahogany_red mt-1">
                  +{interestRate}% INTERÉS TOTAL
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                  <Label className="text-silver-400 text-xs uppercase">
                    PAGO INICIAL
                  </Label>
                  <p className="text-3xl font-bold text-white mt-2">
                    ${monthlyPayment.toFixed(2)}
                  </p>
                </div>
                <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                  <Label className="text-silver-400 text-xs uppercase">
                    DEPÓSITO SEGURIDAD
                  </Label>
                  <p className="text-3xl font-bold text-white mt-2">
                    ${(monthlyPayment * 0.3).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border border-mahogany_red/50 rounded-lg p-4 bg-mahogany_red/5">
                <div className="flex items-start gap-2">
                  <ShoppingCart01Icon
                    size={20}
                    className="text-mahogany_red mt-1"
                  />
                  <div>
                    <p className="text-sm text-white">
                      El dispositivo quedará bloqueado automáticamente vía{" "}
                      <span className="text-mahogany_red font-bold">
                        DeviceGuard MDM
                      </span>{" "}
                      en caso de mora superior a 72 horas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateFinancingPlanModal
        open={isCreatePlanModalOpen}
        onOpenChange={setIsCreatePlanModalOpen}
        onSuccess={async () => {
          const plansData = await financingPlanService.getAll();
          financingPlans.splice(0, financingPlans.length, ...plansData);
        }}
      />
    </GenericModal>
  );
}
