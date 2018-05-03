import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

// Import tests

test('Removes default import statement', async () => {
  const fileName = 'import-default.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes default import statement with spaced comment', async () => {
  const fileName = 'import-default-comment-spaced.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes namespace import statement', async () => {
  const fileName = 'import-namespace.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes named import statement without alias', async () => {
  const fileName = 'import-named-simple.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes named import statement with alias', async () => {
  const fileName = 'import-named-with-alias.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes imports with global strip modules', async () => {
  const fileName = 'import-global-strip.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['logger-global'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes simple require statements', async () => {
  const fileName = 'import-require.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test("Doesn't remove invalid require statements", async () => {
  const fileName = 'import-require-invalid.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes mixed imports simple (all stripped)', async () => {
  const fileName = 'import-mixed-simple.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes mixed imports complex (some stripped + global strip modules)', async () => {
  const fileName = 'import-mixed-complex.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName,
    {
      modules: ['logger-global-1', 'logger-global-2'],
    }
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes mixed imports with negative test (some stripped)', async () => {
  const fileName = 'import-mixed-with-negative.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
