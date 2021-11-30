import { Schema } from './schema';
import executor from './package.impl';
import { ExecutorContext } from '@nrwl/devkit';

const options: Schema = {} as Schema;

describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(options, {} as ExecutorContext);
    expect(output.success).toBe(true);
  });
});
