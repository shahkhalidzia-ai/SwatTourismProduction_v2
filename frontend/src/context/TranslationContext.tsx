import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'ur' | 'ps';

interface TranslationContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
}

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    'app.title': 'Swat Tourism Platform',
    'role.tourist': 'Tourist',
    'role.business': 'Business',
    'role.community': 'Community',
    'role.authority': 'Authority',
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.trips': 'Trips',
    'nav.safety': 'Safety',
    'nav.today': 'Today',
    'nav.listings': 'Listings',
    'nav.bookings': 'Bookings',
    'nav.profile': 'Profile',
    'nav.overview': 'Overview',
    'nav.approvals': 'Approvals',
    'nav.advisories': 'Advisories',
    'nav.cases': 'Cases',
    'nav.stories': 'Stories',
    'nav.crafts': 'Crafts',
    'nav.report': 'Report Issue',
    'nav.hosts': 'Services',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.resolve': 'Resolve',
    'action.assign': 'Assign',
    'sos.button': 'Raise Emergency SOS',
  },
  ur: {
    'app.title': 'سوات سیاحت پلیٹ فارم',
    'role.tourist': 'سیاح',
    'role.business': 'کاروبار',
    'role.community': 'کمیونٹی',
    'role.authority': 'انتظامیہ',
    'nav.home': 'ہوم',
    'nav.explore': 'دریافت کریں',
    'nav.trips': 'سفر',
    'nav.safety': 'حفاظت',
    'nav.today': 'آج',
    'nav.listings': 'فہرستیں',
    'nav.bookings': 'بکنگز',
    'nav.profile': 'پروفائل',
    'nav.overview': 'جائزہ',
    'nav.approvals': 'منظوریاں',
    'nav.advisories': 'ہدایات',
    'nav.cases': 'کیسز',
    'nav.stories': 'کہانیاں',
    'nav.crafts': 'دستکاری',
    'nav.report': 'شکایت درج کریں',
    'nav.hosts': 'خدمات',
    'action.save': 'محفوظ کریں',
    'action.cancel': 'منسوخ کریں',
    'action.approve': 'منظور کریں',
    'action.reject': 'مسترد کریں',
    'action.resolve': 'حل کریں',
    'action.assign': 'مقرر کریں',
    'sos.button': 'ہنگامی مدد (SOS)',
  },
  ps: {
    'app.title': 'د سوات ګرځندوی پلیټ فارم',
    'role.tourist': 'ګرځندوی',
    'role.business': 'سوداګري',
    'role.community': 'ټولنه',
    'role.authority': 'چارواکي',
    'nav.home': 'کور',
    'nav.explore': 'لټون',
    'nav.trips': 'سفرونه',
    'nav.safety': 'خوندیتوب',
    'nav.today': 'نن',
    'nav.listings': 'لستونه',
    'nav.bookings': 'بکینګونه',
    'nav.profile': 'پېژندنه',
    'nav.overview': 'کتنه',
    'nav.approvals': 'منښتې',
    'nav.advisories': 'لارښوونې',
    'nav.cases': 'قضیې',
    'nav.stories': 'کیسې',
    'nav.crafts': 'لاسي صنایع',
    'nav.report': 'شکایت درج کول',
    'nav.hosts': 'خدمتونه',
    'action.save': 'خوندي کول',
    'action.cancel': 'ردول',
    'action.approve': 'منل',
    'action.reject': 'ردول',
    'action.resolve': 'حل کول',
    'action.assign': 'ګمارل',
    'sos.button': 'بیړنۍ مرسته (SOS)',
  },
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    const saved = localStorage.getItem('swat_language') as SupportedLanguage;
    if (saved && (saved === 'en' || saved === 'ur' || saved === 'ps')) {
      setLanguageState(saved);
      document.documentElement.setAttribute('dir', saved === 'en' ? 'ltr' : 'rtl');
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('swat_language', lang);
    document.documentElement.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
  };

  const t = (key: string, defaultText?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict[key]) return dict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return defaultText || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    return {
      language: 'en' as SupportedLanguage,
      setLanguage: () => {},
      t: (key: string, defaultText?: string) => defaultText || key,
    };
  }
  return context;
};
