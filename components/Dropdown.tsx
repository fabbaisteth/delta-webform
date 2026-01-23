'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption<T = string | number | boolean> {
    label: string;
    value: T;
}

interface DropdownProps<T = string | number | boolean> {
    options: DropdownOption<T>[];
    value: T | undefined;
    onChange: (value: T) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    displayValue?: (value: T) => string;
}

export default function Dropdown<T = string | number | boolean>({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    disabled = false,
    required = false,
    displayValue,
}: DropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getDisplayText = (): string => {
        if (value === undefined || value === null || value === '') {
            return placeholder;
        }
        if (displayValue) {
            return displayValue(value);
        }
        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption ? selectedOption.label : placeholder;
    };

    const handleSelect = (optionValue: T) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                className={`input input-bordered w-full text-left pr-2 flex items-center justify-between text-xs ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span className={`min-w-0 flex-1 ${value === undefined || value === null || value === '' ? 'text-gray-400' : ''}`}>
                    {getDisplayText()}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isOpen && !disabled && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map((option, index) => {
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={index}
                                type="button"
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors ${isSelected ? 'bg-gray-100 text-black font-semibold' : ''
                                    }`}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

