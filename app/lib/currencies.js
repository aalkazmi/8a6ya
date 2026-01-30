export const CURRENCIES = [
  { code: 'USD', symbol: '$', name_en: 'US Dollar', name_ar: 'دولار أمريكي', symbolPosition: 'before', decimals: 2 },
  { code: 'EUR', symbol: '€', name_en: 'Euro', name_ar: 'يورو', symbolPosition: 'before', decimals: 2 },
  { code: 'GBP', symbol: '£', name_en: 'British Pound', name_ar: 'جنيه إسترليني', symbolPosition: 'before', decimals: 2 },
  { code: 'JPY', symbol: '¥', name_en: 'Japanese Yen', name_ar: 'ين ياباني', symbolPosition: 'before', decimals: 0 },
  { code: 'AUD', symbol: 'A$', name_en: 'Australian Dollar', name_ar: 'دولار أسترالي', symbolPosition: 'before', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name_en: 'Canadian Dollar', name_ar: 'دولار كندي', symbolPosition: 'before', decimals: 2 },
  { code: 'CHF', symbol: 'Fr', name_en: 'Swiss Franc', name_ar: 'فرنك سويسري', symbolPosition: 'before', decimals: 2 },
  { code: 'CNY', symbol: '¥', name_en: 'Chinese Yuan', name_ar: 'يوان صيني', symbolPosition: 'before', decimals: 2 },
  { code: 'SEK', symbol: 'kr', name_en: 'Swedish Krona', name_ar: 'كرونة سويدية', symbolPosition: 'after', decimals: 2 },
  { code: 'NZD', symbol: 'NZ$', name_en: 'New Zealand Dollar', name_ar: 'دولار نيوزيلندي', symbolPosition: 'before', decimals: 2 },
  { code: 'MXN', symbol: '$', name_en: 'Mexican Peso', name_ar: 'بيزو مكسيكي', symbolPosition: 'before', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name_en: 'Singapore Dollar', name_ar: 'دولار سنغافوري', symbolPosition: 'before', decimals: 2 },
  { code: 'HKD', symbol: 'HK$', name_en: 'Hong Kong Dollar', name_ar: 'دولار هونج كونج', symbolPosition: 'before', decimals: 2 },
  { code: 'NOK', symbol: 'kr', name_en: 'Norwegian Krone', name_ar: 'كرونة نرويجية', symbolPosition: 'after', decimals: 2 },
  { code: 'KRW', symbol: '₩', name_en: 'South Korean Won', name_ar: 'وون كوري جنوبي', symbolPosition: 'before', decimals: 0 },
  { code: 'TRY', symbol: '₺', name_en: 'Turkish Lira', name_ar: 'ليرة تركية', symbolPosition: 'before', decimals: 2 },
  { code: 'RUB', symbol: '₽', name_en: 'Russian Ruble', name_ar: 'روبل روسي', symbolPosition: 'after', decimals: 2 },
  { code: 'INR', symbol: '₹', name_en: 'Indian Rupee', name_ar: 'روبية هندية', symbolPosition: 'before', decimals: 2 },
  { code: 'BRL', symbol: 'R$', name_en: 'Brazilian Real', name_ar: 'ريال برازيلي', symbolPosition: 'before', decimals: 2 },
  { code: 'ZAR', symbol: 'R', name_en: 'South African Rand', name_ar: 'راند جنوب أفريقي', symbolPosition: 'before', decimals: 2 },
  { code: 'SAR', symbol: 'ر.س', name_en: 'Saudi Riyal', name_ar: 'ريال سعودي', symbolPosition: 'after', decimals: 2 },
  { code: 'AED', symbol: 'د.إ', name_en: 'UAE Dirham', name_ar: 'درهم إماراتي', symbolPosition: 'after', decimals: 2 },
  { code: 'KWD', symbol: 'د.ك', name_en: 'Kuwaiti Dinar', name_ar: 'دينار كويتي', symbolPosition: 'after', decimals: 2 },
  { code: 'QAR', symbol: 'ر.ق', name_en: 'Qatari Riyal', name_ar: 'ريال قطري', symbolPosition: 'after', decimals: 2 },
  { code: 'BHD', symbol: 'د.ب', name_en: 'Bahraini Dinar', name_ar: 'دينار بحريني', symbolPosition: 'after', decimals: 2 },
  { code: 'OMR', symbol: 'ر.ع', name_en: 'Omani Rial', name_ar: 'ريال عماني', symbolPosition: 'after', decimals: 2 },
  { code: 'JOD', symbol: 'د.ا', name_en: 'Jordanian Dinar', name_ar: 'دينار أردني', symbolPosition: 'after', decimals: 2 },
  { code: 'EGP', symbol: 'ج.م', name_en: 'Egyptian Pound', name_ar: 'جنيه مصري', symbolPosition: 'after', decimals: 2 },
  { code: 'LBP', symbol: 'ل.ل', name_en: 'Lebanese Pound', name_ar: 'ليرة لبنانية', symbolPosition: 'after', decimals: 2 },
  { code: 'MAD', symbol: 'د.م.', name_en: 'Moroccan Dirham', name_ar: 'درهم مغربي', symbolPosition: 'after', decimals: 2 },
  { code: 'DZD', symbol: 'د.ج', name_en: 'Algerian Dinar', name_ar: 'دينار جزائري', symbolPosition: 'after', decimals: 2 },
  { code: 'TND', symbol: 'د.ت', name_en: 'Tunisian Dinar', name_ar: 'دينار تونسي', symbolPosition: 'after', decimals: 2 },
  { code: 'LYD', symbol: 'ل.د', name_en: 'Libyan Dinar', name_ar: 'دينار ليبي', symbolPosition: 'after', decimals: 2 },
  { code: 'IQD', symbol: 'ع.د', name_en: 'Iraqi Dinar', name_ar: 'دينار عراقي', symbolPosition: 'after', decimals: 2 },
  { code: 'SYP', symbol: 'ل.س', name_en: 'Syrian Pound', name_ar: 'ليرة سورية', symbolPosition: 'after', decimals: 2 },
  { code: 'YER', symbol: 'ر.ي', name_en: 'Yemeni Rial', name_ar: 'ريال يمني', symbolPosition: 'after', decimals: 2 },
  { code: 'ILS', symbol: '₪', name_en: 'Israeli Shekel', name_ar: 'شيكل إسرائيلي', symbolPosition: 'before', decimals: 2 },
  { code: 'IDR', symbol: 'Rp', name_en: 'Indonesian Rupiah', name_ar: 'روبية إندونيسية', symbolPosition: 'before', decimals: 2 },
  { code: 'MYR', symbol: 'RM', name_en: 'Malaysian Ringgit', name_ar: 'رينغيت ماليزي', symbolPosition: 'before', decimals: 2 },
  { code: 'PHP', symbol: '₱', name_en: 'Philippine Peso', name_ar: 'بيزو فلبيني', symbolPosition: 'before', decimals: 2 },
  { code: 'THB', symbol: '฿', name_en: 'Thai Baht', name_ar: 'بات تايلاندي', symbolPosition: 'after', decimals: 2 },
  { code: 'VND', symbol: '₫', name_en: 'Vietnamese Dong', name_ar: 'دونغ فيتنامي', symbolPosition: 'after', decimals: 2 },
];

export const getCurrencyByCode = (code) => {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
};

export const formatAmount = (amount, currencyCode) => {
  const currency = getCurrencyByCode(currencyCode);
  const value = (amount === null || amount === undefined || isNaN(Number(amount))) ? 0 : Number(amount);
  const decimals = currency.decimals !== undefined ? currency.decimals : 2;
  
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value).toFixed(decimals);
  
  if (currency.symbolPosition === 'before') {
    return `${isNegative ? '-' : ''}${currency.symbol}${absoluteValue}`;
  } else {
    return `${isNegative ? '-' : ''}${absoluteValue} ${currency.symbol}`;
  }
};

export const getDefaultCurrency = () => {
  if (typeof window === 'undefined' || !window.navigator) return 'USD';
  
  const locale = window.navigator.language || 'en-US';
  
  // Handle cases where only language code is present (e.g., 'en', 'ar')
  if (locale.length === 2) {
    const langMap = {
      'en': 'USD', 'ar': 'SAR', 'ja': 'JPY', 'zh': 'CNY', 
      'fr': 'EUR', 'de': 'EUR', 'es': 'EUR', 'it': 'EUR'
    };
    return langMap[locale] || 'USD';
  }

  const region = locale.split('-')[1];
  
  if (!region) return 'USD';
  
  const regionMap = {
    US: 'USD', GB: 'GBP', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
    JP: 'JPY', AU: 'AUD', CA: 'CAD', CH: 'CHF', CN: 'CNY', SE: 'SEK', NZ: 'NZD',
    MX: 'MXN', SG: 'SGD', HK: 'HKD', NO: 'NOK', KR: 'KRW', TR: 'TRY', RU: 'RUB',
    IN: 'INR', BR: 'BRL', ZA: 'ZAR', SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR',
    BH: 'BHD', OM: 'OMR', JO: 'JOD', EG: 'EGP', LB: 'LBP', MA: 'MAD', DZ: 'DZD',
    TN: 'TND', LY: 'LYD', IQ: 'IQD', SY: 'SYP', YE: 'YER', IL: 'ILS', ID: 'IDR',
    MY: 'MYR', PH: 'PHP', TH: 'THB', VN: 'VND'
  };
  
  return regionMap[region] || 'USD';
};