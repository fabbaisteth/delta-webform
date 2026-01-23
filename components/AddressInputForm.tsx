'use client';

import { useEffect, useRef, useState } from 'react';
import { Location } from '@/types/form';
import { MapPin, Calendar } from 'lucide-react';
import FormHeader from './FormHeader';

interface AddressInputFormProps {
    location: Location;
    onChange: (location: Location) => void;
    title: string;
    showMovingDate?: boolean;
    movingOutDate?: string;
    onMovingOutDateChange?: (date: string) => void;
    movingInDate?: string;
    onMovingInDateChange?: (date: string) => void;
}

declare global {
    interface Window {
        google: typeof google;
        initMap: () => void;
    }
}

export default function AddressInputForm({
    location,
    onChange,
    title,
    showMovingDate = false,
    movingOutDate,
    onMovingOutDateChange,
    movingInDate,
    onMovingInDateChange,
}: AddressInputFormProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [mapsLoaded, setMapsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !window.google) {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                console.warn('Google Maps API key not found. Address autocomplete will not work.');
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setMapsLoaded(true);
            };
            script.onerror = () => {
                console.error('Failed to load Google Maps script');
            };
            document.head.appendChild(script);
        } else if (window.google) {
            setMapsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!mapsLoaded || !window.google?.maps?.places) return;

        if (!autocompleteRef.current && inputRef.current) {
            try {
                autocompleteRef.current = new google.maps.places.Autocomplete(
                    inputRef.current,
                    {
                        componentRestrictions: { country: ['de', 'at', 'ch'] },
                        fields: ['formatted_address', 'address_components', 'geometry'],
                    }
                );

                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current?.getPlace();
                    if (place && place.formatted_address) {
                        const addressComponents = parseAddressComponents(place.address_components || []);
                        if (inputRef.current) {
                            inputRef.current.value = '';
                        }
                        onChange({
                            ...location,
                            address: place.formatted_address,
                            ...addressComponents,
                        });
                    }
                });
            } catch (error) {
                console.error('Error initializing address autocomplete:', error);
            }
        }

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [mapsLoaded]);

    const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]): Partial<Location> => {
        const result: Partial<Location> = {};

        components.forEach((component) => {
            const types = component.types;

            if (types.includes('street_number')) {
                result.house_number = component.long_name;
            } else if (types.includes('route')) {
                result.street_name = component.long_name;
            } else if (types.includes('locality')) {
                result.city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                result.state = component.long_name;
            } else if (types.includes('postal_code')) {
                result.postal_code = component.long_name;
            } else if (types.includes('country')) {
                result.country = component.long_name;
                result.country_code = component.short_name;
            }
        });

        return result;
    };

    return (
        <div className="space-y-6">
            <FormHeader
                title={title}
                icon={<MapPin />}
                iconClassName="w-15 h-15"
            />

            <div className="h-6"></div>

            {/* Main Address Input */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Gib deine Addresse ein</span>
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    className="input input-bordered input-lg w-full"
                    value={location.address}
                    onChange={(e) => onChange({ ...location, address: e.target.value })}
                    placeholder="Adresse hier eingeben"
                    required
                />
            </div>

            {/* Individual Address Fields */}
            <div className="space-y-4">
                {/* Row 1: Straßenname and Hausnummer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Straßenname <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full bg-gray-100 text-gray-600"
                            value={location.street_name || ''}
                            onChange={(e) => onChange({ ...location, street_name: e.target.value })}
                            placeholder="Straßenname"
                            required
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Hausnummer <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full bg-gray-100 text-gray-600"
                            value={location.house_number || ''}
                            onChange={(e) => onChange({ ...location, house_number: e.target.value })}
                            placeholder="Hausnummer"
                            required
                        />
                    </div>
                </div>

                {/* Row 2: Ort and Bundesland */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Ort <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full bg-gray-100 text-gray-600"
                            value={location.city || ''}
                            onChange={(e) => onChange({ ...location, city: e.target.value })}
                            placeholder="Ort"
                            required
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Bundesland <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full bg-gray-100 text-gray-600"
                            value={location.state || ''}
                            onChange={(e) => onChange({ ...location, state: e.target.value })}
                            placeholder="Bundesland"
                            required
                        />
                    </div>
                </div>

                {/* Row 3: Postleitzahl and Land */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Postleitzahl <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full bg-gray-100 text-gray-600"
                            value={location.postal_code || ''}
                            onChange={(e) => onChange({ ...location, postal_code: e.target.value })}
                            placeholder="Postleitzahl"
                            required
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Land <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full bg-gray-100 text-gray-600"
                            value={location.country || ''}
                            onChange={(e) => onChange({ ...location, country: e.target.value })}
                            placeholder="Land"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Date Fields */}
            {showMovingDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {movingOutDate !== undefined && onMovingOutDateChange && (
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Auszug Datum <span className="text-red-500">*</span></span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="input input-bordered w-full pr-10"
                                    value={movingOutDate && movingOutDate.match(/^\d{2}-\d{2}-\d{4}$/)
                                        ? (() => {
                                            const [day, month, year] = movingOutDate.split('-');
                                            return `${year}-${month}-${day}`;
                                        })()
                                        : ''}
                                    onChange={(e) => {
                                        const date = e.target.value;
                                        if (date) {
                                            const [year, month, day] = date.split('-');
                                            onMovingOutDateChange(`${day}-${month}-${year}`);
                                        } else {
                                            onMovingOutDateChange('');
                                        }
                                    }}
                                    required
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            <label className="label">
                                <span className="label-text-alt text-gray-500">
                                    Für ein unverbindliches Angebot reicht zunächst eine grobe Angabe
                                </span>
                            </label>
                        </div>
                    )}

                    {movingInDate !== undefined && onMovingInDateChange && (
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Einzug Datum <span className="text-red-500">*</span></span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="input input-bordered w-full pr-10"
                                    value={movingInDate && movingInDate.match(/^\d{2}-\d{2}-\d{4}$/)
                                        ? (() => {
                                            const [day, month, year] = movingInDate.split('-');
                                            return `${year}-${month}-${day}`;
                                        })()
                                        : ''}
                                    onChange={(e) => {
                                        const date = e.target.value;
                                        if (date) {
                                            const [year, month, day] = date.split('-');
                                            onMovingInDateChange(`${day}-${month}-${year}`);
                                        } else {
                                            onMovingInDateChange('');
                                        }
                                    }}
                                    required
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            <label className="label">
                                <span className="label-text-alt text-gray-500">
                                    Für ein unverbindliches Angebot reicht zunächst eine grobe Angabe
                                </span>
                            </label>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

