'use client';

import React from 'react';
import DevelzySidebar from '@/components/DevelzySidebar';
import './develzy.css';

export default function DevelzyLayout({ children }) {
    return (
        <div className="develzy-layout">

            <DevelzySidebar />

            <main className="develzy-main">
                {children}
            </main>
        </div>
    );
}
