import { convertNxExecutor } from '@nrwl/devkit';

import buildExecutor from './preview.impl';

export default convertNxExecutor(buildExecutor);
