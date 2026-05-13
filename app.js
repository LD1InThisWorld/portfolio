const MODRINTH_USER = 'LD1InThisWorld';
const GITHUB_USER   = 'LD1InThisWorld';
const CACHE_KEY = 'gh_repo_cache';

try { localStorage.removeItem(CACHE_KEY); } catch {}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'k';
  return n;
}

function makeCard({ href, platform, platformLabel, icon, banner, name, desc, stats, tags }) {
  const bannerHtml = banner
    ? `<div class="proj-banner"><img src="${banner}" alt="${name}" loading="lazy"></div>`
    : `<div class="proj-banner">${icon}</div>`;

  const statsHtml = stats.length
    ? `<div class="proj-stats">${stats.map(s => `<span>${s}</span>`).join('')}</div>`
    : '';

  const tagsHtml = tags.length
    ? `<div class="proj-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
    : '';

  return `
    <a class="proj-card" href="${href}" target="_blank" rel="noopener">
      ${bannerHtml}
      <div class="proj-body">
        <div class="proj-platform ${platform}">${platformLabel}</div>
        <div class="proj-name">${name}</div>
        <div class="proj-desc">${desc || 'Нет описания'}</div>
        ${statsHtml}
        ${tagsHtml}
      </div>
    </a>`;
}

async function loadModrinth() {
  try {
    const res = await fetch(`https://api.modrinth.com/v2/user/${MODRINTH_USER}/projects`);
    if (!res.ok) return [];
    const projects = await res.json();
    if (!projects.length) return [];
    return projects
      .filter(p => p.status === 'approved' || p.status === 'listed' || p.status === 'unlisted' || !p.status)
      .map(p => ({
        date: new Date(p.updated || p.published || 0),
        html: makeCard({
          href: `https://modrinth.com/${p.project_type}/${p.slug}`,
          platform: 'modrinth',
          platformLabel: '<img src="https://cdn.modrinth.com/modrinth-new.png" width="14" height="14" style="border-radius:3px;vertical-align:middle"> Modrinth',
          icon: p.icon_url
            ? `<img src="${p.icon_url}" style="width:72px;height:72px;object-fit:contain;border-radius:12px">`
            : '<img src="https://cdn.modrinth.com/modrinth-new.png" width="56" height="56" style="border-radius:10px;object-fit:contain">',
          banner: (p.gallery && p.gallery.find(g => g.featured)?.url) || null,
          name: p.title,
          desc: p.description,
          stats: currentLang === 'en'
            ? [`⬇️ ${fmt(p.downloads || 0)} downloads`, `❤️ ${fmt(p.followers || 0)} followers`]
            : [`⬇️ ${fmt(p.downloads || 0)} скачиваний`, `❤️ ${fmt(p.followers || 0)} подписчиков`],
          tags: (p.categories || []).slice(0, 3)
        })
      }));
  } catch { return []; }
}

async function loadGitHub() {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=10`);
    if (!res.ok) throw new Error('api_error');
    const repos = await res.json();
    if (!Array.isArray(repos) || !repos.length) throw new Error('empty');
    return repos.map(r => ({
      date: new Date(r.pushed_at || r.updated_at || 0),
      html: makeCard({
        href: r.html_url,
        platform: 'github',
        platformLabel: '<svg width="14" height="14"><use href="#icon-github"/></svg> GitHub',
        icon: '<svg width="40" height="40" style="color:#e8e8f0"><use href="#icon-github"/></svg>',
        banner: null,
        name: r.name,
        desc: r.description || (currentLang === 'en' ? 'No description' : 'Нет описания'),
        stats: currentLang === 'en'
          ? [`⭐ ${fmt(r.stargazers_count)} stars`, `🍴 ${fmt(r.forks_count)} forks`]
          : [`⭐ ${fmt(r.stargazers_count)} звёзд`, `🍴 ${fmt(r.forks_count)} форков`],
        tags: r.language ? [r.language] : []
      })
    }));
  } catch (e) {
    if (e.message === 'empty') return [];
    return [{
      date: new Date(0),
      html: makeCard({
        href: `https://github.com/${GITHUB_USER}`,
        platform: 'github',
        platformLabel: '<svg width="14" height="14"><use href="#icon-github"/></svg> GitHub',
        icon: '<svg width="40" height="40" style="color:#e8e8f0"><use href="#icon-github"/></svg>',
        banner: `https://avatars.githubusercontent.com/${GITHUB_USER}`,
        name: GITHUB_USER,
        desc: currentLang === 'en' ? 'GitHub API temporarily unavailable — click to open profile.' : 'GitHub API временно недоступен — нажми чтобы открыть профиль.',
        stats: [],
        tags: []
      })
    }];
  }
}

async function initProjects() {
  const grid = document.getElementById('projects-grid');
  const [modrinthItems, githubItems] = await Promise.all([loadModrinth(), loadGitHub()]);

  const all = [...modrinthItems, ...githubItems]
    .sort((a, b) => b.date - a.date)
    .slice(0, 3);

  if (!all.length) {
    grid.innerHTML = `<div class="no-projects">Проектов пока нет — следи за обновлениями 👀</div>`;
    return;
  }

  const ordered = all.length === 3
    ? [all[1], all[0], all[2]]
    : all;

  grid.innerHTML = ordered.map(item => item.html).join('');
}

const i18n = {
  ru: {
    'nav.about': 'Обо мне', 'nav.links': 'Ссылки', 'nav.projects': 'Проекты', 'nav.discord': 'Discord',
    'hero.online': 'Онлайн',
    'hero.greeting': 'Привет, я',
    'hero.desc': 'Разработчик игр и модов. В основном нахожусь на GitHub и Itch.io — там можно найти мои работы и следить за обновлениями.',
    'links.title': 'Мои профили', 'links.sub': '/ ссылки',
    'links.github': 'Исходный код проектов, репозитории и открытые контрибуции.',
    'links.modrinth': 'Моды и ресурс паки для Minecraft.',
    'links.itch': 'Мои проекты на itch.io.',
    'links.gamejolt': 'Профиль на GameJolt — игры и сообщество разработчиков.',
    'links.discord': 'Присоединяйся к серверу — общение, вопросы и поддержка.',
    'links.discordSub': 'Виджет ниже ↓',
    'proj.title': 'Проекты', 'proj.sub': '/ live from APIs',
    'proj.allGithub': 'Все репозитории на GitHub',
    'proj.allModrinth': 'Все проекты на Modrinth',
    'discord.title': 'Discord сервер',
    'discord.desc': 'Заходи на сервер, чтобы быть в курсе новых проектов, задавать вопросы и общаться с сообществом.',
    'discord.btn': 'Вступить в сервер',
    'footer': 'сделано с душой',
  },
  en: {
    'nav.about': 'About', 'nav.links': 'Links', 'nav.projects': 'Projects', 'nav.discord': 'Discord',
    'hero.online': 'Online',
    'hero.greeting': "Hey, I'm",
    'hero.desc': 'Game and mod developer. Mostly on GitHub and Itch.io — find my work there and follow for updates.',
    'links.title': 'My profiles', 'links.sub': '/ links',
    'links.github': 'Source code, repositories and open contributions.',
    'links.modrinth': 'Minecraft mods and resource packs.',
    'links.itch': 'My projects on itch.io.',
    'links.gamejolt': 'GameJolt profile — games and developer community.',
    'links.discord': 'Join the server — chat, questions and support.',
    'links.discordSub': 'Widget below ↓',
    'proj.title': 'Projects', 'proj.sub': '/ live from APIs',
    'proj.allGithub': 'All repos on GitHub',
    'proj.allModrinth': 'All projects on Modrinth',
    'discord.title': 'Discord server',
    'discord.desc': 'Join the server to stay up to date with new projects, ask questions and chat with the community.',
    'discord.btn': 'Join server',
    'footer': 'made with soul',
  }
};

let currentLang = localStorage.getItem('lang') || 'en';

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  const sw = document.querySelector('.lang-switch');
  if (sw) sw.classList.toggle('en', lang === 'en');
  const h1 = document.querySelector('h1');
  if (h1) h1.innerHTML = `${i18n[lang]['hero.greeting']} <span class="highlight">LD</span>`;

  const statusEl = document.querySelector('.hero-badge [data-i18n="hero.online"]');
  if (statusEl && statusEl.dataset.statusRu) {
    statusEl.textContent = lang === 'en' ? statusEl.dataset.statusEn : statusEl.dataset.statusRu;
  }

  try { localStorage.removeItem(CACHE_KEY); } catch {}
  initProjects();
  loadDiscordWidget();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

applyLang(currentLang);


const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


const DISCORD_USER_ID = '1405558726907133963';

const STATUS_COLORS = {
  online:    { color: '#1bd96a', label: { ru: 'Онлайн',      en: 'Online'    } },
  idle:      { color: '#f0b232', label: { ru: 'Не активен',  en: 'Idle'      } },
  dnd:       { color: '#f04747', label: { ru: 'Не беспокоить', en: 'Do Not Disturb' } },
  offline:   { color: '#747f8d', label: { ru: 'Оффлайн',     en: 'Offline'   } },
};

async function updateDiscordStatus() {
  const dot  = document.querySelector('.hero-badge .dot');
  const text = document.querySelector('.hero-badge [data-i18n="hero.online"]');
  if (!dot || !text) return;

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    if (!res.ok) throw new Error();
    const { data } = await res.json();
    const status = data.discord_status || 'offline';
    const info = STATUS_COLORS[status] || STATUS_COLORS.offline;

    dot.style.background  = info.color;
    dot.style.boxShadow   = `0 0 6px ${info.color}`;
    text.textContent      = info.label[currentLang] || info.label.ru;
    text.dataset.statusRu = info.label.ru;
    text.dataset.statusEn = info.label.en;

  
    const badge = document.querySelector('.hero-badge');
    if (badge) {
      badge.style.background  = `${info.color}14`;
      badge.style.borderColor = `${info.color}40`;
      badge.style.color       = info.color;
    }
  } catch {
    
  }
}

updateDiscordStatus();
setInterval(updateDiscordStatus, 30000);

const GUILD_ID = '1497134716548284488';

async function loadDiscordWidget() {
  const widget = document.getElementById('discord-widget');
  if (!widget) return;

  try {
    const res = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/widget.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    const members = data.members || [];
    const onlineCount = data.presence_count || 0;

    const onlineText = currentLang === 'en'
      ? `${onlineCount} ${onlineCount === 1 ? 'member' : 'members'} online`
      : `${onlineCount} ${onlineCount === 1 ? 'участник' : 'участников'} онлайн`;
    const membersTitle = currentLang === 'en' ? `ONLINE MEMBERS — ${members.length}` : `УЧАСТНИКИ ОНЛАЙН — ${members.length}`;
    const joinText = currentLang === 'en' ? 'Join the server' : 'Присоединиться к серверу';
    const noMembers = currentLang === 'en' ? 'No members online' : 'Нет участников онлайн';

    const membersHtml = members.slice(0, 5).map(m => {
      const statusColor = m.status === 'online' ? '#1bd96a' : m.status === 'idle' ? '#f0b232' : m.status === 'dnd' ? '#f04747' : '#747f8d';
      return `
        <div class="dw-member">
          <div class="dw-avatar">
            <img src="${m.avatar_url}" alt="${m.username}">
            <div class="dw-status-dot" style="background:${statusColor}"></div>
          </div>
          <span>${m.username}</span>
        </div>`;
    }).join('');

    widget.innerHTML = `
      <div class="dw-header">
        <div class="dw-icon">
          <img src="server-icon.png" alt="${data.name}" onerror="this.parentElement.innerHTML='<span style=font-size:1.4rem;font-weight:700;color:#fff>${data.name.charAt(0).toUpperCase()}</span>'">
        </div>
        <div>
          <div class="dw-name">${data.name}</div>
          <div class="dw-online">${onlineText}</div>
        </div>
      </div>
      <div class="dw-body">
        ${members.length ? `
          <div class="dw-section">${membersTitle}</div>
          <div class="dw-members">${membersHtml}</div>
        ` : `<div style="text-align:center;color:#72767d;padding:20px 0;font-size:0.85rem;">${noMembers}</div>`}
        <a href="${data.instant_invite}" target="_blank" class="dw-join">${joinText}</a>
      </div>
    `;
  } catch {
    const joinText = currentLang === 'en' ? 'Join the server' : 'Присоединиться к серверу';
    widget.innerHTML = `
      <div class="dw-header">
        <div class="dw-icon">💬</div>
        <div>
          <div class="dw-name">Discord</div>
          <div class="dw-online">—</div>
        </div>
      </div>
      <div class="dw-body">
        <a href="https://discord.gg/p4UxR25yAy" target="_blank" class="dw-join">${joinText}</a>
      </div>
    `;
  }
}

loadDiscordWidget();

initProjects();

let golEnabled = localStorage.getItem('gol') !== 'off';

function toggleGol() {
  golEnabled = !golEnabled;
  localStorage.setItem('gol', golEnabled ? 'on' : 'off');
  const btn   = document.getElementById('gol-toggle');
  const left  = document.getElementById('gol-left');
  const right = document.getElementById('gol-right');
  left.style.opacity  = golEnabled ? '0.07' : '0';
  right.style.opacity = golEnabled ? '0.07' : '0';
  if (btn) btn.classList.toggle('active', golEnabled);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('gol-toggle');
  const left  = document.getElementById('gol-left');
  const right = document.getElementById('gol-right');
  if (!golEnabled) {
    if (left)  left.style.opacity  = '0';
    if (right) right.style.opacity = '0';
  }
  if (btn) btn.classList.toggle('active', golEnabled);
});
(function() {
  const CELL = 8;
  const COLOR = '#7c6af7';

  function initGol(canvasId, side) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    function resize() {
      const contentWidth = Math.min(1100, window.innerWidth) + 48;
      const sideWidth = Math.max(0, Math.floor((window.innerWidth - contentWidth) / 2));
      canvas.width  = sideWidth;
      canvas.height = window.innerHeight;
      return sideWidth;
    }

    let w = resize();
    if (w < CELL * 2) return;

    const ctx = canvas.getContext('2d');
    let cols = Math.floor(canvas.width / CELL);
    let rows = Math.floor(canvas.height / CELL);

    function makeGrid() {
      return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Math.random() < 0.3 ? 1 : 0)
      );
    }

    let grid = makeGrid();

    function next(g) {
      return g.map((row, r) => row.map((cell, c) => {
        let n = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = (r + dr + rows) % rows;
            const nc = (c + dc + cols) % cols;
            n += g[nr][nc];
          }
        return (cell === 1) ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      }));
    }

    function draw(g) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLOR;
      g.forEach((row, r) => row.forEach((cell, c) => {
        if (cell) ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }));
    }

    let frame = 0;
    function loop() {
      frame++;
      if (frame % 8 === 0) {
        grid = next(grid);
        draw(grid);
      }
      requestAnimationFrame(loop);
    }

    let painting = false;

    function getCellFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return { c: Math.floor(x / CELL), r: Math.floor(y / CELL) };
    }

    function paint(e) {
      const { c, r } = getCellFromEvent(e);
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = 1;
        draw(grid);
      }
    }

    canvas.addEventListener('mousedown', e => { painting = true; paint(e); });
    canvas.addEventListener('mousemove', e => { if (painting) paint(e); });
    canvas.addEventListener('mouseup',   () => { painting = false; });
    canvas.addEventListener('mouseleave',() => { painting = false; });

    canvas.addEventListener('touchstart', e => { painting = true; paint(e.touches[0]); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { if (painting) paint(e.touches[0]); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend',   () => { painting = false; });

    window.addEventListener('resize', () => {
      w = resize();
      cols = Math.floor(canvas.width / CELL);
      rows = Math.floor(canvas.height / CELL);
      grid = makeGrid();
    });

    loop();
  }

  initGol('gol-left',  'left');
  initGol('gol-right', 'right');
})();

function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

function copyDiscordNick() {
  navigator.clipboard.writeText('ld1inthisworld').then(() => {
    const msg = currentLang === 'en'
      ? ' <strong>ld1inthisworld</strong> copied!'
      : ' <strong>ld1inthisworld</strong> скопирован!';
    showToast(msg);
  }).catch(() => {
    showToast(currentLang === 'en' ? '❌ Failed to copy' : '❌ Не удалось скопировать');
  });
}
