require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

const categories = [
  { name: 'Rice, Grains & Pasta', slug: 'grains-pasta' },
  { name: 'Beans & Legumes', slug: 'beans-legumes' },
  { name: 'Cooking Oils & Seasoning', slug: 'oils-seasoning' },
  { name: 'Canned & Packaged Foods', slug: 'canned-packaged' },
  { name: 'Beverages & Drinks', slug: 'beverages' },
  { name: 'Dairy & Milk', slug: 'dairy-milk' },
  { name: 'Baking & Flour', slug: 'baking-flour' },
  { name: 'Snacks & Biscuits', slug: 'snacks-biscuits' },
  { name: 'Household & Toiletries', slug: 'household-toiletries' },
  { name: 'Fresh Produce', slug: 'fresh-produce' },
  { name: 'Baby & Kids', slug: 'baby-kids' },
];

const products = [
  // Rice, Grains & Pasta
  ['Foreign Parboiled Rice (50kg bag)', 'grains-pasta', 'Long grain parboiled rice, 50kg bag', 68000, 'bag', 45],
  ['Ofada Rice (5kg)', 'grains-pasta', 'Local unpolished ofada rice', 8500, '5kg', 60],
  ['Golden Penny Spaghetti (500g)', 'grains-pasta', 'Durum wheat spaghetti', 950, 'pack', 150],
  ['Indomie Instant Noodles (Super Pack, 40 sachets)', 'grains-pasta', 'Chicken flavour instant noodles carton', 4200, 'carton', 100],
  ['Semovita (2kg)', 'grains-pasta', 'Wheat semolina meal', 3200, '2kg', 80],
  ['Garri (Ijebu, 5kg)', 'grains-pasta', 'White fermented cassava granules', 4500, '5kg', 70],
  ['Ofada/Local Rice (Derica)', 'grains-pasta', 'Sold per derica measure', 1200, 'derica', 200],

  // Beans & Legumes
  ['Honey Beans (5kg)', 'beans-legumes', 'Brown honey beans (oloyin)', 9500, '5kg', 55],
  ['Black-eyed Beans (5kg)', 'beans-legumes', 'White/brown beans', 8800, '5kg', 55],
  ['Bambara Nut / Okpa Beans (2kg)', 'beans-legumes', 'Local bambara groundnut', 3500, '2kg', 30],

  // Cooking Oils & Seasoning
  ['Kings Vegetable Oil (5L)', 'oils-seasoning', 'Pure vegetable cooking oil', 12500, '5L', 90],
  ['Devon King\'s Groundnut Oil (4L)', 'oils-seasoning', '100% pure groundnut oil', 13800, '4L', 60],
  ['Palm Oil (Bottle, 1.5L)', 'oils-seasoning', 'Fresh red palm oil', 3200, '1.5L', 100],
  ['Maggi Star Seasoning Cubes (50 cubes)', 'oils-seasoning', 'Classic seasoning cubes pack', 1500, 'pack', 200],
  ['Knorr Chicken Seasoning Cubes (Pack)', 'oils-seasoning', 'Chicken flavour seasoning cubes', 1450, 'pack', 200],
  ['Dangote Salt (1kg)', 'oils-seasoning', 'Refined iodized table salt', 500, '1kg', 250],
  ['Curry Powder (100g)', 'oils-seasoning', 'Ground curry seasoning', 700, '100g', 120],
  ['Thyme (100g)', 'oils-seasoning', 'Dried thyme leaves', 650, '100g', 120],
  ['Cameroon Pepper (Ground, 500g)', 'oils-seasoning', 'Ground dried pepper', 2800, '500g', 70],

  // Canned & Packaged Foods
  ['Gino Tomato Paste (Tin, 400g)', 'canned-packaged', 'Concentrated tomato paste', 950, 'tin', 180],
  ['Tomato Mix / Tin Tomatoes (400g)', 'canned-packaged', 'Chopped tomatoes in tin', 850, 'tin', 150],
  ['Titus Sardines (Tin, 125g)', 'canned-packaged', 'Sardines in vegetable oil', 1300, 'tin', 140],
  ['Geisha Mackerel (Tin, 155g)', 'canned-packaged', 'Mackerel in tomato sauce', 1600, 'tin', 130],
  ['Corned Beef (Tin, 340g)', 'canned-packaged', 'Premium corned beef', 3500, 'tin', 90],

  // Beverages & Drinks
  ['Eva Bottled Water (75cl x 12)', 'beverages', 'Pack of 12 bottled water', 2400, 'pack', 200],
  ['Coca-Cola (35cl x 12)', 'beverages', 'Carbonated soft drink pack', 3600, 'pack', 150],
  ['Chivita 100% Orange Juice (1L)', 'beverages', 'Pure orange fruit juice', 1900, '1L', 100],
  ['Malta Guinness (33cl x 12)', 'beverages', 'Non-alcoholic malt drink pack', 5200, 'pack', 90],
  ['Lipton Yellow Label Tea (100 bags)', 'beverages', 'Black tea bags', 2600, 'pack', 100],

  // Dairy & Milk
  ['Peak Milk Powder (Tin, 400g)', 'dairy-milk', 'Full cream powdered milk', 3400, 'tin', 130],
  ['Three Crowns Evaporated Milk (Tin, 170g)', 'dairy-milk', 'Evaporated tinned milk', 650, 'tin', 200],
  ['Hollandia Yoghurt (1L)', 'dairy-milk', 'Sweetened yoghurt drink', 2100, '1L', 70],
  ['Golden Morn Cereal (900g)', 'dairy-milk', 'Maize-based breakfast cereal', 3100, 'pack', 90],

  // Baking & Flour
  ['Golden Penny Flour (Self Raising, 2kg)', 'baking-flour', 'Wheat flour for baking', 2600, '2kg', 90],
  ['Yeast (Angel, 100g)', 'baking-flour', 'Instant dry yeast', 900, '100g', 80],
  ['Granulated Sugar (St. Louis, 1kg)', 'baking-flour', 'White granulated sugar', 1400, '1kg', 150],

  // Snacks & Biscuits
  ['Digestive Biscuits (McVities, 400g)', 'snacks-biscuits', 'Wholewheat digestive biscuits', 2200, 'pack', 100],
  ['Gala Sausage Roll (Pack of 10)', 'snacks-biscuits', 'Beef sausage roll snack pack', 3500, 'pack', 100],
  ['Cabin Biscuits (Carton, 24 packs)', 'snacks-biscuits', 'Classic cabin biscuits carton', 5200, 'carton', 60],
  ['Plantain Chips (200g)', 'snacks-biscuits', 'Crunchy fried plantain chips', 1200, 'pack', 110],

  // Household & Toiletries
  ['Omo Detergent Powder (900g)', 'household-toiletries', 'Washing powder', 2100, 'pack', 130],
  ['Dettol Antiseptic Soap (3-pack)', 'household-toiletries', 'Antibacterial bar soap', 1500, 'pack', 150],
  ['Colgate Toothpaste (140g)', 'household-toiletries', 'Fluoride toothpaste', 950, 'pack', 160],
  ['Harpic Toilet Cleaner (500ml)', 'household-toiletries', 'Bathroom toilet cleaner', 1350, 'bottle', 100],
  ['Morning Fresh Dishwashing Liquid (900ml)', 'household-toiletries', 'Dish washing liquid', 1600, 'bottle', 110],

  // Fresh Produce
  ['Fresh Tomatoes (Basket)', 'fresh-produce', 'Ripe fresh tomatoes, medium basket', 12000, 'basket', 25],
  ['Onions (Bag, 50kg)', 'fresh-produce', 'Fresh red onions bag', 45000, 'bag', 15],
  ['Yam Tubers (Pack of 3)', 'fresh-produce', 'Medium size yam tubers', 6000, 'pack', 40],
  ['Plantain (Bunch)', 'fresh-produce', 'Ripe/unripe plantain bunch', 3500, 'bunch', 35],
  ['Scotch Bonnet Pepper (Rodo, 1kg)', 'fresh-produce', 'Fresh hot pepper', 2500, '1kg', 50],

  // Baby & Kids
  ['Pampers Baby Dry Diapers (Size 3, Pack)', 'baby-kids', 'Diaper pack, size 3', 6500, 'pack', 80],
  ['Cerelac Infant Cereal (Wheat, 400g)', 'baby-kids', 'Baby cereal, from 6 months', 3200, 'pack', 70],
  ['SMA Gold Infant Formula (400g)', 'baby-kids', 'Infant milk formula', 8500, 'tin', 60],
];

function seed() {
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)');
  const getCategoryId = db.prepare('SELECT id FROM categories WHERE slug = ?');
  const insertProduct = db.prepare(`
    INSERT INTO products (name, category_id, description, price, unit, sku, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertInventory = db.prepare(`
    INSERT INTO inventory (product_id, quantity_in_stock, low_stock_threshold)
    VALUES (?, ?, ?)
  `);
  const existingProduct = db.prepare('SELECT id FROM products WHERE name = ?');

  const seedAll = db.transaction(() => {
    for (const cat of categories) {
      insertCategory.run(cat.name, cat.slug);
    }

    let skuCounter = 1000;
    for (const [name, catSlug, description, price, unit, stock] of products) {
      if (existingProduct.get(name)) continue; // avoid duplicates on re-seed
      const cat = getCategoryId.get(catSlug);
      const sku = `NM-${skuCounter++}`;
      // Seed data uses original per-category icons (drawn, not sourced) as a
      // placeholder. Swap these for real product photos via the admin panel's
      // image upload once you have them - see README.md.
      const imageUrl = `/images/categories/${catSlug}.svg`;
      const result = insertProduct.run(name, cat ? cat.id : null, description, price, unit, sku, imageUrl);
      insertInventory.run(result.lastInsertRowid, stock, 10);
    }
  });

  seedAll();
  console.log(`Seeded ${categories.length} categories and processed ${products.length} products.`);

  // Create default admin account if one doesn't already exist
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@naijamart.ng';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'admin')
    `).run('Admin', adminEmail, hash);
    console.log(`Admin account created: ${adminEmail} / (password from .env)`);
  } else {
    console.log('Admin account already exists, skipping.');
  }
}

seed();
