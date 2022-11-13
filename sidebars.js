/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
    // By default, Docusaurus generates a sidebar from the docs folder structure
    tutorialSidebar: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'intro',
            ],
        }
    ],
    rocketmq5: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'rocketmq5',
            ],
        },
        {
            type: 'category',
            label: 'Quick Start',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/quick-start', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'NameServer',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/nameserver', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Broker',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/broker', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Client',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/client', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Controller',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/controller', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Proxy',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/proxy', // Generate section automatically based on files
                },
            ],
        }
    ],
    rocketmq4: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'rocketmq4',
            ],
        },
        {
            type: 'category',
            label: 'Quick Start',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq4/quick-start', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'NameServer',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq4/nameserver', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Broker',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq4/broker', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Client',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq4/client', // Generate section automatically based on files
                },
            ],
        }
    ],
    springframework: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'spring-framework',
            ],
        },
        {
            type: 'category',
            label: 'Spring framework核心源码分析',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-framework/core-source-analysis', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Spring framework注解源码分析',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-framework/core-source-analysis', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Spring framework Web源码分析',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-framework/web-source-analysis', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Spring framework AOP源码分析',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-framework/aop-source-analysis', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Spring framework自定义组件拓展',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-framework/custom-component-extensions', // Generate section automatically based on files
                },
            ],
        }
    ],

/*    springboot: [],

    springcloud: [],*/

    others: [
        {
            type: 'category',
            label: '博客搭建',
            collapsed: true,
            items: [
                'others/blog-building/blog-building',
            ],
        },
    ],
    // But you can create a sidebar manually
    /*
    tutorialSidebar: [
      'intro',
      'hello',
      {
        type: 'category',
        label: 'Tutorial',
        items: ['tutorial-basics/create-a-document'],
      },
    ],
     */
};

module.exports = sidebars;
