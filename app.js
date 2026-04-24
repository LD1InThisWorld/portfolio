const MODRINTH_USER = 'LD1InThisWorld';
const GITHUB_USER   = 'LD1InThisWorld';

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'k';
  return n;
}

function makeCard({ href, platform, platformLabel, icon, banner, name, desc, stats, tags }) {
  const bannerHtml = banner
    ? `<div class="proj-banner"><img src="${banner}" alt="${name}" loading="lazy" onerror="this.parentElement.innerHTML='${icon}'"></div>`
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
    if (!res.ok) return null;
    const projects = await res.json();
    if (!projects.length) return null;
    projects.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    const p = projects[0];
    return makeCard({
      href: `https://modrinth.com/${p.project_type}/${p.slug}`,
      platform: 'modrinth',
      platformLabel: '<svg width="14" height="14"><use href="#icon-modrinth"/></svg> Modrinth',
      icon: '<svg width="40" height="40" style="color:#1bd96a"><use href="#icon-modrinth"/></svg>',
      banner: p.icon_url || null,
      name: p.title,
      desc: p.description,
      stats: currentLang === 'en'
        ? [`⬇️ ${fmt(p.downloads || 0)} downloads`, `❤️ ${fmt(p.followers || 0)} followers`]
        : [`⬇️ ${fmt(p.downloads || 0)} скачиваний`, `❤️ ${fmt(p.followers || 0)} подписчиков`],
      tags: (p.categories || []).slice(0, 3)
    });
  } catch { return null; }
}

async function loadGitHub() {
const CACHE_KEY = 'gh_repo_cache';
const CACHE_TTL = 5 * 60 * 1000;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL && Array.isArray(data)) return data;
    }
  } catch {}

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=3`);
    if (!res.ok) throw new Error('api_error');
    const repos = await res.json();
    if (!Array.isArray(repos) || !repos.length) throw new Error('empty');

    const cards = repos.map(r => makeCard({
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
    }));

    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: cards })); } catch {}
    return cards;
  } catch (e) {
    if (e.message === 'empty') return [];
    return [makeCard({
      href: `https://github.com/${GITHUB_USER}`,
      platform: 'github',
      platformLabel: '<svg width="14" height="14"><use href="#icon-github"/></svg> GitHub',
      icon: '<svg width="40" height="40" style="color:#e8e8f0"><use href="#icon-github"/></svg>',
      banner: `https://avatars.githubusercontent.com/${GITHUB_USER}`,
      name: GITHUB_USER,
      desc: currentLang === 'en' ? 'GitHub API temporarily unavailable — click to open profile.' : 'GitHub API временно недоступен — нажми чтобы открыть профиль.',
      stats: [],
      tags: []
    })];
  }
}

async function initProjects() {
  const grid = document.getElementById('projects-grid');
  const [modrinth, githubCards] = await Promise.all([loadModrinth(), loadGitHub()]);
  const cards = [];
  if (modrinth) cards.push(modrinth);
  cards.push(...githubCards);
  grid.innerHTML = cards.length
    ? cards.join('')
    : `<div class="no-projects">Проектов пока нет — следи за обновлениями 👀</div>`;
}

// i18n
const i18n = {
  ru: {
    'nav.about': 'Обо мне', 'nav.links': 'Ссылки', 'nav.projects': 'Проекты', 'nav.discord': 'Discord',
    'hero.online': 'Онлайн',
    'hero.greeting': 'Привет, я',
    'hero.desc': 'Разработчик модов и проектов. Нахожусь на Modrinth и GitHub — там можно найти мои работы и следить за обновлениями.',
    'links.title': 'Мои профили', 'links.sub': '/ ссылки',
    'links.github': 'Исходный код проектов, репозитории и открытые контрибуции.',
    'links.modrinth': 'Моды и проекты для Minecraft — всё опубликовано здесь.',
    'links.itch': 'Игры и проекты на itch.io — инди-платформа для разработчиков.',
    'links.gamejolt': 'Профиль на GameJolt — игры и сообщество разработчиков.',
    'links.discord': 'Присоединяйся к серверу — общение, обновления и поддержка.',
    'links.discordSub': 'Виджет ниже ↓',
    'proj.title': 'Проекты', 'proj.sub': '/ live from APIs',
    'discord.title': 'Discord сервер',
    'discord.desc': 'Заходи на сервер, чтобы быть в курсе новых проектов, задавать вопросы и общаться с сообществом.',
    'discord.btn': 'Вступить в сервер',
    'footer': 'сделано с душой',
  },
  en: {
    'nav.about': 'About', 'nav.links': 'Links', 'nav.projects': 'Projects', 'nav.discord': 'Discord',
    'hero.online': 'Online',
    'hero.greeting': "Hey, I'm",
    'hero.desc': 'Mod and project developer. Find my work on Modrinth and GitHub — follow along for updates.',
    'links.title': 'My profiles', 'links.sub': '/ links',
    'links.github': 'Source code, repositories and open contributions.',
    'links.modrinth': 'Minecraft mods and projects — everything is published here.',
    'links.itch': 'Games and projects on itch.io — indie platform for developers.',
    'links.gamejolt': 'GameJolt profile — games and developer community.',
    'links.discord': 'Join the server — chat, updates and support.',
    'links.discordSub': 'Widget below ↓',
    'proj.title': 'Projects', 'proj.sub': '/ live from APIs',
    'discord.title': 'Discord server',
    'discord.desc': 'Join the server to stay up to date with new projects, ask questions and chat with the community.',
    'discord.btn': 'Join server',
    'footer': 'made with soul',
  }
};

let currentLang = localStorage.getItem('lang') || 'ru';

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
  // обновить текст статуса если он уже загружен из Lanyard
  const statusEl = document.querySelector('.hero-badge [data-i18n="hero.online"]');
  if (statusEl && statusEl.dataset.statusRu) {
    statusEl.textContent = lang === 'en' ? statusEl.dataset.statusEn : statusEl.dataset.statusRu;
  }
  // сбросить кэш GitHub и перезагрузить карточки
  try { localStorage.removeItem(CACHE_KEY); } catch {}
  initProjects();
  loadDiscordWidget();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

applyLang(currentLang);

// fade-in on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Discord status via Lanyard
// Вступи в сервер https://discord.gg/lanyard чтобы это работало
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

    // меняем цвет всего badge
    const badge = document.querySelector('.hero-badge');
    if (badge) {
      badge.style.background  = `${info.color}14`;
      badge.style.borderColor = `${info.color}40`;
      badge.style.color       = info.color;
    }
  } catch {
    // если Lanyard недоступен — оставляем дефолт
  }
}

updateDiscordStatus();
setInterval(updateDiscordStatus, 30000); // обновляем каждые 30 сек

// Discord Widget
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
