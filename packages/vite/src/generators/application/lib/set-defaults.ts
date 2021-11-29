import {
  readWorkspaceConfiguration,
  Tree,
  updateWorkspaceConfiguration,
} from '@nrwl/devkit';
import { NormalizedSchema } from '../schema';

export function setDefaults(host: Tree, options: NormalizedSchema) {
  if (options.skipWorkspaceJson) {
    return;
  }

  const workspace = readWorkspaceConfiguration(host);

  if (!workspace.defaultProject) {
    workspace.defaultProject = options.projectName;
  }

  workspace.generators = workspace.generators || {};
  workspace.generators['@libertydev/vite'] =
    workspace.generators['@libertydev/vite'] || {};

  const prev = { ...workspace.generators['@libertydev/vite'] };

  workspace.generators = {
    ...workspace.generators,
    '@libertydev/vite': {
      ...prev,
      application: {
        linter: options.linter,
        ...prev.application,
      },
      library: {
        linter: options.linter,
        ...prev.library,
      },
    },
  };

  updateWorkspaceConfiguration(host, workspace);
}
