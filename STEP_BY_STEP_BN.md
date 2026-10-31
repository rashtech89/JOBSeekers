# ধাপ ৫ক — কী বদলেছে ও কীভাবে প্রকাশ করবেন

## নতুন যা আছে
1. **অ্যাকাউন্ট ও যাচাই:** রেজিস্টারের পর Spam ফোল্ডারের সতর্কতা, "আবার পাঠান" ও "আমি যাচাই করেছি" বোতাম। যাচাইয়ের পর Go to Home / Explore Jobs / Sign out (CV Builder বোতাম সরানো হয়েছে)। লগইন ফর্মে "Continue with Google" বোতাম।
2. **Admin Control Center (ট্যাব):** Branding, Themes (৬টি পুরো-সাইট থিম), Menu & links, Footer & social, Edit texts (যেকোনো লেখা ৩ ভাষায়), Pages (Privacy, Terms, নতুন পেজ)। সব সেভ ক্লাউডে, সব ভিজিটর দেখে।
3. ফুটারে যোগাযোগ, সোশ্যাল লিংক, Play Store/App Store বোতাম — Admin-এ লিংক দিলে আসে, না দিলে লুকানো।

## আগে যা করতে হবে (এটি না করলে Admin-এ সেভ করলে "Permission denied" আসবে)
1. ZIP-এর ফাইলগুলো আগের মতো GitHub-এ আপলোড করে Commit করুন (`.env.local` বাদে)। Actions-এ সবুজ টিক পর্যন্ত অপেক্ষা করুন।
2. Firebase → Firestore → **Rules** → `firestore.rules` ফাইলের লেখা পুরো বসিয়ে **Publish**। (নতুন: menu/footer/theme/texts ও pages-এর অনুমতি, এবং users-এ email ঘর।)
3. Google সাইন ইন চাইলে: Firebase → Authentication → Sign-in method → **Google** → Enable।

## পরীক্ষা
- Admin পেজ → প্রতিটি ট্যাবে বদল করে Save → অন্য ব্রাউজারে সাইট খুলে দেখুন।
- Themes ট্যাবে একটি থিম বেছে Save দিন।
- Edit texts-এ "Find Jobs" খুঁজে নিজের লেখা দিন, Save দিন।
- Pages ট্যাবে `privacy` পেজের লেখা দিয়ে Save দিন, তারপর `/privacy` খুলুন।

## এখনো বাকি
Home সেকশন ম্যানেজার, Users ও Roles, Jobs ও Bulk upload, Languages ও SEO।
সামাজিক মাধ্যমের আইকন এখন ছোট লেখা-ব্যাজ (f, IG, TT...); আসল ব্র্যান্ড আইকন পরে।
