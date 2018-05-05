import * as path from 'path';
import * as fs from 'fs';
import { compileTest } from './compiler';
import * as logger from 'loglevel';
import { start } from 'repl';

// TODO: Remove duplicate code (also in plugin-loader) to custom log module
if (process.env.NODE_ENV === 'trace') {
  logger.setDefaultLevel(logger.levels.TRACE);
} else if (process.env.NODE_ENV === 'debug') {
  logger.setDefaultLevel(logger.levels.DEBUG);
} else {
  logger.setDefaultLevel(logger.levels.ERROR);
}

const pathPreFolder = path.resolve(__dirname, '../../test_files/pre');
const pathPostFolder = path.resolve(__dirname, '../../test_files/post');

export async function testPrePostFile(fileName: string, options?: {}) {
  const startTime = Number(new Date());

  const pathPreFile = path.join(pathPreFolder, fileName);
  const pathPostFile = path.join(pathPostFolder, fileName);

  const stats = await compileTest(pathPreFile, options);
  const statsJSON = stats.toJson();

  const transformedPreFileContent = (statsJSON.modules as any[]).filter(
    moduleStat => moduleStat.name.toLowerCase().endsWith(fileName)
  )[0].source;

  const postFileContent = fs.readFileSync(pathPostFile).toString();

  const endTime = Number(new Date());
  logger.debug(`Test file process time: ${(endTime - startTime) / 1000} secs`);

  return { transformedPreFileContent, postFileContent };
}
