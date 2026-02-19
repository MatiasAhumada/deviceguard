"use client";

import { useState } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financingPlanService } from "@/services/financingPlan.service";
import { createFinancingPlanSchema } from "@/schemas/financingPlan.schema";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";

interface CreateFinancingPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateFinancingPlanModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateFinancingPlanModalProps) {
  const [name, setName] = useState("");
  const [installments, setInstallments] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setName("");
    setInstallments("");
    setInterestRate("");
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const result = createFinancingPlanSchema.safeParse({
      name,
      installments: parseInt(installments),
      interestRate: parseFloat(interestRate),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);
      await financingPlanService.create(result.data);
      clientSuccessHandler("Plan de financiamiento creado exitosamente");
      handleClose();
      onSuccess();
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={handleClose}
      title="Nuevo Plan de Financiamiento"
      description="Crear un plan de financiamiento personalizado"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Plan"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Plan</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            placeholder="Ej: Plan 12 Meses"
            className={
              errors.name
                ? "border-mahogany_red focus:border-mahogany_red focus:ring-mahogany_red"
                : ""
            }
          />
          {errors.name && (
            <p className="text-xs text-mahogany_red">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="installments">Número de Cuotas</Label>
          <Input
            id="installments"
            type="number"
            value={installments}
            onChange={(e) => {
              setInstallments(e.target.value);
              if (errors.installments)
                setErrors({ ...errors, installments: "" });
            }}
            placeholder="Ej: 12"
            className={
              errors.installments
                ? "border-mahogany_red focus:border-mahogany_red focus:ring-mahogany_red"
                : ""
            }
          />
          {errors.installments && (
            <p className="text-xs text-mahogany_red">{errors.installments}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestRate">Tasa de Interés (%)</Label>
          <Input
            id="interestRate"
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => {
              setInterestRate(e.target.value);
              if (errors.interestRate)
                setErrors({ ...errors, interestRate: "" });
            }}
            placeholder="Ej: 2.5"
            className={
              errors.interestRate
                ? "border-mahogany_red focus:border-mahogany_red focus:ring-mahogany_red"
                : ""
            }
          />
          {errors.interestRate && (
            <p className="text-xs text-mahogany_red">{errors.interestRate}</p>
          )}
        </div>
      </div>
    </GenericModal>
  );
}
