
import { Surah } from '../types';

const BASE_URL = 'https://api.alquran.cloud/v1';

// Cache to prevent redundant fetches
let cachedSurahs: Surah[] = [];
const pageCache: Record<number, any> = {};

// OFFLINE DATA: Ultimate fallback to ensure these pages NEVER fail
// Mapped accurately to SURAH_START_PAGES indices
const OFFLINE_PAGES: Record<number, any> = {
    597: {
        number: 597,
        ayahs: [
            { numberInSurah: 1, text: "وَالتِّينِ وَالزَّيْتُونِ", surah: { number: 95, name: "سورة التين", englishName: "At-Tin", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "وَطُورِ سِينِينَ", surah: { number: 95, name: "سورة التين", englishName: "At-Tin", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "وَهَٰذَا الْبَلَدِ الْأَمِينِ", surah: { number: 95, name: "سورة التين", englishName: "At-Tin", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ", surah: { number: 95, name: "سورة التين", englishName: "At-Tin", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "ثُمَّ رَدَدْنَاهُ أَسْفَلَ سَافِلِينَ", surah: { number: 95, name: "سورة التين", englishName: "At-Tin", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ فَلَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍ", surah: { number: 95, name: "سورة التين", englishName: "At-Tin", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 7, text: "فَمَا يُكَذِّبُكَ بَعْدُ بِالدِّينِ", surah: { number: 95, name: "سورة التين", englishName: "At-Tin", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 8, text: "أَلَيْسَ اللَّهُ بِأَحْكَمِ الْحَاكِمِينَ", surah: { number: 95, name: "سورة التين", englishName: "At-Tin", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "اقْرَأْ وَرَبُّكَ الْأَكْرَمُ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "الَّذِي عَلَّمَ بِالْقَلَمِ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "كَلَّا إِنَّ الْإِنسَانَ لَيَطْغَىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 7, text: "أَن رَّآهُ اسْتَغْنَىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 8, text: "إِنَّ إِلَىٰ رَبِّكَ الرُّجْعَىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 9, text: "أَرَأَيْتَ الَّذِي يَنْهَىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 10, text: "عَبْدًا إِذَا صَلَّىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 11, text: "أَرَأَيْتَ إِن كَانَ عَلَى الْهُدَىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 12, text: "أَوْ أَمَرَ بِالتَّقْوَىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 13, text: "أَرَأَيْتَ إِن كَذَّبَ وَتَوَلَّىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 14, text: "أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 15, text: "كَلَّا لَئِن لَّمْ يَنتَهِ لَنَسْفَعًا بِالنَّاصِيَةِ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 16, text: "نَاصِيَةٍ كَاذِبَةٍ خَاطِئَةٍ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 17, text: "فَلْيَدْعُ نَادِيَهُ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 18, text: "سَنَدْعُ الزَّبَانِيَةَ", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } },
            { numberInSurah: 19, text: "كَلَّا لَا تُطِعْهُ وَاسْجُدْ وَاقْتَرِب ۩", surah: { number: 96, name: "سورة العلق", englishName: "Al-Alaq", numberOfAyahs: 19, revelationType: "Meccan" } }
        ]
    },
    598: {
        number: 598,
        ayahs: [
            { numberInSurah: 1, text: "إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ", surah: { number: 97, name: "سورة القدر", englishName: "Al-Qadr", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ", surah: { number: 97, name: "سورة القدر", englishName: "Al-Qadr", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ", surah: { number: 97, name: "سورة القدر", englishName: "Al-Qadr", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ", surah: { number: 97, name: "سورة القدر", englishName: "Al-Qadr", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ", surah: { number: 97, name: "سورة القدر", englishName: "Al-Qadr", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "لَمْ يَكُنِ الَّذِينَ كَفَرُوا مِنْ أَهْلِ الْكِتَابِ وَالْمُشْرِكِينَ مُنفَكِّينَ حَتَّىٰ تَأْتِيَهُمُ الْبَيِّنَةُ", surah: { number: 98, name: "سورة البينة", englishName: "Al-Bayyinah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 2, text: "رَسُولٌ مِّنَ اللَّهِ يَتْلُو صُحُفًا مُّطَهَّرَةً", surah: { number: 98, name: "سورة البينة", englishName: "Al-Bayyinah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 3, text: "فِيهَا كُتُبٌ قَيِّمَةٌ", surah: { number: 98, name: "سورة البينة", englishName: "Al-Bayyinah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 4, text: "وَمَا تَفَرَّقَ الَّذِينَ أُوتُوا الْكِتَابَ إِلَّا مِن بَعْدِ مَا جَاءَتْهُمُ الْبَيِّنَةُ", surah: { number: 98, name: "سورة البينة", englishName: "Al-Bayyinah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 5, text: "وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ حُنَفَاءَ وَيُقِيمُوا الصَّلَاةَ وَيُؤْتُوا الزَّكَاةَ ۚ وَذَٰلِكَ دِينُ الْقَيِّمَةِ", surah: { number: 98, name: "سورة البينة", englishName: "Al-Bayyinah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 6, text: "إِنَّ الَّذِينَ كَفَرُوا مِنْ أَهْلِ الْكِتَابِ وَالْمُشْرِكِينَ فِي نَارِ جَهَنَّمَ خَالِدِينَ فِيهَا ۚ أُولَٰئِكَ هُمْ شَرُّ الْبَرِيَّةِ", surah: { number: 98, name: "سورة البينة", englishName: "Al-Bayyinah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 7, text: "إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ أُولَٰئِكَ هُمْ خَيْرُ الْبَرِيَّةِ", surah: { number: 98, name: "سورة البينة", englishName: "Al-Bayyinah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 8, text: "جَزَاؤُهُمْ عِندَ رَبِّهِمْ جَنَّاتُ عَدْنٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ خَالِدِينَ فِيهَا أَبَدًا ۖ رَّضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ ۚ ذَٰلِكَ لِمَنْ خَشِيَ رَبَّهُ", surah: { number: 98, name: "سورة البينة", englishName: "Al-Bayyinah", numberOfAyahs: 8, revelationType: "Medinan" } }
        ]
    },
    599: {
        number: 599,
        ayahs: [
            { numberInSurah: 1, text: "إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا", surah: { number: 99, name: "سورة الزلزلة", englishName: "Az-Zalzalah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 2, text: "وَأَخْرَجَتِ الْأَرْضُ أَثْقَالَهَا", surah: { number: 99, name: "سورة الزلزلة", englishName: "Az-Zalzalah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 3, text: "وَقَالَ الْإِنسَانُ مَا لَهَا", surah: { number: 99, name: "سورة الزلزلة", englishName: "Az-Zalzalah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 4, text: "يَوْمَئِذٍ تُحَدِّثُ أَخْبَارَهَا", surah: { number: 99, name: "سورة الزلزلة", englishName: "Az-Zalzalah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 5, text: "بِأَنَّ رَبَّكَ أَوْحَىٰ لَهَا", surah: { number: 99, name: "سورة الزلزلة", englishName: "Az-Zalzalah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 6, text: "يَوْمَئِذٍ يَصْدُرُ النَّاسُ أَشْتَاتًا لِّيُرَوْا أَعْمَالَهُمْ", surah: { number: 99, name: "سورة الزلزلة", englishName: "Az-Zalzalah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 7, text: "فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ", surah: { number: 99, name: "سورة الزلزلة", englishName: "Az-Zalzalah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 8, text: "وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُ", surah: { number: 99, name: "سورة الزلزلة", englishName: "Az-Zalzalah", numberOfAyahs: 8, revelationType: "Medinan" } },
            { numberInSurah: 1, text: "وَالْعَادِيَاتِ ضَبْحًا", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "فَالْمُورِيَاتِ قَدْحًا", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "فَالْمُغِيرَاتِ صُبْحًا", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "فَأَثَرْنَ بِهِ نَقْعًا", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "فَوَسَطْنَ بِهِ جَمْعًا", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "إِنَّ الْإِنسَانَ لِرَبِّهِ لَكَنُودٌ", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 7, text: "وَإِنَّهُ عَلَىٰ ذَٰلِكَ لَشَهِيدٌ", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 8, text: "وَإِنَّهُ لِحُبِّ الْخَيْرِ لَشَدِيدٌ", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 9, text: "أَفَلَا يَعْلَمُ إِذَا بُعْثِرَ مَا فِي الْقُبُورِ", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 10, text: "وَحُصِّلَ مَا فِي الصُّدُورِ", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 11, text: "إِنَّ رَبَّهُم بِهِمْ يَوْمَئِذٍ لَّخَبِيرٌ", surah: { number: 100, name: "سورة العاديات", englishName: "Al-Adiyat", numberOfAyahs: 11, revelationType: "Meccan" } }
        ]
    },
    600: {
        number: 600,
        ayahs: [
            { numberInSurah: 1, text: "الْقَارِعَةُ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "مَا الْقَارِعَةُ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "وَمَا أَدْرَاكَ مَا الْقَارِعَةُ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "يَوْمَ يَكُونُ النَّاسُ كَالْفَرَاشِ الْمَبْثُوثِ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "وَتَكُونُ الْجِبَالُ كَالْعِهْنِ الْمَنفُوشِ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "فَأَمَّا مَن ثَقُلَتْ مَوَازِينُهُ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 7, text: "فَهُوَ فِي عِيشَةٍ رَّاضِيَةٍ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 8, text: "وَأَمَّا مَنْ خَفَّتْ مَوَازِينُهُ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 9, text: "فَأُمُّهُ هَاوِيَةٌ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 10, text: "وَمَا أَدْرَاكَ مَا هِيَهْ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 11, text: "نَارٌ حَامِيَةٌ", surah: { number: 101, name: "سورة القارعة", englishName: "Al-Qari'ah", numberOfAyahs: 11, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "أَلْهَاكُمُ التَّكَاثُرُ", surah: { number: 102, name: "سورة التكاثر", englishName: "At-Takathur", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "حَتَّىٰ زُرْتُمُ الْمَقَابِرَ", surah: { number: 102, name: "سورة التكاثر", englishName: "At-Takathur", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "كَلَّا سَوْفَ تَعْلَمُونَ", surah: { number: 102, name: "سورة التكاثر", englishName: "At-Takathur", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "ثُمَّ كَلَّا سَوْفَ تَعْلَمُونَ", surah: { number: 102, name: "سورة التكاثر", englishName: "At-Takathur", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "كَلَّا لَوْ تَعْلَمُونَ عِلْمَ الْيَقِينِ", surah: { number: 102, name: "سورة التكاثر", englishName: "At-Takathur", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "لَتَرَوُنَّ الْجَحِيمَ", surah: { number: 102, name: "سورة التكاثر", englishName: "At-Takathur", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 7, text: "ثُمَّ لَتَرَوُنَّهَا عَيْنَ الْيَقِينِ", surah: { number: 102, name: "سورة التكاثر", englishName: "At-Takathur", numberOfAyahs: 8, revelationType: "Meccan" } },
            { numberInSurah: 8, text: "ثُمَّ لَتُسْأَلُنَّ يَوْمَئِذٍ عَنِ النَّعِيمِ", surah: { number: 102, name: "سورة التكاثر", englishName: "At-Takathur", numberOfAyahs: 8, revelationType: "Meccan" } }
        ]
    },
    601: {
        number: 601,
        ayahs: [
            { numberInSurah: 1, text: "وَالْعَصْرِ", surah: { number: 103, name: "سورة العصر", englishName: "Al-Asr", numberOfAyahs: 3, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ", surah: { number: 103, name: "سورة العصر", englishName: "Al-Asr", numberOfAyahs: 3, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ", surah: { number: 103, name: "سورة العصر", englishName: "Al-Asr", numberOfAyahs: 3, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "الَّذِي جَمَعَ مَالًا وَعَدَّدَهُ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "يَحْسَبُ أَنَّ مَالَهُ أَخْلَدَهُ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "كَلَّا ۖ لَيُنبَذَنَّ فِي الْحُطَمَةِ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "وَمَا أَدْرَاكَ مَا الْحُطَمَةُ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "نَارُ اللَّهِ الْمُوقَدَةُ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 7, text: "الَّتِي تَطَّلِعُ عَلَى الْأَفْئِدَةِ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 8, text: "إِنَّهَا عَلَيْهِم مُّؤْصَدَةٌ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 9, text: "فِي عَمَدٍ مُّمَدَّدَةٍ", surah: { number: 104, name: "سورة الهمزة", englishName: "Al-Humazah", numberOfAyahs: 9, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ", surah: { number: 105, name: "سورة الفيل", englishName: "Al-Fil", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ", surah: { number: 105, name: "سورة الفيل", englishName: "Al-Fil", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ", surah: { number: 105, name: "سورة الفيل", englishName: "Al-Fil", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ", surah: { number: 105, name: "سورة الفيل", englishName: "Al-Fil", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ", surah: { number: 105, name: "سورة الفيل", englishName: "Al-Fil", numberOfAyahs: 5, revelationType: "Meccan" } }
        ]
    },
    602: {
        number: 602,
        ayahs: [
            { numberInSurah: 1, text: "لِإِيلَافِ قُرَيْشٍ", surah: { number: 106, name: "سورة قريش", englishName: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ", surah: { number: 106, name: "سورة قريش", englishName: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "فَلْيَعْبُدُوا رَبَّ هَذَا الْبَيْتِ", surah: { number: 106, name: "سورة قريش", englishName: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "الَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ", surah: { number: 106, name: "سورة قريش", englishName: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ", surah: { number: 107, name: "سورة الماعون", englishName: "Al-Ma'un", numberOfAyahs: 7, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "فَذَلِكَ الَّذِي يَدُعُّ الْيَتِيمَ", surah: { number: 107, name: "سورة الماعون", englishName: "Al-Ma'un", numberOfAyahs: 7, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "وَلَا يَحُضُّ عَلَى طَعَامِ الْمِسْكِينِ", surah: { number: 107, name: "سورة الماعون", englishName: "Al-Ma'un", numberOfAyahs: 7, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "فَوَيْلٌ لِّلْمُصَلِّينَ", surah: { number: 107, name: "سورة الماعون", englishName: "Al-Ma'un", numberOfAyahs: 7, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ", surah: { number: 107, name: "سورة الماعون", englishName: "Al-Ma'un", numberOfAyahs: 7, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "الَّذِينَ هُمْ يُرَاءُونَ", surah: { number: 107, name: "سورة الماعون", englishName: "Al-Ma'un", numberOfAyahs: 7, revelationType: "Meccan" } },
            { numberInSurah: 7, text: "وَيَمْنَعُونَ الْمَاعُونَ", surah: { number: 107, name: "سورة الماعون", englishName: "Al-Ma'un", numberOfAyahs: 7, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ", surah: { number: 108, name: "سورة الكوثر", englishName: "Al-Kawthar", numberOfAyahs: 3, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "فَصَلِّ لِرَبِّكَ وَانْحَرْ", surah: { number: 108, name: "سورة الكوثر", englishName: "Al-Kawthar", numberOfAyahs: 3, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ", surah: { number: 108, name: "سورة الكوثر", englishName: "Al-Kawthar", numberOfAyahs: 3, revelationType: "Meccan" } }
        ]
    },
    603: {
        number: 603,
        ayahs: [
            { numberInSurah: 1, text: "قُلْ يَا أَيُّهَا الْكَافِرُونَ", surah: { number: 109, name: "سورة الكافرون", englishName: "Al-Kafirun", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "لَا أَعْبُدُ مَا تَعْبُدُونَ", surah: { number: 109, name: "سورة الكافرون", englishName: "Al-Kafirun", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ", surah: { number: 109, name: "سورة الكافرون", englishName: "Al-Kafirun", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ", surah: { number: 109, name: "سورة الكافرون", englishName: "Al-Kafirun", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ", surah: { number: 109, name: "سورة الكافرون", englishName: "Al-Kafirun", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "لَكُمْ دِينُكُمْ وَلِيَ دِينِ", surah: { number: 109, name: "سورة الكافرون", englishName: "Al-Kafirun", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ", surah: { number: 110, name: "سورة النصر", englishName: "An-Nasr", numberOfAyahs: 3, revelationType: "Medinan" } },
            { numberInSurah: 2, text: "وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا", surah: { number: 110, name: "سورة النصر", englishName: "An-Nasr", numberOfAyahs: 3, revelationType: "Medinan" } },
            { numberInSurah: 3, text: "فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا", surah: { number: 110, name: "سورة النصر", englishName: "An-Nasr", numberOfAyahs: 3, revelationType: "Medinan" } },
            { numberInSurah: 1, text: "تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ", surah: { number: 111, name: "سورة المسد", englishName: "Al-Masad", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ", surah: { number: 111, name: "سورة المسد", englishName: "Al-Masad", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ", surah: { number: 111, name: "سورة المسد", englishName: "Al-Masad", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ", surah: { number: 111, name: "سورة المسد", englishName: "Al-Masad", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ", surah: { number: 111, name: "سورة المسد", englishName: "Al-Masad", numberOfAyahs: 5, revelationType: "Meccan" } }
        ]
    },
    604: {
        number: 604,
        ayahs: [
            { numberInSurah: 1, text: "قُلْ هُوَ اللَّهُ أَحَدٌ", surah: { number: 112, name: "سورة الإخلاص", englishName: "Al-Ikhlas", numberOfAyahs: 4, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "اللَّهُ الصَّمَدُ", surah: { number: 112, name: "سورة الإخلاص", englishName: "Al-Ikhlas", numberOfAyahs: 4, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "لَمْ يَلِدْ وَلَمْ يُولَدْ", surah: { number: 112, name: "سورة الإخلاص", englishName: "Al-Ikhlas", numberOfAyahs: 4, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", surah: { number: 112, name: "سورة الإخلاص", englishName: "Al-Ikhlas", numberOfAyahs: 4, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", surah: { number: 113, name: "سورة الفلق", englishName: "Al-Falaq", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "مِن شَرِّ مَا خَلَقَ", surah: { number: 113, name: "سورة الفلق", englishName: "Al-Falaq", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", surah: { number: 113, name: "سورة الفلق", englishName: "Al-Falaq", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", surah: { number: 113, name: "سورة الفلق", englishName: "Al-Falaq", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", surah: { number: 113, name: "سورة الفلق", englishName: "Al-Falaq", numberOfAyahs: 5, revelationType: "Meccan" } },
            { numberInSurah: 1, text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", surah: { number: 114, name: "سورة الناس", englishName: "An-Nas", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 2, text: "مَلِكِ النَّاسِ", surah: { number: 114, name: "سورة الناس", englishName: "An-Nas", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 3, text: "إِلَهِ النَّاسِ", surah: { number: 114, name: "سورة الناس", englishName: "An-Nas", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 4, text: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", surah: { number: 114, name: "سورة الناس", englishName: "An-Nas", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 5, text: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", surah: { number: 114, name: "سورة الناس", englishName: "An-Nas", numberOfAyahs: 6, revelationType: "Meccan" } },
            { numberInSurah: 6, text: "مِنَ الْجِنَّةِ وَ النَّاسِ", surah: { number: 114, name: "سورة الناس", englishName: "An-Nas", numberOfAyahs: 6, revelationType: "Meccan" } }
        ]
    }
};

// Verified Folder Names for EveryAyah.com (Static MP3s - Extremely Reliable)
export const RECITERS = [
    { id: 'Yasser_Ad-Dussary_128kbps', name: 'ياسر الدوسري', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Alafasy_128kbps', name: 'مشاري العفاسي', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'عبدالرحمن السديس', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'MaherAlMuaiqly128kbps', name: 'ماهر المعيقلي', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Fares_Abbad_64kbps', name: 'فارس عباد', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Minshawy_Murattal_128kbps', name: 'محمد صديق المنشاوي', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Minshawy_Mujawwad_192kbps', name: 'محمد صديق المنشاوي', style: 'مجود', styleEn: 'Mujawwad' },
    { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبدالباسط عبدالصمد', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Abdul_Basit_Mujawwad_128kbps', name: 'عبدالباسط عبدالصمد', style: 'مجود', styleEn: 'Mujawwad' },
    { id: 'Saood_ash-Shuraym_128kbps', name: 'سعود الشريم', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'أبوبكر الشاطري', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Husary_128kbps', name: 'محمود خليل الحصري', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Hudhaify_128kbps', name: 'علي الحذيفي', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Muhammad_Ayyoub_128kbps', name: 'محمد أيوب', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Abdullah_Basfar_192kbps', name: 'عبدالله بصفر', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Muhammad_Jibreel_128kbps', name: 'محمد جبريل', style: 'مرتل', styleEn: 'Murattal' },
    { id: 'Ibrahim_Akhdar_32kbps', name: 'إبراهيم الأخضر', style: 'مرتل', styleEn: 'Murattal' },
];

export const TAFSEER_EDITIONS = [
    { id: 'ar.muyassar', name: 'التفسير الميسر' },
    { id: 'ar.jalalayn', name: 'تفسير الجلالين' },
    { id: 'ar.saadi', name: 'تفسير السعدي' }, 
    { id: 'ar.ibnkathir', name: 'تفسير ابن كثير' },
    { id: 'ar.baghawi', name: 'تفسير البغوي' },
    { id: 'ar.qurtubi', name: 'تفسير القرطبي' },
    { id: 'ar.tabari', name: 'تفسير الطبري' }
];

// Mapping: Index is (SurahNumber - 1), Value is Start Page
export const SURAH_START_PAGES = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 602, 602, 602, 603, 603, 603,
  603, 604, 604, 604
];

export const fetchSurahs = async (): Promise<Surah[]> => {
  if (cachedSurahs.length > 0) return cachedSurahs;
  
  try {
    const response = await fetch(`${BASE_URL}/surah`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    cachedSurahs = data.data;
    return cachedSurahs;
  } catch (error: any) {
    console.error("Failed to fetch surahs:", error.message || error);
    return [];
  }
};

export const getSurahByNumber = async (number: number): Promise<Surah | null> => {
  if (cachedSurahs.length === 0) {
      await fetchSurahs();
  }
  return cachedSurahs.find(s => s.number === number) || null;
}

export const getSurahForPage = async (page: number): Promise<Surah | null> => {
    let surahIndex = -1;
    for (let i = 0; i < SURAH_START_PAGES.length; i++) {
        if (SURAH_START_PAGES[i] <= page) {
            surahIndex = i;
        } else {
            break;
        }
    }
    
    if (surahIndex !== -1) {
        return getSurahByNumber(surahIndex + 1);
    }
    return null;
}

// --- Helper: Robust Fallback Construction ---
// Fetches specific surah and filters ayahs for the target page.
// This bypasses the /page/{number} endpoint which can be flaky for short surahs.
const fetchSurahAndExtractPage = async (surahNum: number, targetPage: number) => {
    if (surahNum < 1 || surahNum > 114) return [];
    try {
        const res = await fetch(`${BASE_URL}/surah/${surahNum}/quran-uthmani`);
        if (!res.ok) return [];
        const data = await res.json();
        const ayahs = data.data.ayahs.filter((a: any) => a.page === targetPage);
        const { ayahs: _, ...meta } = data.data;
        return ayahs.map((a: any) => ({ ...a, surah: meta }));
    } catch (e) {
        return [];
    }
};

export const fetchPageContent = async (pageNumber: number) => {
    // Strategy 1: Offline Data
    if (OFFLINE_PAGES[pageNumber]) {
        pageCache[pageNumber] = OFFLINE_PAGES[pageNumber];
        return OFFLINE_PAGES[pageNumber];
    }

    if (pageNumber < 1 || pageNumber > 604) return null;
    if (pageCache[pageNumber]) return pageCache[pageNumber];

    // Strategy 2: API Fetch
    try {
        let response = await fetch(`${BASE_URL}/page/${pageNumber}/quran-uthmani`);
        if (!response.ok) {
             // Try fallback script if uthmani fails
             response = await fetch(`${BASE_URL}/page/${pageNumber}/quran-simple`);
        }

        if (!response.ok) throw new Error('Page API failed');

        const data = await response.json();
        if (!data.data || !data.data.ayahs.length) throw new Error('Empty data');
        
        pageCache[pageNumber] = data.data;
        return data.data;

    } catch (e) {
        // Strategy 3: Dynamic Fallback (Construct from Surahs)
        console.warn(`Page ${pageNumber} fetch failed, attempting manual construction...`);
        
        // Identify surahs around this page
        // Find the surah that starts after this page, then go back to find current/previous ones
        let surahIndex = SURAH_START_PAGES.findIndex(p => p > pageNumber);
        if (surahIndex === -1) surahIndex = 114; 
        const centerSurahNum = surahIndex; // This is the surah that starts AFTER or is 114.
        
        // Check window: [center-3 ... center+1]
        // Example: Page 596. Center=94 (S95 starts 597). Range: 91, 92, 93, 94, 95.
        const searchRange = [-3, -2, -1, 0, 1]; 
        const surahsToFetch = searchRange.map(offset => centerSurahNum + offset).filter(n => n >= 1 && n <= 114);
        
        let allAyahs: any[] = [];
        // Run in parallel for speed
        const results = await Promise.all(surahsToFetch.map(id => fetchSurahAndExtractPage(id, pageNumber)));
        results.forEach(ayahs => allAyahs.push(...ayahs));
        
        if (allAyahs.length > 0) {
            allAyahs.sort((a, b) => a.number - b.number);
            const result = { number: pageNumber, ayahs: allAyahs, meta: { constructed: true } };
            pageCache[pageNumber] = result;
            return result;
        }
        
        console.error("All fetch strategies failed for page", pageNumber);
        return null;
    }
}

export const fetchAyahs = async (surahNumber: number) => {
  try {
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/quran-uthmani`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error("Failed to fetch ayahs:", error.message || error);
    return null;
  }
};

// --- STATIC AUDIO URL GENERATION (EveryAyah) ---
export const getAyahAudioUrl = async (reciterId: string, verseKey: string): Promise<string | null> => {
    try {
        // verseKey format is "surah:ayah" (e.g. "3:1")
        const parts = verseKey.split(':');
        if (parts.length !== 2) return null;

        const surah = parts[0].padStart(3, '0');
        const ayah = parts[1].padStart(3, '0');
        
        // Construct standard EveryAyah URL
        return `https://everyayah.com/data/${reciterId}/${surah}${ayah}.mp3`;
    } catch (e) {
        console.error("Error generating audio URL:", e);
        return null;
    }
};

export const fetchRecitation = async (reciterId: number, surahNumber: number) => {
    return null; 
};

// --- TAFSEER SERVICE ---
export const fetchTafseer = async (surahNumber: number, ayahNumber: number, edition: string = 'ar.muyassar') => {
    try {
        const response = await fetch(`${BASE_URL}/ayah/${surahNumber}:${ayahNumber}/${edition}`);
        if (!response.ok) throw new Error("Failed to fetch tafseer");
        const data = await response.json();
        return data.data.text;
    } catch (error) {
        console.error("Tafseer Error:", error);
        return "تعذر تحميل التفسير. يرجى التحقق من الاتصال أو اختيار تفسير آخر.";
    }
};
