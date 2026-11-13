export type UiLocale = 'en' | 'zh-cn' | 'ja' | 'es';

const strings = {
	en: {
		downloadHeading: 'Download StmPy Studio',
		downloadLead:
			'Desktop IDE with the StmPy compiler, toolchain and flasher bundled. Pick your platform.',
		versionLabel: 'Version',
		bundledLabel: 'Bundled stmpy',
		releaseNotes: 'Release notes',
		placeholderNote:
			'Installer links point at dl.stmpy.org. Placeholder objects may 404 until R2 is populated.',
		macosHintTitle: 'macOS note',
		linuxHintTitle: 'Linux note',
		homeTagline: 'Program STM32 boards in Python syntax — from one desktop IDE.',
		homeDesc:
			'StmPy Studio edits, builds and flashes firmware. StmPy translates your Python-syntax program to C on the STM32 HAL, so it runs as fast as hand-written C.',
		ctaDownload: 'Download Studio',
		ctaTutorials: 'Read the tutorials',
		featureEditor: 'Editor + language server',
		featureEditorBody: 'Monaco with completion, hover and diagnostics for your chip’s pins.',
		featureBuild: 'One-click build & flash',
		featureBuildBody: 'Bundled stmpy, arm-none-eabi-gcc and probe-rs. No separate toolchain hunt.',
		featureClock: 'Clock tree & project wizard',
		featureClockBody: 'New projects pick a chip and clocks, then write a blinking LED in minutes.',
	},
	'zh-cn': {
		downloadHeading: '下载 StmPy Studio',
		downloadLead: '桌面 IDE，内置 StmPy 编译器、工具链和烧录工具。选择你的平台。',
		versionLabel: '版本',
		bundledLabel: '内置 stmpy',
		releaseNotes: '发行说明',
		placeholderNote: '安装包链接指向 dl.stmpy.org。在 R2 放好文件之前，占位对象可能返回 404。',
		macosHintTitle: 'macOS 说明',
		linuxHintTitle: 'Linux 说明',
		homeTagline: '用 Python 语法给 STM32 写固件——在一个桌面 IDE 里完成。',
		homeDesc:
			'StmPy Studio 负责编辑、编译和烧录。StmPy 把 Python 语法的程序翻译成基于 STM32 HAL 的 C，跑起来和手写 C 一样快。',
		ctaDownload: '下载 Studio',
		ctaTutorials: '阅读教程',
		featureEditor: '编辑器与语言服务',
		featureEditorBody: 'Monaco 补全、悬停和诊断，引脚参数会列出当前芯片可用引脚。',
		featureBuild: '一键编译与烧录',
		featureBuildBody: '内置 stmpy、arm-none-eabi-gcc 和 probe-rs，不用再找工具链。',
		featureClock: '时钟树与工程向导',
		featureClockBody: '新建工程选芯片和时钟，几分钟就能写出闪灯程序。',
	},
	ja: {
		downloadHeading: 'StmPy Studio をダウンロード',
		downloadLead:
			'StmPy コンパイラ、ツールチェーン、書き込みツール同梱のデスクトップ IDE。プラットフォームを選んでください。',
		versionLabel: 'バージョン',
		bundledLabel: '同梱 stmpy',
		releaseNotes: 'リリースノート',
		placeholderNote:
			'インストーラは dl.stmpy.org を指します。R2 に置くまではプレースホルダで 404 になることがあります。',
		macosHintTitle: 'macOS の注意',
		linuxHintTitle: 'Linux の注意',
		homeTagline: 'Python 構文で STM32 を書く——ひとつのデスクトップ IDE で。',
		homeDesc:
			'StmPy Studio は編集・ビルド・書き込みまで。StmPy は Python 構文を STM32 HAL 上の C に翻訳し、手書き C と同じ速さで動きます。',
		ctaDownload: 'Studio を入手',
		ctaTutorials: 'チュートリアルを読む',
		featureEditor: 'エディタと language server',
		featureEditorBody: 'Monaco の補完・ホバー・診断。ピン引数ではチップのピンが出ます。',
		featureBuild: 'ワンクリックでビルド＆書き込み',
		featureBuildBody: 'stmpy、arm-none-eabi-gcc、probe-rs 同梱。別途ツールチェーンは不要です。',
		featureClock: 'クロックツリーとウィザード',
		featureClockBody: '新規プロジェクトでチップとクロックを選び、すぐに LED 点滅を書けます。',
	},
	es: {
		downloadHeading: 'Descargar StmPy Studio',
		downloadLead:
			'IDE de escritorio con el compilador StmPy, la toolchain y el flasher incluidos. Elige tu plataforma.',
		versionLabel: 'Versión',
		bundledLabel: 'stmpy incluido',
		releaseNotes: 'Notas de la versión',
		placeholderNote:
			'Los instaladores apuntan a dl.stmpy.org. Los objetos de demostración pueden devolver 404 hasta poblar R2.',
		macosHintTitle: 'Nota para macOS',
		linuxHintTitle: 'Nota para Linux',
		homeTagline: 'Programa STM32 con sintaxis Python — en un solo IDE de escritorio.',
		homeDesc:
			'StmPy Studio edita, compila y flashea. StmPy traduce tu programa a C sobre el HAL de STM32, tan rápido como C a mano.',
		ctaDownload: 'Descargar Studio',
		ctaTutorials: 'Leer tutoriales',
		featureEditor: 'Editor y language server',
		featureEditorBody: 'Monaco con completado, hover y diagnósticos; pines del chip en los argumentos.',
		featureBuild: 'Compilar y flashear en un clic',
		featureBuildBody: 'Incluye stmpy, arm-none-eabi-gcc y probe-rs. Sin cazar toolchains.',
		featureClock: 'Árbol de reloj y asistente',
		featureClockBody: 'Crea un proyecto, elige chip y relojes, y en minutos tienes un LED parpadeando.',
	},
} as const;

export function ui(locale: string): (typeof strings)['en'] {
	if (locale === 'zh-cn' || locale === 'zh-CN') return strings['zh-cn'];
	if (locale === 'ja') return strings.ja;
	if (locale === 'es') return strings.es;
	return strings.en;
}

export function normalizeLocale(locale: string | undefined): UiLocale {
	if (locale === 'zh-cn' || locale === 'zh-CN') return 'zh-cn';
	if (locale === 'ja' || locale === 'es') return locale;
	return 'en';
}
