export const LIBERIA_COUNTIES = [
  'Bomi',
  'Bong',
  'Gbarpolu',
  'Grand Bassa',
  'Grand Cape Mount',
  'Grand Gedeh',
  'Grand Kru',
  'Lofa',
  'Margibi',
  'Maryland',
  'Montserrado',
  'Nimba',
  'River Cess',
  'River Gee',
  'Sinoe',
] as const;

export type LiberiaCounty = (typeof LIBERIA_COUNTIES)[number];

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'Standard English',
    status: 'active',
    reviewNote: 'Primary reviewed interface and guide language',
  },
  {
    code: 'bas',
    label: 'Bassa',
    nativeLabel: 'Bassa (Audio Lab Prototype)',
    status: 'preview',
    reviewNote: 'Prioritized in Local Language AI Lab with native-speaker audio recordings; unrecorded UI falls back to English',
  },
  {
    code: 'man',
    label: 'Mano',
    nativeLabel: 'Mano (Audio Lab Prototype)',
    status: 'preview',
    reviewNote: 'Prioritized in Local Language AI Lab with native-speaker audio recordings; unrecorded UI falls back to English',
  },
  {
    code: 'lre',
    label: 'Liberian English',
    nativeLabel: 'Liberian English (Preview)',
    status: 'preview',
    reviewNote: 'Only reviewed strings appear in Liberian English; unreviewed content falls back safely to English',
  },
  {
    code: 'kpe',
    label: 'Kpelle',
    nativeLabel: 'Kpelle (Coming Soon)',
    status: 'coming_soon',
    reviewNote: 'Scheduled for future expansion and community translator review',
  },
] as const;

export const MARKETPLACE_CATEGORIES = [
  'Rice and grains',
  'Cassava and root crops',
  'Vegetables',
  'Fruits and plantains',
  'Poultry and eggs',
  'Livestock',
  'Fish and seafood',
  'Seeds and seedlings',
  'Agricultural supplies',
] as const;

export const MARKETPLACE_UNITS = [
  'kg',
  '50kg bag',
  '25kg bag',
  'bunch',
  'crate (30 eggs)',
  'bird',
  'animal',
  'basket',
  'bundle',
  'liter',
] as const;

export const QUESTION_STATUSES = [
  'Submitted',
  'Assigned',
  'Awaiting Clarification',
  'Answered',
  'Closed',
] as const;

export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const USER_ROLES = ['farmer', 'expert', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
