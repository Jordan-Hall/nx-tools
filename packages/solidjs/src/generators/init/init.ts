import {
  addDependenciesToPackageJson,
  Tree,
  updateJson,
  formatFiles,
  convertNxGenerator,
  GeneratorCallback
} from '@nrwl/devkit';
import { jestInitGenerator } from '@nrwl/jest';
import { setDefaultCollection } from '@nrwl/workspace/src/utilities/set-default-collection';

import {
  solidjsVersion,
} from '../../utils/version';
import { Schema } from './schema';


function normalizeOptions(schema: Schema) {
  return {
    ...schema,
    unitTestRunner: schema.unitTestRunner ?? 'jest',
  };
}

function removeSolidjsFromDeps(tree: Tree) {
  updateJson(tree, 'package.json', (json) => {
    delete json.dependencies['@libertydev/solidjs'];
    return json;
  });
}



export async function solidjsInitGenerator(tree: Tree, schema: Schema) {
  const options = normalizeOptions(schema);
  setDefaultCollection(tree, '@libertydev/solidjs');

  let jestInstall: GeneratorCallback;
  if (options.unitTestRunner === 'jest') {
    jestInstall = await jestInitGenerator(tree, {});
  }

  removeSolidjsFromDeps(tree);

  const installTask = addDependenciesToPackageJson(
    tree,
    {
      'solid-js': solidjsVersion,
    },
    {}
  );
  if (!schema.skipFormat) {
    await formatFiles(tree);
  }

  return async () => {
    if (jestInstall) {
      await jestInstall()
    }
    await installTask();
  };
}

export default solidjsInitGenerator;
export const initSchematic = convertNxGenerator(solidjsInitGenerator);
