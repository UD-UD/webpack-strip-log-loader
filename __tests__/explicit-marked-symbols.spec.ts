import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

jest.setTimeout(15000);

// Explicit marked symbol

test('Removes explicitly marked symbol', async () => {
  const fileName = 'remove-explicit-marked-symbol.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

// Explicit marked symbols

test('Removes explicitly marked symbols', async () => {
  const fileName = 'remove-explicit-marked-symbols.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
