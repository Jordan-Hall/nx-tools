import { Schema } from './schema';
import { build, UserConfig, UserConfigExport } from 'vite';
import { ExecutorContext, joinPathFragments } from '@nrwl/devkit';
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
  const project = context.workspace.projects[context.projectName];
  const viteBaseConfig = await ensureUserConfig(baseConfig, context.configurationName);

  await build({
    ...viteBaseConfig,
    configFile: options.viteConfig === '@libertydev/vite/plugin/vite' ? false : joinPathFragments(`${context.root}/${options.viteConfig}`),
    root: project.root,
    base: options.baseHref,
    publicDir: options.assets,
    build: {
      ...viteBaseConfig.build,
      outDir: options.outputPath,
      reportCompressedSize: true,
      cssCodeSplit: true,
    }
  })


  return {
    success: true,
  };
}
