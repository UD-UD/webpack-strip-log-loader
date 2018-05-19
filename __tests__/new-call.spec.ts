import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

jest.setTimeout(15000);

// New expression

test('Removes new expression of restricted symbol', async () => {
  const fileName = 'new-call.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
