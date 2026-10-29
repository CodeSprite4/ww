"use strict";
/* Kind-chat filter: blocks bad words, mean messages, threats, links and personal info. */
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i", "|": "i", "+": "t", "€": "e", "£": "l", "v": "v" };
function norm(s) { s = String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, ""); let o = ""; for (const ch of s) o += LEET[ch] || ch; return o; }
const col = w => w.replace(/(.)\1+/g, "$1");               // "fuuuck" -> "fuck", "ass" -> "as"
const KIND = "Let's keep chat kind and friendly. Try saying it nicely! 💛", BADW = "That word isn't allowed here. Let's keep chat kind and friendly! 💛";
/* blocked anywhere inside a word (stored in collapsed form) */
const SEVERE = ["fuck", "fvck", "phuck", "shit", "bitch", "bastard", "asshole", "dumbass", "dick", "pussy", "cunt", "whore", "slut", "nigger", "nigga", "faggot", "retard", "porn", "rapist", "killyourself", "killyoself", "hangyourself", "suicide", "hitler", "nazi", "pedo", "molest", "penis", "vagina", "motherfuck", "bullshit", "wanker", "jizz", "terrorist"].map(col);
/* blocked only as a whole word */
const WORD = new Set(["ass", "asses", "sex", "sexy", "rape", "cock", "tit", "tits", "boob", "boobs", "damn", "crap", "piss", "wtf", "stfu", "kys", "fag", "tard", "cum", "anus", "hell", "naked", "nude", "die", "dead", "kill", "murder", "punch", "ugly", "stupid", "idiot", "dumb", "loser", "hate", "hates", "hated", "stink", "stinks", "stinky", "fat", "moron", "noob", "trash", "garbage", "worthless", "useless", "annoying", "weirdo", "freak", "creep", "gross", "shutup", "suck", "sucks", "sucker", "jerk", "brat", "dummy", "crybaby", "pathetic", "disgusting", "cheater", "scam", "scammer", "liar", "lame", "cringe", "bully"]);
const SAFE = ["class", "assist", "assign", "assume", "pass", "bass", "mass", "glass", "grass", "brass", "assemble", "classic", "assault"];
function candidates(raw) { const toks = norm(raw).replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean), out = []; let run = "";
  for (const t of toks) { if (SAFE.some(x => t === x || t.startsWith(x))) { if (run.length > 1) out.push(run); run = ""; continue; } out.push(t); if (t.length === 1) run += t; else { if (run.length > 1) out.push(run); run = ""; } }
  if (run.length > 1) out.push(run); return out; }
function check(text) {
  const raw = String(text || "");
  if (/https?:\/\/|www\.|\.(com|net|org|io|gg|ly|me|tv|xyz|ru|co)\b/i.test(raw)) return "No links, please. Let's keep chat safe!";
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(raw) || /@\w{3,}/.test(raw)) return "Please don't share emails or usernames.";
  if (/(\d[\s().-]*){7,}/.test(raw)) return "Please don't share phone numbers or other numbers that identify you.";
  if (/\b(i live at|my address|my phone|my number|my school|where do you live|what school|snapchat|snap me|discord|instagram|tiktok|kik|whatsapp)\b/i.test(raw)) return "Please keep personal details private. Stay safe!";
  const letters = raw.replace(/[^A-Za-z]/g, ""); if (letters.length > 8 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.7) return "No shouting, please. Use your inside voice!";
  if (/(.)\1{7,}/.test(raw)) return "That looks like spam. Try a normal message!";
  if (/\b[fsbacd][*#%]{2,}/i.test(raw)) return BADW;
  for (const c of candidates(raw)) { const cc = col(c); if (WORD.has(c) || WORD.has(cc)) return KIND; if (cc.length >= 4 && SEVERE.some(x => cc.includes(x))) return BADW; }
  const n = norm(raw);
  if (/\b(you|u|ur|youre|your)\b.*\b(suck|stink|ugly|dumb|stupid|bad|worst|trash|loser)\b/.test(n)) return KIND;
  if (/\bi\s*(will|wanna|want to|am going to|gonna)\b.*\b(kill|hurt|beat|hit|punch)\b/.test(n)) return KIND;
  return null;
}
module.exports = { check };
