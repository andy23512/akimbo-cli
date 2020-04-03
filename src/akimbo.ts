import child_process from 'child_process';
import fs from 'fs';
import path from 'path';

(async () => {
  const projectName = getProjectName();
  makeAndChangeDirectory(projectName);
  await promiseSpawn('git', ['init']);
  await promiseSpawn('ctore', ['frontend']);
  await promiseSpawn(path.resolve(__dirname, '../setup-django.sh'), [
    projectName
  ]);
  await promiseSpawn(
    'yarn',
    [
      'add',
      '@graphql-codegen/cli',
      '@graphql-codegen/typescript-apollo-angular',
      '@graphql-codegen/typescript-operations'
    ],
    './frontend'
  );
  await promiseSpawn('ng', ['add', 'apollo-angular']);
  setFrontendSettings();
  setBackendSettings(projectName);
  setBackendFiles();
  await runSchematics(projectName);
  await initialCommit();
})();

function getProjectName() {
  const projectName = process.argv[2];
  if (!projectName) {
    throw new Error(
      'Error: No project name is given\nUsage: akimbo <project-name>'
    );
  } else if (/[^A-Za-z0-9-]/.test(projectName)) {
    throw new Error(
      'Error: Project name should only contain A-Z, a-z, 0-9 and hyphen'
    );
  }
  return projectName;
}

function makeAndChangeDirectory(projectName: string) {
  fs.mkdirSync(projectName);
  process.chdir(projectName);
}

function setFrontendSettings() {
  const proxyConfigFile = path.resolve(
    __dirname,
    '../project/frontend/proxy.conf.json'
  );
  fs.copyFileSync(proxyConfigFile, './frontend/proxy.conf.json');
  const angularJson = JSON.parse(
    fs.readFileSync('./frontend/angular.json', { encoding: 'utf-8' })
  );
  angularJson.projects.app.architect.serve.options.proxyConfig =
    'proxy.conf.json';
  fs.writeFileSync(
    './frontend/angular.json',
    JSON.stringify(angularJson, null, 2)
  );
  const packageJSON = JSON.parse(
    fs.readFileSync('./frontend/package.json', { encoding: 'utf-8' })
  );
  packageJSON.scripts.codegen = 'gql-gen --config codegen.yml';
  fs.writeFileSync(
    './frontend/package.json',
    JSON.stringify(packageJSON, null, 2)
  );
  const apolloConfigFile = path.resolve(
    __dirname,
    '../project/frontend/apollo.config.js'
  );
  fs.copyFileSync(apolloConfigFile, './frontend/apollo.config.js');
  const codeGenConfigFile = path.resolve(
    __dirname,
    '../project/frontend/codegen.yml'
  );
  fs.copyFileSync(codeGenConfigFile, './frontend/codegen.yml');
}

async function setBackendSettings(projectName: string) {
  fs.appendFileSync(
    './backend/backend/settings.py',
    `

# Cookie Names
SESSION_COOKIE_NAME = '${projectName}-sessionid'
CSRF_COOKIE_NAME = '${projectName}-csrf'

# django-graphene
GRAPHENE = {
    'SCHEMA': 'backend.schema.schema'
}
  `
  );
}

function setBackendFiles() {
  const backendUrlsFile = path.resolve(
    __dirname,
    '../project/backend/backend/urls.py'
  );
  fs.copyFileSync(backendUrlsFile, './backend/backend/urls.py');
  const backendViewsFile = path.resolve(
    __dirname,
    '../project/backend/backend/views.py'
  );
  fs.copyFileSync(backendViewsFile, './backend/backend/views.py');
  const backendSchemaFile = path.resolve(
    __dirname,
    '../project/backend/backend/schema.py'
  );
  fs.copyFileSync(backendViewsFile, './backend/backend/schema.py');
}

async function runSchematics(projectName: string) {
  await promiseSpawn(
    'yarn',
    ['add', 'andy23512/akimbo-schematics'],
    './frontend'
  );
  await promiseSpawn(
    'ng',
    ['g', 'akimbo-schematics:ng-add', projectName],
    './frontend'
  );
}

async function initialCommit() {
  await promiseSpawn('git', ['add', '.']);
  await promiseSpawn('git', [
    'commit',
    '-m',
    '"Initial commit from akimbo-cli"'
  ]);
}

function promiseSpawn(command: string, args: string[], cwd?: string) {
  const options: child_process.SpawnOptions = { shell: true, stdio: 'inherit' };
  if (cwd) {
    options.cwd = cwd;
  }
  return new Promise((resolve, reject) => {
    child_process
      .spawn(command, args, options)
      .on('close', code => (code === 0 ? resolve() : reject()));
  });
}
