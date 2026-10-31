# Job Seekers — Firebase ও GitHub Pages সেটআপ (ধাপ ৪)

কনসোলের বোতামের নাম একটু আলাদা হতে পারে। না মিললে স্ক্রিনশট পাঠান।
**ক্রম মানুন।** আগে নিরাপত্তা rules, তারপর Admin, সবশেষে GitHub।

## ধাপ ক — নিজের কম্পিউটারে চালানো
1. ZIP খুলুন, ফোল্ডারে Terminal খুলুন।
2. `npm install` (Firebase প্যাকেজ নামবে)।
3. `npm run dev` → http://localhost:5173
4. `.env.local` ফাইলে আপনার Firebase মান আগে থেকেই বসানো আছে। এই ফাইল কাউকে পাঠাবেন না, GitHub-এও দেবেন না।

## ধাপ খ — Firestore নিরাপত্তা rules বসান (সবচেয়ে জরুরি)
1. Firebase Console → **Firestore Database → Rules** ট্যাব।
2. ভেতরের সব লেখা মুছে প্রজেক্টের `firestore.rules` ফাইলের পুরো লেখা বসান।
3. **Publish** চাপুন।
   - ফলাফল: কেউ Admin ছাড়া সাইটের সেটিংস বদলাতে পারবে না। প্রতিটি ব্যবহারকারী শুধু নিজের প্রোফাইল দেখতে পারবে। বাকি সব ডিফল্টে বন্ধ।

## ধাপ গ — নিজের অ্যাকাউন্ট বানান ও Admin করুন
1. `npm run dev` চালু রেখে http://localhost:5173/register এ নিজের ইমেইল ও পাসওয়ার্ডে অ্যাকাউন্ট বানান। পাসওয়ার্ড ৮ অক্ষরের বেশি ও অনন্য রাখুন।
2. Firebase Console → **Authentication → Users**। আপনার ইমেইলের পাশের **User UID** কপি করুন।
3. **Firestore Database → Data → Start collection**:
   - Collection ID: `admins`
   - Document ID: কপি করা **UID** বসান (পেস্ট করুন, হাতে লিখবেন না)।
   - Field: নাম `role`, Type `string`, মান `admin` → **Save**।
4. সাইটে `http://localhost:5173/ayat13jan26` খুলুন। লগইন দেখালে লগইন করুন, তারপর Admin Control Center খুলবে।
   - অন্য কোনো অ্যাকাউন্টে ঢুকলে "Access denied" দেখাবে। এটাই ঠিক।
5. Admin-এ সাইটের নাম বদলে Save দিন। "Saved to the cloud" লেখা এলে সফল। Firestore-এ `siteSettings → main` নামে একটি ডকুমেন্ট তৈরি হবে।

## ধাপ ঘ — GitHub-এ কোড তুলুন
1. আপনার নতুন repository খুলুন।
2. ZIP-এর ভেতরের সব ফাইল আপলোড করুন (Add file → Upload files), **তবে এগুলো দেবেন না:**
   - `.env.local` (আপনার গোপন লিংক ও কনফিগ আছে)
   - `node_modules` ফোল্ডার (থাকলে)
3. `.github` ফোল্ডার ওয়েব আপলোডে কখনো বাদ পড়ে যায়। Commit-এর পর repo-তে `.github/workflows/deploy.yml` আছে কি না দেখুন। না থাকলে Add file → Create new file, নাম লিখুন `.github/workflows/deploy.yml` এবং ফাইলের লেখা পেস্ট করুন।
4. Branch-এর নাম `main` হতে হবে। অন্য নাম হলে `deploy.yml`-এ `branches: [main]` বদলান।

## ধাপ ঙ — GitHub-এ কনফিগ বসান
Repository → **Settings → Secrets and variables → Actions → Variables ট্যাব → New repository variable**। নিচের প্রতিটি একটি করে তৈরি করুন (নাম হুবহু):
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_ADMIN_PATH`
মান `.env.local` থেকে কপি করুন। `VITE_ADMIN_PATH`-এর মান `/ayat13jan26` (শুরুতে `/` সহ)।

## ধাপ চ — GitHub Pages চালু
1. **Settings → Pages → Build and deployment → Source: GitHub Actions**।
2. **Actions** ট্যাবে "Deploy to GitHub Pages" চলছে কি না দেখুন। সবুজ টিক এলে সাইট চালু।
   - লাল ক্রস এলে ওই ধাপের লগ কপি করে আমাকে পাঠান।
3. সাইটের ঠিকানা: `https://আপনার-username.github.io/repository-নাম/`
   - repository-র নাম `USERNAME.github.io` হলে `deploy.yml`-এ `VITE_BASE: /` করতে হবে।
   - আমার জানামতে ফ্রি Pages সাধারণত Public repo-তে চলে। এটি GitHub-এর বর্তমান নিয়মে দেখে নিন।

## ধাপ ছ — Firebase-এ সাইটের ঠিকানা অনুমোদন
Firebase Console → **Authentication → Settings → Authorized domains → Add domain** → `আপনার-username.github.io` (শুধু ডোমেইন, পাথ ছাড়া)। এটি না করলে সাইটে লগইন ব্যর্থ হবে।

## ধাপ জ — API key সীমিত করুন (নিরাপত্তা)
1. console.cloud.google.com → project `job-seekers-2` → **APIs & Services → Credentials**।
2. "Browser key" (Firebase-এর key) খুলুন → **Websites (HTTP referrers)** বাছুন → যোগ করুন: `https://আপনার-username.github.io/*` এবং `http://localhost:5173/*` → Save।
3. কয়েক মিনিট পর সাইটে লগইন আবার পরীক্ষা করুন। না চললে ঠিকানা ভুল হতে পারে।

## পরীক্ষার তালিকা
- হোম খোলে, ভাষা বদলায়, পেজ রিফ্রেশে 404 আসে না।
- `/register`-এ নতুন অ্যাকাউন্ট খোলে, ইমেইল যাচাইয়ের মেইল আসে।
- `/admin` লিখলে 404; গোপন লিংকে লগইন চায়; অন্য অ্যাকাউন্টে Access denied।
- Admin-এ লোগো/নাম বদলে Save দিলে অন্য ব্রাউজারেও বদল দেখা যায়।

## মনে রাখুন
- গোপন লিংক শুধু লুকানো, নিরাপত্তা আসে লগইন ও rules থেকে।
- ইমেইল verification মেইল spam-এ যেতে পারে।
- এখনো চাকরির ডেটা কোডে (demo)। Firestore-এ চাকরি পোস্ট ধাপ ৫-এ আসছে।
- Firebase Free (Spark) plan-এর সীমা Firebase-এর বর্তমান পেজে যাচাই করুন।
