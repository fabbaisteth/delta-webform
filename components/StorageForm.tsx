'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { StorageInfo, Location } from '@/types/form';
import Dropdown, { DropdownOption } from './Dropdown';
import FormHeader from './FormHeader';

interface StorageFormProps {
    storageInfo: StorageInfo;
    movingOutDate: string;
    movingInDate: string;
    toLocation: Location;
    onStorageInfoChange: (storageInfo: StorageInfo) => void;
}

declare global {
    interface Window {
        google: typeof google;
        initMap: () => void;
    }
}

export default function StorageForm({
    storageInfo,
    movingOutDate,
    movingInDate,
    toLocation,
    onStorageInfoChange,
}: StorageFormProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [mapsLoaded, setMapsLoaded] = useState(false);

    useEffect(() => {
        // Load Google Maps script
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

        // Initialize Address Autocomplete
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
                        // Clear the main address input since individual fields are now populated
                        if (inputRef.current) {
                            inputRef.current.value = '';
                        }
                        onStorageInfoChange({
                            ...storageInfo,
                            retrieval_address: {
                                ...storageInfo.retrieval_address,
                                address: '',
                                ...addressComponents,
                            },
                        });
                    }
                });
            } catch (error) {
                console.error('Error initializing address autocomplete:', error);
            }
        }

        // Cleanup function
        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [mapsLoaded]);

    // Helper function to parse Google Maps address components
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

    const yesNoOptions: DropdownOption<boolean>[] = [
        { label: 'Ja', value: true },
        { label: 'Nein', value: false },
    ];

    const wantsStorage = storageInfo.wants_storage === true;
    const isDisabled = !wantsStorage;

    return (
        <div className="space-y-6">
            <FormHeader
                title="Umzugszeitraum"
                icon={<MapPin />}
                iconClassName="w-15 h-15"
            />

            {/* Storage Question */}
            <div className="form-control pt-8">
                <label className="label">
                    <span className="label-text">
                        Möchten Sie Ihre Sachen einlagern? <span className="text-red-500">*</span>
                    </span>
                </label>
                <Dropdown
                    options={yesNoOptions}
                    value={storageInfo.wants_storage ?? undefined}
                    onChange={(value) => {
                        const newStorageInfo = { ...storageInfo, wants_storage: value };
                        // If they select "no", clear all other fields
                        if (value === false) {
                            newStorageInfo.move_out_matches_storage_date = null;
                            newStorageInfo.move_in_matches_retrieval_date = null;
                            newStorageInfo.retrieval_address_matches_move_in = null;
                            newStorageInfo.storage_date = '';
                            newStorageInfo.retrieval_date = '';
                            newStorageInfo.retrieval_address = {
                                address: '',
                                object_type: 'Wohnung',
                                floor: 0,
                                living_space_m2: 0,
                                has_elevator: false,
                                needs_parking_zone: false,
                                walkway_m: 0,
                            };
                        }
                        onStorageInfoChange(newStorageInfo);
                    }}
                    placeholder="Bitte wählen"
                    required
                />
            </div>

            {/* Three Yes/No Questions */}
            <div className={`space-y-4 ${isDisabled ? 'hidden' : ''}`}>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">
                            Entspricht ihr Auszugsdatum dem Einlagerungsdatum? <span className="text-red-500">*</span>
                        </span>
                    </label>
                    <Dropdown
                        options={yesNoOptions}
                        value={storageInfo.move_out_matches_storage_date ?? undefined}
                        onChange={(value) => onStorageInfoChange({ ...storageInfo, move_out_matches_storage_date: value })}
                        placeholder="Bitte wählen"
                        required={wantsStorage}
                        disabled={isDisabled}
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">
                            Entspricht ihr Einzugsdatum dem Auslagerungsdatum? <span className="text-red-500">*</span>
                        </span>
                    </label>
                    <Dropdown
                        options={yesNoOptions}
                        value={storageInfo.move_in_matches_retrieval_date ?? undefined}
                        onChange={(value) => onStorageInfoChange({ ...storageInfo, move_in_matches_retrieval_date: value })}
                        placeholder="Bitte wählen"
                        required={wantsStorage}
                        disabled={isDisabled}
                    />
                </div>
            </div>

            {/* Date Fields */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isDisabled ? 'hidden' : ''}`}>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">
                            Datum der Einlagerung <span className="text-red-500">*</span>
                        </span>
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            className="input input-bordered w-full pr-10"
                            value={storageInfo.storage_date && storageInfo.storage_date.match(/^\d{2}-\d{2}-\d{4}$/)
                                ? (() => {
                                    const [day, month, year] = storageInfo.storage_date.split('-');
                                    return `${year}-${month}-${day}`;
                                })()
                                : ''}
                            onChange={(e) => {
                                const date = e.target.value;
                                if (date) {
                                    const [year, month, day] = date.split('-');
                                    onStorageInfoChange({ ...storageInfo, storage_date: `${day}-${month}-${year}` });
                                } else {
                                    onStorageInfoChange({ ...storageInfo, storage_date: '' });
                                }
                            }}
                            required={wantsStorage}
                            disabled={isDisabled}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">
                            Datum der Auslagerung <span className="text-red-500">*</span>
                        </span>
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            className="input input-bordered w-full pr-10"
                            value={storageInfo.retrieval_date && storageInfo.retrieval_date.match(/^\d{2}-\d{2}-\d{4}$/)
                                ? (() => {
                                    const [day, month, year] = storageInfo.retrieval_date.split('-');
                                    return `${year}-${month}-${day}`;
                                })()
                                : ''}
                            onChange={(e) => {
                                const date = e.target.value;
                                if (date) {
                                    const [year, month, day] = date.split('-');
                                    onStorageInfoChange({ ...storageInfo, retrieval_date: `${day}-${month}-${year}` });
                                } else {
                                    onStorageInfoChange({ ...storageInfo, retrieval_date: '' });
                                }
                            }}
                            required={wantsStorage}
                            disabled={isDisabled}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Retrieval Address Section */}
            <div className={`space-y-6 ${isDisabled ? 'hidden' : ''}`}>
                <div className="divider">
                    <span>
                        Adresse, an die wir nach Auslagerung liefern <span className="text-red-500">*</span>
                    </span>
                </div>

                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={storageInfo.retrieval_address_matches_move_in === true}
                            onChange={(e) => {
                                const matchesMoveIn = e.target.checked;
                                onStorageInfoChange({
                                    ...storageInfo,
                                    retrieval_address_matches_move_in: matchesMoveIn,
                                    retrieval_address: matchesMoveIn ? toLocation : {
                                        address: '',
                                        object_type: 'Wohnung',
                                        floor: 0,
                                        living_space_m2: 0,
                                        has_elevator: false,
                                        needs_parking_zone: false,
                                        walkway_m: 0,
                                    }
                                });
                            }}
                            disabled={isDisabled}
                        />
                        <span className="label-text">
                            Adresse entspricht meiner Einzugsadresse
                        </span>
                    </label>
                </div>

                {/* Main Address Input */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Gib deine Addresse ein</span>
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        className="input input-bordered input-lg w-full"
                        value={storageInfo.retrieval_address.address}
                        onChange={(e) => onStorageInfoChange({
                            ...storageInfo,
                            retrieval_address: { ...storageInfo.retrieval_address, address: e.target.value }
                        })}
                        placeholder="Adresse hier eingeben"
                        required={wantsStorage}
                        disabled={isDisabled}
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
                                value={storageInfo.retrieval_address.street_name || ''}
                                onChange={(e) => onStorageInfoChange({
                                    ...storageInfo,
                                    retrieval_address: { ...storageInfo.retrieval_address, street_name: e.target.value }
                                })}
                                placeholder="Straßenname"
                                required={wantsStorage}
                                disabled={isDisabled}
                            />
                        </div>
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Hausnummer <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full bg-gray-100 text-gray-600"
                                value={storageInfo.retrieval_address.house_number || ''}
                                onChange={(e) => onStorageInfoChange({
                                    ...storageInfo,
                                    retrieval_address: { ...storageInfo.retrieval_address, house_number: e.target.value }
                                })}
                                placeholder="Hausnummer"
                                required={wantsStorage}
                                disabled={isDisabled}
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
                                value={storageInfo.retrieval_address.city || ''}
                                onChange={(e) => onStorageInfoChange({
                                    ...storageInfo,
                                    retrieval_address: { ...storageInfo.retrieval_address, city: e.target.value }
                                })}
                                placeholder="Ort"
                                required={wantsStorage}
                                disabled={isDisabled}
                            />
                        </div>
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Bundesland <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full bg-gray-100 text-gray-600"
                                value={storageInfo.retrieval_address.state || ''}
                                onChange={(e) => onStorageInfoChange({
                                    ...storageInfo,
                                    retrieval_address: { ...storageInfo.retrieval_address, state: e.target.value }
                                })}
                                placeholder="Bundesland"
                                required={wantsStorage}
                                disabled={isDisabled}
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
                                value={storageInfo.retrieval_address.postal_code || ''}
                                onChange={(e) => onStorageInfoChange({
                                    ...storageInfo,
                                    retrieval_address: { ...storageInfo.retrieval_address, postal_code: e.target.value }
                                })}
                                placeholder="Postleitzahl"
                                required={wantsStorage}
                                disabled={isDisabled}
                            />
                        </div>
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Land <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full bg-gray-100 text-gray-600"
                                value={storageInfo.retrieval_address.country || ''}
                                onChange={(e) => onStorageInfoChange({
                                    ...storageInfo,
                                    retrieval_address: { ...storageInfo.retrieval_address, country: e.target.value }
                                })}
                                placeholder="Land"
                                required={wantsStorage}
                                disabled={isDisabled}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

