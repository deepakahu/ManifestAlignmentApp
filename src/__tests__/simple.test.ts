describe('Simple Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with async functions', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should work with objects', () => {
    const testObject = { name: 'test', value: 42 };
    expect(testObject).toEqual({ name: 'test', value: 42 });
  });
});