import { Schema } from './schema';
import { build, UserConfig, UserConfigExport } from 'vite';
import { ExecutorContext, joinPathFragments, names } from '@nrwl/devkit';
import baseConfig from '../../../plugins/vite-package';
import { copyFile } from 'fs/promises';
import { copyRecursiveSync } from '../../utils/copy-folder';

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
  const viteBaseConfig = await ensureUserConfig(baseConfig({
    entry: options.entryFile,
    external: options.external ?? [],
    globals: options.globals ?? {},
    name: names(context.projectName).fileName
  }), context.configurationName);

  await build({
    ...viteBaseConfig,
    configFile: options.viteConfig === '@libertydev/vite/plugin/vite-package' ? false : joinPathFragments(`${context.root}/${options.viteConfig}`),
    root: project.root,
    build: {
      ...viteBaseConfig.build,
      outDir: options.outputPath,
      reportCompressedSize: true,
      cssCodeSplit: true,
    }
  })

  await copyFile(joinPathFragments(`${context.root}/${options.packageJson ?? 'package.json'}`), options.outputPath)

  if (options.assets) {
    copyRecursiveSync(`${context.root}/${options.assets}`, joinPathFragments(`${context.root}/${options.assets}`))
  }

  return {
    success: true,
  };
}
