/**
 * Smart E-Commerce Grocery Product Description Generator
 * Generates engaging, category-specific product descriptions based on product name and category.
 */

const CATEGORY_TEMPLATES = {
  // Fruits & Vegetables
  'fruits-vegetables': [
    (name) =>
      `Fresh and handpicked ${name}, sourced directly to ensure peak freshness, crisp texture, and natural flavor. Rich in essential vitamins and dietary nutrients, perfect for healthy home cooking, fresh salads, and everyday meals.`,
    (name) =>
      `Farm-fresh ${name} selected for superior quality and authentic taste. Thoroughly inspected and hygienically packed to bring wholesome farm goodness straight to your kitchen table.`,
    (name) =>
      `Crisp, nutrient-rich, and naturally grown ${name}. Ideal for daily culinary preparations, delivering natural vitamins, vital minerals, and unbeatable freshness.`
  ],

  // Dairy & Breakfast
  'dairy-bread': [
    (name) =>
      `Rich, pure, and wholesome ${name}, sourced from trusted dairy farms and processed under strict hygiene standards. A delicious and nutritious choice packed with calcium and protein to power your family's day.`,
    (name) =>
      `Nutritious and fresh ${name}, essential for your daily breakfast, tea time, and culinary recipes. Temperature-controlled to guarantee optimum freshness and authentic rich taste.`,
    (name) =>
      `Enjoy the creamy goodness and superior purity of ${name}. Carefully sealed for safety and peak freshness, making everyday breakfast wholesome and delightful.`
  ],

  // Snacks & Munchies
  'snacks': [
    (name) =>
      `Crispy, savory, and irresistibly tasty! ${name} is the ultimate snack companion for your evening tea, movie nights, or spontaneous party cravings.`,
    (name) =>
      `Delicious and freshly packed ${name}, crafted with premium ingredients and an authentic spice blend for that signature crunch in every bite.`,
    (name) =>
      `Indulge your snack cravings with ${name}. Sealed airtight to lock in maximum freshness and authentic crunch for guilt-free munching anytime.`
  ],

  // Beverages & Drinks
  'beverages': [
    (name) =>
      `Refreshing and energizing ${name}, specially crafted to quench your thirst and revitalize your day. Best served chilled for the ultimate burst of natural flavor.`,
    (name) =>
      `Experience the crisp and invigorating taste of ${name}. Perfect for hot afternoons, festive gatherings, or an instant refreshment break.`,
    (name) =>
      `Quench your thirst with the delicious and revitalizing flavor of ${name}. Packed with taste and pure refreshment in every sip.`
  ],

  // Atta, Rice, Dal & Staples
  'atta-dal-rice': [
    (name) =>
      `Premium quality ${name}, carefully cleaned, sorted, and packed to preserve authentic aroma and wholesome nutritional value. A staple essential for authentic Indian home cooking.`,
    (name) =>
      `Naturally sourced and unadulterated ${name}. High in dietary fiber and essential nutrients, ensuring soft, healthy, and delicious meals for the entire family.`,
    (name) =>
      `Sourced from the finest farms, ${name} guarantees purity, consistency, and unmatched taste for your everyday traditional recipes.`
  ],

  // Masalas, Spices & Oils
  'masala-oil': [
    (name) =>
      `Aromatic, rich, and flavorful ${name}, prepared from the finest ingredients to give your curries and dishes an authentic aroma and mouth-watering taste.`,
    (name) =>
      `Pure and unadulterated ${name}, traditionally processed to retain its natural essential oils, vibrant color, and deep flavor profile.`,
    (name) =>
      `Elevate everyday cooking with the superior taste and fragrance of ${name}. Hygienically sealed to preserve its rich flavor and kitchen-fresh aroma.`
  ],

  // Bakery, Biscuits & Cookies
  'bakery-biscuits': [
    (name) =>
      `Deliciously baked and delightfully crunchy, ${name} is the perfect companion for your morning coffee or evening cup of chai.`,
    (name) =>
      `Melt-in-the-mouth goodness! ${name} delivers authentic bakery taste, rich texture, and satisfying crunch in every single bite.`,
    (name) =>
      `Treat your sweet and savory cravings with ${name}. Made with high-quality ingredients for a delightful snack break anytime, anywhere.`
  ],

  // Cleaning, Household & Personal Care
  'cleaning-household': [
    (name) =>
      `Powerful and trusted ${name}, specially formulated for superior hygiene, deep cleanliness, and everyday household care.`,
    (name) =>
      `Keep your home sparkling and germ-free with ${name}. Gentle yet highly effective, providing long-lasting freshness and protection.`
  ],

  'personal-care': [
    (name) =>
      `Gentle, nourishing, and effective ${name}, formulated for daily personal care and hygiene. Leaves you feeling refreshed and revitalized throughout the day.`,
    (name) =>
      `Experience premium everyday care with ${name}. Dermatologically tested and enriched with quality ingredients for healthy, trusted daily care.`
  ],

  // Default / Fallback
  'default': [
    (name) =>
      `Premium quality ${name}, hygienically packed to preserve authentic taste, freshness, and purity. An essential addition to your daily grocery shopping.`,
    (name) =>
      `Carefully selected and quality-inspected ${name}. Sourced with high standards to deliver the best value, authentic flavor, and satisfaction for your home.`,
    (name) =>
      `Authentic and fresh ${name}, prepared under strict quality standards to ensure reliable taste and great value for everyday family meals.`
  ]
};

/**
 * Generate description based on product name and category slug/name
 * @param {string} name - Product Name
 * @param {string} categorySlug - Category Slug
 * @param {number} variationIndex - Index for variations when re-generating
 * @returns {string} - Generated description
 */
export function generateProductDescription(name, categorySlug = '', variationIndex = 0) {
  const cleanName = (name || '').trim();
  if (!cleanName) return '';

  // Find matching template group
  const slug = (categorySlug || '').toLowerCase();
  let key = 'default';

  for (const catKey of Object.keys(CATEGORY_TEMPLATES)) {
    if (slug.includes(catKey) || catKey.includes(slug)) {
      key = catKey;
      break;
    }
  }

  const templates = CATEGORY_TEMPLATES[key] || CATEGORY_TEMPLATES.default;
  const templateFn = templates[variationIndex % templates.length];

  return templateFn(cleanName);
}
