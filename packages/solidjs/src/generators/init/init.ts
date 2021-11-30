import {
  addDependenciesToPackageJson,
  Tree,
  updateJson,
  formatFiles,
  convertNxGenerator,
  GeneratorCallback
} from '@nrwl/devkit';
import { jestInitGenerator } from '@nrwl/jest';
import { viteInitGenerator } from '@libertydev/vite';
import { setDefaultCollection } from '@nrwl/workspace/src/utilities/set-default-collection';

import {
  solidjsVersion,
} from '../../utils/version';
import { Schema } from './schema';


function removeSolidjsFromDeps(tree: Tree) {
  updateJson(tree, 'package.json', (json) => {
    delete json.dependencies['@libertydev/solidjs'];
    return json;
  });
}


export async function solidjsInitGenerator(tree: Tree, schema: Schema) {
  setDefaultCollection(tree, '@libertydev/solidjs');

  await viteInitGenerator(tree, schema)

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
    await installTask();
  };
}

export default solidjsInitGenerator;
export const initSchematic = convertNxGenerator(solidjsInitGenerator);
