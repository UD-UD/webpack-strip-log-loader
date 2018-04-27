import * as path from 'path';
import * as fs from 'fs';
import compiler from '../src/compiler';

jest.setTimeout(10000);

test('Inserts name and outputs JavaScript', async () => {
  const filePath = path.resolve(__dirname, '../test_files/import2.js1');
  const fileContent = fs.readFileSync(filePath).toString();

  const stats = await compiler(filePath);
  const statsJSON = stats.toJson();

  const js1ModuleText = (statsJSON.modules as any[]).filter(moduleStat =>
    moduleStat.name.toLowerCase().endsWith('.js1')
  )[0].source;

  expect(js1ModuleText).toBe(fileContent);
});
