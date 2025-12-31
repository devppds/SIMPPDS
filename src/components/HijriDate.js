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

        </div>
    );
}
