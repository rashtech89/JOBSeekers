import type { Lang } from '../i18n/translations'

export type CvTemplate = 'modern' | 'europass'
export type Experience = { id: string; company: string; role: string; from: string; to: string; current: boolean; description: string }
export type Education = { id: string; school: string; degree: string; from: string; to: string }
export type LangSkill = { id: string; name: string; level: string }

export type CvData = {
  lang: Lang; template: CvTemplate
  fullName: string; headline: string; email: string; phone: string; address: string
  nationality: string; birthDate: string; photo: string; summary: string
  experience: Experience[]; education: Education[]; skills: string
  languages: LangSkill[]; certificates: string; references: string
}
export type SavedCv = { id: string; updatedAt: string; data: CvData }

export const uid = () => Math.random().toString(36).slice(2, 10)

export const emptyCv = (lang: Lang): CvData => ({
  lang, template: 'modern', fullName: '', headline: '', email: '', phone: '', address: '', nationality: '', birthDate: '',
  photo: '', summary: '', experience: [], education: [], skills: '', languages: [], certificates: '', references: '',
})
export const newSaved = (lang: Lang): SavedCv => ({ id: uid(), updatedAt: new Date().toISOString(), data: emptyCv(lang) })

const KEY = 'jobseekers-cvs'
export function loadCvs(): SavedCv[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
export function saveCvs(list: SavedCv[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true } catch { return false }
}

const en = {
  title: 'CV Builder', sub: 'Fill in the fields and download your CV in A4 size.', cvLanguage: 'CV language', template: 'Template',
  modern: 'Modern', europass: 'Europass-style', personal: 'Personal information', fullName: 'Full name', headline: 'Job title / headline',
  email: 'Email', phone: 'Phone', address: 'Address', nationality: 'Nationality', birthDate: 'Date of birth', photo: 'Photo',
  choosePhoto: 'Choose photo', removePhoto: 'Remove photo', summary: 'Professional summary', experience: 'Work experience',
  company: 'Company', role: 'Position', from: 'From', to: 'To', present: 'Present', description: 'Duties and details',
  education: 'Education', school: 'Institution', degree: 'Degree / subject', skills: 'Skills', skillsHint: 'Separate with commas or new lines',
  languages: 'Languages', langName: 'Language', level: 'Level', certificates: 'Certificates and training', references: 'References',
  add: 'Add', remove: 'Remove', download: 'Download PDF (A4)', downloadHint: 'In the print window choose "Save as PDF" and paper size A4.',
  newCv: 'New CV', duplicate: 'Copy', deleteCv: 'Delete CV', myCvs: 'My CVs', untitled: 'Untitled CV', edit: 'Edit', preview: 'Preview',
  privacyNote: 'Your data stays in this browser on this device. It is not sent to any server.',
  saveError: 'Could not save in this browser (the photo may be too large).', contact: 'Contact',
}
export type CvKey = keyof typeof en

const bn: Record<CvKey, string> = {
  title: 'সিভি বিল্ডার', sub: 'ঘর পূরণ করুন এবং A4 সাইজে সিভি ডাউনলোড করুন।', cvLanguage: 'সিভির ভাষা', template: 'টেমপ্লেট',
  modern: 'আধুনিক', europass: 'Europass-ধাঁচ', personal: 'ব্যক্তিগত তথ্য', fullName: 'পূর্ণ নাম', headline: 'পদবি / শিরোনাম',
  email: 'ইমেইল', phone: 'ফোন', address: 'ঠিকানা', nationality: 'জাতীয়তা', birthDate: 'জন্ম তারিখ', photo: 'ছবি',
  choosePhoto: 'ছবি বাছুন', removePhoto: 'ছবি সরান', summary: 'পেশাগত সারসংক্ষেপ', experience: 'কাজের অভিজ্ঞতা',
  company: 'কোম্পানি', role: 'পদ', from: 'শুরু', to: 'শেষ', present: 'বর্তমান', description: 'দায়িত্ব ও বিবরণ',
  education: 'শিক্ষা', school: 'প্রতিষ্ঠান', degree: 'ডিগ্রি / বিষয়', skills: 'দক্ষতা', skillsHint: 'কমা বা নতুন লাইন দিয়ে আলাদা করুন',
  languages: 'ভাষা', langName: 'ভাষা', level: 'দক্ষতার স্তর', certificates: 'সার্টিফিকেট ও প্রশিক্ষণ', references: 'রেফারেন্স',
  add: 'যোগ করুন', remove: 'মুছুন', download: 'PDF ডাউনলোড (A4)', downloadHint: 'প্রিন্ট উইন্ডোতে "Save as PDF" ও A4 সাইজ বাছুন।',
  newCv: 'নতুন সিভি', duplicate: 'কপি', deleteCv: 'সিভি মুছুন', myCvs: 'আমার সিভি', untitled: 'নামহীন সিভি', edit: 'সম্পাদনা', preview: 'প্রিভিউ',
  privacyNote: 'আপনার তথ্য শুধু এই ডিভাইসের ব্রাউজারে থাকে, কোনো সার্ভারে যায় না।',
  saveError: 'এই ব্রাউজারে সেভ করা গেল না (ছবি বড় হতে পারে)।', contact: 'যোগাযোগ',
}
const ar: Record<CvKey, string> = {
  title: 'منشئ السيرة الذاتية', sub: 'املأ الحقول وحمّل سيرتك الذاتية بحجم A4.', cvLanguage: 'لغة السيرة الذاتية', template: 'القالب',
  modern: 'عصري', europass: 'بنمط أوروباس', personal: 'المعلومات الشخصية', fullName: 'الاسم الكامل', headline: 'المسمى الوظيفي',
  email: 'البريد الإلكتروني', phone: 'الهاتف', address: 'العنوان', nationality: 'الجنسية', birthDate: 'تاريخ الميلاد', photo: 'الصورة',
  choosePhoto: 'اختيار صورة', removePhoto: 'إزالة الصورة', summary: 'الملخص المهني', experience: 'الخبرة العملية',
  company: 'الشركة', role: 'المسمى الوظيفي', from: 'من', to: 'إلى', present: 'حتى الآن', description: 'المهام والتفاصيل',
  education: 'التعليم', school: 'المؤسسة التعليمية', degree: 'الشهادة / التخصص', skills: 'المهارات', skillsHint: 'افصل بينها بفاصلة أو سطر جديد',
  languages: 'اللغات', langName: 'اللغة', level: 'المستوى', certificates: 'الشهادات والدورات', references: 'المراجع',
  add: 'إضافة', remove: 'حذف', download: 'تحميل PDF (A4)', downloadHint: 'في نافذة الطباعة اختر «حفظ كملف PDF» وحجم الورق A4.',
  newCv: 'سيرة جديدة', duplicate: 'نسخ', deleteCv: 'حذف السيرة', myCvs: 'سيري الذاتية', untitled: 'سيرة بدون اسم', edit: 'تعديل', preview: 'معاينة',
  privacyNote: 'تُحفظ بياناتك في متصفحك على هذا الجهاز فقط ولا تُرسل إلى أي خادم.',
  saveError: 'تعذّر الحفظ في هذا المتصفح (ربما الصورة كبيرة).', contact: 'التواصل',
}
export const cvLabels: Record<Lang, Record<CvKey, string>> = { en, bn, ar }
