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
import { ViteApplication } from '@libertydev/vite';
import { SolidVitePluginVersion } from './lib/versions';
import { join } from 'path';


export async function applicationGenerator(host: Tree, schema: Schema) {
  const tasks: GeneratorCallback[] = [];
  const appDirectory = schema.directory
    ? `${names(schema.directory).fileName}/${names(schema.name).fileName}`
    : names(schema.name).fileName;

  const { appsDir } = getWorkspaceLayout(host);
  const appProjectRoot = normalizePath(`${appsDir}/${appDirectory}`);

  tasks.push(await ViteApplication(host, {
    ...schema,
    skipFormat: true,
  }));

  addDependenciesToPackageJson(
    host,
    {},
    {
      "vite-plugin-solid": SolidVitePluginVersion
    }
  )

  const viteConfigPath = `${appProjectRoot}/vite.config.ts`;
  if (host.exists(viteConfigPath)) {
    host.delete(viteConfigPath)
  }

  generateFiles(
    host,
    join(__dirname, '../files'),
    appProjectRoot,
    {}
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
