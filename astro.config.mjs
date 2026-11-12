// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const tutorialSidebar = [
	{
		label: 'Introduction',
		translations: {
			'zh-CN': '简介',
			ja: 'はじめに',
			es: 'Introducción',
		},
		slug: 'tutorials',
	},
	{
		label: 'Getting started',
		translations: {
			'zh-CN': '入门',
			ja: 'スタートガイド',
			es: 'Primeros pasos',
		},
		autogenerate: { directory: 'tutorials/getting-started' },
	},
	{
		label: 'Language',
		translations: {
			'zh-CN': '语法',
			ja: '言語',
			es: 'Lenguaje',
		},
		autogenerate: { directory: 'tutorials/language' },
	},
	{
		label: 'Peripherals',
		translations: {
			'zh-CN': '外设',
			ja: 'ペリフェラル',
			es: 'Periféricos',
		},
		autogenerate: { directory: 'tutorials/peripherals' },
	},
	{
		label: 'Reference',
		translations: {
			'zh-CN': '参考',
			ja: 'リファレンス',
			es: 'Referencia',
		},
		autogenerate: { directory: 'tutorials/reference' },
	},
];

// https://astro.build/config
export default defineConfig({
	site: 'https://stmpy.org',
	integrations: [
		starlight({
			title: 'StmPy Studio',
			description: 'Desktop IDE for programming STM32 boards in Python syntax.',
			favicon: '/favicon.svg',
			customCss: ['./src/styles/custom.css'],
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				'zh-cn': { label: '简体中文', lang: 'zh-CN' },
				ja: { label: '日本語', lang: 'ja' },
				es: { label: 'Español', lang: 'es' },
			},
			social: [
				{
					icon: 'github',
					label: 'StmPy Studio',
					href: 'https://github.com/stmpy-org/stmpy-studio',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/stmpy-org/stmpy.org/edit/master/',
			},
			sidebar: [...tutorialSidebar],
			components: {
				Head: './src/components/overrides/Head.astro',
				Header: './src/components/overrides/Header.astro',
				SiteTitle: './src/components/overrides/SiteTitle.astro',
				Hero: './src/components/overrides/Hero.astro',
			},
		}),
	],
});
