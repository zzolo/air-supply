/**
 * Test xml parser
 */

// Dependencies for testing.
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const xmlParser = require('../../src/parsers/xml');

// json
describe('xml parser', () => {
  test('can parse xml file', async () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/data-simple.xml')
    );

    let data = await xmlParser(buf);
    expect(data).toBeTruthy();
    expect(data.note).toBeTruthy();
    expect(data.note.to.length).toBeGreaterThanOrEqual(1);
  });
});
