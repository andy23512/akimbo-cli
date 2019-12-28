import child_process from 'child_process';
import fs from 'fs';
import path from 'path';

(async () => {
  const projectName = getProjectName();
  makeAndChangeDirectory(projectName);
  await promiseSpawn('ctore', ['frontend']);
  await promiseSpawn(path.resolve(__dirname, '../setup-django.sh'), [projectName]);
  await promiseSpawn('git', ['init']);
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

function promiseSpawn(command: string, args: string[]) {
  return new Promise((resolve, reject) => {
    child_process
      .spawn(command, args, { shell: true, stdio: 'inherit' })
      .on('close', code => (code === 0 ? resolve() : reject()));
  });
}
