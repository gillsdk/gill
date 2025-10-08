import { debug, isDebugEnabled } from "../core";

const DEFAULT_PREFIX = "[GILL]";

describe("isDebugEnabled", () => {
  // Store original env and global values
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env and global before each test
    jest.resetModules();
    process.env = { ...originalEnv };
    global.__GILL_DEBUG__ = undefined;
    global.__GILL_DEBUG_LEVEL__ = undefined;

    // Clear window if it exists
    if (typeof window !== "undefined") {
      (window as any).__GILL_DEBUG__ = undefined;
    }
  });

  afterEach(() => {
    // Restore original env and global after each test
    process.env = originalEnv;
    global.__GILL_DEBUG__ = undefined;
    global.__GILL_DEBUG_LEVEL__ = undefined;
  });

  it("should return false when no debug flags are set", () => {
    expect(isDebugEnabled()).toBe(false);
  });

  it("should return true when GILL_DEBUG_LEVEL is set", () => {
    process.env.GILL_DEBUG_LEVEL = "debug";
    expect(isDebugEnabled()).toBe(true);
  });

  it("should return true when global.__GILL_DEBUG_LEVEL__ is set", () => {
    global.__GILL_DEBUG_LEVEL__ = "info";
    expect(isDebugEnabled()).toBe(true);
  });

  it('should return true when GILL_DEBUG env is "true"', () => {
    process.env.GILL_DEBUG = "true";
    expect(isDebugEnabled()).toBe(true);
  });

  it('should return true when GILL_DEBUG env is "1"', () => {
    process.env.GILL_DEBUG = "1";
    expect(isDebugEnabled()).toBe(true);
  });

  it("should return true when global.__GILL_DEBUG__ is true", () => {
    global.__GILL_DEBUG__ = true;
    expect(isDebugEnabled()).toBe(true);
  });

  it("should return true when global.__GILL_DEBUG_LEVEL__ is set", () => {
    global.__GILL_DEBUG_LEVEL__ = "debug";
    expect(isDebugEnabled()).toBe(true);
  });

  it("should return true when global.__GILL_DEBUG_LEVEL__ is set", () => {
    global.__GILL_DEBUG_LEVEL__ = "debug";
    expect(isDebugEnabled()).toBe(true);
  });

  it("should return true when global.__GILL_DEBUG_LEVEL__ is set with any value", () => {
    global.__GILL_DEBUG_LEVEL__ = "any" as any;
    expect(isDebugEnabled()).toBe(true);
  });

  it("should return false for falsy values", () => {
    process.env.GILL_DEBUG = "false";
    global.__GILL_DEBUG__ = false;
    global.__GILL_DEBUG_LEVEL__ = undefined;
    expect(isDebugEnabled()).toBe(false);
  });

  it("should return true when multiple debug flags are set", () => {
    process.env.GILL_DEBUG = "false"; // This one is false
    global.__GILL_DEBUG__ = true; // But this one is true
    expect(isDebugEnabled()).toBe(true);
  });
});

describe("debug logger", () => {
  // Store original console methods and env
  const originalConsole = { ...console };
  const originalEnv = process.env;
  // const originalGlobal = global;

  // Mock all console methods
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Reset env and global
    jest.resetModules();
    process.env = { ...originalEnv };
    global.__GILL_DEBUG__ = undefined;
    global.__GILL_DEBUG_LEVEL__ = undefined;
  });

  // Restore original console methods and env
  afterEach(() => {
    console.log = originalConsole.log;
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    process.env = originalEnv;
    global.__GILL_DEBUG__ = undefined;
    global.__GILL_DEBUG_LEVEL__ = undefined;
  });

  describe("when debug is enabled", () => {
    beforeEach(() => {
      global.__GILL_DEBUG__ = true;
      global.__GILL_DEBUG_LEVEL__ = "debug";
    });

    it("should call console.log for debug level", () => {
      debug("test message", "debug");
      expect(console.log).toHaveBeenCalledWith(DEFAULT_PREFIX, "test message");
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it("should call console.info for info level", () => {
      debug("test message", "info");
      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(DEFAULT_PREFIX, "test message");
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it("should call console.warn for warn level", () => {
      debug("test message", "warn");
      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(DEFAULT_PREFIX, "test message");
      expect(console.error).not.toHaveBeenCalled();
    });

    it("should call console.error for error level", () => {
      debug("test message", "error");
      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(DEFAULT_PREFIX, "test message");
    });

    it("should stringify objects", () => {
      const obj = { test: "value" };
      debug(obj, "info");
      expect(console.info).toHaveBeenCalledWith(DEFAULT_PREFIX, JSON.stringify(obj, null, 2));
    });
  });

  describe("log level filtering", () => {
    beforeEach(() => {
      global.__GILL_DEBUG__ = true;
    });

    it("should not log debug when level is info", () => {
      global.__GILL_DEBUG_LEVEL__ = "info";
      debug("test message", "debug");
      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });

    it("should not log info when level is warn", () => {
      global.__GILL_DEBUG_LEVEL__ = "warn";
      debug("test message", "info");
      expect(console.info).not.toHaveBeenCalled();
    });

    it("should not log warn when level is error", () => {
      global.__GILL_DEBUG_LEVEL__ = "error";
      debug("test message", "warn");
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should log error regardless of level", () => {
      global.__GILL_DEBUG_LEVEL__ = "error";
      debug("test message", "error");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("when debug is disabled", () => {
    beforeEach(() => {
      global.__GILL_DEBUG__ = false;
    });

    it("should not log anything", () => {
      debug("test message", "debug");
      debug("test message", "info");
      debug("test message", "warn");
      debug("test message", "error");

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
