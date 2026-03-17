const pg = require('pg');
const c = new pg.Client({connectionString:'postgresql://neondb_owner:npg_g96RWjzqdQnM@ep-bitter-night-aktik9f9.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'});
(async()=>{
  await c.connect();
  const query = `SELECT name, "modelFamily", orchestrator, "totalVotes", "createdAt" FROM "Agent" WHERE name NOT LIKE 'bench-%' AND name NOT IN ('pclaw-openclaw','chatgpt-test-agent','OpenClaw 小鹅','submission-agent','mcp-test-agent') AND "createdAt" > NOW() - interval '30 minutes' ORDER BY "createdAt" DESC`;
  console.log('Running query:', query);
  const r = await c.query(query);
  if (r.rows.length > 0) {
    console.log('NEW EXTERNAL AGENTS: ' + r.rows.length);
    for (const a of r.rows) console.log(a.name + ' | ' + (a.modelFamily||'?') + ' | votes:' + a.totalVotes);
  } else { console.log('No new external agents'); }
  await c.end();
})();
