const servers = {"none":{"label":"No emoji","emoji":"","id":""},"solos": {"label": "Noble Solos", "emoji": "<:solos:1219808434652708984>", "id": "1219808434652708984"}, "solos_closed": {"label": "Noble Solos Closed", "emoji": "<:solos_closed:1403796828239040534>", "id": "1403796828239040534"}, "div0": {"label": "Noble Division 0", "emoji": "<:div0:1283115473822683218>", "id": "1283115473822683218"}, "div1": {"label": "Noble Division 1", "emoji": "<:Division1:1283025280553717883>", "id": "1283025280553717883"}, "div2": {"label": "Noble Division 2", "emoji": "<:Div2:1540429559076225094>", "id": "1540429559076225094"}, "div3": {"label": "Noble Division 3", "emoji": "<:div3:936738590753456199>", "id": "936738590753456199"}, "pro": {"label": "Noble Pro Scrims", "emoji": "<:proscrims:1503892383371235379>", "id": "1503892383371235379"}};
const $ = id => document.getElementById(id);
function calculate(time, gap) {
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (hours > 23 || minutes > 59 || !Number.isInteger(gap) || gap < 1 || gap > 180) return null;
  const total = hours * 60 + minutes + gap;
  return { time: `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`, tomorrow: total >= 1440 };
}
let message = '';
function update() {
  const gap = Number($('gap').value);
  const result = calculate($('start').value, gap);
  $('copy').disabled = !result;
  $('fallback').hidden = true;
  $('copy-status').textContent = 'Includes Discord bold text and quote formatting.';
  $('error').textContent = result ? '' : 'Enter a valid start time and a whole interval from 1 to 180 minutes.';
  if (!result) { $('next').textContent = '—'; $('rollover').textContent = ''; message = ''; return; }
  const game = document.querySelector('input[name="game"]:checked').value;
  const server = servers[document.querySelector('input[name="server"]:checked').value];
  $('server-emoji').hidden = !server.emoji;
  if (server.emoji) $('server-emoji').src = `https://cdn.discordapp.com/emojis/${server.id}.png?size=64`;
  $('server-emoji').alt = server.label;
  const gameLine = `Game ${game} Started`;
  const minutesLine = `Next Game in ${gap} ${gap === 1 ? 'minute' : 'minutes'}`;
  $('game-line').textContent = gameLine;
  $('minutes-line').textContent = minutesLine;
  $('next').textContent = result.time;
  const announcementTime = `XX:${result.time.split(':')[1]}`;
  $('at').textContent = announcementTime;
  $('rollover').textContent = result.tomorrow ? 'Next day' : 'Same day';
  message = `> ${server.emoji ? server.emoji + ' ' : ''}**${gameLine}**\n> **${minutesLine}** @ ${announcementTime}`;
}
function useNow() { const date = new Date(); $('start').value = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`; update(); }
$('now').addEventListener('click', useNow);
document.querySelectorAll('input').forEach(input => input.addEventListener('input', update));
$('copy').addEventListener('click', async () => {
  if (!message) return;
  try { await navigator.clipboard.writeText(message); $('copy-status').textContent = 'Copied. Ready to paste into Discord.'; }
  catch { $('fallback').value = message; $('fallback').hidden = false; $('fallback').focus(); $('fallback').select(); $('copy-status').textContent = 'Select and copy the message below.'; }
});
useNow();
