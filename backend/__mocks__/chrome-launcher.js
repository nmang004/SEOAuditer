module.exports = {
  launch: jest.fn().mockResolvedValue({
    port: 9222,
    kill: jest.fn().mockResolvedValue(true)
  }),
  Launcher: {
    launch: jest.fn().mockResolvedValue({
      port: 9222,
      kill: jest.fn().mockResolvedValue(true)
    })
  }
};