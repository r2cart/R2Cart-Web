/**
 * Comprehensive Product Specifications Generator & Parser
 * Supports all FMCG, Grocery, Dairy, Staples, Personal Care, Household, Baby Care, and Utilities.
 */

// Brand dictionary for accurate extraction
const BRAND_PATTERNS = [
  // Sweet & Chocolates
  { match: /nestl[eé]/i, brand: 'Nestle' },
  { match: /cadbury|dairy milk|bournville|silk|5 star|perk|fuse/i, brand: 'Cadbury' },
  { match: /kitkat|kit kat/i, brand: 'Nestlé KitKat' },
  { match: /snickers/i, brand: 'Snickers' },
  { match: /hershey/i, brand: "Hershey's" },
  { match: /ferrero/i, brand: 'Ferrero Rocher' },
  { match: /amul/i, brand: 'Amul' },
  { match: /mother dairy/i, brand: 'Mother Dairy' },
  { match: /kwality wall/i, brand: "Kwality Wall's" },
  { match: /vadilal/i, brand: 'Vadilal' },
  { match: /havmor/i, brand: 'Havmor' },
  { match: /haldiram/i, brand: "Haldiram's" },
  { match: /bikaji/i, brand: 'Bikaji' },

  // Staples & Cooking
  { match: /aashirvaad/i, brand: 'Aashirvaad' },
  { match: /india gate/i, brand: 'India Gate' },
  { match: /daawat/i, brand: 'Daawat' },
  { match: /fortune/i, brand: 'Fortune' },
  { match: /saffola/i, brand: 'Saffola' },
  { match: /dhara/i, brand: 'Dhara' },
  { match: /tata sampann|tata salt/i, brand: 'Tata Sampann' },
  { match: /tata tea|tata gold|tata agni/i, brand: 'Tata Tea' },
  { match: /taj mahal/i, brand: 'Brooke Bond Taj Mahal' },
  { match: /red label/i, brand: 'Brooke Bond Red Label' },
  { match: /wagh bakri/i, brand: 'Wagh Bakri' },
  { match: /lipton/i, brand: 'Lipton' },
  { match: /nescafe|nescafé/i, brand: 'Nescafé' },
  { match: /bru /i, brand: 'Bru' },

  // Biscuits & Snacks
  { match: /parle-g|parle/i, brand: 'Parle' },
  { match: /britannia|good day|marie gold|bourbon/i, brand: 'Britannia' },
  { match: /oreo/i, brand: 'Cadbury Oreo' },
  { match: /dark fantasy|sunfeast/i, brand: 'Sunfeast' },
  { match: /unibic/i, brand: 'Unibic' },
  { match: /lay'?s/i, brand: "Lay's" },
  { match: /kurkure/i, brand: 'Kurkure' },
  { match: /bingo/i, brand: 'Bingo' },
  { match: /pringles/i, brand: 'Pringles' },
  { match: /doritos/i, brand: 'Doritos' },

  // Packaged Foods & Sauces
  { match: /maggi/i, brand: 'Maggi' },
  { match: /kissan/i, brand: 'Kissan' },
  { match: /kellogg/i, brand: "Kellogg's" },
  { match: /chocos/i, brand: "Kellogg's Chocos" },
  { match: /quaker/i, brand: 'Quaker' },
  { match: /heinz/i, brand: 'Heinz' },
  { match: /ching'?s/i, brand: "Ching's Secret" },
  { match: /knorr/i, brand: 'Knorr' },

  // Beverages
  { match: /coca-cola|coke/i, brand: 'Coca-Cola' },
  { match: /pepsi/i, brand: 'Pepsi' },
  { match: /thums up/i, brand: 'Thums Up' },
  { match: /sprite/i, brand: 'Sprite' },
  { match: /fanta/i, brand: 'Fanta' },
  { match: /mirinda/i, brand: 'Mirinda' },
  { match: /7up|seven up/i, brand: '7UP' },
  { match: /real fruit|real juice/i, brand: 'Real' },
  { match: /tropicana/i, brand: 'Tropicana' },
  { match: /red bull/i, brand: 'Red Bull' },
  { match: /sting/i, brand: 'Sting' },
  { match: /maaza/i, brand: 'Maaza' },
  { match: /frooti/i, brand: 'Frooti' },

  // Household & Cleaning
  { match: /surf excel/i, brand: 'Surf Excel' },
  { match: /ariel/i, brand: 'Ariel' },
  { match: /tide/i, brand: 'Tide' },
  { match: /rin /i, brand: 'Rin' },
  { match: /vim /i, brand: 'Vim' },
  { match: /pril /i, brand: 'Pril' },
  { match: /lizol/i, brand: 'Lizol' },
  { match: /harpic/i, brand: 'Harpic' },
  { match: /colin/i, brand: 'Colin' },
  { match: /dettol/i, brand: 'Dettol' },
  { match: /scotch-brite|scotch brite/i, brand: 'Scotch-Brite' },
  { match: /scotch/i, brand: 'Scotch' },
  { match: /odonil/i, brand: 'Odonil' },
  { match: /hit /i, brand: 'Hit' },
  { match: /all out|good knight/i, brand: 'Goodknight' },
  { match: /freshwrapp/i, brand: 'Freshwrapp' },
  { match: /origami/i, brand: 'Origami' },

  // Personal Care
  { match: /dove/i, brand: 'Dove' },
  { match: /lux /i, brand: 'Lux' },
  { match: /pears/i, brand: 'Pears' },
  { match: /lifebuoy/i, brand: 'Lifebuoy' },
  { match: /colgate/i, brand: 'Colgate' },
  { match: /close up|closeup/i, brand: 'CloseUp' },
  { match: /sensodyne/i, brand: 'Sensodyne' },
  { match: /head & shoulders|head and shoulders/i, brand: 'Head & Shoulders' },
  { match: /pantene/i, brand: 'Pantene' },
  { match: /sunsilk/i, brand: 'Sunsilk' },
  { match: /nivea/i, brand: 'Nivea' },
  { match: /vaseline/i, brand: 'Vaseline' },
  { match: /gillette/i, brand: 'Gillette' },
  { match: /himalaya/i, brand: 'Himalaya' },

  // Baby Care
  { match: /pampers/i, brand: 'Pampers' },
  { match: /huggies/i, brand: 'Huggies' },
  { match: /mamypoko|mamy poko/i, brand: 'MamyPoko' },
  { match: /johnson'?s baby/i, brand: "Johnson's Baby" },
  { match: /sebamed/i, brand: 'Sebamed' },
  { match: /cerelac/i, brand: 'Nestlé Cerelac' },

  // Paan & Mints
  { match: /rajnigandha/i, brand: 'Rajnigandha' },
  { match: /tic tac/i, brand: 'Tic Tac' },
  { match: /orbit/i, brand: 'Orbit' },
  { match: /pass pass/i, brand: 'Pass Pass' },
  { match: /center fresh|center fruit/i, brand: 'Center Fresh' },

  // Pharma & Utilities
  { match: /vicks/i, brand: 'Vicks' },
  { match: /volini/i, brand: 'Volini' },
  { match: /iodex/i, brand: 'Iodex' },
  { match: /hansaplast/i, brand: 'Hansaplast' },
  { match: /revital/i, brand: 'Revital H' },
  { match: /fevistik|fevicol/i, brand: 'Pidilite Fevistik' },
  { match: /philips/i, brand: 'Philips' },
  { match: /classmate/i, brand: 'Classmate' },
  { match: /tanishq/i, brand: 'Tanishq' }
];

export function extractBrand(name) {
  if (!name) return 'R2Cart Quality';
  for (const item of BRAND_PATTERNS) {
    if (item.match.test(name)) return item.brand;
  }
  const words = name.trim().split(/\s+/);
  return words[0] || 'R2Cart Quality';
}

/**
 * Generates tailored, realistic specifications for ANY product based on Name, Category, and Unit.
 */
export function generateDetailedSpecifications(productName = '', category = '', unit = '', image = '') {
  const name = String(productName || '').trim();
  const lower = name.toLowerCase();
  const cat = String(category || '').toLowerCase();
  const brand = extractBrand(name);

  // Defaults
  let productType = 'Daily Grocery Essential';
  let dietaryPreference = 'Veg';
  let flavour = '';
  let itemForm = 'Pack';
  let packagingType = 'Packet';
  let shelfLife = '6–12 Months';
  let countryOfOrigin = 'India';
  let ingredients = '';
  let allergens = '';
  let storage = 'Store in a cool, dry and hygienic place away from direct sunlight.';
  let nutrition = {
    serving: 'Per 100g',
    energy: '380 kcal',
    protein: '7.5 g',
    carbs: '65.0 g',
    sugars: '12.0 g',
    addedSugars: '8.0 g',
    fat: '9.0 g'
  };
  let keyFeatures = [];

  // Check Non-Food Categories
  const isHousehold = cat.includes('household') || lower.includes('detergent') || lower.includes('cleaner') || lower.includes('surf') || lower.includes('harpic') || lower.includes('lizol') || lower.includes('vim');
  const isPersonal = cat.includes('personal') || lower.includes('shampoo') || lower.includes('soap') || lower.includes('cream') || lower.includes('toothpaste') || lower.includes('facewash');
  const isBaby = cat.includes('baby') || lower.includes('diaper') || lower.includes('wipes');
  const isStationery = cat.includes('stationery') || lower.includes('glue') || lower.includes('tape') || lower.includes('pen') || lower.includes('notebook') || lower.includes('bulb');
  const isJewellery = cat.includes('jewellery') || lower.includes('earring') || lower.includes('necklace') || lower.includes('anklet') || lower.includes('bracelet');
  const isPharma = cat.includes('pharma') || lower.includes('balm') || lower.includes('spray') || lower.includes('capsule') || lower.includes('bandage') || lower.includes('antiseptic');

  const isNonFood = isHousehold || isPersonal || isBaby || isStationery || isJewellery || isPharma;

  if (isNonFood) {
    dietaryPreference = ''; // Not applicable for non-food
    nutrition = { serving: 'N/A', energy: '', protein: '', carbs: '', sugars: '', addedSugars: '', fat: '' };
  }

  // Specific Domain Rules
  if (lower.includes('chocolate') || lower.includes('chocos') || lower.includes('kitkat') || lower.includes('snickers') || lower.includes('silk') || lower.includes('candy') || lower.includes('munch')) {
    productType = 'Confectionery / Chocolate';
    flavour = lower.includes('peanut') ? 'Roasted Peanut' : lower.includes('fruit') ? 'Fruit & Nut' : 'Rich Creamy Chocolate';
    itemForm = lower.includes('bar') ? 'Bar' : 'Chocolate Pack';
    packagingType = 'Sealed Pouch / Wrapper';
    shelfLife = '9 Months';
    ingredients = 'Sugar, Milk solids (16%), Cocoa butter, Cocoa solids (10%), Hydrogenated vegetable fats, Emulsifiers (Soy lecithin), Natural & Artificial flavours.';
    allergens = 'Contains: Milk, Soy. May contain traces of Wheat and Tree Nuts.';
    storage = 'Store in a cool, hygienic and dry place (18°C–22°C). Keep away from direct heat.';
    nutrition = {
      serving: 'Per 100g',
      energy: '520 kcal',
      protein: '8.2 g',
      carbs: '58.0 g',
      sugars: '48.5 g',
      addedSugars: '38.0 g',
      fat: '28.5 g'
    };
    keyFeatures = [
      `Delicious rich and creamy taste made with signature ${brand} ingredients`,
      'Smooth, melt-in-the-mouth texture perfect for sharing and gifting',
      'Hygienically manufactured and temperature-controlled dispatch from R2Cart store'
    ];
  } else if (lower.includes('atta') || lower.includes('wheat flour') || lower.includes('maida') || lower.includes('besan') || lower.includes('sooji') || lower.includes('rava')) {
    productType = lower.includes('besan') ? 'Gram Flour (Besan)' : lower.includes('maida') ? 'Refined Wheat Flour' : '100% Whole Wheat Chakki Atta';
    flavour = 'Natural Wheat Flavour';
    itemForm = 'Ground Flour';
    packagingType = 'Heavy Duty Moisture Barrier Pouch';
    shelfLife = '6 Months';
    ingredients = lower.includes('besan') ? '100% Pure Bengal Gram (Chana Dal).' : '100% Whole Wheat Grains ground by traditional stone chakki.';
    allergens = lower.includes('besan') ? 'None.' : 'Contains: Wheat (Gluten).';
    storage = 'Store in a cool, dry place. Transfer to a sealed airtight container once opened to avoid moisture.';
    nutrition = {
      serving: 'Per 100g',
      energy: '365 kcal',
      protein: '11.8 g',
      carbs: '71.5 g',
      sugars: '2.5 g',
      addedSugars: '0 g',
      fat: '1.7 g'
    };
    keyFeatures = [
      'Stone-ground from premium selected high-yield golden wheat grains',
      'High natural dietary fibre keeps rotis softer for longer hours',
      'No added preservatives, maida or bleaching chemicals'
    ];
  } else if (lower.includes('rice') || lower.includes('basmati') || lower.includes('poha')) {
    productType = lower.includes('basmati') ? 'Aged Premium Basmati Rice' : lower.includes('poha') ? 'Flattened Rice (Poha)' : 'Daily Cooking Rice';
    itemForm = 'Aged Whole Grains';
    packagingType = 'Bag / Pouch';
    shelfLife = '24 Months';
    ingredients = '100% Pure Aged Long Grain Basmati Rice.';
    allergens = 'Free from common allergens.';
    storage = 'Store in an airtight container in a dry, well-ventilated area away from insects and moisture.';
    nutrition = {
      serving: 'Per 100g',
      energy: '350 kcal',
      protein: '7.8 g',
      carbs: '78.0 g',
      sugars: '0 g',
      addedSugars: '0 g',
      fat: '0.6 g'
    };
    keyFeatures = [
      'Naturally aged long grains that elongate up to twice their size upon cooking',
      'Signature rich aroma and non-sticky, fluffy texture ideal for Biryani & Pulao',
      'Carefully sortex-cleaned and untouched by hands'
    ];
  } else if (lower.includes('dal') || lower.includes('toor') || lower.includes('moong') || lower.includes('chana') || lower.includes('urad') || lower.includes('rajma') || lower.includes('chole')) {
    productType = 'Unpolished Natural Pulses (Dal)';
    itemForm = 'Dried Split Pulses / Whole Beans';
    packagingType = 'Sealed Poly Pouch';
    shelfLife = '12 Months';
    ingredients = '100% Selected Natural Unpolished Pulses.';
    allergens = 'Free from artificial colors and preservatives.';
    storage = 'Store in a clean, airtight container away from humidity.';
    nutrition = {
      serving: 'Per 100g',
      energy: '343 kcal',
      protein: '22.3 g',
      carbs: '59.0 g',
      sugars: '1.5 g',
      addedSugars: '0 g',
      fat: '1.5 g'
    };
    keyFeatures = [
      'Unpolished grains that undergo no artificial water, oil or leather polish',
      'Rich natural source of plant protein and dietary fibre for wholesome meals',
      '5-step lab tested to ensure quick, uniform cooking and authentic homemade taste'
    ];
  } else if (lower.includes('oil') || lower.includes('ghee') || lower.includes('mustard oil') || lower.includes('sunflower')) {
    productType = lower.includes('ghee') ? 'Pure Desi Cow / Milk Ghee' : 'Refined Cooking & Frying Oil';
    flavour = lower.includes('mustard') ? 'Pungent Kachi Ghani' : 'Neutral High Smoke Point';
    itemForm = 'Liquid / Semi-Solid';
    packagingType = lower.includes('tin') ? 'Tin' : lower.includes('bottle') ? 'PET Bottle' : 'Pouch';
    shelfLife = '9–12 Months';
    ingredients = lower.includes('ghee')
      ? '100% Clarified Pure Milk Fat (Desi Ghee).'
      : 'Refined Edible Vegetable Oil, Fortified with Vitamin A & Vitamin D.';
    allergens = lower.includes('ghee') ? 'Contains: Milk.' : 'None.';
    storage = 'Keep in a cool and dry environment away from heat sources and direct flame.';
    nutrition = {
      serving: 'Per 100g',
      energy: '900 kcal',
      protein: '0 g',
      carbs: '0 g',
      sugars: '0 g',
      addedSugars: '0 g',
      fat: '100 g'
    };
    keyFeatures = [
      lower.includes('ghee') ? 'Traditional granular (danedar) texture with rich divine aroma' : 'Low absorb technology that keeps food light and non-greasy',
      'Enriched with essential Vitamins A and D to support family immunity',
      'High smoke point ideal for daily deep frying, tadka and sautéing'
    ];
  } else if (lower.includes('milk') && !isNonFood) {
    productType = 'Pasteurized Toned Dairy Milk';
    flavour = 'Fresh Natural Milk';
    itemForm = 'Liquid';
    packagingType = lower.includes('tetra') ? 'Aseptic Tetra Pak' : 'Poly Pouch';
    shelfLife = lower.includes('tetra') ? '180 Days' : '48 Hours';
    ingredients = 'Standardized pasteurized milk, fortified with Vitamin A & D (Fat 3.0% min, SNF 8.5% min).';
    allergens = 'Contains: Milk.';
    storage = 'Keep refrigerated at 4°C or below. Consume within 2 days after opening.';
    nutrition = {
      serving: 'Per 100ml',
      energy: '60 kcal',
      protein: '3.2 g',
      carbs: '4.8 g',
      sugars: '4.8 g',
      addedSugars: '0 g',
      fat: '3.0 g'
    };
    keyFeatures = [
      '100% pure pasteurized milk with balanced nutrition for daily energy',
      'Rich in natural bio-available calcium and high quality milk protein',
      'Zero preservatives or adulteration, safety tested at source'
    ];
  } else if (lower.includes('tea') || lower.includes('coffee')) {
    productType = lower.includes('coffee') ? 'Instant Roasted Coffee Blend' : 'Selected Premium CTC Tea';
    flavour = lower.includes('masala') ? 'Spiced Masala' : lower.includes('green') ? 'Pure Green Tea' : 'Strong Assam Blend';
    itemForm = lower.includes('bag') ? 'Tea Bags' : lower.includes('granule') ? 'Granules' : 'CTC Leaf Tea';
    packagingType = 'Airtight Poly Pouch / Jar';
    shelfLife = '12 Months';
    ingredients = lower.includes('coffee') ? 'Coffee Beans, Chicory.' : '100% Selected Premium Upper Assam CTC Tea Leaves.';
    allergens = 'None.';
    storage = 'Store in an airtight container in a dry place away from moisture and pungent odours.';
    nutrition = {
      serving: 'Per 100g',
      energy: '110 kcal',
      protein: '18.0 g',
      carbs: '4.5 g',
      sugars: '0 g',
      addedSugars: '0 g',
      fat: '0.5 g'
    };
    keyFeatures = [
      'Exquisite blend of strong liquor and refreshing aroma for the perfect morning cup',
      'Rich in natural flavonoids and antioxidants to revitalize your senses',
      'Uniform granule cut for swift and satisfying extraction'
    ];
  } else if (lower.includes('biscuit') || lower.includes('cookie') || lower.includes('rusk') || lower.includes('wafer')) {
    productType = 'Oven Baked Biscuits & Cookies';
    flavour = lower.includes('butter') ? 'Rich Butter' : lower.includes('glucose') ? 'Gluco Milk' : 'Crunchy Wheat';
    itemForm = 'Baked Crisps';
    packagingType = 'Foil Wrapper';
    shelfLife = '6 Months';
    ingredients = 'Refined Wheat Flour, Sugar, Edible Vegetable Oil, Invert Sugar Syrup, Leavening Agents, Milk Solids, Salt.';
    allergens = 'Contains: Wheat (Gluten), Milk. May contain traces of Nuts and Soy.';
    storage = 'Store in a cool and dry place. Keep in an airtight tin once unsealed.';
    nutrition = {
      serving: 'Per 100g',
      energy: '455 kcal',
      protein: '6.8 g',
      carbs: '72.0 g',
      sugars: '24.0 g',
      addedSugars: '21.0 g',
      fat: '15.5 g'
    };
    keyFeatures = [
      'Classic golden baked crunch that pairs delightfully with your daily tea or coffee',
      'Wholesome goodness providing instant energy for on-the-go snacking',
      'Loved by generations for authentic, timeless taste'
    ];
  } else if (lower.includes('chips') || lower.includes('namkeen') || lower.includes('bhujia') || lower.includes('sev') || lower.includes('snack') || lower.includes('kurkure')) {
    productType = 'Ready to Eat Crispy Snack & Namkeen';
    flavour = lower.includes('salted') ? 'Classic Salted' : lower.includes('cream') ? 'Cream & Onion' : 'Spicy Tangy Masala';
    itemForm = 'Crisps / Crunchy Noodles';
    packagingType = 'Nitrogen Flushed Foil Pouch';
    shelfLife = '5 Months';
    ingredients = 'Potatoes / Moth & Gram Flour, Edible Vegetable Oil, Spices and Condiments, Iodised Salt, Acidity Regulators.';
    allergens = 'May contain traces of Wheat, Soy, Peanuts and Tree Nuts.';
    storage = 'Keep in a cool, dry area away from heat and direct sunlight.';
    nutrition = {
      serving: 'Per 100g',
      energy: '540 kcal',
      protein: '7.0 g',
      carbs: '52.0 g',
      sugars: '3.0 g',
      addedSugars: '1.0 g',
      fat: '34.0 g'
    };
    keyFeatures = [
      'Crispy, golden bite seasoned with authentic Indian herbs and aromatic spices',
      'Nitrogen-flushed pack locks in maximum freshness and irresistible crunch',
      'Ideal companion for tea time, gatherings and quick party cravings'
    ];
  } else if (lower.includes('noodle') || lower.includes('pasta') || lower.includes('ketchup') || lower.includes('sauce') || lower.includes('jam')) {
    productType = lower.includes('noodle') ? 'Instant Masala Noodles' : lower.includes('jam') ? 'Mixed Fruit Jam' : 'Rich Tomato Ketchup';
    flavour = lower.includes('ketchup') ? 'Sweet & Tangy Tomato' : 'Signature Masala';
    itemForm = lower.includes('noodle') ? 'Noodle Cake with Tastemaker' : 'Sauce / Spread';
    packagingType = lower.includes('noodle') ? 'Pouch Pack' : 'Bottle / Easy Squeezer';
    shelfLife = '9 Months';
    ingredients = lower.includes('noodle')
      ? 'Wheat Flour, Palm Oil, Iodised Salt, Mixed Spices (Coriander, Cumin, Turmeric, Fenugreek, Chili, Cardamom), Sugar, Hydrolysed Groundnut Protein.'
      : 'Tomato Paste (28%), Water, Sugar, Salt, Acidity Regulator, Preservatives.';
    allergens = lower.includes('noodle') ? 'Contains: Wheat, Nut. May contain Milk, Mustard and Soy.' : 'Free from common allergens.';
    storage = 'Store in a clean, cool, dry space. Refrigerate sauces and jams after opening.';
    nutrition = {
      serving: 'Per 100g',
      energy: '425 kcal',
      protein: '8.5 g',
      carbs: '63.0 g',
      sugars: '3.5 g',
      addedSugars: '1.0 g',
      fat: '15.5 g'
    };
    keyFeatures = [
      'Made with finest selected ingredients for mouthwatering authentic taste',
      'Quick and effortless preparation in just minutes',
      'No artificial colors added'
    ];
  } else if (lower.includes('detergent') || lower.includes('surf') || lower.includes('ariel') || lower.includes('tide') || lower.includes('rin')) {
    productType = 'High Performance Fabric Laundry Detergent';
    flavour = 'Fresh Clean Citrus Fragrance';
    itemForm = lower.includes('liquid') ? 'Liquid Gel' : 'Washing Powder';
    packagingType = 'Heavy Duty Pouch / Plastic Box';
    shelfLife = '24 Months';
    ingredients = 'Linear Alkyl Benzene Sulphonate, Sodium Carbonate, Bleach Catalyst, Optical Brighteners, Perfume, Active Enzymes.';
    allergens = 'For laundry use only. Keep away from eyes and reach of children.';
    storage = 'Store in a dry location away from water and direct moisture.';
    keyFeatures = [
      'Advanced stain-dissolving technology removes tough collar and curry stains in 1 wash',
      'Maintains fabric softness and keeps white and colored clothes looking vibrant as new',
      'Suitable for both top load, front load and bucket hand wash'
    ];
  } else if (lower.includes('cleaner') || lower.includes('harpic') || lower.includes('lizol') || lower.includes('colin') || lower.includes('vim') || lower.includes('pril')) {
    productType = lower.includes('toilet') ? 'Disinfectant Toilet Bowl Cleaner' : lower.includes('floor') ? 'Surface & Floor Disinfectant' : 'Grease-Cutting Dishwash Gel';
    flavour = lower.includes('lemon') ? 'Fresh Lemon' : 'Citrus Pine Fresh';
    itemForm = 'Liquid Gel';
    packagingType = 'Ergonomic Plastic Bottle with Precision Nozzle';
    shelfLife = '24 Months';
    ingredients = 'Active Disinfectant Formulation, Surface Active Agents, Thickening Polymers, Fragrance.';
    allergens = 'Warning: Causes eye irritation. Keep out of reach of children.';
    storage = 'Store tightly closed in a cool, ventilated space.';
    keyFeatures = [
      'Kills 99.9% of disease-causing germs, bacteria and tough viruses',
      'Cuts through stubborn yellow stains, limestone, grease and grime with ease',
      'Leaves long-lasting refreshing fragrance throughout your home'
    ];
  } else if (lower.includes('soap') || lower.includes('shampoo') || lower.includes('dove') || lower.includes('body wash') || lower.includes('toothpaste') || lower.includes('colgate')) {
    productType = lower.includes('toothpaste') ? 'Anti-Cavity Fresh Toothpaste' : lower.includes('shampoo') ? 'Nourishing Hair Shampoo' : 'Gentle Moisture Bathing Bar';
    flavour = lower.includes('mint') ? 'Spicy Fresh Mint' : 'Rich Moisture';
    itemForm = lower.includes('toothpaste') ? 'Paste' : lower.includes('shampoo') ? 'Liquid' : 'Solid Bar';
    packagingType = lower.includes('tube') ? 'Tube' : 'Bottle / Box';
    shelfLife = '36 Months';
    ingredients = lower.includes('toothpaste')
      ? 'Calcium Carbonate, Water, Sorbitol, Sodium Lauryl Sulfate, Silica, Sodium Monofluorophosphate, Flavour.'
      : 'Sodium Palmate, Sodium Palm Kernelate, Water, Glycerin, Perfume, Sodium Chloride, Titanium Dioxide.';
    allergens = 'For external personal hygiene use only.';
    storage = 'Keep in a cool, dry place away from direct sunlight.';
    keyFeatures = [
      'Clinically tested formula for gentle, deep cleansing without drying skin or hair',
      'Leaves you feeling refreshed, invigorated and confident all day long',
      'pH balanced and enriched with essential moisturizers'
    ];
  } else if (lower.includes('diaper') || lower.includes('wipes') || lower.includes('cerelac')) {
    productType = lower.includes('diaper') ? 'Breathable Pant-Style Baby Diapers' : 'Gentle Baby Care Essential';
    itemForm = lower.includes('diaper') ? 'Soft Pants' : 'Pack';
    packagingType = 'Poly Pack';
    shelfLife = '36 Months';
    ingredients = 'Ultra-absorbent non-woven polymers, cottony soft top sheet, breathable outer cover, plant extract lotions.';
    allergens = 'Hypoallergenic and dermatologically tested safe for delicate infant skin.';
    storage = 'Store in a clean, hygienic and dust-free place.';
    keyFeatures = [
      'Up to 12 hours of uninterrupted overnight absorption to prevent leakage and rashes',
      'Feather-soft 360-degree stretchy waistband adapts comfortably to baby movements',
      'Built-in wetness indicator lets you know exactly when it is time for a change'
    ];
  } else if (isJewellery) {
    productType = 'Fashion & Ethnic Jewellery';
    itemForm = 'Handcrafted Ornament';
    packagingType = 'Velvet Pouch / Premium Jewellery Box';
    shelfLife = 'Lifetime with proper care';
    ingredients = 'Skin-friendly hypoallergenic brass/alloy base with high micron gold/silver plating and Swiss zircon/kundan stones.';
    allergens = 'Lead and nickel-free, 100% skin friendly.';
    storage = 'Store in an airtight zip pouch or original velvet box away from perfumes and water.';
    keyFeatures = [
      'Exquisitely handcrafted detailing combining royal heritage with modern elegance',
      'Anti-tarnish protective coating preserves sparkling brilliance for years',
      'Ideal for festive celebrations, weddings, anniversaries and special gifting'
    ];
  } else if (isPharma) {
    productType = 'Ayurvedic Fast Relief / Wellness Formulation';
    itemForm = lower.includes('spray') ? 'Spray' : lower.includes('balm') ? 'Ointment' : 'Capsules';
    packagingType = 'Tin / Bottle / Spray Can';
    shelfLife = '36 Months';
    ingredients = 'Active micro-formulation with natural camphor, eucalyptus oil, menthol, methyl salicylate, clove oil.';
    allergens = 'Do not apply to open cuts, burns or broken skin.';
    storage = 'Store below 25°C in a dry place. Protect from freezing and direct light.';
    keyFeatures = [
      'Fast-acting deep penetration formula provides quick relief from muscle and joint aches',
      'Enriched with trusted herbal extracts to soothe inflammation and stiffness',
      'Convenient, non-messy application for active everyday mobility'
    ];
  } else {
    // General high quality FMCG grocery
    keyFeatures = [
      `100% Authentic and genuine ${brand} quality guaranteed`,
      `Hygienically packaged and direct dispatch from R2Cart dark store`,
      `Optimal ${unit || 'pack size'} suited for daily household consumption`,
      'Rigorous quality control inspected prior to delivery'
    ];
    ingredients = `${name} made with select food-grade ingredients under strict quality standards.`;
    allergens = 'Free from common allergens unless stated on packaging.';
  }

  return {
    summary: `${name} by ${brand}. Fresh, reliable and authentic quality essentials delivered in 10–20 minutes to your doorstep.`,
    brand,
    productType,
    dietaryPreference,
    flavour: flavour || 'Natural',
    itemForm,
    weight: unit || '',
    itemIncluded: `1 x ${name}`,
    packagingType,
    countryOfOrigin,
    shelfLife,
    keyFeatures,
    ingredients,
    allergens: allergens || 'None',
    storage,
    nutrition,
    customSpecs: []
  };
}

export function parseProductDetails(rawDescription, product = null) {
  const empty = {
    summary: '',
    brand: '',
    productType: '',
    dietaryPreference: '',
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
    const autoSpecs = generateDetailedSpecifications(
      product.name,
      product.categorySlug || product.category || '',
      product.unit || '',
      product.image || ''
    );
    return {
      ...autoSpecs,
      summary: result.summary || autoSpecs.summary
    };
  }

  return result;
}

export function formatProductDetails(details) {
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
