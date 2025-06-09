export function mockUserDecorator(userId: string = 'user123') {
  jest.mock('../decorator.getCurrentUser', () => ({
    UserDecorator: jest.fn(() => jest.fn(() => userId)),
  }));
}
