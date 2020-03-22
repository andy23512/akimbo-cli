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
const path_1 = __importDefault(require("path"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    const projectName = getProjectName();
    makeAndChangeDirectory(projectName);
    yield promiseSpawn('git', ['init']);
    yield promiseSpawn('ctore', ['frontend']);
    yield promiseSpawn(path_1.default.resolve(__dirname, '../setup-django.sh'), [
        projectName
    ]);
    setProxyConfig();
    setBackendSettings(projectName);
    setBackendFiles();
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
function setProxyConfig() {
    const proxyConfigFile = path_1.default.resolve(__dirname, '../project/frontend/proxy.conf.json');
    fs_1.default.copyFileSync(proxyConfigFile, './frontend/proxy.conf.json');
    const angularJson = JSON.parse(fs_1.default.readFileSync('./frontend/angular.json', { encoding: 'utf-8' }));
    angularJson.projects.app.architect.serve.options.proxyConfig =
        'proxy.conf.json';
    fs_1.default.writeFileSync('./frontend/angular.json', JSON.stringify(angularJson, null, 2));
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
    const backendUrlsFile = path_1.default.resolve(__dirname, '../project/backend/backend/urls.py');
    fs_1.default.copyFileSync(backendUrlsFile, './backend/backend/urls.py');
    const backendViewsFile = path_1.default.resolve(__dirname, '../project/backend/backend/views.py');
    fs_1.default.copyFileSync(backendViewsFile, './backend/backend/views.py');
    const backendSchemaFile = path_1.default.resolve(__dirname, '../project/backend/backend/schema.py');
    fs_1.default.copyFileSync(backendViewsFile, './backend/backend/schema.py');
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
