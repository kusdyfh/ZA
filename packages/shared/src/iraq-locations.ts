/**
 * Iraq's 18 governorates and their districts/cities, for the checkout and
 * saved-address forms — delivery is Iraq-only (product decision), so both
 * fields are closed dropdowns instead of free text. District names (not
 * every neighborhood) are used as "cities" since that's the smallest unit
 * with a stable, well-known name nationwide. Source: Wikipedia's
 * "Districts of Iraq" (Halabja's districts are folded into Sulaymaniyah,
 * matching Iraq's standard 18-governorate count rather than the 19 some
 * sources use for Halabja's disputed separate-governorate status).
 */
export interface IraqGovernorate {
  name: string;
  cities: readonly string[];
}

export const IRAQ_GOVERNORATES: readonly IraqGovernorate[] = [
  {
    name: 'Baghdad',
    cities: [
      'Baghdad',
      'Abu Ghraib',
      'Al-Adhamiyah',
      'Al-Karkh',
      'Al-Kadhimiya',
      "Al-Mada'in",
      'Al-Mahmudiya',
      'Al-Rasafa',
      'Sadr City',
      'Al-Tarmia',
    ],
  },
  {
    name: 'Basra',
    cities: [
      'Basra',
      'Abu Al-Khaseeb',
      'Al-Midaina',
      'Al-Qurna',
      'Al-Zubair',
      'Al-Faw',
    ],
  },
  {
    name: 'Nineveh',
    cities: [
      'Mosul',
      "Al-Ba'aj",
      'Al-Hamdaniya',
      'Makhmur',
      'Hatra',
      'Sinjar',
      'Tal Afar',
      'Tel Keppe',
    ],
  },
  {
    name: 'Erbil',
    cities: ['Erbil', 'Koisanjaq', 'Shaqlawa', 'Soran', 'Mergasur', 'Choman'],
  },
  {
    name: 'Sulaymaniyah',
    cities: [
      'Sulaymaniyah',
      'Chamchamal',
      'Darbandikhan',
      'Dokan',
      'Kalar',
      'Rania',
      'Sharbazher',
      'Penjwin',
      'Mawat',
      'Qaradagh',
      'Halabja',
      'Sirwan',
      'Khurmal',
    ],
  },
  {
    name: 'Dohuk',
    cities: [
      'Dohuk',
      'Amadiya',
      'Zakho',
      'Sumel',
      'Akre',
      'Bardarash',
      'Shekhan',
    ],
  },
  {
    name: 'Kirkuk',
    cities: ['Kirkuk', 'Al-Hawiga', 'Daquq', 'Al-Dibs'],
  },
  {
    name: 'Anbar',
    cities: [
      'Ramadi',
      'Fallujah',
      'Al-Qaim',
      'Haditha',
      'Hit',
      'Anah',
      'Rawah',
      'Ar-Rutba',
    ],
  },
  {
    name: 'Najaf',
    cities: ['Najaf', 'Kufa', 'Al-Manathera', 'Al-Meshkhab'],
  },
  {
    name: 'Karbala',
    cities: ['Karbala', 'Ain Al-Tamur', 'Al-Hindiya'],
  },
  {
    name: 'Babil',
    cities: ['Hilla', 'Al-Mahawil', 'Al-Musayab', 'Al-Hashimiya'],
  },
  {
    name: 'Wasit',
    cities: [
      'Kut',
      'Al-Aziziyah',
      'Al-Hai',
      "Al-Na'maniya",
      'Al-Suwaira',
      'Badra',
    ],
  },
  {
    name: 'Diyala',
    cities: [
      'Baquba',
      'Al-Khalis',
      'Al-Muqdadiya',
      'Baladrooz',
      'Khanaqin',
      'Kifri',
    ],
  },
  {
    name: 'Saladin',
    cities: [
      'Tikrit',
      'Samarra',
      'Baiji',
      'Balad',
      'Al-Daur',
      'Al-Shirqat',
      'Tuz Khurmatu',
      'Dujail',
    ],
  },
  {
    name: 'Diwaniyah',
    cities: ['Diwaniyah', 'Afaq', 'Al-Shamiya', 'Hamza'],
  },
  {
    name: 'Muthanna',
    cities: ['Samawa', 'Al-Khidhir', 'Al-Rumaitha', 'Al-Salman'],
  },
  {
    name: 'Dhi Qar',
    cities: [
      'Nasiriyah',
      'Al-Chibayish',
      "Al-Rifa'i",
      'Al-Shatra',
      'Suq Al-Shoyokh',
    ],
  },
  {
    name: 'Maysan',
    cities: [
      'Amara',
      'Ali Al-Gharbi',
      'Al-Kahla',
      'Al-Maimouna',
      'Al-Mejar Al-Kabir',
      "Qal'at Saleh",
    ],
  },
] as const;

export const IRAQ_GOVERNORATE_NAMES: readonly string[] = IRAQ_GOVERNORATES.map(
  (g) => g.name,
);

export function citiesForGovernorate(governorate: string): readonly string[] {
  return IRAQ_GOVERNORATES.find((g) => g.name === governorate)?.cities ?? [];
}

export function isValidIraqCity(governorate: string, city: string): boolean {
  return citiesForGovernorate(governorate).includes(city);
}
