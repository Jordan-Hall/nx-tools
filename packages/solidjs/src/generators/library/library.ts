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
  readProjectConfiguration,
  updateJson
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { libraryGenerator as viteLibraryGenerator } from '@libertydev/vite';
import { SolidVitePluginVersion } from './lib/versions';
import { join } from 'path';
import { solidjsVersion } from '../../utils/version';

function updateLibPackage(host: Tree, options: Schema, appProjectRoot: string) {
  return updateJson(host, `${appProjectRoot}/package.json`, (json) => {
    json.peerDependencies = {
      'solid-js': solidjsVersion
    }
    return json;
  });
}


export async function libraryGenerator(host: Tree, schema: Schema) {
  const tasks: GeneratorCallback[] = [];
  const appDirectory = schema.directory
    ? `${names(schema.directory).fileName}/${names(schema.name).fileName}`
    : names(schema.name).fileName;

  const fileName = schema.pascalCaseFiles ? 'Example' : 'example';

  const { appsDir } = getWorkspaceLayout(host);
  const appProjectRoot = normalizePath(`${appsDir}/${appDirectory}`);

  tasks.push(await viteLibraryGenerator(host, {
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
    join(__dirname, './files'),
    appProjectRoot,
    {
      tmpl: '',
      fileName: fileName,
    }
  );

  updateJson(host, `${appProjectRoot}/tsconfig.json`, (json) => {
    json.compilerOptions.jsx = "preserve";
    json.compilerOptions.jsxImportSource = "solid-js";
    json.types = ["vite/client"]
    return json;
  });

  updateLibPackage(host, schema, appProjectRoot)

  const projectName = names(schema.name).name;

  const projectConfiguration = readProjectConfiguration(host, projectName);
  projectConfiguration.targets['library'].options.viteConfig = viteConfigPath
  projectConfiguration.targets['library'].options.globals = { 'solid-js': 'solid-js' }
  projectConfiguration.targets['library'].options.external = ['solid-js']


  updateProjectConfiguration(host, projectName, projectConfiguration);

  if (!schema.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}

export default libraryGenerator;
export const librarySchematic = convertNxGenerator(libraryGenerator);
