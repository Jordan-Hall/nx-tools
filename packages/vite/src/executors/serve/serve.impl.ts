import { Schema } from './schema';
import { createServer, printHttpServerUrls, UserConfig, UserConfigExport, InlineConfig } from 'vite';
import { ExecutorContext } from '@nrwl/devkit';
import { deepmerge } from '../../utils/deep-merge';
import baseConfig from '../../../plugins/vite';

async function ensureUserConfig(config: UserConfigExport, mode: string): Promise<UserConfig> {
  if (typeof config === 'function') {
    return await Promise.resolve(config({command: 'build', mode }))
  }
  return await Promise.resolve(config);
}

export default async function* runExecutor(
  options: Schema,
  context: ExecutorContext,
) {
  console.log('Executor ran for Build', options);
  const project = context.workspace.projects[context.projectName];

  const viteBaseConfig = await ensureUserConfig(baseConfig, context.configurationName);
  let extendedConfig: UserConfigExport;
  if (options.viteConfig !== '@libertydev/vite/plugin/vite') {
    extendedConfig = await ensureUserConfig((await import(options.viteConfig)).default, context.configurationName);
  }
  const actualViteConfig = deepmerge(viteBaseConfig, extendedConfig) as UserConfig;

  const config: InlineConfig = {
    ...actualViteConfig,
    publicDir: options.assets,
    configFile: false,
    root: project.root,
    base: options.baseHref,
    build: {
      ...actualViteConfig.build,
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


  yield { success: true };
  // This Promise intentionally never resolves, leaving the process running
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise<{ success: boolean }>(() => {});
}
