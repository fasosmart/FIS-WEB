import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

// Insert tax_returns for Q3 2025 (OMCs 1-7)
const q3Data = [
  [2, 2025, 3, 336000, 5.00, 1680000.00, 336000, 2.024, 680064.00, 336000, 1.00, 336000.00, 336000, 2696064.00, 2696064.00, 'assessed', 1],
  [3, 2025, 3, 290000, 5.00, 1450000.00, 290000, 2.024, 586960.00, 290000, 1.00, 290000.00, 290000, 2326960.00, 1163480.00, 'assessed', 1],
  [4, 2025, 3, 196000, 5.00, 980000.00,  196000, 2.024, 396704.00, 196000, 1.00, 196000.00, 196000, 1572704.00, 1572704.00, 'assessed', 1],
  [5, 2025, 3, 224000, 5.00, 1120000.00, 224000, 2.024, 453376.00, 224000, 1.00, 224000.00, 224000, 1797376.00, 898688.00,  'assessed', 1],
  [6, 2025, 3, 180000, 5.00, 900000.00,  180000, 2.024, 364320.00, 180000, 1.00, 180000.00, 180000, 1444320.00, 1444320.00, 'assessed', 1],
  [7, 2025, 3, 210000, 5.00, 1050000.00, 210000, 2.024, 425040.00, 210000, 1.00, 210000.00, 210000, 1685040.00, 1685040.00, 'assessed', 1],
];

// Insert tax_returns for Q4 2025 (OMCs 1-7)
const q4Data = [
  [1, 2025, 4, 470000, 5.00, 2350000.00, 470000, 2.024, 951280.00, 470000, 1.00, 470000.00, 470000, 3771280.00, 3771280.00, 'assessed', 1],
  [2, 2025, 4, 378000, 5.00, 1890000.00, 378000, 2.024, 765072.00, 378000, 1.00, 378000.00, 378000, 3033072.00, 3033072.00, 'assessed', 1],
  [3, 2025, 4, 324000, 5.00, 1620000.00, 324000, 2.024, 655776.00, 324000, 1.00, 324000.00, 324000, 2599776.00, 2599776.00, 'assessed', 1],
  [4, 2025, 4, 220000, 5.00, 1100000.00, 220000, 2.024, 445280.00, 220000, 1.00, 220000.00, 220000, 1765280.00, 882640.00,  'assessed', 1],
  [5, 2025, 4, 250000, 5.00, 1250000.00, 250000, 2.024, 506000.00, 250000, 1.00, 250000.00, 250000, 2006000.00, 2006000.00, 'assessed', 1],
  [6, 2025, 4, 200000, 5.00, 1000000.00, 200000, 2.024, 404800.00, 200000, 1.00, 200000.00, 200000, 1604800.00, 1604800.00, 'assessed', 1],
  [7, 2025, 4, 240000, 5.00, 1200000.00, 240000, 2.024, 485760.00, 240000, 1.00, 240000.00, 240000, 1925760.00, 1925760.00, 'assessed', 1],
];

// Insert tax_returns for Q2 2026 (OMCs 1-7)
const q2_2026Data = [
  [1, 2026, 2, 500000, 5.00, 2500000.00, 500000, 2.024, 1012000.00, 500000, 1.00, 500000.00, 500000, 4012000.00, 4012000.00, 'submitted', 1],
  [2, 2026, 2, 400000, 5.00, 2000000.00, 400000, 2.024, 809600.00,  400000, 1.00, 400000.00, 400000, 3209600.00, 0.00,        'draft',     1],
  [3, 2026, 2, 350000, 5.00, 1750000.00, 350000, 2.024, 708400.00,  350000, 1.00, 350000.00, 350000, 2808400.00, 1404200.00, 'submitted', 1],
  [4, 2026, 2, 240000, 5.00, 1200000.00, 240000, 2.024, 485760.00,  240000, 1.00, 240000.00, 240000, 1925760.00, 0.00,        'draft',     1],
  [5, 2026, 2, 270000, 5.00, 1350000.00, 270000, 2.024, 546480.00,  270000, 1.00, 270000.00, 270000, 2166480.00, 2166480.00, 'submitted', 1],
];

const cols = '(omcId, periodYear, periodQuarter, exciseDeclaredVolume, exciseDutyRate, exciseDutyAmount, vatDeclaredVolume, vatRate, vatAmount, levyDeclaredVolume, levyRate, levyAmount, totalDeclaredVolume, totalTaxDue, totalPaid, status, submittedBy)';

let inserted = 0;
for (const row of [...q3Data, ...q4Data, ...q2_2026Data]) {
  const [omcId, year, q, edv, edr, eda, vdv, vr, va, ldv, lr, la, tdv, ttd, tp, st, sb] = row;
  try {
    await db.execute(sql`INSERT INTO tax_returns ${sql.raw(cols)} VALUES (${omcId}, ${year}, ${q}, ${edv}, ${edr}, ${eda}, ${vdv}, ${vr}, ${va}, ${ldv}, ${lr}, ${la}, ${tdv}, ${ttd}, ${tp}, ${st}, ${sb})`);
    inserted++;
  } catch(e) {
    console.log(`Skip (dup?): OMC ${omcId} Q${q} ${year} - ${e.message.slice(0,50)}`);
  }
}
console.log(`Inserted ${inserted} tax_returns`);

// Insert SICPA records for more OMCs
const sicpaData = [
  [2, 'SICPA-DEMO0002', 'diesel',   4125600.00, 3642000.00,  -483600.00, 13.30, 'major',    '2026-05-15 09:00:00'],
  [3, 'SICPA-DEMO0003', 'petrol',   3876200.00, 3512000.00,  -364200.00, 10.40, 'major',    '2026-05-16 09:00:00'],
  [4, 'SICPA-DEMO0004', 'kerosene', 2945100.00, 2710000.00,  -235100.00,  8.70, 'minor',    '2026-05-17 09:00:00'],
  [5, 'SICPA-DEMO0005', 'diesel',   2512400.00, 2345000.00,  -167400.00,  7.10, 'minor',    '2026-05-18 09:00:00'],
  [6, 'SICPA-DEMO0006', 'petrol',   1850000.00, 1820000.00,   -30000.00,  1.62, 'none',     '2026-05-19 09:00:00'],
  [7, 'SICPA-DEMO0007', 'diesel',   3200000.00, 3150000.00,   -50000.00,  1.56, 'none',     '2026-05-20 09:00:00'],
];

let sicpaInserted = 0;
for (const [omcId, ref, pt, decl, verif, variance, variancePct, flag, vdate] of sicpaData) {
  try {
    await db.execute(sql`INSERT INTO sicpa_records (omcId, verificationRef, productType, declaredVolumeLitres, verifiedVolumeLitres, varianceLitres, variancePercent, discrepancyFlag, verificationDate) VALUES (${omcId}, ${ref}, ${pt}, ${decl}, ${verif}, ${variance}, ${variancePct}, ${flag}, ${vdate})`);
    sicpaInserted++;
  } catch(e) {
    console.log(`Skip SICPA (dup?): ${ref} - ${e.message.slice(0,50)}`);
  }
}
console.log(`Inserted ${sicpaInserted} sicpa_records`);

// Final counts
const [tr] = await db.execute(sql`SELECT COUNT(*) as count FROM tax_returns`);
const [sr] = await db.execute(sql`SELECT COUNT(*) as count FROM sicpa_records`);
console.log(`Final: taxReturns=${tr[0].count}, sicpaRecords=${sr[0].count}`);
