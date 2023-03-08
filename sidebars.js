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
    rocketmq5: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'rocketmq/rocketmq5/index',
            ],
        },
        {
            type: 'category',
            label: 'Quick Start',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/01-quick-start', // Generate section automatically based on files
                },
            ],
        },
/*        {
            type: 'category',
            label: 'NameServer',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/02-nameserver', // Generate section automatically based on files
                },
            ],
        },*/
/*        {
            type: 'category',
            label: 'Client',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/03-client', // Generate section automatically based on files
                },
            ],
        },*/
        {
            type: 'category',
            label: 'Broker',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq5/04-broker', // Generate section automatically based on files
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
                    dirName: 'rocketmq/rocketmq5/05-controller', // Generate section automatically based on files
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
                    dirName: 'rocketmq/rocketmq5/06-proxy', // Generate section automatically based on files
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
                'rocketmq/rocketmq4/index',
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
            label: 'consumer',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq4/consumer', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'producer',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'rocketmq/rocketmq4/producer', // Generate section automatically based on files
                },
            ],
        },

    ],
    springframework: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'spring/spring-framework/index',
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

    springboot: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'spring/spring-boot/index',
            ],
        },
        {
            type: 'category',
            label: 'Spring boot Samples',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-boot/samples', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Spring boot核心源码分析',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-boot/core-source-analysis', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Spring boot注解源码分析',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-boot/annotation-source-analysis', // Generate section automatically based on files
                },
            ],
        },
/*        {
            type: 'category',
            label: 'Spring boot自定义组件',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-boot/custom-component', // Generate section automatically based on files
                },
            ],
        },*/
    ],
    springcloud: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'spring/spring-cloud/index',
            ],
        },
        {
            type: 'category',
            label: 'Gateway',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'spring/spring-cloud/spring-cloud-gateway', // Generate section automatically based on files
                },
            ],
        },
    ],
    javase: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'java/java-se/index'
            ],
        },
        {
            type: 'category',
            label: 'JVM',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-se/JVM', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Lock',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-se/lock', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Thread',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-se/concurrencemultithreading', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'IO',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-se/javaio', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Source Code Analysis',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-se/jdksourcereading', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Others',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-se/others', // Generate section automatically based on files
                },
            ],
        },
    ],
    javaweb: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'java/java-web/index'
            ],
        },
        {
            type: 'category',
            label: 'Tomcat',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-web/tomcat', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Servlet',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-web/servlet', // Generate section automatically based on files
                },
            ],
        },
    ],

    javatools: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'java/java-tools/index'
            ],
        },
        {
            type: 'category',
            label: 'async-profiler',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'java/java-tools/async-profiler', // Generate section automatically based on files
                },
            ],
        },
    ],

    netty: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'netty/index'
            ],
        },
        {
            type: 'category',
            label: 'Introduction',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'netty/netty-introduction', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Source Code Analysis',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'netty/netty-source-code-analysis', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'FAQ',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'netty/netty-faq', // Generate section automatically based on files
                },
            ],
        },
    ],

    redis: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'redis/index'
            ],
        },
        {
            type: 'category',
            label: 'Redis Base',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'redis/base', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'Redis Cluster',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'redis/cluster', // Generate section automatically based on files
                },
            ],
        },
    ],

    docker: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'docker/index'
            ],
        },
        {
            type: 'category',
            label: 'Docker Base',
            collapsed: false,
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'docker/base', // Generate section automatically based on files
                },
            ],
        },
    ],

    developTools: [
        {
            type: 'category',
            label: 'Overview',
            collapsed: true,
            items: [
                'others/tools/overview'
            ],
        },
        {
            type: 'category',
            label: 'Git',
            collapsed: false,
/*            link: {
                type: 'doc',
                id: 'others/tools/git/index',
            },*/
            link: {
                type: 'generated-index',
                title: 'Git',
                slug: '/others/tools/git',
            },
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'others/tools/git', // Generate section automatically based on files
                },
            ],
        },
        {
            type: 'category',
            label: 'IDEA',
            collapsed: false,
            link: {type: 'doc', id: 'others/tools/sidebar/idea/index'},
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'others/tools/idea', // Generate section automatically based on files
                },
            ],
        },
    ],

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
