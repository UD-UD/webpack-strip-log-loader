import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

jest.setTimeout(25000);

// Mixed many kind of tests

test('Removes mixed combination of constructs', async () => {
  const fileName = 'mixed-complex.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['logger-global'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
