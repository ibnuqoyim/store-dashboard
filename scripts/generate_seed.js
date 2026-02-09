
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const files = [
    '../order_282901.csv',
    '../order.csv',
    '../order_030401.csv'
];

const customers = new Map();

files.forEach(file => {
    try {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const results = Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
        });

        results.data.forEach(row => {
            const name = row['nama_pelanggan']?.trim();
            const phone = row['telepon']?.trim(); // Keep raw for now, or normalize

            if (name) {
                if (!customers.has(name)) {
                    customers.set(name, { name, phone });
                } else {
                    // Update phone if existing has none and new one does
                    const existing = customers.get(name);
                    if (!existing.phone && phone) {
                        existing.phone = phone;
                    }
                }
            }
        });
    } catch (err) {
        console.error(`Error processing file ${file}:`, err);
    }
});

let sql = `-- Seed Customers
-- Generated from CSV files

INSERT INTO customers (name, phone) VALUES
`;

const values = [];
customers.forEach(c => {
    const safeName = c.name.replace(/'/g, "''");
    const safePhone = c.phone ? `'${c.phone.replace(/'/g, "''")}'` : 'NULL';
    values.push(`('${safeName}', ${safePhone})`);
});

sql += values.join(',\n');
sql += `
ON CONFLICT (name) DO UPDATE 
SET phone = EXCLUDED.phone 
WHERE customers.phone IS NULL;

-- Update total_purchases from existing orders
UPDATE customers c
SET total_purchases = (
  SELECT COALESCE(SUM(oi.price * oi.quantity), 0)
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.customer_name = c.name
);
`;

fs.writeFileSync(path.join(__dirname, '..', '..', 'seed_customers.sql'), sql);
console.log(`Generated seed_customers.sql with ${customers.size} customers.`);
