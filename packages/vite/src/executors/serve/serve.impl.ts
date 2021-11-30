import { Schema } from './schema';
import { createServer, printHttpServerUrls, UserConfig, UserConfigExport, InlineConfig, } from 'vite';
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
    },
    server: {
      port: 3000
    }
  }

 const server = await createServer(config)
 await server.listen()

  if (typeof (server as unknown as {printUrls: unknown}).printUrls === 'function') {
    (server as unknown as {printUrls: () => void}).printUrls()
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    printHttpServerUrls(server as any, config as any);
  }

  await new Promise<void>((resolve, reject) => {
    server.watcher.on('event', (data) => {
      if (data.code === 'END') {
        resolve();
      } else if (data.code === 'ERROR') {
        reject();
      }
    });
  });

  await server.close()

  return { success: true };
}
