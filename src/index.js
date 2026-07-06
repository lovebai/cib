let IconApiUrl;
export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname;
		const csvUrl = 'https://raw.githubusercontent.com/timqian/chinese-independent-blogs/master/blogs-original.csv';
		const FaviconAPIUrl = 'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=';
		IconApiUrl = env.ICON_API_URL || '/getFavicon?url=';

		const res = await fetch(csvUrl);
		const csvText = await res.text();

		const blogs = parseCSV(csvText);

		if (path === '/') {
			return new Response(renderHomePage(blogs), {
				headers: { 'content-type': 'text/html;charset=utf-8' },
			});
		} else if (path === '/tags') {
			return new Response(renderTagsPage(blogs), {
				headers: { 'content-type': 'text/html;charset=utf-8' },
			});
		} else if (path === '/all') {
			return new Response(renderAllPage(blogs), {
				headers: { 'content-type': 'text/html;charset=utf-8' },
			});
		} else if (path === '/getFavicon') {
			const targetUrl = url.searchParams.get('url');
			console.log(`Fetching favicon for URL: ${url}`);

			if (!targetUrl) {
				return new Response("Missing 'url' query parameter", { status: 400 });
			}
			try {
				// 发起反代请求
				const response = await fetch(FaviconAPIUrl + encodeURIComponent(targetUrl), {
					headers: {
						'User-Agent':
							request.headers.get('User-Agent') ||
							'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
					},
				});

				if (!response.ok) {
					return new Response(`Error fetching favicon: ${response.statusText}`, { status: response.status });
				}

				return new Response(response.body, {
					status: response.status,
					headers: {
						'Content-Type': response.headers.get('Content-Type') || 'image/x-icon',
						'Cache-Control': 'public, max-age=1296000', // 缓存 15 天
					},
				});
			} catch (error) {
				return new Response(`Error: ${error.message}`, { status: 500 });
			}
		} else {
			return new Response(renderNoPage(), {
				headers: { 'content-type': 'text/html;charset=utf-8' },
			});
		}
	},
};

function parseCSV(text) {
	const lines = text.trim().split('\n').slice(1);
	return lines.map((line) => {
		const parts = [];
		let current = '',
			inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"') inQuotes = !inQuotes;
			else if (ch === ',' && !inQuotes) {
				parts.push(current.trim().replace(/^"|"$/g, ''));
				current = '';
				continue;
			}
			current += ch;
		}
		parts.push(current.trim().replace(/^"|"$/g, ''));

		const tags = parts[3]
			? parts[3]
					.split(/;|、|，|,/)
					.map((t) => t.trim())
					.filter(Boolean)
			: [];
		return {
			name: parts[0] || '',
			url: parts[1] || '',
			rss: parts[2] || '',
			tags,
		};
	});
}

const icon = `
  <svg t="1754746698818" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12334" width="64" height="64">
  <path d="M537.472 854.272c0 10.624-10.304 41.728-54.464 41.728-41.792 0-56.192-24.512-56.192-41.728v-187.264H235.968C162.368 667.008 128 642.496 128 559.04v-191.36c0-84.288 35.2-107.2 107.968-107.2h190.848V168.96c0-12.288 12.032-40.896 52.928-40.896 33.472 0 57.728 11.456 57.728 40.896V260.48h192.512c74.432 0 108.032 24.576 108.032 107.136v191.36c0 81.024-32 108.032-108.032 108.032H537.472v187.264z m-115.2-496.64h-152.96c-23.68 0-35.584 11.136-35.584 35.584v136.128c0 23.04 10.432 35.648 35.584 35.648h152.896v-207.36zM539.648 567.04h156.544c25.536 0 36.16-13.44 36.16-36.16V392.832c0-25.6-13.44-36.16-36.16-36.16H539.712V567.04z" fill="#0061D5" p-id="12335"></path>
  </svg>
  `;

const fallbackSvg = `
	<svg t="1754760422860" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7179" width="64" height="64">
	<path d="M512 0c282.760533 0 512 229.239467 512 512 0 282.760533-229.239467 512-512 512-282.760533 0-512-229.239467-512-512C0 229.239467 229.239467 0 512 0z m0 648.533333a68.266667 68.266667 0 1 0 0 136.533334 68.266667 68.266667 0 0 0 0-136.533334z m0-68.266666a68.266667 68.266667 0 0 0 68.266667-68.266667V307.2a68.266667 68.266667 0 1 0-136.533334 0v204.8a68.266667 68.266667 0 0 0 68.266667 68.266667z" fill="#FF7F7F" p-id="7180"></path>
	</svg>
  `;
function utf8ToBase64(str) {
	return btoa(unescape(encodeURIComponent(str)));
}
const fallbackFavicon = `data:image/svg+xml;base64,${utf8ToBase64(fallbackSvg)}`;

function renderSiteCard(site) {
	const tagsHtml = site.tags
		.map(
			(t) =>
				`<span class="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-medium mr-1.5 mb-1 select-none">${t}</span>`,
		)
		.join('');
	const rssBtn = site.rss
		? `<div onclick="copyRSS(event,'${site.rss}')"
	 class="ml-auto shrink-0 text-xs rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
	 <svg t="1754784222350" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17354" width="20" height="20">
	 <path d="M544.059897 959.266898h-64.949141c-228.633593 0-415.697442-187.063849-415.697442-415.697442v-64.949141c0-228.633593 187.063849-415.697442 415.697442-415.697442h64.949141c228.633593 0 415.697442 187.063849 415.697442 415.697442v64.949141C959.756315 772.203049 772.692466 959.266898 544.059897 959.266898z" fill="#FD9B00" p-id="17355"></path><path d="M638.254276 718.937463c0-186.152591-151.296463-337.64564-337.178748-337.64564v-80.094453c230.17966 0 417.439071 187.459069 417.43907 417.739069H638.254276zM576.586686 718.937463h-80.368854c0-52.377878-20.342554-101.550994-57.208569-138.422129-36.882397-36.960212-85.890668-57.311981-138.048411-57.311981v-80.070904C452.934103 443.132449 576.586686 566.766602 576.586686 718.937463zM356.501512 607.516214c30.775945 0 55.629737 25.013518 55.629737 55.528373 0 30.607004-24.853792 55.351241-55.629737 55.351241-30.667413 0-55.583663-24.743213-55.583663-55.351241C300.917849 632.529733 325.834099 607.516214 356.501512 607.516214z" fill="#FFFFFF" p-id="17356">
	 </path></svg></div>`
		: '';
	return `
	  <a href="${site.url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="card flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 cursor-pointer no-underline">
		<img src="${IconApiUrl + encodeURIComponent(site.url)}" alt="" class="w-9 h-9 rounded-lg shrink-0" onerror="this.onerror=null;this.src='${fallbackFavicon}';" />
		<div class="flex-grow min-w-0">
		  <div class="text-gray-900 dark:text-gray-100 font-semibold truncate">${site.name}</div>
		  <div class="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">${tagsHtml}</div>
		</div>
		${rssBtn}
	  </a>
	`;
}

function renderNavbar() {
	return `
	<nav class="sticky top-0 z-50 flex items-center gap-5 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors custom-font">
	  <a href="/" class="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline">首页</a>
	  <a href="/all" class="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline">全部</a>
	  <a href="/tags" class="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline">分类</a>
	  <a href="https://github.com/timqian/chinese-independent-blogs" target="_blank" rel="noopener noreferrer" class="ml-auto text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 no-underline">提交博客</a>
	  <button id="themeToggle" class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm">🌙</button>
	</nav>`;
}

function renderPagePublic() {
	return `<button id="toTopBtn" title="回到顶部" aria-label="回到顶部" style="display:none;">↑</button>
	<script>
		tailwind.config = {darkMode: 'class'};
		function copyRSS(event,rss) {
		event.preventDefault();
        navigator.clipboard.writeText(rss).then(() => {
          const tip = document.createElement("div");
          tip.className = "toast";
          tip.textContent = "RSS地址已复制";
          document.body.appendChild(tip);
          setTimeout(() => tip.remove(), 1500);
        });
      }
		document.addEventListener("DOMContentLoaded", () => {
		const themeToggle = document.getElementById("themeToggle");
		const root = document.documentElement;

		const savedTheme = localStorage.getItem("theme");
		if (savedTheme) {
			root.classList.toggle("dark", savedTheme === "dark");
		} else {
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			root.classList.add("dark");
			}
		}

		themeToggle.textContent = root.classList.contains("dark") ? "☀️" : "🌙";

		themeToggle.addEventListener("click", () => {
			root.classList.toggle("dark");
			const isDark = root.classList.contains("dark");
			localStorage.setItem("theme", isDark ? "dark" : "light");
			themeToggle.textContent = isDark ? "☀️" : "🌙";
		});
		});
		</script>
		<footer class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors">
		<div class="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400 transition-colors text-sm">
		<p>本站数据来自Github开源项目 <a href="https://github.com/timqian/chinese-independent-blogs" target="_blank" 
		rel="noopener noreferrer" tabindex="0" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors no-underline">timqian/chinese-independent-blogs</a></p></div></footer>`;
}

function renderPagePublicCss() {
	return `<style>
		body {
		  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
		  color: #1e293b;
		  min-height: 100vh;
		  display: flex;
		  flex-direction: column;
		  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
		  transition: background 0.3s, color 0.3s;
		}
		.dark body {
		  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
		}
		.card {
		  text-decoration: none;
		  transition: all 0.2s ease;
		}
		.card:hover {
		  transform: translateY(-2px);
		  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.12);
		  border-color: #3b82f6;
		  outline: none;
		}
		.card:focus-within {
		  transform: translateY(-2px);
		  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.12);
		  border-color: #3b82f6;
		  outline: none;
		}
		#toTopBtn {
		  position: fixed;
		  right: 20px;
		  bottom: 30px;
		  background-color: #3b82f6;
		  color: white;
		  border: none;
		  border-radius: 50%;
		  width: 48px;
		  height: 48px;
		  font-size: 24px;
		  cursor: pointer;
		  box-shadow: 0 4px 12px rgba(59,130,246,0.4);
		  transition: all 0.2s ease;
		  z-index: 9999;
		}
		#toTopBtn:hover {
		  background-color: #2563eb;
		  transform: translateY(-2px);
		  box-shadow: 0 6px 16px rgba(59,130,246,0.5);
		}
		.toast {
		  position: fixed;
		  bottom: 50px;
		  right: 20px;
		  background: #3b82f6;
		  color: #fff;
		  padding: 10px 20px;
		  border-radius: 8px;
		  font-size: 14px;
		  z-index: 9999;
		  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		  animation: toastIn 0.3s ease;
		}
		@keyframes toastIn {
		  from { opacity: 0; transform: translateY(10px); }
		  to { opacity: 1; transform: translateY(0); }
		}
		::-webkit-scrollbar { width: 8px; }
		::-webkit-scrollbar-track { background: transparent; }
		::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
		::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
		@media (max-width: 767px) {
		  .custom-font { white-space: nowrap; }
		  .custom-font button { padding: .1rem .4rem; }
		}
	  </style>`;
}

function renderNoPage() {
	return `
	<!DOCTYPE html>
	<html lang="zh-CN" class="scroll-smooth">
	<head>
	  <meta charset="utf-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1" />
	  <meta name="description" content="404 - 页面未找到">
	  <meta name="keywords" content="独立博客, 中文博客, 博客导航, 博客列表, 独立网站, 网站导航">
	  <meta name="author" content="酷酷的白">
	  <meta property="og:title" content="404 - 中文独立博客列表">
	  <meta property="og:description" content="一个收集和展示中文独立博客的网站，提供搜索和分类功能，帮助用户发现有趣的独立博客。">
	  <meta property="og:image" content="https://i.051214.xyz/i/2025/08/09/215040.webp">
	  <link rel="icon" href="data:image/svg+xml;base64,${utf8ToBase64(icon)}" />
	  <title>404 - 中文独立博客列表</title>
	  <script src="https://cdn.tailwindcss.com"></script>
	  ${renderPagePublicCss()}
	</head>
	<body class="text-gray-900 dark:text-gray-100">
	  ${renderNavbar()}
	  <main class="flex-grow container mx-auto px-4 flex flex-col items-center justify-center py-20 min-h-[calc(100vh-64px)]">
		<div class="flex flex-col items-center gap-6 text-center">
		  <div class="opacity-60">${fallbackSvg}</div>
		  <h1 class="text-6xl font-bold text-gray-300 dark:text-gray-600 select-none">404</h1>
		  <p class="text-xl text-gray-500 dark:text-gray-400">页面不存在</p>
		  <a href="/" class="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors no-underline">返回首页</a>
		</div>
	  </main>

	  ${renderPagePublic()}

	</body>
	</html>
	`;
}

function renderHomePage(blogs) {
	const randomSites = blogs.sort(() => 0.5 - Math.random()).slice(0, 24);
	return `
	<!DOCTYPE html>
	<html lang="zh-CN" class="scroll-smooth">
	<head>
	  <meta charset="utf-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1" />
	  <meta name="description" content="一个收集和展示中文独立博客的网站，提供搜索和分类功能，帮助用户发现有趣的独立博客。">
	  <meta name="keywords" content="独立博客, 中文博客, 博客导航, 博客列表, 独立网站, 网站导航">
	  <meta name="author" content="酷酷的白">
	  <meta property="og:title" content="中文独立博客列表">
	  <meta property="og:description" content="一个收集和展示中文独立博客的网站，提供搜索和分类功能，帮助用户发现有趣的独立博客。">
	  <meta property="og:image" content="https://i.051214.xyz/i/2025/08/09/215040.webp">
	  <link rel="icon" href="data:image/svg+xml;base64,${utf8ToBase64(icon)}" />
	  <title>中文独立博客列表</title>
	  <script src="https://cdn.tailwindcss.com"></script>
	  ${renderPagePublicCss()}
	</head>
	<body class="text-gray-900 dark:text-gray-100">
	  ${renderNavbar()}
	  <main class="flex-grow container mx-auto px-4 py-16 max-w-6xl">
		<div class="text-center mb-12">
		  <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">中文独立博客列表</h1>
		  <p class="text-gray-500 dark:text-gray-400">发现和探索中文独立博客</p>
		</div>
		<div class="w-full max-w-xl mx-auto mb-10">
		  <input id="searchInput" type="search" placeholder="搜索网站名称或标签…" aria-label="搜索网站"
			class="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3.5 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 outline-none" autocomplete="off" />
		</div>
		<section id="results" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
		  ${randomSites.map(renderSiteCard).join('\n')}
		</section>
	  </main>
  
	  ${renderPagePublic()}
  
	  <script>
		document.addEventListener("DOMContentLoaded", () => {
		  const input = document.getElementById("searchInput");
		  const results = document.getElementById("results");
		  const allSites = ${JSON.stringify(blogs)};
		  const toTopBtn = document.getElementById("toTopBtn");
  
		  function renderSiteCard(site) {
		    const IconApiUrl = "${IconApiUrl}";
			const tagsHtml = site.tags.map(t => 
			  \`<span class="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-medium mr-1.5 mb-1 select-none">\${t}</span>\`
			).join("");
			const rssBtn = site.rss ? \`<div onclick="copyRSS(event,'\${site.rss}')"
			class="ml-auto shrink-0 text-xs rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
			<svg t="1754784222350" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17354" width="20" height="20">
			<path d="M544.059897 959.266898h-64.949141c-228.633593 0-415.697442-187.063849-415.697442-415.697442v-64.949141c0-228.633593 187.063849-415.697442 415.697442-415.697442h64.949141c228.633593 0 415.697442 187.063849 415.697442 415.697442v64.949141C959.756315 772.203049 772.692466 959.266898 544.059897 959.266898z" fill="#FD9B00" p-id="17355"></path><path d="M638.254276 718.937463c0-186.152591-151.296463-337.64564-337.178748-337.64564v-80.094453c230.17966 0 417.439071 187.459069 417.43907 417.739069H638.254276zM576.586686 718.937463h-80.368854c0-52.377878-20.342554-101.550994-57.208569-138.422129-36.882397-36.960212-85.890668-57.311981-138.048411-57.311981v-80.070904C452.934103 443.132449 576.586686 566.766602 576.586686 718.937463zM356.501512 607.516214c30.775945 0 55.629737 25.013518 55.629737 55.528373 0 30.607004-24.853792 55.351241-55.629737 55.351241-30.667413 0-55.583663-24.743213-55.583663-55.351241C300.917849 632.529733 325.834099 607.516214 356.501512 607.516214z" fill="#FFFFFF" p-id="17356">
			</path></svg></div>\` : "";
			return \`
			<a href="\${site.url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="card flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 cursor-pointer no-underline">
			  <img src="\${IconApiUrl + encodeURIComponent(site.url)}" alt="" class="w-9 h-9 rounded-lg shrink-0" onerror="this.onerror=null;this.src='${fallbackFavicon}';" />
			  <div class="flex-grow min-w-0">
				<div class="text-gray-900 dark:text-gray-100 font-semibold truncate">\${site.name}</div>
				<div class="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">\${tagsHtml}</div>
			  </div>
			  \${rssBtn}
			</a>
			\`;
		  }
  
		  input.addEventListener("input", () => {
			const val = input.value.trim().toLowerCase();
			if(val === ""){
			  const shuffled = allSites.sort(() => 0.5 - Math.random()).slice(0, 24);
			  results.innerHTML = shuffled.map(renderSiteCard).join("");
			} else {
			  const filtered = allSites.filter(site => {
				return site.name.toLowerCase().includes(val) || site.tags.some(t => t.toLowerCase().includes(val));
			  });
			  results.innerHTML = filtered.length > 0 ? filtered.map(renderSiteCard).join("") : "<p class='text-center text-gray-500 col-span-full'>无匹配结果</p>";
			}
		  });
  
		  window.addEventListener("scroll", () => {
			if (window.scrollY > 200) {
			  toTopBtn.style.display = "block";
			} else {
			  toTopBtn.style.display = "none";
			}
		  });
  
		  toTopBtn.addEventListener("click", () => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		  });
		});
	  </script>
	</body>
	</html>
	`;
}

function renderAllPage(blogs) {
	return `
	<!DOCTYPE html>
	<html lang="zh-CN" class="scroll-smooth">
	<head>
	  <meta charset="utf-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1" />
	  <meta name="description" content="一个收集和展示中文独立博客的网站，提供搜索和分类功能，帮助用户发现有趣的独立博客。">
	  <meta name="keywords" content="独立博客, 中文博客, 博客导航, 博客列表, 独立网站, 网站导航">
	  <meta name="author" content="酷酷的白">
	  <meta property="og:title" content="中文独立博客列表">
	  <meta property="og:description" content="一个收集和展示中文独立博客的网站，提供搜索和分类功能，帮助用户发现有趣的独立博客。">
	  <meta property="og:image" content="https://i.051214.xyz/i/2025/08/09/215040.webp">
	  <link rel="icon" href="data:image/svg+xml;base64,${utf8ToBase64(icon)}" />	
	  <title>所有博客网站 - 中文独立博客列表</title>
	  <script src="https://cdn.tailwindcss.com"></script>
	  ${renderPagePublicCss()}
	</head>
	<body class="text-gray-900 dark:text-gray-100">
	  ${renderNavbar()}
	  <main class="flex-grow container mx-auto px-4 py-16 max-w-6xl">
		<div class="text-center mb-10">
		  <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">所有博客网站</h1>
		  <p class="text-gray-500 dark:text-gray-400">共 ${blogs.length} 个独立博客</p>
		</div>
		<div class="w-full max-w-xl mx-auto mb-10">
		  <input id="searchInput" type="search" placeholder="搜索网站名称或标签…" aria-label="搜索网站"
			class="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3.5 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 outline-none" autocomplete="off" />
		</div>
		<section id="results" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
		  ${blogs.map(renderSiteCard).join('\n')}
		</section>
	  </main>
  
	  ${renderPagePublic()}
  
	  <script>
		document.addEventListener("DOMContentLoaded", () => {
		  const input = document.getElementById("searchInput");
		  const results = document.getElementById("results");
		  const allSites = ${JSON.stringify(blogs)};
		  const toTopBtn = document.getElementById("toTopBtn");
  
		  function renderSiteCard(site) {
		    const IconApiUrl = "${IconApiUrl}";
			const tagsHtml = site.tags.map(t => 
			  \`<span class="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-medium mr-1.5 mb-1 select-none">\${t}</span>\`
			).join("");
			const rssBtn = site.rss ? \`<div onclick="copyRSS(event,'\${site.rss}')"
			class="ml-auto shrink-0 text-xs rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
			<svg t="1754784222350" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17354" width="20" height="20">
			<path d="M544.059897 959.266898h-64.949141c-228.633593 0-415.697442-187.063849-415.697442-415.697442v-64.949141c0-228.633593 187.063849-415.697442 415.697442-415.697442h64.949141c228.633593 0 415.697442 187.063849 415.697442 415.697442v64.949141C959.756315 772.203049 772.692466 959.266898 544.059897 959.266898z" fill="#FD9B00" p-id="17355"></path><path d="M638.254276 718.937463c0-186.152591-151.296463-337.64564-337.178748-337.64564v-80.094453c230.17966 0 417.439071 187.459069 417.43907 417.739069H638.254276zM576.586686 718.937463h-80.368854c0-52.377878-20.342554-101.550994-57.208569-138.422129-36.882397-36.960212-85.890668-57.311981-138.048411-57.311981v-80.070904C452.934103 443.132449 576.586686 566.766602 576.586686 718.937463zM356.501512 607.516214c30.775945 0 55.629737 25.013518 55.629737 55.528373 0 30.607004-24.853792 55.351241-55.629737 55.351241-30.667413 0-55.583663-24.743213-55.583663-55.351241C300.917849 632.529733 325.834099 607.516214 356.501512 607.516214z" fill="#FFFFFF" p-id="17356">
			</path></svg></div>\` : "";
			return \`
			<a href="\${site.url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="card flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 cursor-pointer no-underline">
			  <img src="\${IconApiUrl + encodeURIComponent(site.url)}" alt="" class="w-9 h-9 rounded-lg shrink-0" onerror="this.onerror=null;this.src='${fallbackFavicon}';" />
			  <div class="flex-grow min-w-0">
				<div class="text-gray-900 dark:text-gray-100 font-semibold truncate">\${site.name}</div>
				<div class="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">\${tagsHtml}</div>
			  </div>
			  \${rssBtn}
			</a>
			\`;
		  }
  
		  input.addEventListener("input", () => {
			const val = input.value.trim().toLowerCase();
			if(val === ""){
			  results.innerHTML = allSites.map(renderSiteCard).join("");
			} else {
			  const filtered = allSites.filter(site => {
				return site.name.toLowerCase().includes(val) || site.tags.some(t => t.toLowerCase().includes(val));
			  });
			  results.innerHTML = filtered.length > 0 ? filtered.map(renderSiteCard).join("") : "<p class='text-center text-gray-500 col-span-full'>无匹配结果</p>";
			}
		  });
  
		  window.addEventListener("scroll", () => {
			if (window.scrollY > 200) {
			  toTopBtn.style.display = "block";
			} else {
			  toTopBtn.style.display = "none";
			}
		  });
  
		  toTopBtn.addEventListener("click", () => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		  });
		});
	  </script>
	</body>
	</html>
	`;
}

function renderTagsPage(blogs) {
	const tagMap = {};
	blogs.forEach((b) => {
		b.tags.forEach((t) => {
			if (!tagMap[t]) tagMap[t] = [];
			tagMap[t].push(b);
		});
	});

	return `
	<!DOCTYPE html>
	<html lang="zh-CN" class="scroll-smooth">
	<head>
	  <meta charset="utf-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1" />
  	  <meta name="description" content="一个收集和展示中文独立博客的网站，提供搜索和分类功能，帮助用户发现有趣的独立博客。">
	  <meta name="keywords" content="独立博客, 中文博客, 博客导航, 博客列表, 独立网站, 网站导航">
	  <meta name="author" content="酷酷的白">
	  <meta property="og:title" content="中文独立博客列表">
	  <meta property="og:description" content="一个收集和展示中文独立博客的网站，提供搜索和分类功能，帮助用户发现有趣的独立博客。">
	  <meta property="og:image" content="https://i.051214.xyz/i/2025/08/09/215040.webp">
	  <link rel="icon" href="data:image/svg+xml;base64,${utf8ToBase64(icon)}" />	
	  <title>标签分类 - 中文独立博客列表</title>
	  <script src="https://cdn.tailwindcss.com"></script>
	  ${renderPagePublicCss()}
	</head>
	<body class="text-gray-900 dark:text-gray-100">
	  ${renderNavbar()}
	  <main class="flex-grow container mx-auto px-4 py-16 max-w-6xl">
		<div class="text-center mb-12">
		  <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">标签分类</h1>
		  <p class="text-gray-500 dark:text-gray-400">共 ${Object.keys(tagMap).length} 个标签</p>
		</div>
		${Object.keys(tagMap)
			.sort()
			.map(
				(tag) => `
		  <section class="mb-14">
			<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-5 border-l-4 border-blue-500 pl-3">${tag} <span class="text-sm font-normal text-gray-400">(${tagMap[tag].length})</span></h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
			  ${tagMap[tag]
					.map(
						(site) => `
				<a href="${site.url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="card flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 cursor-pointer no-underline">
				  <img src="${IconApiUrl + encodeURIComponent(site.url)}" alt="" class="w-9 h-9 rounded-lg shrink-0" onerror="this.onerror=null;this.src='${fallbackFavicon}';" />
				  <div class="flex-grow min-w-0">
					<div class="text-gray-900 dark:text-gray-100 font-semibold truncate">${site.name}</div>
				  </div>
				  ${
						site.rss
							? `<div onclick="copyRSS(event,'${site.rss}')" class="ml-auto shrink-0 text-xs rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
					<svg t="1754784222350" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17354" width="20" height="20">
					<path d="M544.059897 959.266898h-64.949141c-228.633593 0-415.697442-187.063849-415.697442-415.697442v-64.949141c0-228.633593 187.063849-415.697442 415.697442-415.697442h64.949141c228.633593 0 415.697442 187.063849 415.697442 415.697442v64.949141C959.756315 772.203049 772.692466 959.266898 544.059897 959.266898z" fill="#FD9B00" p-id="17355"></path><path d="M638.254276 718.937463c0-186.152591-151.296463-337.64564-337.178748-337.64564v-80.094453c230.17966 0 417.439071 187.459069 417.43907 417.739069H638.254276zM576.586686 718.937463h-80.368854c0-52.377878-20.342554-101.550994-57.208569-138.422129-36.882397-36.960212-85.890668-57.311981-138.048411-57.311981v-80.070904C452.934103 443.132449 576.586686 566.766602 576.586686 718.937463zM356.501512 607.516214c30.775945 0 55.629737 25.013518 55.629737 55.528373 0 30.607004-24.853792 55.351241-55.629737 55.351241-30.667413 0-55.583663-24.743213-55.583663-55.351241C300.917849 632.529733 325.834099 607.516214 356.501512 607.516214z" fill="#FFFFFF" p-id="17356">
					</path></svg></div>`
							: ''
					}
				</a>
			  `,
					)
					.join('')}
			</div>
		  </section>
		`,
			)
			.join('')}
	  </main>
  
	  ${renderPagePublic()}
  
	  <script>
		document.addEventListener("DOMContentLoaded", () => {
		  const toTopBtn = document.getElementById("toTopBtn");
  
		  window.addEventListener("scroll", () => {
			if (window.scrollY > 200) {
			  toTopBtn.style.display = "block";
			} else {
			  toTopBtn.style.display = "none";
			}
		  });
  
		  toTopBtn.addEventListener("click", () => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		  });
		});
	  </script>
	</body>
	</html>
	`;
}
