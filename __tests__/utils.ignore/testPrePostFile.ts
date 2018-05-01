import * as path from 'path';
import * as fs from 'fs';
import { compileTest } from './compiler';

const pathPreFolder = path.resolve(__dirname, '../../test_files/pre');
const pathPostFolder = path.resolve(__dirname, '../../test_files/post');


export async function testPrePostFile(fileName: string, options?: {}) {
  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compileTest(pathPreFile, options);
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();

  return { transformedPreFileContent, postFileContent };
}