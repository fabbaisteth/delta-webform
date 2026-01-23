'use client';

import { useState, useEffect, useRef } from 'react';
import { catalog, RoomType } from '../types/form';
import FormHeader from './FormHeader';

interface RoomSelectionFormProps {
    onBack: () => void;
    onSave?: (rooms: RoomType[]) => void;
    initialSelectedRooms?: RoomType[]; // Add prop to receive selected rooms from parent
}

const STORAGE_KEY = 'furniture-assembly-state';
const catalogRooms = catalog.rooms;

export default function RoomSelectionForm(props: RoomSelectionFormProps) {
    // Initialize from props if available, otherwise from localStorage
    const [selectedRooms, setSelectedRooms] = useState<RoomType[]>(() => {
        // Prefer props over localStorage
        if (props.initialSelectedRooms && props.initialSelectedRooms.length > 0) {
            return props.initialSelectedRooms;
        }
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.selectedRooms && parsed.selectedRooms.length > 0) {
                        return parsed.selectedRooms;
                    }
                }
            } catch (error) {
                console.error('Error loading furniture assembly state:', error);
            }
        }
        return [];
    });
    const [roomFurniture, setRoomFurniture] = useState<any[]>(() => {
        // Load roomFurniture from localStorage
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.roomFurniture) {
                        return parsed.roomFurniture;
                    }
                }
            } catch (error) {
                console.error('Error loading furniture assembly state:', error);
            }
        }
        return [];
    });

    // Use refs to prevent infinite loop when syncing with props
    const prevInitialRoomsRef = useRef<string>('');
    const selectedRoomsRef = useRef<RoomType[]>(selectedRooms);

    // Keep ref in sync with state
    useEffect(() => {
        selectedRoomsRef.current = selectedRooms;
    }, [selectedRooms]);

    // Sync with parent state when initialSelectedRooms changes (when navigating back)
    useEffect(() => {
        if (props.initialSelectedRooms) {
            const propRoomNames = props.initialSelectedRooms.map(r => r.name).sort().join(',');

            // Only update if props actually changed (not just a re-render with same data)
            if (propRoomNames !== prevInitialRoomsRef.current) {
                prevInitialRoomsRef.current = propRoomNames;
                const currentRoomNames = selectedRoomsRef.current.map(r => r.name).sort().join(',');

                // Only update state if different to avoid unnecessary updates
                if (currentRoomNames !== propRoomNames) {
                    setSelectedRooms(props.initialSelectedRooms);
                }
            }
        }
    }, [props.initialSelectedRooms]); // Only depend on props, not selectedRooms to avoid loop

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    selectedRooms,
                    roomFurniture,
                }));
            } catch (error) {
                console.error('Error saving furniture assembly state:', error);
            }
        }
    }, [selectedRooms, roomFurniture]);

    const toggleRoom = (room: RoomType) => {
        const isSelected = selectedRooms.some(r => r.name === room.name);
        if (isSelected) {
            const newRooms = selectedRooms.filter(r => r.name !== room.name);
            setSelectedRooms(newRooms);
            setRoomFurniture(roomFurniture.filter(rf => rf.room.name !== room.name));
            // Save immediately when toggling
            if (props.onSave) {
                props.onSave(newRooms);
            }
        } else {
            const newRooms = [...selectedRooms, room];
            setSelectedRooms(newRooms);
            // Save immediately when toggling
            if (props.onSave) {
                props.onSave(newRooms);
            }
        }
    };

    // Step 1: Room Selection
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="w-full">
                    <FormHeader
                        title="Räume auswählen"
                        subtitle="Wählen Sie Räume aus und fügen Sie danach Möbel hinzu"
                    />
                </div>
            </div>

            {/* Room Selection Grid */}
            <div className="form-control">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {catalogRooms.map((room) => {
                        const isSelected = selectedRooms.some(r => r.name === room.name);
                        return (
                            <button
                                key={room.name}
                                type="button"
                                onClick={() => toggleRoom(room)}
                                className={`btn h-auto py-4 md:py-6 flex flex-col items-center gap-2 md:gap-3 border-2 transition-all ${isSelected
                                    ? 'btn-primary border-primary shadow-md hover:shadow-lg'
                                    : 'btn-outline border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm'
                                    }`}
                            >
                                <i className={`${room.icon} text-2xl md:text-3xl`}></i>
                                <span className="text-xs md:text-sm font-medium text-center break-words">{room.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}