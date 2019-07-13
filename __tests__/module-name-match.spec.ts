import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

jest.setTimeout(15000);

// Module name pattern matching tests

test('Matches modules with relative path - exact string match', async () => {
  const fileName = 'module-name-relative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['./local-logger'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});


test('Matches modules with relative path - glob pattern', async () => {
  const fileName = 'module-name-relative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['./local-*'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Matches modules with non-js extension - exact string match', async () => {
  const fileName = 'module-name-assets.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['./local-logger'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Matches modules with non-js extension - exact string match', async () => {
  const fileName = 'module-name-assets.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['./local-logger'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
