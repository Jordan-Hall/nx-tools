import { Schema } from './schema';
import { preview, UserConfig, UserConfigExport, resolveConfig, printHttpServerUrls, InlineConfig } from 'vite';
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

  const config: InlineConfig = {
    ...viteBaseConfig,
    publicDir: options.assets,
    configFile: options.viteConfig === '@libertydev/vite/plugin/vite' ? false : joinPathFragments(`${context.root}/${options.viteConfig}`),
    root: project.root,
    base: options.baseHref,
    build: {
      ...viteBaseConfig.build,
      outDir: options.outputPath,
      reportCompressedSize: true,
      cssCodeSplit: true,
    }
  }

 const previewServer = await preview(
    await resolveConfig(
      config,
      'serve',
      context.configurationName
    ),
    { port: 3000}
  )

  if (typeof (previewServer as unknown as {printUrls: unknown}).printUrls === 'function') {
    (previewServer as unknown as {printUrls: () => void}).printUrls()
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    printHttpServerUrls(previewServer, config as any);
  }

  await new Promise<void>((resolve, reject) => {
    previewServer.on('event', (data) => {
      if (data.code === 'END') {
        resolve();
      } else if (data.code === 'ERROR') {
        reject();
      }
    });
  });

  await previewServer.close()

  return { success: true };
}
