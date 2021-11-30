import {
  addDependenciesToPackageJson,
  NxJsonConfiguration,
  readJson,
  Tree,
} from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { solidjsVersion } from '../../utils/version';
import { solidjsInitGenerator } from './init';

describe('init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add dependencies', async () => {
    const existing = 'existing';
    const existingVersion = '1.0.0';

    addDependenciesToPackageJson(
      tree,
      {
        [existing]: existingVersion,
        'solid-js': solidjsVersion
      },
      {
        [existing]: existingVersion,
      }
    );
    await solidjsInitGenerator(tree, {});

    const packageJson = readJson(tree, 'package.json');
    expect(packageJson.dependencies['solid-js']).toBeDefined();
    expect(packageJson.dependencies['tslib']).toBeDefined();
    expect(packageJson.dependencies[existing]).toBeDefined();
    expect(packageJson.devDependencies['vite']).toBeUndefined();
    expect(packageJson.devDependencies[existing]).toBeDefined();
  });

  describe('defaultCollection', () => {
    it('should be set if none was set before', async () => {
      await solidjsInitGenerator(tree, {});
      const nxJson = readJson<NxJsonConfiguration>(tree, 'nx.json');
      expect(nxJson.cli.defaultCollection).toEqual('@libertydev/solidjs');
    });
  });

  it('should not add jest config if unitTestRunner is none', async () => {
    await solidjsInitGenerator(tree, { unitTestRunner: 'none' });
    expect(tree.exists('jest.config.js')).toEqual(false);
  });
});
