
import { PrayerTimes } from '../types';

export const prayerService = {
    async getPrayerTimes(city: string, country: string): Promise<PrayerTimes | null> {
        try {
            if (!city || !country) return null;
            
            // Using Method 4 (Umm Al-Qura) as a safe default for Arab regions, or auto (null)
            const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=4`);
            
            if (!response.ok) return null;
            
            const data = await response.json();
            return data.data.timings;
        } catch (e) {
            console.error("Failed to fetch prayer times:", e);
            return null;
        }
    },

    getNextPrayer(timings: PrayerTimes): { name: string, arabicName: string, time: string, timeLeft: string } | null {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const prayers = [
            { name: 'Fajr', ar: 'الفجر' },
            { name: 'Dhuhr', ar: 'الظهر' },
            { name: 'Asr', ar: 'العصر' },
            { name: 'Maghrib', ar: 'المغرب' },
            { name: 'Isha', ar: 'العشاء' }
        ];

        let nextPrayer = null;

        for (const p of prayers) {
            const timeStr = timings[p.name];
            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerTimeMinutes = hours * 60 + minutes;

            if (prayerTimeMinutes > currentTime) {
                nextPrayer = { 
                    name: p.name, 
                    arabicName: p.ar, 
                    time: timeStr,
                    timeLeft: this.formatTimeLeft(prayerTimeMinutes - currentTime)
                };
                break;
            }
        }

        // If no prayer is left today, next is Fajr tomorrow
        if (!nextPrayer) {
             const fajrStr = timings['Fajr'];
             const [fHours, fMinutes] = fajrStr.split(':').map(Number);
             const fajrMinutes = fHours * 60 + fMinutes;
             const minutesUntilMidnight = (24 * 60) - currentTime;
             
             nextPrayer = {
                 name: 'Fajr',
                 arabicName: 'الفجر',
                 time: fajrStr,
                 timeLeft: this.formatTimeLeft(minutesUntilMidnight + fajrMinutes)
             };
        }

        return nextPrayer;
    },

    formatTimeLeft(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h} ساعة و ${m} دقيقة`;
        return `${m} دقيقة`;
    },

    convertTo12Hour(time24: string): string {
        const [hours, minutes] = time24.split(':').map(Number);
        const suffix = hours >= 12 ? 'م' : 'ص';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
    }
};
