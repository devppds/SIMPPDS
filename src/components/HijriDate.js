'use client';
import React, { useState, useEffect } from 'react';
import moment from 'moment-hijri';

export default function HijriDate() {
    const [dateStr, setDateStr] = useState('');

    useEffect(() => {
        const getHijriDate = () => {
            const now = moment();
            // Format: iD (Day), iMMMM (Month Name), iYYYY (Year)
            // Locale 'en' ensures numbers are Latin (123) not Arabic (١٢٣)
            const hijriDate = now.locale('en').format('iD iMMMM iYYYY');

            // Daftar nama bulan dalam bahasa Indonesia
            const bulanHijriyahID = {
                "Muharram": "Muharram",
                "Safar": "Shafar",
                "Rabi'ul Awwal": "Rabiul Awal",
                "Rabi'ul Akhir": "Rabiul Akhir",
                "Jumada al-Awwal": "Jumadil Awal",
                "Jumada al-Thani": "Jumadil Akhir",
                "Rajab": "Rajab",
                "Sha'ban": "Sya'ban",
                "Ramadan": "Ramadhan",
                "Shawwal": "Syawal",
                "Dhul-Qa'dah": "Dzulqa'dah",
                "Dhul-Hijjah": "Dzulhijjah"
            };

            let formatted = hijriDate;
            Object.keys(bulanHijriyahID).forEach(bulan => {
                // Gunakan regex global replace atau replace biasa (karena nama bulan unik)
                formatted = formatted.replace(bulan, bulanHijriyahID[bulan]);
            });

            return formatted + " H";
        };

        const updateDate = () => setDateStr(getHijriDate());
        updateDate();

        // Update tiap menit agar tetap realtime (walau tanggal jarang ganti)
        const interval = setInterval(updateDate, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!dateStr) return null;

    return (
        <div className="hijri-widget animate-in">
            <div className="icon-wrapper">
                <i className="fas fa-moon"></i>
            </div>
            <span className="hijri-text">{dateStr}</span>
            <div className="sub-text">Kalender Islam</div>

            <style jsx>{`
                .hijri-widget {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: linear-gradient(135deg, #065f46 0%, #047857 100%);
                    color: #fff;
                    padding: 8px 20px;
                    border-radius: 50px;
                    box-shadow: 0 4px 15px -3px rgba(5, 150, 105, 0.4);
                    margin-right: 20px;
                    border: 1px solid rgba(255,255,255,0.1);
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.2s;
                    cursor: default;
                }
                .hijri-widget:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px -3px rgba(5, 150, 105, 0.5);
                }
                .hijri-widget::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 0h2v2H5V1zm4 0h2v2H9V1zm4 0h2v2h-2V1zm4 0h2v2h-2V1z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
                    opacity: 0.3;
                }
                .icon-wrapper {
                    font-size: 1.2rem;
                    color: #fbbf24; /* Gold moon */
                    text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
                    z-index: 1;
                    animation: float 3s ease-in-out infinite;
                }
                .hijri-text {
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    font-size: 1rem;
                    z-index: 1;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                .sub-text {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.8;
                    position: absolute;
                    bottom: 2px;
                    right: 20px;
                    display: none; /* Optional detail */
                }

                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-3px) rotate(10deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }

                @media (max-width: 900px) {
                    .hijri-text { font-size: 0.9rem; }
                    .hijri-widget { padding: 6px 15px; margin-right: 10px; }
                }
            `}</style>
        </div>
    );
}
