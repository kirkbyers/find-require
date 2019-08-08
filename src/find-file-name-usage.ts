import * as fs from 'fs';
import * as yargs from 'yargs';

const [pathToOtherFile, ...targetDirs] = yargs.argv._;

if (!pathToOtherFile || targetDirs.length < 1) {
    throw new Error('Please provide the correct arg.');
}

const findFilesInDir = (pathToDirectory: string): string[] => {
    const result = [];
    const fileNames = fs.readdirSync(pathToDirectory);
    fileNames.forEach((file) => {
        const fullFilePath = `${pathToDirectory}/${file}`;
        const fileStats = fs.statSync(fullFilePath);
        if (fileStats.isDirectory()) {
            const subFiles = findFilesInDir(fullFilePath);
            result.push(...subFiles);
        } else {
            result.push(fullFilePath);
        }
    });
    return result;
};

const moduleFiles = findFilesInDir(pathToOtherFile).map((item) => {
    const filePathArray = item.split('/');
    const fileName = filePathArray[filePathArray.length - 1]
    return fileName.slice(0, fileName.length - 3)
});

const allFilesInDir = targetDirs.reduce((result, dir) => {
    result.push(...findFilesInDir(dir));
    return result;
}, []);

const checkFileForUsage = (stringMatch: string, filePath: string): boolean => {
    const fileString = fs.readFileSync(filePath).toString();
    return fileString.indexOf(stringMatch) >= 0;
}

const usageMap = moduleFiles.reduce((result, item) => {
    for (const file of allFilesInDir) {
        if (checkFileForUsage(item, file)) {
            if (result[item] === undefined) {
                result[item] = [];
            }
            result[item].push(file);
        }
    }
    return result;
}, {});

console.log(usageMap);

// const depsUsage = Object.keys(usageMap).reduce((result, key) => {
//     if (!usageMap[key]) {
//         result.unused.push(key);
//         return result;
//     }
//     result.required[key] = usageMap[key];
//     return result;
// }, {
//         required: {},
//         unused: []
//     });
// console.log(depsUsage);
