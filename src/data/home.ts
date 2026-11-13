import type { UiLocale } from './ui';

export type HomeCopy = {
	metaTitle: string;
	metaDescription: string;
	eyebrow: string;
	heroTitle: string;
	heroTagline: string;
	ctaDownload: string;
	ctaTutorials: string;
	whatEyebrow: string;
	whatTitle: string;
	whatBody: string;
	featuresEyebrow: string;
	featuresTitle: string;
	features: { eyebrow: string; title: string; body: string; brand?: boolean }[];
	codeEyebrow: string;
	codeTitle: string;
	codeBody: string;
	stepsEyebrow: string;
	stepsTitle: string;
	steps: { title: string; body: string }[];
	chipsEyebrow: string;
	chipsTitle: string;
	chipsBody: string;
	chipsF1: string;
	chipsF4: string;
	chipsNote: string;
	tutorialsEyebrow: string;
	tutorialsTitle: string;
	tutorialsBody: string;
	tutorialLinks: { href: string; label: string; body: string }[];
	ctaBandEyebrow: string;
	ctaBandTitle: string;
	ctaBandBody: string;
	faqEyebrow: string;
	faqTitle: string;
	faqs: { q: string; a: string }[];
};

const codeSample = `from stmpy import GPIO, delay_ms

led = GPIO("PC13")

def main():
    while True:
        led.toggle()
        delay_ms(500)`;

const copy: Record<UiLocale, HomeCopy> = {
	en: {
		metaTitle: 'StmPy Studio',
		metaDescription:
			'Desktop IDE for programming STM32 microcontrollers in Python syntax. Build and flash with bundled stmpy, toolchain and probe-rs.',
		eyebrow: 'STM32 · PYTHON SYNTAX',
		heroTitle: 'StmPy Studio',
		heroTagline: 'Program STM32 boards in Python syntax — from one desktop IDE.',
		ctaDownload: 'Download Studio',
		ctaTutorials: 'Read the tutorials',
		whatEyebrow: 'WHAT IT IS',
		whatTitle: 'Python syntax, C on the chip',
		whatBody:
			'StmPy translates your program to C on top of the STM32 HAL, compiles it with arm-none-eabi-gcc and produces a .hex file to flash. It runs as fast as hand-written C, with no interpreter on the chip. Mistakes such as a pin used twice or a peripheral the chip does not have are caught at compile time.',
		featuresEyebrow: 'STUDIO',
		featuresTitle: 'Everything in one window',
		features: [
			{
				eyebrow: 'Editor',
				title: 'Editor + language server',
				body: 'Monaco with tabs and a file tree. The StmPy language server gives completion, hover, go to definition and diagnostics — including the pins of your chip inside pin strings.',
			},
			{
				eyebrow: 'Toolchain',
				title: 'One-click build & flash',
				body: 'Each installer bundles stmpy, a trimmed arm-none-eabi-gcc and probe-rs. Build writes a .hex; Flash builds then downloads and resets over ST-Link or any probe probe-rs supports.',
				brand: true,
			},
			{
				eyebrow: 'Project',
				title: 'Wizard & clock tree',
				body: 'New Project picks a chip from the STM32F1 and STM32F4 list, then sets up the clock tree similar to STM32CubeMX. Studio writes the .spp and a main.py.',
			},
			{
				eyebrow: 'More',
				title: 'Serial monitor & settings',
				body: 'A serial monitor shows text or hex with optional timestamps. Settings point at bundled tools or your own stmpy, toolchain and probe-rs paths.',
			},
		],
		codeEyebrow: 'EXAMPLE',
		codeTitle: 'A blinking LED',
		codeBody:
			'Peripheral objects go at the top level. main() is the entry point after the chip is set up. This matches the Blue Pill example in the tutorials (STM32F103C8T6, LED on PC13).',
		stepsEyebrow: 'WORKFLOW',
		stepsTitle: 'Write, build, flash',
		steps: [
			{
				title: 'Write',
				body: 'Create a project, edit main.py in Python syntax, and use completion for pins and peripherals.',
			},
			{
				title: 'Build',
				body: 'Studio runs stmpy build. On success it prints flash and RAM use and the path of the .hex file.',
			},
			{
				title: 'Flash',
				body: 'Flash builds (unless flash-only), then runs probe-rs on the .hex and resets the chip.',
			},
		],
		chipsEyebrow: 'HARDWARE',
		chipsTitle: 'STM32F1 and STM32F4',
		chipsBody:
			'StmPy supports the whole STM32F1 and STM32F4 series. Switching chips usually means changing the part number in the project file.',
		chipsF1: 'STM32F1 — F100–F107 (95 parts, or 125 counting packages)',
		chipsF4:
			'STM32F4 — F401 through F479 lines (149 parts, or 211 counting packages)',
		chipsNote:
			'Pin, peripheral and package data come from ST’s public STM32_open_pin_data. Run stmpy chips for the full list.',
		tutorialsEyebrow: 'LEARN',
		tutorialsTitle: 'Start in the tutorials',
		tutorialsBody: 'Docs ship with StmPy in English and 简体中文.',
		tutorialLinks: [
			{
				href: 'tutorials/getting-started/installation/',
				label: 'Installation',
				body: 'Studio download or command-line stmpy, toolchain and probe-rs.',
			},
			{
				href: 'tutorials/getting-started/first-project/',
				label: 'Your first program',
				body: 'From a new project to a blinking LED on a Blue Pill.',
			},
			{
				href: 'tutorials/language/overview/',
				label: 'Language overview',
				body: 'What the Python-syntax subset supports and how it differs from CPython.',
			},
		],
		ctaBandEyebrow: 'GET STUDIO',
		ctaBandTitle: 'Installers for macOS, Windows and Linux',
		ctaBandBody:
			'Packages include stmpy, a trimmed arm-none-eabi-gcc and probe-rs. English, 简体中文, Japanese and Spanish UI.',
		faqEyebrow: 'FAQ',
		faqTitle: 'Common questions',
		faqs: [
			{
				q: 'Is there a Python interpreter on the microcontroller?',
				a: 'No. StmPy translates to C on the STM32 HAL and compiles with arm-none-eabi-gcc. The chip runs native firmware.',
			},
			{
				q: 'Which boards work?',
				a: 'Any board with a supported STM32F1 or STM32F4 part. The tutorials use a common STM32F103C8T6 Blue Pill as the first example.',
			},
			{
				q: 'Do I need a separate toolchain?',
				a: 'Not with Studio — installers bundle stmpy, arm-none-eabi-gcc and probe-rs. The command-line stmpy package expects you to install the toolchain and a flasher yourself.',
			},
			{
				q: 'How does flashing work?',
				a: 'Studio runs probe-rs on the .hex from the build (ST-Link, J-Link, CMSIS-DAP and other probes probe-rs supports). Flash-only skips the build.',
			},
		],
	},
	'zh-cn': {
		metaTitle: 'StmPy Studio',
		metaDescription: '用 Python 语法给 STM32 写固件的桌面 IDE。内置 stmpy、工具链和 probe-rs。',
		eyebrow: 'STM32 · PYTHON 语法',
		heroTitle: 'StmPy Studio',
		heroTagline: '用 Python 语法给 STM32 写固件——在一个桌面 IDE 里完成。',
		ctaDownload: '下载 Studio',
		ctaTutorials: '阅读教程',
		whatEyebrow: '是什么',
		whatTitle: 'Python 语法，芯片上跑 C',
		whatBody:
			'StmPy 把程序翻译成基于 STM32 HAL 的 C，用 arm-none-eabi-gcc 编译成 .hex 再烧录。跑起来和手写 C 一样快，芯片上没有解释器。引脚冲突、芯片没有的外设等错误在编译时就会报出来。',
		featuresEyebrow: 'STUDIO',
		featuresTitle: '一个窗口里完成',
		features: [
			{
				eyebrow: '编辑器',
				title: '编辑器与语言服务',
				body: 'Monaco 带标签页和文件树。StmPy 语言服务提供补全、悬停、跳转和诊断，引脚字符串里会列出当前芯片可用引脚。',
			},
			{
				eyebrow: '工具链',
				title: '一键编译与烧录',
				body: '安装包内置 stmpy、裁剪版 arm-none-eabi-gcc 和 probe-rs。编译写出 .hex；烧录会先编译（可选手仅烧录），再通过 ST-Link 等 probe-rs 支持的调试器下载并复位。',
				brand: true,
			},
			{
				eyebrow: '工程',
				title: '向导与时钟树',
				body: '新建工程从 STM32F1 / F4 列表选芯片，再配置时钟树（类似 STM32CubeMX）。Studio 会写出 .spp 和 main.py。',
			},
			{
				eyebrow: '更多',
				title: '串口监视与设置',
				body: '串口监视支持文本或十六进制与时间戳。设置可指向内置工具，或你自己的 stmpy、工具链和 probe-rs。',
			},
		],
		codeEyebrow: '示例',
		codeTitle: '闪灯',
		codeBody:
			'外设对象写在文件顶层。main() 在芯片初始化之后作为入口。教程以 Blue Pill（STM32F103C8T6，PC13 上的 LED）为例。',
		stepsEyebrow: '流程',
		stepsTitle: '编写、编译、烧录',
		steps: [
			{ title: '编写', body: '新建工程，用 Python 语法编辑 main.py，用补全选择引脚和外设。' },
			{ title: '编译', body: 'Studio 运行 stmpy build。成功时打印 Flash / RAM 占用和 .hex 路径。' },
			{ title: '烧录', body: '烧录会先编译（除非仅烧录），再用 probe-rs 下载 .hex 并复位芯片。' },
		],
		chipsEyebrow: '硬件',
		chipsTitle: 'STM32F1 与 STM32F4',
		chipsBody: 'StmPy 支持 STM32F1、STM32F4 全系列。换芯片通常只需改工程文件里的型号。',
		chipsF1: 'STM32F1 — F100–F107（95 个型号，计封装 125）',
		chipsF4: 'STM32F4 — F401 至 F479 各产品线（149 个型号，计封装 211）',
		chipsNote: '引脚、外设与封装数据来自 ST 公开的 STM32_open_pin_data。完整列表见 stmpy chips。',
		tutorialsEyebrow: '学习',
		tutorialsTitle: '从教程开始',
		tutorialsBody: '文档随 StmPy 提供英文与简体中文。',
		tutorialLinks: [
			{
				href: 'tutorials/getting-started/installation/',
				label: '安装',
				body: '下载 Studio，或命令行安装 stmpy、工具链与 probe-rs。',
			},
			{
				href: 'tutorials/getting-started/first-project/',
				label: '第一个程序',
				body: '从新建工程到 Blue Pill 上的闪灯。',
			},
			{
				href: 'tutorials/language/overview/',
				label: '语法概览',
				body: 'Python 语法子集支持什么，和 CPython 有何不同。',
			},
		],
		ctaBandEyebrow: '获取 Studio',
		ctaBandTitle: 'macOS、Windows、Linux 安装包',
		ctaBandBody: '内含 stmpy、裁剪版 arm-none-eabi-gcc 与 probe-rs。界面支持英 / 简中 / 日 / 西。',
		faqEyebrow: '常见问题',
		faqTitle: '常见问题',
		faqs: [
			{
				q: '芯片上有 Python 解释器吗？',
				a: '没有。StmPy 翻译成基于 STM32 HAL 的 C，再用 arm-none-eabi-gcc 编译，芯片跑的是原生固件。',
			},
			{
				q: '哪些板子可以用？',
				a: '带有支持的 STM32F1 或 F4 芯片的板子都可以。教程以常见的 STM32F103C8T6 Blue Pill 作为第一个例子。',
			},
			{
				q: '还要自己装工具链吗？',
				a: '用 Studio 不用——安装包已内置 stmpy、arm-none-eabi-gcc 和 probe-rs。只用命令行 stmpy 时需要自己装工具链和烧录工具。',
			},
			{
				q: '烧录怎么做？',
				a: 'Studio 用 probe-rs 下载编译得到的 .hex（支持 ST-Link、J-Link、CMSIS-DAP 等）。「仅烧录」会跳过编译。',
			},
		],
	},
	ja: {
		metaTitle: 'StmPy Studio',
		metaDescription:
			'Python 構文で STM32 を書くデスクトップ IDE。stmpy・ツールチェーン・probe-rs 同梱。',
		eyebrow: 'STM32 · PYTHON SYNTAX',
		heroTitle: 'StmPy Studio',
		heroTagline: 'Python 構文で STM32 を書く——ひとつのデスクトップ IDE で。',
		ctaDownload: 'Studio を入手',
		ctaTutorials: 'チュートリアルを読む',
		whatEyebrow: '概要',
		whatTitle: 'Python 構文、チップ上は C',
		whatBody:
			'StmPy はプログラムを STM32 HAL 上の C に翻訳し、arm-none-eabi-gcc で .hex にして書き込みます。手書き C と同じ速さで、チップ上にインタプリタはありません。ピンの二重使用や無いペリフェラルはコンパイル時に検出されます。',
		featuresEyebrow: 'STUDIO',
		featuresTitle: 'ひとつのウィンドウで',
		features: [
			{
				eyebrow: 'Editor',
				title: 'エディタと language server',
				body: 'タブとファイルツリー付き Monaco。StmPy language server が補完・ホバー・定義ジャンプ・診断を提供し、ピン文字列ではチップのピンを出します。',
			},
			{
				eyebrow: 'Toolchain',
				title: 'ワンクリックでビルド＆書き込み',
				body: 'インストーラに stmpy、縮小版 arm-none-eabi-gcc、probe-rs を同梱。Build で .hex、Flash はビルド後に ST-Link など probe-rs 対応プローブへダウンロードしてリセットします。',
				brand: true,
			},
			{
				eyebrow: 'Project',
				title: 'ウィザードとクロックツリー',
				body: '新規プロジェクトで STM32F1 / F4 からチップを選び、CubeMX 風にクロックを設定。.spp と main.py を書き出します。',
			},
			{
				eyebrow: 'More',
				title: 'シリアルモニタと設定',
				body: 'シリアルはテキスト／hex、タイムスタンプ可。設定で同梱ツールか自分の stmpy・ツールチェーン・probe-rs を指定できます。',
			},
		],
		codeEyebrow: 'EXAMPLE',
		codeTitle: 'LED 点滅',
		codeBody:
			'ペリフェラルはファイル先頭に。main() はセットアップ後の入口。チュートリアルの Blue Pill 例（STM32F103C8T6、PC13）と同じです。',
		stepsEyebrow: 'WORKFLOW',
		stepsTitle: '書いて、ビルド、書き込み',
		steps: [
			{ title: '書く', body: 'プロジェクトを作り、Python 構文で main.py を編集。ピンとペリフェラルは補完で。' },
			{ title: 'ビルド', body: 'Studio が stmpy build を実行。成功時に Flash/RAM 使用量と .hex パスを表示。' },
			{ title: '書き込み', body: 'Flash はビルドのあと（flash-only なら省略）probe-rs で .hex を書き込みリセット。' },
		],
		chipsEyebrow: 'HARDWARE',
		chipsTitle: 'STM32F1 と STM32F4',
		chipsBody: 'StmPy は STM32F1 / F4 全シリーズ対応。チップ切り替えは多くの場合 .spp の型番変更だけです。',
		chipsF1: 'STM32F1 — F100–F107（95 部品、パッケージ込み 125）',
		chipsF4: 'STM32F4 — F401〜F479（149 部品、パッケージ込み 211）',
		chipsNote: 'ピン・ペリフェラル・パッケージは ST 公開の STM32_open_pin_data。一覧は stmpy chips。',
		tutorialsEyebrow: 'LEARN',
		tutorialsTitle: 'チュートリアルから',
		tutorialsBody: 'ドキュメントは英語と簡体字中国語（日本語 UI の Studio でも英語版にフォールバック）。',
		tutorialLinks: [
			{
				href: 'tutorials/getting-started/installation/',
				label: 'Installation',
				body: 'Studio の入手、または CLI の stmpy・ツールチェーン・probe-rs。',
			},
			{
				href: 'tutorials/getting-started/first-project/',
				label: 'Your first program',
				body: '新規プロジェクトから Blue Pill の点滅まで。',
			},
			{
				href: 'tutorials/language/overview/',
				label: 'Language overview',
				body: 'Python 構文サブセットと CPython との違い。',
			},
		],
		ctaBandEyebrow: 'GET STUDIO',
		ctaBandTitle: 'macOS / Windows / Linux',
		ctaBandBody: 'stmpy、縮小版 arm-none-eabi-gcc、probe-rs 同梱。UI は英・簡中・日・西。',
		faqEyebrow: 'FAQ',
		faqTitle: 'よくある質問',
		faqs: [
			{
				q: 'チップ上に Python インタプリタはありますか？',
				a: 'いいえ。STM32 HAL 上の C に翻訳し arm-none-eabi-gcc でコンパイルします。ネイティブファームウェアが動きます。',
			},
			{
				q: 'どのボードが使えますか？',
				a: '対応 STM32F1 / F4 を載せたボード。チュートリアルの最初の例は STM32F103C8T6 Blue Pill です。',
			},
			{
				q: '別途ツールチェーンは必要ですか？',
				a: 'Studio では不要です。CLI の stmpy だけ使う場合はツールチェーンと書き込みツールを自分で入れます。',
			},
			{
				q: '書き込みはどうしますか？',
				a: 'Studio がビルドの .hex を probe-rs で書き込みます（ST-Link など）。flash-only はビルドをスキップします。',
			},
		],
	},
	es: {
		metaTitle: 'StmPy Studio',
		metaDescription:
			'IDE de escritorio para programar STM32 con sintaxis Python. Incluye stmpy, toolchain y probe-rs.',
		eyebrow: 'STM32 · SINTAXIS PYTHON',
		heroTitle: 'StmPy Studio',
		heroTagline: 'Programa STM32 con sintaxis Python — en un solo IDE de escritorio.',
		ctaDownload: 'Descargar Studio',
		ctaTutorials: 'Leer tutoriales',
		whatEyebrow: 'QUÉ ES',
		whatTitle: 'Sintaxis Python, C en el chip',
		whatBody:
			'StmPy traduce el programa a C sobre el HAL de STM32, lo compila con arm-none-eabi-gcc y produce un .hex. Corre tan rápido como C a mano, sin intérprete en el chip. Errores como un pin duplicado o un periférico inexistente se detectan al compilar.',
		featuresEyebrow: 'STUDIO',
		featuresTitle: 'Todo en una ventana',
		features: [
			{
				eyebrow: 'Editor',
				title: 'Editor y language server',
				body: 'Monaco con pestañas y árbol de archivos. El language server de StmPy da completado, hover, ir a definición y diagnósticos — incluidos los pines del chip en cadenas de pin.',
			},
			{
				eyebrow: 'Toolchain',
				title: 'Compilar y flashear en un clic',
				body: 'Cada instalador incluye stmpy, un arm-none-eabi-gcc recortado y probe-rs. Build escribe el .hex; Flash compila y luego descarga y resetea con ST-Link u otra sonda compatible.',
				brand: true,
			},
			{
				eyebrow: 'Proyecto',
				title: 'Asistente y árbol de reloj',
				body: 'Nuevo proyecto elige un chip STM32F1 o F4 y configura el reloj al estilo CubeMX. Studio escribe el .spp y un main.py.',
			},
			{
				eyebrow: 'Más',
				title: 'Monitor serie y ajustes',
				body: 'El monitor serie muestra texto o hex con marcas de tiempo opcionales. Los ajustes apuntan a las herramientas embebidas o a tus rutas.',
			},
		],
		codeEyebrow: 'EJEMPLO',
		codeTitle: 'LED parpadeante',
		codeBody:
			'Los periféricos van al inicio del archivo. main() es el punto de entrada tras el arranque. Coincide con el ejemplo Blue Pill de los tutoriales (STM32F103C8T6, LED en PC13).',
		stepsEyebrow: 'FLUJO',
		stepsTitle: 'Escribir, compilar, flashear',
		steps: [
			{
				title: 'Escribir',
				body: 'Crea un proyecto, edita main.py con sintaxis Python y usa el completado de pines y periféricos.',
			},
			{
				title: 'Compilar',
				body: 'Studio ejecuta stmpy build. Si ok, muestra uso de flash/RAM y la ruta del .hex.',
			},
			{
				title: 'Flashear',
				body: 'Flash compila (salvo flash-only), luego probe-rs descarga el .hex y resetea el chip.',
			},
		],
		chipsEyebrow: 'HARDWARE',
		chipsTitle: 'STM32F1 y STM32F4',
		chipsBody:
			'StmPy cubre toda la serie STM32F1 y STM32F4. Cambiar de chip suele ser solo cambiar el número de parte en el proyecto.',
		chipsF1: 'STM32F1 — F100–F107 (95 partes, o 125 contando encapsulados)',
		chipsF4: 'STM32F4 — líneas F401 a F479 (149 partes, o 211 contando encapsulados)',
		chipsNote:
			'Pines, periféricos y encapsulados vienen de STM32_open_pin_data de ST. Lista completa: stmpy chips.',
		tutorialsEyebrow: 'APRENDER',
		tutorialsTitle: 'Empieza por los tutoriales',
		tutorialsBody: 'La documentación de StmPy está en inglés y chino; en español verás el contenido en inglés.',
		tutorialLinks: [
			{
				href: 'tutorials/getting-started/installation/',
				label: 'Installation',
				body: 'Descarga de Studio o stmpy por línea de comandos, toolchain y probe-rs.',
			},
			{
				href: 'tutorials/getting-started/first-project/',
				label: 'Your first program',
				body: 'De un proyecto nuevo a un LED en una Blue Pill.',
			},
			{
				href: 'tutorials/language/overview/',
				label: 'Language overview',
				body: 'Qué soporta el subconjunto de sintaxis Python y cómo difiere de CPython.',
			},
		],
		ctaBandEyebrow: 'OBTENER STUDIO',
		ctaBandTitle: 'Instaladores para macOS, Windows y Linux',
		ctaBandBody:
			'Incluyen stmpy, arm-none-eabi-gcc recortado y probe-rs. UI en inglés, chino, japonés y español.',
		faqEyebrow: 'FAQ',
		faqTitle: 'Preguntas frecuentes',
		faqs: [
			{
				q: '¿Hay un intérprete Python en el microcontrolador?',
				a: 'No. StmPy traduce a C sobre el HAL y compila con arm-none-eabi-gcc. El chip ejecuta firmware nativo.',
			},
			{
				q: '¿Qué placas sirven?',
				a: 'Cualquiera con un STM32F1 o F4 soportado. Los tutoriales usan una Blue Pill STM32F103C8T6 como primer ejemplo.',
			},
			{
				q: '¿Hace falta una toolchain aparte?',
				a: 'Con Studio no: el instalador la trae. Con solo stmpy por CLI debes instalar toolchain y flasher tú.',
			},
			{
				q: '¿Cómo se flashea?',
				a: 'Studio usa probe-rs sobre el .hex del build (ST-Link y otras sondas compatibles). Flash-only omite el build.',
			},
		],
	},
};

export const BLINK_SAMPLE = codeSample;

export function homeCopy(locale: string): HomeCopy {
	if (locale === 'zh-cn' || locale === 'zh-CN') return copy['zh-cn'];
	if (locale === 'ja') return copy.ja;
	if (locale === 'es') return copy.es;
	return copy.en;
}
