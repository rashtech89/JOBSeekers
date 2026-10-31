import type { Lang } from '../i18n/translations'

// Headings printed ON the CV document, in the language chosen for the CV itself.
export const cvLabels: Record<Lang, Record<string, string>> = {
  en: { contact: 'Contact', summary: 'Profile', experience: 'Work experience', education: 'Education and training', skills: 'Skills',
    languages: 'Languages', certificates: 'Certificates', references: 'References', present: 'Present', nationality: 'Nationality',
    birth: 'Date of birth', basic: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced', native: 'Native', refs: 'Available on request' },
  bn: { contact: 'যোগাযোগ', summary: 'পরিচিতি', experience: 'কাজের অভিজ্ঞতা', education: 'শিক্ষা ও প্রশিক্ষণ', skills: 'দক্ষতা',
    languages: 'ভাষা', certificates: 'সার্টিফিকেট', references: 'রেফারেন্স', present: 'বর্তমান', nationality: 'জাতীয়তা',
    birth: 'জন্ম তারিখ', basic: 'প্রাথমিক', intermediate: 'মাঝারি', advanced: 'উন্নত', native: 'মাতৃভাষা', refs: 'চাইলে দেওয়া হবে' },
  ar: { contact: 'معلومات الاتصال', summary: 'نبذة', experience: 'الخبرة العملية', education: 'التعليم والتدريب', skills: 'المهارات',
    languages: 'اللغات', certificates: 'الشهادات', references: 'المراجع', present: 'حتى الآن', nationality: 'الجنسية',
    birth: 'تاريخ الميلاد', basic: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم', native: 'اللغة الأم', refs: 'متوفرة عند الطلب' },
}
