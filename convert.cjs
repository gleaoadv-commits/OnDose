const fs = require('fs');
const path = require('path');

async function convertFile(filePath, srcDir) {
    let content = fs.readFileSync(filePath, 'utf8');
    const dirName = path.dirname(filePath);

    // Calculate how many levels deep we are from src
    const relativeFromSrc = path.relative(srcDir, dirName);
    let prefix = '';

    if (relativeFromSrc === '') {
        prefix = './';
    } else {
        const levels = relativeFromSrc.split(path.sep).length;
        prefix = '../'.repeat(levels);
    }

    const newContent = content.replace(/(['"])@\//g, `$1${prefix}`);

    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Converted: ${filePath} (prefix: ${prefix})`);
    }
}

async function walk(dir, srcDir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            await walk(fullPath, srcDir);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            await convertFile(fullPath, srcDir);
        }
    }
}

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');

console.log(`Starting conversion in ${srcDir}...`);
walk(srcDir, srcDir).then(() => {
    console.log('Conversion complete.');
}).catch(err => {
    console.error('Error during conversion:', err);
});
