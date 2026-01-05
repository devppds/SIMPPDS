'use client';

import React from 'react';
import DevelzySidebar from '@/components/DevelzySidebar';
import './develzy.css'; // Ensure CSS is loaded

export default function DevelzyLayout({ children }) {
    return (
        <div className="develzy-page-wrapper">
            <DevelzySidebar />
            {children}
            <style jsx global>{`
                body {
                    background: #020617;
                }
            `}</style>
        </div>
    );
}
