const path = require('path');
const prismic = require('@prismicio/client');
const fetch = require('node-fetch');

const BASE_URL = '';

module.exports = {
  title: 'mxsm(蚂蚁背大象)',
  tagline: 'Day Day Up!',
  url: 'https://blog.ljbmxsm.com',
  baseUrl: `${BASE_URL}/`,
  i18n: {
    defaultLocale: 'en',
    locales: ['cn', 'en'],
    localeConfigs: {
      en: { label: 'English' },
      cn: { label: '中文' },
    },
  },
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/meta/favicon.ico',
  organizationName: 'mxsm',
  projectName: 'mxsm.github.io',
  themeConfig: {
    metadata: [
      { name: 'og:image', content: 'https://ionicframework.com/docs/img/meta/open-graph.png' },
      { name: 'twitter:image', content: 'https://ionicframework.com/docs/img/meta/open-graph.png' },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:domain',
        content: 'ionicframework.com',
      },
      {
        name: 'twitter:site',
        content: '@ionicframework',
      },
      {
        name: 'twitter:creator',
        content: 'ionicframework',
      },
      {
        name: 'fb:page_id',
        content: '1321836767955949',
      },
      {
        name: 'og:type',
        content: 'website',
      },
      {
        name: 'og:site_name',
        content: 'Ionic Framework Docs',
      },
    ],
    colorMode: {
      defaultMode: 'light',
    },
    navbar: {
      hideOnScroll: false,
      logo: {
        alt: 'Site Logo',
        src: `/logos/ionic-text-docs-dark.svg`,
        srcDark: `/logos/ionic-text-docs-light.svg`,
        href: '/',
        target: '_self',
        width: 139,
        height: 28,
      },
      items: [
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
              docId: 'index',
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
              docId: 'index',
              label: 'Java SE',
            },
            {
              type: 'doc',
              docId: 'index',
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
              docId: 'index',
              label: 'Netty',
            },
            {
              type: 'doc',
              docId: 'index',
              label: 'Redis',
            },
            {
              type: 'doc',
              docId: 'index',
              label: 'Kafka',
            },
            {
              type: 'doc',
              docId: 'index',
              label: 'Etcd',
            },
            {
              type: 'doc',
              docId: 'index',
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
              docId: 'index',
              label: 'SQL',
            },
            {
              type: 'doc',
              docId: 'index',
              label: 'MySQL',
            },
            {
              type: 'doc',
              docId: 'index',
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
              docId: 'index',
              label: 'SQL',
            },
            {
              type: 'doc',
              docId: 'index',
              label: 'MySQL',
            },
            {
              type: 'doc',
              docId: 'index',
              label: 'PostgreSQL',
            }
          ]
        },
        {
          label: 'Others',
          position: 'left',
          items: [
            {
              type: 'doc',
              docId: 'index',
              label: 'SQL',
            },
            {
              type: 'doc',
              docId: 'index',
              label: 'MySQL',
            },
            {
              type: 'doc',
              docId: 'index',
              label: 'PostgreSQL',
            }
          ]
        },
/*        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownItemsAfter: [
            { to: 'https://ionicframework.com/docs/v4/components', label: 'v4', target: '_blank' },
            { to: 'https://ionicframework.com/docs/v3/', label: 'v3', target: '_blank' },
          ],
          // dropdownItemsAfter: [{to: '/versions', label: 'All versions'}],
          dropdownActiveClassDisabled: true,
        },*/
        {
          type: 'search',
          position: 'right',
        },
        {
          label: 'Github Project',
          position: 'right',
          items: [
            {
              href: 'https://github.com/mxsm/IM',
              label: 'IM',
              target: '_blank',
              rel: null,
            },
            {
              href: 'https://github.com/mxsm/rain',
              label: 'Rain',
              target: '_blank',
              rel: null,
            },
            {
              href: 'https://github.com/mxsm/mxsm-website',
              label: 'mxsm-website',
              target: '_blank',
              rel: null,
            },
            {
              href: 'https://github.com/mxsm/benchmark',
              label: 'benchmark',
              target: '_blank',
              rel: null,
            },
            {
              href: 'https://github.com/mxsm/spring-sample',
              label: 'spring-sample',
              target: '_blank',
              rel: null,
            },
          ],
          className: 'navbar__link--community',
        },
        {
          label: 'Support',
          position: 'right',
          items: [
            {
              href: 'https://github.com/mxsm/',
              label: 'Help Center',
              target: '_blank',
              rel: null,
            },
          ],
          className: 'navbar__link--support',
        },
        {
          type: 'separator',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
          dropdownItemsBefore: [],
          dropdownItemsAfter: [
            {
              href: 'https://ionicframework.com/translate',
              label: 'Translate',
              target: '_blank',
              rel: null,
            },
          ],
          className: 'icon-link language navbar__item',
        },
        {
          type: 'iconLink',
          position: 'right',
          icon: {
            alt: 'twitter logo',
            src: `/logos/twitter.svg`,
            href: 'https://twitter.com/Ionicframework',
            target: '_blank',
          },
        },
        {
          type: 'iconLink',
          position: 'right',
          icon: {
            alt: 'github logo',
            src: `/logos/github.svg`,
            href: 'https://github.com/mxsm',
            target: '_blank',
          },
        },
        {
          type: 'iconLink',
          position: 'right',
          icon: {
            alt: 'discord logo',
            src: `/logos/discord.svg`,
            href: 'https://ionic.link/discord',
            target: '_blank',
          },
        },
      ],
    },
    footer: {
      logo: {
        href: 'https://blog.ljbmxsm.com',
        width: 160,
        height: 51,
      },
      copyright: `版权所有 © ${new Date().getFullYear()} mxsm(蚂蚁背大象). 使用 Docusaurus 构建.`,
    },
    tagManager: {
      trackingID: 'GTM-TKMGCBC',
    },
    prism: {
      theme: { plain: {}, styles: [] },
      // https://github.com/FormidableLabs/prism-react-renderer/blob/master/src/vendor/prism/includeLangs.js
      additionalLanguages: ['shell-session', 'http'],
    },
    algolia: {
      appId: 'O9QSL985BS',
      apiKey: 'ceb5366064b8fbf70959827cf9f69227',
      indexName: 'ionicframework',
      contextualSearch: true,
    },
  },
  plugins: [
    'docusaurus-plugin-sass',
    [
      'docusaurus-plugin-module-alias',
      {
        alias: {
          'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
          react: path.resolve(__dirname, './node_modules/react'),
          'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
          '@components': path.resolve(__dirname, './src/components'),
        },
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        sidebarPath: require.resolve('./sidebars.js'),
        editUrl: ({ versionDocsDirPath, docPath, locale }) => {
/*          if (locale != 'en') {
            return 'https://crowdin.com/project/ionic-docs';
          }
          if ((match = docPath.match(/api\/(.*)\.md/)) != null) {
            return `https://github.com/ionic-team/ionic-docs/tree/main/docs/api/${match[1]}.md`;
          }
          if ((match = docPath.match(/cli\/commands\/(.*)\.md/)) != null) {
            return `https://github.com/ionic-team/ionic-cli/edit/develop/packages/@ionic/cli/src/commands/${match[1].replace(
              '-',
              '/'
            )}.ts`;
          }
          if ((match = docPath.match(/native\/(.*)\.md/)) != null) {
            return `https://github.com/ionic-team/ionic-native/edit/master/src/@awesome-cordova-plugins/plugins/${match[1]}/index.ts`;
          }*/
          return `https://github.com/mxsm/mxsm-website/edit/develop/${versionDocsDirPath}/${docPath}`;
        },
        exclude: ['README.md'],
        lastVersion: 'current',
        versions: {
          current: {
            label: 'v6',
            banner: 'none',
          },
        },
      },
    ],
    '@docusaurus/plugin-content-pages',
    '@docusaurus/plugin-debug',
    '@docusaurus/plugin-sitemap',
    '@ionic-internal/docusaurus-plugin-tag-manager',
    function (context, options) {
      return {
        name: 'ionic-docs-ads',
        async loadContent() {
          const repoName = 'ionicframeworkcom';
          const endpoint = prismic.getEndpoint(repoName);
          const client = prismic.createClient(endpoint, {
            fetch,
          });

          return await client.getByType('docs_ad');
        },
        async contentLoaded({ content, actions: { setGlobalData, addRoute } }) {
          return setGlobalData({ prismicAds: content.results });
        },
      };
    },
  ],
  themes: [
    [
      //overriding the standard docusaurus-theme-classic to provide custom schema
      path.resolve(__dirname, 'docusaurus-theme-classic'),
      {
        customCss: [
          require.resolve('./node_modules/modern-normalize/modern-normalize.css'),
          require.resolve('./node_modules/@ionic-internal/ionic-ds/dist/tokens/tokens.css'),
          require.resolve('./src/styles/custom.scss'),
        ],
      },
    ],
    path.resolve(__dirname, './node_modules/@docusaurus/theme-search-algolia'),
  ],
  customFields: {},
};
