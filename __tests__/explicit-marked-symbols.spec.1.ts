import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

// Explicit marked symbols

test('Removes explicitly marked (comma binary expression) group of symbols', async () => {
  const fileName = 'remove-explicit-marked-symbols.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(fileName);

  expect(transformedPreFileContent).toBe(postFileContent);
});
