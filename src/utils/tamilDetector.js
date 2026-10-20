/**
 * VISIONCAP — Tamil Language & Tanglish Intent Detector
 * Identifies native Tamil Unicode and spoken Tanglish phonetics to facilitate
 * seamless bilingual voice interaction and automatic AI comprehension.
 */

export const TAMIL_UNICODE_REGEX = /[\u0B80-\u0BFF]/;

export const TANGLISH_KEYWORDS = new Set([
  // Question markers
  'enna', 'edhu', 'ethu', 'ithu', 'idhu', 'enga', 'enge', 'epdi', 'eppadi', 'yaar', 'yaaradhu',
  'yen', 'yaen', 'ethana', 'evvalavu', 'evalo',
  // Spatial & directional (crucial for visual assistance)
  'munnadi', 'munnal', 'pinnadi', 'pinnal', 'valadhu', 'idathu', 'valadhu pakkam', 'idathu pakkam',
  'kitta', 'arugil', 'thooram', 'tholaivil', 'mela', 'keezha', 'adiyil', 'naduvula', 'ulle', 'veliye',
  // Action & perception
  'irukku', 'irukka', 'paaru', 'kaattu', 'solunga', 'sollinga', 'pesunga', 'theriyudha', 'theriyala',
  'puriyudha', 'purila', 'theriyum', 'kannula', 'kannadi', 'pathu',
  // Objects & navigation
  'kadavu', 'door', 'table', 'mesa', 'chair', 'naarkali', 'padikattu', 'steps', 'thanni', 'saapadu',
  'aalu', 'manidhan', 'porul', 'vazhi', 'vali', 'road', 'suvar', 'light',
  // Greetings / confirmations
  'vanakkam', 'nandri', 'sari', 'illa', 'aama'
]);

export const TANGLISH_COMMON_TRANSLATIONS = {
  'munnadi enna irukku': 'என் முன்னால் என்ன இருக்கிறது? (What is in front of me?)',
  'enna irukku': 'இங்கே என்ன இருக்கிறது? (What is here?)',
  'enga irukku': 'எங்கே இருக்கிறது? (Where is it?)',
  'yaaradhu': 'யார் அங்கே இருக்கிறார்கள்? (Who is there?)',
  'valadhu pakkam': 'வலது பக்கத்தில் (On the right side)',
  'idathu pakkam': 'இடது பக்கத்தில் (On the left side)',
  'kitta': 'அருகில் (Near)',
  'thooram': 'தொலைவில் (Far)',
  'padikattu irukka': 'படிக்கட்டுகள் உள்ளதா? (Are there stairs / steps?)',
  'vazhi irukka': 'வழி உள்ளதா? (Is the path clear?)'
};

/**
 * Check if the text contains Tamil Unicode script
 */
export function isTamilUnicode(text) {
  if (!text) return false;
  return TAMIL_UNICODE_REGEX.test(text);
}

/**
 * Check if the text is Latin-transliterated spoken Tamil (Tanglish)
 */
export function isTanglish(text) {
  if (!text) return false;
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (words.length === 0) return false;

  const matches = words.filter(w => TANGLISH_KEYWORDS.has(w));
  return matches.length >= 2 || (matches.length >= 1 && words.length <= 3);
}

/**
 * Detect language: returns 'ta' (Tamil / Tanglish) or 'en' (English)
 */
export function detectLanguage(text) {
  if (!text) return 'en';
  if (isTamilUnicode(text) || isTanglish(text)) {
    return 'ta';
  }
  return 'en';
}

/**
 * Extract normalized query intent context for Vision AI
 */
export function getQueryIntentContext(text) {
  if (!text) return { language: 'en', isTamil: false, intentContext: '' };

  const isTamilScript = isTamilUnicode(text);
  const isTanglishText = isTanglish(text);
  const isTamil = isTamilScript || isTanglishText;

  if (!isTamil) {
    return {
      language: 'en',
      isTamil: false,
      intentContext: 'English visual query'
    };
  }

  if (isTamilScript) {
    return {
      language: 'ta',
      isTamil: true,
      intentContext: 'Native Tamil visual guidance query for visually impaired user'
    };
  }

  // Tanglish phrase normalization
  const lower = text.toLowerCase();
  for (const [phrase, translation] of Object.entries(TANGLISH_COMMON_TRANSLATIONS)) {
    if (lower.includes(phrase)) {
      return {
        language: 'ta',
        isTamil: true,
        intentContext: `Tanglish spoken query meaning: ${translation}`
      };
    }
  }

  return {
    language: 'ta',
    isTamil: true,
    intentContext: 'Spoken Tanglish query requiring spoken Tamil guidance'
  };
}
