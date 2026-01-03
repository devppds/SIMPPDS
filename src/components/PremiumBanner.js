'use client';

import React from 'react';

/**
 * PremiumBanner Component
 * @param {Object} props
 * @param {string} props.title - The main heading
 * @param {string} props.subtitle - The secondary description
 * @param {string} props.icon - FontAwesome icon class (e.g., 'fas fa-graduation-cap')
 * @param {string} props.bgGradient - CSS gradient string
 * @param {string} props.floatingIcon - Large decorative background icon
 * @param {React.ReactNode} props.actionAction - Optional action button or element
 */
export default function PremiumBanner({
    title,
    subtitle,
    icon,
    bgGradient = 'linear-gradient(135deg, var(--primary-dark) 0%, #1e1b4b 100%)',
    floatingIcon,
    actionButton
}) {
    return (
        <div style={{
            marginBottom: '3.5rem',
            padding: '2.5rem',
            background: bgGradient,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
            boxShadow: 'var(--shadow-premium)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* LARGE FLOATING ICON */}
            <div style={{
                position: 'absolute',
                top: '-15%',
                right: '-5%',
                fontSize: '15rem',
                color: 'rgba(255,255,255,0.03)',
                transform: 'rotate(-15deg)',
                pointerEvents: 'none'
            }}>
                <i className={floatingIcon || icon}></i>
            </div>

            {/* MAIN ICON BOX */}
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.2)'
            }}>
                <i className={icon}></i>
            </div>

            {/* TEXT CONTENT */}
            <div style={{ flex: 1 }}>
                <h1 className="outfit" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                    {title}
                </h1>
                <p style={{ opacity: 0.8, margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>
                    {subtitle}
                </p>
            </div>

            {/* ACTION BUTTON */}
            {actionButton && (
                <div style={{ position: 'relative', zIndex: 10 }}>
                    {actionButton}
                </div>
            )}
        </div>
    );
}
