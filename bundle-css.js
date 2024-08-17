const fs = require('fs');
const path = require('path');

const cssFiles1 = [
    './public/css/style.css',
    './public/css/dashboard.css',
    './public/css/sidebar.css',
    './public/css/toparea.css',
    './public/css/recent-updates.css',
];

const cssFiles2 = [
    './public/css/searchbar.css',
    './public/css/gridlist.css',
    './public/css/pagination.css'
];

const outputDir = './public/css';
const outputFile1 = 'bundle.style1.css';
const outputFile2 = 'bundle.style2.css';

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

const combinedCss1 = cssFiles1.map(filePath => {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}).join('\n');

const combinedCss2 = cssFiles2.map(filePath => {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}).join('\n');

fs.writeFileSync(path.resolve(outputDir, outputFile1), combinedCss1, 'utf8');
fs.writeFileSync(path.resolve(outputDir, outputFile2), combinedCss2, 'utf8');

console.log('CSS files have been bundled into', outputFile1);
console.log('CSS files have been bundled into', outputFile2);
