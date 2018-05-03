import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

// Removes statement when inner expression is restricted

test('Removes pulled up statement when inner expression is restricted', async () => {
  const fileName = 'expression-to-statement-removal.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
