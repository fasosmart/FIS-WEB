import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.log("NO DATABASE_URL"); process.exit(0); }

const db = drizzle(DATABASE_URL);

try {
  const [tr] = await db.execute(sql`SELECT COUNT(*) as count FROM tax_returns`);
  const [sr] = await db.execute(sql`SELECT COUNT(*) as count FROM sicpa_records`);
  const [om] = await db.execute(sql`SELECT COUNT(*) as count FROM omcs`);
  const [py] = await db.execute(sql`SELECT COUNT(*) as count FROM payments`);
  const [pe] = await db.execute(sql`SELECT COUNT(*) as count FROM penalties`);
  console.log("taxReturns:", tr[0].count, "| sicpaRecords:", sr[0].count, "| omcs:", om[0].count, "| payments:", py[0].count, "| penalties:", pe[0].count);
  
  // Check if sicpa_records has data
  if (Number(sr[0].count) > 0) {
    const flags = await db.execute(sql`SELECT discrepancyFlag, COUNT(*) as cnt FROM sicpa_records GROUP BY discrepancyFlag`);
    console.log("SICPA flags:", JSON.stringify(flags[0]));
  }
} catch(e) {
  console.error("DB Error:", e.message);
}
