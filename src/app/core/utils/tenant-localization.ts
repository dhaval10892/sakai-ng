export type CountryPreset = {
    country: string;
    currencyCode: string;
    currencySymbol: string;
    taxName: string;
    taxRate: number;
    states: string[];
};

const ALL_COUNTRY_NAMES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    "Cote d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
    'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
    'Guyana', 'Haiti', 'Holy See', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
    'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
    'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
    'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
    'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
    'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
    'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela',
    'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
] as const;

const COUNTRY_OVERRIDES: Record<string, Omit<CountryPreset, 'country'>> = {
    India: {
        currencyCode: 'INR',
        currencySymbol: '\u20B9',
        taxName: 'GST',
        taxRate: 0.18,
        states: ['Gujarat', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu']
    },
    'United States': {
        currencyCode: 'USD',
        currencySymbol: '$',
        taxName: 'Sales Tax',
        taxRate: 0.08,
        states: ['California', 'Texas', 'Florida', 'New York', 'Illinois']
    },
    'United Kingdom': {
        currencyCode: 'GBP',
        currencySymbol: '\u00A3',
        taxName: 'VAT',
        taxRate: 0.2,
        states: ['England', 'Scotland', 'Wales', 'Northern Ireland']
    },
    Canada: {
        currencyCode: 'CAD',
        currencySymbol: 'C$',
        taxName: 'GST/HST',
        taxRate: 0.13,
        states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba']
    },
    Australia: {
        currencyCode: 'AUD',
        currencySymbol: 'A$',
        taxName: 'GST',
        taxRate: 0.1,
        states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia']
    },
    Germany: {
        currencyCode: 'EUR',
        currencySymbol: '\u20AC',
        taxName: 'VAT',
        taxRate: 0.19,
        states: ['Bavaria', 'Berlin', 'Hamburg', 'Hesse', 'Saxony']
    },
    France: {
        currencyCode: 'EUR',
        currencySymbol: '\u20AC',
        taxName: 'TVA',
        taxRate: 0.2,
        states: ['Ile-de-France', 'Provence-Alpes-Cote dAzur', 'Nouvelle-Aquitaine', 'Occitanie', 'Auvergne-Rhone-Alpes']
    },
    Italy: {
        currencyCode: 'EUR',
        currencySymbol: '\u20AC',
        taxName: 'VAT',
        taxRate: 0.22,
        states: ['Lazio', 'Lombardy', 'Campania', 'Sicily', 'Tuscany']
    },
    Spain: {
        currencyCode: 'EUR',
        currencySymbol: '\u20AC',
        taxName: 'IVA',
        taxRate: 0.21,
        states: ['Madrid', 'Catalonia', 'Andalusia', 'Valencia', 'Basque Country']
    },
    Mexico: {
        currencyCode: 'MXN',
        currencySymbol: 'MX$',
        taxName: 'IVA',
        taxRate: 0.16,
        states: ['Ciudad de Mexico', 'Jalisco', 'Nuevo Leon', 'Puebla', 'Yucatan']
    },
    Brazil: {
        currencyCode: 'BRL',
        currencySymbol: 'R$',
        taxName: 'VAT',
        taxRate: 0.17,
        states: ['Sao Paulo', 'Rio de Janeiro', 'Bahia', 'Minas Gerais', 'Parana']
    },
    Singapore: {
        currencyCode: 'SGD',
        currencySymbol: 'S$',
        taxName: 'GST',
        taxRate: 0.09,
        states: ['Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region']
    },
    'United Arab Emirates': {
        currencyCode: 'AED',
        currencySymbol: '\u062F.\u0625',
        taxName: 'VAT',
        taxRate: 0.05,
        states: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah']
    }
};

export const DEFAULT_COUNTRY = 'India';

export const COUNTRY_PRESETS: CountryPreset[] = ALL_COUNTRY_NAMES.map((country) => {
    const override = COUNTRY_OVERRIDES[country];

    return {
        country,
        currencyCode: override?.currencyCode ?? 'USD',
        currencySymbol: override?.currencySymbol ?? '$',
        taxName: override?.taxName ?? 'Tax',
        taxRate: override?.taxRate ?? 0,
        states: override?.states ?? [country]
    };
});

export const COUNTRY_OPTIONS = COUNTRY_PRESETS.map((preset) => ({
    label: preset.country,
    value: preset.country
}));

export function getCountryPreset(country: string): CountryPreset | undefined {
    return COUNTRY_PRESETS.find((preset) => preset.country === country);
}

export function resolveCurrencySymbol(currencySymbol?: string | null, country?: string | null, currencyCode?: string | null): string {
    const preset = country ? getCountryPreset(country) : undefined;
    const trimmedSymbol = currencySymbol?.trim();
    const trimmedCode = currencyCode?.trim().toUpperCase();

    if (!trimmedSymbol) {
        return preset?.currencySymbol ?? getCountryPreset(DEFAULT_COUNTRY)?.currencySymbol ?? '$';
    }

    if (trimmedSymbol === 'Rs.' || trimmedSymbol === 'Rs' || trimmedSymbol === 'INR') {
        return '\u20B9';
    }

    if (trimmedSymbol === 'GBP') {
        return '\u00A3';
    }

    if (trimmedSymbol === 'EUR') {
        return '\u20AC';
    }

    if (trimmedSymbol === 'AED') {
        return '\u062F.\u0625';
    }

    if ((trimmedSymbol === '$' || trimmedSymbol === 'USD') && preset?.currencySymbol && preset.currencySymbol !== '$') {
        return preset.currencySymbol;
    }

    return trimmedSymbol;
}

export function resolveTaxName(taxName?: string | null, country?: string | null): string {
    return taxName?.trim() || getCountryPreset(country || '')?.taxName || 'Tax';
}

export function resolveTaxRate(taxRate?: number | null, country?: string | null): number {
    return taxRate ?? getCountryPreset(country || '')?.taxRate ?? 0;
}
