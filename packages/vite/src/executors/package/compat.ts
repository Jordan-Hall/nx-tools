import { convertNxExecutor } from '@nrwl/devkit';

import buildExecutor from './package.impl';

export default convertNxExecutor(buildExecutor);
