// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'mxsm(蚂蚁背大象)',
  tagline: 'Love Open source,Recently has been focusing on RocketMQ and DLedger.',
  url: 'https://blog.ljbmxsm.com/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'mxsm', // Usually your GitHub org/user name.
  projectName: 'mxsm.github.io', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: ({locale, docPath}) => {
/*            if (locale !== 'en') {
              return `https://crowdin.com/project/docusaurus-v2/${locale}`;
            }*/
            // We want users to submit doc updates to the upstream/next version!
            // Otherwise we risk losing the update on the next release.
            const nextVersionDocsDirPath = 'docs';
            return `https://github.com/mxsm/mxsm-website/edit/develop/${nextVersionDocsDirPath}/${docPath}`;
          },
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      announcementBar: {
        id: 'announcementBar-2', // Increment on change
        content: `⭐️ If you like, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/mxsm/mxsm-website">GitHub</a> and follow me. This web site is updating!! </a>`,
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 5,
      },
      navbar: {
        title: '',
        logo: {
          alt: '',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Tutorial',
          },
          {
            label: 'RocketMQ',
            position: 'left',
            type: 'dropdown',
            items: [
              {
                to: '/docs/rocketmq/rocketmq5',
                label: 'RocketMQ 5.0',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'RocketMQ 4.X',
              },
              {
                href: 'https://github.com/apache/rocketmq',
                label: 'RocketMQ GitHub',
                target: '_blank',
                rel: null,
              },
              {
                href: 'https://rocketmq.apache.org/',
                label: 'RocketMQ official website',
                target: '_blank',
                rel: null,
              },
            ]
          },
          {
            label: 'Spring',
            position: 'left',
            items: [
              {
                to: '/docs/spring/spring-framework',
                label: 'Spring Framework',
              },
              {
                to: '/docs/spring/spring-boot',
                label: 'Spring Boot',
              },
              {
                to: '/docs/spring/spring-cloud',
                label: 'Spring Cloud',
              },
              {
                href: 'https://spring.io/',
                label: 'Spring official website',
                target: '_blank',
                rel: null,
              },
            ]
          },
          {
            label: 'Java',
            position: 'left',
            items: [
              {
                type: 'doc',
                docId: 'intro',
                label: 'Java SE',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'Java Web',
              }
            ]
          },
          {
            label: 'Middleware',
            position: 'left',
            items: [
              {
                type: 'doc',
                docId: 'intro',
                label: 'Netty',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'Redis',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'Kafka',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'Etcd',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'Docker',
              }
            ]
          },
          {
            label: 'Database',
            position: 'left',
            items: [
              {
                type: 'doc',
                docId: 'intro',
                label: 'SQL',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'MySQL',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'PostgreSQL',
              }
            ]
          },
          {
            label: 'Theory',
            position: 'left',
            items: [
              {
                type: 'doc',
                docId: 'intro',
                label: 'SQL',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'MySQL',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'PostgreSQL',
              }
            ]
          },
          {
            label: 'Others',
            position: 'left',
            items: [
              {
                to: '/docs/others/blog-building',
                label: 'Blog building',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'MySQL',
              },
              {
                type: 'doc',
                docId: 'intro',
                label: 'PostgreSQL',
              }
            ]
          },
          {
            to: '/blog',
            label: 'Blog',
            position: 'left'
          },
          {
            href: 'https://github.com/mxsm',
            className: 'header-github-link',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/docusaurus',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/docusaurus',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/docusaurus',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/mxsm',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} mxsm(蚂蚁背大象), Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  plugins: [
    '@docusaurus/plugin-client-redirects',
    /*'@docusaurus/plugin-debug',*/
    [
      '@docusaurus/plugin-google-analytics',
      {
        trackingID: 'UA-141789564-1',
        anonymizeIP: true,
      },
    ],
    [
      '@docusaurus/plugin-google-gtag',
      {
        trackingID: 'G-226F0LR9KE',
        anonymizeIP: true,
      },
    ],
/*    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030, // 最大缩放图片尺寸。
        min: 640, // 最小缩放图片尺寸。 如果原始值比这还低，会使用原图尺寸。
        steps: 2, // 在 min 和 max 之间最多生成的图片数量（包含两端点）
        disableInDev: false,
      },
    ],*/
    [
      '@docusaurus/plugin-sitemap',
      {
        changefreq: 'weekly',
        priority: 0.5,
        ignorePatterns: ['/tags/**'],
        filename: 'sitemap.xml',
      },
    ],
  ]
};

module.exports = config;
