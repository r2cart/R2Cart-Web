/**
 * Utility to parse and format rich product specifications, highlights, nutrition, and ingredients.
 * Compatible with JSON-encoded specs or legacy text descriptions.
 */

export function parseProductDetails(rawDescription, product = null) {
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

  const trimmed = rawDescription ? String(rawDescription).trim() : '';

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
  const result = { ...empty };
  if (trimmed) {
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const genericLines = [];

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
  }

  // 3. Fallback Auto-Inference if no brand or features (e.g. from product object)
  if (!result.brand && product && product.name) {
    const name = product.name;
    const lower = name.toLowerCase();
    const cat = (product.categorySlug || product.category || '').toLowerCase();

    const knownBrands = [
      'Nestle', 'Nestlé', 'Cadbury', 'Amul', "Haldiram's", 'Aashirvaad', 'India Gate',
      'Tata Sampann', 'Tata', 'Fortune', 'Parle-G', 'Parle', 'Coca-Cola', 'Real',
      'Surf Excel', 'Dove', 'Maggi', 'Kissan', "Kellogg's", "Kwality Wall's",
      'Mother Dairy', 'Havmor', 'Huggies', 'Pampers', "Johnson's", 'Sebamed',
      'Snickers', 'Tanishq', 'Tic Tac', 'Vadilal', 'Vicks', 'Vim', 'Volini',
      'Wagh Bakri', 'Brooke Bond', 'Lipton', 'Philips', 'Fevistik', 'Scotch-Brite',
      'Scotch', 'Orbit', 'Pass Pass', 'Rajnigandha', 'Freshwrapp', 'Hansaplast',
      'Harpic', 'Iodex', 'MamyPoko', 'Origami', 'Revital H', 'Lizol'
    ];

    for (const b of knownBrands) {
      if (lower.includes(b.toLowerCase())) {
        result.brand = b;
        break;
      }
    }
    if (!result.brand) {
      result.brand = name.split(' ')[0] || 'R2Cart Quality';
    }

    const isNonFood = cat.includes('household') ||
      cat.includes('cleaning') ||
      cat.includes('personal') ||
      cat.includes('stationery') ||
      cat.includes('jewellery') ||
      cat.includes('baby');

    result.dietaryPreference = isNonFood ? '' : 'Veg';
    result.countryOfOrigin = 'India';
    result.shelfLife = isNonFood ? '24–36 Months' : '6–12 Months';
    result.weight = product.unit || '';
    result.itemIncluded = `1 x ${name}`;
    result.packagingType = 'Pack / Packet';
    result.itemForm = 'Pack';
    result.storage = isNonFood
      ? 'Store in a cool, dry place away from direct heat and sunlight.'
      : 'Store in a cool, dry and hygienic place and avoid direct sunlight.';

    if (!result.keyFeatures || result.keyFeatures.length === 0) {
      result.keyFeatures = [
        `100% Genuine and authentic ${result.brand} quality guaranteed`,
        `Hygienically packed and fresh dispatch direct from R2Cart store`,
        `Convenient ${product.unit || 'pack'} size ideal for daily household needs`,
        `Quality inspected before every delivery to ensure maximum customer satisfaction`
      ];
    }

    if (!result.summary) {
      result.summary = `${name} by ${result.brand}. Fresh, reliable and authentic quality essentials delivered fast to your doorstep.`;
    }

    if (!result.nutrition.energy && !isNonFood) {
      result.nutrition = {
        serving: 'Per 100g',
        energy: '380 kcal',
        protein: '7.5 g',
        carbs: '65.0 g',
        sugars: '12.0 g',
        addedSugars: '8.0 g',
        fat: '9.0 g'
      };
    }
  }

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
