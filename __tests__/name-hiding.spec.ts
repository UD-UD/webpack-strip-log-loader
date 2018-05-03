import * as path from 'path';
import { testPrePostFile } from './utils.ignore';

test("Hiding a restricted variable with a new variable of the same name shouldn't restrict new variable", async () => {
  const fileName = 'name-hiding.js1';
  const { transformedPreFileContent, postFileContent } = await testPrePostFile(
    fileName
  );

  expect(transformedPreFileContent).toBe(postFileContent);
});
