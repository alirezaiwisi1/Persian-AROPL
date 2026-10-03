// tina/config.ts
import { defineConfig } from "tinacms";
var config_default = defineConfig({
  branch: process.env.GITHUB_BRANCH || process.env.HEAD || "main",
  // Credentials come from the environment only — never hard-coded.
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID ?? process.env.PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      publicFolder: "public",
      mediaRoot: "assets/images/uploads"
    }
  },
  schema: {
    collections: [
      {
        name: "settings",
        label: "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0633\u0627\u06CC\u062A \u2014 Site Settings",
        path: "content/settings",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { name: "siteName", label: "\u0646\u0627\u0645 \u0633\u0627\u06CC\u062A \u2014 Site name", type: "string" },
          { name: "tagline", label: "\u0634\u0639\u0627\u0631 \u2014 Tagline", type: "string" },
          { name: "metaDescriptionFa", label: "\u062A\u0648\u0636\u06CC\u062D \u0645\u062A\u0627 \u2014 Meta description", type: "string", ui: { component: "textarea" } },
          { name: "heroKicker", label: "\u0647\u06CC\u0631\u0648 \u2014 \u0645\u062A\u0646 \u0628\u0627\u0644\u0627\u06CC \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "heroTitle", label: "\u0647\u06CC\u0631\u0648 \u2014 \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "heroTitleSuffix", label: "\u0647\u06CC\u0631\u0648 \u2014 \u067E\u0633\u0648\u0646\u062F \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "heroParagraph", label: "\u0647\u06CC\u0631\u0648 \u2014 \u067E\u0627\u0631\u0627\u06AF\u0631\u0627\u0641", type: "string", ui: { component: "textarea" } },
          { name: "heroCtaLabel", label: "\u0647\u06CC\u0631\u0648 \u2014 \u062F\u06A9\u0645\u0647", type: "string" },
          { name: "aboutKicker", label: "\u062F\u0631\u0628\u0627\u0631\u0647 \u2014 \u06A9\u06CC\u06A9\u0631", type: "string" },
          { name: "aboutTitle", label: "\u062F\u0631\u0628\u0627\u0631\u0647 \u2014 \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "aboutParagraph", label: "\u062F\u0631\u0628\u0627\u0631\u0647 \u2014 \u067E\u0627\u0631\u0627\u06AF\u0631\u0627\u0641", type: "string", ui: { component: "textarea" } },
          { name: "booksKicker", label: "\u06A9\u062A\u0627\u0628\u200C\u0647\u0627 \u2014 \u06A9\u06CC\u06A9\u0631", type: "string" },
          { name: "booksTitle", label: "\u06A9\u062A\u0627\u0628\u200C\u0647\u0627 \u2014 \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "booksParagraph", label: "\u06A9\u062A\u0627\u0628\u200C\u0647\u0627 \u2014 \u067E\u0627\u0631\u0627\u06AF\u0631\u0627\u0641", type: "string", ui: { component: "textarea" } },
          { name: "videosKicker", label: "\u0648\u06CC\u062F\u06CC\u0648\u0647\u0627 \u2014 \u06A9\u06CC\u06A9\u0631", type: "string" },
          { name: "videosTitle", label: "\u0648\u06CC\u062F\u06CC\u0648\u0647\u0627 \u2014 \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "videosParagraph", label: "\u0648\u06CC\u062F\u06CC\u0648\u0647\u0627 \u2014 \u067E\u0627\u0631\u0627\u06AF\u0631\u0627\u0641", type: "string", ui: { component: "textarea" } },
          { name: "liveKicker", label: "\u062A\u06CC\u06A9\u200C\u062A\u0627\u06A9 \u2014 \u06A9\u06CC\u06A9\u0631", type: "string" },
          { name: "liveTitle", label: "\u062A\u06CC\u06A9\u200C\u062A\u0627\u06A9 \u2014 \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "liveParagraph", label: "\u062A\u06CC\u06A9\u200C\u062A\u0627\u06A9 \u2014 \u067E\u0627\u0631\u0627\u06AF\u0631\u0627\u0641", type: "string", ui: { component: "textarea" } },
          { name: "channelsKicker", label: "\u0634\u0628\u06A9\u0647\u200C\u0647\u0627 \u2014 \u06A9\u06CC\u06A9\u0631", type: "string" },
          { name: "channelsTitle", label: "\u0634\u0628\u06A9\u0647\u200C\u0647\u0627 \u2014 \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "channelsParagraph", label: "\u0634\u0628\u06A9\u0647\u200C\u0647\u0627 \u2014 \u067E\u0627\u0631\u0627\u06AF\u0631\u0627\u0641", type: "string", ui: { component: "textarea" } },
          { name: "ctaTitle", label: "\u067E\u0627\u06CC\u0627\u0646 \u0635\u0641\u062D\u0647 \u2014 \u0639\u0646\u0648\u0627\u0646", type: "string" },
          { name: "ctaParagraph", label: "\u067E\u0627\u06CC\u0627\u0646 \u0635\u0641\u062D\u0647 \u2014 \u067E\u0627\u0631\u0627\u06AF\u0631\u0627\u0641", type: "string" },
          {
            name: "tiktokApiBase",
            label: "TikTok LIVE API base (backend URL)",
            type: "string",
            description: "\u0622\u062F\u0631\u0633 \u0628\u06A9\u200C\u0627\u0646\u062F \u062A\u0634\u062E\u06CC\u0635 \u067E\u062E\u0634 \u0632\u0646\u062F\u0647. \u0648\u0636\u0639\u06CC\u062A LIVE \u0647\u0645\u06CC\u0634\u0647 \u0627\u0632 \u0647\u0645\u06CC\u0646 \u0628\u06A9\u200C\u0627\u0646\u062F \u0645\u06CC\u200C\u0622\u06CC\u062F."
          },
          { name: "tiktokRefreshMs", label: "\u0628\u0627\u0632\u0647 \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0648\u0636\u0639\u06CC\u062A (\u0645\u06CC\u0644\u06CC\u200C\u062B\u0627\u0646\u06CC\u0647)", type: "number" },
          { name: "footerNote", label: "\u0645\u062A\u0646 \u0641\u0648\u062A\u0631", type: "string" }
        ]
      },
      {
        name: "books",
        label: "\u06A9\u062A\u0627\u0628\u200C\u0647\u0627 \u2014 Books",
        path: "content/books",
        format: "json",
        fields: [
          { name: "variant", label: "\u0634\u0646\u0627\u0633\u0647 \u0638\u0627\u0647\u0631\u06CC (\u0645\u0627\u0646\u0646\u062F manifesto)", type: "string", description: "CSS modifier \u0631\u0648\u06CC book-card\u2014" },
          { name: "coverImage", label: "\u062C\u0644\u062F \u06A9\u062A\u0627\u0628", type: "image" },
          { name: "coverAlt", label: "\u0645\u062A\u0646 \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u062C\u0644\u062F", type: "string" },
          { name: "coverRatio", label: "\u0646\u0633\u0628\u062A \u062C\u0644\u062F (\u0639\u0631\u0636/\u0627\u0631\u062A\u0641\u0627\u0639)", type: "number" },
          { name: "restRotateY", label: "\u0632\u0627\u0648\u06CC\u0647 \u0686\u0631\u062E\u0634 Y", type: "number" },
          { name: "restRotateX", label: "\u0632\u0627\u0648\u06CC\u0647 \u0686\u0631\u062E\u0634 X", type: "number" },
          { name: "spineLabel", label: "\u0639\u0637\u0641 \u06A9\u062A\u0627\u0628", type: "string" },
          { name: "titleFa", label: "\u0639\u0646\u0648\u0627\u0646 (\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0634\u0627\u0645\u0644 <br><em> \u0628\u0627\u0634\u062F)", type: "string", ui: { component: "textarea" } },
          { name: "descriptionFa", label: "\u062A\u0648\u0636\u06CC\u062D", type: "string", ui: { component: "textarea" } },
          { name: "pdfUrl", label: "\u0644\u06CC\u0646\u06A9 PDF", type: "string" },
          { name: "audioUrl", label: "\u0644\u06CC\u0646\u06A9 \u062E\u0648\u0627\u0646\u0634 \u0635\u0648\u062A\u06CC (\u062A\u0644\u06AF\u0631\u0627\u0645)", type: "string" },
          { name: "officialUrl", label: "\u0644\u06CC\u0646\u06A9 \u062F\u0627\u0646\u0644\u0648\u062F \u0631\u0633\u0645\u06CC", type: "string" }
        ]
      },
      {
        name: "youtube",
        label: "\u0648\u06CC\u062F\u06CC\u0648\u0647\u0627\u06CC \u06CC\u0648\u062A\u06CC\u0648\u0628 \u2014 YouTube",
        path: "content/youtube",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { name: "kicker", label: "\u06A9\u06CC\u06A9\u0631", type: "string" },
          { name: "title", label: "\u0639\u0646\u0648\u0627\u0646 \u0628\u0644\u0648\u06A9", type: "string" },
          { name: "channelUrl", label: "\u0644\u06CC\u0646\u06A9 \u06A9\u0627\u0646\u0627\u0644", type: "string" },
          { name: "channelAriaLabel", label: "\u0628\u0631\u0686\u0633\u0628 \u062F\u0633\u062A\u0631\u0633\u06CC \u06A9\u0627\u0646\u0627\u0644", type: "string" },
          { name: "channelImage", label: "\u062A\u0635\u0648\u06CC\u0631 \u06A9\u0627\u0646\u0627\u0644", type: "image" },
          { name: "channelImageAlt", label: "\u0645\u062A\u0646 \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u062A\u0635\u0648\u06CC\u0631", type: "string" },
          { name: "channelCta", label: "\u0645\u062A\u0646 \u062F\u06A9\u0645\u0647 \u06A9\u0627\u0646\u0627\u0644", type: "string" },
          {
            name: "videos",
            label: "\u0648\u06CC\u062F\u06CC\u0648\u0647\u0627",
            type: "object",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title || item?.url || "\u0648\u06CC\u062F\u06CC\u0648" }) },
            fields: [
              { name: "url", label: "\u0644\u06CC\u0646\u06A9 \u06CC\u0648\u062A\u06CC\u0648\u0628", type: "string" },
              { name: "autoTitle", label: "\u062F\u0631\u06CC\u0627\u0641\u062A \u062E\u0648\u062F\u06A9\u0627\u0631 \u0639\u0646\u0648\u0627\u0646 \u0627\u0632 \u06CC\u0648\u062A\u06CC\u0648\u0628", type: "boolean", description: "\u0627\u06AF\u0631 \u0631\u0648\u0634\u0646 \u0628\u0627\u0634\u062F \u0639\u0646\u0648\u0627\u0646 \u0627\u0632 YouTube oEmbed \u06AF\u0631\u0641\u062A\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F" },
              { name: "thumb", label: "\u062A\u0635\u0648\u06CC\u0631 \u0628\u0646\u062F\u0627\u0646\u06AF\u0634\u062A\u06CC", type: "string", description: "\u0645\u0639\u0645\u0648\u0644\u0627\u064B https://i.ytimg.com/vi/<ID>/hqdefault.jpg" },
              { name: "thumbAlt", label: "\u0645\u062A\u0646 \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u062A\u0635\u0648\u06CC\u0631", type: "string" },
              { name: "channelLabel", label: "\u0628\u0631\u0686\u0633\u0628 \u06A9\u0627\u0646\u0627\u0644", type: "string" },
              { name: "title", label: "\u0639\u0646\u0648\u0627\u0646 \u0648\u06CC\u062F\u06CC\u0648", type: "string" },
              { name: "ctaLabel", label: "\u0645\u062A\u0646 \u062F\u06A9\u0645\u0647", type: "string" }
            ]
          }
        ]
      },
      {
        name: "tiktok",
        label: "\u062D\u0633\u0627\u0628\u200C\u0647\u0627\u06CC \u062A\u06CC\u06A9\u200C\u062A\u0627\u06A9 \u2014 TikTok Profiles",
        path: "content/tiktok",
        format: "json",
        description: "\u0641\u0642\u0637 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u062B\u0627\u0628\u062A \u067E\u0631\u0648\u0641\u0627\u06CC\u0644. \u0648\u0636\u0639\u06CC\u062A LIVE/OFFLINE \u0647\u0645\u06CC\u0634\u0647 \u0627\u0632 \u0628\u06A9\u200C\u0627\u0646\u062F \u0645\u0648\u062C\u0648\u062F \u0645\u06CC\u200C\u0622\u06CC\u062F \u0648 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u062A\u06CC\u0646\u0627 \u0642\u0627\u0628\u0644 \u062A\u063A\u06CC\u06CC\u0631 \u0646\u06CC\u0633\u062A.",
        fields: [
          { name: "username", label: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062A\u06CC\u06A9\u200C\u062A\u0627\u06A9", type: "string", description: "\u0628\u0627\u06CC\u062F \u0628\u0627 \u0646\u0627\u0645 \u0641\u0627\u06CC\u0644 \u0622\u0648\u0627\u062A\u0627\u0631 \u062F\u0631 assets/images/tiktok/ \u06CC\u06A9\u06CC \u0628\u0627\u0634\u062F" },
          { name: "displayName", label: "\u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC", type: "string" },
          { name: "profileUrl", label: "\u0622\u062F\u0631\u0633 \u067E\u0631\u0648\u0641\u0627\u06CC\u0644", type: "string" },
          { name: "avatar", label: "\u0622\u0648\u0627\u062A\u0627\u0631 (assets/images/tiktok/<username>.webp)", type: "image" },
          { name: "ariaLabel", label: "\u0628\u0631\u0686\u0633\u0628 \u062F\u0633\u062A\u0631\u0633\u06CC", type: "string" },
          { name: "official", label: "\u06A9\u0627\u0646\u0627\u0644 \u0631\u0633\u0645\u06CC \u0641\u0627\u0631\u0633\u06CC (\u0647\u0645\u06CC\u0634\u0647 \u0627\u0648\u0644)", type: "boolean" },
          { name: "language", label: "\u0632\u0628\u0627\u0646 (fa/en)", type: "string", options: ["fa", "en"] },
          { name: "order", label: "\u062A\u0631\u062A\u06CC\u0628 \u0646\u0645\u0627\u06CC\u0634", type: "number" },
          { name: "featured", label: "\u0648\u06CC\u0698\u0647 (\u06A9\u0627\u0631\u062A \u0628\u0632\u0631\u06AF)", type: "boolean" }
        ]
      },
      {
        name: "study",
        label: "\u0645\u0637\u0627\u0644\u0639\u0647 \u2014 Study",
        path: "content/study",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { name: "pageTitle", label: "\u0639\u0646\u0648\u0627\u0646 \u0635\u0641\u062D\u0647", type: "string" },
          {
            name: "sections",
            label: "\u0628\u062E\u0634\u200C\u0647\u0627",
            type: "object",
            list: true,
            ui: { itemProps: (item) => ({ label: (item?.num || "") + " " + (item?.title || "") }) },
            fields: [
              { name: "num", label: "\u0634\u0645\u0627\u0631\u0647", type: "string" },
              { name: "title", label: "\u0639\u0646\u0648\u0627\u0646 \u0628\u062E\u0634", type: "string" },
              {
                name: "blocks",
                label: "\u0645\u062D\u062A\u0648\u0627",
                type: "object",
                list: true,
                templates: [
                  {
                    name: "paragraph",
                    label: "\u067E\u0627\u0631\u0627\u06AF\u0631\u0627\u0641",
                    fields: [{ name: "text", label: "\u0645\u062A\u0646", type: "string", ui: { component: "textarea" } }]
                  },
                  {
                    name: "finalNote",
                    label: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u067E\u0627\u06CC\u0627\u0646\u06CC",
                    fields: [{ name: "text", label: "\u0645\u062A\u0646", type: "string" }]
                  },
                  {
                    name: "subheading",
                    label: "\u0632\u06CC\u0631\u0639\u0646\u0648\u0627\u0646",
                    fields: [{ name: "text", label: "\u0645\u062A\u0646", type: "string" }]
                  },
                  {
                    name: "quote",
                    label: "\u0646\u0642\u0644\u200C\u0642\u0648\u0644",
                    fields: [
                      { name: "text", label: "\u0645\u062A\u0646 \u0646\u0642\u0644\u200C\u0642\u0648\u0644", type: "string", ui: { component: "textarea" } },
                      { name: "source", label: "\u0645\u0646\u0628\u0639", type: "string" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
