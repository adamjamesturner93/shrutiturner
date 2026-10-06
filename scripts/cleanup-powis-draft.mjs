import { readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import pg from "pg";

const apply = process.argv.includes("--apply");
const env = parseEnv(readFileSync(".env.prod", "utf8"));
const connectionString = env.DIRECT_URL || env.DATABASE_URL;
if (!connectionString || ["localhost", "127.0.0.1"].includes(new URL(connectionString).hostname))
  throw new Error("Expected explicit production database.");
const client = new pg.Client({ connectionString });
const draftId = "cmu77atta000a04jvsjpnbk33";
const openId = "cmu887mpm000004jqm7l77eze";
const allowed = new Set([
  "RetreatDate",
  "RetreatRoomOption",
  "RetreatInventoryPool",
  "RetreatRatePlan",
  "RetreatRoomUnit",
  "RetreatDepositRule",
  "RetreatAddon",
  "RetreatDateInstructorAssignment",
]);
const q = (value) => `"${value.replaceAll('"', '""')}"`;
await client.connect();
try {
  await client.query(apply ? "BEGIN ISOLATION LEVEL SERIALIZABLE" : "BEGIN READ ONLY");
  const open = (await client.query('SELECT * FROM "RetreatDate" WHERE id=$1', [openId])).rows[0];
  if (!open || open.status !== "open") throw new Error("Expected open reference event.");
  const groups = (
    await client.query(
      'SELECT * FROM "RetreatVenueRoomGroup" WHERE "venueProfileId"=$1 ORDER BY "displayOrder"',
      [open.venueProfileId]
    )
  ).rows;
  const snapshot = { date: open, groups };
  for (const table of [
    "RetreatRoomOption",
    "RetreatInventoryPool",
    "RetreatRoomUnit",
    "RetreatDepositRule",
  ])
    snapshot[table] = (
      await client.query(`SELECT * FROM ${q(table)} WHERE "retreatDateId"=$1`, [openId])
    ).rows;
  snapshot.RetreatRatePlan = (
    await client.query(
      'SELECT r.* FROM "RetreatRatePlan" r JOIN "RetreatRoomOption" o ON r."roomOptionId"=o.id WHERE o."retreatDateId"=$1',
      [openId]
    )
  ).rows;
  snapshot.RetreatVenueRoomTemplate = (
    await client.query(
      'SELECT t.* FROM "RetreatVenueRoomTemplate" t JOIN "RetreatVenueRoomGroup" g ON t."roomGroupId"=g.id WHERE g."venueProfileId"=$1',
      [open.venueProfileId]
    )
  ).rows;
  writeFileSync("/tmp/powis-production-configuration.json", JSON.stringify(snapshot, null, 2), {
    mode: 0o600,
  });
  const draft = (
    await client.query(`SELECT * FROM "RetreatDate" WHERE id=$1${apply ? " FOR UPDATE" : ""}`, [
      draftId,
    ])
  ).rows[0];
  if (!draft) {
    console.log("Draft already absent; production configuration exported.");
    await client.query("ROLLBACK");
    process.exitCode = 0;
  } else {
    if (
      draft.status !== "draft" ||
      draft.experienceId !== open.experienceId ||
      draft.venueProfileId !== open.venueProfileId
    )
      throw new Error("Draft identity/status changed.");
    const fks = (
      await client.query(`SELECT child.relname AS child,parent.relname AS parent,ca.attname AS column,pa.attname AS target
      FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid JOIN pg_class parent ON parent.oid=c.confrelid
      JOIN pg_namespace n ON n.oid=child.relnamespace
      JOIN pg_attribute ca ON ca.attrelid=c.conrelid AND ca.attnum=c.conkey[1]
      JOIN pg_attribute pa ON pa.attrelid=c.confrelid AND pa.attnum=c.confkey[1]
      WHERE c.contype='f' AND n.nspname='public'`)
    ).rows;
    const exported = {};
    const seen = new Set();
    async function visit(table, row) {
      const key = `${table}:${row.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!allowed.has(table))
        throw new Error(`Refusing deletion: ${table} references draft inventory.`);
      if (row.retreatDateId && row.retreatDateId !== draftId)
        throw new Error(`Shared ownership detected in ${table}.`);
      (exported[table] ||= []).push(row);
      for (const fk of fks.filter((fk) => fk.parent === table)) {
        const children = (
          await client.query(
            `SELECT * FROM ${q(fk.child)} WHERE ${q(fk.column)}=$1${apply ? " FOR UPDATE" : ""}`,
            [row[fk.target]]
          )
        ).rows;
        for (const child of children) await visit(fk.child, child);
      }
    }
    await visit("RetreatDate", draft);
    console.log(
      JSON.stringify({
        mode: apply ? "apply" : "dry-run",
        draftId,
        retainedOpenId: openId,
        records: Object.fromEntries(
          Object.entries(exported).map(([table, rows]) => [table, rows.length])
        ),
      })
    );
    const backup = `/tmp/powis-draft-recovery-${Date.now()}.json`;
    writeFileSync(backup, JSON.stringify({ exportedAt: new Date(), tables: exported }, null, 2), {
      mode: 0o600,
      flag: "wx",
    });
    console.log(`Recovery export: ${backup}`);
    if (apply) {
      const deleted = await client.query(
        "DELETE FROM \"RetreatDate\" WHERE id=$1 AND status='draft'",
        [draftId]
      );
      if (deleted.rowCount !== 1) throw new Error("Draft deletion did not match exactly one row.");
      const after = (await client.query('SELECT * FROM "RetreatDate" WHERE id=$1', [openId]))
        .rows[0];
      const afterGroups = (
        await client.query(
          'SELECT * FROM "RetreatVenueRoomGroup" WHERE "venueProfileId"=$1 ORDER BY "displayOrder"',
          [open.venueProfileId]
        )
      ).rows;
      if (
        JSON.stringify(after) !== JSON.stringify(open) ||
        JSON.stringify(afterGroups) !== JSON.stringify(groups)
      )
        throw new Error("Open event or shared venue changed.");
      await client.query("COMMIT");
      console.log("Deleted unused draft; open event and shared room groups unchanged.");
    } else await client.query("ROLLBACK");
  }
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
