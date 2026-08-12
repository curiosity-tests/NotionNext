import { defineConfig } from 'vitepress'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getThemeSidebarItems } from '../scripts/lib/builtin-themes.mjs'

const themeDocLinks = getThemeSidebarItems()
const projectRoot = fileURLToPath(new URL('../', import.meta.url))

const giscusEnabled = process.env.VITE_GISCUS_ENABLED !== 'false'
const giscusRepoId = process.env.VITE_GISCUS_REPO_ID || ''
const giscusCategoryId = process.env.VITE_GISCUS_CATEGORY_ID || ''

/**
 * 鍦ㄧ嚎绔欏彂甯冪敤鎴锋暀绋嬨€佸紑鍙戞枃妗ｄ笌绀惧尯鏂囨。銆? * 鏍圭洰褰?README 浠嶄綔涓?GitHub 鐩綍璇存槑锛屼笉杩涘叆 VitePress銆? */
const hiddenPublicDocPaths = ['user-guide/deploy/cloudflare-pages-docs.md']
const srcExclude = [
  '**/README.md',
  '**/README.en.md',
  ...hiddenPublicDocPaths.map((path) => `**/${path}`)
]

function getMarkdownTitle(filePath: string) {
  const content = readFileSync(filePath, 'utf8')
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  return title || filePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || filePath
}

function getLastUpdatedAt(filePath: string) {
  try {
    const timestamp = execFileSync('git', ['log', '-1', '--format=%ct', '--', filePath], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()

    if (timestamp) {
      return Number(timestamp) * 1000
    }
  } catch {
    // Fall back to filesystem time when git history is unavailable in a deploy checkout.
  }

  return statSync(filePath).mtimeMs
}

function toDocLink(repoPath: string) {
  let link = `/${repoPath.replace(/^docs\//, '').replace(/\.md$/, '')}`

  if (link.endsWith('/index')) {
    link = link.slice(0, -'/index'.length) || '/'
  }

  return link
}

function getUpdatedDocs() {
  const trackedDocs = execFileSync('git', ['ls-files', 'docs'], {
    cwd: projectRoot,
    encoding: 'utf8'
  })
    .split(/\r?\n/)
    .filter((repoPath) => {
      return (
        repoPath.endsWith('.md') &&
        !repoPath.endsWith('/README.md') &&
        !repoPath.endsWith('/README.en.md') &&
        !repoPath.includes('/public/') &&
        !hiddenPublicDocPaths.includes(repoPath.replace(/^docs\//, ''))
      )
    })

  return trackedDocs
    .map((repoPath) => {
      const filePath = fileURLToPath(new URL(`../${repoPath}`, import.meta.url))

      if (!existsSync(filePath)) {
        return null
      }

      return {
        link: toDocLink(repoPath),
        title: getMarkdownTitle(filePath),
        updatedAt: Math.floor(getLastUpdatedAt(filePath)),
        isIndex: repoPath.endsWith('/index.md')
      }
    })
    .filter(
      (item): item is { link: string; title: string; updatedAt: number; isIndex: boolean } =>
        Boolean(item)
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

const updatedDocs = getUpdatedDocs()
const recentUpdatedDocs = updatedDocs.filter((doc) => !doc.isIndex).slice(0, 5)

export default defineConfig({
  title: 'NotionNext 浣跨敤璇存槑',
  description: 'NotionNext 閮ㄧ讲銆侀厤缃€佷富棰樹笌 Notion 鏁欑▼',
  lang: 'zh-CN',
  srcDir: 'docs',
  srcExclude,
  cleanUrls: true,
  lastUpdated: true,
  vite: {
    css: {
      postcss: {
        plugins: []
      }
    }
  },
  ignoreDeadLinks: [/^https?:\/\//],
  head: [
    ['link', { rel: 'icon', href: '/brand/notionnext-logo.png', type: 'image/png' }],
    ['link', { rel: 'apple-touch-icon', href: '/brand/notionnext-logo.png' }]
  ],
  transformHtml(html) {
    return html.replace(/rel="preload stylesheet"/g, 'rel="stylesheet"')
  },
  themeConfig: {
    logo: '/brand/notionnext-logo.png',
    updatedDocs,
    recentUpdatedDocs,
    nav: [
      { text: '开始搭建', link: '/user-guide/start-here', activeMatch: '/user-guide/' },
      { text: '主题', link: '/user-guide/themes/THEMES_CATALOG', activeMatch: '/user-guide/themes/' },
      { text: '用户作品', link: '/user-guide/showcase' },
      { text: '开发文档', link: '/developer/', activeMatch: '/developer/' },
      { text: '参与社区', link: '/user-guide/community-participate' },
      { text: 'GitHub', link: 'https://github.com/notionnext-org/NotionNext/tree/main/docs' }
    ],
    sidebar: {
      '/user-guide/': [
        {
          text: '入门',
          items: [
            { text: '从这里开始', link: '/user-guide/start-here' },
            { text: '使用说明', link: '/user-guide/intro' },
            { text: '部署', link: '/user-guide/deploy/' },
            { text: '配置站点', link: '/user-guide/config-site' },
            { text: 'Notion 数据库', link: '/user-guide/notion-database' },
            { text: '菜单', link: '/user-guide/menu-secondary' },
            { text: '升级', link: '/user-guide/update' }
          ]
        },
        {
          text: '主题',
          items: [
            { text: '主题总览', link: '/user-guide/themes/overview' },
            { text: '主题目录', link: '/user-guide/themes/' },
            { text: '主题全表', link: '/user-guide/themes/THEMES_CATALOG' },
            { text: '主题控制台', link: '/user-guide/themes/theme-console' }
          ]
        },
        {
          text: '配置',
          items: [
            { text: '配置索引', link: '/user-guide/reference/features' },
            { text: '站点基础', link: '/user-guide/config/site-basics' },
            { text: '文章与列表', link: '/user-guide/config/index' },
            { text: '评论', link: '/user-guide/comments/' },
            { text: '统计', link: '/user-guide/analytics/' },
            { text: '插件', link: '/user-guide/plugins/' }
          ]
        },
        {
          text: '部署',
          collapsed: true,
          items: [
            { text: 'Vercel', link: '/user-guide/deploy-vercel' },
            { text: 'Cloudflare Pages', link: '/user-guide/deploy/cloudflare-pages' },
            { text: 'Netlify', link: '/user-guide/deploy/netlify' },
            { text: 'VPS', link: '/user-guide/deploy/vps' },
            { text: 'EdgeOne Pages', link: '/user-guide/deploy/edgeone-pages' },
            { text: '4EVERLAND', link: '/user-guide/deploy/4everland' },
            { text: 'Zeabur', link: '/user-guide/deploy/zeabur' }
          ]
        },
        {
          text: 'Notion',
          collapsed: true,
          items: [
            { text: '数据库', link: '/user-guide/notion-database' },
            { text: '模板', link: '/user-guide/notion/notion-template' },
            { text: '入门', link: '/user-guide/notion/notion-tutorial' },
            { text: '页面状态', link: '/user-guide/notion/post-status' },
            { text: '隐藏页面', link: '/user-guide/notion/notionnext-hidden-page' },
            { text: '定时发布', link: '/user-guide/notion/notionnext-scheduled-article-release' },
            { text: '内容链接', link: '/user-guide/notion/how-to-add-link-for-text-in-notion' },
            { text: '视频嵌入', link: '/user-guide/notion/notionnext-video' },
            { text: '双语翻译 CLI', link: '/user-guide/notion/bilingual-translator' }
          ]
        },
        {
          text: '主题场景',
          collapsed: true,
          items: [
            { text: '用户作品', link: '/user-guide/showcase' },
            { text: '场景模板', link: '/user-guide/templates' },
            { text: '社区站点模板', link: '/user-guide/notion/community-site-template' }
          ]
        },
        {
          text: '主题进阶',
          collapsed: true,
          items: [
            { text: '开发中的主题', link: '/user-guide/development/' },
            { text: '开发入门', link: '/user-guide/development/getting-started' },
            { text: '运行原理', link: '/user-guide/development/architecture' },
            { text: '前端开发', link: '/user-guide/development/frontend-development-tutorial' },
            { text: '自定义样式', link: '/user-guide/development/custom-style' },
            { text: '开发主题', link: '/user-guide/development/own-theme' },
            { text: '鼠标点击特效', link: '/user-guide/development/notion-next-click-effect' },
            { text: 'AI 辅助开发', link: '/user-guide/development/notion-next-develop-with-ai' },
            { text: '提交 PR', link: '/user-guide/development/notionnext-how-to-pr' },
            { text: 'React JSX', link: '/user-guide/development/react-jsx' },
            { text: 'Next.js', link: '/user-guide/development/nextjs' },
            { text: 'Tailwind CSS', link: '/user-guide/development/about-tailwindcss' }
          ]
        },
        {
          text: '运营',
          collapsed: true,
          items: [
            { text: 'SEO', link: '/user-guide/operations/seo' },
            { text: '搜索收录', link: '/user-guide/operations/search-engine-index' },
            { text: '微信公众号', link: '/user-guide/operations/wechat-offical-account' }
          ]
        },
        {
          text: '帮助与维护',
          collapsed: true,
          items: [
            { text: '参与社区', link: '/user-guide/community-participate' },
            { text: '提问规范', link: '/user-guide/help/community-rules' },
            { text: '交流群', link: '/user-guide/help/community' },
            { text: '反馈', link: '/user-guide/help/feedback' },
            { text: '支持服务', link: '/user-guide/help/support' },
            { text: '支持 NotionNext', link: '/user-guide/help/support-notion-next' },
            { text: '众筹计划', link: '/user-guide/help/crowdfunding' },
            { text: '旧版手册', link: '/user-guide/help/legacy-docs' },
            { text: '参与维护', link: '/user-guide/maintain-docs' },
            { text: '致谢', link: '/user-guide/acknowledgements' },
            { text: '维护工作流', link: '/user-guide/MAINTENANCE_WORKFLOW' },
            { text: '迁移索引', link: '/user-guide/ARTICLE_INDEX' }
          ]
        },
        {
          text: '更新日志',
          collapsed: true,
          items: [
            { text: '最新版本', link: '/user-guide/changelog/latest' },
            { text: 'V4 历史', link: '/user-guide/changelog/v4-history' },
            { text: 'V3 历史', link: '/user-guide/changelog/v3-history' },
            { text: 'V2 历史', link: '/user-guide/changelog/v2-history' },
            { text: 'V1 历史', link: '/user-guide/changelog/v1-history' }
          ]
        }
      ],
      '/developer/': [
        {
          text: '寮€鍙戝叆闂?,
          items: [
            { text: '寮€鍙戞枃妗ｉ椤?, link: '/developer/' },
            { text: '蹇€熶笂鎵?, link: '/developer/GETTING_STARTED' },
            { text: '鎰挎櫙涓庤矾绾垮浘', link: '/developer/VISION_ROADMAP' },
            { text: '鍙寔缁闀胯矾绾垮浘', link: '/developer/GROWTH_ROADMAP.zh-CN' },
            { text: '寮€鏀剧敓鎬侀暱鏈熻鍒?, link: '/developer/LONG_TERM_PLAN' },
            { text: '浼氬憳銆佹潈闄愪笌璇勮鍙€夐泦鎴?, link: '/developer/MEMBERSHIP_COMMENTS_ROADMAP' },
            { text: '鏋舵瀯鎬昏', link: '/developer/ARCHITECTURE' },
            { text: '鐩綍涓庢ā鍧?, link: '/developer/PROJECT_STRUCTURE' },
            { text: '閰嶇疆浣撶郴', link: '/developer/CONFIGURATION' },
            { text: '鎻愪氦涓?PR', link: '/developer/CONTRIBUTION_WORKFLOW' }
          ]
        },
        {
          text: '缁存姢涓庢不鐞?,
          collapsed: true,
          items: [
            { text: '缁存姢鍝插', link: '/developer/MAINTENANCE_PHILOSOPHY.zh-CN' },
            { text: '缁存姢鑰呮墜鍐?, link: '/developer/MAINTAINER_RUNBOOK.zh-CN' },
            { text: '鐗堟湰鏇存柊璇存槑', link: '/developer/UPDATE' },
            { text: '绀惧尯璺嚎鍥?, link: '/developer/COMMUNITY_SITE_ROADMAP' },
            { text: '5.0 鎰挎櫙涓庡弬涓庢柟鍚?, link: '/developer/VISION_ROADMAP' },
            { text: 'RFC', link: '/developer/rfc/' }
          ]
        },
        {
          text: '涓婚鍏卞缓',
          collapsed: true,
          items: [
            { text: '涓婚寮€鍙戞枃妗ｉ椤?, link: '/developer/themes/' },
            { text: '涓婚杩佺Щ鎸囧崡', link: '/developer/THEME_MIGRATION_GUIDE.zh-CN' },
            { text: '涓婚鎺у埗鍙拌璁?, link: '/developer/THEME_CONSOLE_DESIGN.zh-CN' },
            { text: '涓婚鑹插彉閲忚鍒?, link: '/developer/THEME_COLOR_TOKEN_ROADMAP.zh-CN' },
            { text: 'Claude', link: '/developer/themes/CLAUDE' },
            { text: 'Endspace', link: '/developer/themes/ENDSPACE' },
            { text: 'Fuwari', link: '/developer/themes/FUWARI' },
            { text: 'Heo', link: '/developer/themes/HEO' },
            { text: 'Proxio', link: '/developer/themes/PROXIO' },
            { text: 'ThoughtLite', link: '/developer/themes/THOUGHTLITE' },
            { text: 'ThoughtLite 杩佺Щ璁″垝', link: '/developer/themes/THOUGHTLITE_MIGRATION_PLAN.zh-CN' }
          ]
        },
        {
          text: 'English',
          collapsed: true,
          items: [
            { text: 'Getting Started', link: '/developer/GETTING_STARTED.en' },
            { text: 'Architecture', link: '/developer/ARCHITECTURE.en' },
            { text: 'Project Structure', link: '/developer/PROJECT_STRUCTURE.en' },
            { text: 'Configuration', link: '/developer/CONFIGURATION.en' },
            { text: 'Contribution Workflow', link: '/developer/CONTRIBUTION_WORKFLOW.en' },
            { text: 'Maintainer Runbook', link: '/developer/MAINTAINER_RUNBOOK.en' },
            { text: 'Maintenance Philosophy', link: '/developer/MAINTENANCE_PHILOSOPHY.en' },
            { text: 'Theme Migration Guide', link: '/developer/THEME_MIGRATION_GUIDE' },
            { text: 'Claude Theme', link: '/developer/themes/CLAUDE.en' },
            { text: 'Endspace Theme', link: '/developer/themes/ENDSPACE.en' },
            { text: 'ThoughtLite Theme', link: '/developer/themes/THOUGHTLITE.en' }
          ]
        }
      ],
      '/': [
        {
          text: '鏂囨。',
          items: [
            { text: '棣栭〉', link: '/' },
            { text: '浠庤繖閲屽紑濮?, link: '/user-guide/start-here' },
            { text: '浣跨敤璇存槑', link: '/user-guide/intro' },
            { text: '寮€鍙戞枃妗?, link: '/developer/' },
            { text: '鍙備笌绀惧尯', link: '/user-guide/community-participate' },
            { text: '鏂囨。缁存姢绛栫暐', link: '/DOCUMENTATION_POLICY' },
            { text: '鍙備笌缁存姢', link: '/user-guide/maintain-docs' },
            { text: '鑷磋阿', link: '/user-guide/acknowledgements' }
          ]
        }
      ]
    },
    editLink: {
      pattern:
        'https://github.com/notionnext-org/NotionNext/edit/main/docs/:path',
      text: '鍦?GitHub 涓婄淮鎶ゆ椤?
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/notionnext-org/NotionNext/tree/main/docs'
      }
    ],
    footer: {
      message:
        '浠?GitHub 浠撳簱涓哄噯 路 <a href="https://github.com/notionnext-org/NotionNext/tree/main/docs" target="_blank" rel="noreferrer">娴忚 docs 鐩綍</a> 路 <a href="https://github.com/notionnext-org/NotionNext/blob/main/docs/README.md" target="_blank" rel="noreferrer">鐩綍璇存槑</a>',
      copyright: 'NotionNext 路 MIT'
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '鎼滅储',
                buttonAriaLabel: '鎼滅储鏂囨。'
              },
              modal: {
                displayDetails: '鏄剧ず璇︾粏鍒楄〃',
                resetButtonTitle: '娓呴櫎鎼滅储鏉′欢',
                backButtonTitle: '鍏抽棴鎼滅储',
                noResultsText: '鏈壘鍒颁笌',
                footer: {
                  selectText: '鎵撳紑',
                  selectKeyAriaLabel: '鍥炶溅閿?,
                  navigateText: '鍒囨崲',
                  navigateUpKeyAriaLabel: '涓婃柟鍚戦敭',
                  navigateDownKeyAriaLabel: '涓嬫柟鍚戦敭',
                  closeText: '鍏抽棴',
                  closeKeyAriaLabel: 'Esc 閿?
                }
              }
            }
          }
        },
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 2 }
          }
        }
      }
    },
    /** 鏂囨。椤靛簳 Giscus 鈫?GitHub Discussions锛汭D 瑙?giscus.app */
    giscus: {
      enabled: giscusEnabled,
      repo: 'notionnext-org/NotionNext',
      repoId: giscusRepoId,
      category: 'General',
      categoryId: giscusCategoryId,
      mapping: 'pathname',
      strict: '0',
      reactionsEnabled: '1',
      emitMetadata: '0',
      inputPosition: 'top',
      theme: 'preferred_color_scheme',
      lang: 'zh-CN'
    }
  }
})
