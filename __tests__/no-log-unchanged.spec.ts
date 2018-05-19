import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

jest.setTimeout(25000);

test('Files containing no restricted symbol/expression should remain unchanged', async () => {
  const fileName = 'no-log-unchanged.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
