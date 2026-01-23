'use client';

import { CirclePlus } from 'lucide-react';
import FormHeader from './FormHeader';
import { Location } from '@/types/form';

interface ServicesFormProps {
  fromLocation?: Location;
  toLocation?: Location;
  onFromLocationChange?: (location: Location) => void;
  onToLocationChange?: (location: Location) => void;
}

export default function ServicesForm({
  fromLocation,
  toLocation,
  onFromLocationChange,
  onToLocationChange,
}: ServicesFormProps) {
  return (
    <div className="space-y-6">
      <FormHeader
        title="Extras für Ihren Umzug"
        icon={<CirclePlus />}
        iconClassName="w-25 h-25"
      />

      {/* Halteverbotszone Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Halteverbotszone
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Sollte es vor Ihrer Haustüre keine Parkmöglichkeiten für den LKW geben, ist es notwendig, eine Halteverbotszone bei Ihrer Kommune zu beantragen. Bitte klicken Sie auf Be- oder Entladestelle, wenn wir dies für Sie übernehmen sollen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Beladestelle (Loading Point) */}
            <div
              className={`card bg-white border-2 cursor-pointer transition-all ${fromLocation?.needs_parking_zone
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => {
                if (fromLocation && onFromLocationChange) {
                  onFromLocationChange({
                    ...fromLocation,
                    needs_parking_zone: !fromLocation.needs_parking_zone
                  });
                }
              }}
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="/parking-forbidden.svg"
                    alt="Parking Forbidden"
                    className="w-12 h-12"
                  />
                </div>
                <h4 className="font-semibold text-center mb-2">Beladestelle</h4>
                <div className="text-sm text-gray-600 text-center space-y-1">
                  {fromLocation?.street_name && fromLocation?.house_number && (
                    <div>{fromLocation.street_name} {fromLocation.house_number}</div>
                  )}
                  {fromLocation?.postal_code && fromLocation?.city && (
                    <div>{fromLocation.postal_code} {fromLocation.city}</div>
                  )}
                  {(!fromLocation?.street_name || !fromLocation?.city) && (
                    <div className="text-gray-400">Adresse nicht angegeben</div>
                  )}
                </div>
                {fromLocation?.needs_parking_zone && (
                  <div className="mt-2 text-center">
                    <span className="badge badge-primary">Ausgewählt</span>
                  </div>
                )}
              </div>
            </div>

            {/* Entladestelle (Unloading Point) */}
            <div
              className={`card bg-white border-2 cursor-pointer transition-all ${toLocation?.needs_parking_zone
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => {
                if (toLocation && onToLocationChange) {
                  onToLocationChange({
                    ...toLocation,
                    needs_parking_zone: !toLocation.needs_parking_zone
                  });
                }
              }}
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src="/parking-forbidden.svg"
                    alt="Parking Forbidden"
                    className="w-12 h-12"
                  />
                </div>
                <h4 className="font-semibold text-center mb-2">Entladestelle</h4>
                <div className="text-sm text-gray-600 text-center space-y-1">
                  {toLocation?.street_name && toLocation?.house_number && (
                    <div>{toLocation.street_name} {toLocation.house_number}</div>
                  )}
                  {toLocation?.postal_code && toLocation?.city && (
                    <div>{toLocation.postal_code} {toLocation.city}</div>
                  )}
                  {(!toLocation?.street_name || !toLocation?.city) && (
                    <div className="text-gray-400">Adresse nicht angegeben</div>
                  )}
                </div>
                {toLocation?.needs_parking_zone && (
                  <div className="mt-2 text-center">
                    <span className="badge badge-primary">Ausgewählt</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


