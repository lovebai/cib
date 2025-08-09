export default {
	async fetch(request) {
	  const url = new URL(request.url);
	  const path = url.pathname;
	  const csvUrl = "https://raw.githubusercontent.com/timqian/chinese-independent-blogs/master/blogs-original.csv";
  
	  const res = await fetch(csvUrl);
	  const csvText = await res.text();
  
	  const blogs = parseCSV(csvText);
  
	  if (path === "/tags") {
		return new Response(renderTagsPage(blogs), {
		  headers: { "content-type": "text/html;charset=utf-8" }
		});
	  } else if (path === "/all") {
		return new Response(renderAllPage(blogs), {
		  headers: { "content-type": "text/html;charset=utf-8" }
		});
	  } else {
		return new Response(renderHomePage(blogs), {
		  headers: { "content-type": "text/html;charset=utf-8" }
		});
	  }
	}
  };
  
  function parseCSV(text) {
	const lines = text.trim().split("\n").slice(1);
	return lines.map(line => {
	  const parts = [];
	  let current = "", inQuotes = false;
	  for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') inQuotes = !inQuotes;
		else if (ch === ',' && !inQuotes) {
		  parts.push(current.trim().replace(/^"|"$/g, ""));
		  current = "";
		  continue;
		}
		current += ch;
	  }
	  parts.push(current.trim().replace(/^"|"$/g, ""));
  
	  const tags = parts[3] ? parts[3].split(/;|、|，|,/).map(t => t.trim()).filter(Boolean) : [];
	  return {
		name: parts[0] || "",
		url: parts[1] || "",
		rss: parts[2] || "",
		tags
	  };
	});
  }
  
  const icon= `
  <svg t="1754746698818" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12334" width="64" height="64">
  <path d="M537.472 854.272c0 10.624-10.304 41.728-54.464 41.728-41.792 0-56.192-24.512-56.192-41.728v-187.264H235.968C162.368 667.008 128 642.496 128 559.04v-191.36c0-84.288 35.2-107.2 107.968-107.2h190.848V168.96c0-12.288 12.032-40.896 52.928-40.896 33.472 0 57.728 11.456 57.728 40.896V260.48h192.512c74.432 0 108.032 24.576 108.032 107.136v191.36c0 81.024-32 108.032-108.032 108.032H537.472v187.264z m-115.2-496.64h-152.96c-23.68 0-35.584 11.136-35.584 35.584v136.128c0 23.04 10.432 35.648 35.584 35.648h152.896v-207.36zM539.648 567.04h156.544c25.536 0 36.16-13.44 36.16-36.16V392.832c0-25.6-13.44-36.16-36.16-36.16H539.712V567.04z" fill="#0061D5" p-id="12335"></path>
  </svg>
  `;

  const fallbackSvg = `
	<svg t="1754750646066" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9525" width="64" height="64">
	<path d="M513.8 69.5c-244.4 0-443.2 198.8-443.2 443.2s198.8 443.2 443.2 443.2S957 757 957 512.6 758.2 69.5 513.8 69.5z m0 823.6c-209.8 0-380.5-170.7-380.5-380.5S304 132.2 513.8 132.2s380.5 170.7 380.5 380.5-170.7 380.4-380.5 380.4z" fill="#3E75FF" p-id="9526"></path><path d="M482.5 291.3h62.7v341.2h-62.7z" fill="#3E75FF" p-id="9527"></path><path d="M509.549684 783.821504a43.498695 43.498695 0 1 0 8.572567-86.573997 43.498695 43.498695 0 1 0-8.572567 86.573997Z" fill="#3E75FF" p-id="9528"></path>
	</svg>
  `;
  function utf8ToBase64(str) {
	return btoa(unescape(encodeURIComponent(str)));
  }
  const fallbackFavicon = `data:image/svg+xml;base64,${utf8ToBase64(fallbackSvg)}`;
  
  function renderSiteCard(site) {
	const tagsHtml = site.tags.map(t => 
	  `<span class="inline-block bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-1 select-none">${t}</span>`
	).join("");
	return `
	  <a href="${site.url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="card flex items-center gap-4 p-4 border border-gray-300 rounded-lg bg-white cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 no-underline dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-400">
		<img src="https://favicons.fuzqing.workers.dev/api/getFavicon?url=${encodeURIComponent(site.url)}" alt="网站图标" class="w-8 h-8 rounded" onerror="this.onerror=null;this.src='${fallbackFavicon}';" />
		<div class="flex-grow">
		  <div class="text-blue-700 font-semibold text-lg">${site.name}</div>
		  <div class="mt-1 text-sm text-gray-600">${tagsHtml}</div>
		</div>
	  </a>
	`;
  }

  
  function renderNavbar() {
	return `
	<nav class="flex items-center gap-6 p-4 bg-white border-b border-gray-300 shadow-sm dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-400 custom-font">
	  <a href="/" class="text-blue-700 font-semibold sm:text-xs lg:text-lg hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded no-underline">首页</a>
	  <a href="/all" class="text-blue-700 font-semibold sm:text-xs lg:text-lg hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded no-underline">全部</a>
	  <a href="/tags" class="text-blue-700 font-semibold sm:text-xs lg:text-lg hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded no-underline">分类</a>
	  <a href="https://github.com/timqian/chinese-independent-blogs" target="_blank" rel="noopener noreferrer" class="ml-auto text-blue-700 font-semibold sm:text-xs lg:text-lg hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-3 py-1 border border-blue-700 hover:bg-blue-100 transition no-underline">提交博客</a>
	  <button id="themeToggle" class="ml-4 px-3 py-1 rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition">🌙</button>
	</nav>`;
  }

  function renderPagePublic(){
	return `<button id="toTopBtn" title="回到顶部" aria-label="回到顶部" style="display:none;">↑</button>
	<script>
			tailwind.config = {
			darkMode: 'class'
		};
		document.addEventListener("DOMContentLoaded", () => {
		const themeToggle = document.getElementById("themeToggle");
		const root = document.documentElement;

		// 初始化：优先 localStorage，否则跟随系统
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme) {
			root.classList.toggle("dark", savedTheme === "dark");
		} else {
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			root.classList.add("dark");
			}
		}

		// 按钮显示符号
		themeToggle.textContent = root.classList.contains("dark") ? "☀️" : "🌙";

		// 切换事件
		themeToggle.addEventListener("click", () => {
			root.classList.toggle("dark");
			const isDark = root.classList.contains("dark");
			localStorage.setItem("theme", isDark ? "dark" : "light");
			themeToggle.textContent = isDark ? "☀️" : "🌙";
		});
		});
		</script>
		<footer class="border-t border-openai-border dark:border-dark-border bg-openai-gray dark:bg-dark-surface transition-colors">
		<div class="max-w-4xl mx-auto px-4 py-6 text-center text-openai-light-gray dark:text-dark-text-secondary transition-colors">
		<p>本站数据来自开源项目 <a href="https://github.com/timqian/chinese-independent-blogs" target="_blank" 
		rel="noopener noreferrer" tabindex="0" class="text-blue-700 font-semibold text-lg hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded no-underline">timqian/chinese-independent-blogs</a></p></div></footer>`;
  }

  function renderPagePublicCss(){
	return `<style>
		body {
		  background-color: #f0f4f8;
		  color: #1e293b;
		  min-height: 100vh;
		  display: flex;
		  flex-direction: column;
		  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
		}
		.card:hover, .card:focus-within {
		  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);
		  border-color: #2563eb;
		  outline: none;
		}
		#toTopBtn {
		  position: fixed;
		  right: 20px;
		  bottom: 30px;
		  background-color: #2563eb;
		  color: white;
		  border: none;
		  border-radius: 50%;
		  width: 48px;
		  height: 48px;
		  font-size: 24px;
		  cursor: pointer;
		  box-shadow: 0 2px 8px rgba(37,99,235,0.7);
		  transition: background-color 0.3s ease;
		  z-index: 9999;
		}
		#toTopBtn:hover {
		  background-color: #1d4ed8;
		}
		a.no-underline:hover, a.no-underline:focus {
		  text-decoration: none;
		}
		.card {
		  text-decoration: none;
		}
		@media (max-width: 767px) {
		  .custom-font{
		 	white-space: nowrap; 
		  }
		 .custom-font button {
		 	padding: .1rem .4rem;
  		  }
        }
	  </style>`;
  }
  
  function renderHomePage(blogs) {
	const randomSites = blogs.sort(() => 0.5 - Math.random()).slice(0, 21);
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
	<body class="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	  ${renderNavbar()}
	  <main class="flex-grow container mx-auto px-4 flex flex-col items-center justify-center py-20 min-h-[calc(100vh-64px)] gap-12">
		<h1 class="text-4xl font-extrabold text-blue-700 select-text">中文独立博客列表</h1>
		<div class="w-full max-w-xl">
		  <input id="searchInput" type="search" placeholder="搜索导航网站名称或标签…" aria-label="搜索导航网站" 
			class="w-full rounded-full border border-gray-300 px-6 py-4 text-lg bg-white text-gray-900 shadow-sm transition dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-400" autocomplete="off" />
		</div>
		<section id="results" class="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" role="list">
		  ${randomSites.map(renderSiteCard).join("\n")}
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
			const tagsHtml = site.tags.map(t => 
			  \`<span class="inline-block bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-1 select-none">\${t}</span>\`
			).join("");
			return \`
			<a href="\${site.url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="card flex items-center gap-4 p-4 border border-gray-300 rounded-lg bg-white cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 no-underline">
			  <img src="https://favicons.fuzqing.workers.dev/api/getFavicon?url=\${encodeURIComponent(site.url)}" alt="网站图标" class="w-8 h-8 rounded" onerror="this.onerror=null;this.src='${fallbackFavicon}';" />
			  <div class="flex-grow">
				<div class="text-blue-700 font-semibold text-lg">\${site.name}</div>
				<div class="mt-1 text-sm text-gray-600">\${tagsHtml}</div>
			  </div>
			</a>
			\`;
		  }
  
		  input.addEventListener("input", () => {
			const val = input.value.trim().toLowerCase();
			if(val === ""){
			  const shuffled = allSites.sort(() => 0.5 - Math.random()).slice(0, 21);
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
	  <title>所有网站 - 中文独立博客列表</title>
	  <script src="https://cdn.tailwindcss.com"></script>
	  ${renderPagePublicCss()}
	</head>
	<body class="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	  ${renderNavbar()}
	  <main class="flex-grow container mx-auto px-4 py-8 max-w-6xl">
		<div class="mb-6">
		  <input id="searchInput" type="search" placeholder="搜索网站名称或标签…" aria-label="搜索网站" 
			class="w-full rounded-full border border-gray-300 px-4 py-3 text-lg bg-white text-gray-900 shadow-sm transition dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-400" autocomplete="off" />
		</div>
		<section id="results" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" role="list">
		  ${blogs.map(renderSiteCard).join("\n")}
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
			const tagsHtml = site.tags.map(t => 
			  \`<span class="inline-block bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-1 select-none">\${t}</span>\`
			).join("");
			return \`
			<a href="\${site.url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="card flex items-center gap-4 p-4 border border-gray-300 rounded-lg bg-white cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 no-underline">
			  <img src="https://favicons.fuzqing.workers.dev/api/getFavicon?url=\${encodeURIComponent(site.url)}" alt="网站图标" class="w-8 h-8 rounded" onerror="this.onerror=null;this.src='${fallbackFavicon}';" />
			  <div class="flex-grow">
				<div class="text-blue-700 font-semibold text-lg">\${site.name}</div>
				<div class="mt-1 text-sm text-gray-600">\${tagsHtml}</div>
			  </div>
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
	blogs.forEach(b => {
	  b.tags.forEach(t => {
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
	  <title>标签 - 中文独立博客列表</title>
	  <script src="https://cdn.tailwindcss.com"></script>
	  ${renderPagePublicCss()}
	</head>
	<body  class="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	  ${renderNavbar()}
	  <main class="flex-grow container mx-auto px-4 py-8 max-w-6xl">
		${Object.keys(tagMap).sort().map(tag => `
		  <section class="mb-12">
			<h2 class="text-2xl font-bold text-blue-700 mb-4 border-l-4 border-blue-700 pl-3">${tag}</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" role="list">
			  ${tagMap[tag].map(site => `
				<a href="${site.url}" target="_blank" rel="noopener noreferrer" tabindex="0" class="card flex items-center gap-4 p-4 border border-gray-300 rounded-lg bg-white cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 no-underline dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-400">
				  <img src="https://favicons.fuzqing.workers.dev/api/getFavicon?url=${encodeURIComponent(site.url)}" alt="网站图标" class="w-8 h-8 rounded" onerror="this.onerror=null;this.src='${fallbackFavicon}';" />
				  <div class="flex-grow">
					<div class="text-blue-700 font-semibold text-lg">${site.name}</div>
				  </div>
				</a>
			  `).join("")}
			</div>
		  </section>
		`).join("")}
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
  