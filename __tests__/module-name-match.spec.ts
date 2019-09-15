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

test('Matches modules with non-js extension (global) - exact string match', async () => {
  const fileName = 'module-name-assets-global.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['style-1.css', 'style-2.less'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Matches modules with non-js extension (global) - glob pattern 1', async () => {
  const fileName = 'module-name-assets-global.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['style-*'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Matches modules with non-js extension (global) - glob pattern 2', async () => {
  const fileName = 'module-name-assets-global.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['style-*@(css|less)'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Does not match wrong glob patterns', async () => {
  const fileName = 'module-name-assets-global.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['style-'],
    }
  );

  expect(transformedPreFileContent).not.toBe(postFileContent);
});

test('Matches modules with non-js extension (relative) - exact string match', async () => {
  const fileName = 'module-name-assets-relative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['./style-1.css', './style-2.less'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Matches modules with non-js extension (relative) - glob pattern 1', async () => {
  const fileName = 'module-name-assets-relative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['./style-*'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Matches modules with non-js extension (relative) - glob pattern 2', async () => {
  const fileName = 'module-name-assets-relative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['./style-*@(less|css)'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Relative modules do not match with global glob pattern - by default', async () => {
  const fileName = 'module-name-assets-relative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['style-*'],
    }
  );

  expect(transformedPreFileContent).not.toBe(postFileContent);
});

test('Relative modules match with global glob pattern - with matchBase:true', async () => {
  const fileName = 'module-name-assets-relative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['style-*'],
      matchOptions: {
        matchBase: true,
      },
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Relative modules do not match with global glob pattern - with matchBase:false', async () => {
  const fileName = 'module-name-assets-relative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['style-*'],
      matchOptions: {
        matchBase: false,
      },
    }
  );

  expect(transformedPreFileContent).not.toBe(postFileContent);
});
