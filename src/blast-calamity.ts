import child_process from 'child_process';
import fs from 'fs';
import { resolve as pathResolve } from 'path';
const gitignore = require('gitignore');

(async () => {
  const projectName = getProjectName();
  makeAndChangeDirectory(projectName);
  await promiseSpawn('git', ['init']);
  await promiseSpawn('ctore', ['frontend']);
  await promiseSpawn(pathResolve(__dirname, '../setup-django.sh'), [
    projectName,
  ]);
  await promiseSpawn(
    'yarn',
    [
      'add',
      '@graphql-codegen/cli',
      '@graphql-codegen/typescript-apollo-angular',
      '@graphql-codegen/typescript-operations',
      '@graphql-codegen/add',
    ],
    './frontend'
  );
  await promiseSpawn('ng', ['add', 'apollo-angular'], './frontend');
  setFrontendSettings();
  setBackendSettings(projectName);
  await setBackendFiles();
  setDockerFiles();
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
  packageJSON.scripts.start = 'ng serve --host 0.0.0.0 --poll=2000';
  fs.writeFileSync(
    './frontend/package.json',
    JSON.stringify(packageJSON, null, 2)
  );
  copyFileIntoProject('frontend/proxy.conf.json');
  copyFileIntoProject('frontend/apollo.config.js');
  copyFileIntoProject('frontend/codegen.yml');
  copyFileIntoProject('frontend/Dockerfile');
}

async function setBackendSettings(projectName: string) {
  let settingsPy = fs.readFileSync('./backend/backend/settings.py', {
    encoding: 'utf-8',
  });
  settingsPy =
    settingsPy
      .replace(
        '# SECURITY WARNING: keep the secret key used in production secret!\n',
        ''
      )
      .replace(/SECRET_KEY = '.*?'\n/, '') +
    `
# generate secret key if not exist. Ref: https://gist.github.com/ndarville/3452907
try:
    SECRET_KEY
except NameError:
    SECRET_FILE = os.path.join(BASE_DIR, 'secret.txt')
    try:
        SECRET_KEY = open(SECRET_FILE).read().strip()
    except IOError:
        try:
            import random
            SECRET_KEY = ''.join([random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50)])
            secret = open(SECRET_FILE, 'w')
            secret.write(SECRET_KEY)
            secret.close()
        except IOError:
            Exception('Please create a %s file with random characters \
            to generate your secret key!' % SECRET_FILE)

# Cookie Names
SESSION_COOKIE_NAME = '${projectName}-sessionid'
CSRF_COOKIE_NAME = '${projectName}-csrf'

# django-graphene
GRAPHENE = {
    'SCHEMA': 'backend.schema.schema'
}
    `;
  fs.writeFileSync('./backend/backend/settings.py', settingsPy);
}

function setBackendFiles() {
  copyFileIntoProject('backend/backend/urls.py');
  copyFileIntoProject('backend/backend/views.py');
  copyFileIntoProject('backend/backend/schema.py');
  copyFileIntoProject('backend/Dockerfile');
  return new Promise((resolve, reject) => {
    gitignore.writeFile(
      { type: 'Python', file: fs.createWriteStream('backend/.gitignore') },
      (err: Error) => {
        fs.appendFileSync('backend/.gitignore', '\nsecret.txt');
        err ? reject(err) : resolve();
      }
    );
  });
}

function setDockerFiles() {
  copyFileIntoProject('docker-compose.yml');
  copyFileIntoProject('Makefile');
}

async function runSchematics(projectName: string) {
  await promiseSpawn(
    'yarn',
    ['add', 'andy23512/blast-calamity-schematics'],
    './frontend'
  );
  await promiseSpawn(
    'ng',
    ['g', 'blast-calamity-schematics:ng-add', projectName],
    './frontend'
  );
}

async function initialCommit() {
  await promiseSpawn('git', ['add', '.']);
  await promiseSpawn('git', [
    'commit',
    '-m',
    '"Initial commit from blast-calamity"',
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
      .on('close', (code) => (code === 0 ? resolve() : reject()));
  });
}

function copyFileIntoProject(path: string) {
  const file = pathResolve(__dirname, `../project/`, path);
  const dest = pathResolve(path);
  fs.copyFileSync(file, dest);
}
