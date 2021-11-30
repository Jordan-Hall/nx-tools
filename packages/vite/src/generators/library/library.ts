import {
  createViteEslintJson,
  extraEslintDependencies,
} from '../../utils/lint';

import { Schema } from './schema';
import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import init from '../init/init';
import { Linter, lintProjectGenerator } from '@nrwl/linter';
import { jestProjectGenerator } from '@nrwl/jest';
import { viteVersion } from '../../utils/version';

export interface NormalizedSchema extends Schema {
  name: string;
  fileName: string;
  projectRoot: string;
  routePath: string;
  projectDirectory: string;
  parsedTags: string[];
  appMain?: string;
  appSourceRoot?: string;
}

export async function libraryGenerator(host: Tree, schema: Schema) {
  const tasks: GeneratorCallback[] = [];

  const options = normalizeOptions(host, schema);
  if (options.publishable === true && !schema.importPath) {
    throw new Error(
      `For publishable libs you have to provide a proper "--importPath" which needs to be a valid npm package name (e.g. my-awesome-lib or @myorg/my-lib)`
    );
  }

  const initTask = await init(host, {
    ...options,
    skipFormat: true,
  });
  tasks.push(initTask);

  addProject(host, options);

  const lintTask = await addLinting(host, options);
  tasks.push(lintTask);

  createFiles(host, options);

  if (!options.skipTsConfig) {
    updateBaseTsConfig(host, options);
  }

  if (options.unitTestRunner === 'jest') {
    const jestTask = await jestProjectGenerator(host, {
      project: options.name,
      setupFile: 'none',
      supportTsx: true,
      skipSerializers: true,
    });
    tasks.push(jestTask);
  }

  if (options.publishable || options.buildable) {
    updateLibPackageNpmScope(host, options);
  }

  const installTask = await addDependenciesToPackageJson(
    host,
    {},
    {
      vite: viteVersion
    }
  );
  tasks.push(installTask);

  if (!options.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}

async function addLinting(host: Tree, options: NormalizedSchema) {
  const supportExt: Array<"ts" | "tsx" | "js" | "jsx"> = ['ts','js'];
  if (options.supportJSX) {
    supportExt.push('tsx', 'jsx')
  }

  const lintTask = await lintProjectGenerator(host, {
    linter: options.linter,
    project: options.name,
    tsConfigPaths: [
      joinPathFragments(options.projectRoot, 'tsconfig.lib.json'),
    ],
    eslintFilePatterns: [`${options.projectRoot}/**/*.{${supportExt.join(',')}}`],
    skipFormat: true,
  });

  if (options.linter === Linter.TsLint) {
    return;
  }

  const viteEslintJson = createViteEslintJson(
    options.projectRoot,
    options.setParserOptionsProject,
    supportExt
  );

  updateJson(
    host,
    joinPathFragments(options.projectRoot, '.eslintrc.json'),
    () => viteEslintJson
  );

  const installTask = await addDependenciesToPackageJson(
    host,
    extraEslintDependencies.dependencies,
    extraEslintDependencies.devDependencies
  );

  return runTasksInSerial(lintTask, installTask);
}

function addProject(host: Tree, options: NormalizedSchema) {
  const targets: { [key: string]: any } = {};

  if (options.publishable || options.buildable) {
    const { libsDir } = getWorkspaceLayout(host);

    targets.build = {
      builder: '@libertydev/vite:package',
      outputs: ['{options.outputPath}'],
      options: {
        outputPath: `dist/${libsDir}/${options.projectDirectory}`,
        packageJson: `${options.projectRoot}/package.json`,
        assets: `/assets`,
        entryFile: `lib/src/index.ts`,
        viteConfig: `@libertydev/vite/plugins/vite-package`,
      },
    };
  }

  addProjectConfiguration(
    host,
    options.name,
    {
      root: options.projectRoot,
      sourceRoot: joinPathFragments(options.projectRoot, 'src'),
      projectType: 'library',
      tags: options.parsedTags,
      targets,
    },
    options.standaloneConfig
  );
}

function updateBaseTsConfig(host: Tree, options: NormalizedSchema) {
  updateJson(host, 'tsconfig.base.json', (json) => {
    const c = json.compilerOptions;
    c.paths = c.paths || {};
    delete c.paths[options.name];

    if (c.paths[options.importPath]) {
      throw new Error(
        `You already have a library using the import path "${options.importPath}". Make sure to specify a unique one.`
      );
    }

    const { libsDir } = getWorkspaceLayout(host);

    c.paths[options.importPath] = [
      joinPathFragments(libsDir, `${options.projectDirectory}/src/index.ts`)
    ];

    return json;
  });
}

function createFiles(host: Tree, options: NormalizedSchema) {
  generateFiles(
    host,
    joinPathFragments(__dirname, './files/lib'),
    options.projectRoot,
    {
      ...options,
      ...names(options.name),
      tmpl: '',
      offsetFromRoot: offsetFromRoot(options.projectRoot),
      libraryImport: options.importPath
    }
  );

  if (!options.publishable && !options.buildable) {
    host.delete(`${options.projectRoot}/package.json`);
  }
}


function normalizeOptions(host: Tree, options: Schema): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;

  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const fileName = projectName;
  const { libsDir, npmScope } = getWorkspaceLayout(host);
  const projectRoot = joinPathFragments(libsDir, projectDirectory);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const importPath = options.importPath || `@${npmScope}/${projectDirectory}`;

  const normalized: NormalizedSchema = {
    ...options,
    fileName,
    routePath: `/${name}`,
    name: projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    importPath,
  };

  return normalized;
}

function updateLibPackageNpmScope(host: Tree, options: NormalizedSchema) {
  const { libsDir } = getWorkspaceLayout(host)
  return updateJson(host, `${options.projectRoot}/package.json`, (json) => {
    json.main = `dist/${libsDir}/${options.projectDirectory}/index.umd.js`,
    json.module = `dist/${libsDir}/${options.projectDirectory}/index.es.js`,
    json.exports = {
      ".": {
        "import": "./dist/index.es.js",
        "require": "./dist/index.umd.js"
      }
    }
    json.name = options.importPath;
    return json;
  });
}

export default libraryGenerator;
export const librarySchematic = convertNxGenerator(libraryGenerator);
