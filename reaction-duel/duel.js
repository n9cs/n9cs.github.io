'use strict';
const $ = id => document.getElementById(id);
const pad = $('pad');
let state = 'idle', scores = [], timer = null, frame = null, started = 0, lockedUntil = 0;
const params = new URLSearchParams(location.hash.slice(1));
const rawTarget = params.get('beat');
const target = /^\d{1,4}$/.test(rawTarget || '') && Number(rawTarget) >= 1 && Number(rawTarget) <= 3000 ? Number(rawTarget) : null;
if (target !== null) { $('challenge').hidden = false; $('target').textContent = `${target} ms`; }
function average(values) { return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length); }
function clearPending() { clearTimeout(timer); cancelAnimationFrame(frame); timer = frame = null; }
function show(next, title, hint) {
  state = next; pad.dataset.state = next;
  $('pad-title').textContent = title; $('pad-hint').textContent = hint;
  $('announcement').textContent = `${title} ${hint}`;
}
function beginRound() {
  clearPending();
  $('round-label').textContent = `ROUND ${scores.length + 1} / 5`;
  show('waiting', 'Hold it…', 'Wait for green. Don’t click yet.');
  timer = setTimeout(() => {
    frame = requestAnimationFrame(() => {
      if (state !== 'waiting' || document.hidden) return;
      show('go', 'GO!', 'Click, tap, or press Space!');
      started = performance.now();
      timer = setTimeout(() => finishRound(3000, 'timeout'), 3000);
    });
  }, 1500 + Math.random() * 3000);
}
function startMatch() {
  scores = []; $('results').hidden = true; $('share-link').hidden = true;
  $('share-status').textContent = 'Send your score link. Your friend plays on their device.';
  for (let i = 0; i < 5; i++) { $(`r${i}`).textContent = '—'; $(`r${i}`).className = ''; }
  beginRound();
}
function finishRound(ms, kind = 'clean') {
  clearPending();
  const score = Math.max(1, Math.min(3000, Math.round(ms)));
  const slot = $(`r${scores.length}`);
  slot.textContent = `${score}`; slot.title = kind === 'clean' ? `${score} milliseconds` : `${kind === 'early' ? 'Early click' : 'No response'} penalty: ${score} milliseconds`;
  if (kind !== 'clean') slot.className = 'penalty';
  scores.push(score); lockedUntil = performance.now() + 450;
  if (scores.length === 5) {
    const avg = average(scores);
    $('average').textContent = avg; $('results').hidden = false;
    const verdict = target === null ? 'That’s your score to beat. Send it to a friend.' : avg < target ? `You win by ${target - avg} ms. Your move, friend.` : avg === target ? 'Dead heat. Time for a rematch.' : `Your friend wins by ${avg - target} ms. Run it back?`;
    $('verdict').textContent = verdict;
    $('round-label').textContent = 'MATCH COMPLETE';
    show('done', `${avg} ms average`, kind === 'early' ? 'Early click: 1,000 ms penalty included. Results below.' : kind === 'timeout' ? 'No response: 3,000 ms penalty included. Results below.' : 'Five rounds down. Challenge a friend below.');
    return;
  }
  if (kind === 'early') show('early', 'Too soon.', '1,000 ms penalty. Click to start the next round.');
  else if (kind === 'timeout') show('early', 'Missed it.', '3,000 ms penalty. Click to start the next round.');
  else show('result', `${score} ms`, 'Nice. Click to start the next round.');
}
function activate() {
  if (performance.now() < lockedUntil || document.hidden) return;
  if (state === 'idle') startMatch();
  else if (state === 'waiting') finishRound(1000, 'early');
  else if (state === 'go') finishRound(performance.now() - started);
  else if (state === 'result' || state === 'early' || state === 'paused') beginRound();
}
pad.addEventListener('pointerdown', e => { if (!e.isPrimary || e.button !== 0) return; e.preventDefault(); pad.focus({preventScroll:true}); activate(); });
pad.addEventListener('click', e => { if (e.detail === 0) activate(); });
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'Enter') && (document.activeElement === pad || document.activeElement === document.body)) {
    e.preventDefault(); if (!e.repeat) activate();
  }
});
document.addEventListener('keyup', e => { if ((e.code === 'Space' || e.code === 'Enter') && document.activeElement === pad) e.preventDefault(); });
function pause() {
  if (state !== 'waiting' && state !== 'go') return;
  clearPending(); show('paused', 'Round paused.', 'Focus lost. Click to retry this round without a penalty.');
}
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', pause);
$('again').addEventListener('click', () => { pad.focus({preventScroll:true}); startMatch(); });
$('share').addEventListener('click', async () => {
  if (scores.length !== 5) return;
  const url = new URL(location.href); url.search = ''; url.hash = `beat=${average(scores)}`;
  try { await navigator.clipboard.writeText(url.href); $('share-status').textContent = 'Challenge link copied. Send it to a friend.'; }
  catch { $('share-link').hidden = false; $('share-link').value = url.href; $('share-link').focus(); $('share-link').select(); $('share-status').textContent = 'Copy this link and send it to a friend.'; }
});
