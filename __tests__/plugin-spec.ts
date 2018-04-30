import * as path from 'path';
import * as fs from 'fs';
import compiler from '../src/compiler';

const pathPreFolder = path.resolve(__dirname, '../test_files/pre');
const pathPostFolder = path.resolve(__dirname, '../test_files/post');

test('Removes namespace import statement', async () => {
  const fileName = "import-namespace.js1";
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  
  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();
  
  const transformedPreFileContent = (statsJSON.modules as any[]).filter(moduleStat =>
    moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;
  
  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});


test('Removes namespace import statement with spaced comment', async () => {
  const fileName = "import-namespace-comment-spaced.js1";
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  
  const stats = await compiler(pathPreFile, {});
  const statsJSON = stats.toJson();
  
  const transformedPreFileContent = (statsJSON.modules as any[]).filter(moduleStat =>
    moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;
  
  const postFileContent = fs.readFileSync(pathPostFile).toString();
  expect(transformedPreFileContent).toBe(postFileContent);
});
