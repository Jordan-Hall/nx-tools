import { Schema } from './schema';
import {
  convertNxGenerator,
  formatFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  names,
  normalizePath,
  Tree,
  addDependenciesToPackageJson,
  generateFiles,
  updateProjectConfiguration,
  readProjectConfiguration
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { applicationGenerator as viteApplicationGenerator } from '@libertydev/vite';
import { SolidVitePluginVersion } from './lib/versions';
import { join } from 'path';
import { solidjsVersion } from '../../utils/version';


export async function applicationGenerator(host: Tree, schema: Schema) {
  const tasks: GeneratorCallback[] = [];
  const appDirectory = schema.directory
    ? `${names(schema.directory).fileName}/${names(schema.name).fileName}`
    : names(schema.name).fileName;

  const fileName = schema.pascalCaseFiles ? 'App' : 'app';

  const { appsDir } = getWorkspaceLayout(host);
  const appProjectRoot = normalizePath(`${appsDir}/${appDirectory}`);

  tasks.push(await viteApplicationGenerator(host, {
    ...schema,
    skipFormat: true,
  }));

  addDependenciesToPackageJson(
    host,
    {
      'solid-js': solidjsVersion
    },
    {
      "vite-plugin-solid": SolidVitePluginVersion
    }
  )

  const viteConfigPath = `${appProjectRoot}/vite.config.ts`;
  if (host.exists(viteConfigPath)) {
    host.delete(viteConfigPath)
  }

  host.delete(
    `${appProjectRoot}/src/app/${fileName}.spec.ts`
  );
  host.delete(
    `${appProjectRoot}/src/app/${fileName}.ts`
  );
  host.delete(
    `${appProjectRoot}/index.html`
  );

  generateFiles(
    host,
    join(__dirname, '../files'),
    appProjectRoot,
    {
      tmpl: '',
      fileName: fileName
    }
  );

  const projectName = names(schema.name).name;

  const projectConfiguration = readProjectConfiguration(host, projectName);
  projectConfiguration.targets['build'].options.viteConfig = viteConfigPath
  projectConfiguration.targets['preview'].options.viteConfig = viteConfigPath
  projectConfiguration.targets['serve'].options.viteConfig = viteConfigPath

  updateProjectConfiguration(host, projectName, projectConfiguration);

  if (!schema.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);
