import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

// Function call

test('Removes function call of restricted symbol', async () => {
  const fileName = 'function-call.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
