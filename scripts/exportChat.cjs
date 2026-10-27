const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function exportChat() {
  const transcriptPath = 'C:/Users/arshd/.gemini/antigravity/brain/81a8dbb5-d059-4f00-a6bc-c804f9325d98/.system_generated/logs/transcript.jsonl';
  if (!fs.existsSync(transcriptPath)) {
    console.error('Transcript not found at:', transcriptPath);
    return;
  }

  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const messages = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      if (data.type === 'USER_INPUT' && data.content) {
        messages.push({ role: 'user', content: data.content, time: data.created_at });
      } else if (data.type === 'PLANNER_RESPONSE' && data.content) {
        messages.push({ role: 'model', content: data.content, time: data.created_at });
      }
    } catch (e) {}
  }

  // Emoji removal regex for professional presentation
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{1F680}-\u{1F6FF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu;
  const cleanText = (text) => text ? text.replace(emojiRegex, '').replace(/  +/g, ' ') : '';

  // 1. Generate Markdown file
  let md = '# MediRoute Development — AI Pair Programming Chat History\n\n';
  for (const m of messages) {
    const roleTitle = m.role === 'user' ? '### User' : '### Antigravity AI';
    md += `${roleTitle} *(${m.time ? new Date(m.time).toLocaleString() : ''})*\n\n`;
    md += cleanText(m.content) + '\n\n---\n\n';
  }
  fs.writeFileSync('chat-history.md', md, 'utf-8');

  // Clean messages for HTML
  const sanitizedMessages = messages.map(m => ({
    ...m,
    content: cleanText(m.content)
  }));

  // 2. Generate Standalone HTML file
  const jsonMsgs = JSON.stringify(sanitizedMessages).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediRoute — Pair Programming Chat History</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <style>
    body {
      background-color: #0f172a;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .header {
      background: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 1rem 2rem;
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      margin: 0;
      font-size: 1.25rem;
      color: #f8fafc;
    }
    .badge {
      background: #3b82f6;
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-weight: 600;
    }
    .container {
      max-width: 900px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .msg {
      margin-bottom: 2rem;
      padding: 1.25rem 1.5rem;
      border-radius: 0.75rem;
    }
    .msg-user {
      background: #1e293b;
      border: 1px solid #334155;
      margin-left: 2rem;
    }
    .msg-model {
      background: #0f172a;
      border: 1px solid #1e293b;
      margin-right: 2rem;
    }
    .msg-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .user-tag { color: #60a5fa; }
    .model-tag { color: #34d399; }
    .time-tag { color: #64748b; font-weight: normal; font-size: 0.75rem; }
    .content pre {
      background: #090d16;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      border: 1px solid #1e293b;
    }
    .content code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 0.875rem;
    }
    .content a { color: #38bdf8; text-decoration: none; }
    .content a:hover { text-decoration: underline; }
    .content table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    .content th, .content td {
      border: 1px solid #334155;
      padding: 0.5rem 0.75rem;
      text-align: left;
    }
    .content th { background: #1e293b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MediRoute — AI Pair Programming Session</h1>
    <span class="badge">${messages.length} Messages</span>
  </div>
  <div class="container" id="chat"></div>
  <script>
    const msgs = ${jsonMsgs};
    const container = document.getElementById('chat');
    marked.setOptions({
      highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      }
    });

    msgs.forEach(m => {
      const div = document.createElement('div');
      div.className = 'msg ' + (m.role === 'user' ? 'msg-user' : 'msg-model');
      
      const header = document.createElement('div');
      header.className = 'msg-header';
      header.innerHTML = '<span class="' + (m.role === 'user' ? 'user-tag' : 'model-tag') + '">' + (m.role === 'user' ? 'User' : 'Antigravity AI') + '</span><span class="time-tag">' + (m.time ? new Date(m.time).toLocaleTimeString() : '') + '</span>';
      
      const body = document.createElement('div');
      body.className = 'content';
      body.innerHTML = marked.parse(m.content);
      
      div.appendChild(header);
      div.appendChild(body);
      container.appendChild(div);
    });
  </script>
</body>
</html>`;

  fs.writeFileSync('chat-history.html', html, 'utf-8');
  console.log('Successfully generated chat-history.html and chat-history.md!');
}

exportChat();
