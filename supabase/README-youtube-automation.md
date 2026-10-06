# AROPL FARSI — YouTube Automation (Supabase Edge Function)

خودکارسازی یوتیوب — سیستم مستقل از تیک‌تاک و مستقل از فرانت‌اند سایت.

## چطور کار می‌کند

1. **Edge Function** (`supabase/functions/youtube-watcher/index.ts`) هر ۳۰ دقیقه اجرا می‌شود (pg_cron).
2. فید RSS عمومی هر دو کانال را می‌خواند — **بدون API Key و بدون کوتا**:
   - فارسی: `UCVcoPlC8eaMcpkqareJShcQ` (@ahmadireligion_fa)
   - انگلیسی: `UCyZ9Sq0VhcRYC6Yo9kvZiug` (@themahdihasappeared)
3. ویدیوهای جدید را با جدول `yt_seen` در دیتابیس دیکۀ می‌کند (بدون تکرار).
4. ویدیوی جدید → به انتهای آرایهٔ `content/youtube/youtube-fa.json` (یا `-en.json`) اضافه می‌شود و با یک کامیت خودکار پوش می‌شود.
5. پوش → Cloudflare Pages خودکار بیلد می‌کند → `build-content.py` کارت جدید را **جدیدترین-اول** در اسلایدر رندر می‌کند.
6. فرانت‌اند سایت **هیچ تغییری نکرده** — همان اسلایدر، همان ظاهر.

تیک‌تاک لایو دست‌نخورده: بک‌اند Render + `tiktok-live.js` همان‌که بود.

## ست‌آپ (یک‌بار)

### ۱. سیکرت‌ها
در Terminal با Supabase CLI (یا Dashboard → Edge Functions → Secrets):
```bash
supabase secrets set \
  GITHUB_TOKEN=ghp_xxx \        # PAT با دسترسی contents:write روی Persian-AROPL
  GITHUB_REPO=alirezaiwisi1/Persian-AROPL \
  GITHUB_BRANCH=main \
  CRON_SECRET=<یک رشتهٔ تصادفی>
```

### ۲. دیتابیس
Dashboard → SQL Editor → محتوای `supabase/migrations/001_yt_watcher.sql` را اجرا کن
(بخش cron پایین فایل را بعد از ساخت فانکشن فعال کن و `<PROJECT_REF>` و `<CRON_SECRET>` را جایگزین کن).

### ۳. دیپلوی فانکشن
```bash
supabase functions deploy youtube-watcher
```

### ۴. تست دستی
```bash
curl -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/youtube-watcher' \
  -H 'Authorization: Bearer <CRON_SECRET>'
```
پاسخ باید `{"ok":true,"results":{"fa":{"added":0,...},"en":{...}}}` بدهد
(بار اول ممکن است ویدیوهای موجود RSS را به‌عنوان جدید ثبت کند — دفعهٔ بعد صفر است).

## نکات مهم

- RSS فقط ۱۵ ویدیوی آخر هر کانال را می‌دهد — کافی است چون فیلد `yt_seen` جلوی تکرار را می‌گیرد.
- دیپلوی prod سایت (aroplfarsi) همچنان دستی است: بعد از هر ویدیوی جدید، Cloudflare → Create deployment.
- ساختار entry ویدیو دقیقاً همان `YT_DEFAULTS` بیلد است (autoTitle, thumb, …).
- این سیستم هیچ ربطی به تیک‌تاک ندارد؛ اگر خطا بدهد فقط یوتیوب متوقف می‌ماند.
