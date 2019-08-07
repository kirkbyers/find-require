import * as fs from 'fs';
import * as yargs from 'yargs';

const [checkString, ...targetDirs] = yargs.argv._;

const usage = () => {
    return 'ts-node src/find-usage.ts some-string ./some/other/dir';
}

if (!checkString || targetDirs.length < 1) {
    console.error('Please provide a string to check and a path(s) to check usage of');
    console.log(usage());
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

const allFilesInDir = targetDirs.reduce((result, dir) => {
    result.push(...findFilesInDir(dir));
    return result;
}, []);

const checkFileForUsage = (stringMatch: string, filePath: string): boolean => {
    const fileString = fs.readFileSync(filePath).toString();
    return fileString.indexOf(stringMatch) >= 0;
}

const usageList = [];
for (const file of allFilesInDir) {
    if (checkFileForUsage(checkString, file)) {
        usageList.push(file);
    }
}

console.log(usageList);
