const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const requiredFiles = ['src/assets/styles.scss', 'src/assets/tailwind.css'];

const hasRequiredAssets = () => requiredFiles.every((file) => existsSync(path.join(rootDir, file)));

if (hasRequiredAssets()) {
    process.exit(0);
}

const missingFiles = requiredFiles.filter((file) => !existsSync(path.join(rootDir, file)));

if (!existsSync(path.join(rootDir, '.git')) || !existsSync(path.join(rootDir, '.gitmodules'))) {
    console.error(`Missing required asset files: ${missingFiles.join(', ')}`);
    console.error('Initialize the src/assets submodule, or use a source archive that includes its contents.');
    process.exit(1);
}

console.log(`Missing required asset files: ${missingFiles.join(', ')}`);
console.log('Initializing src/assets git submodule...');

const result = spawnSync('git', ['submodule', 'update', '--init', '--recursive', 'src/assets'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32'
});

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}

if (!hasRequiredAssets()) {
    console.error(`Asset submodule initialized, but required files are still missing: ${missingFiles.join(', ')}`);
    process.exit(1);
}
