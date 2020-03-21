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
    setCookieNames(projectName);
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
function promiseSpawn(command, args) {
    return new Promise((resolve, reject) => {
        child_process_1.default
            .spawn(command, args, { shell: true, stdio: 'inherit' })
            .on('close', code => (code === 0 ? resolve() : reject()));
    });
}
function setProxyConfig() {
    const proxyConfigFile = path_1.default.resolve(__dirname, '../project/frontend/proxy.conf.json');
    fs_1.default.copyFileSync(proxyConfigFile, './frontend/proxy.conf.json');
    const angularJson = JSON.parse(fs_1.default.readFileSync('./frontend/angular.json', { encoding: 'utf-8' }));
    angularJson.projects.app.architect.serve.options.proxyConfig =
        'proxy.conf.json';
    fs_1.default.writeFileSync('./frontend/angular.json', JSON.stringify(angularJson, null, 2));
}
function setCookieNames(projectName) {
    fs_1.default.appendFileSync('./backend/backend/settings.py', `

# Cookie Names
SESSION_COOKIE_NAME = '${projectName}-sessionid'
CSRF_COOKIE_NAME = '${projectName}-csrf'
  `);
}
