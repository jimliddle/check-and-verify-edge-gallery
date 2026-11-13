const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../check-and-verify/scripts/index.html'), 'utf8');
const context = {window:{}};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const rawRun = async x => JSON.parse(await context.window.ai_edge_gallery_get_result(typeof x === 'string' ? x : JSON.stringify(x)));
const run = async x => { const r = await rawRun(x); if (!r.error && typeof r.result === 'string') r.result = JSON.parse(r.result); return r; };
const fixture = () => ({sources:[{id:'S1',filename:'1706.03762.pdf',page:2,text:'Self-attention relates positions.'}],paragraphs:[{text:'The source says “Self-attention relates positions.”',citations:['S1'],quotes:[{source_id:'S1',text:'Self-attention relates positions.'}]}]});
test('preserves filename and page exactly', async()=>assert.equal((await run(fixture())).result.answer,'The source says “Self-attention relates positions.” (1706.03762.pdf, page 2)'));
test('rejects unknown citation', async()=>{const x=fixture();x.paragraphs[0].citations=['S2'];assert.ok((await run(x)).error);});
test('rejects fabricated quote', async()=>{const x=fixture();x.paragraphs[0].quotes[0].text='Different text';assert.ok((await run(x)).error);});
test('rejects wrong quote attribution', async()=>{const x=fixture();x.paragraphs[0].quotes[0].source_id='S2';assert.ok((await run(x)).error);});
test('rejects duplicate source IDs', async()=>{const x=fixture();x.sources.push(x.sources[0]);assert.ok((await run(x)).error);});
test('rejects invalid page', async()=>{const x=fixture();x.sources[0].page='2';assert.ok((await run(x)).error);});
test('allows unpaged sources without inventing page', async()=>{const x=fixture();x.sources[0].page=null;assert.match((await run(x)).result.answer,/\(1706\.03762\.pdf\)$/);});
test('allows uncited answer with no sources', async()=>assert.equal((await run({sources:[],paragraphs:[{text:'Evidence is unavailable.',citations:[],quotes:[]}]})).result.answer,'Evidence is unavailable.'));
test('handles malformed JSON', async()=>assert.ok((await run('{')).error));
test('rejects empty answers', async()=>assert.ok((await run({sources:[],paragraphs:[]})).error));
test('does not execute source text', async()=>{const x=fixture();x.sources[0].text='<script>throw Error("executed")</script>';x.paragraphs[0].quotes=[];assert.ok((await run(x)).result);});
test('does not claim semantic verification', async()=>assert.match((await run(fixture())).result.scope,/meaning.*not validated/));

test('Edge Gallery result is a string', async()=>{const r=await rawRun(fixture());assert.equal(typeof r.result,'string');assert.equal(typeof JSON.parse(r.result).answer,'string');});

// Mirrors RunJsTool's result/error branch order, not just the checker itself.
const hostResult = r => {
  if (r.result == null && r.webview == null && r.image == null) return {status:'succeeded',result:JSON.stringify(r)};
  if (r.error != null) return {status:'failed',error:r.error};
  return {status:'succeeded',result:r.result || ''};
};
test('documented first invocation names the installed skill and executes self-test', async()=>{
  const skill=fs.readFileSync(require('node:path').join(__dirname,'../check-and-verify/SKILL.md'),'utf8');
  const name=skill.match(/^name: (.+)$/m)[1];
  const args=JSON.parse(skill.match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.equal(args.skillName,name);
  assert.equal(args.scriptName,'index.html');
  assert.ok(fs.existsSync(require('node:path').join(__dirname,'../check-and-verify/scripts',args.scriptName)));
  const r=hostResult(await rawRun(args.data));
  assert.equal(r.status,'succeeded');
  assert.equal(JSON.parse(r.result).ready,'CHECK_AND_VERIFY_READY_0.2.0');
});
test('invalid citation produces failed status in Edge Gallery',async()=>{
  const x=fixture();x.paragraphs[0].citations=['S2'];
  assert.equal(hostResult(await rawRun(x)).status,'failed');
});
test('altered quote produces failed status in Edge Gallery',async()=>{
  const x=fixture();x.paragraphs[0].quotes[0].text='Invented';
  assert.equal(hostResult(await rawRun(x)).status,'failed');
});
test('malformed JSON produces failed status in Edge Gallery',async()=>{
  assert.equal(hostResult(await rawRun('{')).status,'failed');
});
test('self-test cannot bypass checking answer data',async()=>{
  const x=fixture();x.mode='self_test';
  assert.equal(hostResult(await rawRun(x)).status,'failed');
});
