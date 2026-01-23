'use client';

import { useState } from 'react';
import { User, AlertCircle } from 'lucide-react';
import Dropdown, { DropdownOption } from './Dropdown';
import FormHeader from './FormHeader';

interface ContactFormProps {
    customerName: {
        firstName: string;
        lastName: string;
    };
    customerTitle: string;
    customerEmail: string;
    customerPhone: string;
    onCustomerFirstNameChange: (value: string) => void;
    onCustomerLastNameChange: (value: string) => void;
    onCustomerTitleChange: (value: string) => void;
    onCustomerEmailChange: (value: string) => void;
    onCustomerPhoneChange: (value: string) => void;
}

const titleOptions: DropdownOption<string>[] = [
    { label: 'Herr', value: 'Herr' },
    { label: 'Frau', value: 'Frau' },
    { label: 'Divers', value: 'Divers' },
];

// Phone number validation function
const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim().length === 0) return false;

    // Remove common formatting characters (spaces, dashes, parentheses, plus signs)
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

    // Check if it contains only digits (and possibly leading zeros or country codes)
    if (!/^\d+$/.test(cleaned)) return false;

    // Must have at least 6 digits (minimum reasonable phone number length)
    // and at most 15 digits (E.164 maximum)
    const digitCount = cleaned.length;
    return digitCount >= 6 && digitCount <= 15;
};

// Email validation function
const isValidEmail = (email: string): boolean => {
    if (!email || email.trim().length === 0) return false;

    // Basic email regex pattern
    // Allows: local@domain format
    // Local part: letters, numbers, dots, hyphens, underscores, plus signs
    // Domain part: letters, numbers, dots, hyphens
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return emailRegex.test(email.trim());
};

export default function ContactForm({
    customerName,
    customerTitle,
    customerEmail,
    customerPhone,
    onCustomerFirstNameChange,
    onCustomerLastNameChange,
    onCustomerTitleChange,
    onCustomerEmailChange,
    onCustomerPhoneChange,
}: ContactFormProps) {
    const [phoneError, setPhoneError] = useState<string>('');
    const [emailError, setEmailError] = useState<string>('');
    const [hasBlurredPhone, setHasBlurredPhone] = useState(false);
    const [hasBlurredEmail, setHasBlurredEmail] = useState(false);

    const handlePhoneChange = (value: string) => {
        onCustomerPhoneChange(value);
        if (hasBlurredPhone) {
            if (!isValidPhoneNumber(value)) {
                setPhoneError('Bitte geben Sie eine gültige Telefonnummer ein.');
            } else {
                setPhoneError('');
            }
        }
    };

    const handlePhoneBlur = () => {
        setHasBlurredPhone(true);
        if (!isValidPhoneNumber(customerPhone)) {
            setPhoneError('Bitte geben Sie eine gültige Telefonnummer ein.');
        } else {
            setPhoneError('');
        }
    };

    const handleEmailChange = (value: string) => {
        onCustomerEmailChange(value);
        if (hasBlurredEmail) {
            if (!isValidEmail(value)) {
                setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            } else {
                setEmailError('');
            }
        }
    };

    const handleEmailBlur = () => {
        setHasBlurredEmail(true);
        if (!isValidEmail(customerEmail)) {
            setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        } else {
            setEmailError('');
        }
    };

    return (
        <div className="space-y-6">
            <FormHeader
                title="Ihre Kontaktdaten"
                icon={<User />}
                iconClassName="w-15 h-15"
            />
            <div className="space-y-4">

                <div className="form-control w-full sm:w-1/2">
                    <label className="label">
                        <span className="label-text">Anrede <span className="text-red-500">*</span></span>
                    </label>
                    <Dropdown
                        options={titleOptions}
                        value={customerTitle || undefined}
                        onChange={(value) => onCustomerTitleChange(value)}
                        placeholder="Bitte auswählen"
                        required
                    />
                </div>
                {/* Row 1: Vorname and Nachname */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Vorname <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={customerName.firstName}
                            onChange={(e) => onCustomerFirstNameChange(e.target.value)}
                            placeholder="Max"
                            required
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Nachname <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={customerName.lastName}
                            onChange={(e) => onCustomerLastNameChange(e.target.value)}
                            placeholder="Mustermann"
                            required
                        />
                    </div>
                </div>

                {/* Row 2: E-Mail and Telefon */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">E-Mail <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="email"
                            className={`input input-bordered w-full ${emailError ? 'input-error border-red-500' : ''}`}
                            value={customerEmail}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            onBlur={handleEmailBlur}
                            placeholder="max.mustermann@example.com"
                            required
                        />
                        {emailError && (
                            <label className="label">
                                <span className="label-text-alt text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {emailError}
                                </span>
                            </label>
                        )}
                    </div>
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text">Telefon <span className="text-red-500">*</span></span>
                        </label>
                        <input
                            type="tel"
                            className={`input input-bordered w-full ${phoneError ? 'input-error border-red-500' : ''}`}
                            value={customerPhone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            onBlur={handlePhoneBlur}
                            placeholder="+49 123 456 789"
                            required
                        />
                        {phoneError && (
                            <label className="label">
                                <span className="label-text-alt text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {phoneError}
                                </span>
                            </label>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

