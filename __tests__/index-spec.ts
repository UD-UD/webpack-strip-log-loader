const mockWind = jest.fn<Window>();
const anyGlobal = global as any;
anyGlobal.window = new mockWind();

import * as index from '../src/index';

test('Should have Greeter available', () => {
  expect(index.Greeter).toBeTruthy();
});
