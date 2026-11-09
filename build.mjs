// Builds the "An Orionbound Spirit" website.
// No downloads or installs are needed. Run it with:  node build.mjs
// It reads everything from the "content" folder and writes the finished site to "_site".

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, '_site');
const TZ = 'Asia/Kolkata'; // dates are shown in this time zone

/* ---------- small helpers ---------- */

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.warn('Could not read ' + file + ': ' + err.message);
    return fallback;
  }
}

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function safeUrl(u) {
  const s = String(u || '').trim();
  if (/^\s*(javascript|data|vbscript):/i.test(s)) return '#';
  return esc(s);
}

const slug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const fmtDate = (d) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(d);

/* ---------- a small, safe Markdown converter ---------- */

function inline(text) {
  let t = esc(text);
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => '<img src="' + safeUrl(src) + '" alt="' + alt + '" loading="lazy">');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => '<a href="' + safeUrl(href) + '">' + label + '</a>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
  return t;
}

function md(src) {
  const lines = String(src == null ? '' : src).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const blockStart = /^(#{1,4}\s|>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+|-{3,}\s*$|\*{3,}\s*$)/;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    let m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      const n = m[1].length + 1; // the page title is the only h1
      out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>');
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push('<blockquote>' + md(buf.join('\n')) + '</blockquote>');
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      out.push('<ul>' + items.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>');
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
        i++;
      }
      out.push('<ol>' + items.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ol>');
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !blockStart.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    if (!buf.length) {
      i++;
      continue;
    }
    out.push('<p>' + buf.map(inline).join('<br>\n') + '</p>');
  }
  return out.join('\n');
}

function plainText(markdown) {
  return String(markdown || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(post, max) {
  const firstBlock = String(post.body || '').split(/\n\s*\n/).find((b) => plainText(b)) || '';
  const t = plainText(firstBlock);
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, '') + '...';
}

/* ---------- load the content ---------- */

const site = readJson(path.join(ROOT, 'content', 'site.json'), {});
const about = readJson(path.join(ROOT, 'content', 'about.json'), {});
site.look = site.look || {};
site.intro = site.intro || {};
site.signup = site.signup || {};
site.comments = site.comments || {};
site.social = site.social || {};
site.footer = site.footer || {};
site.featured = site.featured || {};
site.recent = site.recent || {};
site.reader = site.reader || {};

const postsDir = path.join(ROOT, 'content', 'posts');
const posts = (fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : [])
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const raw = readJson(path.join(postsDir, f), null);
    if (!raw || !raw.title) return null;
    const name = f.replace(/\.json$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const date = raw.date ? new Date(raw.date) : new Date(0);
    return {
      slug: name,
      url: '/posts/' + name + '/',
      title: raw.title,
      date: isNaN(date.getTime()) ? new Date(0) : date,
      tags: Array.isArray(raw.tags) ? raw.tags : raw.tags ? [raw.tags] : [],
      photo: raw.photo || '',
      photoAlt: raw.photoAlt || '',
      photoFocus: /^\d{1,3}% \d{1,3}%$/.test(raw.photoFocus || '') ? raw.photoFocus : '50% 50%',
      caption: raw.caption || '',
      body: raw.body || '',
      question: raw.question || '',
      comments: raw.comments !== false,
      draft: raw.draft === true
    };
  })
  .filter((p) => p && !p.draft)
  .sort((a, b) => b.date - a.date);

/* ---------- look and feel ---------- */

const FONTS = {
  Jost: { stack: "'Jost',system-ui,sans-serif", query: 'family=Jost:ital,wght@0,400;0,500;0,600;1,400' },
  'Cormorant Garamond': { stack: "'Cormorant Garamond',Georgia,serif", query: 'family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500' },
  Lora: { stack: "'Lora',Georgia,serif", query: 'family=Lora:ital,wght@0,500;1,500' },
  Spectral: { stack: "'Spectral',Georgia,serif", query: 'family=Spectral:ital,wght@0,500;1,400' }
};
const font = FONTS[site.look.headingFont] || FONTS.Jost;
const accent = /^#[0-9a-fA-F]{3,8}$/.test(site.look.accent || '') ? site.look.accent : '#F2C879';
const bgName = site.look.background === 'purple' ? 'purple' : 'navy';
const themeColor = bgName === 'purple' ? '#1A0B33' : '#0B1020';
const baseUrl = String(site.siteUrl || '').replace(/\/+$/, '');
const abs = (p) => (!p ? '' : /^https?:/i.test(p) ? p : baseUrl ? baseUrl + p : p);
const appIcon = site.appIcon || '/icons/icon-512.png';

/* ---------- reusable pieces ---------- */

const hasGiscus = !!(site.comments.giscusRepo && site.comments.giscusRepoId && site.comments.giscusCategoryId);
const hasCommentForm = !!site.comments.formAction;
const commentsOn = hasGiscus || hasCommentForm;
const signupOn = !!site.signup.formAction;

const tagLabel = (tag) => {
  const m = (site.menu || []).find((x) => x && x.kind === 'tag' && x.tag === tag);
  return m && m.label ? m.label : tag;
};

const tagPills = (p) =>
  p.tags.map((t) => '<a class="tag" href="/tag/' + slug(t) + '/">' + esc(t) + '</a>').join('');

function menuItems() {
  return (site.menu || [])
    .filter((m) => m && m.enabled !== false && m.label)
    .map((m) => {
      if (m.kind === 'tag') {
        if (!m.tag || !posts.some((p) => p.tags.includes(m.tag))) return null; // hidden until there is a post
        return { label: m.label, href: '/tag/' + slug(m.tag) + '/' };
      }
      if (m.url) return { label: m.label, href: m.url };
      return null;
    })
    .filter(Boolean);
}

function imgTag(src, alt, cls, extra) {
  if (!src) return '';
  return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + safeUrl(src) + '" alt="' + esc(alt || '') + '"' + (extra || '') + '>';
}

function signupBlock() {
  const s = site.signup;
  return (
    '<section class="signup" id="subscribe">' +
    '<h2>' + esc(s.heading || 'Follow the journey') + '</h2>' +
    (s.text ? '<p>' + esc(s.text) + '</p>' : '') +
    '<form action="' + safeUrl(s.formAction) + '" method="post" target="_blank">' +
    '<label class="sr-only" for="signup-email">Email address</label>' +
    '<input id="signup-email" type="email" name="' + esc(s.emailField || 'email') + '" placeholder="you@example.com" required>' +
    '<button class="btn btn-accent" type="submit">' + esc(s.button || 'Subscribe') + '</button>' +
    '</form></section>'
  );
}

function commentsEmbed(post) {
  const c = site.comments;
  const note = c.note ? '<p class="note">' + esc(c.note) + '</p>' : '';
  if (hasGiscus) {
    return (
      '<script src="https://giscus.app/client.js" data-repo="' + esc(c.giscusRepo) + '" data-repo-id="' + esc(c.giscusRepoId) +
      '" data-category="' + esc(c.giscusCategory || 'Announcements') + '" data-category-id="' + esc(c.giscusCategoryId) +
      '" data-mapping="pathname" data-strict="0" data-reactions-enabled="1" data-emit-metadata="0" data-input-position="top"' +
      ' data-theme="dark" data-lang="en" crossorigin="anonymous" async></script>' + note
    );
  }
  return (
    '<form class="comment-form" action="' + safeUrl(c.formAction) + '" method="post">' +
    '<input type="hidden" name="_subject" value="Thoughts on: ' + esc(post.title) + '">' +
    '<input type="hidden" name="post" value="' + esc(post.url) + '">' +
    '<input class="hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<label class="field"><span>Your name (optional)</span><input type="text" name="name" autocomplete="name"></label>' +
    '<label class="field"><span>Your thoughts</span><textarea name="message" rows="4" required></textarea></label>' +
    '<button class="btn btn-accent" type="submit">' + esc(c.button || 'Share your thoughts') + '</button>' +
    '</form>' + note
  );
}

/* ---------- home page sections ---------- */

function sectionIntro() {
  const i = site.intro;
  const latest = posts[0];
  const showSignupBtn = signupOn && (site.sections || []).some((s) => s.type === 'signup' && s.enabled !== false);
  return (
    '<section class="hero"><div class="hero-text">' +
    (i.eyebrow ? '<div class="eyebrow">' + esc(i.eyebrow) + '</div>' : '') +
    '<h1>' + esc(i.heading || site.title) + '</h1>' +
    (i.text ? '<p class="lead">' + esc(i.text) + '</p>' : '') +
    '<div class="btn-row">' +
    (latest && i.primaryButton ? '<a class="btn btn-accent" href="' + latest.url + '">' + esc(i.primaryButton) + '</a>' : '') +
    (showSignupBtn && i.secondaryButton ? '<a class="btn btn-ghost" href="#subscribe">' + esc(i.secondaryButton) + '</a>' : '') +
    '</div></div>' +
    (i.image ? '<div class="hero-art">' + imgTag(i.image, 'Logo of ' + site.title, 'hero-logo') + '</div>' : '') +
    '</section>'
  );
}

function sectionFeatured() {
  const p = posts[0];
  if (!p) return '';
  return (
    '<section class="feature" id="latest">' +
    (p.photo
      ? '<div class="feature-photo">' + imgTag(p.photo, p.photoAlt, '', ' style="object-position:' + p.photoFocus + '"') +
        (p.caption ? '<div class="feature-caption">' + esc(p.caption) + '</div>' : '') + '</div>'
      : '') +
    '<div class="feature-text"><div class="tags">' + tagPills(p) + '</div>' +
    '<h2><a href="' + p.url + '">' + esc(p.title) + '</a></h2>' +
    '<p>' + esc(excerpt(p, 330)) + '</p>' +
    '<a class="more" href="' + p.url + '">' + esc(site.featured.readMore || 'Read the full post') + '</a></div>' +
    '</section>'
  );
}

function tile(p) {
  return (
    '<article class="tile">' +
    (p.photo ? '<a class="tile-photo" href="' + p.url + '" tabindex="-1" aria-hidden="true">' + imgTag(p.photo, '', '', ' loading="lazy" style="object-position:' + p.photoFocus + '"') + '</a>' : '') +
    '<div class="tile-body"><div class="tags">' + tagPills(p) + '</div>' +
    '<h3><a href="' + p.url + '">' + esc(p.title) + '</a></h3>' +
    '<p>' + esc(excerpt(p, 150)) + '</p>' +
    '<div class="meta">' + fmtDate(p.date) + '</div></div></article>'
  );
}

function sectionRecent() {
  if (posts.length < 2) return ''; // hides itself until there are 2 posts
  return (
    '<section class="recent"><h2>' + esc(site.recent.heading || 'Recent entries') + '</h2>' +
    '<div class="tiles">' + posts.slice(1, 7).map(tile).join('') + '</div>' +
    (posts.length > 7 ? '<a class="more" href="/posts/">' + esc(site.recent.allPosts || 'All posts') + '</a>' : '') +
    '</section>'
  );
}

function sectionReader() {
  const p = posts[0];
  if (!p || !commentsOn || !p.comments) return '';
  return (
    '<section class="reader"><div><h2>' + esc(site.reader.heading || 'What did this make you feel?') + '</h2>' +
    (p.question ? '<p>' + esc(p.question) + '</p>' : '') + '</div>' +
    '<a class="btn btn-accent" href="' + p.url + '#comments">' + esc(site.reader.button || 'Share your thoughts') + '</a></section>'
  );
}

function sectionSignup() {
  return signupOn ? signupBlock() : '';
}

function sectionText(s) {
  return '<section class="block">' + (s.heading ? '<h2>' + esc(s.heading) + '</h2>' : '') + '<div class="prose-inline">' + md(s.body) + '</div></section>';
}

function sectionPhoto(s) {
  if (!s.image) return '';
  return '<figure class="block photo-block">' + imgTag(s.image, s.alt, '') + (s.caption ? '<figcaption>' + esc(s.caption) + '</figcaption>' : '') + '</figure>';
}

function sectionQuote(s) {
  if (!s.text) return '';
  return '<section class="block quote-block"><blockquote>' + esc(s.text) + '</blockquote>' + (s.by ? '<cite>' + esc(s.by) + '</cite>' : '') + '</section>';
}

const SECTIONS = {
  intro: sectionIntro,
  featured: sectionFeatured,
  recent: sectionRecent,
  reader: sectionReader,
  signup: sectionSignup,
  text: sectionText,
  photo: sectionPhoto,
  quote: sectionQuote
};

/* ---------- page shell ---------- */

function layout(opts) {
  const { title, description, urlPath, image, body, type, noindex } = opts;
  const fullTitle = title && urlPath !== '/' ? title + ' · ' + site.title : site.title;
  const desc = description || site.description || '';
  const shareImg = abs(image || site.shareImage || site.logo);
  const canonical = baseUrl ? baseUrl + urlPath : '';
  const nav = menuItems()
    .map((m) => '<a href="' + safeUrl(m.href) + '"' + (m.href === urlPath ? ' aria-current="page"' : '') + '>' + esc(m.label) + '</a>')
    .join('');
  const social = [
    ['Instagram', site.social.instagram],
    ['YouTube', site.social.youtube],
    ['Facebook', site.social.facebook]
  ]
    .filter((x) => x[1])
    .map((x) => '<a href="' + safeUrl(x[1]) + '" rel="noopener">' + x[0] + '</a>')
    .join('');
  return (
    '<!doctype html>\n<html lang="en" data-bg="' + bgName + '">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(fullTitle) + '</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    (noindex ? '<meta name="robots" content="noindex">\n' : '') +
    (canonical ? '<link rel="canonical" href="' + esc(canonical) + '">\n' : '') +
    '<meta property="og:site_name" content="' + esc(site.title) + '">\n' +
    '<meta property="og:title" content="' + esc(fullTitle) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:type" content="' + (type || 'website') + '">\n' +
    (canonical ? '<meta property="og:url" content="' + esc(canonical) + '">\n' : '') +
    (shareImg ? '<meta property="og:image" content="' + esc(shareImg) + '">\n<meta name="twitter:card" content="summary_large_image">\n' : '') +
    '<meta name="theme-color" content="' + themeColor + '">\n' +
    '<link rel="manifest" href="/manifest.webmanifest">\n' +
    '<link rel="icon" href="' + safeUrl(appIcon) + '">\n' +
    '<link rel="apple-touch-icon" href="' + safeUrl(appIcon) + '">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + font.query + '&amp;family=Inter:wght@400;500;600&amp;display=swap">\n' +
    '<link rel="stylesheet" href="/css/style.css">\n' +
    '<style>:root{--accent:' + accent + ';--font-head:' + font.stack + ';}</style>\n' +
    '</head>\n<body>\n<a class="skip" href="#main">Skip to the content</a>\n' +
    '<div class="wrap">\n<header class="site-header">' +
    '<a class="brand" href="/"><svg aria-hidden="true" width="40" height="28" viewBox="0 0 40 28"><circle cx="6" cy="22" r="2.5"></circle><circle cx="20" cy="14" r="2.5"></circle><circle cx="34" cy="6" r="2.5"></circle></svg><span>' + esc(site.title) + '</span></a>' +
    (nav ? '<nav aria-label="Main">' + nav + '</nav>' : '') +
    '</header>\n<main id="main">\n' + body + '\n</main>\n' +
    '<footer class="site-footer"><div>' + esc(site.footer.name || site.title) + '</div><div class="footer-links">' + social +
    (site.social.handle ? '<span>' + esc(site.social.handle) + '</span>' : '') + '</div></footer>\n</div>\n' +
    '<script src="/js/site.js" defer></script>\n</body>\n</html>\n'
  );
}

/* ---------- pages ---------- */

function homePage() {
  const body = (site.sections || [])
    .filter((s) => s && s.enabled !== false && SECTIONS[s.type])
    .map((s) => SECTIONS[s.type](s))
    .join('\n');
  return layout({ title: '', urlPath: '/', body });
}

function postPage(p) {
  const mins = Math.max(1, Math.round(plainText(p.body).split(' ').length / 200));
  const showComments = commentsOn && p.comments;
  const heading = p.question || site.reader.heading || 'What do you think?';
  let discussion = '';
  if (showComments) {
    discussion = '<section class="discussion" id="comments"><h2>' + esc(heading) + '</h2>' + commentsEmbed(p) + '</section>';
  } else if (p.question) {
    discussion = '<section class="discussion"><h2>' + esc(p.question) + '</h2></section>';
  }
  const body =
    '<article class="post">' +
    '<div class="post-head"><a class="back" href="/posts/">← All posts</a>' +
    '<div class="tags">' + tagPills(p) + '</div>' +
    '<h1>' + esc(p.title) + '</h1>' +
    '<div class="meta"><time datetime="' + p.date.toISOString() + '">' + fmtDate(p.date) + '</time> · ' + mins + ' min read</div></div>' +
    (p.photo
      ? '<figure class="post-figure">' + imgTag(p.photo, p.photoAlt, '', ' style="object-position:' + p.photoFocus + '"') +
        (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>'
      : '') +
    '<div class="prose">' + md(p.body) + '</div>' +
    discussion +
    '<section class="share" data-share hidden data-title="' + esc(p.title) + '"><span>Share this post</span>' +
    '<a href="#" data-share-whatsapp>WhatsApp</a><a href="#" data-share-facebook>Facebook</a>' +
    '<button type="button" data-copy>Copy link</button></section>' +
    '</article>' +
    (signupOn ? signupBlock() : '');
  return layout({
    title: p.title,
    description: excerpt(p, 200),
    urlPath: p.url,
    image: p.photo,
    type: 'article',
    body
  });
}

function listPage(heading, urlPath, list, emptyText) {
  const body =
    '<section class="listing"><h1>' + esc(heading) + '</h1>' +
    (list.length ? '<div class="tiles">' + list.map(tile).join('') + '</div>' : '<p class="empty">' + esc(emptyText) + '</p>') +
    '</section>';
  return layout({ title: heading, urlPath, body });
}

function aboutPage() {
  const body =
    '<section class="about"><div class="about-text"><h1>' + esc(about.heading || 'About') + '</h1>' +
    (about.text ? '<p class="about-lead">' + esc(about.text) + '</p>' : '') +
    (about.more ? '<div class="prose-inline">' + md(about.more) + '</div>' : '') + '</div>' +
    (about.image ? '<div class="about-art">' + imgTag(about.image, 'Logo of ' + site.title, 'hero-logo') + '</div>' : '') +
    '</section>';
  return layout({ title: about.heading || 'About', urlPath: '/about/', body });
}

function notFoundPage() {
  const body = '<section class="listing"><h1>Page not found</h1><p class="empty">This page does not exist. <a class="more" href="/">Go to the home page</a></p></section>';
  return layout({ title: 'Page not found', urlPath: '/404.html', body, noindex: true });
}

/* ---------- write everything ---------- */

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function copyDir(from, to) {
  if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(ROOT, 'public'), OUT);
copyDir(path.join(ROOT, 'images'), path.join(OUT, 'images'));
copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));

write('index.html', homePage());
write('about/index.html', aboutPage());
write('posts/index.html', listPage('All posts', '/posts/', posts, 'No posts yet.'));
posts.forEach((p) => write('posts/' + p.slug + '/index.html', postPage(p)));

const tagNames = Array.from(new Set(['Thought', 'Photo', 'Moment', 'Dream Story'].concat(posts.flatMap((p) => p.tags))));
tagNames.forEach((t) => {
  const list = posts.filter((p) => p.tags.includes(t));
  write('tag/' + slug(t) + '/index.html', listPage(tagLabel(t), '/tag/' + slug(t) + '/', list, 'No posts here yet.'));
});

write('404.html', notFoundPage());
write('.nojekyll', '');

write(
  'manifest.webmanifest',
  JSON.stringify(
    {
      name: site.title,
      short_name: site.shortName || site.title,
      description: site.description || '',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: themeColor,
      theme_color: themeColor,
      icons: [
        { src: appIcon, sizes: '192x192', type: appIcon.endsWith('.png') ? 'image/png' : 'image/jpeg' },
        { src: appIcon, sizes: '512x512', type: appIcon.endsWith('.png') ? 'image/png' : 'image/jpeg' }
      ]
    },
    null,
    2
  )
);

write('robots.txt', 'User-agent: *\nDisallow: /admin/\n' + (baseUrl ? 'Sitemap: ' + baseUrl + '/sitemap.xml\n' : ''));
if (baseUrl) {
  const urls = ['/', '/about/', '/posts/'].concat(posts.map((p) => p.url));
  write(
    'sitemap.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((u) => '<url><loc>' + esc(baseUrl + u) + '</loc></url>').join('\n') +
      '\n</urlset>\n'
  );
}

console.log('Built ' + posts.length + ' post(s) into ' + OUT);
