import { convertNxExecutor } from '@nrwl/devkit';

import buildExecutor from './serve.impl';

export default convertNxExecutor(buildExecutor);
