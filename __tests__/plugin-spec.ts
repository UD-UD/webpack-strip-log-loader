import * as path from 'path';
import * as fs from 'fs';
import compiler from '../src/compiler';

const pathPreFolder = path.resolve(__dirname, '../test_files/pre');
const pathPostFolder = path.resolve(__dirname, '../test_files/post');

// Import tests

test('Removes default import statement', async () => {
  const fileName = 'import-default.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes default import statement with spaced comment', async () => {
  const fileName = 'import-default-comment-spaced.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes namespace import statement', async () => {
  const fileName = 'import-namespace.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes named import statement without alias', async () => {
  const fileName = 'import-named-simple.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes named import statement with alias', async () => {
  const fileName = 'import-named-with-alias.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes imports with global strip modules', async () => {
  const fileName = 'import-global-strip.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {
    modules: ['logger-global'],
  });
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes simple require statements', async () => {
  const fileName = 'import-require.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test("Doesn't remove invalid require statements", async () => {
  const fileName = 'import-require-invalid.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes mixed imports simple (all stripped)', async () => {
  const fileName = 'import-mixed-simple.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes mixed imports complex (some stripped + global strip modules)', async () => {
  const fileName = 'import-mixed-complex.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {
    modules: ['logger-global-2', 'logger-global-1'],
  });
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes mixed imports with negative test (some stripped)', async () => {
  const fileName = 'import-mixed-with-negative.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

test('Removes explicitly marked symbols', async () => {
  const fileName = 'remove-explicit-marked-symbol.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

// Function call

test('Removes function call of restricted symbol', async () => {
  const fileName = 'log-function-call.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});

// New expression

test('Removes new expression of restricted symbol', async () => {
  const fileName = 'log-new-expression.js1';
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});