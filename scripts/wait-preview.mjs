const target = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4321/');
let ready = false;
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const response = await fetch(target, { signal: AbortSignal.timeout(1000) });
    if (response.ok) { ready = true; break; }
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (!ready) throw new Error(`Preview did not become ready at ${target.href}`);
console.log(`Preview ready at ${target.href}`);
