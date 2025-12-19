import fs from 'fs';
import path from 'path';

function walk(dir, results) {
    let list;
    try {
        list = fs.readdirSync(dir);
    } catch (e) {
        return;
    }

    list.forEach(file => {
        const filePath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(filePath);
        } catch (e) {
            return;
        }

        if (stat && stat.isDirectory()) {
            // Avoid massive recursion if possible
            if (!filePath.includes('AppData') || filePath.includes('npm-cache')) {
                walk(filePath, results);
            }
        } else {
            if (file === 'workflow-state.json') {
                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const json = JSON.parse(data);
                    if (json.history && json.history.length > 0) {
                        results.push({ path: filePath, count: json.history.length });
                    }
                } catch (e) { }
            }
        }
    });
}

const results = [];
console.log('Searching C:/Users/DHIKA ... this might take a bit');
walk('C:/Users/DHIKA', results);
console.log('Results:', JSON.stringify(results, null, 2));
process.exit(0);
