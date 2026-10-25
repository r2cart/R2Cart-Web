/**
 * Utility to parse and format rich product specifications, highlights, nutrition, and ingredients.
 * Compatible with JSON-encoded specs or legacy text descriptions.
 */

export function parseProductDetails(rawDescription) {
  const empty = {
    summary: '',
    brand: '',
    productType: '',
    dietaryPreference: '', // 'Veg', 'Non-Veg', 'Vegan', 'Eggless'
    flavour: '',
    itemForm: '',
    weight: '',
    itemIncluded: '',
    packagingType: '',
    countryOfOrigin: 'India',
    shelfLife: '',
    keyFeatures: [],
    ingredients: '',
    allergens: '',
    storage: '',
    nutrition: {
      serving: 'Per 100g',
      energy: '',
      protein: '',
      carbs: '',
      sugars: '',
      addedSugars: '',
      fat: ''
    },
    customSpecs: []
  };

  if (!rawDescription) return empty;

  const trimmed = String(rawDescription).trim();

  // 1. Try parsing JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        ...empty,
        ...parsed,
        nutrition: {
          ...empty.nutrition,
          ...(parsed.nutrition || {})
        },
        keyFeatures: Array.isArray(parsed.keyFeatures)
          ? parsed.keyFeatures.filter(Boolean)
          : (parsed.keyFeatures ? String(parsed.keyFeatures).split('\n').filter(Boolean) : []),
        customSpecs: Array.isArray(parsed.customSpecs) ? parsed.customSpecs : []
      };
    } catch {}
  }

  // 2. Try parsing plain text with Key: Value or section headings
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  const result = { ...empty };
  const genericLines = [];

  let currentSection = '';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('brand:')) {
      result.brand = line.substring(6).trim();
    } else if (lower.startsWith('product type:')) {
      result.productType = line.substring(13).trim();
    } else if (lower.startsWith('dietary preference:') || lower.startsWith('speciality:')) {
      const val = line.split(':')[1].trim();
      result.dietaryPreference = val;
    } else if (lower.startsWith('flavour:')) {
      result.flavour = line.substring(8).trim();
    } else if (lower.startsWith('item form:')) {
      result.itemForm = line.substring(10).trim();
    } else if (lower.startsWith('weight:')) {
      result.weight = line.substring(7).trim();
    } else if (lower.startsWith('packaging type:')) {
      result.packagingType = line.substring(15).trim();
    } else if (lower.startsWith('ingredients:')) {
      result.ingredients = line.substring(12).trim();
    } else if (lower.startsWith('allergen information:') || lower.startsWith('allergen note:')) {
      result.allergens = line.split(':')[1].trim();
    } else if (lower.startsWith('storage instruction:') || lower.startsWith('storage:')) {
      result.storage = line.split(':')[1].trim();
    } else if (lower.startsWith('key features:') || lower.startsWith('highlights:')) {
      const featText = line.split(':')[1].trim();
      if (featText) {
        result.keyFeatures.push(...featText.split(',').map(s => s.trim()).filter(Boolean));
      }
    } else {
      genericLines.push(line);
    }
  }

  result.summary = genericLines.join('\n');
  return result;
}

export function formatProductDetails(details) {
  // If no specs are filled, return just summary
  const hasSpecs = details.brand ||
    details.productType ||
    details.dietaryPreference ||
    details.flavour ||
    details.itemForm ||
    details.ingredients ||
    details.allergens ||
    details.storage ||
    (details.keyFeatures && details.keyFeatures.length > 0) ||
    Object.values(details.nutrition || {}).some(v => v && v !== 'Per 100g');

  if (!hasSpecs) {
    return details.summary || '';
  }

  return JSON.stringify({
    summary: details.summary || '',
    brand: details.brand || '',
    productType: details.productType || '',
    dietaryPreference: details.dietaryPreference || '',
    flavour: details.flavour || '',
    itemForm: details.itemForm || '',
    weight: details.weight || '',
    itemIncluded: details.itemIncluded || '',
    packagingType: details.packagingType || '',
    countryOfOrigin: details.countryOfOrigin || 'India',
    shelfLife: details.shelfLife || '',
    keyFeatures: details.keyFeatures || [],
    ingredients: details.ingredients || '',
    allergens: details.allergens || '',
    storage: details.storage || '',
    nutrition: details.nutrition || {},
    customSpecs: details.customSpecs || []
  });
}
