import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IDevice, IClient } from "@/types";
import { SALES_MESSAGES } from "@/constants/sales.constant";
import { SearchableSelect } from "@/components/sales/SearchableSelect";
import { DEVICE_TYPE_LABELS } from "@/schemas/device.schema";

interface DeviceSelectionStepProps {
  devices: IDevice[];
  clients: IClient[];
  selectedDevice: string;
  selectedClient: string;
  amount: string;
  onDeviceChange: (deviceId: string) => void;
  onClientChange: (clientId: string) => void;
  onAmountChange: (amount: string) => void;
  onCreateDevice: () => void;
  onCreateClient: () => void;
}

export function DeviceSelectionStep({
  devices,
  clients,
  selectedDevice,
  selectedClient,
  amount,
  onDeviceChange,
  onClientChange,
  onAmountChange,
  onCreateDevice,
  onCreateClient,
}: DeviceSelectionStepProps) {
  const deviceOptions = devices.map((device) => ({
    id: device.id,
    label: device.name,
    sublabel: `${DEVICE_TYPE_LABELS[device.type]} - ${device.model || "Sin modelo"}`,
  }));

  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: client.name,
    sublabel: client.email || "Sin email",
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="device" className="text-white">
          {SALES_MESSAGES.STEPS.DEVICE}
        </Label>
        <SearchableSelect
          value={selectedDevice}
          onChange={onDeviceChange}
          options={deviceOptions}
          placeholder={SALES_MESSAGES.PLACEHOLDERS.SELECT_DEVICE}
          onCreateNew={onCreateDevice}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="client" className="text-white">
          CLIENTE
        </Label>
        <SearchableSelect
          value={selectedClient}
          onChange={onClientChange}
          options={clientOptions}
          placeholder={SALES_MESSAGES.PLACEHOLDERS.SELECT_CLIENT}
          onCreateNew={onCreateClient}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-white">
          VALOR DEL EQUIPO
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mahogany_red text-lg">
            $
          </span>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={SALES_MESSAGES.PLACEHOLDERS.AMOUNT}
            className="pl-8 text-lg bg-carbon_black border-carbon_black-600 text-white"
          />
        </div>
      </div>
    </div>
  );
}
