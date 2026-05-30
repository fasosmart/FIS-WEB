import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

// Check tax_returns
const tr = await db.execute(sql`SELECT periodYear, periodQuarter, totalTaxDue, totalPaid FROM tax_returns LIMIT 10`);
console.log("TAX RETURNS:", JSON.stringify(tr[0]));

// Check sicpa_records
const sr = await db.execute(sql`SELECT verifiedVolumeLitres, declaredVolumeLitres, variancePercent, discrepancyFlag FROM sicpa_records LIMIT 10`);
console.log("SICPA RECORDS:", JSON.stringify(sr[0]));

// Check omcs
const om = await db.execute(sql`SELECT id, companyName, status FROM omcs LIMIT 5`);
console.log("OMCs:", JSON.stringify(om[0]));
