var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// api/reserva.js
var BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
var REMITENTE = {
  name: "Suites Viena Plaza de Espa\xF1a",
  email: "reservas@suitesvienaeventos.com"
};
var DIRECCION = {
  name: "Direcci\xF3n Suites Viena",
  email: "direccion@suitesviena.es"
};
var URL_PANEL = "https://suitesvienaeventos.com/admin/reservas";
var TEXTO_IVA = "IVA incluido";
var TELEFONO_HOTEL = { texto: "917 583 605", tel: "+34917583605" };
var ORIGENES = [
  "https://suitesvienaeventos.com",
  "https://www.suitesvienaeventos.com",
  "http://localhost:5173"
];
var C = {
  acento: "#922B21",
  fondo: "#F9F9F9",
  bloque: "#F4F4F4",
  linea: "#E5E5E5",
  tinta: "#111111",
  suave: "#6B6B6B",
  tenue: "#ABABAB",
  blanco: "#FFFFFF",
  refFondo: "#FDF2F2",
  refBorde: "#F5C6C6",
  avisoFondo: "#FEF3C7",
  avisoBorde: "#FCD34D",
  avisoTitu: "#92400E",
  avisoTexto: "#78350F",
  ofertaFondo: "#F0FDF4",
  ofertaBorde: "#BBF7D0",
  ofertaTexto: "#166534"
};
var json = /* @__PURE__ */ __name((datos, status = 200) => new Response(JSON.stringify(datos), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8" }
}), "json");
var escapar = /* @__PURE__ */ __name((valor) => String(valor ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"), "escapar");
var texto = /* @__PURE__ */ __name((valor, max = 500) => escapar(String(valor ?? "").slice(0, max)), "texto");
var multilinea = /* @__PURE__ */ __name((valor, max = 2e3) => texto(valor, max).replace(/\r?\n/g, "<br />"), "multilinea");
var importe = /* @__PURE__ */ __name((n) => `${Number(n || 0).toLocaleString("es-ES")} \u20AC`, "importe");
var esEmail = /* @__PURE__ */ __name((valor) => typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor), "esEmail");
var ESTILOS_MOVIL = `
    @media only screen and (max-width: 620px) {
      .px         { padding-left: 20px !important; padding-right: 20px !important; }
      .wrapPad    { padding: 16px 8px !important; }
      .tCell      { padding-left: 8px !important; padding-right: 8px !important; font-size: 12px !important; }
      .tHead      { padding-left: 8px !important; padding-right: 8px !important; font-size: 9px !important; letter-spacing: 0.5px !important; }
      .labelCell  { width: 90px !important; font-size: 11px !important; }
      .bigPrice   { font-size: 24px !important; }
      .refNum     { font-size: 19px !important; }
      .greet      { font-size: 18px !important; }
    }`;
var rotulo = /* @__PURE__ */ __name((txt) => `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">${txt}</p>`, "rotulo");
var BARRA = `<tr>
      <td style="background-color:${C.acento};font-size:0;line-height:4px;mso-line-height-rule:exactly;height:4px;">&nbsp;</td>
    </tr>`;
var cabecera = /* @__PURE__ */ __name((subtitulo) => `<tr>
      <td class="px" style="background-color:${C.blanco};border-bottom:1px solid ${C.linea};padding:32px 40px;text-align:center;">
        <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:${C.tinta};letter-spacing:-0.5px;">Suites Viena</h1>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.acento};">${subtitulo}</p>
      </td>
    </tr>`, "cabecera");
var cabeceraTabla = /* @__PURE__ */ __name(() => ["Fecha", "Jornada", "Montaje", "Pax"].map(
  (h, i) => `<td class="tHead" style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:${C.acento};letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid ${C.linea};${i === 3 ? "text-align:center;" : ""}">${h}</td>`
).join(""), "cabeceraTabla");
var filasFechas = /* @__PURE__ */ __name((fechas) => {
  if (!fechas.length) {
    return `<tr><td colspan="4" class="tCell" style="padding:14px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.suave};">Sin fechas indicadas</td></tr>`;
  }
  const celda = /* @__PURE__ */ __name((contenido, extra = "") => `<td class="tCell" style="padding:12px;border-bottom:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.suave};${extra}">${contenido}</td>`, "celda");
  return fechas.map((f) => `<tr>
      ${celda(texto(f.fecha, 80), `color:${C.tinta};text-transform:capitalize;`)}
      ${celda(texto(f.jornada, 40))}
      ${celda(texto(f.layout, 40))}
      ${celda(texto(f.asistentes, 10), "text-align:center;")}
    </tr>`).join("");
}, "filasFechas");
var tablaFechas = /* @__PURE__ */ __name((fechas, margen = "") => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;${margen}">
      <tr>${cabeceraTabla()}</tr>
      ${filasFechas(fechas)}
    </table>`, "tablaFechas");
var boton = /* @__PURE__ */ __name((url, etiqueta) => `<!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
      href="${url}" style="height:44px;v-text-anchor:middle;width:210px;" arcsize="18%" stroke="f" fillcolor="${C.acento}">
      <w:anchorlock/>
      <center style="color:${C.blanco};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${etiqueta}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
      <tr>
        <td style="background-color:${C.acento};border-radius:8px;">
          <a href="${url}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${C.blanco};text-decoration:none;">${etiqueta}</a>
        </td>
      </tr>
    </table>
    <!--<![endif]-->`, "boton");
var avisoOferta = /* @__PURE__ */ __name((oferta, ahorro = null) => {
  if (!oferta?.nombre) return "";
  const paraCliente = ahorro !== null;
  const linea = paraCliente ? `<p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.ofertaTexto};">Ahorras ${importe(ahorro)}${oferta.detalle ? ` \xB7 ${texto(oferta.detalle, 200)}` : ""}</p>` : oferta.detalle ? `<p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.ofertaTexto};">${texto(oferta.detalle, 200)}</p>` : "";
  const codigo = !paraCliente && oferta.codigo ? ` &nbsp;\xB7&nbsp; c\xF3digo ${texto(oferta.codigo, 40)}` : "";
  return `<tr>
      <td class="px" style="padding:${paraCliente ? "22px" : "16px"} 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.ofertaFondo};border:1px solid ${C.ofertaBorde};border-radius:8px;">
          <tr>
            <td style="padding:${paraCliente ? "14px 18px" : "12px 16px"};${paraCliente ? "text-align:center;" : ""}">
              <p style="margin:0 0 ${paraCliente ? "3px" : "2px"};font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.ofertaTexto};">Oferta aplicada</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${C.ofertaTexto};">${texto(oferta.nombre, 80)}${codigo}</p>
              ${linea}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}, "avisoOferta");
var filasDesglose = /* @__PURE__ */ __name((p, oferta, [arriba, medio]) => {
  const descuento = oferta?.nombre && p.descuento ? `<tr>
      <td style="padding:${medio};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${C.ofertaTexto};">${texto(oferta.nombre, 60)}</td>
      <td style="padding:${medio};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${C.ofertaTexto};text-align:right;white-space:nowrap;">\u2212${importe(p.descuento)}</td>
    </tr>` : "";
  return `<tr>
      <td style="padding:${arriba};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.suave};">Sala</td>
      <td style="padding:${arriba};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.tinta};text-align:right;white-space:nowrap;">${importe(p.base)}</td>
    </tr>
    <tr>
      <td style="padding:${medio};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.suave};">Extras</td>
      <td style="padding:${medio};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.tinta};text-align:right;white-space:nowrap;">${importe(p.extras)}</td>
    </tr>
    ${descuento}`;
}, "filasDesglose");
var armazon = /* @__PURE__ */ __name((titulo, filas) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>${escapar(titulo)}</title>
  <style type="text/css">${ESTILOS_MOVIL}</style>
</head>
<body style="margin:0;padding:0;background-color:${C.fondo};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${C.fondo};">
  <tr>
    <td align="center" class="wrapPad" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
        style="max-width:600px;width:100%;background-color:${C.blanco};border-radius:12px;overflow:hidden;border:1px solid ${C.linea};">
        ${filas}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`, "armazon");
var correoHotel = /* @__PURE__ */ __name((d) => {
  const enlace = `${URL_PANEL}?ref=${encodeURIComponent(d.referencia)}`;
  return armazon("Nueva solicitud de reserva", `
    ${BARRA}
    ${cabecera("Nueva solicitud de reserva")}

    <!-- Referencia. El n\xFAmero es ahora un enlace al panel con la reserva
         ya filtrada. El bloque entero no se puede hacer pinchable en el
         Outlook de escritorio (el motor de Word no respeta un <a> que
         envuelve una tabla), as\xED que el enlace es el n\xFAmero y abajo queda
         el bot\xF3n, que s\xED funciona en todas partes. -->
    <tr>
      <td class="px" style="padding:28px 40px 0;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td style="background-color:${C.refFondo};border:1px solid ${C.refBorde};border-radius:8px;padding:10px 24px;">
              <p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Referencia</p>
              <p class="refNum" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:1px;">
                <a href="${enlace}" style="color:${C.acento};text-decoration:none;">${texto(d.referencia, 40)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Estado -->
    <tr>
      <td class="px" style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.avisoFondo};border:1px solid ${C.avisoBorde};border-radius:8px;">
          <tr>
            <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.avisoTitu};">Pendiente de confirmaci\xF3n</p>
              <p style="margin:0;font-size:14px;line-height:20px;color:${C.avisoTexto};">
                Contacta con el cliente y, cuando est\xE9 cerrada, conf\xEDrmala o canc\xE9lala en el panel. Las solicitudes no bloquean la fecha.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${avisoOferta(d.oferta)}

    <!-- Datos de contacto -->
    <tr>
      <td class="px" style="padding:28px 40px 0;">
        ${rotulo("Datos de contacto")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          <tr>
            <td class="labelCell" style="padding:14px 16px;border-bottom:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;width:110px;">Nombre</td>
            <td style="padding:14px 16px;border-bottom:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:${C.tinta};">${texto(d.contacto.nombre, 120)}</td>
          </tr>
          <tr>
            <td class="labelCell" style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;">Email</td>
            <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.tinta};word-break:break-all;"><a href="mailto:${texto(d.contacto.email, 120)}" style="color:${C.tinta};text-decoration:underline;">${texto(d.contacto.email, 120)}</a></td>
          </tr>
          ${d.contacto.telefono ? `<tr>
            <td class="labelCell" style="padding:14px 16px;border-top:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;">Tel\xE9fono</td>
            <td style="padding:14px 16px;border-top:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.tinta};"><a href="tel:${texto(d.contacto.telefono, 40)}" style="color:${C.tinta};text-decoration:underline;">${texto(d.contacto.telefono, 40)}</a></td>
          </tr>` : ""}
        </table>
      </td>
    </tr>

    <!-- Sala -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        ${rotulo("Sala solicitada")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:${C.tinta};">${texto(d.sala.nombre, 80)}</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.suave};">${texto(d.sala.metros, 20)} m\xB2 &nbsp;\xB7&nbsp; Hasta ${texto(d.sala.capacidad, 10)} personas</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Fechas -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        ${rotulo("Detalle de fechas")}
        ${tablaFechas(d.fechas)}
      </td>
    </tr>

    <!-- Extras -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Extras</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.tinta};line-height:22px;">${d.extras.length ? d.extras.map((e) => texto(e, 60)).join(", ") : "Ninguno"}</p>
      </td>
    </tr>

    <!-- Desglose -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Desglose</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          ${filasDesglose(d.precios, d.oferta, ["12px 16px", "0 16px 12px"])}
          <tr>
            <td style="padding:14px 16px;border-top:2px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;vertical-align:middle;">Total estimado</td>
            <td style="padding:14px 16px;border-top:2px solid ${C.linea};text-align:right;vertical-align:middle;">
              <p class="bigPrice" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:${C.tinta};white-space:nowrap;">${importe(d.precios.total)}</p>
              <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${C.tenue};">${TEXTO_IVA}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Comentarios -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Comentarios</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.suave};line-height:22px;">${d.contacto.comentarios ? multilinea(d.contacto.comentarios) : "\u2014"}</p>
      </td>
    </tr>

    <!-- Bot\xF3n al panel -->
    <tr>
      <td class="px" style="padding:28px 40px 0;" align="center">
        ${boton(enlace, "Abrir en el panel")}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="px" style="padding:32px 40px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="border-top:1px solid ${C.linea};padding-top:20px;text-align:center;">
              <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.tenue};">Si respondes a este email, la respuesta le llega directamente al cliente.</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.tenue};">Suites Viena \xB7 Plaza de Espa\xF1a, Madrid</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`);
}, "correoHotel");
var correoCliente = /* @__PURE__ */ __name((d) => armazon("Solicitud recibida - Suites Viena", `
    ${BARRA}
    ${cabecera("Solicitud recibida")}

    <!-- Saludo -->
    <tr>
      <td class="px" style="padding:32px 40px 0;">
        <p class="greet" style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:${C.tinta};">Hola, ${texto(d.contacto.nombre, 80)}</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.suave};line-height:24px;">Gracias por tu inter\xE9s. Hemos recibido tu solicitud y la estamos revisando. Te escribiremos en las pr\xF3ximas horas para confirmar la disponibilidad y cerrar los detalles contigo.</p>
      </td>
    </tr>

    <!-- Estado -->
    <tr>
      <td class="px" style="padding:22px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.avisoFondo};border:1px solid ${C.avisoBorde};border-radius:10px;">
          <tr>
            <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.avisoTitu};">Pendiente de confirmaci\xF3n</p>
              <p style="margin:0;font-size:14px;line-height:21px;color:${C.avisoTexto};">Tu solicitud est\xE1 pendiente de confirmaci\xF3n. Te escribiremos para cerrar los detalles; hasta entonces la sala no queda reservada.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Referencia -->
    <tr>
      <td class="px" style="padding:24px 40px 0;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
          style="background-color:${C.refFondo};border:1px solid ${C.refBorde};border-radius:10px;width:100%;max-width:340px;">
          <tr>
            <td style="padding:22px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.acento};">Tu n\xFAmero de referencia</p>
              <p class="refNum" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:${C.acento};letter-spacing:1.5px;">${texto(d.referencia, 40)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${avisoOferta(d.oferta, d.precios.descuento)}

    <!-- Resumen -->
    <tr>
      <td class="px" style="padding:28px 40px 0;">
        <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Resumen de tu solicitud</p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;margin-bottom:16px;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:${C.tinta};">${texto(d.sala.nombre, 80)}</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.suave};">${texto(d.sala.metros, 20)} m\xB2 &nbsp;\xB7&nbsp; Hasta ${texto(d.sala.capacidad, 10)} personas</p>
            </td>
          </tr>
        </table>

        ${tablaFechas(d.fechas, "margin-bottom:16px;")}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;margin-bottom:16px;">
          <tr>
            <td class="labelCell" style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;width:110px;">Extras</td>
            <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.tinta};">${d.extras.length ? d.extras.map((e) => texto(e, 60)).join(", ") : "Ninguno"}</td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          ${filasDesglose(d.precios, d.oferta, ["14px 20px 10px", "0 20px 10px"])}
          <tr>
            <td style="padding:14px 20px;border-top:2px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;vertical-align:middle;">Precio estimado</td>
            <td style="padding:14px 20px;border-top:2px solid ${C.linea};text-align:right;vertical-align:middle;">
              <p class="bigPrice" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:${C.tinta};white-space:nowrap;">${importe(d.precios.total)}</p>
              <p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${C.tenue};">${TEXTO_IVA} \xB7 pendiente de confirmaci\xF3n</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Contacto -->
    <tr>
      <td class="px" style="padding:28px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          <tr>
            <td style="padding:20px 22px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${C.tinta};">\xBFQuieres cambiar algo o tienes alguna pregunta?</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.suave};line-height:20px;">
                Responde a este email o ll\xE1manos al
                <a href="tel:${TELEFONO_HOTEL.tel}" style="color:${C.acento};text-decoration:underline;white-space:nowrap;">${TELEFONO_HOTEL.texto}</a>
                indicando tu referencia.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="px" style="padding:32px 40px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="border-top:1px solid ${C.linea};padding-top:20px;text-align:center;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:${C.tinta};">Suites Viena Plaza de Espa\xF1a</p>
              <p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.tenue};">C/ Juan \xC1lvarez Mendiz\xE1bal, 17 \xB7 28008 Madrid</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.tenue};">
                <a href="https://suitesvienaeventos.com" style="color:${C.acento};text-decoration:underline;">suitesvienaeventos.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`), "correoCliente");
async function enviar(apiKey, mensaje) {
  const respuesta = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(mensaje)
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`Brevo ${respuesta.status}: ${detalle.slice(0, 300)}`);
  }
  return respuesta.json();
}
__name(enviar, "enviar");
function leerDatos(cuerpo) {
  const contacto = cuerpo?.contacto || {};
  const precios = cuerpo?.precios || {};
  if (!cuerpo?.referencia) throw new Error("falta la referencia");
  if (!esEmail(contacto.email)) throw new Error("email de contacto no v\xE1lido");
  if (!contacto.nombre) throw new Error("falta el nombre de contacto");
  return {
    referencia: String(cuerpo.referencia),
    contacto: {
      nombre: contacto.nombre,
      email: contacto.email,
      telefono: contacto.telefono || "",
      comentarios: contacto.comentarios || ""
    },
    sala: {
      nombre: cuerpo?.sala?.nombre || "\u2014",
      metros: cuerpo?.sala?.metros || "\u2014",
      capacidad: cuerpo?.sala?.capacidad || "\u2014"
    },
    fechas: Array.isArray(cuerpo.fechas) ? cuerpo.fechas.slice(0, 30) : [],
    extras: Array.isArray(cuerpo.extras) ? cuerpo.extras.slice(0, 20) : [],
    precios: {
      base: Number(precios.base) || 0,
      extras: Number(precios.extras) || 0,
      descuento: Number(precios.descuento) || 0,
      total: Number(precios.total) || 0
    },
    oferta: cuerpo.oferta || null
  };
}
__name(leerDatos, "leerDatos");
async function onRequestPost({ request, env: env2 }) {
  const origen = request.headers.get("Origin");
  if (origen && !ORIGENES.includes(origen)) {
    return json({ ok: false, error: "origen no permitido" }, 403);
  }
  if (!env2.BREVO_API_KEY) {
    console.error("BREVO_API_KEY no est\xE1 configurada en este entorno");
    return json({ ok: false, error: "configuraci\xF3n incompleta" }, 500);
  }
  let datos;
  try {
    datos = leerDatos(await request.json());
  } catch (err) {
    return json({ ok: false, error: err.message }, 400);
  }
  const resultados = await Promise.allSettled([
    enviar(env2.BREVO_API_KEY, {
      sender: REMITENTE,
      to: [DIRECCION],
      replyTo: { email: datos.contacto.email, name: datos.contacto.nombre },
      subject: `Nueva solicitud ${datos.referencia} \u2014 ${datos.sala.nombre}`,
      htmlContent: correoHotel(datos),
      tags: ["reserva", "aviso-hotel"]
    }),
    enviar(env2.BREVO_API_KEY, {
      sender: REMITENTE,
      to: [{ email: datos.contacto.email, name: datos.contacto.nombre }],
      replyTo: DIRECCION,
      subject: `Solicitud recibida \u2014 Suites Viena (${datos.referencia})`,
      htmlContent: correoCliente(datos),
      tags: ["reserva", "copia-cliente"]
    })
  ]);
  const [hotel, cliente] = resultados;
  resultados.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(
        `Reserva ${datos.referencia}: no ha salido el correo ${i === 0 ? "al hotel" : "al cliente"}.`,
        r.reason?.message || r.reason
      );
    }
  });
  return json({
    ok: hotel.status === "fulfilled" && cliente.status === "fulfilled",
    hotel: hotel.status === "fulfilled",
    cliente: cliente.status === "fulfilled"
  });
}
__name(onRequestPost, "onRequestPost");

// admin/[[path]].js
async function onRequest({ request, env: env2 }) {
  const plantilla = await env2.ASSETS.fetch(new URL("/admin/", request.url));
  const cabeceras = new Headers(plantilla.headers);
  cabeceras.set("X-Robots-Tag", "noindex, nofollow");
  cabeceras.set("Cache-Control", "no-cache");
  return new Response(plantilla.body, { status: 200, headers: cabeceras });
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-mBvUyM/functionsRoutes-0.2878036611212116.mjs
var routes = [
  {
    routePath: "/api/reserva",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/admin/:path*",
    mountPath: "/admin",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
