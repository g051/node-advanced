Number.prototype._called = {};
const Page = require('./helpers/page');

let page;
const title = 'My Title';
const content = 'My Content';

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('When logged in', () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');
  });

  test('Can see blog create form', async () => {
    const label = await page.getContentsOf('form label');
    expect(label).toEqual('Blog Title');
  });

  describe('And using valid inputs', async () => {
    beforeEach(async () => {
      await page.type('.title input', title);
      await page.type('.content input', content);
      await page.click('form button');
    });

    test('Submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries');
    });

    test('Submitting then saving adds blogs to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');

      const myTitle = await page.getContentsOf('.card-title');
      const myContent = await page.getContentsOf('p');

      expect(myTitle).toEqual(title);
      expect(myContent).toEqual(content);
    });
  });

  describe('And using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    test('the form show an error message', async () => {
      const error = 'You must provide a value';
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toEqual(error);
      expect(contentError).toEqual(error);
    });
  });
});

describe('When not logged in', () => {
  const actions = [
    {
      method: 'get',
      path: '/api/blogs',
    },
    {
      method: 'post',
      path: '/api/blogs',
      data: { title, content },
    },
  ];

  test('Blog related actions are prohibited', async () => {
    const results = await page.execRequests(actions);

    for (let result of results)
      expect(result).toEqual({ error: 'You must log in!' });
  });
});
