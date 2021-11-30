import { Schema } from './schema';
import { build, UserConfig, UserConfigExport } from 'vite';
import { ExecutorContext } from '@nrwl/devkit';
import { deepmerge } from '../../utils/deep-merge';
import baseConfig from '../../../plugins/vite';

async function ensureUserConfig(config: UserConfigExport, mode: string): Promise<UserConfig> {
  if (typeof config === 'function') {
    return await Promise.resolve(config({command: 'build', mode }))
  }
  return await Promise.resolve(config);
}

export default async function runExecutor(
  options: Schema,
  context: ExecutorContext,
) {
  console.log('Executor ran for Build', options);
  const project = context.workspace.projects[context.projectName];

  const viteBaseConfig = await ensureUserConfig(baseConfig, context.configurationName);
  let extendedConfig: UserConfigExport;
  if (options.viteConfig !== '@libertydev/vite/plugin/vite') {
    extendedConfig = await ensureUserConfig((await import('../../../plugins/vite')).default, context.configurationName);
  }
  const actualViteConfig = deepmerge(viteBaseConfig, extendedConfig) as UserConfig;

  await build({
    ...actualViteConfig,
    configFile: false,
    root: project.root,
    base: options.baseHref,
    publicDir: options.assets,
    build: {
      ...actualViteConfig.build,
      outDir: options.outputPath,
      reportCompressedSize: true,
      cssCodeSplit: true,
    }
  })


  return {
    success: true,
  };
}
