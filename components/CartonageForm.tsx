'use client';

import { useState } from 'react';
import { Package, Box, Calendar, CheckCircle, Plus, Minus, X, Calculator } from 'lucide-react';
import Dropdown, { DropdownOption } from './Dropdown';
import FormHeader from './FormHeader';

export interface CartonageInfo {
  box_quantity: number; // Number of boxes to transport
  boxes_to_buy: number; // Standard boxes to buy
  boxes_to_rent: number; // Standard boxes to rent
  wardrobe_boxes_to_rent: number; // Wardrobe boxes to rent
  packing_service_quantity: number; // Number of boxes for packing service
  unpacking_service_quantity: number; // Number of boxes for unpacking service
  packing_material_package: string | null; // Selected packing material package
  delivery_date: string; // Delivery date for boxes/materials (DD-MM-YYYY format)
  cartonage_notes: string; // Additional notes about boxes
}

interface CartonageFormProps {
  cartonageInfo: CartonageInfo;
  onCartonageInfoChange: (info: CartonageInfo) => void;
}

export default function CartonageForm({
  cartonageInfo,
  onCartonageInfoChange,
}: CartonageFormProps) {
  const [selectedMode, setSelectedMode] = useState<'buy' | 'rent'>('buy');
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [people, setPeople] = useState<number | undefined>(undefined);
  const [years, setYears] = useState<number | undefined>(undefined);
  const [cellar, setCellar] = useState<string | undefined>(undefined);

  const packingMaterialOptions: DropdownOption<string>[] = [
    { label: '1 bis 2 Zimmer - Wohnung', value: '1-2_rooms' },
    { label: '2 bis 3 Zimmer - Wohnung', value: '2-3_rooms' },
    { label: '3 bis 4 Zimmer - Wohnung', value: '3-4_rooms' },
  ];

  const cellarOptions: DropdownOption<string>[] = [
    { label: 'Nein', value: 'no' },
    { label: 'Ja', value: 'yes' },
  ];

  const handleCalculateRecommended = () => {
    // This would typically calculate based on apartment size or volume
    // For now, we'll set a default value
    const recommended = 0; // Placeholder
    onCartonageInfoChange({ ...cartonageInfo, box_quantity: recommended });
  };

  const handleBuyAllBoxes = () => {
    setSelectedMode('buy');
    onCartonageInfoChange({
      ...cartonageInfo,
      boxes_to_buy: cartonageInfo.box_quantity,
      boxes_to_rent: 0,
      wardrobe_boxes_to_rent: 0,
    });
  };

  const calculateCartonPrediction = (): number => {
    const baseValue = 16;
    const peopleValue = people ?? 0;
    const yearsValue = years ?? 0;
    return baseValue + (peopleValue * 5) + (yearsValue * 2) + (cellar === 'yes' ? 12 : 0);
  };

  const handleApplyPrediction = () => {
    // Validate that both people and years are defined
    if (people === undefined || years === undefined || people < 1 || years < 1) {
      return; // Don't apply if values are invalid
    }
    const prediction = calculateCartonPrediction();
    onCartonageInfoChange({
      ...cartonageInfo,
      box_quantity: prediction
    });
    setShowPredictionModal(false);
  };

  const handleRentAllBoxes = () => {
    setSelectedMode('rent');
    onCartonageInfoChange({
      ...cartonageInfo,
      boxes_to_buy: 0,
      boxes_to_rent: cartonageInfo.box_quantity,
      wardrobe_boxes_to_rent: 0,
    });
  };

  const handlePackUnpackAll = () => {
    const totalBoxes = cartonageInfo.boxes_to_buy + cartonageInfo.boxes_to_rent + cartonageInfo.wardrobe_boxes_to_rent;
    onCartonageInfoChange({
      ...cartonageInfo,
      packing_service_quantity: totalBoxes,
      unpacking_service_quantity: totalBoxes,
    });
  };

  const updateQuantity = (field: keyof CartonageInfo, delta: number) => {
    const currentValue = (cartonageInfo[field] as number) || 0;
    const newValue = Math.max(0, currentValue + delta);
    onCartonageInfoChange({ ...cartonageInfo, [field]: newValue });
  };

  return (
    <div className="space-y-6">
      <FormHeader
        title="Umzugskartons & Verpackung"
        icon={<Package />}
        iconClassName="w-20 h-20"
      />

      {/* Box Quantity Section */}
      <div className="space-y-4">
        <div className="pb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Wie viele Umzugskartons benötigen Sie?
          </h3>
          <div className="flex gap-4 items-end">
            <div className="form-control flex-1">
              <input
                type="number"
                min="0"
                className="input input-bordered w-full"
                value={cartonageInfo.box_quantity || ''}
                onChange={(e) => onCartonageInfoChange({
                  ...cartonageInfo,
                  box_quantity: parseInt(e.target.value) || 0
                })}
                placeholder="Kartonanzahl"
              />
              <button
                type="button"
                onClick={() => setShowPredictionModal(true)}
                className="btn btn-primary border-primary mt-2 w-full sm:w-auto"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Kartonanzahl berechnen
              </button>
            </div>
          </div>
        </div>

        {/* Buy or Rent Boxes Section */}
        <div className="pb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Umzugskartons kaufen oder mieten
          </h3>
          <p className="text-sm text-gray-600">
            Gewünschte Kartonart und Menge auswählen:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box to Buy */}
            <div className="card bg-white border border-gray-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="/carton.png"
                    alt="Carton Box"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <h4 className="font-semibold text-center mb-3">Karton zum Kaufen</h4>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity('boxes_to_buy', -1)}
                    className="btn btn-sm btn-circle btn-outline"
                    disabled={cartonageInfo.boxes_to_buy === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {cartonageInfo.boxes_to_buy || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity('boxes_to_buy', 1)}
                    className="btn btn-sm btn-circle btn-outline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleBuyAllBoxes}
                  className={`w-full btn btn-sm ${selectedMode === 'buy'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                >
                  Alle kaufen
                </button>
              </div>
            </div>

            {/* Box to Rent */}
            <div className="card bg-white border border-gray-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="/recycled_box.jpg"
                    alt="Recycled Box"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <h4 className="font-semibold text-center mb-3">Karton zum Mieten</h4>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity('boxes_to_rent', -1)}
                    className="btn btn-sm btn-circle btn-outline"
                    disabled={cartonageInfo.boxes_to_rent === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {cartonageInfo.boxes_to_rent || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity('boxes_to_rent', 1)}
                    className="btn btn-sm btn-circle btn-outline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRentAllBoxes}
                  className={`w-full btn btn-sm ${selectedMode === 'rent'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                >
                  Alle mieten
                </button>
              </div>
            </div>

            {/* Wardrobe Box to Rent */}
            <div className="card bg-white border border-gray-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="/kleiderbox.jpg"
                    alt="Kleiderbox"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <h4 className="font-semibold text-center mb-3">Kleiderbox zum Mieten</h4>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity('wardrobe_boxes_to_rent', -1)}
                    className="btn btn-sm btn-circle btn-outline"
                    disabled={cartonageInfo.wardrobe_boxes_to_rent === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {cartonageInfo.wardrobe_boxes_to_rent || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity('wardrobe_boxes_to_rent', 1)}
                    className="btn btn-sm btn-circle btn-outline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packing Service Section */}
        <div className="space-y-4 pb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Verpackungsservice
          </h3>
          <p className="text-sm text-gray-600">
            Kartons ({cartonageInfo.packing_service_quantity + cartonageInfo.unpacking_service_quantity})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-white border border-gray-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Box className="w-8 h-8 text-gray-600" />
                  <h4 className="font-semibold">Einpacken</h4>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity('packing_service_quantity', -1)}
                    className="btn btn-sm btn-circle btn-outline"
                    disabled={cartonageInfo.packing_service_quantity === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {cartonageInfo.packing_service_quantity || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity('packing_service_quantity', 1)}
                    className="btn btn-sm btn-circle btn-outline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-white border border-gray-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center gap-3 justify-center mb-3">
                  <Box className="w-8 h-8 text-gray-600" />
                  <h4 className="font-semibold">Auspacken</h4>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateQuantity('unpacking_service_quantity', -1)}
                    className="btn btn-sm btn-circle btn-outline"
                    disabled={cartonageInfo.unpacking_service_quantity === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {cartonageInfo.unpacking_service_quantity || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity('unpacking_service_quantity', 1)}
                    className="btn btn-sm btn-circle btn-outline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePackUnpackAll}
            className="btn btn-sm py-6 px-4 hover:bg-blue-700 hover:text-white text-blue-600 border-blue-600"
          >
            Alle Umzugskartons einpacken und auspacken
          </button>
          <div className="alert bg-yellow-50 border border-yellow-200 text-yellow-900">
            <span className="text-sm">
              Aus versicherungstechnischen Gründen kann der Packservice nur bei gekauften/gemieteten Kartons angeboten werden.
            </span>
          </div>
        </div>

        {/* Packing Material Section */}
        <div className="space-y-4 pb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Verpackungsmaterial auswählen
          </h3>
          <p className="text-sm text-gray-600">
            Bei Bedarf bitte auswählen:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`card bg-white border-2 shadow-sm cursor-pointer transition-all ${cartonageInfo.packing_material_package === '1-2_rooms'
              ? 'border-gray-600 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onCartonageInfoChange({
                ...cartonageInfo,
                packing_material_package: cartonageInfo.packing_material_package === '1-2_rooms' ? null : '1-2_rooms'
              })}
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="/moving_material.png"
                    alt="Einpacken"
                    className="w-full h-32 object-contain"
                  />
                </div>
                <h4 className="font-semibold text-center mb-2">1 bis 2 Zimmer - Wohnung</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 5kg Seidenpapier</li>
                  <li>• 1 Rolle Klebeband</li>
                  <li>• 10m Luftpolsterfolie</li>
                  <li>• 1 Rolle Stretchfolie</li>
                </ul>
              </div>
            </div>

            <div className={`card bg-white border-2 shadow-sm cursor-pointer transition-all ${cartonageInfo.packing_material_package === '2-3_rooms'
              ? 'border-gray-600 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onCartonageInfoChange({
                ...cartonageInfo,
                packing_material_package: cartonageInfo.packing_material_package === '2-3_rooms' ? null : '2-3_rooms'
              })}
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="/moving_material.png"
                    alt="Einpacken"
                    className="w-full h-32 object-contain"
                  />
                </div>
                <h4 className="font-semibold text-center mb-2">2 bis 3 Zimmer - Wohnung</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 5kg Seidenpapier</li>
                  <li>• 1 Rolle Klebeband</li>
                  <li>• 20m Luftpolsterfolie</li>
                  <li>• 1 Rolle Stretchfolie</li>
                </ul>
              </div>
            </div>

            <div className={`card bg-white border-2 shadow-sm cursor-pointer transition-all ${cartonageInfo.packing_material_package === '3-4_rooms'
              ? 'border-gray-600 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onCartonageInfoChange({
                ...cartonageInfo,
                packing_material_package: cartonageInfo.packing_material_package === '3-4_rooms' ? null : '3-4_rooms'
              })}
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="/moving_material.png"
                    alt="Einpacken"
                    className="w-full h-32 object-contain"
                  />
                </div>
                <h4 className="font-semibold text-center mb-2">3 bis 4 Zimmer - Wohnung</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 10kg Seidenpapier</li>
                  <li>• 2 Rollen Klebeband</li>
                  <li>• 50m Luftpolsterfolie</li>
                  <li>• 2 Rollen Stretchfolie</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Date Section */}
        <div className="form-control pb-6">
          <label className="label">
            <span className="label-text">
              Lieferdatum Kartons auswählen:
            </span>
          </label>
          <div className="relative">
            <input
              type="date"
              className="input input-bordered w-half pr-10"
              value={cartonageInfo.delivery_date && cartonageInfo.delivery_date.match(/^\d{2}-\d{2}-\d{4}$/)
                ? (() => {
                  const [day, month, year] = cartonageInfo.delivery_date.split('-');
                  return `${year}-${month}-${day}`;
                })()
                : ''}
              onChange={(e) => {
                const date = e.target.value;
                if (date) {
                  const [year, month, day] = date.split('-');
                  onCartonageInfoChange({ ...cartonageInfo, delivery_date: `${day}-${month}-${year}` });
                } else {
                  onCartonageInfoChange({ ...cartonageInfo, delivery_date: '' });
                }
              }}
            />
          </div>
          <label className="label">
            <span className="label-text-alt text-gray-500">
              Wählen sie hier ein gewünschtes Lieferdatum aus.
            </span>
          </label>
        </div>

        {/* Additional Notes Section */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">
              Gibt es zusätzliche Anmerkungen? <span className="text-gray-500">(optional)</span>
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full "
            rows={4}
            value={cartonageInfo.cartonage_notes || ''}
            onChange={(e) => onCartonageInfoChange({
              ...cartonageInfo,
              cartonage_notes: e.target.value
            })}
            placeholder="Zusätzliche Informationen zu den Umzugskartons"
          />
        </div>
      </div>

      {/* Carton Prediction Modal */}
      {showPredictionModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-100 p-4"
          onClick={() => setShowPredictionModal(false)}
        >
          <div
            className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-2xl w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words pr-2">
                  Kartonrechner
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPredictionModal(false)}
                className="btn btn-sm btn-circle btn-ghost hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Three Inputs in Horizontal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Number of People */}
                <div className="form-control">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={people !== undefined ? people.toString() : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits or empty string
                      if (value === '') {
                        setPeople(undefined);
                      } else if (/^\d+$/.test(value)) {
                        const numValue = parseInt(value);
                        setPeople(numValue);
                      }
                    }}
                    placeholder="Anzahl der Bewohner"
                    className="input input-bordered w-full placeholder:text-xs"
                  />
                </div>

                {/* Number of Years */}
                <div className="form-control">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={years !== undefined ? years.toString() : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits or empty string
                      if (value === '') {
                        setYears(undefined);
                      } else if (/^\d+$/.test(value)) {
                        const numValue = parseInt(value);
                        setYears(numValue);
                      }
                    }}
                    placeholder="Jahre in der Wohnung"
                    className="input input-bordered w-full placeholder:text-xs"
                  />
                </div>

                {/* Cellar Dropdown */}
                <div className="form-control">
                  <select
                    value={cellar || ''}
                    onChange={(e) => setCellar(e.target.value || undefined)}
                    className="select select-bordered w-full text-xs [&>option]:checked:none"
                  >
                    <option value="" disabled>
                      Keller vorhanden?
                    </option>
                    <option value="no">Nein</option>
                    <option value="yes">Ja</option>
                  </select>
                </div>
              </div>

              {/* Prediction Result - Centered */}
              <div className="flex justify-center">
                <div className="p-4 sm:p-6 max-w-md">
                  <div className="flex items-center justify-center gap-3">
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600 text-center">
                        {calculateCartonPrediction()} Kartons
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Package className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPredictionModal(false)}
                  className="btn btn-sm sm:btn-lg btn-outline px-4 sm:px-8 text-sm sm:text-base w-full sm:w-auto"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleApplyPrediction}
                  disabled={people === undefined || years === undefined || people < 1 || years < 1}
                  className="btn btn-sm sm:btn-lg btn-primary px-4 sm:px-8 text-sm sm:text-base w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ergebnis übernehmen
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

