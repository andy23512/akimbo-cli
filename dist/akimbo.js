"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const gitignore = require('gitignore');
(() => __awaiter(void 0, void 0, void 0, function* () {
    const projectName = getProjectName();
    makeAndChangeDirectory(projectName);
    yield promiseSpawn('git', ['init']);
    yield promiseSpawn('ctore', ['frontend']);
    yield promiseSpawn(path_1.resolve(__dirname, '../setup-django.sh'), [
        projectName
    ]);
    yield promiseSpawn('yarn', [
        'add',
        '@graphql-codegen/cli',
        '@graphql-codegen/typescript-apollo-angular',
        '@graphql-codegen/typescript-operations'
    ], './frontend');
    yield promiseSpawn('ng', ['add', 'apollo-angular'], './frontend');
    setFrontendSettings();
    setBackendSettings(projectName);
    yield setBackendFiles();
    setDockerFiles();
    yield runSchematics(projectName);
    yield initialCommit();
}))();
function getProjectName() {
    const projectName = process.argv[2];
    if (!projectName) {
        throw new Error('Error: No project name is given\nUsage: akimbo <project-name>');
    }
    else if (/[^A-Za-z0-9-]/.test(projectName)) {
        throw new Error('Error: Project name should only contain A-Z, a-z, 0-9 and hyphen');
    }
    return projectName;
}
function makeAndChangeDirectory(projectName) {
    fs_1.default.mkdirSync(projectName);
    process.chdir(projectName);
}
function setFrontendSettings() {
    const angularJson = JSON.parse(fs_1.default.readFileSync('./frontend/angular.json', { encoding: 'utf-8' }));
    angularJson.projects.app.architect.serve.options.proxyConfig =
        'proxy.conf.json';
    fs_1.default.writeFileSync('./frontend/angular.json', JSON.stringify(angularJson, null, 2));
    const packageJSON = JSON.parse(fs_1.default.readFileSync('./frontend/package.json', { encoding: 'utf-8' }));
    packageJSON.scripts.codegen = 'gql-gen --config codegen.yml';
    packageJSON.scripts.start = 'ng serve --host 0.0.0.0 --poll=2000';
    fs_1.default.writeFileSync('./frontend/package.json', JSON.stringify(packageJSON, null, 2));
    copyFileIntoProject('frontend/proxy.conf.json');
    copyFileIntoProject('frontend/apollo.config.js');
    copyFileIntoProject('frontend/codegen.yml');
    copyFileIntoProject('frontend/Dockerfile');
}
function setBackendSettings(projectName) {
    return __awaiter(this, void 0, void 0, function* () {
        fs_1.default.appendFileSync('./backend/backend/settings.py', `

# Cookie Names
SESSION_COOKIE_NAME = '${projectName}-sessionid'
CSRF_COOKIE_NAME = '${projectName}-csrf'

# django-graphene
GRAPHENE = {
    'SCHEMA': 'backend.schema.schema'
}
  `);
    });
}
function setBackendFiles() {
    copyFileIntoProject('backend/backend/urls.py');
    copyFileIntoProject('backend/backend/views.py');
    copyFileIntoProject('backend/backend/schema.py');
    copyFileIntoProject('backend/Dockerfile');
    return new Promise((resolve, reject) => {
        gitignore.writeFile({ type: 'Python', file: fs_1.default.createWriteStream('backend/.gitignore') }, (err) => {
            err ? reject(err) : resolve();
        });
    });
}
function setDockerFiles() {
    copyFileIntoProject('docker-compose.yml');
    copyFileIntoProject('Makefile');
}
function runSchematics(projectName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield promiseSpawn('yarn', ['add', 'andy23512/akimbo-schematics'], './frontend');
        yield promiseSpawn('ng', ['g', 'akimbo-schematics:ng-add', projectName], './frontend');
    });
}
function initialCommit() {
    return __awaiter(this, void 0, void 0, function* () {
        yield promiseSpawn('git', ['add', '.']);
        yield promiseSpawn('git', [
            'commit',
            '-m',
            '"Initial commit from akimbo-cli"'
        ]);
    });
}
function promiseSpawn(command, args, cwd) {
    const options = { shell: true, stdio: 'inherit' };
    if (cwd) {
        options.cwd = cwd;
    }
    return new Promise((resolve, reject) => {
        child_process_1.default
            .spawn(command, args, options)
            .on('close', code => (code === 0 ? resolve() : reject()));
    });
}
function copyFileIntoProject(path) {
    const file = path_1.resolve(__dirname, `../project/`, path);
    const dest = path_1.resolve(path);
    fs_1.default.copyFileSync(file, dest);
}
