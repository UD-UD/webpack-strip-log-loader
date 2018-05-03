import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

// Property access

test('Removes property access of restricted symbol', async () => {
  const fileName = 'property-access.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
