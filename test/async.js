const p = new Promise((y, n) => y());
const a = async function () {
  return await p;
};

it('should work', () => {
  return a();
})

it('should fail', () => {
  require('../server/app');
})