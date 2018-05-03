import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

test('Restricted import should change the file content', async () => {
  const fileName = 'should-not-match.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).not.toBe(postFileContent);
});
