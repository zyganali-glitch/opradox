
const fs = require('fs');
const path = require('path');

const catalogPath = path.join('backend', 'config', 'scenarios_catalog.json');
const appDir = path.join('backend', 'app');

try {
    const data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const incomplete = [];

    data.forEach(entry => {
        const issues = [];
        if (!entry.params || entry.params.length === 0) issues.push("Missing params");
        if (!entry.help_tr) issues.push("Missing help_tr");

        if (entry.implementation && entry.implementation.module) {
            let mod = entry.implementation.module;
            if (mod.startsWith('app.')) {
                let rel = mod.replace('app.', '').replace(/\./g, '/') + '.py';
                let full = path.join(appDir, rel);
                if (!fs.existsSync(full)) {
                    issues.push(`Missing file: ${rel}`);
                }
            }
        } else {
            issues.push("Missing implementation config");
        }

        if (issues.length > 0) {
            incomplete.push({ id: entry.id, title: entry.title_tr, issues: issues });
        }
    });

    console.log(JSON.stringify(incomplete, null, 2));
} catch (e) {
    console.error(e);
}
