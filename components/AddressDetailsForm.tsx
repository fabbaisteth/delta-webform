'use client';

import { useState } from 'react';
import { Location } from '@/types/form';
import { Info } from 'lucide-react';
import FormHeader from './FormHeader';
import Dropdown from './Dropdown';

interface AddressDetailsFormProps {
    location: Location;
    onChange: (location: Location) => void;
    title: string;
}

export default function AddressDetailsForm({
    location,
    onChange,
    title,
}: AddressDetailsFormProps) {
    const [showAllFloors, setShowAllFloors] = useState(false);
    const walkwayOptions = [
        { label: '0m', value: 0 },
        { label: '10m', value: 10 },
        { label: '20m', value: 20 },
        { label: '30m', value: 30 },
        { label: '40m', value: 40 },
        { label: '50m+', value: 50 },
    ];

    const walkwayValue = walkwayOptions.find(option => option.value === location.walkway_m);

    const floorOptions = showAllFloors
        ? ['EG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']
        : ['EG', '1', '2', '3', '4'];

    return (
        <div className="space-y-6">
            <FormHeader title={title} />

            {/* Wie werden Sie wohnen? */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Art der Wohnung<span className="text-red-500">*</span></span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                        { label: 'Wohnung', value: 'Wohnung' as const },
                        { label: 'Haus', value: 'Haus' as const },
                    ].map((option) => {
                        const isSelected = location.object_type === option.value;
                        return (
                            <button
                                key={option.label}
                                type="button"
                                onClick={() => onChange({ ...location, object_type: option.value })}
                                className={`btn h-auto py-4 border-2 transition-all ${isSelected
                                    ? 'btn-primary border-primary'
                                    : 'btn-outline border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* In welchem Stock werden Sie wohnen? - Only show for Wohnung (apartment/flat) */}
            {location.object_type === 'Wohnung' && (
                <div className="form-control">
                    <label className="label">
                        <span className="label-text flex items-center gap-2">
                            In welchem Stockwerk befindet sich die Wohnung? <span className="text-red-500">*</span>
                            <div className="tooltip" data-tip="Information about floor selection">
                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            </div>
                        </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {floorOptions.map((floor) => (
                            <button
                                key={floor}
                                type="button"
                                onClick={() => {
                                    const floorValue = floor === 'EG' ? 0 : floor === '10+' ? 10 : parseInt(floor);
                                    onChange({ ...location, floor: floorValue });
                                }}
                                className={`btn h-auto py-4 border-2 transition-all ${location.floor === (floor === 'EG' ? 0 : floor === '10+' ? 10 : parseInt(floor))
                                    ? 'btn-primary border-primary hover:border-primary/90'
                                    : 'btn-outline border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {floor}
                            </button>
                        ))}
                        {!showAllFloors && (
                            <button
                                type="button"
                                onClick={() => setShowAllFloors(true)}
                                className="btn h-auto py-4 border-2 btn-outline border-gray-300 hover:border-gray-400"
                            >
                                Alles anzeigen
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Gibt es einen Aufzug? */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text flex items-center gap-2">
                        Gibt es einen Aufzug?<span className="text-red-500">*</span>
                        <div className="tooltip" data-tip="Information about elevator">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </div>
                    </span>
                </label>
                <div className="flex gap-4">
                    {[
                        { label: 'Ja', value: true },
                        { label: 'Nein', value: false },
                    ].map((option) => {
                        const isSelected = location.has_elevator === option.value;
                        return (
                            <button
                                key={option.label}
                                type="button"
                                onClick={() => onChange({ ...location, has_elevator: option.value })}
                                className={`btn flex-1 h-auto py-4 border-2 transition-all ${isSelected
                                    ? 'btn-primary border-primary'
                                    : 'btn-outline border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Wohnfläche - Only show for moving-out address (Auszugsadresse), not for moving-in address (Einzugsadresse) */}
            {!title.includes('Einzugsadresse') && (
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Wohnfläche (m²) <span className="text-red-500">*</span></span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="input input-bordered w-full"
                        value={location.living_space_m2 || ''}
                        onChange={(e) => onChange({ ...location, living_space_m2: parseFloat(e.target.value) || 0 })}
                        placeholder="z.B. 80"
                        required
                    />
                </div>
            )}

            {/* Laufweg */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text flex items-center gap-2">
                        Distanz zum Hauseingang (m)<span className="text-red-500">*</span>
                        <div className="tooltip" data-tip="Entfernung vom LKW-Parkplatz zum Hauseingang">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </div>
                    </span>
                </label>
                <Dropdown
                    options={walkwayOptions}
                    value={location.walkway_m !== undefined ? location.walkway_m : undefined}
                    onChange={(value) => onChange({ ...location, walkway_m: value as number })}
                    placeholder="Bitte wählen"
                />
            </div>
        </div>
    );
}

