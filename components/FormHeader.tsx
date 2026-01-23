'use client';

import { ReactNode, cloneElement, isValidElement } from 'react';

interface FormHeaderProps {
    title: string | ReactNode;
    subtitle?: string;
    icon?: ReactNode;
    iconClassName?: string;
    dividerLabel?: string; // Label to show in divider (if different from title)
    className?: string;
}

export default function FormHeader({
    title,
    subtitle,
    icon,
    iconClassName = 'w-15 h-15',
    dividerLabel,
    className = ''
}: FormHeaderProps) {
    const iconWithClassName = icon && isValidElement(icon)
        ? cloneElement(icon as React.ReactElement<any>, { className: iconClassName })
        : icon;

    return (
        <div className={className}>
            {icon && (
                <div className="divider">
                    {iconWithClassName}
                    {dividerLabel || title}
                </div>
            )}
            {!icon && (
                <div className={subtitle ? 'space-y-2' : ''}>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 break-words">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-gray-600 text-xs sm:text-sm break-words">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}
            {/* Only show title below divider if dividerLabel is provided (meaning divider label differs from title) */}
            {icon && dividerLabel && (
                <div className={subtitle ? 'space-y-2 mt-2' : ''}>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 break-words">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-gray-600 text-xs sm:text-sm break-words">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}
            {/* Show subtitle below divider when no dividerLabel but subtitle exists */}
            {icon && !dividerLabel && subtitle && (
                <p className="text-gray-600 text-xs sm:text-sm mt-2 break-words">
                    {subtitle}
                </p>
            )}
        </div>
    );
}

