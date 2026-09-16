import { db, pool, resourcesTable, settingsTable, taxonomiesTable } from "@workspace/db";

const examples = [
  ["product-page-copy","Product page conversion brief","Prompt","Conversion","ChatGPT","conversion,product copy","Create benefit-first product page copy with objections and proof points."],
  ["email-welcome-map","Welcome email lifecycle map","Skill","Lifecycle","Klaviyo","email,lifecycle","Map a five-email welcome flow that earns the second purchase."],
  ["paid-social-angle-sheet","Paid social angle sheet","Cheat Sheet","Acquisition","Meta Ads","ads,creative","Select and test distinct customer-aware acquisition angles."],
  ["inventory-reorder-model","Inventory reorder model","Skill","Operations","Google Sheets","inventory,planning","Calculate a reorder point from lead time, demand, and safety stock."],
  ["retention-cohort-prompt","Retention cohort diagnosis","Prompt","Retention","ChatGPT","cohort,retention","Turn weekly cohort data into a prioritized retention hypothesis."],
  ["merchant-seo-brief","Collection SEO brief","Cheat Sheet","SEO","Shopify","seo,collection","Write a clear collection-page brief without keyword stuffing."],
  ["support-macro-library","Support macro library","Skill","Customer Support","Gorgias","support,macros","Build empathetic macros that solve common delivery issues."],
  ["margin-audit","Contribution margin audit","Cheat Sheet","Finance","Google Sheets","margin,finance","Check margin after fees, discounts, shipping, and returns."],
  ["ugc-creator-outreach","UGC creator outreach","Prompt","Acquisition","ChatGPT","ugc,creator","Draft a concise creator outreach message with a useful hook."],
  ["bundle-merchandising","Bundle merchandising plan","Skill","Conversion","Shopify","bundles,aov","Plan a complementary bundle that improves average order value."],
  ["analytics-question-tree","Analytics question tree","Cheat Sheet","Retention","GA4","analytics,diagnosis","Start with a business symptom and trace it to measurable causes."],
  ["post-purchase-survey","Post-purchase survey","Prompt","Conversion","Typeform","survey,voice of customer","Create a short survey that reveals why customers chose the product."],
] as const;
const categories = [...new Set(examples.map((x) => x[3]))];
const tools = [...new Set(examples.map((x) => x[4]))];
try {
await db.insert(settingsTable).values({ key: "site", value: {
  brandName: "EcomStack", tagline: "AI skills, prompts and playbooks for ecommerce.", logoUrl: "", supportEmail: "",
  offerTitle: "Start your Shopify paid trial", offerDescription: "Review Shopify's current offer and eligibility before signing up.", eligibility: "Start an eligible Shopify paid trial through our tracked affiliate link. Existing stores and signups outside this link do not automatically qualify.", affiliateDisclosure: "We may earn a commission if you sign up through our Shopify affiliate link.", affiliateReady: false,
  verificationEnabled: false, development: process.env.NODE_ENV !== "production", affiliateUrl: "",
  campaignId: "13624", eventTrackerId: "34051", outboundParameter: "subId1", returnedField: "SubId1",
  acceptedStates: ["PENDING"], syncIntervalMinutes: 5, trackingConfirmed: false, incentiveApproved: false,
} }).onConflictDoNothing();
for (const name of categories) await db.insert(taxonomiesTable).values({ name, kind: "category" }).onConflictDoNothing();
for (const name of tools) await db.insert(taxonomiesTable).values({ name, kind: "tool" }).onConflictDoNothing();
for (const [slug, title, type, category, tool, tags, preview] of examples) {
  await db.insert(resourcesTable).values({ slug, title, description: preview, type, category, tool, tags: tags.split(","), preview,
    useCase: `Use this ${type.toLowerCase()} during weekly ${category.toLowerCase()} planning.`, instructions: "Read the context, adapt it to your store, and validate the recommendation against current customer evidence.", tutorialUrl: "", version: "1.0", isFree: ["product-page-copy", "email-welcome-map", "paid-social-angle-sheet"].includes(slug), featured: false, isDemo: true, status: "draft", content: `# ${title}\n\n${preview}\n\nWork from real store data and record the decision you make.` }).onConflictDoNothing();
}
} finally {
  await pool.end();
}