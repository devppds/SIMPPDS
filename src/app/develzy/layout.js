'use client';

import React from 'react';
import DevelzySidebar from '@/components/DevelzySidebar';

export default function DevelzyLayout({ children }) {
    return (
        <div className="develzy-layout">
            <style jsx global>{`
                .develzy-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #020617; /* Slate 950 */
                    color: #e2e8f0;
                }

                .develzy-main {
                    flex: 1;
                    margin-left: 280px;
                    min-height: 100vh;
                    position: relative;
                }

                /* Override some global styles to fit Develzy theme */
                .develzy-main .card {
                    background: rgba(15, 23, 42, 0.6) !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    backdrop-filter: blur(10px);
                }

                .develzy-main h1, .develzy-main h2, .develzy-main h3 {
                    color: #f8fafc !important;
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
