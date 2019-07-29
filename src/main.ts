import * as fs from 'fs';
import * as yargs from 'yargs';

const [packagePath, ...targetDirs] = yargs.argv._;

const usage = () => {
    return 'ts-node src/main.ts ./package.json ./some/other/dir';
}

if (!packagePath || targetDirs.length < 1) {
    console.error('Please provide both a path to package.json and target dir to check');
    console.log(usage());
}
const absFilePath = fs.realpathSync(packagePath);
const packageFile = fs.readFileSync(absFilePath);

const { dependencies, devDependencies } = JSON.parse(packageFile.toString());

const packages = [];

if (!!dependencies) {
    packages.push(...Object.keys(dependencies));
}

if (!!devDependencies) {
    packages.push(...Object.keys(devDependencies));
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

const checkFileForUsage = (packageName: string, filePath: string): boolean => {
    const fileString = fs.readFileSync(filePath).toString();
    return fileString.indexOf(`require('${packageName}`) >= 0;
}

const usageMap = packages.reduce((result, item) => {
    if (result[item] === undefined) {
        result[item] = '';
    }
    for (const file of allFilesInDir) {
        if (checkFileForUsage(item, file)) {
            result[item] = file;
            break;
        }
    }
    return result;
}, {});

console.log(usageMap);

const depsUsage = Object.keys(usageMap).reduce((result, key) => {
    if (!usageMap[key]) {
        result.unused.push(key);
        return result;
    }
    result.required[key] = usageMap[key];
    return result;
}, {
    required: {},
    unused: []
});
console.log(depsUsage);
