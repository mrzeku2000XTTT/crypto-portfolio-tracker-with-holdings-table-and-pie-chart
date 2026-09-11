import React, { useEffect, useState } from 'react';
import { loadSkills, saveSkills } from '../lib/store.js';
import { learnPrompt } from '../lib/bot.js';

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function SkillTrainer() {
  const [skills, setSkills] = useState(() => loadSkills());
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  useEffect(() => {
    saveSkills(skills);
  }, [skills]);

  function handleLearn() {
    const text = draft.trim();
    setError('');
    if (!text) {
      setError('Paste a prompt before ingesting.');
      return;
    }
    const skill = learnPrompt(text);
    setSkills((prev) => [skill, ...prev]);
    setDraft('');
    setFlash('Learned “' + skill.name + '”');
    window.setTimeout(() => setFlash(''), 2600);
  }

  function handleDelete(id) {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="kb-panel">
      <div className="card">
        <h2>Teach a skill</h2>
        <p className="kb-muted">
          Paste a skilled prompt. Start the first line with{' '}
          <code>Skill: My Skill</code> and add <code>#tags</code> the bot can match on.
        </p>
        <textarea
          className="input"
          rows={6}
          placeholder={'Skill: Concise Summarizer\nRewrite text into 3 tight bullet points.\nKeep it neutral and factual. #summary #writing'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        {error && <div className="kb-error">{error}</div>}
        {flash && <div className="kb-flash">{flash}</div>}
        <div className="kb-actions">
          <button className="btn btn-accent" onClick={handleLearn}>
            Ingest &amp; Learn
          </button>
          {draft && (
            <button className="btn" onClick={() => setDraft('')}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="kb-list">
        {skills.length === 0 ? (
          <div className="kb-empty">No skills yet - teach the bot a prompt.</div>
        ) : (
          skills.map((s) => (
            <div className="kb-skill-card" key={s.id}>
              <div className="kb-skill-head">
                <h3>{s.name}</h3>
                <button
                  className="btn kb-del"
                  aria-label={'Delete ' + s.name}
                  onClick={() => handleDelete(s.id)}
                >
                  Delete
                </button>
              </div>
              <p className="kb-skill-body">{s.promptText}</p>
              <div className="kb-tags">
                {(s.tags || []).map((t) => (
                  <span className="tag" key={t}>
                    #{t}
                  </span>
                ))}
              </div>
              <div className="kb-skill-meta">
                <span className="pill">Used {s.useCount || 0}x</span>
                <span className="kb-muted">Learned {formatDate(s.learnedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
