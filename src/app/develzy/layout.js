'use client';

import React from 'react';
import DevelzySidebar from '@/components/DevelzySidebar';
import './develzy.css';

export default function DevelzyLayout({ children }) {
    return (
        <div className="develzy-layout">
            <style jsx global>{`
                .develzy-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #020617;
                    color: #e2e8f0;
                }
                .develzy-main {
                    flex: 1;
                    margin-left: 280px;
                    min-height: 100vh;
                    position: relative;
                }
                .develzy-main .view-container {
                    padding: 2.5rem !important;
                    max-width: 1400px;
                    margin: 0 auto;
                }
            `}</style>

            <DevelzySidebar />

            <main className="develzy-main">
                {children}
            </main>
        </div>
    );
}
