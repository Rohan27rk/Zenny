interface ZennyLogoProps {
    size?: number;
    className?: string;
}

// Minimal Z monogram — clean geometric Z with upward arrow on bottom stroke
export function ZennyLogo({ size = 24, className = '' }: ZennyLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Top bar of Z */}
            <path d="M5 6 H19" stroke="white" strokeWidth="2.3" strokeLinecap="round" />
            {/* Diagonal of Z */}
            <path d="M19 6 L5 18" stroke="white" strokeWidth="2.3" strokeLinecap="round" />
            {/* Bottom bar of Z (shortened to leave room for arrow) */}
            <path d="M5 18 H16.5" stroke="white" strokeWidth="2.3" strokeLinecap="round" />
            {/* Arrow head pointing up-right (growth indicator) */}
            <path d="M13.5 15 L17 18 L13.5 18" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    );
}
