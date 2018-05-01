import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

// Explicit marked symbol

test('Removes explicitly marked symbols', async () => {
  const fileName = 'remove-explicit-marked-symbol.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(fileName);

  expect(transformedPreFileContent).toBe(postFileContent);
});
