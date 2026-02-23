const fs = require('fs');
const path = require('path');

function convertAliases(dir, srcDir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            convertAliases(fullPath, srcDir);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            const dirName = path.dirname(fullPath);
            let relPath = path.relative(dirName, srcDir);

            if (!relPath) {
                relPath = '.';
            }

            const relPrefix = relPath.replace(/\\/g, '/') + '/';

            // Matches import ... from "@/..." or import "@/..."
            const newContent = content.replace(/(['"])@\//g, `$1${relPrefix}`);

            if (newContent !== content) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Converted: ${fullPath}`);
            }
        }
    }
}

const projectRoot = 'C:/Users/Gustavo/Desktop/Gustavo/Aplicativos/OnDose/ondose';
const srcDir = path.join(projectRoot, 'src');
convertAliases(srcDir, srcDir);
console.log('Conversion complete.');
