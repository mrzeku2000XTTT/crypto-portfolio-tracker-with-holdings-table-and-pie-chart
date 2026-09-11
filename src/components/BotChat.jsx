import React, { useEffect, useRef, useState } from 'react';
import { loadChat, saveChat, loadSkills, saveSkills, uid } from '../lib/store.js';
import { generateReply } from '../lib/bot.js';

function makeWelcome() {
  return {
    id: uid(),
    role: 'bot',
    text:
      'Hi! I am your Kaspa bot. Teach me skilled prompts in the Trainer tab, ' +
      'then ask me things here and I will apply what I have learned.',
    applied: [],
    at: Date.now(),
  };
}

export default function BotChat() {
  const [messages, setMessages] = useState(() => {
    const saved = loadChat();
    return saved && saved.length ? saved : [makeWelcome()];
  });
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    saveChat(messages);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    const userMsg = { id: uid(), role: 'user', text, applied: [], at: Date.now() };

    const skills = loadSkills();
    const { reply, appliedSkillNames, skills: updatedSkills } = generateReply(text, skills);

    // Persist bumped useCount so the Trainer reflects usage.
    if (updatedSkills !== skills) saveSkills(updatedSkills);

    const botMsg = {
      id: uid(),
      role: 'bot',
      text: reply,
      applied: appliedSkillNames,
      at: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setDraft('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([makeWelcome()]);
  }

  return (
    <div className="kb-panel">
      <div className="kb-chat">
        <div className="kb-chat-scroll" ref={scrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={'kb-msg kb-msg-' + m.role}>
              <div className="kb-msg-bubble">
                {m.text.split('\n').map((line, i) => (
                  <div key={i}>{line || ' '}</div>
                ))}
              </div>
              {m.role === 'bot' && m.applied && m.applied.length > 0 && (
                <div className="kb-applied">
                  {m.applied.map((name) => (
                    <span className="tag" key={name}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="kb-chat-input">
          <textarea
            className="input"
            rows={2}
            placeholder="Ask the bot... (Enter to send, Shift+Enter for newline)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
          />
          <div className="kb-chat-actions">
            <button className="btn" onClick={clearChat}>
              Clear
            </button>
            <button className="btn btn-accent" onClick={handleSend} disabled={!draft.trim()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
