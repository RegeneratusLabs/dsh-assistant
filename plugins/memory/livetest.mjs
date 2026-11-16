/**
 * Live contract test for the semantic tier — opt-in, safe by default.
 *
 * `npm test` never runs this: it needs the Hindsight daemon on this machine and
 * it is the only test allowed to talk to the network. It is read-only against a
 * real bank. A write round-trip happens only when the caller names a throwaway
 * bank that starts with `dsh-live-` and asks for it explicitly, so a typo can
 * never create or delete a real bank (least of all another agent's).
 *
 * Run:
 *   npm run test:live                                   # read-only against dsh-assistant
 *   HINDSIGHT_LIVE_WRITE=1 HINDSIGHT_BANK=dsh-live-123 npm run test:live
 */

const base = (process.env.HINDSIGHT_API_URL ?? 'http://127.0.0.1:9177').replace(/\/+$/, '');
const bank = process.env.HINDSIGHT_BANK ?? 'dsh-assistant';
const write = process.env.HINDSIGHT_LIVE_WRITE === '1';

if (process.env.HINDSIGHT_LIVE !== '1') {
  console.log('skipped: set HINDSIGHT_LIVE=1 to test the live Hindsight daemon');
  process.exit(0);
}

let failures = 0;
/** One assertion, printed in the same shape as the unit selftests. */
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`ok   ${label}`);
    return;
  }
  failures += 1;
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

/** JSON request with a timeout; throws on a non-2xx response. */
async function call(method, pathname, body, timeout = 20000) {
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${pathname} -> ${response.status}: ${text.slice(0, 240)}`);
  return text.length > 0 ? JSON.parse(text) : {};
}

try {
  const health = await call('GET', '/health', undefined, 3000);
  check('daemon answers healthy', health.status === 'healthy', JSON.stringify(health));

  // A throwaway bank starts empty by definition; create it before the read
  // checks so the same script can prove both the read and the write contract.
  const fresh = write && bank.startsWith('dsh-live-');
  if (fresh) await call('PUT', `/v1/default/banks/${encodeURIComponent(bank)}`, {}).catch(() => {});

  const stats = await call('GET', `/v1/default/banks/${encodeURIComponent(bank)}/stats`);
  check(
    fresh ? 'throwaway bank starts empty' : 'bank exists and reports facts',
    fresh ? Number(stats.total_nodes) === 0 : Number(stats.total_nodes) > 0,
    JSON.stringify(stats).slice(0, 200),
  );

  const started = Date.now();
  const recall = await call('POST', `/v1/default/banks/${encodeURIComponent(bank)}/memories/recall`, {
    query: 'what do I know about the user?',
    max_tokens: 600,
  });
  const elapsed = Date.now() - started;
  check(
    'recall answers',
    Array.isArray(recall.results) && (fresh || recall.results.length > 0),
    JSON.stringify(recall).slice(0, 200),
  );
  check('recall completes under the tool timeout', elapsed < 10000, `${elapsed} ms`);

  if (write) {
    if (!bank.startsWith('dsh-live-')) {
      throw new Error(`refusing to write to ${bank}: a write round-trip needs a throwaway dsh-live-* bank`);
    }
    const marker = `livetest-${Date.now()}`;
    const retained = await call('POST', `/v1/default/banks/${encodeURIComponent(bank)}/memories`, {
      items: [{ content: `The assistant's live-test marker is ${marker}.`, tags: ['fact'] }],
      async: true,
    });
    check('retain accepted the fact', retained.success === true && retained.operation_id !== undefined, JSON.stringify(retained).slice(0, 200));
    // Extraction is asynchronous: poll until the marker surfaces, bounded.
    let found = {};
    let waited = 0;
    for (; waited < 60000; waited += 1000) {
      found = await call('POST', `/v1/default/banks/${encodeURIComponent(bank)}/memories/recall`, { query: marker, max_tokens: 400 });
      if (JSON.stringify(found).includes(marker)) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    check('retained fact is recallable', JSON.stringify(found).includes(marker), `${waited} ms; ${JSON.stringify(found).slice(0, 240)}`);
    await call('DELETE', `/v1/default/banks/${encodeURIComponent(bank)}`);
    const gone = await call('GET', `/v1/default/banks/${encodeURIComponent(bank)}/stats`).then(
      () => false,
      () => true,
    );
    check('throwaway bank was deleted', gone);
  }
} catch (error) {
  failures += 1;
  console.log(`FAIL live test — ${String(error && error.message ? error.message : error)}`);
}

console.log(failures === 0 ? '\nlivetest PASS' : `\nlivetest FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
