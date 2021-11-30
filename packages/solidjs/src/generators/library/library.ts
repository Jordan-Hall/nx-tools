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

function updateLibPackage(host: Tree, appProjectRoot: string) {
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

  const { libsDir } = getWorkspaceLayout(host);
  const appProjectRoot = normalizePath(`${libsDir}/${appDirectory}`);

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
    `${appProjectRoot}/src/lib/${fileName}.spec.ts`
  );
  host.delete(
    `${appProjectRoot}/src/lib/${fileName}.ts`
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

  if (!schema.skipFormat) {
    await formatFiles(host);
  }

  await runTasksInSerial(...tasks);
  updateLibPackage(host, appProjectRoot)

  const projectName = names(schema.name).name;

  const projectConfiguration = readProjectConfiguration(host, projectName);
  projectConfiguration.targets['build'].options.viteConfig = viteConfigPath
  projectConfiguration.targets['build'].options.globals = { 'solid-js': 'solid-js' }
  projectConfiguration.targets['build'].options.external = ['solid-js']
  projectConfiguration.targets['build'].options.entryFile = `lib/src/index.tsx`


  updateProjectConfiguration(host, projectName, projectConfiguration);
  return;
}

export default libraryGenerator;
export const librarySchematic = convertNxGenerator(libraryGenerator);
