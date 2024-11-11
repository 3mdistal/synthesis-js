import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

build({
	entryPoints: [join(__dirname, 'src/lib/synth-processor.ts')],
	outfile: join(__dirname, 'static/synth-processor.js'),
	bundle: true,
	format: 'iife',
	target: 'es2020',
	platform: 'browser'
}).catch(() => process.exit(1));
