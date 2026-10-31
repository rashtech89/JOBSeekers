/** Resolves files in /public for both local dev and GitHub Pages (sub-path) hosting. */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export type PostTag = 'inCountry' | 'transferableResidency' | 'article18' | 'accommodation'

/** One phone number printed on a poster. Each number says whether it accepts calls and/or WhatsApp. */
export type PhoneContact = {
  number: string
  /** Country calling code WITHOUT "+". ASSUMPTION for demo data: posters show local numbers only. Verify before publishing. */
  dialCode: string
  calls: boolean
  whatsapp: boolean
}

export type Position = {
  title: string
  subtitle?: string
  category: string
  responsibilities?: string[]
  requirements: string[]
}

/** A poster-level post. One poster may advertise several positions. */
export type Post = {
  id: string
  company?: string
  country?: string
  city?: string
  posterUrl: string
  positions: Position[]
  generalRequirements?: string[]
  howToApply?: string
  phones: PhoneContact[]
  emails: string[]
  mapsUrl?: string
  applyUrl?: string
  tags: PostTag[]
  postedAt: string // ISO date
  status: 'draft' | 'pending' | 'published' | 'expired' | 'archived'
}

/** Flat view used by search pages: one row per position. */
export type Listing = { key: string; post: Post; position: Position }

// Demo data taken from the four sample posters supplied by the site owner.
// Only facts printed on the posters are used; unknown fields are left empty.
export const demoPosts: Post[] = [
  {
    id: 'post-gulf-driver',
    company: 'Gulf Eastern Group',
    country: 'Kuwait',
    posterUrl: asset('demo/poster-gulf-driver.jpg'),
    positions: [{
      title: 'Heavy Vehicle Driver', subtitle: 'Trailer & Sewage Tanker Driver', category: 'Driving',
      requirements: [
        'Valid Kuwait general or heavy driving license',
        'Ability to drive both trailers and sewage tanker trucks',
        'Availability to join at the earliest possible date is preferred',
      ],
    }],
    howToApply: 'Please send only a photo of your driving license via WhatsApp. WhatsApp messages only – no calls.',
    phones: [{ number: '55381115', dialCode: '965', calls: false, whatsapp: true }],
    emails: [], tags: ['inCountry', 'transferableResidency', 'article18', 'accommodation'],
    postedAt: '2026-10-29', status: 'published',
  },
  {
    id: 'post-gulf-secretary-sales',
    company: 'Gulf Eastern Group',
    country: 'Kuwait',
    posterUrl: asset('demo/poster-gulf-secretary-sales.jpg'),
    positions: [
      {
        title: 'Secretary', category: 'Administration',
        requirements: [
          'Experience in office and administrative work', 'Relevant qualification',
          'Excellent command of English (spoken and written)', 'Proficiency in computer skills and MS Office programs',
          'Driving license is not required',
        ],
      },
      {
        title: 'Outdoor Sales', category: 'Sales',
        requirements: [
          'Minimum 2 years of sales experience', 'Relevant qualification',
          'Excellent command of English (spoken and written)', 'Proficiency in computer skills and MS Office programs',
          'Valid Kuwaiti driving license',
        ],
      },
    ],
    howToApply: 'Please send your CV with the applied position via WhatsApp message. Messages only – no calls.',
    phones: [{ number: '92222536', dialCode: '965', calls: false, whatsapp: true }],
    emails: [], tags: ['inCountry'],
    postedAt: '2026-10-28', status: 'published',
  },
  {
    id: 'post-content-creator',
    // Company name and location are not printed on this poster, so they are left empty.
    posterUrl: asset('demo/poster-content-creator.jpg'),
    positions: [{
      title: 'Social Media & Content Creator', category: 'Marketing',
      responsibilities: [
        'Capture photos and videos in store and products', 'Create and edit short videos for social media',
        'Edit and enhance photos for social media', 'Manage and grow our Instagram account (content planning, posting, stories)',
        'Follow basic performance and engagement', 'Bring creative ideas to showcase our products',
      ],
      requirements: [
        'Good knowledge of photography and video shooting', 'Basic knowledge of editing tools (e.g. CapCut, Premiere, Canva, etc.)',
        'Good understanding of Instagram (Feed, Reels, Stories)', 'Creative and organized', 'Ability to work independently',
      ],
    }],
    howToApply: 'Send your CV and samples of your work (photos or videos).',
    phones: [], emails: ['info@uvaro.net'], tags: [],
    postedAt: '2026-10-27', status: 'published',
  },
  {
    id: 'post-perfume',
    company: 'A reputed perfume company',
    country: 'Kuwait',
    posterUrl: asset('demo/poster-perfume.jpg'),
    positions: [
      {
        title: 'Secretary', category: 'Administration',
        requirements: [
          'Experience in secretarial duties, scheduling, and correspondence',
          'Proficiency in Microsoft Office with good organizational and communication skills',
        ],
      },
      {
        title: 'Marketing Executive', category: 'Marketing',
        requirements: [
          'Experience in product marketing and executing marketing campaigns',
          'Proficiency in managing social media accounts and creating marketing content',
        ],
      },
    ],
    generalRequirements: ['Proficiency in Arabic and English', 'Candidates must currently be based in Kuwait', 'Valid transferable residency'],
    howToApply: 'Please send your CV and mention the job position.',
    phones: [], emails: ['info@meccaperfumes.com'], tags: ['inCountry', 'transferableResidency'],
    postedAt: '2026-10-26', status: 'published',
  },
]

export function listingsFrom(posts: Post[]): Listing[] {
  return posts.filter(p => p.status === 'published' || p.status === 'expired')
    .flatMap(post => post.positions.map((position, i) => ({ key: `${post.id}-${i}`, post, position })))
}

export const allListings = listingsFrom(demoPosts)
export const findPost = (id?: string) => demoPosts.find(p => p.id === id && (p.status === 'published' || p.status === 'expired'))

export function whatsappUrl(internationalNumber: string, message = 'Hello, I am interested in this job. Please share more details.') {
  const digits = internationalNumber.replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
export const telUrl = (p: PhoneContact) => `tel:+${p.dialCode}${p.number.replace(/\D/g, '')}`

export type JobTab = 'latest' | 'last' | 'old'
export const jobTabs: JobTab[] = ['latest', 'last', 'old']
/** Default windows. These become Admin-editable settings in the Firebase phase. */
export const TAB_LIMITS = { latestDays: 7, lastDays: 30 }

/** Latest = newest posts, Last = the previous list, Old = older or expired posts. */
export function tabOf(post: Post, now: number = Date.now()): JobTab {
  if (post.status === 'expired' || post.status === 'archived') return 'old'
  const ageDays = (now - new Date(post.postedAt).getTime()) / 86_400_000
  if (ageDays <= TAB_LIMITS.latestDays) return 'latest'
  return ageDays <= TAB_LIMITS.lastDays ? 'last' : 'old'
}
