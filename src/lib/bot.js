import { uid } from './store.js';

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','if','to','of','in','on','for','with','is',
  'are','was','were','be','been','it','this','that','you','your','i','me','my',
  'we','our','they','them','he','she','as','at','by','from','how','what','when',
  'where','why','can','could','should','would','do','does','did','have','has',
  'had','will','get','got','so','than','then','about','into','out','up','down'
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9#\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function extractName(text) {
  const lines = String(text || '').split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return 'Untitled Skill';
  const first = lines[0];
  const m = first.match(/^skill\s*[:\-]\s*(.+)$/i);
  if (m) return m[1].trim().slice(0, 60);
  return first.replace(/^#+\s*/, '').slice(0, 60) || 'Untitled Skill';
}

function extractTags(text) {
  const tags = [];
  const re = /#([a-z0-9_\-]+)/gi;
  let match;
  while ((match = re.exec(String(text || '')))) {
    const t = match[1].toLowerCase();
    if (!tags.includes(t)) tags.push(t);
  }
  return tags;
}

// Parse a pasted prompt into a learnable skill object.
export function learnPrompt(text) {
  const promptText = String(text || '').trim();
  const name = extractName(promptText);
  const tags = extractTags(promptText);
  const keywords = Array.from(
    new Set(tokenize(promptText).filter((w) => !w.startsWith('#') && !STOP_WORDS.has(w) && w.length > 2))
  );
  return {
    id: uid(),
    name,
    promptText,
    tags,
    keywords,
    learnedAt: Date.now(),
    useCount: 0,
  };
}

function scoreSkill(msgTokens, skill) {
  let score = 0;
  const kw = skill.keywords || [];
  const tg = skill.tags || [];
  for (const t of msgTokens) {
    const bare = t.replace(/^#/, '');
    if (tg.includes(bare)) score += 3;
    if (kw.includes(bare)) score += 1;
    if ((skill.name || '').toLowerCase().includes(bare)) score += 2;
  }
  return score;
}

function summarizePrompt(promptText) {
  const lines = String(promptText || '')
    .split(/\n/)
    .map((l) => l.replace(/^[#\-*\s]+/, '').trim())
    .filter((l) => l.length > 0);
  const body = lines.slice(1);
  const useful = (body.length ? body : lines).slice(0, 3);
  return useful.length ? useful : ['(no additional guidance in this skill)'];
}

// Deterministic local reasoning: match message against learned skills.
// Returns { reply, appliedSkillNames, skills } (skills has updated useCount).
export function generateReply(userMsg, skills) {
  const list = Array.isArray(skills) ? skills : [];
  if (!list.length) {
    return {
      reply:
        "I haven't learned any skills yet. Open the Trainer tab and paste a skilled prompt " +
        "(start it with 'Skill: <name>' and add #tags), then I'll apply it here.",
      appliedSkillNames: [],
      skills: list,
    };
  }

  const msgTokens = tokenize(userMsg);
  const scored = list
    .map((s) => ({ skill: s, score: scoreSkill(msgTokens, s) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    const names = list.map((s) => s.name).join(', ');
    return {
      reply:
        "None of my learned skills clearly match that. I currently know: " +
        names +
        '. Try phrasing it with words or #tags from one of those skills, or teach me a new one.',
      appliedSkillNames: [],
      skills: list,
    };
  }

  const top = scored.slice(0, 3);
  const appliedIds = new Set(top.map((x) => x.skill.id));
  const appliedSkillNames = top.map((x) => x.skill.name);

  const sections = top
    .map((x) => {
      const points = summarizePrompt(x.skill.promptText)
        .map((p) => '  - ' + p)
        .join('\n');
      return '• ' + x.skill.name + ':\n' + points;
    })
    .join('\n');

  const reply =
    'Applied skills: ' +
    appliedSkillNames.join(', ') +
    '\n\nHere is structured guidance based on what I have learned:\n' +
    sections;

  const updated = list.map((s) =>
    appliedIds.has(s.id) ? { ...s, useCount: (s.useCount || 0) + 1 } : s
  );

  return { reply, appliedSkillNames, skills: updated };
}
