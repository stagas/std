"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--)
      if (decorator = decorators[i])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result)
      __defProp(target, key, result);
    return result;
  };
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // ../utils/src/array.ts
  function array(cnt, of2) {
    return Array.from(
      { length: cnt },
      (_, i) => of2(i)
    );
  }

  // ../utils/src/consumify.ts
  async function consumify(gen, cb) {
    for await (const v2 of gen) {
      cb(v2);
    }
  }

  // ../utils/src/deferred.ts
  function Deferred() {
    const _onwhen = () => {
      deferred.hasSettled = true;
      deferred.resolve = deferred.reject = noop;
    };
    const noop = () => {
    };
    let onwhen = _onwhen;
    const deferred = {
      hasSettled: false,
      when: (fn4) => {
        onwhen = () => {
          _onwhen();
          fn4();
        };
      }
    };
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = (arg) => {
        onwhen();
        deferred.value = arg;
        resolve(arg);
      };
      deferred.reject = (error2) => {
        onwhen();
        deferred.error = error2;
        reject(error2);
      };
    });
    return deferred;
  }

  // ../utils/src/callbackify.ts
  function callbackify(fn4, cb) {
    const deferred = Deferred();
    const res = consumify(fn4(), cb);
    res.then(deferred.resolve).catch(deferred.reject);
    return deferred;
  }

  // ../utils/src/memoize.ts
  function memoizeByRef(fn4, map = /* @__PURE__ */ new Map()) {
    function wrapped(arg) {
      if (map.has(arg))
        return map.get(arg);
      let res;
      map.set(arg, res = fn4.call(this, arg));
      return res;
    }
    return wrapped;
  }

  // ../utils/src/is.ts
  function isObject(v2) {
    return typeof v2 === "object" && v2 !== null && !Array.isArray(v2);
  }
  function isFunction(x) {
    return typeof x === "function";
  }
  var isCtor = memoizeByRef(function isCtor2(v2) {
    return isFunction(v2) && v2.toString().startsWith("class");
  });

  // ../utils/src/deep-merge.ts
  function deepMerge(dst, src, depth = Infinity) {
    src ??= {};
    for (const key in src) {
      let value = src[key];
      let current = dst[key];
      if (isObject(value) && isObject(current) && !Array.isArray(current)) {
        if (!depth) {
          dst[key] = value;
        } else if (depth === 1) {
          Object.assign(current, value);
        } else {
          deepMerge(current, value, depth - 1);
        }
      } else {
        dst[key] = value;
      }
    }
    return dst;
  }

  // ../utils/src/observe.ts
  var observe = {
    resize(el, fn4, settings) {
      const observer = new ResizeObserver(fn4);
      observer.observe(el, settings);
      if (settings?.initial)
        fn4([], observer);
      return () => observer.disconnect();
    },
    intersection(el, fn4, settings) {
      const observer = settings?.observer ?? new IntersectionObserver(fn4, settings);
      observer.observe(el);
      return Object.assign(() => {
        if (settings?.observer)
          observer.unobserve(el);
        else
          observer.disconnect();
      }, { observer });
    },
    mutation(el, fn4, settings) {
      const observer = new MutationObserver(fn4);
      observer.observe(el, settings);
      if (settings?.initial)
        fn4([], observer);
      return () => observer.disconnect();
    },
    gc: (item, value, fn4) => {
      const reg = new FinalizationRegistry(fn4);
      reg.register(item, value);
      return reg;
    }
  };

  // ../utils/src/event-emitter.ts
  var EventEmitter = class {
    #listeners = {};
    get listeners() {
      return this.#listeners;
    }
    set listeners(listeners) {
      this.#listeners = Object.fromEntries(
        Object.entries(
          listeners
        ).map(
          ([id, listeners2]) => [id, listeners2.filter(
            (listener) => listener.callback != null
          )]
        ).filter(
          ([, listeners2]) => listeners2.length
        )
      );
    }
    constructor(data) {
      Object.assign(this, data);
    }
    emit(eventName, ...args) {
      if (this.listeners[eventName]) {
        this.listeners[eventName].forEach((item) => {
          if (typeof item.callback === "function") {
            item.callback(...args);
          }
          if (item.once === true) {
            this.off(eventName, item.callback);
          }
        });
      }
      return this;
    }
    on(eventName, callback, options) {
      if (!callback)
        return () => {
        };
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }
      const hasListener = this.listeners[eventName].some(
        (item) => item.callback === callback
      );
      if (!hasListener) {
        this.listeners[eventName].push({ ...options, callback });
      }
      return () => {
        this.off(eventName, callback);
      };
    }
    off(eventName, callback) {
      if (!this.listeners[eventName]) {
        return;
      }
      const index = this.listeners[eventName].findIndex(
        (item) => item.callback === callback
      );
      if (index >= 0) {
        this.listeners[eventName].splice(index, 1);
      }
      if (this.listeners[eventName].length === 0) {
        delete this.listeners[eventName];
      }
      return this;
    }
    once(eventName, callback) {
      return this.on(eventName, callback, { once: true });
    }
  };

  // ../utils/src/iterify.ts
  function iterify(fn4, options) {
    const deferreds = [];
    const queued = [];
    const cb = (arg) => {
      if (deferreds.length) {
        const d2 = deferreds.shift();
        if (arg instanceof Error)
          d2.reject(arg);
        else
          d2.resolve(arg);
      } else
        queued.push(arg);
    };
    const off = fn4(cb);
    const dispose2 = () => {
      off?.();
      const disposed = new Error("Disposed.");
      let d2;
      while (d2 = deferreds.shift()) {
        d2.reject(disposed);
      }
    };
    if (options?.unsafeInitial && !queued.length) {
      cb();
    }
    return {
      dispose: dispose2,
      async *[Symbol.asyncIterator]() {
        try {
          while (true) {
            if (queued.length) {
              const arg = queued.shift();
              if (arg instanceof Error)
                yield Promise.reject(arg);
              else
                yield Promise.resolve(arg);
            } else {
              const deferred = Deferred();
              deferreds.push(deferred);
              yield deferred.promise;
            }
          }
        } catch (error2) {
          throw error2;
        } finally {
          dispose2();
        }
      }
    };
  }

  // ../utils/src/object.ts
  var { values, getPrototypeOf, getOwnPropertyDescriptor, getOwnPropertyDescriptors } = Object;
  function assign(o, ...p4) {
    return Object.assign(o, ...p4);
  }
  function entries(obj) {
    return Object.entries(obj);
  }
  function fromEntries(entries2) {
    return Object.fromEntries(entries2);
  }
  var emptyObject = { __proto__: null };
  function getAllPropertyDescriptors(object) {
    if (object === Object.prototype) {
      return emptyObject;
    } else {
      return Object.assign(
        { __proto__: null },
        getAllPropertyDescriptorsMemoized(getPrototypeOf(object)),
        getOwnPropertyDescriptors(object)
      );
    }
  }
  var getAllPropertyDescriptorsMemoized = memoizeByRef(getAllPropertyDescriptors);
  function getPropertyDescriptor(object, key) {
    if (object === Object.prototype) {
      return;
    } else {
      const desc = getOwnPropertyDescriptor(object, key);
      if (!desc)
        return getPropertyDescriptor(getPrototypeOf(object), key);
      return desc;
    }
  }

  // ../utils/src/on.ts
  function onEvent(t, e, f, options) {
    if (!f || typeof f === "object") {
      return iterify((cb) => onEvent(t, e, cb, f));
    }
    if (t instanceof EventTarget) {
      t.addEventListener(e, f, options);
      if (options?.unsafeInitial) {
        f();
      }
      return () => t.removeEventListener(e, f, options);
    } else if (t instanceof EventEmitter) {
      if (options?.unsafeInitial) {
        f();
      }
      return t.on(e, f, options);
    } else {
      throw new TypeError("Cannot listen for events, object is neither an EventTarget nor an EventEmitter.");
    }
  }
  var on = assign(
    onEvent,
    {
      once: function onEventOnce(t, e, f, options) {
        options = { ...options, once: true };
        const deferred = Deferred();
        const inner = function(e2) {
          const retValue = f.call(this, e2);
          deferred.resolve(e2);
          return retValue;
        };
        const off = onEvent(e, inner, options);
        return Object.assign(
          off,
          {
            then: deferred.promise.then.bind(deferred.promise),
            catch: deferred.promise.catch.bind(deferred.promise)
          }
        );
      }
    }
  );

  // ../utils/src/prevent-stop.ts
  var prevent = Object.assign((e) => {
    e.preventDefault?.();
  }, {
    stop: (e) => {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
  });
  var stop = Object.assign((e) => {
    e.stopPropagation?.();
  }, {
    prevent: (e) => {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
  });

  // ../utils/src/dom.ts
  var dom = {
    el: (tag, props) => deepMerge(
      document.createElement(tag),
      props
    ),
    get body() {
      return document.body;
    },
    get head() {
      return document.head;
    },
    observe,
    stop,
    prevent,
    on
  };

  // ../utils/src/error.ts
  function error(errCtor, name, pre) {
    return class extends errCtor {
      constructor(msg, callSite) {
        super((pre ? pre + ": " : "") + msg);
        this.name = name;
        if (callSite)
          Error.captureStackTrace(this, callSite);
      }
    };
  }
  function errs(spec) {
    return fromEntries(
      entries(spec).map(
        ([key, value]) => [key, error(value[0], key, value[1])]
      )
    );
  }

  // ../utils/src/math.ts
  function clamp(min, max, x) {
    if (x < min)
      x = min;
    if (x > max)
      x = max;
    return x;
  }
  function nextPowerOfTwo(x) {
    if ((x & x - 1) === 0) {
      return x;
    }
    let power = 1;
    while (power < x) {
      power <<= 1;
    }
    return power;
  }

  // ../utils/src/gc-free-array.ts
  var pools;
  var gcFreeArrays;
  var GcFreeArray = class {
    static get(size) {
      gcFreeArrays ??= /* @__PURE__ */ new Map();
      let pool = gcFreeArrays.get(size);
      if (!pool)
        gcFreeArrays.set(size, pool = []);
      if (pool.length)
        return pool.pop();
      return new GcFreeArray(size);
    }
    data;
    size = 0;
    _head = 0;
    _innerSize;
    _innerMask;
    constructor(beginSize) {
      this._innerSize = nextPowerOfTwo(beginSize);
      this._innerMask = this._innerSize - 1;
      this.data = pools?.get(this._innerSize)?.pop() ?? Array.from({ length: this._innerSize });
    }
    _grow() {
      const newInnerSize = this._innerSize << 1;
      const newData = pools?.get(newInnerSize)?.pop() ?? Array.from({ length: newInnerSize });
      for (let i = this._head, tail = this._head + this.size, x = 0, y; i < tail; i++, x++) {
        y = i & this._innerMask;
        newData[x] = this.data[y];
      }
      this._disposeInnerData();
      this._head = 0;
      this._innerSize = newInnerSize;
      this._innerMask = this._innerSize - 1;
      this.data = newData;
    }
    dispose() {
      this.clear();
      gcFreeArrays ??= /* @__PURE__ */ new Map();
      let pool = gcFreeArrays.get(this._innerSize);
      if (!pool)
        gcFreeArrays.set(this._innerSize, pool = []);
      pool.push(this);
    }
    _disposeInnerData() {
      pools ??= /* @__PURE__ */ new Map();
      let pool = pools.get(this._innerSize);
      if (!pool)
        pools.set(this._innerSize, pool = []);
      pool.push(this.data);
    }
    copy() {
      const newArray = GcFreeArray.get(this._innerSize);
      for (let i = this._head, tail = this._head + this.size; i < tail; i++) {
        newArray.push(this.data[i & this._innerMask]);
      }
      return newArray;
    }
    push(item) {
      if (this.size === this._innerSize)
        this._grow();
      this.data[this._head + this.size & this._innerMask] = item;
      this.size++;
    }
    pop() {
      if (!this.size)
        return;
      --this.size;
      return this.data[this._head + this.size & this._innerMask];
    }
    unshift(item) {
      if (this.size === this._innerSize)
        this._grow();
      this._head = this._head + this._innerSize - 1 & this._innerMask;
      this.data[this._head] = item;
      this.size++;
    }
    shift() {
      if (!this.size)
        return;
      --this.size;
      const item = this.data[this._head];
      this._head = this._head + 1 & this._innerMask;
      return item;
    }
    delete(item) {
      if (!this.includes(item))
        return;
      const newData = pools?.get(this._innerSize)?.pop() ?? Array.from({ length: this._innerSize });
      let size = this.size;
      for (let i = this._head, tail = this._head + this.size, x = 0, it2; i < tail; i++) {
        it2 = this.data[i & this._innerMask];
        if (it2 === item) {
          --size;
          continue;
        }
        newData[x++] = it2;
      }
      this._disposeInnerData();
      this.data = newData;
      this._head = 0;
      this.size = size;
    }
    forEach(fn4) {
      for (let i = this._head, tail = this._head + this.size; i < tail; i++) {
        fn4(this.data[i & this._innerMask]);
      }
    }
    every(fn4) {
      for (let i = this._head, tail = this._head + this.size; i < tail; i++) {
        if (!fn4(this.data[i]))
          return false;
      }
      return true;
    }
    clear() {
      this._head = this.size = 0;
    }
    includes(item) {
      const tail = this._head + this.size;
      if (tail > this._innerSize) {
        if (this.data.indexOf(item, this._head) >= 0)
          return true;
        const wrapIndex = tail & this._innerMask;
        const index = this.data.indexOf(item);
        if (index >= 0 && index < wrapIndex)
          return true;
      } else {
        const index = this.data.indexOf(item, this._head);
        if (index >= 0 && index < tail)
          return true;
      }
      return false;
    }
    *[Symbol.iterator]() {
      for (let i = this._head, tail = this._head + this.size; i < tail; i++) {
        yield this.data[i & this._innerMask];
      }
    }
  };

  // ../utils/src/logger.ts
  Symbol.dispose ||= Symbol.for("Symbol.dispose");
  Symbol.asyncDispose ||= Symbol.for("Symbol.asyncDispose");
  var loggerContext = {
    options: {
      quiet: false,
      prod: false
    },
    itemId: "",
    ids: /* @__PURE__ */ new Set(),
    labels: /* @__PURE__ */ new Map(),
    arrows: /* @__PURE__ */ new Set(),
    ops: [],
    stack: [],
    emitter: new EventEmitter()
  };

  // ../utils/src/random-hex.ts
  function randomHex(digits = 3, minHex = "888", maxHex = "bbb") {
    const min = parseInt(minHex, 16);
    const max = parseInt(maxHex, 16);
    const scale = max - min;
    const hex = ((Math.random() * scale | 0) + min).toString(16).padStart(digits, "0");
    return hex;
  }

  // ../utils/src/required.ts
  var requiredTarget;
  var MissingDependencyError = class extends Error {
    constructor(prop) {
      super(`Property "${prop}" is required to be a non-nullish value.`);
      this.name = "MissingDependencyError";
      Error.captureStackTrace(this, requiredProxyHandler.get);
    }
  };
  var requiredProxyHandler = {
    get(_, prop) {
      if (prop in requiredTarget && requiredTarget[prop] != null) {
        return requiredTarget[prop];
      }
      throw new MissingDependencyError(prop);
    }
  };
  var MissingDependencyErrorSymbol = Symbol("MissingDependencyError");
  var requiredProxyHandlerFast = {
    get(_, prop) {
      if (prop in requiredTarget && requiredTarget[prop] != null) {
        return requiredTarget[prop];
      }
      throw MissingDependencyErrorSymbol;
    }
  };
  var RequiredProxy = new Proxy({}, requiredProxyHandler);
  var RequiredProxyFast = new Proxy({}, requiredProxyHandlerFast);
  function required(of2) {
    requiredTarget = of2;
    return RequiredProxy;
  }
  function requiredFast(of2) {
    requiredTarget = of2;
    return RequiredProxyFast;
  }

  // ../utils/src/rpc.ts
  var defaultTransferables = [
    typeof OffscreenCanvas !== "undefined" ? OffscreenCanvas : void 0,
    typeof MessagePort !== "undefined" ? MessagePort : void 0
  ].filter(Boolean);

  // ../utils/src/struct.ts
  var methods = {
    bool: [DataView.prototype.getUint8, DataView.prototype.setUint8],
    u8: [DataView.prototype.getUint8, DataView.prototype.setUint8],
    u16: [DataView.prototype.getUint16, DataView.prototype.setUint16],
    u32: [DataView.prototype.getUint32, DataView.prototype.setUint32],
    u64: [DataView.prototype.getBigUint64, DataView.prototype.setBigUint64],
    i8: [DataView.prototype.getInt8, DataView.prototype.setInt8],
    i16: [DataView.prototype.getInt16, DataView.prototype.setInt16],
    i32: [DataView.prototype.getInt32, DataView.prototype.setInt32],
    i64: [DataView.prototype.getBigInt64, DataView.prototype.setBigInt64],
    f32: [DataView.prototype.getFloat32, DataView.prototype.setFloat32],
    f64: [DataView.prototype.getFloat64, DataView.prototype.setFloat64],
    usize: [DataView.prototype.getUint32, DataView.prototype.setUint32]
  };

  // ../utils/src/uniterify.ts
  function uniterify(fn4, it2) {
    return async function* () {
      for await (const v2 of fn4) {
        yield it2(v2);
      }
    };
  }

  // ../utils/src/validate-type.ts
  var validateType = Object.assign(function validateType2(obj) {
    return obj;
  }, {
    assignable: function assignable(obj) {
      return obj;
    }
  });

  // ../signal/src/signal-core.ts
  var signal_core_exports = {};
  __export(signal_core_exports, {
    Computed: () => Computed,
    Signal: () => Signal,
    __signal__: () => __signal__,
    batch: () => batch,
    computed: () => computed,
    effect: () => effect,
    flush: () => flush,
    of: () => of,
    signal: () => signal,
    untrack: () => untrack,
    untracked: () => untracked
  });
  function cycleDetected() {
    throw new Error("Cycle detected");
  }
  function mutationDetected() {
    throw new Error("Computed cannot have side-effects");
  }
  var __signal__ = Symbol.for("preact-signals");
  var RUNNING = 1 << 0;
  var NOTIFIED = 1 << 1;
  var OUTDATED = 1 << 2;
  var DISPOSED = 1 << 3;
  var HAS_ERROR = 1 << 4;
  var TRACKING = 1 << 5;
  var pos;
  var EFFECT = 1;
  var BATCH = 2;
  var ignored = [];
  function startBatch() {
    batchDepth++;
  }
  function endBatch(force) {
    if (batchDepth > 1 && !force) {
      batchDepth--;
      return;
    }
    let error2;
    let hasError = false;
    while (batchedEffect !== void 0) {
      let effect2 = batchedEffect;
      batchedEffect = void 0;
      batchIteration++;
      while (effect2 !== void 0) {
        const next = effect2._nextBatchedEffect;
        effect2._nextBatchedEffect = void 0;
        effect2._flags &= ~NOTIFIED;
        if (!(effect2._flags & DISPOSED) && needsToRecompute(effect2)) {
          const prevPos = pos;
          try {
            pos = EFFECT;
            effect2._callback();
          } catch (err) {
            if (!hasError) {
              error2 = err;
              hasError = true;
            }
          }
          pos = prevPos;
        }
        effect2 = next;
      }
    }
    batchIteration = 0;
    if (!force) {
      batchDepth--;
    }
    if (hasError) {
      throw error2;
    }
  }
  function batch(callback, thisArg, args) {
    const prevPos = pos;
    if (batchDepth > 0) {
      try {
        pos = BATCH;
        return callback.apply(thisArg, args);
      } finally {
        pos = prevPos;
      }
    }
    startBatch();
    try {
      return callback.apply(thisArg, args);
    } finally {
      pos = prevPos;
      endBatch();
    }
  }
  var evalContext = void 0;
  var untrackedDepth = 0;
  function untracked(callback) {
    if (untrackedDepth > 0) {
      return callback();
    }
    const prevContext = evalContext;
    evalContext = void 0;
    untrackedDepth++;
    try {
      return callback();
    } finally {
      untrackedDepth--;
      evalContext = prevContext;
    }
  }
  var batchedEffect = void 0;
  var batchDepth = 0;
  var batchIteration = 0;
  var globalVersion = 0;
  function addDependency(signal2) {
    if (evalContext === void 0) {
      return void 0;
    }
    let node = signal2._node;
    if (node === void 0 || node._target !== evalContext) {
      node = {
        _version: 0,
        _source: signal2,
        _prevSource: evalContext._sources,
        _nextSource: void 0,
        _target: evalContext,
        _prevTarget: void 0,
        _nextTarget: void 0,
        _rollbackNode: node
      };
      if (evalContext._sources !== void 0) {
        evalContext._sources._nextSource = node;
      }
      evalContext._sources = node;
      signal2._node = node;
      if (evalContext._flags & TRACKING) {
        signal2._subscribe(node);
      }
      return node;
    } else if (node._version === -1) {
      node._version = 0;
      if (node._nextSource !== void 0) {
        node._nextSource._prevSource = node._prevSource;
        if (node._prevSource !== void 0) {
          node._prevSource._nextSource = node._nextSource;
        }
        node._prevSource = evalContext._sources;
        node._nextSource = void 0;
        evalContext._sources._nextSource = node;
        evalContext._sources = node;
      }
      return node;
    }
    return void 0;
  }
  function Signal(value) {
    this._value = value;
    this._version = 0;
    this._node = void 0;
    this._targets = void 0;
  }
  Signal.prototype[__signal__] = true;
  Object.defineProperty(Signal.prototype, "value", {
    enumerable: false,
    configurable: false,
    get() {
      return this.get();
    },
    set(v2) {
      this.set(v2);
    }
  });
  Signal.prototype.get = function() {
    const node = addDependency(this);
    if (node !== void 0) {
      node._version = this._version;
    }
    return this._value;
  };
  Signal.prototype.set = function(value) {
    if (evalContext instanceof Computed) {
      mutationDetected();
    }
    if (value !== this._value) {
      if (batchIteration > 100) {
        cycleDetected();
      }
      this._value = value;
      this._version++;
      globalVersion++;
      startBatch();
      try {
        for (let node = this._targets; node !== void 0; node = node._nextTarget) {
          node._target._notify();
        }
      } finally {
        endBatch();
      }
    }
  };
  Signal.prototype._refresh = function() {
    return true;
  };
  Signal.prototype._subscribe = function(node) {
    if (this._targets !== node && node._prevTarget === void 0) {
      node._nextTarget = this._targets;
      if (this._targets !== void 0) {
        this._targets._prevTarget = node;
      }
      this._targets = node;
    }
  };
  Signal.prototype._unsubscribe = function(node) {
    if (this._targets !== void 0) {
      const prev = node._prevTarget;
      const next = node._nextTarget;
      if (prev !== void 0) {
        prev._nextTarget = next;
        node._prevTarget = void 0;
      }
      if (next !== void 0) {
        next._prevTarget = prev;
        node._nextTarget = void 0;
      }
      if (node === this._targets) {
        this._targets = next;
      }
    }
  };
  Signal.prototype.subscribe = function(fn4) {
    const signal2 = this;
    return effect(function() {
      const value = signal2.value;
      const flag = this._flags & TRACKING;
      this._flags &= ~TRACKING;
      try {
        fn4(value);
      } finally {
        this._flags |= flag;
      }
    }, this);
  };
  Signal.prototype.valueOf = function() {
    return this.value;
  };
  Signal.prototype.toString = function() {
    return this.value + "";
  };
  Signal.prototype.toJSON = function() {
    return this.value;
  };
  Signal.prototype.peek = function() {
    return this._value;
  };
  function signal(value) {
    return new Signal(value);
  }
  function needsToRecompute(target) {
    for (let node = target._sources; node !== void 0; node = node._nextSource) {
      if (node._source._version !== node._version || !node._source._refresh() || node._source._version !== node._version) {
        return true;
      }
    }
    return false;
  }
  function prepareSources(target) {
    for (let node = target._sources; node !== void 0; node = node._nextSource) {
      const rollbackNode = node._source._node;
      if (rollbackNode !== void 0) {
        node._rollbackNode = rollbackNode;
      }
      node._source._node = node;
      node._version = -1;
      if (node._nextSource === void 0) {
        target._sources = node;
        break;
      }
    }
  }
  function cleanupSources(target) {
    let node = target._sources;
    let head = void 0;
    while (node !== void 0) {
      const prev = node._prevSource;
      if (node._version === -1) {
        node._source._unsubscribe(node);
        if (prev !== void 0) {
          prev._nextSource = node._nextSource;
        }
        if (node._nextSource !== void 0) {
          node._nextSource._prevSource = prev;
        }
      } else {
        head = node;
      }
      node._source._node = node._rollbackNode;
      if (node._rollbackNode !== void 0) {
        node._rollbackNode = void 0;
      }
      node = prev;
    }
    target._sources = head;
  }
  function Computed(compute, setter, thisArg) {
    Signal.call(this, void 0);
    this._compute = compute;
    this._setter = setter;
    this._sources = void 0;
    this._globalVersion = globalVersion - 1;
    this._flags = OUTDATED;
    this._thisArg = thisArg;
  }
  Computed.prototype = new Signal();
  Object.defineProperty(Computed.prototype, "value", {
    enumerable: false,
    configurable: false,
    get() {
      return this.get();
    },
    set(v2) {
      this.set(v2);
    }
  });
  Computed.prototype.get = function() {
    if (this._flags & RUNNING) {
      cycleDetected();
    }
    const node = addDependency(this);
    this._refresh();
    if (node !== void 0) {
      node._version = this._version;
    }
    if (this._flags & HAS_ERROR) {
      throw this._value;
    }
    return this._value;
  };
  Computed.prototype.set = function(v2) {
    this._setter?.call(this._thisArg, v2);
  };
  Computed.prototype._refresh = function() {
    this._flags &= ~NOTIFIED;
    if (this._flags & RUNNING) {
      return false;
    }
    if ((this._flags & (OUTDATED | TRACKING)) === TRACKING) {
      return true;
    }
    this._flags &= ~OUTDATED;
    if (this._globalVersion === globalVersion) {
      return true;
    }
    this._globalVersion = globalVersion;
    this._flags |= RUNNING;
    if (this._version > 0 && !needsToRecompute(this)) {
      this._flags &= ~RUNNING;
      return true;
    }
    const prevContext = evalContext;
    try {
      prepareSources(this);
      evalContext = this;
      const value = this._compute.call(this._thisArg);
      if (this._flags & HAS_ERROR || this._value !== value || this._version === 0) {
        this._value = value;
        this._flags &= ~HAS_ERROR;
        this._version++;
      }
    } catch (err) {
      this._value = err;
      this._flags |= HAS_ERROR;
      this._version++;
    }
    evalContext = prevContext;
    cleanupSources(this);
    this._flags &= ~RUNNING;
    return true;
  };
  Computed.prototype._subscribe = function(node) {
    if (this._targets === void 0) {
      this._flags |= OUTDATED | TRACKING;
      for (let node2 = this._sources; node2 !== void 0; node2 = node2._nextSource) {
        node2._source._subscribe(node2);
      }
    }
    Signal.prototype._subscribe.call(this, node);
  };
  Computed.prototype._unsubscribe = function(node) {
    if (this._targets !== void 0) {
      Signal.prototype._unsubscribe.call(this, node);
      if (this._targets === void 0) {
        this._flags &= ~TRACKING;
        for (let node2 = this._sources; node2 !== void 0; node2 = node2._nextSource) {
          node2._source._unsubscribe(node2);
        }
      }
    }
  };
  Computed.prototype._notify = function() {
    if (!(this._flags & NOTIFIED)) {
      this._flags |= OUTDATED | NOTIFIED;
      for (let node = this._targets; node !== void 0; node = node._nextTarget) {
        node._target._notify();
      }
    }
  };
  Computed.prototype.peek = function() {
    if (!this._refresh()) {
      cycleDetected();
    }
    if (this._flags & HAS_ERROR) {
      throw this._value;
    }
    return this._value;
  };
  function computed(compute, setter, thisArg) {
    return new Computed(compute, setter, thisArg);
  }
  function cleanupEffect(effect2) {
    const cleanup = effect2._cleanup;
    effect2._cleanup = void 0;
    if (typeof cleanup === "function") {
      startBatch();
      const prevContext = evalContext;
      evalContext = void 0;
      try {
        cleanup();
      } catch (err) {
        effect2._flags &= ~RUNNING;
        effect2._flags |= DISPOSED;
        disposeEffect(effect2);
        throw err;
      } finally {
        evalContext = prevContext;
        endBatch();
      }
    }
  }
  function disposeEffect(effect2) {
    for (let node = effect2._sources; node !== void 0; node = node._nextSource) {
      node._source._unsubscribe(node);
    }
    effect2._compute = void 0;
    effect2._sources = void 0;
    cleanupEffect(effect2);
  }
  function endEffect(prevContext) {
    if (evalContext !== this) {
      evalContext = ignored.pop();
      if (evalContext !== this) {
        throw new Error("Out-of-order effect");
      }
    }
    cleanupSources(this);
    evalContext = prevContext;
    this._flags &= ~RUNNING;
    if (this._flags & DISPOSED) {
      disposeEffect(this);
    }
    endBatch();
  }
  function Effect(compute, thisArg) {
    this._compute = compute;
    this._cleanup = void 0;
    this._sources = void 0;
    this._nextBatchedEffect = void 0;
    this._flags = TRACKING;
    this._thisArg = thisArg;
  }
  Effect.prototype._callback = function() {
    const finish = this._start();
    try {
      if (this._flags & DISPOSED)
        return;
      if (this._compute === void 0)
        return;
      const cleanup = this._compute.call(this._thisArg);
      if (typeof cleanup === "function") {
        this._cleanup = cleanup;
      }
    } catch (e) {
      if (e === MissingDependencyErrorSymbol) {
      } else
        throw e;
    } finally {
      finish();
    }
  };
  Effect.prototype._start = function() {
    if (this._flags & RUNNING) {
      cycleDetected();
    }
    this._flags |= RUNNING;
    this._flags &= ~DISPOSED;
    cleanupEffect(this);
    prepareSources(this);
    startBatch();
    const prevContext = evalContext;
    evalContext = this;
    return endEffect.bind(this, prevContext);
  };
  Effect.prototype._notify = function() {
    if (!(this._flags & NOTIFIED)) {
      this._flags |= NOTIFIED;
      this._nextBatchedEffect = batchedEffect;
      batchedEffect = this;
    }
  };
  Effect.prototype._dispose = function() {
    this._flags |= DISPOSED;
    if (!(this._flags & RUNNING)) {
      disposeEffect(this);
    }
  };
  function effect(c, thisArg) {
    const effect2 = new Effect(c, thisArg);
    const prevPos = pos;
    try {
      pos = EFFECT;
      effect2._callback();
      return effect2._dispose.bind(effect2);
    } catch (err) {
      try {
        effect2._dispose();
      } catch {
      }
      throw err;
    } finally {
      pos = prevPos;
    }
  }
  function untrack(callback) {
    if (callback)
      return untracked(callback);
    ignored.push(evalContext);
    evalContext = void 0;
  }
  var flush = endBatch.bind(null, true);
  function of(of2) {
    if (pos === EFFECT && evalContext) {
      return requiredFast(of2);
    } else {
      return required(of2);
    }
  }

  // ../signal/src/signal.ts
  var Err = errs({
    InvalidSignalType: [TypeError]
  });
  var __prop__ = Symbol("prop");
  var __struct__ = Symbol("struct");
  var __signals__ = Symbol("signals");
  var __effects__ = Symbol("effects");
  var __fx__ = Symbol("fx");
  var __fn__ = Symbol("fn");
  var __unwrap__ = Symbol("unwrap");
  function isSignal(v2) {
    return v2 && v2[__signal__];
  }
  function isProp(v2) {
    return v2 && v2[__prop__];
  }
  function isStruct(v2) {
    return v2 && v2[__struct__];
  }
  function isFx(v2) {
    return v2 && v2[__fx__];
  }
  function alias(of2, from2) {
    return { [__prop__]: from2 };
  }
  function dispose(fn4) {
    if (isStruct(fn4)) {
      fn4[__effects__].forEach(dispose);
    } else if (isFx(fn4)) {
      fn4.dispose?.();
    } else if (Array.isArray(fn4)) {
      fn4.forEach(dispose);
    }
  }
  var initDepth = 0;
  var effects = [];
  var forbiddenKeys = /* @__PURE__ */ new Set([
    "__proto__",
    "constructor"
  ]);
  var hidden = { configurable: false, enumerable: false };
  var ctorsPropDecos = /* @__PURE__ */ new Map();
  var s$ = function struct$(state, props) {
    if (isStruct(state))
      return assign(state, props);
    if (!isObject(state))
      throw new Err.InvalidSignalType(typeof state);
    const descs = getAllPropertyDescriptors(state);
    const aliases = [];
    const signals = {};
    const properties = {
      $: { ...hidden, value: signals },
      [__struct__]: { ...hidden, value: true },
      [__signals__]: { ...hidden, value: signals },
      [__effects__]: { ...hidden, value: /* @__PURE__ */ new Map() }
    };
    props ??= {};
    props = { ...props };
    initDepth++;
    const propDeco = /* @__PURE__ */ new Map();
    let proto = state.__proto__;
    while (proto) {
      ctorsPropDecos.get(proto)?.forEach((value, key) => {
        if (!propDeco.has(key))
          propDeco.set(key, value);
      });
      proto = proto.__proto__;
    }
    for (const key in descs) {
      if (forbiddenKeys.has(key))
        continue;
      const desc = descs[key];
      const cp2 = propDeco?.get(key);
      switch (cp2) {
        case __fn__:
          desc.value = wrapFn(desc.value);
          properties[key] = desc;
          break;
      }
      const isPropSignal = isSignal(props[key]);
      if (desc.get && !isPropSignal) {
        const s = computed(
          desc.get,
          desc.set,
          state
        );
        signals[key] = s;
        properties[key] = {
          get() {
            return s.value;
          },
          set(v2) {
            s.value = v2;
          }
        };
      } else {
        let s;
        let value = desc.value;
        if (isProp(props[key])) {
          value = props[key];
          delete props[key];
        }
        if (isPropSignal) {
          s = props[key];
          delete props[key];
        } else if (value == null) {
          s = signal(value);
        } else
          switch (typeof value) {
            case "object":
              if (value[__prop__]) {
                const p4 = value[__prop__];
                if (typeof p4 === "string") {
                  aliases.push({ fromKey: p4, toKey: key });
                  continue;
                } else if ("it" in p4) {
                  const from2 = p4;
                  s = signal(void 0);
                  effects.push({
                    fx: () => {
                      let off;
                      const fxfn = () => {
                        let { it: it2 } = from2;
                        for (const p5 of from2.path) {
                          if (!it2[p5])
                            return;
                          it2 = it2[p5];
                          if (it2 == null)
                            return;
                        }
                        off?.();
                        state[__effects__].delete(fxfn);
                        if (isSignal(it2)) {
                          it2.subscribe((value2) => {
                            state[key] = value2;
                          });
                          signals[key].subscribe((value2) => {
                            it2.value = value2;
                          });
                        } else {
                          state[key] = it2;
                        }
                      };
                      off = fx(fxfn);
                      state[__effects__].set(fxfn, off);
                    },
                    state
                  });
                } else if (__unwrap__ in p4) {
                  s = signal(p4.init);
                  let gen = p4[__unwrap__];
                  if (gen[Symbol.asyncIterator]) {
                    gen = uniterify(gen, p4.cb);
                  }
                  if (gen.constructor.name === "AsyncGeneratorFunction") {
                    effects.push({
                      fx: () => {
                        const deferred = callbackify(gen, (v2) => {
                          s.value = v2;
                        });
                        return deferred.reject;
                      },
                      state
                    });
                  }
                }
              } else if (__signal__ in value) {
                s = value;
              } else {
                s = signal(value);
              }
              break;
            case "function":
              if (isFx(value)) {
                assign(desc, hidden);
                properties[key] = desc;
                effects.push({ fx: state[key], state });
              }
              continue;
            default:
              s = signal(value);
              break;
          }
        signals[key] = s;
        properties[key] = {
          get() {
            return s.value;
          },
          set(v2) {
            s.value = v2;
          }
        };
      }
    }
    Object.defineProperties(state, properties);
    aliases.forEach(({ fromKey, toKey }) => {
      const desc = getPropertyDescriptor(state, fromKey);
      if (!desc) {
        throw new Error(`Alias target "${toKey}" failed, couldn't find property descriptor for source key "${fromKey}".`);
      }
      Object.defineProperty(state, toKey, desc);
      signals[toKey] = signals[fromKey];
    });
    deepMerge(state, props);
    if (!--initDepth) {
      effects.splice(0).forEach(
        ({ fx: fx7, state: state2 }) => fx7.call(state2)
      );
    }
    return state;
  };
  function wrapFn(fn4) {
    const v2 = function _fn(...args) {
      return batch(fn4, this, args);
    };
    v2[__fn__] = true;
    return v2;
  }
  var fn = function fnDecorator(t, k, d2) {
    if (!k) {
      return wrapFn(t);
    }
    if (!d2) {
      let props = ctorsPropDecos.get(t);
      if (!props)
        ctorsPropDecos.set(t, props = /* @__PURE__ */ new Map());
      props.set(k, __fn__);
      return;
    }
    d2.value = wrapFn(d2.value);
    return d2;
  };
  var fx = function fxDecorator(t, k, d2) {
    if (isFunction(t)) {
      return effect(t, k);
    }
    const fn4 = d2.value;
    d2.value = function _fx() {
      if (this[__effects__].has(_fx)) {
        throw new Error("Effect cannot be invoked more than once.");
      }
      const dispose2 = effect(fn4, this);
      this[__effects__].set(_fx, dispose2);
      return dispose2;
    };
    d2.value[__fx__] = true;
    return d2;
  };
  var init = function initDecorator(t, k, d2) {
    const fn4 = d2.value;
    d2.value = function _fx() {
      if (this[__effects__].has(_fx)) {
        throw new Error("Effect cannot be invoked more than once.");
      }
      const dispose2 = effect(function _init() {
        untrack();
        fn4.call(this);
      }, this);
      this[__effects__].set(_fx, dispose2);
      return dispose2;
    };
    d2.value[__fx__] = true;
    return d2;
  };
  function unwrap(obj, init2, init22) {
    return {
      [__prop__]: typeof init2 === "function" ? {
        [__unwrap__]: obj,
        cb: init2,
        init: init22
      } : {
        [__unwrap__]: obj,
        init: init2
      }
    };
  }
  function from(it2) {
    const path = [];
    const proxy = new Proxy(it2, {
      get(target, key) {
        if (key === __prop__ || key === Symbol.toPrimitive)
          return { it: it2, path };
        if (key === __signal__)
          return;
        if (typeof key === "symbol") {
          throw new Error('Attempt to access unknown symbol in "from": ' + key.toString());
        }
        path.push(key);
        return proxy;
      }
    });
    return proxy;
  }
  var $ = Object.assign(s$, {
    dispose,
    fn,
    fx,
    init,
    alias,
    from,
    unwrap
  }, signal_core_exports);

  // src/anim.ts
  var Anim = class {
    constructor() {
      this.tick = this.tick.bind(this);
    }
    items = [];
    isAnimating = false;
    startTime = 0;
    tickTime = 0;
    acc = 0;
    fps = 60;
    get coeff() {
      return 60 / this.fps * 0.25;
    }
    get timeStep() {
      return 1e3 / this.fps | 0;
    }
    get maxDeltaTime() {
      return this.timeStep * 5;
    }
    tick() {
      const { timeStep, maxDeltaTime, tickTime, coeff } = this;
      let needNextFrame = true;
      const now = performance.now();
      const dt = now - tickTime;
      this.tickTime = now;
      this.acc += dt;
      if (this.acc > timeStep) {
        this.acc -= timeStep;
        for (const item of this.items) {
          item.coeff = coeff;
          if (item.update(dt)) {
            needNextFrame = true;
          }
          if (needNextFrame) {
            item.updateOne(dt);
          }
        }
      }
      while (this.acc > timeStep) {
        this.acc -= timeStep;
        for (const item of this.items) {
          if (item.update(dt)) {
            needNextFrame = true;
          }
        }
      }
      const t = clamp(0, 1, this.acc / timeStep);
      for (const item of this.items) {
        item.draw(t);
      }
      if (this.isAnimating && needNextFrame) {
        requestAnimationFrame(this.tick);
      }
    }
    start() {
      if (this.isAnimating)
        return;
      this.isAnimating = true;
      this.tickTime = this.startTime = performance.now();
      this.tick();
    }
    stop() {
      this.isAnimating = false;
    }
  };
  __decorateClass([
    fn
  ], Anim.prototype, "tick", 1);

  // src/screen.ts
  var Screen = class {
    viewport = $(new Point());
    pr = unwrap(
      on(window, "resize", { unsafeInitial: true }),
      () => {
        this.viewport.w = window.innerWidth;
        this.viewport.h = window.innerHeight;
        return window.devicePixelRatio;
      },
      window.devicePixelRatio
    );
  };

  // src/world.ts
  var _World = class {
    screen = $(new Screen());
    anim = $(new Anim());
    isAnimating = this.anim.$.isAnimating;
    init() {
      _World.Current = $(this);
    }
  };
  var World = _World;
  __publicField(World, "Current");
  __decorateClass([
    init
  ], World.prototype, "init", 1);

  // src/shape.ts
  var Shape = class {
    label;
    strokeColor = "#3f3";
    fillColor = "#92e";
    get pr() {
      return World.Current.screen.pr;
    }
    get values() {
      return [];
    }
    get text() {
      return (this.label ? `${this.label}: ` : "") + this.values.join(" ");
    }
  };

  // src/point.ts
  var _Point = class extends Shape {
    x = 0;
    y = 0;
    get json() {
      const { x, y } = this;
      return { x, y };
    }
    get values() {
      const { x, y } = this;
      return [x, y];
    }
    get whPx() {
      return {
        width: this.width + "px",
        height: this.height + "px"
      };
    }
    get wh() {
      const { width, height } = this;
      return { width, height };
    }
    xy = alias(this, "json");
    left = alias(this, "x");
    top = alias(this, "y");
    right = alias(this, "y");
    bottom = alias(this, "x");
    l = alias(this, "left");
    r = alias(this, "right");
    t = alias(this, "top");
    b = alias(this, "bottom");
    w = alias(this, "x");
    h = alias(this, "y");
    width = alias(this, "x");
    height = alias(this, "y");
    col = alias(this, "x");
    line = alias(this, "y");
    get lineCol() {
      return this;
    }
    resizeToWindow() {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      return this;
    }
    equals(o) {
      if (typeof o === "number") {
        return this.x === o && this.y === o;
      } else {
        return this.x === o.x && this.y === o.y;
      }
    }
    safe() {
      $.fx(() => {
        this.finite();
      });
      return this;
    }
    copy() {
      const { x, y } = this;
      return $(new _Point(), { x, y });
    }
    zero() {
      return this.set(0);
    }
    get ifNotZero() {
      if (!this.equals(0))
        return this;
    }
    set(o) {
      if (typeof o === "number") {
        this.x = o;
        this.y = o;
      } else {
        this.x = o.x;
        this.y = o.y;
      }
      return this;
    }
    setFromEvent(o) {
      this.x = o.pageX;
      this.y = o.pageY;
      return this;
    }
    add(o) {
      if (typeof o === "number") {
        this.x += o;
        this.y += o;
      } else {
        this.x += o.x;
        this.y += o.y;
      }
      return this;
    }
    sub(o) {
      if (typeof o === "number") {
        this.x -= o;
        this.y -= o;
      } else {
        this.x -= o.x;
        this.y -= o.y;
      }
      return this;
    }
    div(o) {
      if (typeof o === "number") {
        this.x /= o;
        this.y /= o;
      } else {
        this.x /= o.x;
        this.y /= o.y;
      }
      return this;
    }
    mul(o) {
      if (typeof o === "number") {
        this.x *= o;
        this.y *= o;
      } else {
        this.x *= o.x;
        this.y *= o.y;
      }
      return this;
    }
    pow(o) {
      if (typeof o === "number") {
        this.x **= o;
        this.y **= o;
      } else {
        this.x **= o.x;
        this.y **= o.y;
      }
      return this;
    }
    normalize() {
      return this.div(this.mag);
    }
    finite() {
      const { x, y } = this;
      this.x = !isFinite(x) ? 0 : x;
      this.y = !isFinite(y) ? 0 : y;
      return this;
    }
    floor() {
      const { x, y } = this;
      this.x = Math.floor(x);
      this.y = Math.floor(y);
      return this;
    }
    ceil() {
      const { x, y } = this;
      this.x = Math.ceil(x);
      this.y = Math.ceil(y);
      return this;
    }
    round() {
      const { x, y } = this;
      this.x = Math.round(x);
      this.y = Math.round(y);
      return this;
    }
    neg() {
      const { x, y } = this;
      this.x = -x;
      this.y = -y;
      return this;
    }
    sqrt() {
      const { x, y } = this;
      this.x = Math.sqrt(x);
      this.y = Math.sqrt(y);
      return this;
    }
    get angle() {
      const { x, y } = this;
      return Math.atan2(y, x);
    }
    angleShiftBy(angle, distance) {
      this.x += distance * Math.cos(angle);
      this.y += distance * Math.sin(angle);
      return this;
    }
    get absSum() {
      const { x, y } = this;
      return Math.abs(x) + Math.abs(y);
    }
    get sum() {
      const { x, y } = this;
      return x + y;
    }
    get mag() {
      const { x, y } = this;
      return Math.sqrt(x * x + y * y);
    }
    chebyshev(o) {
      const { x, y } = this;
      return Math.max(
        Math.abs(o?.x ?? x),
        Math.abs(o?.y ?? y)
      );
    }
    manhattan(o) {
      const { x, y } = this;
      return Math.abs(o?.x ?? x) + Math.abs(o?.y ?? y);
    }
    distance(o) {
      return temp.set(o).sub(this).mag;
    }
    euclidean = alias(this, "distance");
    transformMatrix(m) {
      const { a, b, c, d: d2, e, f } = m;
      const { x, y } = this;
      this.x = a * x + c * y + e;
      this.y = b * x + d2 * y + f;
      return this;
    }
    transformMatrixInverse(m) {
      const { a, b, c, d: d2, e, f } = m;
      const { x, y } = this;
      const det = a * d2 - b * c;
      if (det === 0) {
        throw new Error("Matrix is not invertible.");
      }
      const idet = 1 / det;
      const invA = d2 * idet;
      const invB = -b * idet;
      const invC = -c * idet;
      const invD = a * idet;
      const invE = (c * f - e * d2) * idet;
      const invF = (e * b - a * f) * idet;
      this.x = invA * x + invC * y + invE;
      this.y = invB * x + invD * y + invF;
      return this;
    }
    normalizeMatrix(m) {
      const { a, b, c, d: d2, e, f } = m;
      const { x, y } = this;
      this.x = (x - e) / a;
      this.y = (y - f) / d2;
      return this;
    }
    lerp(o, t) {
      const { x, y } = this;
      this.x += (o.x - x) * t;
      this.y += (o.y - y) * t;
      return this;
    }
    rand(o, s = 1) {
      if (!o)
        o = 1;
      if (typeof o === "number") {
        this.x = Math.random() ** s * o;
        this.y = Math.random() ** s * o;
      } else {
        this.x = Math.random() ** s * o.x;
        this.y = Math.random() ** s * o.y;
      }
      return this;
    }
    clear(c) {
      const { w, h } = this;
      c.clearRect(0, 0, w, h);
      return this;
    }
    stroke(c, color = this.strokeColor) {
      const { w, h } = this;
      c.strokeStyle = color;
      c.strokeRect(0, 0, w, h);
      return this;
    }
    fill(c, color = this.fillColor) {
      const { w, h } = this;
      c.fillStyle = color;
      c.fillRect(0, 0, w, h);
      return this;
    }
    moveTo(c) {
      const { x, y } = this;
      c.moveTo(x, y);
      return this;
    }
    lineTo(c) {
      const { x, y } = this;
      c.lineTo(x, y);
      return this;
    }
    withinRect(r) {
      return r.isPointWithin(this);
    }
    touchPoint(other, center) {
      center ??= other.center;
      const i = temp.set(this).intersectPoint(other, center).sub(other.center);
      this.x = i.x;
      this.y = i.y;
      return this;
    }
    intersectPoint(other, center) {
      center ??= other.center;
      const w = other.w * 0.5;
      const h = other.h * 0.5;
      const d2 = temp.set(center).add(other.center);
      const tan_phi = h / w;
      const tan_theta = Math.abs(d2.y / d2.x);
      const qx = Math.sign(d2.x);
      const qy = Math.sign(d2.y);
      let xI, yI;
      if (tan_theta > tan_phi) {
        xI = h / tan_theta * qx;
        yI = h * qy;
      } else {
        xI = w * qx;
        yI = w * tan_theta * qy;
      }
      this.x = xI;
      this.y = yI;
      return this;
    }
  };
  var Point = _Point;
  __decorateClass([
    fn
  ], Point.prototype, "resizeToWindow", 1);
  __decorateClass([
    fn
  ], Point.prototype, "set", 1);
  __decorateClass([
    fn
  ], Point.prototype, "setFromEvent", 1);
  __decorateClass([
    fn
  ], Point.prototype, "add", 1);
  __decorateClass([
    fn
  ], Point.prototype, "sub", 1);
  __decorateClass([
    fn
  ], Point.prototype, "div", 1);
  __decorateClass([
    fn
  ], Point.prototype, "mul", 1);
  __decorateClass([
    fn
  ], Point.prototype, "pow", 1);
  __decorateClass([
    fn
  ], Point.prototype, "finite", 1);
  __decorateClass([
    fn
  ], Point.prototype, "floor", 1);
  __decorateClass([
    fn
  ], Point.prototype, "ceil", 1);
  __decorateClass([
    fn
  ], Point.prototype, "round", 1);
  __decorateClass([
    fn
  ], Point.prototype, "neg", 1);
  __decorateClass([
    fn
  ], Point.prototype, "sqrt", 1);
  __decorateClass([
    fn
  ], Point.prototype, "angleShiftBy", 1);
  __decorateClass([
    fn
  ], Point.prototype, "transformMatrix", 1);
  __decorateClass([
    fn
  ], Point.prototype, "transformMatrixInverse", 1);
  __decorateClass([
    fn
  ], Point.prototype, "normalizeMatrix", 1);
  __decorateClass([
    fn
  ], Point.prototype, "lerp", 1);
  __decorateClass([
    fn
  ], Point.prototype, "rand", 1);
  var temp = $(new Point());

  // src/line.ts
  var Line = class extends Shape {
    p1 = $(new Point());
    p2 = $(new Point());
    deltaPoint = $(new Point());
    lerpPoint = $(new Point());
    get json() {
      const { p1, p2: p22 } = this;
      return { p1: p1.json, p2: p22.json };
    }
    get _center() {
      return $(new Point());
    }
    get center() {
      const { p1, p2: p22, _center: c } = this;
      c.x = (p1.x + p22.x) * 0.5;
      c.y = (p1.y + p22.y) * 0.5;
      return c;
    }
    start = alias(this, "p1");
    end = alias(this, "p2");
    top = alias(this, "p1");
    bottom = alias(this, "p2");
    set(line) {
      const { p1, p2: p22 } = this;
      p1.set(line.p1);
      p22.set(line.p2);
      return this;
    }
    get mag() {
      const { p1, p2: p22 } = this;
      return p1.distance(p22);
    }
    get dot() {
      const { p1, p2: p22 } = this;
      return p1.x * p22.x + p1.y * p22.y;
    }
    get angle() {
      const { p1, p2: p22 } = this;
      return Math.atan2(
        p22.x - p1.x,
        p22.y - p1.y
      );
    }
    lerp(t) {
      const { p1, p2: p22, deltaPoint, lerpPoint } = this;
      lerpPoint.set(p1).add(
        deltaPoint.set(p22).sub(p1).mul(t)
      );
      return lerpPoint;
    }
    isPointWithin(p4) {
      const { start, end } = this;
      return p4.y === start.y ? p4.x >= start.x && (p4.y < end.y || p4.y === end.y && p4.x <= end.x) : p4.y > start.y && (p4.y < end.y || p4.y === end.y && p4.x <= end.x);
    }
    isLineWithin({ p1, p2: p22 }) {
      const { start, end } = this;
      return p1.y === start.y ? p1.x >= start.x && (p22.y < end.y || p22.y === end.y && p22.x <= end.x) : p1.y > start.y && (p22.y < end.y || p22.y === end.y && p22.x <= end.x);
    }
    intersectsLine(other) {
      const { p1, p2: p22 } = this;
      const a12 = p1;
      const a22 = p22;
      const b1 = other.p1;
      const b2 = other.p2;
      let q = (a12.y - b1.y) * (b2.x - b1.x) - (a12.x - b1.x) * (b2.y - b1.y);
      const d2 = (a22.x - a12.x) * (b2.y - b1.y) - (a22.y - a12.y) * (b2.x - b1.x);
      if (d2 == 0) {
        return false;
      }
      var r = q / d2;
      q = (a12.y - b1.y) * (a22.x - a12.x) - (a12.x - b1.x) * (a22.y - a12.y);
      var s = q / d2;
      if (r < 0 || r > 1 || s < 0 || s > 1) {
        return false;
      }
      return true;
    }
    getLineToRectangleCollisionResponse(intersection, r) {
      if (intersection === 0 /* None */) {
        return this;
      }
      const { p1, p2: p22 } = this;
      a1.set(p1);
      a2.set(p22);
      var b1 = r.leftTop;
      var b2 = r.rightBottom;
      if (intersection & 1 /* Left */) {
        a1.x = b1.x - 1;
      }
      if (intersection & 2 /* Top */) {
        a1.y = b1.y - 1;
      }
      if (intersection & 4 /* Right */) {
        a2.x = b2.x + 1;
      }
      if (intersection & 8 /* Bottom */) {
        a2.y = b2.y + 1;
      }
      if (intersection & 16 /* Inside */) {
        p.set(p1).lerp(p22, 0.5);
        p.touchPoint(r);
        a1.x = p.x;
        a1.y = p.y;
        a2.x = p.x;
        a2.y = p.y;
      }
      temp2.p1 = a1;
      temp2.p2 = a2;
      return temp2;
    }
    intersectionRect(r) {
      const { p1, p2: p22 } = this;
      const is = (this.intersectsLine(r.leftLine) ? 1 /* Left */ : 0) + (this.intersectsLine(r.topLine) ? 2 /* Top */ : 0) + (this.intersectsLine(r.rightLine) ? 4 /* Right */ : 0) + (this.intersectsLine(r.bottomLine) ? 8 /* Bottom */ : 0) + (p1.withinRect(r) && p22.withinRect(r) ? 16 /* Inside */ : 0);
      return is;
    }
  };
  __decorateClass([
    fn
  ], Line.prototype, "lerp", 1);
  var temp2 = $(new Line());
  var a1 = $(new Point());
  var a2 = $(new Point());
  var p = $(new Point());

  // src/rect.ts
  var _Rect = class extends Shape {
    pos = $(new Point());
    size = $(new Point());
    x = this.pos.$.x;
    y = this.pos.$.y;
    w = this.size.$.w;
    h = this.size.$.h;
    get json() {
      const { x, y, w, h } = this;
      return { x, y, w, h };
    }
    get values() {
      const { x, y, w, h } = this;
      return [x, y, w, h];
    }
    col = alias(this, "x");
    line = alias(this, "y");
    lineCol = alias(this, "pos");
    width = alias(this, "w");
    height = alias(this, "h");
    left = alias(this, "x");
    top = alias(this, "y");
    get right() {
      return this.x + this.w;
    }
    set right(r) {
      this.x = r - this.w;
    }
    get bottom() {
      return this.y + this.h;
    }
    set bottom(b) {
      this.y = b - this.h;
    }
    l = alias(this, "x");
    t = alias(this, "y");
    r = alias(this, "right");
    b = alias(this, "bottom");
    leftTop = alias(this, "pos");
    get rightTop() {
      const { right: x, top: y } = $(this).$;
      return $(new Point(), { x, y });
    }
    get leftBottom() {
      const { left: x, bottom: y } = $(this).$;
      return $(new Point(), { x, y });
    }
    get rightBottom() {
      const { right: x, bottom: y } = $(this).$;
      return $(new Point(), { x, y });
    }
    lt = alias(this, "leftTop");
    rt = alias(this, "rightTop");
    lb = alias(this, "leftBottom");
    rb = alias(this, "rightBottom");
    get leftLine() {
      const { leftBottom: p1, leftTop: p22 } = this;
      return $(new Line(), { p1, p2: p22 });
    }
    get topLine() {
      const { leftTop: p1, rightTop: p22 } = this;
      return $(new Line(), { p1, p2: p22 });
    }
    get rightLine() {
      const { rightTop: p1, rightBottom: p22 } = this;
      return $(new Line(), { p1, p2: p22 });
    }
    get bottomLine() {
      const { rightBottom: p1, leftBottom: p22 } = this;
      return $(new Line(), { p1, p2: p22 });
    }
    ll = alias(this, "leftLine");
    tl = alias(this, "topLine");
    rl = alias(this, "rightLine");
    bl = alias(this, "bottomLine");
    get hw() {
      return this.w / 2;
    }
    get hh() {
      return this.h / 2;
    }
    get centerX() {
      return this.x + this.hw;
    }
    set centerX(x) {
      this.x = x - this.hw;
    }
    get centerY() {
      return this.y + this.hh;
    }
    set centerY(y) {
      this.y = y - this.hh;
    }
    cx = alias(this, "centerX");
    cy = alias(this, "centerY");
    get center() {
      const { cx: x, cy: y } = $(this).$;
      return $(new Point(), { x, y });
    }
    get centerTop() {
      const { cx: x, top: y } = $(this).$;
      return $(new Point(), { x, y });
    }
    get centerBottom() {
      const { cx: x, bottom: y } = $(this).$;
      return $(new Point(), { x, y });
    }
    get centerLeft() {
      const { left: x, cy: y } = $(this).$;
      return $(new Point(), { x, y });
    }
    get centerRight() {
      const { right: x, cy: y } = $(this).$;
      return $(new Point(), { x, y });
    }
    safe() {
      $.fx(() => {
        this.finite();
      });
      return this;
    }
    zero() {
      return this.set(0);
    }
    get whenSized() {
      if (this.w && this.h)
        return this;
    }
    get hasSize() {
      return Boolean(this.w || this.h);
    }
    finite() {
      const { x, y, w, h } = this;
      this.x = !isFinite(x) ? 0 : x;
      this.y = !isFinite(y) ? 0 : y;
      this.w = !isFinite(w) ? 0 : w;
      this.h = !isFinite(h) ? 0 : h;
      return this;
    }
    set(o) {
      if (typeof o === "number") {
        this.x = o;
        this.y = o;
        this.w = o;
        this.h = o;
      } else {
        this.x = o.x;
        this.y = o.y;
        this.w = o.w;
        this.h = o.h;
      }
      return this;
    }
    setPos({ x, y }) {
      this.x = x;
      this.y = y;
      return this;
    }
    setSize({ w, h }) {
      this.w = w;
      this.h = h;
      return this;
    }
    copy() {
      const { x, y, w, h } = this;
      return $(new _Rect(), { x, y, w, h });
    }
    scale(factor) {
      this.x *= factor;
      this.y *= factor;
      this.w *= factor;
      this.h *= factor;
      return this;
    }
    translate(o) {
      if (typeof o === "number") {
        this.x += o;
        this.y += o;
      } else {
        this.x += o.x;
        this.y += o.y;
      }
      return this;
    }
    scaleSizeLinear(n) {
      this.w += n;
      this.h += n;
      return this;
    }
    scaleSize(factor) {
      this.w *= factor;
      this.h *= factor;
      return this;
    }
    scaleWidth(factor) {
      this.w *= factor;
      return this;
    }
    scaleHeight(factor) {
      this.h *= factor;
      return this;
    }
    floor() {
      const { x, y, w, h } = this;
      this.x = Math.floor(x);
      this.y = Math.floor(y);
      this.w = Math.floor(w);
      this.h = Math.floor(h);
      return this;
    }
    ceil() {
      const { x, y, w, h } = this;
      this.x = Math.ceil(x);
      this.y = Math.ceil(y);
      this.w = Math.ceil(w);
      this.h = Math.ceil(h);
      return this;
    }
    round() {
      const { x, y, w, h } = this;
      this.x = Math.round(x);
      this.y = Math.round(y);
      this.w = Math.round(w);
      this.h = Math.round(h);
      return this;
    }
    floorCeil() {
      const { x, y, w, h } = this;
      this.x = Math.floor(x);
      this.y = Math.floor(y);
      this.w = Math.ceil(w);
      this.h = Math.ceil(h);
      return this;
    }
    clear(c) {
      const { x, y, w, h } = this;
      c.clearRect(x, y, w, h);
      return this;
    }
    stroke(c, color = this.strokeColor) {
      const { x, y, w, h } = this;
      c.strokeStyle = color;
      c.strokeRect(x, y, w, h);
      return this;
    }
    fill(c, color = this.fillColor) {
      const { x, y, w, h } = this;
      c.fillStyle = color;
      c.fillRect(x, y, w, h);
      return this;
    }
    drawImage(canvas, c, pr = 1, normalize = false) {
      const { x, y, w, h } = this;
      let n = !normalize ? 1 : 0;
      c.drawImage(
        canvas,
        x * pr * n,
        y * pr * n,
        w * pr,
        h * pr,
        x,
        y,
        w,
        h
      );
      return this;
    }
    resizeToWindow() {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      return this;
    }
    isPointWithin(o) {
      const { x, y, r, b } = this;
      return o.x >= x && o.x <= r && o.y >= y && o.y <= b;
    }
    transformMatrix(m) {
      const { a, b, c, d: d2, e, f } = m;
      const { x, y, w, h } = this;
      this.x = a * x + c * y + e;
      this.y = b * x + d2 * y + f;
      this.w = a * w + c * h;
      this.h = b * w + d2 * h;
      return this;
    }
    transformMatrixScaled(m, pr = 1) {
      if (pr === 1)
        return this.transformMatrix(m);
      else
        return this.scale(pr).transformMatrix(m).scale(1 / pr);
    }
    combine(o) {
      if (!this.hasSize) {
        return this.set(o);
      }
      let { left, top, right, bottom } = this;
      const o_left = o.x;
      const o_top = o.y;
      const o_right = o.x + o.w;
      const o_bottom = o.y + o.h;
      if (o_left < left)
        left = o_left;
      if (o_top < top)
        top = o_top;
      if (o_right > right)
        right = o_right;
      if (o_bottom > bottom)
        bottom = o_bottom;
      this.x = left;
      this.y = top;
      this.w = right - left;
      this.h = bottom - top;
      return this;
    }
    combineRects(rects) {
      for (const r of rects) {
        this.combine(r);
      }
      return this;
    }
    intersectionRect(r1, r2) {
      const x1 = Math.max(r1.left, r2.left);
      const y1 = Math.max(r1.top, r2.top);
      const x2 = Math.min(r1.right, r2.right);
      const y2 = Math.min(r1.bottom, r2.bottom);
      if (x1 < x2 && y1 < y2) {
        temp3.x = x1;
        temp3.y = y1;
        temp3.w = x2 - x1;
        temp3.h = y2 - y1;
        return temp3;
      }
    }
    zoomLinear(n) {
      const t = -n / 2;
      return this.scaleSizeLinear(n).translate({ x: t, y: t });
    }
    contain(o) {
      const { l, t, r, b } = this;
      if (t < o.t)
        this.t = o.t;
      else if (b > o.b)
        this.b = o.b;
      if (r > o.r)
        this.r = o.r;
      else if (l < o.l)
        this.l = o.l;
      return this;
    }
  };
  var Rect = _Rect;
  __decorateClass([
    fn
  ], Rect.prototype, "finite", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "set", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "setPos", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "setSize", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "scale", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "translate", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "scaleSizeLinear", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "scaleSize", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "scaleWidth", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "scaleHeight", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "floor", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "ceil", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "round", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "floorCeil", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "resizeToWindow", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "transformMatrix", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "transformMatrixScaled", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "combine", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "combineRects", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "intersectionRect", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "zoomLinear", 1);
  __decorateClass([
    fn
  ], Rect.prototype, "contain", 1);
  var temp3 = $(new Rect());

  // src/circle.ts
  var d = $(new Point());
  var v = $(new Point());
  var Circle = class extends Shape {
    static toCircleCollision(c1, c2, tolerance = 0) {
      const { pos: p1, radius: r1 } = c1;
      const { pos: p22, radius: r2 } = c2;
      const radius = r1 + r2;
      d.set(p1).sub(p22);
      const dist = d.mag;
      const diff = radius + tolerance - dist;
      if (diff > 0) {
        d.div(dist);
        v.set(c1.vel).sub(c2.vel);
        const relSpeed = v.x * d.x + v.y * d.y;
        if (relSpeed > 0)
          return;
        const impulse = 2 * relSpeed / (c1.mass + c2.mass) * 0.98;
        c1.vel.x -= impulse * c2.mass * d.x;
        c1.vel.y -= impulse * c2.mass * d.y;
        c2.vel.x += impulse * c1.mass * d.x;
        c2.vel.y += impulse * c1.mass * d.y;
        const sx = diff * d.x * 0.5;
        const sy = diff * d.y * 0.5;
        c1.pos.x += sx;
        c1.pos.y += sy;
        c2.pos.x -= sx;
        c2.pos.y -= sy;
      }
    }
    static toCircleCollisionReverse(c1, c2, tolerance = 0) {
      const { pos: p1, radius: r1 } = c1;
      const { pos: p22, radius: r2 } = c2;
      const radius = r1 + r2;
      d.set(p22).sub(p1);
      const diff = d.mag + tolerance - radius;
      if (diff > 0) {
        d.mul(diff / radius);
        return d;
      }
    }
    rect = $(new Rect());
    radius = 10;
    pos = this.rect.$.center;
    prevPos = $(new Point());
    lerpPos = $(new Line());
    center = alias(this, "pos");
    initRectSize() {
      this.rect.width = this.rect.height = Math.ceil(this.radius * 2);
    }
    isPointWithin(p4) {
      const { pos: pos2, radius } = this;
      return pos2.distance(p4) < radius;
    }
    fill(c) {
      const { fillColor: color, lerpPos: { lerpPoint: pos2 }, radius } = this;
      c.beginPath();
      c.fillStyle = color;
      c.arc(pos2.x, pos2.y, radius, 0, Math.PI * 2, true);
      c.fill();
    }
  };
  __decorateClass([
    init
  ], Circle.prototype, "initRectSize", 1);

  // src/canvas.ts
  var p2 = $(new Point());
  var Canvas = class {
    world = World.Current;
    size = $(new Point());
    width = this.size.$.w;
    height = this.size.$.h;
    left = 0;
    right = this.size.$.w;
    bottom = this.size.$.h;
    fullWindow;
    style;
    el = dom.el("canvas", {
      style: {
        cssText: `
      touch-action: none;
      user-select: none;
      `
      }
    });
    get c() {
      return this.el.getContext("2d");
    }
    autoResizeToFitWindow() {
      const { fullWindow, world: { screen: { viewport: { x, y } } } } = $.of(this);
      if (fullWindow)
        this.size.resizeToWindow();
    }
    init() {
      const { size, el, c } = this;
      const { ifNotZero, w, h } = $.of(size);
      const { pr } = $.of(this.world.screen);
      $.untrack(() => {
        assign(el, p2.set(size).mul(pr).wh);
        c.scale(pr, pr);
      });
      const { style: style2 } = $.of(this);
      $.untrack(() => {
        assign(style2, p2.set(size).whPx);
      });
    }
    appendTo(el) {
      el.append(this.el);
      this.style = this.el.style;
      return this;
    }
    clear() {
      this.size.clear(this.c);
      return this;
    }
    fill(color) {
      this.size.fill(this.c, color);
      return this;
    }
  };
  __decorateClass([
    fx
  ], Canvas.prototype, "autoResizeToFitWindow", 1);
  __decorateClass([
    fx
  ], Canvas.prototype, "init", 1);

  // src/pointer.ts
  var remap = {
    mousemove: "pointermove",
    mousedown: "pointerdown",
    mouseup: "pointerup",
    pointercancel: "pointerleave"
  };
  var Pointer = class {
    constructor(canvas) {
      this.canvas = canvas;
    }
    world = World.Current;
    real;
    event = $({
      type: "pointermove",
      pageX: 0,
      pageY: 0,
      deltaX: 0,
      deltaY: 0,
      buttons: 0,
      altKey: void 0,
      ctrlKey: void 0,
      shiftKey: void 0,
      timeStamp: 0
    });
    pos = $(new Point(), {
      x: this.event.$.pageX,
      y: this.event.$.pageY
    });
    alt = this.event.$.altKey;
    ctrl = this.event.$.ctrlKey;
    shift = this.event.$.shiftKey;
    init() {
      const { canvas: { el }, handler } = this;
      const h = handler.bind(this);
      return [
        on(el, "wheel", h, { passive: true }),
        on(el, "mousedown", h),
        on(el, "pointercancel", h),
        on(window, "mouseup", h),
        on(window, "mousemove", h),
        on(window, "pointermove", h),
        on(document, "mouseleave", h)
      ];
    }
    handler(real) {
      dom.stop(real);
      if (this.world.isAnimating) {
        if (real.type === "mousemove")
          return;
      }
      this.real = real;
      const { event } = this;
      event.type = remap[real.type];
      event.pageX = real.pageX;
      event.pageY = real.pageY;
      event.altKey = real.altKey || void 0;
      event.ctrlKey = real.ctrlKey || real.metaKey || void 0;
      event.shiftKey = real.shiftKey || void 0;
      event.timeStamp = real.timeStamp || performance.now();
      switch (real.type) {
        case "wheel":
          event.deltaX = real.deltaX;
          event.deltaY = real.deltaY;
          break;
        case "mousemove":
        case "mousedown":
        case "mouseup":
        case "mouseleave":
        case "pointermove":
        case "pointerdown":
        case "pointerup":
        case "pointerleave":
        case "pointercancel":
          event.buttons = real.buttons;
          break;
      }
    }
  };
  __decorateClass([
    fx
  ], Pointer.prototype, "init", 1);
  __decorateClass([
    fn
  ], Pointer.prototype, "handler", 1);

  // src/scene.ts
  var Scene = class {
    world = World.Current;
    canvas = $(new Canvas(), { fullWindow: true });
    pointer = $(new Pointer(this.canvas));
  };

  // examples/balls.ts
  var p3 = $(new Point());
  var cp = $(new Point());
  var cv = $(new Point());
  var Motion = class {
    coeff = 1;
    update(it2) {
      const { vel, pos: pos2 } = it2;
      vel.mul(0.98);
      pos2.add(p3.set(vel).mul(this.coeff));
    }
  };
  __decorateClass([
    fn
  ], Motion.prototype, "update", 1);
  var Gravity = class {
    coeff = 1;
    gravity = 9.8 * (1 / 60) * (80 / 5);
    update(it2) {
      it2.vel.y += this.gravity * this.coeff;
    }
  };
  __decorateClass([
    fn
  ], Gravity.prototype, "update", 1);
  var Walls = class {
    constructor(that) {
      this.that = that;
    }
    update(it2) {
      const { that } = this;
      if (it2.vel.y < 1 && it2.bottom === that.bottom) {
        return true;
      }
      let d2 = it2.bottom - that.bottom;
      if (d2 > 0) {
        it2.bottom = that.bottom;
        it2.vel.y = -it2.vel.y * it2.impactAbsorb;
      }
      d2 = that.left - it2.left;
      if (d2 > 0) {
        it2.left = that.left;
        it2.vel.x = -it2.vel.x * it2.impactAbsorb;
      } else {
        d2 = it2.right - that.right;
        if (d2 > 0) {
          it2.right = that.right;
          it2.vel.x = -it2.vel.x * it2.impactAbsorb;
        }
      }
    }
  };
  __decorateClass([
    fn
  ], Walls.prototype, "update", 1);
  var Ball = class extends Circle {
    coeff = 1;
    get mass() {
      return 1.3 + this.rect.size.mag * 0.025 * this.coeff;
    }
    get impactAbsorb() {
      return (1 / this.mass) ** 0.25 * 0.919;
    }
    vel = $(new Point());
    left = this.rect.$.left;
    right = this.rect.$.right;
    bottom = this.rect.$.bottom;
    gridCells = Array.from({ length: 9 }, () => 0);
    colls = /* @__PURE__ */ new Set();
    canvas = $(new Canvas());
    lerpRect;
    setupLerp() {
      const { canvas } = $.of(this);
      canvas.size.set(this.rect.size);
      $.flush();
      this.lerpRect = $(new Rect(), {
        size: this.rect.size
      });
      this.lerpPos.p1.set(this.pos);
      this.lerpPos.p2.set(this.pos);
      this.render(canvas.c);
    }
    render(tc) {
      const c = tc ?? $.of(this).canvas.c;
      const r = this.radius;
      c.save();
      c.translate(r, r);
      this.fill(c);
      c.restore();
    }
    draw(c) {
      const { lerpRect, pr } = $.of(this);
      lerpRect.center.set(this.lerpPos.lerpPoint);
      lerpRect.drawImage($.of(this).canvas.el, c, pr, true);
    }
  };
  __decorateClass([
    init
  ], Ball.prototype, "setupLerp", 1);
  __decorateClass([
    fn
  ], Ball.prototype, "render", 1);
  __decorateClass([
    fn
  ], Ball.prototype, "draw", 1);
  var BALL_COUNT = 120;
  var BALL_TOLERANCE = 5;
  var GRID_CELL_BITS = 2;
  function areNear(c1, c2) {
    return c1 !== c2 && c1.gridCells.includes(c2.gridCells[4]);
  }
  var BallScene = class extends Scene {
    coeff = 1;
    gravity = $(new Gravity());
    motion = $(new Motion());
    walls = $(new Walls(this.canvas));
    balls;
    xSorted;
    ySorted;
    ballProps() {
      return {
        pos: p3.rand(this.canvas.size).sub({ x: 0, y: this.canvas.size.h / 2 }),
        radius: 12 + Math.random() ** 2.5 * 42,
        fillColor: "#" + randomHex()
      };
    }
    createBalls() {
      this.balls = array(BALL_COUNT, () => $(new Ball(), this.ballProps()));
    }
    createSorted() {
      const { balls } = $.of(this);
      $.untrack();
      this.xSorted = [...balls];
      this.ySorted = [...balls];
    }
    addBall(pos2) {
      const ball = $(new Ball(), this.ballProps());
      this.balls = [ball, ...$.of(this).balls];
      if (pos2)
        ball.pos.set(pos2);
    }
    assignCoeff() {
      const { coeff, gravity, motion, balls } = $.of(this);
      gravity.coeff = motion.coeff = coeff;
      balls.forEach((ball) => {
        ball.coeff = coeff;
      });
    }
    onClickAddBall() {
      return on(
        window,
        "click",
        () => this.addBall(this.pointer.pos)
      );
    }
    ballFollowsPointer() {
      const { pos: pos2 } = this.pointer;
      const { x, y } = pos2;
      $.untrack();
      const [ball] = $.of(this).balls;
      ball.vel.set(cv.set(pos2).sub(ball.pos).mul(3));
      ball.pos.set(pos2);
    }
    ballCollision(tolerance) {
      const { balls } = $.of(this);
      balls.forEach((b) => b.colls.clear());
      for (let i = 0, c1; i < balls.length; i++) {
        c1 = balls[i];
        for (let j = i + 1, c2; j < balls.length; j++) {
          c2 = balls[j];
          if (c1.colls.has(c2) || c2.colls.has(c1))
            continue;
          c1.colls.add(c2);
          c2.colls.add(c1);
          if (!areNear(c1, c2))
            continue;
          Circle.toCircleCollision(c1, c2, tolerance);
        }
      }
    }
    ballCollisionOne(c1, tolerance) {
      const { balls } = $.of(this);
      for (let j = 0, c2; j < balls.length; j++) {
        c2 = balls[j];
        if (c1.colls.has(c2) || c2.colls.has(c1))
          continue;
        if (!areNear(c1, c2))
          continue;
        Circle.toCircleCollision(c1, c2, tolerance);
      }
    }
    reset() {
      const { balls, canvas } = $.of(this);
      balls.forEach((ball) => {
        ball.pos.rand(canvas.size);
      });
    }
    update(dt) {
      const { balls, gravity, motion, walls } = $.of(this);
      let count = 0;
      cp.set(balls[0].pos);
      balls.forEach((ball) => {
        gravity.update(ball);
        motion.update(ball);
        if (walls.update(ball))
          return;
        count++;
      });
      if (performance.now() - this.pointer.event.timeStamp < 2e3) {
        balls[0].pos.set(cp);
      }
      return count;
    }
    updateBallGrid(ball) {
      const gridSize = 2 ** GRID_CELL_BITS;
      const w = this.canvas.size.w / gridSize;
      const h = this.canvas.size.h / gridSize;
      const x = ball.pos.x / w | 0;
      const y = ball.pos.y / h | 0;
      const y0 = y - 1;
      const y2 = y + 1;
      const x0 = x - 1 << GRID_CELL_BITS;
      const x1 = x << GRID_CELL_BITS;
      const x2 = x + 1 << GRID_CELL_BITS;
      ball.gridCells[0] = x0 | y0;
      ball.gridCells[1] = x1 | y0;
      ball.gridCells[2] = x2 | y0;
      ball.gridCells[3] = x0 | y;
      ball.gridCells[4] = x1 | y;
      ball.gridCells[5] = x2 | y;
      ball.gridCells[6] = x0 | y2;
      ball.gridCells[7] = x1 | y2;
      ball.gridCells[8] = x2 | y2;
    }
    updateOne(dt) {
      const { balls, xSorted: xs, ySorted: ys } = $.of(this);
      balls.forEach((b) => b.colls.clear());
      cp.set(balls[0].pos);
      xs.sort((a, b) => a.pos.x - b.pos.x);
      for (let i = 0; i < xs.length - 1; i++) {
        const c1 = xs[i];
        for (let j = i + 1; j < xs.length; j++) {
          const c2 = xs[j];
          if (c1.colls.has(c2) || c2.colls.has(c1))
            continue;
          c1.colls.add(c2);
          c2.colls.add(c1);
          if (c1.rect.right < c2.rect.left) {
            break;
          }
          Circle.toCircleCollision(c1, c2, BALL_TOLERANCE);
        }
      }
      ys.sort((a, b) => a.pos.y - b.pos.y);
      for (let i = 0; i < ys.length - 1; i++) {
        const c1 = ys[i];
        for (let j = i + 1; j < ys.length; j++) {
          const c2 = ys[j];
          if (c1.colls.has(c2) || c2.colls.has(c1))
            continue;
          c1.colls.add(c2);
          c2.colls.add(c1);
          if (c1.rect.bottom < c2.rect.top) {
            break;
          }
          Circle.toCircleCollision(c1, c2, BALL_TOLERANCE);
        }
      }
      if (performance.now() - this.pointer.event.timeStamp < 2e3) {
        balls[0].pos.set(cp);
      }
      balls.forEach((ball) => {
        ball.lerpPos.p1.set(ball.lerpPos.p2);
        ball.lerpPos.p2.set(ball.pos);
      });
      return 1;
    }
    draw(t) {
      const { canvas, balls, world } = $.of(this);
      const { pr } = $.of(world.screen);
      const { c } = canvas;
      canvas.clear();
      balls.forEach((ball) => {
        ball.lerpPos.lerp(t);
        ball.draw(c);
      });
    }
  };
  __decorateClass([
    init
  ], BallScene.prototype, "createBalls", 1);
  __decorateClass([
    fx
  ], BallScene.prototype, "createSorted", 1);
  __decorateClass([
    fn
  ], BallScene.prototype, "addBall", 1);
  __decorateClass([
    fx
  ], BallScene.prototype, "assignCoeff", 1);
  __decorateClass([
    fx
  ], BallScene.prototype, "onClickAddBall", 1);
  __decorateClass([
    fx
  ], BallScene.prototype, "ballFollowsPointer", 1);
  __decorateClass([
    fn
  ], BallScene.prototype, "reset", 1);
  __decorateClass([
    fn
  ], BallScene.prototype, "update", 1);
  __decorateClass([
    fn
  ], BallScene.prototype, "updateBallGrid", 1);
  __decorateClass([
    fn
  ], BallScene.prototype, "updateOne", 1);
  __decorateClass([
    fn
  ], BallScene.prototype, "draw", 1);
  var style = document.createElement("style");
  dom.head.append(style);
  style.textContent = `
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
`;
  function anim() {
    const world = $(new World());
    const scene = $(new BallScene());
    scene.canvas.appendTo(dom.body);
    world.anim.items.push(scene);
    world.anim.start();
  }
  anim();
})();
//!: start
//!: stop
//!: tick
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vdXRpbHMvc3JjL2FycmF5LnRzIiwgIi4uLy4uL3V0aWxzL3NyYy9jb25zdW1pZnkudHMiLCAiLi4vLi4vdXRpbHMvc3JjL2RlZmVycmVkLnRzIiwgIi4uLy4uL3V0aWxzL3NyYy9jYWxsYmFja2lmeS50cyIsICIuLi8uLi91dGlscy9zcmMvbWVtb2l6ZS50cyIsICIuLi8uLi91dGlscy9zcmMvaXMudHMiLCAiLi4vLi4vdXRpbHMvc3JjL2RlZXAtbWVyZ2UudHMiLCAiLi4vLi4vdXRpbHMvc3JjL29ic2VydmUudHMiLCAiLi4vLi4vdXRpbHMvc3JjL2V2ZW50LWVtaXR0ZXIudHMiLCAiLi4vLi4vdXRpbHMvc3JjL2l0ZXJpZnkudHMiLCAiLi4vLi4vdXRpbHMvc3JjL29iamVjdC50cyIsICIuLi8uLi91dGlscy9zcmMvb24udHMiLCAiLi4vLi4vdXRpbHMvc3JjL3ByZXZlbnQtc3RvcC50cyIsICIuLi8uLi91dGlscy9zcmMvZG9tLnRzIiwgIi4uLy4uL3V0aWxzL3NyYy9lcnJvci50cyIsICIuLi8uLi91dGlscy9zcmMvbWF0aC50cyIsICIuLi8uLi91dGlscy9zcmMvZ2MtZnJlZS1hcnJheS50cyIsICIuLi8uLi91dGlscy9zcmMvbG9nZ2VyLnRzIiwgIi4uLy4uL3V0aWxzL3NyYy9yYW5kb20taGV4LnRzIiwgIi4uLy4uL3V0aWxzL3NyYy9yZXF1aXJlZC50cyIsICIuLi8uLi91dGlscy9zcmMvcnBjLnRzIiwgIi4uLy4uL3V0aWxzL3NyYy9zdHJ1Y3QudHMiLCAiLi4vLi4vdXRpbHMvc3JjL3VuaXRlcmlmeS50cyIsICIuLi8uLi91dGlscy9zcmMvdmFsaWRhdGUtdHlwZS50cyIsICIuLi8uLi9zaWduYWwvc3JjL3NpZ25hbC1jb3JlLnRzIiwgIi4uLy4uL3NpZ25hbC9zcmMvc2lnbmFsLnRzIiwgIi4uL3NyYy9hbmltLnRzIiwgIi4uL3NyYy9zY3JlZW4udHMiLCAiLi4vc3JjL3dvcmxkLnRzIiwgIi4uL3NyYy9zaGFwZS50cyIsICIuLi9zcmMvcG9pbnQudHMiLCAiLi4vc3JjL2xpbmUudHMiLCAiLi4vc3JjL3JlY3QudHMiLCAiLi4vc3JjL2NpcmNsZS50cyIsICIuLi9zcmMvY2FudmFzLnRzIiwgIi4uL3NyYy9wb2ludGVyLnRzIiwgIi4uL3NyYy9zY2VuZS50cyIsICIuLi9leGFtcGxlcy9iYWxscy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGZ1bmN0aW9uIGFycmF5PFQgZXh0ZW5kcyBvYmplY3Q+KFxuICBjbnQ6IG51bWJlcixcbiAgb2Y6IChpOiBudW1iZXIpID0+IFQpOiBUW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbSh7IGxlbmd0aDogY250IH0sIChfLCBpKSA9PlxuICAgIG9mKGkpXG4gIClcbn1cbiIsICJleHBvcnQgYXN5bmMgZnVuY3Rpb24gY29uc3VtaWZ5PFQsIFU+KGdlbjogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFQ+LCBjYjogKHY6IFQpID0+IFUpIHtcbiAgZm9yIGF3YWl0IChjb25zdCB2IG9mIGdlbikge1xuICAgIGNiKHYpXG4gIH1cbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIERlZmVycmVkPFQ+IHtcbiAgaGFzU2V0dGxlZDogYm9vbGVhblxuICBwcm9taXNlOiBQcm9taXNlPFQ+XG4gIHdoZW46IChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZFxuICByZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWRcbiAgcmVqZWN0OiAoZXJyb3I/OiBFcnJvcikgPT4gdm9pZFxuICB2YWx1ZT86IFRcbiAgZXJyb3I/OiBFcnJvciB8IHVuZGVmaW5lZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gRGVmZXJyZWQ8VD4oKSB7XG4gIGNvbnN0IF9vbndoZW4gPSAoKSA9PiB7XG4gICAgZGVmZXJyZWQuaGFzU2V0dGxlZCA9IHRydWVcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gZGVmZXJyZWQucmVqZWN0ID0gbm9vcFxuICB9XG5cbiAgY29uc3Qgbm9vcCA9ICgpID0+IHsgfVxuXG4gIGxldCBvbndoZW4gPSBfb253aGVuXG5cbiAgY29uc3QgZGVmZXJyZWQgPSB7XG4gICAgaGFzU2V0dGxlZDogZmFsc2UsXG4gICAgd2hlbjogZm4gPT4ge1xuICAgICAgb253aGVuID0gKCkgPT4ge1xuICAgICAgICBfb253aGVuKClcbiAgICAgICAgZm4oKVxuICAgICAgfVxuICAgIH0sXG4gIH0gYXMgRGVmZXJyZWQ8VD5cblxuICBkZWZlcnJlZC5wcm9taXNlID0gbmV3IFByb21pc2U8VD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGRlZmVycmVkLnJlc29sdmUgPSBhcmcgPT4ge1xuICAgICAgb253aGVuKClcbiAgICAgIGRlZmVycmVkLnZhbHVlID0gYXJnXG4gICAgICByZXNvbHZlKGFyZylcbiAgICB9XG4gICAgZGVmZXJyZWQucmVqZWN0ID0gZXJyb3IgPT4ge1xuICAgICAgb253aGVuKClcbiAgICAgIGRlZmVycmVkLmVycm9yID0gZXJyb3JcbiAgICAgIHJlamVjdChlcnJvcilcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIGRlZmVycmVkXG59XG4iLCAiaW1wb3J0IHsgY29uc3VtaWZ5IH0gZnJvbSAnLi9jb25zdW1pZnknXG5pbXBvcnQgeyBEZWZlcnJlZCB9IGZyb20gJy4vZGVmZXJyZWQnXG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsYmFja2lmeTxUPihmbjogKCkgPT4gQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFQ+LCBjYjogKHY6IFQpID0+IHZvaWQpIHtcbiAgY29uc3QgZGVmZXJyZWQgPSBEZWZlcnJlZDx2b2lkPigpXG4gIGNvbnN0IHJlcyA9IGNvbnN1bWlmeShmbigpLCBjYilcbiAgcmVzLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSkuY2F0Y2goZGVmZXJyZWQucmVqZWN0KVxuICByZXR1cm4gZGVmZXJyZWRcbn1cbiIsICIvKipcbiAqIE1lbW9pemUgYSBmdW5jdGlvbi5cbiAqXG4gKiBgYGB0c1xuICogY29uc3QgZm4gPSBtZW1vaXplKChhLCBiLCBjKSA9PiBzb21lX2V4cGVuc2l2ZV9jYWxscyhhLCBiLCBjKSlcbiAqIC4uLlxuICogY29uc3QgcmVzdWx0ID0gZm4oMSwgMiwgMykgLy8gPT4gY2FsbHMgdGhlIGlubmVyIGZ1bmN0aW9uIGFuZCBzYXZlcyBhcmd1bWVudHMgc2lnbmF0dXJlIFwiMSwyLDNcIlxuICogLi4uXG4gKiBjb25zdCByZXN1bHQgPSBmbigxLCAyLCAzKSAvLyA9PiByZXR1cm5zIHRoZSBtZW1vaXplZCByZXN1bHQgaW1tZWRpYXRlbHkgc2luY2UgXCIxLDIsM1wiIG1hdGNoZXMgbWVtb3J5XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZm4gVGhlIGZ1bmN0aW9uIHRvIG1lbW9pemVcbiAqIEBwYXJhbSBtYXAgQSBtYXAgb2JqZWN0IHRvIHVzZSBhcyBtZW1vcnlcbiAqIEByZXR1cm5zIFRoZSBtZW1vaXplZCBmdW5jdGlvblxuICovXG50eXBlIEZuTWFueUFyZ3MgPSAoLi4uYXJnczogYW55W10pID0+IGFueVxuZXhwb3J0IGZ1bmN0aW9uIG1lbW9pemU8VD4oZm46IFQgJiBGbk1hbnlBcmdzLCBtYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpKTogVCB7XG4gIGZ1bmN0aW9uIHdyYXBwZWQodGhpczogYW55LCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIGNvbnN0IHNlcmlhbGl6ZWQgPSBhcmdzLmpvaW4oKVxuICAgIHJldHVybiBtYXBbc2VyaWFsaXplZF0gPz8gKG1hcFtzZXJpYWxpemVkXSA9IGZuLmFwcGx5KHRoaXMsIGFyZ3MpKVxuICB9XG4gIHJldHVybiB3cmFwcGVkIGFzIFRcbn1cblxudHlwZSBGbk9uZUFyZyA9IChhcmc6IHt9KSA9PiBhbnlcbmV4cG9ydCBmdW5jdGlvbiBtZW1vaXplQnlSZWY8VD4oZm46IFQgJiBGbk9uZUFyZywgbWFwID0gbmV3IE1hcCgpKTogVCB7XG4gIGZ1bmN0aW9uIHdyYXBwZWQodGhpczogYW55LCBhcmc6IHt9KSB7XG4gICAgaWYgKG1hcC5oYXMoYXJnKSkgcmV0dXJuIG1hcC5nZXQoYXJnKVxuICAgIGxldCByZXNcbiAgICBtYXAuc2V0KGFyZywgcmVzID0gZm4uY2FsbCh0aGlzLCBhcmcpKVxuICAgIHJldHVybiByZXNcbiAgfVxuICByZXR1cm4gd3JhcHBlZCBhcyBUXG59XG4iLCAiaW1wb3J0IHsgbWVtb2l6ZUJ5UmVmIH0gZnJvbSAnLi9tZW1vaXplJ1xuaW1wb3J0IHsgQ3RvciB9IGZyb20gJy4vdHlwZXMnXG5cbmV4cG9ydCBmdW5jdGlvbiBpc09iamVjdDxUPih2OiBUKTogdiBpcyBUICYgb2JqZWN0IHtcbiAgcmV0dXJuIHR5cGVvZiB2ID09PSAnb2JqZWN0JyAmJiB2ICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHYpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FycmF5TGlrZTxUIGV4dGVuZHMgb2JqZWN0Pih2OiBUKTogdiBpcyBUICYgeyBbU3ltYm9sLml0ZXJhdG9yXTogdW5rbm93biB9IHtcbiAgcmV0dXJuIFN5bWJvbC5pdGVyYXRvciBpbiB2XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bmN0aW9uKHg6IGFueSk6IHggaXMgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkge1xuICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbidcbn1cblxuLyoqIERldGVybWluZXNlIHdoZXRoZXIgdGhlIHBhcmFtZXRlciBpcyBhIGBjbGFzcyB7fWAgaW5zdGVhZCBvZiBhIG5vcm1hbCBmdW5jdGlvbi4gKi9cbmV4cG9ydCBjb25zdCBpc0N0b3IgPSBtZW1vaXplQnlSZWYoZnVuY3Rpb24gaXNDdG9yKHY6IHVua25vd24pOiB2IGlzIEN0b3Ige1xuICByZXR1cm4gaXNGdW5jdGlvbih2KSAmJiB2LnRvU3RyaW5nKCkuc3RhcnRzV2l0aCgnY2xhc3MnKVxufSlcblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RfaXMoKSB7XG4gIC8vIEBlbnYgYnJvd3NlclxuICBkZXNjcmliZSgnaXNDdG9yJywgKCkgPT4ge1xuICAgIGl0KCdmdW5jdGlvbnMgYXJlIGZhbHNlJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGlzQ3RvcihmdW5jdGlvbiAoKSB7IH0pKS50b0VxdWFsKGZhbHNlKVxuICAgIH0pXG4gICAgaXQoJ2NsYXNzIGFyZSB0cnVlJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGlzQ3RvcihjbGFzcyB7IH0pKS50b0VxdWFsKHRydWUpXG4gICAgfSlcbiAgICBpdCgnb25seSBjYWxscyB0b1N0cmluZygpIG9uY2UnLCAoKSA9PiB7XG4gICAgICBsZXQgY2FsbHMgPSAwXG4gICAgICBjb25zdCBmbiA9IE9iamVjdC5hc3NpZ24oZnVuY3Rpb24gKCkgeyB9LCB7XG4gICAgICAgIHRvU3RyaW5nKCkge1xuICAgICAgICAgIGNhbGxzKytcbiAgICAgICAgICByZXR1cm4gKGZ1bmN0aW9uICgpIHsgfSkudG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgZXhwZWN0KGlzQ3RvcihmbikpLnRvRXF1YWwoZmFsc2UpXG4gICAgICBleHBlY3QoY2FsbHMpLnRvRXF1YWwoMSlcbiAgICAgIGV4cGVjdChpc0N0b3IoZm4pKS50b0VxdWFsKGZhbHNlKVxuICAgICAgZXhwZWN0KGNhbGxzKS50b0VxdWFsKDEpXG4gICAgfSlcbiAgfSlcbn1cbiIsICJpbXBvcnQgeyBpc0FycmF5TGlrZSwgaXNPYmplY3QgfSBmcm9tICcuL2lzLnRzJ1xuXG5leHBvcnQgdHlwZSBEZWVwUGFydGlhbDxUPiA9IHsgW0sgaW4ga2V5b2YgVF0/OlxuICBUW0tdIGV4dGVuZHMgb2JqZWN0XG4gID8gRGVlcFBhcnRpYWw8VFtLXT5cbiAgOiBUW0tdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWVwTWVyZ2U8VCBleHRlbmRzIG9iamVjdD4oZHN0OiBULCBzcmM6IERlZXBQYXJ0aWFsPFQ+IHwgdW5kZWZpbmVkLCBkZXB0aCA9IEluZmluaXR5KTogVCB7XG4gIHNyYyA/Pz0ge30gYXMgVFxuICBmb3IgKGNvbnN0IGtleSBpbiBzcmMpIHtcbiAgICBsZXQgdmFsdWUgPSBzcmNba2V5XSBhcyBUW3R5cGVvZiBrZXldXG4gICAgbGV0IGN1cnJlbnQgPSBkc3Rba2V5XVxuICAgIGlmIChcbiAgICAgIGlzT2JqZWN0KHZhbHVlKVxuICAgICAgJiYgaXNPYmplY3QoY3VycmVudClcbiAgICAgICYmICFBcnJheS5pc0FycmF5KGN1cnJlbnQpXG4gICAgKSB7XG4gICAgICBpZiAoIWRlcHRoKSB7XG4gICAgICAgIGRzdFtrZXldID0gdmFsdWVcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRlcHRoID09PSAxKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oY3VycmVudCwgdmFsdWUpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZGVlcE1lcmdlKGN1cnJlbnQsIHZhbHVlLCBkZXB0aCAtIDEpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZHN0W2tleV0gPSB2YWx1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZHN0XG59XG4iLCAiZXhwb3J0IGludGVyZmFjZSBNdXRhdGlvbk9ic2VydmVyU2V0dGluZ3MgZXh0ZW5kcyBNdXRhdGlvbk9ic2VydmVySW5pdCB7XG4gIC8qKiBGaXJlIHRoZSBvYnNlcnZlciBjYWxsYmFjayBpbml0aWFsbHkgd2l0aCBubyBtdXRhdGlvbnMuICovXG4gIGluaXRpYWw/OiBib29sZWFuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzaXplT2JzZXJ2ZXJTZXR0aW5ncyBleHRlbmRzIFJlc2l6ZU9ic2VydmVyT3B0aW9ucyB7XG4gIC8qKiBGaXJlIHRoZSBvYnNlcnZlciBjYWxsYmFjayBpbml0aWFsbHkgd2l0aCBubyBtdXRhdGlvbnMuICovXG4gIGluaXRpYWw/OiBib29sZWFuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJTZXR0aW5ncyB7XG4gIHJvb3Q/OiBFbGVtZW50IHwgRG9jdW1lbnQgfCBudWxsO1xuICByb290TWFyZ2luPzogc3RyaW5nO1xuICB0aHJlc2hvbGQ/OiBudW1iZXIgfCBudW1iZXJbXTtcbiAgb2JzZXJ2ZXI/OiBJbnRlcnNlY3Rpb25PYnNlcnZlclxufVxuXG5leHBvcnQgY29uc3Qgb2JzZXJ2ZSA9IHtcbiAgcmVzaXplKGVsOiBFbGVtZW50LCBmbjogUmVzaXplT2JzZXJ2ZXJDYWxsYmFjaywgc2V0dGluZ3M/OiBSZXNpemVPYnNlcnZlclNldHRpbmdzKSB7XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZm4pXG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShlbCwgc2V0dGluZ3MpXG4gICAgaWYgKHNldHRpbmdzPy5pbml0aWFsKSBmbihbXSwgb2JzZXJ2ZXIpXG4gICAgcmV0dXJuICgpID0+IG9ic2VydmVyLmRpc2Nvbm5lY3QoKVxuICB9LFxuICBpbnRlcnNlY3Rpb24oZWw6IEVsZW1lbnQsIGZuOiBJbnRlcnNlY3Rpb25PYnNlcnZlckNhbGxiYWNrLCBzZXR0aW5ncz86IEludGVyc2VjdGlvbk9ic2VydmVyU2V0dGluZ3MpIHtcbiAgICBjb25zdCBvYnNlcnZlciA9IHNldHRpbmdzPy5vYnNlcnZlciA/PyBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoZm4sIHNldHRpbmdzKVxuICAgIG9ic2VydmVyLm9ic2VydmUoZWwpXG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oKCkgPT4ge1xuICAgICAgaWYgKHNldHRpbmdzPy5vYnNlcnZlcikgb2JzZXJ2ZXIudW5vYnNlcnZlKGVsKVxuICAgICAgZWxzZSBvYnNlcnZlci5kaXNjb25uZWN0KClcbiAgICB9LCB7IG9ic2VydmVyIH0pXG4gIH0sXG4gIG11dGF0aW9uKGVsOiBFbGVtZW50IHwgU2hhZG93Um9vdCwgZm46IE11dGF0aW9uQ2FsbGJhY2ssIHNldHRpbmdzPzogTXV0YXRpb25PYnNlcnZlclNldHRpbmdzKSB7XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmbilcbiAgICBvYnNlcnZlci5vYnNlcnZlKGVsLCBzZXR0aW5ncylcbiAgICBpZiAoc2V0dGluZ3M/LmluaXRpYWwpIGZuKFtdLCBvYnNlcnZlcilcbiAgICByZXR1cm4gKCkgPT4gb2JzZXJ2ZXIuZGlzY29ubmVjdCgpXG4gIH0sXG4gIGdjOiA8VD4oaXRlbTogb2JqZWN0LCB2YWx1ZTogVCwgZm46IChoZWxkVmFsdWU6IFQpID0+IHZvaWQpID0+IHtcbiAgICBjb25zdCByZWcgPSBuZXcgRmluYWxpemF0aW9uUmVnaXN0cnkoZm4pXG4gICAgcmVnLnJlZ2lzdGVyKGl0ZW0sIHZhbHVlKVxuICAgIHJldHVybiByZWdcbiAgfSxcbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIEV2ZW50RW1pdHRlck9wdGlvbnMge1xuICBvbmNlPzogYm9vbGVhblxufVxuZXhwb3J0IHR5cGUgRXZlbnRFbWl0dGVyQmFzZUV2ZW50TWFwID0gUmVjb3JkPHN0cmluZywgYW55PlxuZXhwb3J0IHR5cGUgRXZlbnRFbWl0dGVyRXZlbnRLZXlzPFQ+ID0gVCBleHRlbmRzIEV2ZW50RW1pdHRlcjxpbmZlciBVPiA/IFUgZXh0ZW5kcyBSZWNvcmQ8aW5mZXIgSywgYW55PiA/IEsgOiBuZXZlciA6IG5ldmVyXG5leHBvcnQgdHlwZSBFdmVudEVtaXR0ZXJFdmVudHM8VD4gPSBUIGV4dGVuZHMgRXZlbnRFbWl0dGVyPGluZmVyIFU+ID8gVSA6IG5ldmVyXG5cblxudHlwZSBFdmVudEVtaXR0ZXJMaXN0ZW5lckl0ZW0gPSBFdmVudEVtaXR0ZXJPcHRpb25zICYge1xuICBjYWxsYmFjazogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZFxufVxuXG50eXBlIE9mZiA9ICgpID0+IHZvaWRcblxuLyoqXG4gKiBBIEV2ZW50RW1pdHRlciB3b3JrIGxpa2Ugbm9kZS9ldmVudFxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyPEUgZXh0ZW5kcyBFdmVudEVtaXR0ZXJCYXNlRXZlbnRNYXAgPSB7fT4ge1xuICAjbGlzdGVuZXJzID0ge30gYXMgUmVjb3JkPGtleW9mIEUsIEV2ZW50RW1pdHRlckxpc3RlbmVySXRlbVtdPjtcblxuICBnZXQgbGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB0aGlzLiNsaXN0ZW5lcnNcbiAgfVxuXG4gIHNldCBsaXN0ZW5lcnMobGlzdGVuZXJzOiBSZWNvcmQ8a2V5b2YgRSwgRXZlbnRFbWl0dGVyTGlzdGVuZXJJdGVtW10+KSB7XG4gICAgdGhpcy4jbGlzdGVuZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgT2JqZWN0LmVudHJpZXMoXG4gICAgICAgIGxpc3RlbmVyc1xuICAgICAgKS5tYXAoKFtpZCwgbGlzdGVuZXJzXSkgPT5cbiAgICAgICAgW2lkLCBsaXN0ZW5lcnMuZmlsdGVyKChsaXN0ZW5lcikgPT5cbiAgICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayAhPSBudWxsXG4gICAgICAgICldXG4gICAgICApLmZpbHRlcigoWywgbGlzdGVuZXJzXSkgPT5cbiAgICAgICAgbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgKVxuICAgIClcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGRhdGE/OiBQYXJ0aWFsPEV2ZW50RW1pdHRlcjxhbnk+Pikge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgZGF0YSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEV2ZW50IHRvIGFsbCBsaXN0ZW5lclxuICAgKiBAcGFyYW0gZXZlbnROYW1lIEV2ZW50IE5hbWVcbiAgICogQHBhcmFtIGFyZ3MgYXJndW1lbnRzXG4gICAqL1xuICBlbWl0PEsgZXh0ZW5kcyBrZXlvZiBFPihldmVudE5hbWU6IEssIC4uLmFyZ3M6IFBhcmFtZXRlcnM8RVtLXT4pIHtcbiAgICBpZiAodGhpcy5saXN0ZW5lcnNbZXZlbnROYW1lXSkge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbZXZlbnROYW1lXS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgaXRlbS5jYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGl0ZW0uY2FsbGJhY2soLi4uYXJncylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpdGVtLm9uY2UgPT09IHRydWUpIHtcbiAgICAgICAgICB0aGlzLm9mZihldmVudE5hbWUsIGl0ZW0uY2FsbGJhY2sgYXMgRVtLXSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBldmVudCBsaXN0ZW5lclxuICAgKiBAcGFyYW0gZXZlbnROYW1lIEV2ZW50IE5hbWVcbiAgICogQHBhcmFtIGNhbGxiYWNrIEV2ZW50IENhbGxiYWNrXG4gICAqL1xuICBvbjxLIGV4dGVuZHMga2V5b2YgRT4oXG4gICAgZXZlbnROYW1lOiBLLFxuICAgIGNhbGxiYWNrOiBFW0tdLFxuICAgIG9wdGlvbnM/OiBFdmVudEVtaXR0ZXJPcHRpb25zXG4gICk6IE9mZiB7XG4gICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuICgpID0+IHsgfVxuXG4gICAgaWYgKCF0aGlzLmxpc3RlbmVyc1tldmVudE5hbWVdKSB7XG4gICAgICB0aGlzLmxpc3RlbmVyc1tldmVudE5hbWVdID0gW107XG4gICAgfVxuXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSB0aGlzLmxpc3RlbmVyc1tldmVudE5hbWVdLnNvbWUoXG4gICAgICAoaXRlbSkgPT4gaXRlbS5jYWxsYmFjayA9PT0gY2FsbGJhY2tcbiAgICApO1xuXG4gICAgaWYgKCFoYXNMaXN0ZW5lcikge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbZXZlbnROYW1lXS5wdXNoKHsgLi4ub3B0aW9ucywgY2FsbGJhY2sgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHRoaXMub2ZmKGV2ZW50TmFtZSwgY2FsbGJhY2spXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBldmVudCBsaXN0ZW5lclxuICAgKiBAcGFyYW0gZXZlbnROYW1lIEV2ZW50IE5hbWVcbiAgICogQHBhcmFtIGNhbGxiYWNrIEV2ZW50IENhbGxiYWNrXG4gICAqL1xuICBvZmY8SyBleHRlbmRzIGtleW9mIEU+KGV2ZW50TmFtZTogSywgY2FsbGJhY2s6IEVbS10pIHtcbiAgICBpZiAoIXRoaXMubGlzdGVuZXJzW2V2ZW50TmFtZV0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRleCA9IHRoaXMubGlzdGVuZXJzW2V2ZW50TmFtZV0uZmluZEluZGV4KFxuICAgICAgKGl0ZW0pID0+IGl0ZW0uY2FsbGJhY2sgPT09IGNhbGxiYWNrXG4gICAgKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbZXZlbnROYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmxpc3RlbmVyc1tldmVudE5hbWVdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZGVsZXRlIHRoaXMubGlzdGVuZXJzW2V2ZW50TmFtZV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogTGlrZSBvbiBidXQganVzdCBydW4gb25jZVxuICAgKiBAcGFyYW0gZXZlbnROYW1lIEV2ZW50IE5hbWVcbiAgICogQHBhcmFtIGNhbGxiYWNrIEV2ZW50IENhbGxiYWNrXG4gICAqL1xuICBvbmNlPEsgZXh0ZW5kcyBrZXlvZiBFPihldmVudE5hbWU6IEssIGNhbGxiYWNrOiBFW0tdKSB7XG4gICAgcmV0dXJuIHRoaXMub24oZXZlbnROYW1lLCBjYWxsYmFjaywgeyBvbmNlOiB0cnVlIH0pO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgRGVmZXJyZWQgfSBmcm9tICcuL2RlZmVycmVkJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEl0ZXJpZnlPcHRpb25zIHtcbiAgdW5zYWZlSW5pdGlhbD86IGJvb2xlYW5cbn1cbnR5cGUgQ2FsbGJhY2s8VD4gPSAoYXJnOiBUKSA9PiB2b2lkXG50eXBlIE9mZiA9ICgoKSA9PiB2b2lkKSB8IHZvaWRcbmV4cG9ydCBmdW5jdGlvbiBpdGVyaWZ5PFQ+KGZuOiAoY2I6IENhbGxiYWNrPFQ+KSA9PiBPZmYsIG9wdGlvbnM/OiBJdGVyaWZ5T3B0aW9ucykge1xuICBjb25zdCBkZWZlcnJlZHM6IERlZmVycmVkPFQ+W10gPSBbXVxuICBjb25zdCBxdWV1ZWQ6IFRbXSA9IFtdXG4gIGNvbnN0IGNiID0gKGFyZzogVCkgPT4ge1xuICAgIGlmIChkZWZlcnJlZHMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBkID0gZGVmZXJyZWRzLnNoaWZ0KCkhXG4gICAgICBpZiAoYXJnIGluc3RhbmNlb2YgRXJyb3IpIGQucmVqZWN0KGFyZylcbiAgICAgIGVsc2UgZC5yZXNvbHZlKGFyZylcbiAgICB9XG4gICAgZWxzZSBxdWV1ZWQucHVzaChhcmcpXG4gIH1cbiAgY29uc3Qgb2ZmID0gZm4oY2IpXG4gIGNvbnN0IGRpc3Bvc2UgPSAoKSA9PiB7XG4gICAgb2ZmPy4oKVxuXG4gICAgLy8gVE9ETzogbWlnaHQgbm90IGJlIHRoZSByaWdodCBhcHByb2FjaCBoZXJlLlxuICAgIGNvbnN0IGRpc3Bvc2VkID0gbmV3IEVycm9yKCdEaXNwb3NlZC4nKVxuICAgIGxldCBkOiBEZWZlcnJlZDxUPiB8IHVuZGVmaW5lZFxuICAgIHdoaWxlIChkID0gZGVmZXJyZWRzLnNoaWZ0KCkpIHtcbiAgICAgIGQucmVqZWN0KGRpc3Bvc2VkKVxuICAgIH1cbiAgfVxuICBpZiAob3B0aW9ucz8udW5zYWZlSW5pdGlhbCAmJiAhcXVldWVkLmxlbmd0aCkge1xuICAgIChjYiBhcyBhbnkpKClcbiAgfVxuICByZXR1cm4ge1xuICAgIGRpc3Bvc2UsXG4gICAgYXN5bmMgKltTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKSB7XG4gICAgICB0cnkge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIGlmIChxdWV1ZWQubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBhcmcgPSBxdWV1ZWQuc2hpZnQoKVxuICAgICAgICAgICAgaWYgKGFyZyBpbnN0YW5jZW9mIEVycm9yKSB5aWVsZCBQcm9taXNlLnJlamVjdChhcmcpXG4gICAgICAgICAgICBlbHNlIHlpZWxkIFByb21pc2UucmVzb2x2ZShhcmcpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGVmZXJyZWQgPSBEZWZlcnJlZDxUPigpXG4gICAgICAgICAgICBkZWZlcnJlZHMucHVzaChkZWZlcnJlZClcbiAgICAgICAgICAgIHlpZWxkIGRlZmVycmVkLnByb21pc2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICB0aHJvdyBlcnJvclxuICAgICAgfVxuICAgICAgZmluYWxseSB7XG4gICAgICAgIGRpc3Bvc2UoKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IG1lbW9pemVCeVJlZiB9IGZyb20gJy4vbWVtb2l6ZSdcbmltcG9ydCB7IFN0cmluZ0tleXMgfSBmcm9tICcuL3R5cGVzJ1xuXG5jb25zdCB7IHZhbHVlcywgZ2V0UHJvdG90eXBlT2YsIGdldE93blByb3BlcnR5RGVzY3JpcHRvciwgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyB9ID0gT2JqZWN0XG5leHBvcnQgeyB2YWx1ZXMgfVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduPFQgZXh0ZW5kcyB7fT4obzogVCwgcDE6IFBhcnRpYWw8VD4sIHAyOiBQYXJ0aWFsPFQ+LCBwMzogUGFydGlhbDxUPiwgcDQ6IFBhcnRpYWw8VD4pOiBUXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduPFQgZXh0ZW5kcyB7fT4obzogVCwgcDE6IFBhcnRpYWw8VD4sIHAyOiBQYXJ0aWFsPFQ+LCBwMzogUGFydGlhbDxUPik6IFRcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ248VCBleHRlbmRzIHt9PihvOiBULCBwMTogUGFydGlhbDxUPiwgcDI6IFBhcnRpYWw8VD4pOiBUXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduPFQgZXh0ZW5kcyB7fT4obzogVCwgcDogUGFydGlhbDxUPik6IFRcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ248VCBleHRlbmRzIHt9PihvOiBULCAuLi5wOiBQYXJ0aWFsPFQ+W10pOiBUIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24obywgLi4ucClcbn1cbmV4cG9ydCBmdW5jdGlvbiBrZXlzPEsgZXh0ZW5kcyBrZXlvZiBULFxuICBUIGV4dGVuZHMgeyBbczogc3RyaW5nXTogYW55IH0+KG9iajogVCk6IEtbXVxuZXhwb3J0IGZ1bmN0aW9uIGtleXM8SyBleHRlbmRzIGtleW9mIFQsXG4gIFQgZXh0ZW5kcyBBcnJheUxpa2U8YW55Pj4ob2JqOiBUKTogS1tdXG5leHBvcnQgZnVuY3Rpb24ga2V5czxLIGV4dGVuZHMga2V5b2YgVCxcbiAgVCBleHRlbmRzIHsgW3M6IHN0cmluZ106IGFueSB9IHwgQXJyYXlMaWtlPGFueT4+KG9iajogVCk6IEtbXSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopIGFzIHVua25vd24gYXMgS1tdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnRyaWVzPFxuICBLIGV4dGVuZHMgU3RyaW5nS2V5czxUPixcbiAgViBleHRlbmRzIFRbS10sXG4gIFQgZXh0ZW5kcyB7IFtzOiBzdHJpbmddOiBhbnkgfVxuPihvYmo6IFQpOiByZWFkb25seSBbSywgVl1bXVxuZXhwb3J0IGZ1bmN0aW9uIGVudHJpZXM8XG4gIEsgZXh0ZW5kcyBTdHJpbmdLZXlzPFQ+LFxuICBWIGV4dGVuZHMgVFtLXSxcbiAgVCBleHRlbmRzIEFycmF5TGlrZTxhbnk+XG4+KG9iajogVCk6IHJlYWRvbmx5IFtLLCBWXVtdXG5leHBvcnQgZnVuY3Rpb24gZW50cmllczxcbiAgSyBleHRlbmRzIFN0cmluZ0tleXM8VD4sXG4gIFYgZXh0ZW5kcyBUW0tdLFxuICBUIGV4dGVuZHMgeyBbczogc3RyaW5nXTogYW55IH0gfCBBcnJheUxpa2U8YW55PlxuPihvYmo6IFQpOiByZWFkb25seSBbSywgVl1bXSB7XG4gIHJldHVybiBPYmplY3QuZW50cmllcyhvYmopIGFzIHVua25vd24gYXMgcmVhZG9ubHkgW0ssIFZdW11cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21FbnRyaWVzPEsgZXh0ZW5kcyBzdHJpbmcsIFYsIFQ+KGVudHJpZXM6IFtLLCBWXVtdKTogeyBba2V5IGluIEtdOiBWIH0ge1xuICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMpIGFzIFJlY29yZDxLLCBWPlxufVxuXG5jb25zdCBlbXB0eU9iamVjdCA9IHsgX19wcm90b19fOiBudWxsIH0gYXMge31cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3RoZWZyb250c2lkZS9taWNyb3N0YXRlcy9ibG9iL21hc3Rlci9wYWNrYWdlcy9taWNyb3N0YXRlcy9zcmMvcmVmbGVjdGlvbi5qc1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbFByb3BlcnR5RGVzY3JpcHRvcnMob2JqZWN0OiBvYmplY3QpOiBQcm9wZXJ0eURlc2NyaXB0b3JNYXAge1xuICBpZiAob2JqZWN0ID09PSBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgcmV0dXJuIGVtcHR5T2JqZWN0XG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB7IF9fcHJvdG9fXzogbnVsbCwgfSxcbiAgICAgIGdldEFsbFByb3BlcnR5RGVzY3JpcHRvcnNNZW1vaXplZChnZXRQcm90b3R5cGVPZihvYmplY3QpKSxcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMob2JqZWN0KVxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZ2V0QWxsUHJvcGVydHlEZXNjcmlwdG9yc01lbW9pemVkID0gbWVtb2l6ZUJ5UmVmKGdldEFsbFByb3BlcnR5RGVzY3JpcHRvcnMpXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0OiBvYmplY3QsIGtleTogc3RyaW5nKTogUHJvcGVydHlEZXNjcmlwdG9yIHwgdW5kZWZpbmVkIHtcbiAgaWYgKG9iamVjdCA9PT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIHJldHVyblxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnN0IGRlc2MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBrZXkpXG4gICAgaWYgKCFkZXNjKSByZXR1cm4gZ2V0UHJvcGVydHlEZXNjcmlwdG9yKGdldFByb3RvdHlwZU9mKG9iamVjdCksIGtleSlcbiAgICByZXR1cm4gZGVzY1xuICB9XG59XG4iLCAiaW1wb3J0IHsgRGVmZXJyZWQgfSBmcm9tICcuL2RlZmVycmVkLnRzJ1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBFdmVudEVtaXR0ZXJFdmVudEtleXMsIEV2ZW50RW1pdHRlckV2ZW50cywgRXZlbnRFbWl0dGVyT3B0aW9ucyB9IGZyb20gJy4vZXZlbnQtZW1pdHRlci50cydcbmltcG9ydCB7IGl0ZXJpZnkgfSBmcm9tICcuL2l0ZXJpZnkudHMnXG5pbXBvcnQgeyBhc3NpZ24gfSBmcm9tICcuL29iamVjdC50cydcbmltcG9ydCAqIGFzIFN0cmluZyBmcm9tICcuL3N0cmluZy50cydcbmltcG9ydCB7IEZuLCBHZXQsIEtleXMsIE5hcnJvdywgU3RyaW5nTGl0ZXJhbCwgU3RyaW5nT2YgfSBmcm9tICcuL3R5cGVzLnRzJ1xuXG5leHBvcnQgdHlwZSBTYW5zT248VD4gPSBTdHJpbmcuU3BsaXQ8U3RyaW5nT2Y8VD4sICcgb24nPlxuZXhwb3J0IHR5cGUgRXZlbnRLZXlzPFQ+ID0ga2V5b2YgRXZlbnRzT2Y8VD5cbmV4cG9ydCB0eXBlIEV2ZW50c09mPFQ+ID0ge1xuICBbXG4gIEsgaW4gS2V5czxUPiBhcyBOb25OdWxsYWJsZTxUW0tdPiBleHRlbmRzIEZuPGFueSwgYW55PlxuICA/IFN0cmluZy5BdDxTdHJpbmdPZjxLPiwgMD4gZXh0ZW5kcyBTdHJpbmdMaXRlcmFsPCdvJz5cbiAgPyBTdHJpbmcuQXQ8U3RyaW5nT2Y8Sz4sIDE+IGV4dGVuZHMgU3RyaW5nTGl0ZXJhbDwnbic+ID8gU2Fuc09uPGAgJHtTdHJpbmdPZjxLPn1gPlsxXSA6IG5ldmVyXG4gIDogbmV2ZXJcbiAgOiBuZXZlclxuICBdLT86IE5hcnJvdzxcbiAgICBQYXJhbWV0ZXJzPFxuICAgICAgTmFycm93PFxuICAgICAgICBHZXQ8XG4gICAgICAgICAgVCxcbiAgICAgICAgICBLXG4gICAgICAgID4sXG4gICAgICAgIEZuPGFueSwgYW55PlxuICAgICAgPlxuICAgID5bMF0sXG4gICAgRXZlbnRcbiAgPlxufVxuXG5leHBvcnQgdHlwZSBPZmYgPSAoKSA9PiB2b2lkXG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRIYW5kbGVyPFQsIEUsIEs+IHtcbiAgKHRoaXM6IFQsIGV2ZW50OiBFICYgeyB0eXBlOiBLLCBjdXJyZW50VGFyZ2V0PzogVDsgdGFyZ2V0PzogRWxlbWVudCB9KTogYW55XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT25FdmVudEVtaXR0ZXJPcHRpb25zIGV4dGVuZHMgRXZlbnRFbWl0dGVyT3B0aW9ucyB7XG4gIHVuc2FmZUluaXRpYWw/OiBib29sZWFuXG59XG5cbmZ1bmN0aW9uIG9uRXZlbnQ8VCBleHRlbmRzIEV2ZW50RW1pdHRlcjxhbnk+LCBLIGV4dGVuZHMgRXZlbnRFbWl0dGVyRXZlbnRLZXlzPFQ+PihcbiAgdDogVCxcbiAgZTogSyxcbiAgZjogRXZlbnRFbWl0dGVyRXZlbnRzPFQ+W0tdLFxuICBvcHRpb25zPzogT25FdmVudEVtaXR0ZXJPcHRpb25zXG4pOiBPZmZcbmZ1bmN0aW9uIG9uRXZlbnQ8VCBleHRlbmRzIEV2ZW50VGFyZ2V0LCBLIGV4dGVuZHMgRXZlbnRLZXlzPFQ+PihcbiAgdDogVCxcbiAgZTogSyxcbiAgZjogRXZlbnRIYW5kbGVyPFQsIEV2ZW50c09mPFQ+W0tdLCBLPixcbiAgb3B0aW9ucz86IE9uRXZlbnRPcHRpb25zXG4pOiBPZmZcbmZ1bmN0aW9uIG9uRXZlbnQ8VCBleHRlbmRzIEV2ZW50VGFyZ2V0LCBLIGV4dGVuZHMgRXZlbnRLZXlzPFQ+PihcbiAgdDogVCxcbiAgZTogSyxcbiAgb3B0aW9ucz86IE9uRXZlbnRPcHRpb25zXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8RXZlbnRzT2Y8VD5bS10+XG5mdW5jdGlvbiBvbkV2ZW50PFQgZXh0ZW5kcyBFdmVudFRhcmdldCB8IEV2ZW50RW1pdHRlcjxhbnk+PihcbiAgdDogVCxcbiAgZTogYW55LFxuICBmPzogYW55LFxuICBvcHRpb25zPzogT25FdmVudE9wdGlvbnNcbik6IGFueSB7XG4gIGlmICghZiB8fCB0eXBlb2YgZiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gaXRlcmlmeShjYiA9PiBvbkV2ZW50KHQgYXMgYW55LCBlLCBjYiwgZikpXG4gIH1cbiAgaWYgKHQgaW5zdGFuY2VvZiBFdmVudFRhcmdldCkge1xuICAgIHQuYWRkRXZlbnRMaXN0ZW5lcihlIGFzIGFueSwgZiBhcyBhbnksIG9wdGlvbnMpXG4gICAgaWYgKG9wdGlvbnM/LnVuc2FmZUluaXRpYWwpIHtcbiAgICAgIGYoKVxuICAgIH1cbiAgICByZXR1cm4gKCkgPT4gdC5yZW1vdmVFdmVudExpc3RlbmVyKGUgYXMgYW55LCBmIGFzIGFueSwgb3B0aW9ucylcbiAgfVxuICBlbHNlIGlmICh0IGluc3RhbmNlb2YgRXZlbnRFbWl0dGVyKSB7XG4gICAgaWYgKG9wdGlvbnM/LnVuc2FmZUluaXRpYWwpIHtcbiAgICAgIGYoKVxuICAgIH1cbiAgICByZXR1cm4gdC5vbihlLCBmLCBvcHRpb25zKVxuICB9XG4gIGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBsaXN0ZW4gZm9yIGV2ZW50cywgb2JqZWN0IGlzIG5laXRoZXIgYW4gRXZlbnRUYXJnZXQgbm9yIGFuIEV2ZW50RW1pdHRlci4nKVxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT25FdmVudE9wdGlvbnMgZXh0ZW5kcyBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyB7XG4gIHVuc2FmZUluaXRpYWw/OiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIE9uY2VSZXR1cm48VCBleHRlbmRzIEV2ZW50VGFyZ2V0LCBLIGV4dGVuZHMgRXZlbnRLZXlzPFQ+PiA9XG4gIE9mZiAmIHtcbiAgICB0aGVuOiBQcm9taXNlPEV2ZW50c09mPFQ+W0tdPlsndGhlbiddXG4gICAgY2F0Y2g6IFByb21pc2U8RXZlbnRzT2Y8VD5bS10+WydjYXRjaCddXG4gIH1cblxuZXhwb3J0IHR5cGUgT25jZVJldHVybkVFPFQgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8YW55PiwgSyBleHRlbmRzIEV2ZW50RW1pdHRlckV2ZW50S2V5czxUPj4gPVxuICBPZmYgJiB7XG4gICAgdGhlbjogUHJvbWlzZTxFdmVudEVtaXR0ZXJFdmVudHM8VD5bS10+Wyd0aGVuJ11cbiAgICBjYXRjaDogUHJvbWlzZTxFdmVudEVtaXR0ZXJFdmVudHM8VD5bS10+WydjYXRjaCddXG4gIH1cblxuZXhwb3J0IGNvbnN0IG9uID0gYXNzaWduKFxuICBvbkV2ZW50LFxuICB7XG4gICAgb25jZTogZnVuY3Rpb24gb25FdmVudE9uY2U8VCBleHRlbmRzIEV2ZW50VGFyZ2V0LCBLIGV4dGVuZHMgRXZlbnRLZXlzPFQ+PihcbiAgICAgIHQ6IFQsXG4gICAgICBlOiBLLFxuICAgICAgZjogRXZlbnRIYW5kbGVyPFQsIEV2ZW50c09mPFQ+W0tdLCBLPixcbiAgICAgIG9wdGlvbnM/OiBBZGRFdmVudExpc3RlbmVyT3B0aW9uc1xuICAgICk6IE9uY2VSZXR1cm48VCwgSz4ge1xuICAgICAgb3B0aW9ucyA9IHsgLi4ub3B0aW9ucywgb25jZTogdHJ1ZSB9XG5cbiAgICAgIGNvbnN0IGRlZmVycmVkID0gRGVmZXJyZWQ8RXZlbnRzT2Y8VD5bS10+KClcblxuICAgICAgY29uc3QgaW5uZXI6IGFueSA9IGZ1bmN0aW9uICh0aGlzOiBhbnksIGU6IGFueSkge1xuICAgICAgICBjb25zdCByZXRWYWx1ZSA9IGYuY2FsbCh0aGlzLCBlKVxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGUpXG4gICAgICAgIHJldHVybiByZXRWYWx1ZVxuICAgICAgfVxuXG4gICAgICBjb25zdCBvZmYgPSBvbkV2ZW50KGUgYXMgYW55LCBpbm5lciwgb3B0aW9ucylcblxuICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oXG4gICAgICAgIG9mZixcbiAgICAgICAge1xuICAgICAgICAgIHRoZW46IGRlZmVycmVkLnByb21pc2UudGhlbi5iaW5kKGRlZmVycmVkLnByb21pc2UpLFxuICAgICAgICAgIGNhdGNoOiBkZWZlcnJlZC5wcm9taXNlLmNhdGNoLmJpbmQoZGVmZXJyZWQucHJvbWlzZSksXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9IGFzIGFueVxuICB9IGFzIHtcbiAgICBvbmNlOiB7XG4gICAgICBvbkV2ZW50T25jZTxUIGV4dGVuZHMgRXZlbnRFbWl0dGVyPGFueT4sIEsgZXh0ZW5kcyBFdmVudEVtaXR0ZXJFdmVudEtleXM8VD4+KFxuICAgICAgICB0OiBULFxuICAgICAgICBlOiBLLFxuICAgICAgICBmOiBFdmVudEVtaXR0ZXJFdmVudHM8VD5bS10sXG4gICAgICAgIG9wdGlvbnM/OiBFdmVudEVtaXR0ZXJPcHRpb25zXG4gICAgICApOiBPbmNlUmV0dXJuRUU8VCwgSz5cbiAgICAgIG9uRXZlbnRPbmNlPFQgZXh0ZW5kcyBFdmVudFRhcmdldCwgSyBleHRlbmRzIEV2ZW50S2V5czxUPj4oXG4gICAgICAgIHQ6IFQsXG4gICAgICAgIGU6IEssXG4gICAgICAgIGY6IEV2ZW50SGFuZGxlcjxULCBFdmVudHNPZjxUPltLXSwgSz4sXG4gICAgICAgIG9wdGlvbnM/OiBBZGRFdmVudExpc3RlbmVyT3B0aW9uc1xuICAgICAgKTogT25jZVJldHVybjxULCBLPlxuICAgIH1cbiAgfSlcbiIsICJleHBvcnQgY29uc3QgcHJldmVudCA9IE9iamVjdC5hc3NpZ24oKGU6IFBhcnRpYWw8RXZlbnQ+KSA9PiB7XG4gIGUucHJldmVudERlZmF1bHQ/LigpXG59LCB7XG4gIHN0b3A6IChlOiBQYXJ0aWFsPEV2ZW50PikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQ/LigpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24/LigpXG4gIH1cbn0pXG5cbmV4cG9ydCBjb25zdCBzdG9wID0gT2JqZWN0LmFzc2lnbigoZTogUGFydGlhbDxFdmVudD4pID0+IHtcbiAgZS5zdG9wUHJvcGFnYXRpb24/LigpXG59LCB7XG4gIHByZXZlbnQ6IChlOiBQYXJ0aWFsPEV2ZW50PikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQ/LigpXG4gICAgZS5zdG9wUHJvcGFnYXRpb24/LigpXG4gIH1cbn0pXG4iLCAiaW1wb3J0IHsgZGVlcE1lcmdlIH0gZnJvbSAnLi9kZWVwLW1lcmdlLnRzJ1xuaW1wb3J0IHsgb2JzZXJ2ZSB9IGZyb20gJy4vb2JzZXJ2ZS50cydcbmltcG9ydCB7IG9uIH0gZnJvbSAnLi9vbi50cydcbmltcG9ydCB7IHByZXZlbnQsIHN0b3AgfSBmcm9tICcuL3ByZXZlbnQtc3RvcC50cydcblxuZXhwb3J0IGNvbnN0IGRvbSA9IHtcbiAgZWw6IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzogc3RyaW5nLCBwcm9wcz86IG9iamVjdCk6IFQgPT5cbiAgICBkZWVwTWVyZ2UoXG4gICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyksXG4gICAgICBwcm9wc1xuICAgICkgYXMgVCxcbiAgZ2V0IGJvZHkoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmJvZHlcbiAgfSxcbiAgZ2V0IGhlYWQoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmhlYWRcbiAgfSxcbiAgb2JzZXJ2ZSxcbiAgc3RvcCxcbiAgcHJldmVudCxcbiAgb24sXG59XG4iLCAiaW1wb3J0IHsgZW50cmllcywgZnJvbUVudHJpZXMgfSBmcm9tICcuL29iamVjdCdcblxuZXhwb3J0IGZ1bmN0aW9uIGVycm9yKGVyckN0b3I6IEVycm9yQ29uc3RydWN0b3IsIG5hbWU6IHN0cmluZywgcHJlPzogc3RyaW5nKSB7XG4gIHJldHVybiBjbGFzcyBleHRlbmRzIGVyckN0b3Ige1xuICAgIGNvbnN0cnVjdG9yKG1zZzogc3RyaW5nLCBjYWxsU2l0ZT86ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55KSB7XG4gICAgICBzdXBlcigocHJlID8gcHJlICsgJzogJyA6ICcnKSArIG1zZylcbiAgICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICAgIGlmIChjYWxsU2l0ZSkgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgY2FsbFNpdGUpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB0eXBlIEVycnMgPSBSZWNvcmQ8c3RyaW5nLCBbY3RvcjogRXJyb3JDb25zdHJ1Y3RvciwgcHJlPzogc3RyaW5nXT5cblxuZXhwb3J0IGZ1bmN0aW9uIGVycnM8VCBleHRlbmRzIEVycnM+KHNwZWM6IFQpIHtcbiAgcmV0dXJuIGZyb21FbnRyaWVzKFxuICAgIGVudHJpZXMoc3BlYykubWFwKChba2V5LCB2YWx1ZV0pID0+XG4gICAgICBba2V5LCBlcnJvcih2YWx1ZVswXSwga2V5LCB2YWx1ZVsxXSldXG4gICAgKVxuICApXG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGNsYW1wKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgeDogbnVtYmVyKSB7XG4gIGlmICh4IDwgbWluKSB4ID0gbWluXG4gIGlmICh4ID4gbWF4KSB4ID0gbWF4XG4gIHJldHVybiB4XG59XG5cbi8vIGNoYXRncHRcbmV4cG9ydCBmdW5jdGlvbiBuZXh0UG93ZXJPZlR3byh4OiBudW1iZXIpOiBudW1iZXIge1xuICAvLyBJZiB4IGlzIGFscmVhZHkgYSBwb3dlciBvZiB0d28sIHJldHVybiBpdFxuICBpZiAoKHggJiAoeCAtIDEpKSA9PT0gMCkge1xuICAgIHJldHVybiB4XG4gIH1cblxuICAvLyBGaW5kIHRoZSBuZWFyZXN0IHBvd2VyIG9mIHR3byBncmVhdGVyIHRoYW4geFxuICBsZXQgcG93ZXIgPSAxXG4gIHdoaWxlIChwb3dlciA8IHgpIHtcbiAgICBwb3dlciA8PD0gMVxuICB9XG4gIHJldHVybiBwb3dlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBvd2VyKHg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLmFicyhNYXRoLmxvZyh4KSAvIE1hdGgubG9nKDAuNSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdWJpY0Jlemllcih0OiBudW1iZXIpIHtcbiAgcmV0dXJuIHQgKiB0ICogKDMgLSAyICogdClcbn1cbiIsICJpbXBvcnQgeyBuZXh0UG93ZXJPZlR3byB9IGZyb20gJy4vbWF0aC50cydcblxubGV0IHBvb2xzOiBNYXA8bnVtYmVyLCBhbnlbXVtdPlxubGV0IGdjRnJlZUFycmF5czogTWFwPG51bWJlciwgR2NGcmVlQXJyYXk8YW55PltdPlxuXG5leHBvcnQgY2xhc3MgR2NGcmVlQXJyYXk8VD4ge1xuICBzdGF0aWMgZ2V0KHNpemU6IG51bWJlcikge1xuICAgIGdjRnJlZUFycmF5cyA/Pz0gbmV3IE1hcCgpXG4gICAgbGV0IHBvb2wgPSBnY0ZyZWVBcnJheXMuZ2V0KHNpemUpXG4gICAgaWYgKCFwb29sKSBnY0ZyZWVBcnJheXMuc2V0KHNpemUsIHBvb2wgPSBbXSlcbiAgICBpZiAocG9vbC5sZW5ndGgpIHJldHVybiBwb29sLnBvcCgpIVxuICAgIHJldHVybiBuZXcgR2NGcmVlQXJyYXkoc2l6ZSlcbiAgfVxuXG4gIGRhdGE6IFRbXVxuICBzaXplID0gMFxuXG4gIF9oZWFkID0gMFxuICBfaW5uZXJTaXplOiBudW1iZXJcbiAgX2lubmVyTWFzazogbnVtYmVyXG5cbiAgY29uc3RydWN0b3IoYmVnaW5TaXplOiBudW1iZXIpIHtcbiAgICB0aGlzLl9pbm5lclNpemUgPSBuZXh0UG93ZXJPZlR3byhiZWdpblNpemUpXG4gICAgdGhpcy5faW5uZXJNYXNrID0gdGhpcy5faW5uZXJTaXplIC0gMVxuXG4gICAgdGhpcy5kYXRhID0gcG9vbHM/LmdldCh0aGlzLl9pbm5lclNpemUpPy5wb3AoKVxuICAgICAgPz8gQXJyYXkuZnJvbSh7IGxlbmd0aDogdGhpcy5faW5uZXJTaXplIH0pXG4gIH1cbiAgX2dyb3coKSB7XG4gICAgY29uc3QgbmV3SW5uZXJTaXplID0gdGhpcy5faW5uZXJTaXplIDw8IDFcbiAgICBjb25zdCBuZXdEYXRhOiBUW10gPSBwb29scz8uZ2V0KG5ld0lubmVyU2l6ZSk/LnBvcCgpXG4gICAgICA/PyBBcnJheS5mcm9tKHsgbGVuZ3RoOiBuZXdJbm5lclNpemUgfSlcbiAgICBmb3IgKGxldCBpID0gdGhpcy5faGVhZCwgdGFpbCA9IHRoaXMuX2hlYWQgKyB0aGlzLnNpemUsIHggPSAwLCB5O1xuICAgICAgaSA8IHRhaWw7IGkrKywgeCsrKSB7XG4gICAgICB5ID0gaSAmIHRoaXMuX2lubmVyTWFza1xuICAgICAgbmV3RGF0YVt4XSA9IHRoaXMuZGF0YVt5XVxuICAgIH1cbiAgICB0aGlzLl9kaXNwb3NlSW5uZXJEYXRhKClcbiAgICB0aGlzLl9oZWFkID0gMFxuICAgIHRoaXMuX2lubmVyU2l6ZSA9IG5ld0lubmVyU2l6ZVxuICAgIHRoaXMuX2lubmVyTWFzayA9IHRoaXMuX2lubmVyU2l6ZSAtIDFcbiAgICB0aGlzLmRhdGEgPSBuZXdEYXRhXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmNsZWFyKClcbiAgICBnY0ZyZWVBcnJheXMgPz89IG5ldyBNYXAoKVxuICAgIGxldCBwb29sID0gZ2NGcmVlQXJyYXlzLmdldCh0aGlzLl9pbm5lclNpemUpXG4gICAgaWYgKCFwb29sKSBnY0ZyZWVBcnJheXMuc2V0KHRoaXMuX2lubmVyU2l6ZSwgcG9vbCA9IFtdKVxuICAgIHBvb2wucHVzaCh0aGlzKVxuICB9XG4gIF9kaXNwb3NlSW5uZXJEYXRhKCkge1xuICAgIHBvb2xzID8/PSBuZXcgTWFwKClcbiAgICBsZXQgcG9vbCA9IHBvb2xzLmdldCh0aGlzLl9pbm5lclNpemUpXG4gICAgaWYgKCFwb29sKSBwb29scy5zZXQodGhpcy5faW5uZXJTaXplLCBwb29sID0gW10pXG4gICAgcG9vbC5wdXNoKHRoaXMuZGF0YSlcbiAgfVxuICBjb3B5KCk6IEdjRnJlZUFycmF5PFQ+IHtcbiAgICBjb25zdCBuZXdBcnJheSA9IEdjRnJlZUFycmF5LmdldCh0aGlzLl9pbm5lclNpemUpXG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX2hlYWQsIHRhaWwgPSB0aGlzLl9oZWFkICsgdGhpcy5zaXplOyBpIDwgdGFpbDsgaSsrKSB7XG4gICAgICBuZXdBcnJheS5wdXNoKHRoaXMuZGF0YVtpICYgdGhpcy5faW5uZXJNYXNrXSlcbiAgICB9XG4gICAgcmV0dXJuIG5ld0FycmF5XG4gIH1cbiAgcHVzaChpdGVtOiBUKSB7XG4gICAgaWYgKHRoaXMuc2l6ZSA9PT0gdGhpcy5faW5uZXJTaXplKSB0aGlzLl9ncm93KClcbiAgICB0aGlzLmRhdGFbKHRoaXMuX2hlYWQgKyB0aGlzLnNpemUpICYgdGhpcy5faW5uZXJNYXNrXSA9IGl0ZW1cbiAgICB0aGlzLnNpemUrK1xuICB9XG4gIHBvcCgpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuc2l6ZSkgcmV0dXJuXG4gICAgLS10aGlzLnNpemVcbiAgICByZXR1cm4gdGhpcy5kYXRhWyh0aGlzLl9oZWFkICsgdGhpcy5zaXplKSAmIHRoaXMuX2lubmVyTWFza11cbiAgfVxuICB1bnNoaWZ0KGl0ZW06IFQpIHtcbiAgICBpZiAodGhpcy5zaXplID09PSB0aGlzLl9pbm5lclNpemUpIHRoaXMuX2dyb3coKVxuICAgIHRoaXMuX2hlYWQgPSAodGhpcy5faGVhZCArIHRoaXMuX2lubmVyU2l6ZSAtIDEpICYgdGhpcy5faW5uZXJNYXNrXG4gICAgdGhpcy5kYXRhW3RoaXMuX2hlYWRdID0gaXRlbVxuICAgIHRoaXMuc2l6ZSsrXG4gIH1cbiAgc2hpZnQoKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLnNpemUpIHJldHVyblxuICAgIC0tdGhpcy5zaXplXG4gICAgY29uc3QgaXRlbSA9IHRoaXMuZGF0YVt0aGlzLl9oZWFkXVxuICAgIHRoaXMuX2hlYWQgPSAodGhpcy5faGVhZCArIDEpICYgdGhpcy5faW5uZXJNYXNrXG4gICAgcmV0dXJuIGl0ZW1cbiAgfVxuICBkZWxldGUoaXRlbTogVCkge1xuICAgIGlmICghdGhpcy5pbmNsdWRlcyhpdGVtKSkgcmV0dXJuXG5cbiAgICBjb25zdCBuZXdEYXRhOiBUW10gPSBwb29scz8uZ2V0KHRoaXMuX2lubmVyU2l6ZSk/LnBvcCgpXG4gICAgICA/PyBBcnJheS5mcm9tKHsgbGVuZ3RoOiB0aGlzLl9pbm5lclNpemUgfSlcblxuICAgIGxldCBzaXplID0gdGhpcy5zaXplXG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX2hlYWQsIHRhaWwgPSB0aGlzLl9oZWFkICsgdGhpcy5zaXplLCB4ID0gMCwgaXQ7IGkgPCB0YWlsOyBpKyspIHtcbiAgICAgIGl0ID0gdGhpcy5kYXRhW2kgJiB0aGlzLl9pbm5lck1hc2tdXG4gICAgICBpZiAoaXQgPT09IGl0ZW0pIHtcbiAgICAgICAgLS1zaXplXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBuZXdEYXRhW3grK10gPSBpdFxuICAgIH1cblxuICAgIHRoaXMuX2Rpc3Bvc2VJbm5lckRhdGEoKVxuICAgIHRoaXMuZGF0YSA9IG5ld0RhdGFcbiAgICB0aGlzLl9oZWFkID0gMFxuICAgIHRoaXMuc2l6ZSA9IHNpemVcbiAgfVxuICBmb3JFYWNoKGZuOiAoaXRlbTogVCkgPT4gdm9pZCkge1xuICAgIGZvciAobGV0IGkgPSB0aGlzLl9oZWFkLCB0YWlsID0gdGhpcy5faGVhZCArIHRoaXMuc2l6ZTsgaSA8IHRhaWw7IGkrKykge1xuICAgICAgZm4odGhpcy5kYXRhW2kgJiB0aGlzLl9pbm5lck1hc2tdKVxuICAgIH1cbiAgfVxuICBldmVyeShmbjogKGl0ZW06IFQpID0+IGJvb2xlYW4pIHtcbiAgICBmb3IgKGxldCBpID0gdGhpcy5faGVhZCwgdGFpbCA9IHRoaXMuX2hlYWQgKyB0aGlzLnNpemU7IGkgPCB0YWlsOyBpKyspIHtcbiAgICAgIGlmICghZm4odGhpcy5kYXRhW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5faGVhZCA9IHRoaXMuc2l6ZSA9IDBcbiAgfVxuICBpbmNsdWRlcyhpdGVtOiBUKSB7XG4gICAgY29uc3QgdGFpbCA9IHRoaXMuX2hlYWQgKyB0aGlzLnNpemVcbiAgICBpZiAodGFpbCA+IHRoaXMuX2lubmVyU2l6ZSkge1xuICAgICAgaWYgKHRoaXMuZGF0YS5pbmRleE9mKGl0ZW0sIHRoaXMuX2hlYWQpID49IDApIHJldHVybiB0cnVlXG4gICAgICBjb25zdCB3cmFwSW5kZXggPSB0YWlsICYgdGhpcy5faW5uZXJNYXNrXG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuZGF0YS5pbmRleE9mKGl0ZW0pXG4gICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8IHdyYXBJbmRleCkgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuZGF0YS5pbmRleE9mKGl0ZW0sIHRoaXMuX2hlYWQpXG4gICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8IHRhaWwpIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9XG4gICpbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICBmb3IgKGxldCBpID0gdGhpcy5faGVhZCwgdGFpbCA9IHRoaXMuX2hlYWQgKyB0aGlzLnNpemU7IGkgPCB0YWlsOyBpKyspIHtcbiAgICAgIHlpZWxkIHRoaXMuZGF0YVtpICYgdGhpcy5faW5uZXJNYXNrXVxuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEV2ZW50RW1pdHRlciwgYW5zaUNvbG9yRm9yLCBjaGVja3N1bSwgY29sb3JIYXNoIH0gZnJvbSAnLi9pbmRleC50cydcbmltcG9ydCB7IGdldEZpbGVJZCB9IGZyb20gJy4vZ2V0LWZpbGUtaWQudHMnXG5cbi8vIEB0cy1pZ25vcmVcblN5bWJvbC5kaXNwb3NlIHx8PSBTeW1ib2wuZm9yKCdTeW1ib2wuZGlzcG9zZScpXG4vLyBAdHMtaWdub3JlXG5TeW1ib2wuYXN5bmNEaXNwb3NlIHx8PSBTeW1ib2wuZm9yKCdTeW1ib2wuYXN5bmNEaXNwb3NlJylcblxuZXhwb3J0IGVudW0gTG9nS2luZCB7XG4gIE5vcm1hbCxcbiAgQWN0aW9uLFxuICBCcmFuY2gsXG4gIEVudHJ5LFxuICBRdWV1ZSxcbiAgU3RhY2ssXG59XG5cbmV4cG9ydCB0eXBlIExvZ2dlciA9IExvZyAmIHtcbiAgYWN0aW9uOiBMb2dcbiAgYnJhbmNoOiBMb2dcbiAgZW50cnk6IExvZ1xuICBxdWV1ZTogTG9nXG4gIHN0YWNrOiBMb2dcbn1cblxuZXhwb3J0IHR5cGUgTG9nID0ge1xuICAobGFiZWw6IHN0cmluZywgLi4uYXJnczogYW55W10pOiB2b2lkXG4gIGlkKGxhYmVsOiBzdHJpbmcsIGlkOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogdm9pZFxuICBwdXNoOiBMb2dnZXJcbiAgcG9wOiBMb2dnZXJcbiAgcHJldHR5OiBMb2dnZXJcbiAgY2xlYXJTdGFjazogKCkgPT4gdm9pZFxuICBhY3RpdmU6IGJvb2xlYW5cbn1cblxuZnVuY3Rpb24gYnJlYWtzKGlkOiBzdHJpbmcsIHM6IHN0cmluZykge1xuICByZXR1cm4gc1xuXG4gIGlmIChzLnRvVXBwZXJDYXNlKCkuc3RhcnRzV2l0aChpZC50b1VwcGVyQ2FzZSgpICsgJy4nKSkge1xuICAgIHMgPSBzLnNsaWNlKGlkLmxlbmd0aCArIDEpXG4gIH1cbiAgbGV0IG91dCA9ICcnXG4gIGxldCBzdGFydCA9IDBcbiAgbGV0IGNvdW50ID0gMFxuICBmb3IgKGNvbnN0IHggb2Ygc1xuICAgIC5yZXBsYWNlQWxsKC9pZlxccyovZ20sICcnKVxuICAgIC5yZXBsYWNlQWxsKCchJywgJ05PVCAnKVxuICAgIC5yZXBsYWNlQWxsKCcmJicsICdBTkQnKVxuICAgIC5yZXBsYWNlQWxsKCd8fCcsICdPUicpXG4gICAgLnJlcGxhY2VBbGwoL1teYS16PT9cdTIwMjRdKy9nbWksICcgJylcbiAgICAuc3BsaXQoJyAnKSkge1xuICAgIGlmICgheC5sZW5ndGgpIGNvbnRpbnVlXG4gICAgY29uc3QgdyA9IHggKyAnICdcbiAgICBjb3VudCArPSB3Lmxlbmd0aFxuICAgIGlmIChjb3VudCA+IDEwICYmIHN0YXJ0ID4gMSkge1xuICAgICAgaWYgKG91dC5sZW5ndGggJiYgdy5sZW5ndGgpIG91dCArPSAnXFxcXG4nXG4gICAgICBzdGFydCA9IDBcbiAgICAgIGNvdW50ID0gMFxuICAgIH1cbiAgICBzdGFydCArPSB3Lmxlbmd0aFxuICAgIG91dCArPSB3XG4gIH1cbiAgb3V0ID0gb3V0LnRyaW0oKVxuICBpZiAocy50cmltKCkuc3RhcnRzV2l0aCgnaWYnKSkge1xuICAgIG91dCArPSAnPydcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmV4cG9ydCBjb25zdCBsb2dnZXJDb250ZXh0ID0ge1xuICBvcHRpb25zOiB7XG4gICAgcXVpZXQ6IGZhbHNlLFxuICAgIHByb2Q6IGZhbHNlXG4gIH0sXG4gIGl0ZW1JZDogJycsXG4gIGlkczogbmV3IFNldCgpLFxuICBsYWJlbHM6IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCksXG4gIGFycm93czogbmV3IFNldDxzdHJpbmc+KCksXG4gIG9wczogW10gYXMgYW55LFxuICBzdGFjazogW10gYXMgc3RyaW5nW10sXG4gIGVtaXR0ZXI6IG5ldyBFdmVudEVtaXR0ZXI8e1xuICAgIGV2ZW50OiAoaWQ6IHN0cmluZywgYXJnczogYW55W10pID0+IHZvaWRcbiAgfT4oKVxufVxuXG5jb25zdCBjID0gbG9nZ2VyQ29udGV4dFxuXG5jbGFzcyBQb3BTdGFja01pc21hdGNoRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGV4cGVjdGVkOiBzdHJpbmcsIGFjdHVhbDogc3RyaW5nIHwgdW5kZWZpbmVkLCBmbjogYW55KSB7XG4gICAgc3VwZXIoYFBvcCBzdGFjayBtaXNtYXRjaC4gRXhwZWN0ZWQgXCIke2V4cGVjdGVkfVwiIGJ1dCBmb3VuZCBcIiR7YWN0dWFsfVwiIGluc3RlYWQuYClcbiAgICB0aGlzLm5hbWUgPSAnUG9wU3RhY2tNaXNtYXRjaEVycm9yJ1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBmbilcbiAgfVxufVxuXG5jbGFzcyBHZXRMaW5lQ29sRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG9yaWdpbjogYW55KSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMubmFtZSA9ICdHZXRMaW5lQ29sRXJyb3InXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIG9yaWdpbilcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRMaW5lT3JpZ2luKG9yaWdpbjogYW55KSB7XG4gIGNvbnN0IGVycm9yID0gbmV3IEdldExpbmVDb2xFcnJvcihvcmlnaW4pXG4gIGxldCBsaW5lOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgY29uc3Qgc3RhY2sgPSBlcnJvci5zdGFjayEuc3BsaXQoJ1xcbicpLnNsaWNlKDEpXG4gIHdoaWxlIChsaW5lID0gc3RhY2suc2hpZnQoKSkge1xuICAgIGlmIChsaW5lLnRyaW0oKS5zdGFydHNXaXRoKCdhdCBodHRwcycpKSB7XG4gICAgICByZXR1cm4gc3RhY2suc2hpZnQoKSEuc3BsaXQoJyBhdCAnKS5wb3AoKT8udHJpbSgpXG4gICAgfVxuICAgIC8vIGlmICghbGluZS5pbmNsdWRlcygnbG9nZ2VyJykpIHJldHVybiBsaW5lLnNwbGl0KCdhdCcpLnBvcCgpPy50cmltKClcbiAgfVxufVxuXG5jb25zdCByZXNlcnZlZCA9IG5ldyBTZXQoW1xuICAnZmlsbCdcbl0pXG5mdW5jdGlvbiBmaXhSZXNlcnZlZCh4OiBzdHJpbmcpIHtcbiAgaWYgKHJlc2VydmVkLmhhcyh4LnRvTG93ZXJDYXNlKCkpKSByZXR1cm4gJ18nICsgeFxuICByZXR1cm4geFxufVxuXG5mdW5jdGlvbiBjYXBpdGFsRmlyc3QoeDogc3RyaW5nKSB7XG4gIHJldHVybiB4LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgeC5zbGljZSgxKVxufVxuXG5mdW5jdGlvbiBzcGxpdFRhZyhsYWJlbDogc3RyaW5nKSB7XG4gIHJldHVybiBsYWJlbC5zcGxpdCgnOicpXG59XG5mdW5jdGlvbiBjbGVhblRhZyhsYWJlbDogc3RyaW5nKSB7XG4gIHJldHVybiBzcGxpdFRhZyhsYWJlbClbMF1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvZ2dlcihwYXRoOiBzdHJpbmcpOiBMb2dnZXIge1xuICBjb25zdCBpZCA9IGdldEZpbGVJZChwYXRoKVxuXG4gIGMuaWRzLmFkZChjYXBpdGFsRmlyc3QoaWQpKVxuXG4gIGNvbnN0IGNvbG9yID0gYW5zaUNvbG9yRm9yKGBbJHtpZH1dYClcbiAgY29uc3QgZGlnaXQgPSAoY2hlY2tzdW0oaWQgKyBpZCkgJSAxMDApLnRvRml4ZWQoMCkucGFkU3RhcnQoMiwgJzAnKVxuICBjb25zdCBjb2xvcmVkID0gKHg6IHN0cmluZykgPT4gYCR7Y29sb3J9JHtkaWdpdH07JHthbnNpQ29sb3JGb3IoeCl9JHt4fWBcblxuICBjb25zdCBsYXN0QXJyb3cgPSAobGFiZWw6IHN0cmluZykgPT4gbGFiZWwuc3BsaXQoJyAtPiAnKS5wb3AoKSFcbiAgY29uc3Qgd2l0aElkID0gKGxhYmVsOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBhID0gY2FwaXRhbEZpcnN0KGlkKVxuICAgIGNvbnN0IGIgPSBmaXhSZXNlcnZlZChsYXN0QXJyb3cobGFiZWwpKVxuICAgIHJldHVybiBbYSwgYl0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oYC5gKVxuICB9XG5cbiAgY29uc3QgbG9nID0gKG9wOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PiB7XG4gICAgaWYgKGMub3B0aW9ucy5wcm9kKSByZXR1cm4gW11cbiAgICByZXR1cm4gYy5vcHRpb25zLnF1aWV0ID8gW10gOiBbW29wLCBhcmdzXV1cbiAgfVxuXG4gIGlmICh0eXBlb2YgbG9jYXRpb24gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGxvY2F0aW9uID0gbmV3IFVSTCgnaHR0cDovL2NvbS8nKVxuICB9XG4gIGNvbnN0IHNlYXJjaFBhcmFtcyA9IG5ldyBVUkwobG9jYXRpb24uaHJlZikuc2VhcmNoUGFyYW1zXG4gIGNvbnN0IGZpbHRlciA9XG4gICAgc2VhcmNoUGFyYW1zLmdldCgnZmlsdGVyJyk/LnNwbGl0KCcsJylcbiAgICA/PyBzZWFyY2hQYXJhbXMuZ2V0KCdmaScpPy5zcGxpdCgnLCcpXG4gIGNvbnN0IGV4cGFuZCA9IHNlYXJjaFBhcmFtcy5oYXMoJ2V4cGFuZCcpIHx8IHNlYXJjaFBhcmFtcy5oYXMoJ2V4JylcbiAgYy5vcHRpb25zLnF1aWV0IHx8PSBzZWFyY2hQYXJhbXMuaGFzKCdxdScpXG4gIGMub3B0aW9ucy5wcm9kIHx8PSBzZWFyY2hQYXJhbXMuaGFzKCdwcm9kJylcbiAgaWYgKGMub3B0aW9ucy5wcm9kKSBjLm9wdGlvbnMucXVpZXQgPSB0cnVlXG5cbiAgY29uc3QgZm4gPSBPYmplY3QuYXNzaWduKGxvZywge1xuICAgIGlkKGlkOiBzdHJpbmcpIHtcbiAgICAgIGMuaXRlbUlkID0gaWRcbiAgICAgIHJldHVybiB3cmFwcGVkXG4gICAgfSxcbiAgICBsYWJlbChsYWJlbDogc3RyaW5nLCBhc1RvcCA9IGZhbHNlKSB7XG4gICAgICByZXR1cm4gd3JhcHBlZC5wdXNoKGxhYmVsLCBhc1RvcCwgZmFsc2UpXG4gICAgfSxcbiAgICBwdXNoKGxhYmVsOiBzdHJpbmcsIGlzVG9wID0gZmFsc2UsIGlzR3JvdXAgPSB0cnVlKSB7XG4gICAgICBjb25zdCBbbCwgdF0gPSBzcGxpdFRhZyhsYWJlbClcbiAgICAgIGNvbnN0IHRhZyA9ICh0ID8gJzonICsgdCA6ICcnKVxuICAgICAgY29uc3QgbGFiID0gZml4UmVzZXJ2ZWQoaXNUb3AgPyBsIDogd2l0aElkKGJyZWFrcyhpZCwgbCkpKVxuXG4gICAgICBpZiAoZmlsdGVyKSB7XG4gICAgICAgIGlmICghZmlsdGVyLnNvbWUoeCA9PiBsYWIudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyh4KSkpIHtcbiAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBwYXRoID0gJycgLy9nZXRMaW5lT3JpZ2luKGZuLnB1c2gpXG4gICAgICBpZiAobGFiLmVuZHNXaXRoKCc/JykpIHtcbiAgICAgICAgYy5sYWJlbHMuc2V0KGxhYiwgeyBwYXRoLCBraW5kOiBMb2dLaW5kW0xvZ0tpbmQuQnJhbmNoXSwgY29sb3I6IGNvbG9ySGFzaCh3aXRoSWQoY2xlYW5UYWcobGFiZWwpKSkgfSlcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGwudHJpbSgpLmluY2x1ZGVzKCdydW4nKSkge1xuICAgICAgICBjLmxhYmVscy5zZXQobGFiLCB7IHBhdGgsIGtpbmQ6IExvZ0tpbmRbTG9nS2luZC5BY3Rpb25dLCBjb2xvcjogY29sb3JIYXNoKHdpdGhJZChjbGVhblRhZyhsYWJlbCkpKSB9KVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAobC50cmltKCkuaW5jbHVkZXMoJ3B1c2gnKSkge1xuICAgICAgICBjLmxhYmVscy5zZXQobGFiLCB7IHBhdGgsIGtpbmQ6IExvZ0tpbmRbTG9nS2luZC5RdWV1ZV0sIGNvbG9yOiBjb2xvckhhc2god2l0aElkKGNsZWFuVGFnKGxhYmVsKSkpIH0pXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChsLnRyaW0oKS5pbmNsdWRlcygnZm9yRWFjaCcpKSB7XG4gICAgICAgIGMubGFiZWxzLnNldChsYWIsIHsgcGF0aCwga2luZDogTG9nS2luZFtMb2dLaW5kLlN0YWNrXSwgY29sb3I6IGNvbG9ySGFzaCh3aXRoSWQoY2xlYW5UYWcobGFiZWwpKSkgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjLmxhYmVscy5zZXQobGFiLCB7IHBhdGgsIGtpbmQ6IExvZ0tpbmRbTG9nS2luZC5Ob3JtYWxdLCBjb2xvcjogY29sb3JIYXNoKHdpdGhJZChjbGVhblRhZyhsYWJlbCkpKSB9KVxuICAgICAgfVxuICAgICAgYy5zdGFjay5wdXNoKGxhYilcbiAgICAgIGMub3BzLnB1c2goYy5zdGFjay5qb2luKCcgLT4gJykgKyB0YWcpXG4gICAgICBjLmFycm93cy5hZGQoYy5zdGFjay5zbGljZSgtMikuam9pbignIC0+ICcpICsgdGFnKVxuICAgICAgaWYgKCFpc0dyb3VwKSBjLnN0YWNrLnBvcCgpXG4gICAgICByZXR1cm4gYy5vcHRpb25zLnF1aWV0ID8gW10gOiBbXG4gICAgICAgIFshaXNHcm91cCA/ICdpbmZvJ1xuICAgICAgICAgIDogYy5zdGFjay5sZW5ndGggPj0gKGV4cGFuZCA/IDAgOiAyKVxuICAgICAgICAgICAgPyAnZ3JvdXAnIDogJ2dyb3VwQ29sbGFwc2VkJyxcbiAgICAgICAgW2NvbG9yZWQod2l0aElkKGxhYmVsKSldXG4gICAgICAgIF1cbiAgICAgIF1cbiAgICB9LFxuICAgIHBvcChsYWJlbDogc3RyaW5nLCBpc1RvcCA9IGZhbHNlKSB7XG4gICAgICBjb25zdCB0b3AgPSBjLnN0YWNrLnBvcCgpXG4gICAgICBjLm9wcy5wdXNoKGMuc3RhY2suam9pbignIC0+ICcpKVxuICAgICAgY29uc3QgbGFiID0gKGlzVG9wID8gY2xlYW5UYWcobGFiZWwpIDogd2l0aElkKGNsZWFuVGFnKGJyZWFrcyhpZCwgbGFiZWwpKSkpXG4gICAgICBpZiAodG9wICE9PSBsYWIpIHtcbiAgICAgICAgLy8gY29uc29sZS53YXJuKG5ldyBQb3BTdGFja01pc21hdGNoRXJyb3IobGFiLCB0b3AsIHdyYXBwZWQucG9wKSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBjLm9wdGlvbnMucXVpZXQgPyBbXSA6IFtbJ2dyb3VwRW5kJywgW11dXVxuICAgIH0sXG4gICAgYXNUb3AocGF5bG9hZDogc3RyaW5nKSB7XG4gICAgICBjb25zdCBbb3AsIC4uLnJlc3RdID0gcGF5bG9hZC5zcGxpdCgnICcpXG4gICAgICBjb25zdCB0ZXh0ID0gcmVzdC5qb2luKCcgJylcbiAgICAgIHJldHVybiB3cmFwcGVkW29wXSh0ZXh0LCB0cnVlKVxuICAgIH0sXG4gICAgY2xlYXJTdGFjaygpIHtcbiAgICAgIGMub3BzLnNwbGljZSgwKVxuICAgICAgYy5zdGFjay5zcGxpY2UoMClcbiAgICB9LFxuICAgIFsnaW5mby5wcmV0dHknXShsYWJlbDogYW55LCBvYmo6IGFueSkge1xuICAgICAgcmV0dXJuIHdyYXBwZWRbJ2luZm8nXShsYWJlbCwgSlNPTi5zdHJpbmdpZnkob2JqLCByZXBsYWNlciwgMikpXG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIHJlcGxhY2VyKGtleTogYW55LCB2YWx1ZTogYW55KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGggPiAxMCA/IHZhbHVlLnNsaWNlKDAsIDEwKSArICcgWy4uXScgOiB2YWx1ZVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIGNvbnN0IHdyYXBwZWQgPSB3cmFwQWxsRW1pdHRlcihpZCwgZm4pIGFzIGFueVxuXG4gIHdyYXBwZWRbJz4nXSA9IHdyYXBwZWQucHVzaFxuICB3cmFwcGVkWyc8J10gPSB3cmFwcGVkLnBvcFxuICB3cmFwcGVkWyc6J10gPSB3cmFwcGVkLmxhYmVsXG4gIHdyYXBwZWRbJ2luZm8nXSA9IChsYWJlbDogc3RyaW5nLCAuLi5hcmdzOiBhbnkpID0+IHtcbiAgICBjb25zdCBsYWIgPSB3aXRoSWQoYnJlYWtzKGlkLCBsYWJlbCkpXG4gICAgaWYgKGZpbHRlcikge1xuICAgICAgaWYgKCFmaWx0ZXIuc29tZSh4ID0+IGxhYi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHgpKSkge1xuICAgICAgICByZXR1cm4gW11cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGMub3B0aW9ucy5xdWlldCA/IFtdIDogW1snbG9nJywgW2NvbG9yZWQobGFiKSwgLi4uYXJnc11dXVxuICB9XG4gIHdyYXBwZWRbJy0+J10gPSB3cmFwcGVkLmFzVG9wXG5cbiAgcmV0dXJuIHdyYXBwZWRcbn1cblxuZnVuY3Rpb24gd3JhcEFsbEVtaXR0ZXI8VD4oaWQ6IHN0cmluZywgb2JqOiBUKTogVCB7XG4gIGZ1bmN0aW9uIHdyYXAoZm46IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oZnVuY3Rpb24gX19sb2dmbih0aGlzOiBhbnksIC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICBpZiAoYy5vcHRpb25zLnByb2QpIHJldHVybiBbXVxuXG4gICAgICBjLmVtaXR0ZXIuZW1pdCgnZXZlbnQnLCBpZCwgYXJncylcblxuICAgICAgLy8gaWYgKGMub3B0aW9ucy5xdWlldCkgcmV0dXJuXG5cbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKVxuICAgIH0sIHtcbiAgICAgIC4uLk9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyhmbikubWFwKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgICAgcmV0dXJuIFtrZXksIHdyYXAodmFsdWUpXVxuICAgICAgfSkpXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiBPYmplY3QuYXNzaWduKFxuICAgIHdyYXAob2JqKSxcbiAgICBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICBPYmplY3QuZW50cmllcyhvYmogYXMgYW55KVxuICAgICAgICAubWFwKChba2V5LCB2YWx1ZV0pID0+XG4gICAgICAgICAgW2tleSwgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICA/IHdyYXAodmFsdWUpXG4gICAgICAgICAgICA6IHZhbHVlXG4gICAgICAgICAgXVxuICAgICAgICApXG4gICAgKVxuICApIGFzIGFueVxufVxuXG5kZWNsYXJlIGNvbnN0IF9fZmlsZW5hbWU6IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVEMigpIHtcbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgYy5zdGFjay5zcGxpY2UoMClcbiAgfSlcblxuICBhZnRlckFsbChhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qgc2hhcGVzID0ge1xuICAgICAgTm9ybWFsOiAncmVjdGFuZ2xlJyxcbiAgICAgIEFjdGlvbjogJ292YWwnLFxuICAgICAgQnJhbmNoOiAnaGV4YWdvbicsXG4gICAgICBFbnRyeTogJ2NpcmNsZScsXG4gICAgICBRdWV1ZTogJ3F1ZXVlJyxcbiAgICAgIFN0YWNrOiAnY3lsaW5kZXInLFxuICAgIH0gYXMgYW55XG5cbiAgICBjb25zdCB0ZXh0ID0gW1xuICAgICAgLi4uWy4uLmxvZ2dlckNvbnRleHQuaWRzXS5tYXAoaWQgPT5cbiAgICAgICAgYCR7aWR9LnN0eWxlLmZvbnQtc2l6ZTogNjBgXG4gICAgICApLFxuICAgICAgLi4uWy4uLmxvZ2dlckNvbnRleHQuYXJyb3dzXS5tYXAoKHg6IGFueSkgPT5cbiAgICAgICAgeC5pbmNsdWRlcygnLT4nKSA/IGAke3h9IHtcbiAgc3R5bGU6IHtcbiAgICBzdHJva2Utd2lkdGg6IDhcbiAgICBmb250LXNpemU6IDM1XG4gICAgYm9sZDogdHJ1ZVxuICAgICR7eC5pbmNsdWRlcygnRUxTRSBJRicpID8gYFxuICAgIHN0cm9rZTogXCIjZjdjXCJcbiAgICBmb250LWNvbG9yOiBcIiNmN2NcIlxuICAgIGAgOiB4LmluY2x1ZGVzKCdJRicpID8gYFxuICAgIHN0cm9rZTogXCIjN2Q0XCJcbiAgICBmb250LWNvbG9yOiBcIiM3ZDRcIlxuICAgIGAgOiB4LmluY2x1ZGVzKCdFTFNFJykgPyBgXG4gICAgc3Ryb2tlOiBcIiNmNzRcIlxuICAgIGZvbnQtY29sb3I6IFwiI2Y3NFwiXG4gICAgYCA6ICcnfVxuICB9XG59YCA6ICcnXG4gICAgICApXG4gICAgXVxuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgbG9nZ2VyQ29udGV4dC5sYWJlbHMpIHtcbiAgICAgIGxldCBsaW5rID0gJydcbiAgICAgIGlmICh2YWx1ZS5wYXRoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IChnbG9iYWxUaGlzIGFzIGFueSk/LmFwcGx5U291cmNlTWFwcz8uKHZhbHVlLnBhdGgpXG4gICAgICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBwYXRoLnNwbGl0KCc6JylcbiAgICAgICAgICAgIHAucG9wKClcbiAgICAgICAgICAgIHAucHVzaCgnMCcpXG4gICAgICAgICAgICBsaW5rID0gYCR7a2V5fTogeyBsaW5rOiAuLyR7cC5qb2luKCc6Jykuc3BsaXQoJy8nKS5zbGljZSgtMSkuam9pbignLycpfSB9YFxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGV4dC5wdXNoKGAke2tleX06IHtcbnNoYXBlOiAke3NoYXBlc1t2YWx1ZS5raW5kXX1cbn1cblxuJHtrZXl9LnN0eWxlLmZpbGw6IFwiIyR7a2V5LmluY2x1ZGVzKCdFTFNFIElGJylcbiAgICAgICAgICA/ICdmN2MnXG4gICAgICAgICAgOiBrZXkuaW5jbHVkZXMoJ0lGJykgPyAnN2Q0J1xuICAgICAgICAgICAgOiBrZXkuaW5jbHVkZXMoJ0VMU0UnKSA/ICdmNzQnXG4gICAgICAgICAgICAgIDogdmFsdWUuY29sb3J9XCJcbiR7a2V5fS5zdHlsZS5mb250LWNvbG9yOiBcIiMwMDBcIlxuJHtrZXl9LnN0eWxlLnN0cm9rZS13aWR0aDogNFxuJHtrZXl9LnN0eWxlLnN0cm9rZTogXCIkeyhrZXkuaW5jbHVkZXMoJ0lGJykgfHwga2V5LmluY2x1ZGVzKCdFTFNFJykpID8gJ3RyYW5zcGFyZW50JyA6ICcjMDAwJ31cIlxuJHtrZXl9LnN0eWxlLmZvbnQtc2l6ZTogNDBcblxuJHtsaW5rfWApXG4gICAgfVxuXG5cbiAgICA7IChnbG9iYWxUaGlzIGFzIGFueSk/LndyaXRlVGV4dEZpbGU/LihcbiAgICAgIF9fZmlsZW5hbWUucmVwbGFjZSgvXFwuW2p0XXN4PyQvLCAnLmQyJykucmVwbGFjZSgnLnRlc3QnLCAnJyksXG4gICAgICB0ZXh0LmpvaW4oJ1xcbicpXG4gICAgKVxuICB9KVxufVxuIiwgImV4cG9ydCBmdW5jdGlvbiByYW5kb21IZXgoZGlnaXRzID0gMywgbWluSGV4ID0gJzg4OCcsIG1heEhleCA9ICdiYmInKSB7XG4gIGNvbnN0IG1pbiA9IHBhcnNlSW50KG1pbkhleCwgMTYpXG4gIGNvbnN0IG1heCA9IHBhcnNlSW50KG1heEhleCwgMTYpXG4gIGNvbnN0IHNjYWxlID0gbWF4IC0gbWluXG4gIGNvbnN0IGhleCA9ICgoXG4gICAgKE1hdGgucmFuZG9tKCkgKiBzY2FsZSkgfCAwXG4gICkgKyBtaW4pLnRvU3RyaW5nKDE2KS5wYWRTdGFydChkaWdpdHMsICcwJylcbiAgcmV0dXJuIGhleFxufVxuIiwgImltcG9ydCB7IE5vbk51bGwgfSBmcm9tICcuL3R5cGVzJ1xuXG5sZXQgcmVxdWlyZWRUYXJnZXQ6IGFueVxuXG5leHBvcnQgY2xhc3MgTWlzc2luZ0RlcGVuZGVuY3lFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IocHJvcDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFByb3BlcnR5IFwiJHtwcm9wfVwiIGlzIHJlcXVpcmVkIHRvIGJlIGEgbm9uLW51bGxpc2ggdmFsdWUuYClcbiAgICB0aGlzLm5hbWUgPSAnTWlzc2luZ0RlcGVuZGVuY3lFcnJvcidcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgcmVxdWlyZWRQcm94eUhhbmRsZXIuZ2V0KVxuICB9XG59XG5cbmNvbnN0IHJlcXVpcmVkUHJveHlIYW5kbGVyID0ge1xuICBnZXQoXzogYW55LCBwcm9wOiBhbnkpIHtcbiAgICBpZiAocHJvcCBpbiByZXF1aXJlZFRhcmdldCAmJiByZXF1aXJlZFRhcmdldFtwcm9wXSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gcmVxdWlyZWRUYXJnZXRbcHJvcF1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1pc3NpbmdEZXBlbmRlbmN5RXJyb3IocHJvcClcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgTWlzc2luZ0RlcGVuZGVuY3lFcnJvclN5bWJvbCA9IFN5bWJvbCgnTWlzc2luZ0RlcGVuZGVuY3lFcnJvcicpXG5cbmNvbnN0IHJlcXVpcmVkUHJveHlIYW5kbGVyRmFzdCA9IHtcbiAgZ2V0KF86IGFueSwgcHJvcDogYW55KSB7XG4gICAgaWYgKHByb3AgaW4gcmVxdWlyZWRUYXJnZXQgJiYgcmVxdWlyZWRUYXJnZXRbcHJvcF0gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHJlcXVpcmVkVGFyZ2V0W3Byb3BdXG4gICAgfVxuICAgIHRocm93IE1pc3NpbmdEZXBlbmRlbmN5RXJyb3JTeW1ib2xcbiAgfVxufVxuXG5jb25zdCBSZXF1aXJlZFByb3h5ID0gbmV3IFByb3h5KHt9LCByZXF1aXJlZFByb3h5SGFuZGxlcilcbmNvbnN0IFJlcXVpcmVkUHJveHlGYXN0ID0gbmV3IFByb3h5KHt9LCByZXF1aXJlZFByb3h5SGFuZGxlckZhc3QpXG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1aXJlZDxUIGV4dGVuZHMgb2JqZWN0PihvZjogVCk6IE5vbk51bGw8VD4ge1xuICByZXF1aXJlZFRhcmdldCA9IG9mXG4gIHJldHVybiBSZXF1aXJlZFByb3h5IGFzIGFueVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZWRGYXN0PFQgZXh0ZW5kcyBvYmplY3Q+KG9mOiBUKTogTm9uTnVsbDxUPiB7XG4gIHJlcXVpcmVkVGFyZ2V0ID0gb2ZcbiAgcmV0dXJuIFJlcXVpcmVkUHJveHlGYXN0IGFzIGFueVxufVxuIiwgImltcG9ydCB7IEN0b3IgfSBmcm9tICcuL3R5cGVzLnRzJ1xuaW1wb3J0IHsgRGVmZXJyZWQgfSBmcm9tICcuL2RlZmVycmVkLnRzJ1xuaW1wb3J0IHsgR2V0dGVyIH0gZnJvbSAnLi9wcm94eS1nZXR0ZXIudHMnXG5cbmNvbnN0IGRlZmF1bHRUcmFuc2ZlcmFibGVzOiBDdG9yW10gPSBbXG4gIHR5cGVvZiBPZmZzY3JlZW5DYW52YXMgIT09ICd1bmRlZmluZWQnID8gT2Zmc2NyZWVuQ2FudmFzIDogdm9pZCAwLFxuICB0eXBlb2YgTWVzc2FnZVBvcnQgIT09ICd1bmRlZmluZWQnID8gTWVzc2FnZVBvcnQgOiB2b2lkIDBcbl0uZmlsdGVyKEJvb2xlYW4pIGFzIEN0b3JbXVxuXG5pbnRlcmZhY2UgUG9ydExpa2Uge1xuICBvbm1lc3NhZ2U6ICgoZXY6IE1lc3NhZ2VFdmVudCkgPT4gYW55KSB8IG51bGxcbiAgb25tZXNzYWdlZXJyb3I6ICgoZXY6IE1lc3NhZ2VFdmVudCkgPT4gYW55KSB8IG51bGxcbiAgcG9zdE1lc3NhZ2UobWVzc2FnZTogYW55LCB0cmFuc2ZlcjogVHJhbnNmZXJhYmxlW10pOiB2b2lkXG4gIHBvc3RNZXNzYWdlKG1lc3NhZ2U6IGFueSwgb3B0aW9ucz86IFN0cnVjdHVyZWRTZXJpYWxpemVPcHRpb25zKTogdm9pZFxufVxuXG5leHBvcnQgdHlwZSBScGMgPSAobWV0aG9kOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PiBhbnlcblxuZXhwb3J0IGNvbnN0IHJwYyA9IDxUUmVtb3RlIGV4dGVuZHMgb2JqZWN0PihcbiAgcG9ydDogUG9ydExpa2UsXG4gIGFwaTogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9LFxuICB0cmFuc2ZlcmFibGVzOiBDdG9yW10gPSBkZWZhdWx0VHJhbnNmZXJhYmxlc1xuKSA9PiB7XG4gIGNvbnN0IHhmZXIgPSAoYXJnczogYW55W10sIHRyYW5zZmVyYWJsZXM6IEN0b3JbXSkgPT4gYXJncy5yZWR1Y2UoKHAsIG4pID0+IHtcbiAgICBpZiAodHlwZW9mIG4gPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAodHJhbnNmZXJhYmxlcy5zb21lKChjdG9yKSA9PlxuICAgICAgICBuIGluc3RhbmNlb2YgY3RvcikpIHtcbiAgICAgICAgcC5wdXNoKG4pXG4gICAgICB9IGVsc2VcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbikge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG5ba2V5XSAmJlxuICAgICAgICAgICAgdHJhbnNmZXJhYmxlcy5zb21lKChjdG9yKSA9PlxuICAgICAgICAgICAgICBuW2tleV0gaW5zdGFuY2VvZiBjdG9yKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcC5wdXNoKG5ba2V5XSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBcbiAgfSwgW10gYXMgVHJhbnNmZXJhYmxlW10pXG5cbiAgbGV0IGNhbGxiYWNrSWQgPSAwXG5cbiAgY29uc3QgY2FsbHMgPSBuZXcgTWFwPG51bWJlciwgRGVmZXJyZWQ8YW55Pj4oKVxuXG4gIHBvcnQub25tZXNzYWdlID0gYXN5bmMgKHsgZGF0YSB9KSA9PiB7XG4gICAgY29uc3QgeyBjaWQgfSA9IGRhdGFcblxuICAgIGlmIChkYXRhLm1ldGhvZCkge1xuICAgICAgbGV0IHJlc3VsdDogYW55XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIShkYXRhLm1ldGhvZCBpbiBhcGkpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIGBNZXRob2QgXCIke2RhdGEubWV0aG9kfVwiIGRvZXMgbm90IGV4aXN0IGluIFJQQyBBUEkuYFxuICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgYXBpW2RhdGEubWV0aG9kXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBgUHJvcGVydHkgXCIke2RhdGEubWV0aG9kfVwiIGV4aXN0cyBpbiBSUEMgYnV0IGlzIG5vdCB0eXBlIGZ1bmN0aW9uLCBpbnN0ZWFkIGl0IGlzIHR5cGU6IFwiJHt0eXBlb2YgYXBpW2RhdGEubWV0aG9kXX1cImBcbiAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHQgPSBhd2FpdCBhcGlbZGF0YS5tZXRob2RdKC4uLmRhdGEuYXJncylcblxuICAgICAgICBwb3J0LnBvc3RNZXNzYWdlKFxuICAgICAgICAgIHsgY2lkLCByZXN1bHQgfSxcbiAgICAgICAgICB4ZmVyKFtyZXN1bHRdLCB0cmFuc2ZlcmFibGVzKVxuICAgICAgICApXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBwb3J0LnBvc3RNZXNzYWdlKHsgY2lkLCBlcnJvciB9KVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmICghY2FsbHMuaGFzKGNpZCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coY2lkLCBjYWxscy5zaXplLCBPYmplY3Qua2V5cyhkYXRhLnJlc3VsdCkpXG4gICAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcignQ2FsbGJhY2sgaWQgbm90IGZvdW5kOiAnICsgY2lkKVxuICAgICAgfVxuXG4gICAgICBjb25zdCB7IHJlc29sdmUsIHJlamVjdCB9ID0gY2FsbHMuZ2V0KGNpZCkhXG4gICAgICBjYWxscy5kZWxldGUoZGF0YS5jaWQpXG5cbiAgICAgIGlmIChkYXRhLmVycm9yKSByZWplY3QoZGF0YS5lcnJvcilcbiAgICAgIGVsc2UgcmVzb2x2ZShkYXRhLnJlc3VsdClcbiAgICB9XG4gIH1cblxuICBjb25zdCBjYWxsID0gKG1ldGhvZDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4ge1xuICAgIGNvbnN0IGNpZCA9ICsrY2FsbGJhY2tJZFxuXG4gICAgY29uc3QgZGVmZXJyZWQgPSBEZWZlcnJlZCgpXG5cbiAgICBjYWxscy5zZXQoY2lkLCBkZWZlcnJlZClcblxuICAgIHRyeSB7XG4gICAgICBwb3J0LnBvc3RNZXNzYWdlKFxuICAgICAgICB7IG1ldGhvZCwgYXJncywgY2lkIH0sXG4gICAgICAgIHhmZXIoYXJncywgdHJhbnNmZXJhYmxlcylcbiAgICAgIClcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdDYWxsIGZhaWxlZDogJyArIG1ldGhvZCwgYXJncylcbiAgICB9XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxuICB9XG5cbiAgY29uc3QgZ2V0dGVyID0gR2V0dGVyKGtleSA9PlxuICAgIGNhbGwuYmluZChudWxsLCBrZXkpLFxuICAgIGNhbGxcbiAgKSBhcyB1bmtub3duIGFzIFJwYyAmIFRSZW1vdGVcblxuICByZXR1cm4gZ2V0dGVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0X3JwYygpIHtcbiAgLy8gQGVudiBicm93c2VyXG4gIGRlc2NyaWJlKCdycGMnLCAoKSA9PiB7XG4gICAgaXQoJ3dvcmtzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpXG5cbiAgICAgIGxldCBmb28gPSAwXG4gICAgICBsZXQgYmFyID0gMFxuXG4gICAgICBjb25zdCBhX2FwaSA9IHtcbiAgICAgICAgYXN5bmMgcnVuRm9vKHg6IG51bWJlcikge1xuICAgICAgICAgIGZvbyArPSB4XG4gICAgICAgICAgcmV0dXJuIGZvb1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGEgPSBycGM8dHlwZW9mIGJfYXBpPihwb3J0MSwgYV9hcGkpXG5cbiAgICAgIGNvbnN0IGJfYXBpID0ge1xuICAgICAgICBhc3luYyBydW5CYXIoeDogbnVtYmVyKSB7XG4gICAgICAgICAgYmFyICs9IHhcbiAgICAgICAgICByZXR1cm4gYmFyXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGIgPSBycGM8dHlwZW9mIGFfYXBpPihwb3J0MiwgYl9hcGkpXG5cbiAgICAgIGF3YWl0IGEucnVuQmFyKDEpXG4gICAgICBhd2FpdCBiLnJ1bkZvbygxKVxuXG4gICAgICBleHBlY3QoZm9vKS50b0JlKDEpXG4gICAgICBleHBlY3QoYmFyKS50b0JlKDEpXG5cbiAgICAgIGF3YWl0IGEoJ3J1bkJhcicsIDIpXG4gICAgICBhd2FpdCBiKCdydW5Gb28nLCAyKVxuXG4gICAgICBleHBlY3QoZm9vKS50b0JlKDMpXG4gICAgICBleHBlY3QoYmFyKS50b0JlKDMpXG4gICAgfSlcbiAgfSlcbn1cbiIsICJpbnRlcmZhY2UgRGF0YVR5cGVzIHtcbiAgYm9vbDogYm9vbGVhblxuICB1ODogbnVtYmVyXG4gIHUxNjogbnVtYmVyXG4gIHUzMjogbnVtYmVyXG4gIHU2NDogYmlnaW50XG4gIGk4OiBudW1iZXJcbiAgaTE2OiBudW1iZXJcbiAgaTMyOiBudW1iZXJcbiAgaTY0OiBiaWdpbnRcbiAgZjMyOiBudW1iZXJcbiAgZjY0OiBudW1iZXJcbiAgdXNpemU6IG51bWJlclxufVxuXG5pbnRlcmZhY2UgVHlwZWRBcnJheVR5cGVzIHtcbiAgYm9vbDogVWludDhBcnJheVxuICB1ODogVWludDhBcnJheVxuICB1MTY6IFVpbnQxNkFycmF5XG4gIHUzMjogVWludDMyQXJyYXlcbiAgdTY0OiBCaWdVaW50NjRBcnJheVxuICBpODogSW50OEFycmF5XG4gIGkxNjogSW50MTZBcnJheVxuICBpMzI6IEludDMyQXJyYXlcbiAgaTY0OiBCaWdJbnQ2NEFycmF5XG4gIGYzMjogRmxvYXQzMkFycmF5XG4gIGY2NDogRmxvYXQ2NEFycmF5XG59XG5cbnR5cGUgU2luZ2xlVmFsdWUgPSBrZXlvZiBEYXRhVHlwZXNcblxudHlwZSBUdXBsZVZhbHVlID0gW2tleW9mIERhdGFUeXBlcywgbnVtYmVyXVxuXG50eXBlIFN0cnVjdENvbGxlY3Rpb25EZWY8VCBleHRlbmRzIFNjaGVtYURlZj4gPSBbU3RydWN0RmFjdG9yeTxUPiwgbnVtYmVyXVxuXG50eXBlIFNjaGVtYURlZjxVIGV4dGVuZHMgc3RyaW5nID0gc3RyaW5nPiA9IHtcbiAgW0sgaW4gVV06IFNpbmdsZVZhbHVlIHwgVHVwbGVWYWx1ZSB8IFN0cnVjdEZhY3Rvcnk8YW55PiB8IFN0cnVjdENvbGxlY3Rpb25EZWY8YW55PlxufVxuXG50eXBlIFN0cnVjdFZpZXc8VCBleHRlbmRzIFNjaGVtYURlZj4gPSB7XG4gIFtLIGluIGtleW9mIFRdOiBUW0tdIGV4dGVuZHMgU2luZ2xlVmFsdWVcbiAgPyBEYXRhVHlwZXNbVFtLXV1cbiAgOiBUW0tdIGV4dGVuZHMgVHVwbGVWYWx1ZVxuICA/IFN0cnVjdExpbmVhclZpZXc8VFtLXVswXT5cbiAgOiBUW0tdIGV4dGVuZHMgU3RydWN0RmFjdG9yeTxpbmZlciBVPlxuICA/IFN0cnVjdFZpZXc8VSBleHRlbmRzIFNjaGVtYURlZiA/IFUgOiBuZXZlcj5cbiAgOiBUW0tdIGV4dGVuZHMgU3RydWN0Q29sbGVjdGlvbkRlZjxpbmZlciBVPiA/IFN0cnVjdENvbGxlY3Rpb248VT5cbiAgOiBuZXZlclxufSAmIFN0cnVjdFZpZXdEYXRhXG5cbmludGVyZmFjZSBTdHJ1Y3RWaWV3RGF0YSB7XG4gIGRhdGFWaWV3OiBEYXRhVmlld1xuICBidWZmZXI6IEFycmF5QnVmZmVyXG4gIGJ5dGVPZmZzZXQ6IG51bWJlclxuICBieXRlTGVuZ3RoOiBudW1iZXJcbiAgbGl0dGxlRW5kaWFuOiBib29sZWFuXG59XG5cbnR5cGUgU3RydWN0RmFjdG9yeUZuPFQgZXh0ZW5kcyBTY2hlbWFEZWY+ID0ge1xuICAoYnVmZmVyOiBUeXBlZEFycmF5VHlwZXNba2V5b2YgVHlwZWRBcnJheVR5cGVzXSk6IFN0cnVjdFZpZXc8VD5cbiAgKGJ1ZmZlcjogRGF0YVZpZXcpOiBTdHJ1Y3RWaWV3PFQ+XG4gIChidWZmZXI6IEFycmF5QnVmZmVyLCBieXRlT2Zmc2V0PzogbnVtYmVyKTogU3RydWN0VmlldzxUPlxufVxuXG50eXBlIFN0cnVjdEZhY3Rvcnk8VCBleHRlbmRzIFNjaGVtYURlZj4gPSBTdHJ1Y3RGYWN0b3J5Rm48VD4gJiB7IGJ5dGVMZW5ndGg6IG51bWJlciwgdHlwZTogU3RydWN0VmlldzxUPiB9XG5cbmNsYXNzIFN0cnVjdExpbmVhclZpZXc8VCBleHRlbmRzIFNpbmdsZVZhbHVlLCBVID0gVCBleHRlbmRzICdpNjQnIHwgJ3U2NCcgPyBiaWdpbnQgOiBudW1iZXI+IHtcbiAgYnl0ZUxlbmd0aDogbnVtYmVyXG4gIGVsZW1lbnRTaXplOiBudW1iZXJcbiAgbWV0aG9kczogYW55XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHZpZXc6IFN0cnVjdFZpZXc8YW55PixcbiAgICBwdWJsaWMgdHlwZTogVCxcbiAgICBwdWJsaWMgZmllbGRPZmZzZXQ6IG51bWJlcixcbiAgICBwdWJsaWMgbGVuZ3RoOiBudW1iZXJcbiAgKSB7XG4gICAgdGhpcy5ieXRlTGVuZ3RoID0gdGhpcy5sZW5ndGggKiBzaXplc1t0eXBlXVxuICAgIHRoaXMubWV0aG9kcyA9IG1ldGhvZHNbdHlwZV1cbiAgICB0aGlzLmVsZW1lbnRTaXplID0gc2l6ZXNbdHlwZV1cbiAgfVxuXG4gIGdldCBieXRlT2Zmc2V0KCkge1xuICAgIHJldHVybiB0aGlzLnZpZXcuYnl0ZU9mZnNldCArIHRoaXMuZmllbGRPZmZzZXRcbiAgfVxuXG4gIGdldChpbmRleDogbnVtYmVyLCBsaXR0bGVFbmRpYW46IGJvb2xlYW4gPSB0aGlzLnZpZXcubGl0dGxlRW5kaWFuKTogVSB7XG4gICAgcmV0dXJuIHRoaXMubWV0aG9kc1swXS5jYWxsKFxuICAgICAgdGhpcy52aWV3LmRhdGFWaWV3LFxuICAgICAgdGhpcy5ieXRlT2Zmc2V0ICsgaW5kZXggKiB0aGlzLmVsZW1lbnRTaXplLFxuICAgICAgbGl0dGxlRW5kaWFuXG4gICAgKSBhcyBVXG4gIH1cblxuICBzZXQoaW5kZXg6IG51bWJlciwgdmFsdWU6IFUsIGxpdHRsZUVuZGlhbjogYm9vbGVhbiA9IHRoaXMudmlldy5saXR0bGVFbmRpYW4pOiB2b2lkIHtcbiAgICB0aGlzLm1ldGhvZHNbMV0uY2FsbChcbiAgICAgIHRoaXMudmlldy5kYXRhVmlldyxcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCArIGluZGV4ICogdGhpcy5lbGVtZW50U2l6ZSxcbiAgICAgIHZhbHVlLFxuICAgICAgbGl0dGxlRW5kaWFuXG4gICAgKVxuICB9XG59XG5cbmNsYXNzIFN0cnVjdENvbGxlY3Rpb248VCBleHRlbmRzIFNjaGVtYURlZj4ge1xuICBieXRlTGVuZ3RoOiBudW1iZXJcbiAgaW5zdGFuY2U6IFN0cnVjdFZpZXc8VD5cblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgdmlldzogU3RydWN0Vmlldzxhbnk+LFxuICAgIHB1YmxpYyBmYWN0b3J5OiBTdHJ1Y3RGYWN0b3J5PFQ+LFxuICAgIHB1YmxpYyBmaWVsZE9mZnNldDogbnVtYmVyLFxuICAgIHB1YmxpYyBsZW5ndGg6IG51bWJlclxuICApIHtcbiAgICB0aGlzLmJ5dGVMZW5ndGggPSBsZW5ndGggKiBmYWN0b3J5LmJ5dGVMZW5ndGhcbiAgICB0aGlzLmluc3RhbmNlID0gdGhpcy5mYWN0b3J5KHRoaXMudmlldy5idWZmZXIsIHRoaXMudmlldy5ieXRlT2Zmc2V0ICsgdGhpcy5maWVsZE9mZnNldClcbiAgfVxuXG4gIGdldCBieXRlT2Zmc2V0KCkge1xuICAgIHJldHVybiB0aGlzLnZpZXcuYnl0ZU9mZnNldCArIHRoaXMuZmllbGRPZmZzZXRcbiAgfVxuXG4gIGF0KGluZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLmluc3RhbmNlLmJ5dGVPZmZzZXQgPSB0aGlzLmJ5dGVPZmZzZXQgKyBpbmRleCAqIHRoaXMuZmFjdG9yeS5ieXRlTGVuZ3RoXG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VcbiAgfVxuXG4gIGdldChpbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZmFjdG9yeSh0aGlzLnZpZXcuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQgKyBpbmRleCAqIHRoaXMuZmFjdG9yeS5ieXRlTGVuZ3RoKVxuICB9XG59XG5cbmNvbnN0IHNpemVzID0ge1xuICBib29sOiAxLFxuICB1ODogMSxcbiAgdTE2OiAyLFxuICB1MzI6IDQsXG4gIHU2NDogOCxcbiAgaTg6IDEsXG4gIGkxNjogMixcbiAgaTMyOiA0LFxuICBpNjQ6IDgsXG4gIGYzMjogNCxcbiAgZjY0OiA4LFxuICB1c2l6ZTogNCxcbn1cblxuY29uc3QgbWV0aG9kcyA9IHtcbiAgYm9vbDogW0RhdGFWaWV3LnByb3RvdHlwZS5nZXRVaW50OCwgRGF0YVZpZXcucHJvdG90eXBlLnNldFVpbnQ4XSxcbiAgdTg6IFtEYXRhVmlldy5wcm90b3R5cGUuZ2V0VWludDgsIERhdGFWaWV3LnByb3RvdHlwZS5zZXRVaW50OF0sXG4gIHUxNjogW0RhdGFWaWV3LnByb3RvdHlwZS5nZXRVaW50MTYsIERhdGFWaWV3LnByb3RvdHlwZS5zZXRVaW50MTZdLFxuICB1MzI6IFtEYXRhVmlldy5wcm90b3R5cGUuZ2V0VWludDMyLCBEYXRhVmlldy5wcm90b3R5cGUuc2V0VWludDMyXSxcbiAgdTY0OiBbRGF0YVZpZXcucHJvdG90eXBlLmdldEJpZ1VpbnQ2NCwgRGF0YVZpZXcucHJvdG90eXBlLnNldEJpZ1VpbnQ2NF0sXG4gIGk4OiBbRGF0YVZpZXcucHJvdG90eXBlLmdldEludDgsIERhdGFWaWV3LnByb3RvdHlwZS5zZXRJbnQ4XSxcbiAgaTE2OiBbRGF0YVZpZXcucHJvdG90eXBlLmdldEludDE2LCBEYXRhVmlldy5wcm90b3R5cGUuc2V0SW50MTZdLFxuICBpMzI6IFtEYXRhVmlldy5wcm90b3R5cGUuZ2V0SW50MzIsIERhdGFWaWV3LnByb3RvdHlwZS5zZXRJbnQzMl0sXG4gIGk2NDogW0RhdGFWaWV3LnByb3RvdHlwZS5nZXRCaWdJbnQ2NCwgRGF0YVZpZXcucHJvdG90eXBlLnNldEJpZ0ludDY0XSxcbiAgZjMyOiBbRGF0YVZpZXcucHJvdG90eXBlLmdldEZsb2F0MzIsIERhdGFWaWV3LnByb3RvdHlwZS5zZXRGbG9hdDMyXSxcbiAgZjY0OiBbRGF0YVZpZXcucHJvdG90eXBlLmdldEZsb2F0NjQsIERhdGFWaWV3LnByb3RvdHlwZS5zZXRGbG9hdDY0XSxcbiAgdXNpemU6IFtEYXRhVmlldy5wcm90b3R5cGUuZ2V0VWludDMyLCBEYXRhVmlldy5wcm90b3R5cGUuc2V0VWludDMyXSxcbn0gYXMgY29uc3RcblxuZnVuY3Rpb24gZ2V0U2l6ZU9mPFQgZXh0ZW5kcyBTY2hlbWFEZWY+KHNjaGVtYTogVCkge1xuICBsZXQgYnl0ZUxlbmd0aCA9IDBcblxuICBmb3IgKGNvbnN0IHR5cGUgb2YgT2JqZWN0LnZhbHVlcyhzY2hlbWEpKSB7XG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgYnl0ZUxlbmd0aCArPSBzaXplc1t0eXBlXVxuICAgIH1cbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHR5cGUpKSB7XG4gICAgICBjb25zdCBbc3ViVHlwZSwgY291bnRdID0gdHlwZVxuXG4gICAgICBpZiAodHlwZW9mIHN1YlR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGJ5dGVMZW5ndGggKz0gY291bnQgKiBzaXplc1tzdWJUeXBlXVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGJ5dGVMZW5ndGggKz0gY291bnQgKiBzdWJUeXBlLmJ5dGVMZW5ndGhcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBieXRlTGVuZ3RoICs9IHR5cGUuYnl0ZUxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlTGVuZ3RoXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmVTdHJ1Y3Q8VCBleHRlbmRzIFNjaGVtYURlZj4oc2NoZW1hOiBULCBsaXR0bGVFbmRpYW4gPSB0cnVlKTogU3RydWN0RmFjdG9yeTxUPiB7XG4gIGxldCBieXRlTGVuZ3RoID0gZ2V0U2l6ZU9mKHNjaGVtYSlcblxuICBjb25zdCBmYWN0b3J5OiBTdHJ1Y3RGYWN0b3J5Rm48VD4gPSAoYnVmZmVyLCBieXRlT2Zmc2V0PzogbnVtYmVyKSA9PiB7XG4gICAgbGV0IGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlclxuICAgIGxldCBkYXRhVmlldzogRGF0YVZpZXcgfCB1bmRlZmluZWRcblxuICAgIGlmIChidWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBidWZmZXIgaW5zdGFuY2VvZiBTaGFyZWRBcnJheUJ1ZmZlcikge1xuICAgICAgYXJyYXlCdWZmZXIgPSBidWZmZXJcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBhcnJheUJ1ZmZlciA9IGJ1ZmZlci5idWZmZXJcblxuICAgICAgaWYgKGJ1ZmZlciBpbnN0YW5jZW9mIERhdGFWaWV3KSB7XG4gICAgICAgIGJ5dGVPZmZzZXQgPSBidWZmZXIuYnl0ZU9mZnNldFxuICAgICAgICBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhhcnJheUJ1ZmZlcilcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBieXRlT2Zmc2V0ID0gYnVmZmVyLmJ5dGVPZmZzZXRcbiAgICAgIH1cbiAgICB9XG5cbiAgICBieXRlT2Zmc2V0ID8/PSAwXG5cbiAgICBpZiAoIWRhdGFWaWV3KSBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhhcnJheUJ1ZmZlcilcblxuICAgIGNvbnN0IHN0cnVjdFZpZXdEYXRhOiBTdHJ1Y3RWaWV3RGF0YSA9IHtcbiAgICAgIGJ1ZmZlcjogYXJyYXlCdWZmZXIsXG4gICAgICBkYXRhVmlldyxcbiAgICAgIGJ5dGVPZmZzZXQsXG4gICAgICBieXRlTGVuZ3RoLFxuICAgICAgbGl0dGxlRW5kaWFuXG4gICAgfVxuXG4gICAgY29uc3Qgc3RydWN0VmlldzogU3RydWN0VmlldzxUPiA9IHN0cnVjdFZpZXdEYXRhIGFzIFN0cnVjdFZpZXc8VD5cblxuICAgIC8vIFdlIG5vcm1hbGl6ZSBieXRlT2Zmc2V0IHRvIDAgZm9yIHRoZSBmaWVsZCBvZmZzZXRzIGJlY2F1c2Ugd2UgcHVsbCBpdCBhZ2FpblxuICAgIC8vIGR5bmFtaWNhbGx5IHVzaW5nIHN0cnVjdFZpZXcuYnl0ZU9mZnNldC4gVGhpcyBhbGxvd3MgdGhlIHN0cnVjdCB2aWV3IHRvIG1vdmUgdG8gYSBkaWZmZXJlbnRcbiAgICAvLyBvZmZzZXQgd2l0aG91dCBoYXZpbmcgdG8gY3JlYXRlIGEgbmV3IGluc3RhbmNlLlxuICAgIGJ5dGVPZmZzZXQgPSAwXG5cbiAgICBjb25zdCBlbnRyaWVzOiBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3JdW10gPSBbXVxuXG4gICAgZm9yIChjb25zdCBba2V5LCB0eXBlXSBvZiBPYmplY3QuZW50cmllcyhzY2hlbWEpKSB7XG4gICAgICBsZXQgZGVzYzogUHJvcGVydHlEZXNjcmlwdG9yXG5cbiAgICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgbSA9IG1ldGhvZHNbdHlwZV0gYXMgW3R5cGVvZiBEYXRhVmlldy5wcm90b3R5cGUuZ2V0VWludDMyLCB0eXBlb2YgRGF0YVZpZXcucHJvdG90eXBlLnNldFVpbnQzMl1cbiAgICAgICAgY29uc3QgZmllbGRPZmZzZXQgPSBieXRlT2Zmc2V0XG4gICAgICAgIGRlc2MgPSB7XG4gICAgICAgICAgZ2V0KCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gbVswXS5jYWxsKGRhdGFWaWV3LCBzdHJ1Y3RWaWV3LmJ5dGVPZmZzZXQgKyBmaWVsZE9mZnNldCwgc3RydWN0Vmlldy5saXR0bGVFbmRpYW4pXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQodmFsdWU6IG51bWJlcikge1xuICAgICAgICAgICAgbVsxXS5jYWxsKGRhdGFWaWV3LCBzdHJ1Y3RWaWV3LmJ5dGVPZmZzZXQgKyBmaWVsZE9mZnNldCwgdmFsdWUsIHN0cnVjdFZpZXcubGl0dGxlRW5kaWFuKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGJ5dGVPZmZzZXQgKz0gc2l6ZXNbdHlwZV1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodHlwZSkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0eXBlWzBdID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnN0IGZpZWxkT2Zmc2V0ID0gYnl0ZU9mZnNldFxuICAgICAgICAgIGRlc2MgPSB7XG4gICAgICAgICAgICB2YWx1ZTogbmV3IFN0cnVjdExpbmVhclZpZXcoXG4gICAgICAgICAgICAgIHN0cnVjdFZpZXcsXG4gICAgICAgICAgICAgIHR5cGVbMF0sXG4gICAgICAgICAgICAgIGZpZWxkT2Zmc2V0LFxuICAgICAgICAgICAgICB0eXBlWzFdXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuICAgICAgICAgIGJ5dGVPZmZzZXQgKz0gZGVzYy52YWx1ZS5ieXRlTGVuZ3RoXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29uc3QgZmllbGRPZmZzZXQgPSBieXRlT2Zmc2V0XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBuZXcgU3RydWN0Q29sbGVjdGlvbihcbiAgICAgICAgICAgIHN0cnVjdFZpZXcsXG4gICAgICAgICAgICB0eXBlWzBdLFxuICAgICAgICAgICAgZmllbGRPZmZzZXQsXG4gICAgICAgICAgICB0eXBlWzFdXG4gICAgICAgICAgKVxuICAgICAgICAgIGRlc2MgPSB7IHZhbHVlIH1cbiAgICAgICAgICBieXRlT2Zmc2V0ICs9IHZhbHVlLmJ5dGVMZW5ndGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IGZpZWxkT2Zmc2V0ID0gYnl0ZU9mZnNldFxuICAgICAgICBjb25zdCB2YWx1ZSA9IHR5cGUoYXJyYXlCdWZmZXIsIGZpZWxkT2Zmc2V0KVxuICAgICAgICBkZXNjID0geyB2YWx1ZSB9XG4gICAgICAgIGJ5dGVPZmZzZXQgKz0gdmFsdWUuYnl0ZUxlbmd0aFxuICAgICAgfVxuXG4gICAgICBlbnRyaWVzLnB1c2goW2tleSwgZGVzY10pXG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoc3RydWN0VmlldywgT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMpKVxuXG4gICAgcmV0dXJuIHN0cnVjdFZpZXdcbiAgfVxuXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGZhY3RvcnksIHsgYnl0ZUxlbmd0aCwgdHlwZToge30gYXMgYW55IH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0KCkge1xuICAvLyBAZW52IGJyb3dzZXJcbiAgZGVzY3JpYmUoJ2RlZmluZVN0cnVjdCcsICgpID0+IHtcbiAgICBpdCgncGxhaW4gc3RydWN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgRm9vID0gZGVmaW5lU3RydWN0KHtcbiAgICAgICAgdTg6ICd1OCcsXG4gICAgICAgIGYzMl80OiBbJ2YzMicsIDRdLFxuICAgICAgfSlcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KDEyOClcbiAgICAgIGNvbnN0IGRhdGEgPSBuZXcgRGF0YVZpZXcoYnVmZmVyLmJ1ZmZlciwgMSlcbiAgICAgIGNvbnN0IGZvbyA9IEZvbyhidWZmZXIpXG4gICAgICBmb28udTggPSA0MlxuICAgICAgZm9vLmYzMl80LnNldCgwLCAxKVxuICAgICAgZm9vLmYzMl80LnNldCgxLCAyKVxuICAgICAgZm9vLmYzMl80LnNldCgyLCAzKVxuICAgICAgZXhwZWN0KGJ1ZmZlclswXSkudG9FcXVhbCg0MilcbiAgICAgIGV4cGVjdChmb28udTgpLnRvRXF1YWwoNDIpXG4gICAgICBleHBlY3QoZGF0YS5nZXRGbG9hdDMyKDAsIHRydWUpKS50b0VxdWFsKDEpXG4gICAgICBleHBlY3QoZGF0YS5nZXRGbG9hdDMyKDQsIHRydWUpKS50b0VxdWFsKDIpXG4gICAgICBleHBlY3QoZGF0YS5nZXRGbG9hdDMyKDgsIHRydWUpKS50b0VxdWFsKDMpXG4gICAgICBleHBlY3QoZm9vLmYzMl80LmdldCgwKSkudG9FcXVhbCgxKVxuICAgICAgZXhwZWN0KGZvby5mMzJfNC5nZXQoMSkpLnRvRXF1YWwoMilcbiAgICAgIGV4cGVjdChmb28uZjMyXzQuZ2V0KDIpKS50b0VxdWFsKDMpXG4gICAgfSlcblxuICAgIGZpdCgnbmVzdGVkIHN0cnVjdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IEJhciA9IGRlZmluZVN0cnVjdCh7XG4gICAgICAgIHUzMjogJ3UzMicsXG4gICAgICAgIHU4OiBbJ3U4JywgMl0sXG4gICAgICAgIGY2NF8yOiBbJ2Y2NCcsIDJdLFxuICAgICAgfSlcblxuICAgICAgY29uc3QgRm9vID0gZGVmaW5lU3RydWN0KHtcbiAgICAgICAgdTg6ICd1OCcsXG4gICAgICAgIGY2NDogJ2Y2NCcsXG4gICAgICAgIGYzMl80OiBbJ2YzMicsIDRdLFxuICAgICAgICBiYXI6IEJhcixcbiAgICAgICAgbWFueTogW0JhciwgMl1cbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KDEyOClcbiAgICAgIGNvbnN0IGRhdGEgPSBuZXcgRGF0YVZpZXcoYnVmZmVyLmJ1ZmZlcilcblxuICAgICAgY29uc3QgZm9vID0gRm9vKGJ1ZmZlcilcbiAgICAgIGZvby5iYXIudTMyID0gNDJcbiAgICAgIGZvby5tYW55LmF0KDApLnUzMiA9IDQyXG4gICAgICBmb28ubWFueS5hdCgxKS51MzIgPSA0MlxuICAgICAgZm9vLmY2NCA9IDEuMjM0XG5cbiAgICAgIGV4cGVjdChmb28uZjY0KS50b0VxdWFsKDEuMjM0KVxuICAgICAgZXhwZWN0KGZvby5iYXIudTMyKS50b0VxdWFsKDQyKVxuICAgICAgZXhwZWN0KGRhdGEuZ2V0VWludDMyKGZvby5iYXIuYnl0ZU9mZnNldCwgdHJ1ZSkpLnRvRXF1YWwoNDIpXG4gICAgICBleHBlY3QoZGF0YS5nZXRVaW50MzIoZm9vLm1hbnkuYnl0ZU9mZnNldCwgdHJ1ZSkpLnRvRXF1YWwoNDIpXG4gICAgICBleHBlY3QoZGF0YS5nZXRVaW50MzIoZm9vLm1hbnkuYnl0ZU9mZnNldCArIGZvby5tYW55LmZhY3RvcnkuYnl0ZUxlbmd0aCwgdHJ1ZSkpLnRvRXF1YWwoNDIpXG4gICAgICBleHBlY3QoZGF0YS5nZXRGbG9hdDY0KGZvby5ieXRlT2Zmc2V0ICsgMSwgdHJ1ZSkpLnRvRXF1YWwoMS4yMzQpXG4gICAgfSlcbiAgfSlcblxuICB4ZGVzY3JpYmUoJ3VpbnQzMiBvciBkYXRhdmlldycsICgpID0+IHtcbiAgICBpdCgnY29tcGFyZSBVaW50OCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGxlbmd0aCA9IDIwNDhcbiAgICAgIGNvbnN0IGEgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gICAgICBjb25zdCBiID0gbmV3IERhdGFWaWV3KGEuYnVmZmVyKVxuICAgICAgY29uc3QgY291bnQgPSA1MDBfMDAwXzAwMFxuICAgICAgZm9yIChsZXQgeiA9IDA7IHogPCA1OyB6KyspIHtcbiAgICAgICAgY29uc29sZS50aW1lKCdVaW50OEFycmF5JylcbiAgICAgICAge1xuICAgICAgICAgIGxldCB2YWwgPSAwXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICB2YWwgKz0gYVtpICUgbGVuZ3RoXSFcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdVaW50OEFycmF5JylcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgY29uc29sZS50aW1lKCdEYXRhVmlldycpXG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgdmFsID0gMFxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFsICs9IGIuZ2V0VWludDgoaSAlIGxlbmd0aClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdEYXRhVmlldycpXG4gICAgICAgIGF3YWl0IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGl0KCdjb21wYXJlIFVpbnQzMicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGxlbmd0aCA9IDIwNDhcbiAgICAgIGNvbnN0IGxlbmd0aDMyID0gMjA0OCA8PCAyXG4gICAgICBjb25zdCBhID0gbmV3IFVpbnQzMkFycmF5KGxlbmd0aClcbiAgICAgIGNvbnN0IGIgPSBuZXcgRGF0YVZpZXcoYS5idWZmZXIpXG4gICAgICBjb25zdCBjb3VudCA9IDUwMF8wMDBfMDAwXG4gICAgICBjb25zdCBjb3VudDMyID0gY291bnQgPDwgMlxuICAgICAgZm9yIChsZXQgeiA9IDA7IHogPCAxMDsgeisrKSB7XG4gICAgICAgIGNvbnNvbGUudGltZSgnVWludDMyQXJyYXknKVxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHZhbCA9IDBcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHZhbCArPSBhW2kgJSBsZW5ndGhdIVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ1VpbnQzMkFycmF5JylcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgY29uc29sZS50aW1lKCdEYXRhVmlldycpXG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgdmFsID0gMFxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQzMjsgaSArPSA0KSB7XG4gICAgICAgICAgICB2YWwgKz0gYi5nZXRVaW50MzIoaSAlIGxlbmd0aDMyLCB0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0RhdGFWaWV3JylcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaXQoJ3NldHRlcnMgVWludDMyQXJyYXknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBsZW5ndGggPSAyMDQ4XG4gICAgICBjb25zdCBhID0gbmV3IFVpbnQzMkFycmF5KGxlbmd0aClcbiAgICAgIGNvbnN0IGNvdW50ID0gNTAwXzAwMF8wMDBcbiAgICAgIGZvciAobGV0IHogPSAwOyB6IDwgNTsgeisrKSB7XG4gICAgICAgIGNvbnNvbGUudGltZSgnc2V0IFVpbnQzMkFycmF5JylcbiAgICAgICAge1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgYVtpICUgbGVuZ3RoXSA9IGlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdzZXQgVWludDMyQXJyYXknKVxuICAgICAgICBhd2FpdCBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCB6ID0gMDsgeiA8IDU7IHorKykge1xuICAgICAgICBjb25zb2xlLnRpbWUoJ2dldCBVaW50MzJBcnJheScpXG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgdmFsID0gMFxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFsICs9IGFbaSAlIGxlbmd0aF0hXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgnZ2V0IFVpbnQzMkFycmF5JylcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaXQoJ3NldHRlcnMgRGF0YVZpZXcgVWludDMyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbGVuZ3RoID0gMjA0OFxuICAgICAgY29uc3QgbGVuZ3RoMzIgPSBsZW5ndGggPDwgMlxuICAgICAgY29uc3QgYSA9IG5ldyBEYXRhVmlldyhuZXcgVWludDMyQXJyYXkobGVuZ3RoKS5idWZmZXIpXG4gICAgICBjb25zdCBjb3VudCA9IDUwMF8wMDBfMDAwXG4gICAgICBjb25zdCBjb3VudDMyID0gY291bnQgPDwgMlxuICAgICAgZm9yIChsZXQgeiA9IDA7IHogPCAxMDsgeisrKSB7XG4gICAgICAgIGNvbnNvbGUudGltZSgnc2V0IFVpbnQzMicpXG4gICAgICAgIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50MzI7IGkgKz0gNCkge1xuICAgICAgICAgICAgYS5zZXRVaW50MzIoaSAlIGxlbmd0aDMyLCBpLCB0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ3NldCBVaW50MzInKVxuICAgICAgICBhd2FpdCBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCB6ID0gMDsgeiA8IDEwOyB6KyspIHtcbiAgICAgICAgY29uc29sZS50aW1lKCdnZXQgVWludDMyJylcbiAgICAgICAge1xuICAgICAgICAgIGxldCB2YWwgPSAwXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDMyOyBpICs9IDQpIHtcbiAgICAgICAgICAgIHZhbCArPSBhLmdldFVpbnQzMihpICUgbGVuZ3RoMzIsIHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgnZ2V0IFVpbnQzMicpXG4gICAgICAgIGF3YWl0IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICB9XG4gICAgfSlcbiAgfSlcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gdW5pdGVyaWZ5PFQsIFU+KGZuOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VT4sIGl0OiAodjogVSkgPT4gVCkge1xuICByZXR1cm4gYXN5bmMgZnVuY3Rpb24qICgpIHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHYgb2YgZm4pIHtcbiAgICAgIHlpZWxkIGl0KHYgYXMgVSlcbiAgICB9XG4gIH1cbn1cbiIsICJleHBvcnQgY29uc3QgdmFsaWRhdGVUeXBlID0gT2JqZWN0LmFzc2lnbihmdW5jdGlvbiB2YWxpZGF0ZVR5cGU8VD4ob2JqOiBUKTogVCB7XG4gIHJldHVybiBvYmpcbn0sIHtcbiAgYXNzaWduYWJsZTogZnVuY3Rpb24gYXNzaWduYWJsZTxUPihvYmo6IFBhcnRpYWw8VD4pOiBQYXJ0aWFsPFQ+IHtcbiAgICByZXR1cm4gb2JqXG4gIH1cbn0pXG4iLCAiaW1wb3J0IHsgTWlzc2luZ0RlcGVuZGVuY3lFcnJvclN5bWJvbCwgcmVxdWlyZWQsIHJlcXVpcmVkRmFzdCwgTm9uTnVsbCB9IGZyb20gJ3V0aWxzJ1xuXG5mdW5jdGlvbiBjeWNsZURldGVjdGVkKCk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiQ3ljbGUgZGV0ZWN0ZWRcIik7XG59XG5mdW5jdGlvbiBtdXRhdGlvbkRldGVjdGVkKCk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiQ29tcHV0ZWQgY2Fubm90IGhhdmUgc2lkZS1lZmZlY3RzXCIpO1xufVxuXG5leHBvcnQgY29uc3QgX19zaWduYWxfXyA9IFN5bWJvbC5mb3IoJ3ByZWFjdC1zaWduYWxzJylcblxuLy8gRmxhZ3MgZm9yIENvbXB1dGVkIGFuZCBFZmZlY3QuXG5jb25zdCBSVU5OSU5HID0gMSA8PCAwO1xuY29uc3QgTk9USUZJRUQgPSAxIDw8IDE7XG5jb25zdCBPVVREQVRFRCA9IDEgPDwgMjtcbmNvbnN0IERJU1BPU0VEID0gMSA8PCAzO1xuY29uc3QgSEFTX0VSUk9SID0gMSA8PCA0O1xuY29uc3QgVFJBQ0tJTkcgPSAxIDw8IDU7XG5cbmxldCBwb3M6IGFueVxuXG5jb25zdCBFRkZFQ1QgPSAxXG5jb25zdCBCQVRDSCA9IDJcblxuY29uc3QgaWdub3JlZCA9IFtdXG5cbi8vIEEgbGlua2VkIGxpc3Qgbm9kZSB1c2VkIHRvIHRyYWNrIGRlcGVuZGVuY2llcyAoc291cmNlcykgYW5kIGRlcGVuZGVudHMgKHRhcmdldHMpLlxuLy8gQWxzbyB1c2VkIHRvIHJlbWVtYmVyIHRoZSBzb3VyY2UncyBsYXN0IHZlcnNpb24gbnVtYmVyIHRoYXQgdGhlIHRhcmdldCBzYXcuXG50eXBlIE5vZGUgPSB7XG4gIC8vIEEgc291cmNlIHdob3NlIHZhbHVlIHRoZSB0YXJnZXQgZGVwZW5kcyBvbi5cbiAgX3NvdXJjZTogU2lnbmFsO1xuICBfcHJldlNvdXJjZT86IE5vZGU7XG4gIF9uZXh0U291cmNlPzogTm9kZTtcblxuICAvLyBBIHRhcmdldCB0aGF0IGRlcGVuZHMgb24gdGhlIHNvdXJjZSBhbmQgc2hvdWxkIGJlIG5vdGlmaWVkIHdoZW4gdGhlIHNvdXJjZSBjaGFuZ2VzLlxuICBfdGFyZ2V0OiBDb21wdXRlZCB8IEVmZmVjdDtcbiAgX3ByZXZUYXJnZXQ/OiBOb2RlO1xuICBfbmV4dFRhcmdldD86IE5vZGU7XG5cbiAgLy8gVGhlIHZlcnNpb24gbnVtYmVyIG9mIHRoZSBzb3VyY2UgdGhhdCB0YXJnZXQgaGFzIGxhc3Qgc2Vlbi4gV2UgdXNlIHZlcnNpb24gbnVtYmVyc1xuICAvLyBpbnN0ZWFkIG9mIHN0b3JpbmcgdGhlIHNvdXJjZSB2YWx1ZSwgYmVjYXVzZSBzb3VyY2UgdmFsdWVzIGNhbiB0YWtlIGFyYml0cmFyeSBhbW91bnRcbiAgLy8gb2YgbWVtb3J5LCBhbmQgY29tcHV0ZWRzIGNvdWxkIGhhbmcgb24gdG8gdGhlbSBmb3JldmVyIGJlY2F1c2UgdGhleSdyZSBsYXppbHkgZXZhbHVhdGVkLlxuICAvLyBVc2UgdGhlIHNwZWNpYWwgdmFsdWUgLTEgdG8gbWFyayBwb3RlbnRpYWxseSB1bnVzZWQgYnV0IHJlY3ljbGFibGUgbm9kZXMuXG4gIF92ZXJzaW9uOiBudW1iZXI7XG5cbiAgLy8gVXNlZCB0byByZW1lbWJlciAmIHJvbGwgYmFjayB0aGUgc291cmNlJ3MgcHJldmlvdXMgYC5fbm9kZWAgdmFsdWUgd2hlbiBlbnRlcmluZyAmXG4gIC8vIGV4aXRpbmcgYSBuZXcgZXZhbHVhdGlvbiBjb250ZXh0LlxuICBfcm9sbGJhY2tOb2RlPzogTm9kZTtcbn07XG5cbmZ1bmN0aW9uIHN0YXJ0QmF0Y2goKSB7XG4gIGJhdGNoRGVwdGgrKztcbn1cblxuZnVuY3Rpb24gZW5kQmF0Y2goZm9yY2U/OiBib29sZWFuKSB7XG4gIGlmIChiYXRjaERlcHRoID4gMSAmJiAhZm9yY2UpIHtcbiAgICBiYXRjaERlcHRoLS07XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IGVycm9yOiB1bmtub3duO1xuICBsZXQgaGFzRXJyb3IgPSBmYWxzZTtcblxuICB3aGlsZSAoYmF0Y2hlZEVmZmVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbGV0IGVmZmVjdDogRWZmZWN0IHwgdW5kZWZpbmVkID0gYmF0Y2hlZEVmZmVjdDtcbiAgICBiYXRjaGVkRWZmZWN0ID0gdW5kZWZpbmVkO1xuXG4gICAgYmF0Y2hJdGVyYXRpb24rKztcblxuICAgIHdoaWxlIChlZmZlY3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV4dDogRWZmZWN0IHwgdW5kZWZpbmVkID0gZWZmZWN0Ll9uZXh0QmF0Y2hlZEVmZmVjdDtcbiAgICAgIGVmZmVjdC5fbmV4dEJhdGNoZWRFZmZlY3QgPSB1bmRlZmluZWQ7XG4gICAgICBlZmZlY3QuX2ZsYWdzICY9IH5OT1RJRklFRDtcblxuICAgICAgaWYgKCEoZWZmZWN0Ll9mbGFncyAmIERJU1BPU0VEKSAmJiBuZWVkc1RvUmVjb21wdXRlKGVmZmVjdCkpIHtcbiAgICAgICAgY29uc3QgcHJldlBvcyA9IHBvc1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHBvcyA9IEVGRkVDVFxuICAgICAgICAgIGVmZmVjdC5fY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgaWYgKCFoYXNFcnJvcikge1xuICAgICAgICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICAgICAgICBoYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBvcyA9IHByZXZQb3NcbiAgICAgIH1cbiAgICAgIGVmZmVjdCA9IG5leHQ7XG4gICAgfVxuICB9XG5cbiAgYmF0Y2hJdGVyYXRpb24gPSAwO1xuXG4gIGlmICghZm9yY2UpIHtcbiAgICBiYXRjaERlcHRoLS07XG4gIH1cblxuICBpZiAoaGFzRXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYmF0Y2g8VD4oY2FsbGJhY2s6ICgpID0+IFQsIHRoaXNBcmc/OiBhbnksIGFyZ3M/OiBhbnlbXSk6IFQge1xuICBjb25zdCBwcmV2UG9zID0gcG9zXG4gIGlmIChiYXRjaERlcHRoID4gMCkge1xuICAgIHRyeSB7XG4gICAgICBwb3MgPSBCQVRDSFxuICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgIHBvcyA9IHByZXZQb3NcbiAgICB9XG4gIH1cblx0LypAX19JTkxJTkVfXyoqLyBzdGFydEJhdGNoKCk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICB9XG4gIGZpbmFsbHkge1xuICAgIHBvcyA9IHByZXZQb3NcbiAgICBlbmRCYXRjaCgpO1xuICB9XG59XG5cbi8vIEN1cnJlbnRseSBldmFsdWF0ZWQgY29tcHV0ZWQgb3IgZWZmZWN0LlxubGV0IGV2YWxDb250ZXh0OiBDb21wdXRlZCB8IEVmZmVjdCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxubGV0IHVudHJhY2tlZERlcHRoID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIHVudHJhY2tlZDxUPihjYWxsYmFjazogKCkgPT4gVCk6IFQge1xuICBpZiAodW50cmFja2VkRGVwdGggPiAwKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gIH1cbiAgY29uc3QgcHJldkNvbnRleHQgPSBldmFsQ29udGV4dDtcbiAgZXZhbENvbnRleHQgPSB1bmRlZmluZWQ7XG4gIHVudHJhY2tlZERlcHRoKys7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gIH1cbiAgZmluYWxseSB7XG4gICAgdW50cmFja2VkRGVwdGgtLTtcbiAgICBldmFsQ29udGV4dCA9IHByZXZDb250ZXh0O1xuICB9XG59XG5cbi8vIEVmZmVjdHMgY29sbGVjdGVkIGludG8gYSBiYXRjaC5cbmxldCBiYXRjaGVkRWZmZWN0OiBFZmZlY3QgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5sZXQgYmF0Y2hEZXB0aCA9IDA7XG5sZXQgYmF0Y2hJdGVyYXRpb24gPSAwO1xuXG4vLyBBIGdsb2JhbCB2ZXJzaW9uIG51bWJlciBmb3Igc2lnbmFscywgdXNlZCBmb3IgZmFzdC1wYXRoaW5nIHJlcGVhdGVkXG4vLyBjb21wdXRlZC5wZWVrKCkvY29tcHV0ZWQudmFsdWUgY2FsbHMgd2hlbiBub3RoaW5nIGhhcyBjaGFuZ2VkIGdsb2JhbGx5LlxubGV0IGdsb2JhbFZlcnNpb24gPSAwO1xuXG5mdW5jdGlvbiBhZGREZXBlbmRlbmN5KHNpZ25hbDogU2lnbmFsKTogTm9kZSB8IHVuZGVmaW5lZCB7XG4gIGlmIChldmFsQ29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGxldCBub2RlID0gc2lnbmFsLl9ub2RlO1xuICBpZiAobm9kZSA9PT0gdW5kZWZpbmVkIHx8IG5vZGUuX3RhcmdldCAhPT0gZXZhbENvbnRleHQpIHtcbiAgICAvKipcbiAgICAgKiBgc2lnbmFsYCBpcyBhIG5ldyBkZXBlbmRlbmN5LiBDcmVhdGUgYSBuZXcgZGVwZW5kZW5jeSBub2RlLCBhbmQgc2V0IGl0XG4gICAgICogYXMgdGhlIHRhaWwgb2YgdGhlIGN1cnJlbnQgY29udGV4dCdzIGRlcGVuZGVuY3kgbGlzdC4gZS5nOlxuICAgICAqXG4gICAgICogeyBBIDwtPiBCICAgICAgIH1cbiAgICAgKiAgICAgICAgIFx1MjE5MSAgICAgXHUyMTkxXG4gICAgICogICAgICAgIHRhaWwgIG5vZGUgKG5ldylcbiAgICAgKiAgICAgICAgICAgICAgIFx1MjE5M1xuICAgICAqIHsgQSA8LT4gQiA8LT4gQyB9XG4gICAgICogICAgICAgICAgICAgICBcdTIxOTFcbiAgICAgKiAgICAgICAgICAgICAgdGFpbCAoZXZhbENvbnRleHQuX3NvdXJjZXMpXG4gICAgICovXG4gICAgbm9kZSA9IHtcbiAgICAgIF92ZXJzaW9uOiAwLFxuICAgICAgX3NvdXJjZTogc2lnbmFsLFxuICAgICAgX3ByZXZTb3VyY2U6IGV2YWxDb250ZXh0Ll9zb3VyY2VzLFxuICAgICAgX25leHRTb3VyY2U6IHVuZGVmaW5lZCxcbiAgICAgIF90YXJnZXQ6IGV2YWxDb250ZXh0LFxuICAgICAgX3ByZXZUYXJnZXQ6IHVuZGVmaW5lZCxcbiAgICAgIF9uZXh0VGFyZ2V0OiB1bmRlZmluZWQsXG4gICAgICBfcm9sbGJhY2tOb2RlOiBub2RlLFxuICAgIH07XG5cbiAgICBpZiAoZXZhbENvbnRleHQuX3NvdXJjZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZXZhbENvbnRleHQuX3NvdXJjZXMuX25leHRTb3VyY2UgPSBub2RlO1xuICAgIH1cbiAgICBldmFsQ29udGV4dC5fc291cmNlcyA9IG5vZGU7XG4gICAgc2lnbmFsLl9ub2RlID0gbm9kZTtcblxuICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2Ugbm90aWZpY2F0aW9ucyBmcm9tIHRoaXMgZGVwZW5kZW5jeSBpZiB3ZSdyZSBpbiBhbiBlZmZlY3RcbiAgICAvLyBPUiBldmFsdWF0aW5nIGEgY29tcHV0ZWQgc2lnbmFsIHRoYXQgaW4gdHVybiBoYXMgc3Vic2NyaWJlcnMuXG4gICAgaWYgKGV2YWxDb250ZXh0Ll9mbGFncyAmIFRSQUNLSU5HKSB7XG4gICAgICBzaWduYWwuX3N1YnNjcmliZShub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH0gZWxzZSBpZiAobm9kZS5fdmVyc2lvbiA9PT0gLTEpIHtcbiAgICAvLyBgc2lnbmFsYCBpcyBhbiBleGlzdGluZyBkZXBlbmRlbmN5IGZyb20gYSBwcmV2aW91cyBldmFsdWF0aW9uLiBSZXVzZSBpdC5cbiAgICBub2RlLl92ZXJzaW9uID0gMDtcblxuICAgIC8qKlxuICAgICAqIElmIGBub2RlYCBpcyBub3QgYWxyZWFkeSB0aGUgY3VycmVudCB0YWlsIG9mIHRoZSBkZXBlbmRlbmN5IGxpc3QgKGkuZS5cbiAgICAgKiB0aGVyZSBpcyBhIG5leHQgbm9kZSBpbiB0aGUgbGlzdCksIHRoZW4gbWFrZSB0aGUgYG5vZGVgIHRoZSBuZXcgdGFpbC4gZS5nOlxuICAgICAqXG4gICAgICogeyBBIDwtPiBCIDwtPiBDIDwtPiBEIH1cbiAgICAgKiAgICAgICAgIFx1MjE5MSAgICAgICAgICAgXHUyMTkxXG4gICAgICogICAgICAgIG5vZGUgICBcdTI1MENcdTI1MDBcdTI1MDBcdTI1MDAgdGFpbCAoZXZhbENvbnRleHQuX3NvdXJjZXMpXG4gICAgICogICAgICAgICBcdTI1MTRcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDJcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MTBcbiAgICAgKiAgICAgICAgICAgICAgIFx1MjE5MyAgICAgXHUyMTkzXG4gICAgICogeyBBIDwtPiBDIDwtPiBEIDwtPiBCIH1cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgIFx1MjE5MVxuICAgICAqICAgICAgICAgICAgICAgICAgICB0YWlsIChldmFsQ29udGV4dC5fc291cmNlcylcbiAgICAgKi9cbiAgICBpZiAobm9kZS5fbmV4dFNvdXJjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBub2RlLl9uZXh0U291cmNlLl9wcmV2U291cmNlID0gbm9kZS5fcHJldlNvdXJjZTtcblxuICAgICAgaWYgKG5vZGUuX3ByZXZTb3VyY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub2RlLl9wcmV2U291cmNlLl9uZXh0U291cmNlID0gbm9kZS5fbmV4dFNvdXJjZTtcbiAgICAgIH1cblxuICAgICAgbm9kZS5fcHJldlNvdXJjZSA9IGV2YWxDb250ZXh0Ll9zb3VyY2VzO1xuICAgICAgbm9kZS5fbmV4dFNvdXJjZSA9IHVuZGVmaW5lZDtcblxuICAgICAgZXZhbENvbnRleHQuX3NvdXJjZXMhLl9uZXh0U291cmNlID0gbm9kZTtcbiAgICAgIGV2YWxDb250ZXh0Ll9zb3VyY2VzID0gbm9kZTtcbiAgICB9XG5cbiAgICAvLyBXZSBjYW4gYXNzdW1lIHRoYXQgdGhlIGN1cnJlbnRseSBldmFsdWF0ZWQgZWZmZWN0IC8gY29tcHV0ZWQgc2lnbmFsIGlzIGFscmVhZHlcbiAgICAvLyBzdWJzY3JpYmVkIHRvIGNoYW5nZSBub3RpZmljYXRpb25zIGZyb20gYHNpZ25hbGAgaWYgbmVlZGVkLlxuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8vIEB0cy1pZ25vcmUgaW50ZXJuYWwgU2lnbmFsIGlzIHZpZXdlZCBhcyBhIGZ1bmN0aW9uXG5leHBvcnQgZGVjbGFyZSBjbGFzcyBTaWduYWw8VCA9IGFueT4ge1xuICAvKiogQGludGVybmFsICovXG4gIF92YWx1ZTogdW5rbm93bjtcblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIFZlcnNpb24gbnVtYmVycyBzaG91bGQgYWx3YXlzIGJlID49IDAsIGJlY2F1c2UgdGhlIHNwZWNpYWwgdmFsdWUgLTEgaXMgdXNlZFxuICAgKiBieSBOb2RlcyB0byBzaWduaWZ5IHBvdGVudGlhbGx5IHVudXNlZCBidXQgcmVjeWNsYWJsZSBub2Rlcy5cbiAgICovXG4gIF92ZXJzaW9uOiBudW1iZXI7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbm9kZT86IE5vZGU7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdGFyZ2V0cz86IE5vZGU7XG5cbiAgY29uc3RydWN0b3IodmFsdWU/OiBUKTtcblxuICAvKiogQGludGVybmFsICovXG4gIF9yZWZyZXNoKCk6IGJvb2xlYW47XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfc3Vic2NyaWJlKG5vZGU6IE5vZGUpOiB2b2lkO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3Vuc3Vic2NyaWJlKG5vZGU6IE5vZGUpOiB2b2lkO1xuXG4gIHN1YnNjcmliZShmbjogKHZhbHVlOiBUKSA9PiB2b2lkKTogKCkgPT4gdm9pZDtcblxuICB2YWx1ZU9mKCk6IFQ7XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nO1xuXG4gIHRvSlNPTigpOiBUO1xuXG4gIHBlZWsoKTogVDtcblxuICBnZXQoKTogVDtcbiAgc2V0KHZhbHVlOiBUKTogdm9pZFxuXG4gIFtfX3NpZ25hbF9fXTogdHJ1ZVxuXG4gIGdldCB2YWx1ZSgpOiBUO1xuICBzZXQgdmFsdWUodmFsdWU6IFQpO1xufVxuXG4vKiogQGludGVybmFsICovXG4vLyBAdHMtaWdub3JlIGludGVybmFsIFNpZ25hbCBpcyB2aWV3ZWQgYXMgZnVuY3Rpb25cblxuZXhwb3J0IGZ1bmN0aW9uIFNpZ25hbCh0aGlzOiBTaWduYWwsIHZhbHVlPzogdW5rbm93bikge1xuICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB0aGlzLl92ZXJzaW9uID0gMDtcbiAgdGhpcy5fbm9kZSA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fdGFyZ2V0cyA9IHVuZGVmaW5lZDtcbn1cblxuU2lnbmFsLnByb3RvdHlwZVtfX3NpZ25hbF9fXSA9IHRydWVcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNpZ25hbC5wcm90b3R5cGUsICd2YWx1ZScsIHtcbiAgZW51bWVyYWJsZTogZmFsc2UsXG4gIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gIGdldCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoKVxuICB9LFxuICBzZXQodikge1xuICAgIHRoaXMuc2V0KHYpXG4gIH1cbn0pXG5cblNpZ25hbC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICBjb25zdCBub2RlID0gYWRkRGVwZW5kZW5jeSh0aGlzKTtcbiAgaWYgKG5vZGUgIT09IHVuZGVmaW5lZCkge1xuICAgIG5vZGUuX3ZlcnNpb24gPSB0aGlzLl92ZXJzaW9uO1xuICB9XG4gIHJldHVybiB0aGlzLl92YWx1ZTtcbn1cblxuU2lnbmFsLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaWYgKGV2YWxDb250ZXh0IGluc3RhbmNlb2YgQ29tcHV0ZWQpIHtcbiAgICBtdXRhdGlvbkRldGVjdGVkKCk7XG4gIH1cblxuICBpZiAodmFsdWUgIT09IHRoaXMuX3ZhbHVlKSB7XG4gICAgaWYgKGJhdGNoSXRlcmF0aW9uID4gMTAwKSB7XG4gICAgICBjeWNsZURldGVjdGVkKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLl92ZXJzaW9uKys7XG4gICAgZ2xvYmFsVmVyc2lvbisrO1xuXG4gICAgLyoqQF9fSU5MSU5FX18qLyBzdGFydEJhdGNoKCk7XG4gICAgdHJ5IHtcbiAgICAgIGZvciAoXG4gICAgICAgIGxldCBub2RlID0gdGhpcy5fdGFyZ2V0cztcbiAgICAgICAgbm9kZSAhPT0gdW5kZWZpbmVkO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dFRhcmdldFxuICAgICAgKSB7XG4gICAgICAgIG5vZGUuX3RhcmdldC5fbm90aWZ5KCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgZW5kQmF0Y2goKTtcbiAgICB9XG4gIH1cbn1cblxuU2lnbmFsLnByb3RvdHlwZS5fcmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG5TaWduYWwucHJvdG90eXBlLl9zdWJzY3JpYmUgPSBmdW5jdGlvbiAobm9kZSkge1xuICBpZiAodGhpcy5fdGFyZ2V0cyAhPT0gbm9kZSAmJiBub2RlLl9wcmV2VGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBub2RlLl9uZXh0VGFyZ2V0ID0gdGhpcy5fdGFyZ2V0cztcbiAgICBpZiAodGhpcy5fdGFyZ2V0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl90YXJnZXRzLl9wcmV2VGFyZ2V0ID0gbm9kZTtcbiAgICB9XG4gICAgdGhpcy5fdGFyZ2V0cyA9IG5vZGU7XG4gIH1cbn07XG5cblNpZ25hbC5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgLy8gT25seSBydW4gdGhlIHVuc3Vic2NyaWJlIHN0ZXAgaWYgdGhlIHNpZ25hbCBoYXMgYW55IHN1YnNjcmliZXJzIHRvIGJlZ2luIHdpdGguXG4gIGlmICh0aGlzLl90YXJnZXRzICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCBwcmV2ID0gbm9kZS5fcHJldlRhcmdldDtcbiAgICBjb25zdCBuZXh0ID0gbm9kZS5fbmV4dFRhcmdldDtcbiAgICBpZiAocHJldiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwcmV2Ll9uZXh0VGFyZ2V0ID0gbmV4dDtcbiAgICAgIG5vZGUuX3ByZXZUYXJnZXQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG5leHQuX3ByZXZUYXJnZXQgPSBwcmV2O1xuICAgICAgbm9kZS5fbmV4dFRhcmdldCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKG5vZGUgPT09IHRoaXMuX3RhcmdldHMpIHtcbiAgICAgIHRoaXMuX3RhcmdldHMgPSBuZXh0O1xuICAgIH1cbiAgfVxufTtcblxuU2lnbmFsLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgY29uc3Qgc2lnbmFsID0gdGhpcztcbiAgcmV0dXJuIGVmZmVjdChmdW5jdGlvbiAodGhpczogRWZmZWN0KSB7XG4gICAgY29uc3QgdmFsdWUgPSBzaWduYWwudmFsdWU7XG4gICAgY29uc3QgZmxhZyA9IHRoaXMuX2ZsYWdzICYgVFJBQ0tJTkc7XG4gICAgdGhpcy5fZmxhZ3MgJj0gflRSQUNLSU5HO1xuICAgIHRyeSB7XG4gICAgICBmbih2YWx1ZSk7XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgdGhpcy5fZmxhZ3MgfD0gZmxhZztcbiAgICB9XG4gIH0sIHRoaXMpO1xufTtcblxuU2lnbmFsLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy52YWx1ZTtcbn07XG5cblNpZ25hbC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlICsgXCJcIjtcbn07XG5cblNpZ25hbC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy52YWx1ZTtcbn07XG5cblNpZ25hbC5wcm90b3R5cGUucGVlayA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25hbDxUPih2YWx1ZTogVCk6IFNpZ25hbDxUPiB7XG4gIHJldHVybiBuZXcgU2lnbmFsKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbmVlZHNUb1JlY29tcHV0ZSh0YXJnZXQ6IENvbXB1dGVkIHwgRWZmZWN0KTogYm9vbGVhbiB7XG4gIC8vIENoZWNrIHRoZSBkZXBlbmRlbmNpZXMgZm9yIGNoYW5nZWQgdmFsdWVzLiBUaGUgZGVwZW5kZW5jeSBsaXN0IGlzIGFscmVhZHlcbiAgLy8gaW4gb3JkZXIgb2YgdXNlLiBUaGVyZWZvcmUgaWYgbXVsdGlwbGUgZGVwZW5kZW5jaWVzIGhhdmUgY2hhbmdlZCB2YWx1ZXMsIG9ubHlcbiAgLy8gdGhlIGZpcnN0IHVzZWQgZGVwZW5kZW5jeSBpcyByZS1ldmFsdWF0ZWQgYXQgdGhpcyBwb2ludC5cbiAgZm9yIChcbiAgICBsZXQgbm9kZSA9IHRhcmdldC5fc291cmNlcztcbiAgICBub2RlICE9PSB1bmRlZmluZWQ7XG4gICAgbm9kZSA9IG5vZGUuX25leHRTb3VyY2VcbiAgKSB7XG4gICAgLy8gSWYgdGhlcmUncyBhIG5ldyB2ZXJzaW9uIG9mIHRoZSBkZXBlbmRlbmN5IGJlZm9yZSBvciBhZnRlciByZWZyZXNoaW5nLFxuICAgIC8vIG9yIHRoZSBkZXBlbmRlbmN5IGhhcyBzb21ldGhpbmcgYmxvY2tpbmcgaXQgZnJvbSByZWZyZXNoaW5nIGF0IGFsbCAoZS5nLiBhXG4gICAgLy8gZGVwZW5kZW5jeSBjeWNsZSksIHRoZW4gd2UgbmVlZCB0byByZWNvbXB1dGUuXG4gICAgaWYgKFxuICAgICAgbm9kZS5fc291cmNlLl92ZXJzaW9uICE9PSBub2RlLl92ZXJzaW9uIHx8XG4gICAgICAhbm9kZS5fc291cmNlLl9yZWZyZXNoKCkgfHxcbiAgICAgIG5vZGUuX3NvdXJjZS5fdmVyc2lvbiAhPT0gbm9kZS5fdmVyc2lvblxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIC8vIElmIG5vbmUgb2YgdGhlIGRlcGVuZGVuY2llcyBoYXZlIGNoYW5nZWQgdmFsdWVzIHNpbmNlIGxhc3QgcmVjb21wdXRlIHRoZW5cbiAgLy8gdGhlcmUncyBubyBuZWVkIHRvIHJlY29tcHV0ZS5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlU291cmNlcyh0YXJnZXQ6IENvbXB1dGVkIHwgRWZmZWN0KSB7XG4gIC8qKlxuICAgKiAxLiBNYXJrIGFsbCBjdXJyZW50IHNvdXJjZXMgYXMgcmUtdXNhYmxlIG5vZGVzICh2ZXJzaW9uOiAtMSlcbiAgICogMi4gU2V0IGEgcm9sbGJhY2sgbm9kZSBpZiB0aGUgY3VycmVudCBub2RlIGlzIGJlaW5nIHVzZWQgaW4gYSBkaWZmZXJlbnQgY29udGV4dFxuICAgKiAzLiBQb2ludCAndGFyZ2V0Ll9zb3VyY2VzJyB0byB0aGUgdGFpbCBvZiB0aGUgZG91Ymx5LWxpbmtlZCBsaXN0LCBlLmc6XG4gICAqXG4gICAqICAgIHsgdW5kZWZpbmVkIDwtIEEgPC0+IEIgPC0+IEMgLT4gdW5kZWZpbmVkIH1cbiAgICogICAgICAgICAgICAgICAgICAgXHUyMTkxICAgICAgICAgICBcdTIxOTFcbiAgICogICAgICAgICAgICAgICAgICAgXHUyNTAyICAgICAgICAgICBcdTI1MTRcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MTBcbiAgICogdGFyZ2V0Ll9zb3VyY2VzID0gQTsgKG5vZGUgaXMgaGVhZCkgIFx1MjUwMlxuICAgKiAgICAgICAgICAgICAgICAgICBcdTIxOTMgICAgICAgICAgICAgICAgICBcdTI1MDJcbiAgICogdGFyZ2V0Ll9zb3VyY2VzID0gQzsgKG5vZGUgaXMgdGFpbCkgXHUyNTAwXHUyNTE4XG4gICAqL1xuICBmb3IgKFxuICAgIGxldCBub2RlID0gdGFyZ2V0Ll9zb3VyY2VzO1xuICAgIG5vZGUgIT09IHVuZGVmaW5lZDtcbiAgICBub2RlID0gbm9kZS5fbmV4dFNvdXJjZVxuICApIHtcbiAgICBjb25zdCByb2xsYmFja05vZGUgPSBub2RlLl9zb3VyY2UuX25vZGU7XG4gICAgaWYgKHJvbGxiYWNrTm9kZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBub2RlLl9yb2xsYmFja05vZGUgPSByb2xsYmFja05vZGU7XG4gICAgfVxuICAgIG5vZGUuX3NvdXJjZS5fbm9kZSA9IG5vZGU7XG4gICAgbm9kZS5fdmVyc2lvbiA9IC0xO1xuXG4gICAgaWYgKG5vZGUuX25leHRTb3VyY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFyZ2V0Ll9zb3VyY2VzID0gbm9kZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjbGVhbnVwU291cmNlcyh0YXJnZXQ6IENvbXB1dGVkIHwgRWZmZWN0KSB7XG4gIGxldCBub2RlID0gdGFyZ2V0Ll9zb3VyY2VzO1xuICBsZXQgaGVhZDogTm9kZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogQXQgdGhpcyBwb2ludCAndGFyZ2V0Ll9zb3VyY2VzJyBwb2ludHMgdG8gdGhlIHRhaWwgb2YgdGhlIGRvdWJseS1saW5rZWQgbGlzdC5cbiAgICogSXQgY29udGFpbnMgYWxsIGV4aXN0aW5nIHNvdXJjZXMgKyBuZXcgc291cmNlcyBpbiBvcmRlciBvZiB1c2UuXG4gICAqIEl0ZXJhdGUgYmFja3dhcmRzIHVudGlsIHdlIGZpbmQgdGhlIGhlYWQgbm9kZSB3aGlsZSBkcm9wcGluZyBvbGQgZGVwZW5kZW5jaWVzLlxuICAgKi9cbiAgd2hpbGUgKG5vZGUgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHByZXYgPSBub2RlLl9wcmV2U291cmNlO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG5vZGUgd2FzIG5vdCByZS11c2VkLCB1bnN1YnNjcmliZSBmcm9tIGl0cyBjaGFuZ2Ugbm90aWZpY2F0aW9ucyBhbmQgcmVtb3ZlIGl0c2VsZlxuICAgICAqIGZyb20gdGhlIGRvdWJseS1saW5rZWQgbGlzdC4gZS5nOlxuICAgICAqXG4gICAgICogeyBBIDwtPiBCIDwtPiBDIH1cbiAgICAgKiAgICAgICAgIFx1MjE5M1xuICAgICAqICAgIHsgQSA8LT4gQyB9XG4gICAgICovXG4gICAgaWYgKG5vZGUuX3ZlcnNpb24gPT09IC0xKSB7XG4gICAgICBub2RlLl9zb3VyY2UuX3Vuc3Vic2NyaWJlKG5vZGUpO1xuXG4gICAgICBpZiAocHJldiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHByZXYuX25leHRTb3VyY2UgPSBub2RlLl9uZXh0U291cmNlO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUuX25leHRTb3VyY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub2RlLl9uZXh0U291cmNlLl9wcmV2U291cmNlID0gcHJldjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLyoqXG4gICAgICAgKiBUaGUgbmV3IGhlYWQgaXMgdGhlIGxhc3Qgbm9kZSBzZWVuIHdoaWNoIHdhc24ndCByZW1vdmVkL3Vuc3Vic2NyaWJlZFxuICAgICAgICogZnJvbSB0aGUgZG91Ymx5LWxpbmtlZCBsaXN0LiBlLmc6XG4gICAgICAgKlxuICAgICAgICogeyBBIDwtPiBCIDwtPiBDIH1cbiAgICAgICAqICAgXHUyMTkxICAgICBcdTIxOTEgICAgIFx1MjE5MVxuICAgICAgICogICBcdTI1MDIgICAgIFx1MjUwMiAgICAgXHUyNTE0IGhlYWQgPSBub2RlXG4gICAgICAgKiAgIFx1MjUwMiAgICAgXHUyNTE0IGhlYWQgPSBub2RlXG4gICAgICAgKiAgIFx1MjUxNCBoZWFkID0gbm9kZVxuICAgICAgICovXG4gICAgICBoZWFkID0gbm9kZTtcbiAgICB9XG5cbiAgICBub2RlLl9zb3VyY2UuX25vZGUgPSBub2RlLl9yb2xsYmFja05vZGU7XG4gICAgaWYgKG5vZGUuX3JvbGxiYWNrTm9kZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBub2RlLl9yb2xsYmFja05vZGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbm9kZSA9IHByZXY7XG4gIH1cblxuICB0YXJnZXQuX3NvdXJjZXMgPSBoZWFkO1xufVxuXG5leHBvcnQgZGVjbGFyZSBjbGFzcyBDb21wdXRlZDxUID0gYW55PiBleHRlbmRzIFNpZ25hbDxUPiB7XG4gIF9jb21wdXRlOiAoKSA9PiBUO1xuICBfc2V0dGVyOiAodjogYW55KSA9PiB2b2lkO1xuICBfc291cmNlcz86IE5vZGU7XG4gIF9nbG9iYWxWZXJzaW9uOiBudW1iZXI7XG4gIF9mbGFnczogbnVtYmVyO1xuICBfdGhpc0FyZzogYW55XG5cbiAgY29uc3RydWN0b3IoY29tcHV0ZTogKCkgPT4gVCwgc2V0dGVyPzogKHY6IGFueSkgPT4gdm9pZCwgdGhpc0FyZz86IGFueSk7XG5cbiAgX25vdGlmeSgpOiB2b2lkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gQ29tcHV0ZWQodGhpczogQ29tcHV0ZWQsIGNvbXB1dGU6ICgpID0+IHVua25vd24sIHNldHRlcj86ICh2OiBhbnkpID0+IHZvaWQsIHRoaXNBcmc/OiBhbnkpIHtcbiAgU2lnbmFsLmNhbGwodGhpcywgdW5kZWZpbmVkKTtcblxuICB0aGlzLl9jb21wdXRlID0gY29tcHV0ZTtcbiAgdGhpcy5fc2V0dGVyID0gc2V0dGVyO1xuICB0aGlzLl9zb3VyY2VzID0gdW5kZWZpbmVkO1xuICB0aGlzLl9nbG9iYWxWZXJzaW9uID0gZ2xvYmFsVmVyc2lvbiAtIDE7XG4gIHRoaXMuX2ZsYWdzID0gT1VUREFURUQ7XG4gIHRoaXMuX3RoaXNBcmcgPSB0aGlzQXJnO1xufVxuXG5Db21wdXRlZC5wcm90b3R5cGUgPSBuZXcgU2lnbmFsKCkgYXMgQ29tcHV0ZWQ7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb21wdXRlZC5wcm90b3R5cGUsICd2YWx1ZScsIHtcbiAgZW51bWVyYWJsZTogZmFsc2UsXG4gIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gIGdldCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoKVxuICB9LFxuICBzZXQodikge1xuICAgIHRoaXMuc2V0KHYpXG4gIH1cbn0pO1xuXG5Db21wdXRlZC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fZmxhZ3MgJiBSVU5OSU5HKSB7XG4gICAgY3ljbGVEZXRlY3RlZCgpO1xuICB9XG4gIGNvbnN0IG5vZGUgPSBhZGREZXBlbmRlbmN5KHRoaXMpO1xuICB0aGlzLl9yZWZyZXNoKCk7XG4gIGlmIChub2RlICE9PSB1bmRlZmluZWQpIHtcbiAgICBub2RlLl92ZXJzaW9uID0gdGhpcy5fdmVyc2lvbjtcbiAgfVxuICBpZiAodGhpcy5fZmxhZ3MgJiBIQVNfRVJST1IpIHtcbiAgICB0aHJvdyB0aGlzLl92YWx1ZTtcbiAgfVxuICByZXR1cm4gdGhpcy5fdmFsdWU7XG59XG5cbkNvbXB1dGVkLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodikge1xuICB0aGlzLl9zZXR0ZXI/LmNhbGwodGhpcy5fdGhpc0FyZywgdilcbn1cblxuQ29tcHV0ZWQucHJvdG90eXBlLl9yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLl9mbGFncyAmPSB+Tk9USUZJRUQ7XG5cbiAgaWYgKHRoaXMuX2ZsYWdzICYgUlVOTklORykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIElmIHRoaXMgY29tcHV0ZWQgc2lnbmFsIGhhcyBzdWJzY3JpYmVkIHRvIHVwZGF0ZXMgZnJvbSBpdHMgZGVwZW5kZW5jaWVzXG4gIC8vIChUUkFDS0lORyBmbGFnIHNldCkgYW5kIG5vbmUgb2YgdGhlbSBoYXZlIG5vdGlmaWVkIGFib3V0IGNoYW5nZXMgKE9VVERBVEVEXG4gIC8vIGZsYWcgbm90IHNldCksIHRoZW4gdGhlIGNvbXB1dGVkIHZhbHVlIGNhbid0IGhhdmUgY2hhbmdlZC5cbiAgaWYgKCh0aGlzLl9mbGFncyAmIChPVVREQVRFRCB8IFRSQUNLSU5HKSkgPT09IFRSQUNLSU5HKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdGhpcy5fZmxhZ3MgJj0gfk9VVERBVEVEO1xuXG4gIGlmICh0aGlzLl9nbG9iYWxWZXJzaW9uID09PSBnbG9iYWxWZXJzaW9uKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdGhpcy5fZ2xvYmFsVmVyc2lvbiA9IGdsb2JhbFZlcnNpb247XG5cbiAgLy8gTWFyayB0aGlzIGNvbXB1dGVkIHNpZ25hbCBydW5uaW5nIGJlZm9yZSBjaGVja2luZyB0aGUgZGVwZW5kZW5jaWVzIGZvciB2YWx1ZVxuICAvLyBjaGFuZ2VzLCBzbyB0aGF0IHRoZSBSVU5OSU5HIGZsYWcgY2FuIGJlIHVzZWQgdG8gbm90aWNlIGN5Y2xpY2FsIGRlcGVuZGVuY2llcy5cbiAgdGhpcy5fZmxhZ3MgfD0gUlVOTklORztcbiAgaWYgKHRoaXMuX3ZlcnNpb24gPiAwICYmICFuZWVkc1RvUmVjb21wdXRlKHRoaXMpKSB7XG4gICAgdGhpcy5fZmxhZ3MgJj0gflJVTk5JTkc7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb25zdCBwcmV2Q29udGV4dCA9IGV2YWxDb250ZXh0O1xuICB0cnkge1xuICAgIHByZXBhcmVTb3VyY2VzKHRoaXMpO1xuICAgIGV2YWxDb250ZXh0ID0gdGhpcztcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuX2NvbXB1dGUuY2FsbCh0aGlzLl90aGlzQXJnKTtcbiAgICBpZiAoXG4gICAgICB0aGlzLl9mbGFncyAmIEhBU19FUlJPUiB8fFxuICAgICAgdGhpcy5fdmFsdWUgIT09IHZhbHVlIHx8XG4gICAgICB0aGlzLl92ZXJzaW9uID09PSAwXG4gICAgKSB7XG4gICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgdGhpcy5fZmxhZ3MgJj0gfkhBU19FUlJPUjtcbiAgICAgIHRoaXMuX3ZlcnNpb24rKztcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGVycikge1xuICAgIHRoaXMuX3ZhbHVlID0gZXJyO1xuICAgIHRoaXMuX2ZsYWdzIHw9IEhBU19FUlJPUjtcbiAgICB0aGlzLl92ZXJzaW9uKys7XG4gIH1cbiAgZXZhbENvbnRleHQgPSBwcmV2Q29udGV4dDtcbiAgY2xlYW51cFNvdXJjZXModGhpcyk7XG4gIHRoaXMuX2ZsYWdzICY9IH5SVU5OSU5HO1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkNvbXB1dGVkLnByb3RvdHlwZS5fc3Vic2NyaWJlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgaWYgKHRoaXMuX3RhcmdldHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX2ZsYWdzIHw9IE9VVERBVEVEIHwgVFJBQ0tJTkc7XG5cbiAgICAvLyBBIGNvbXB1dGVkIHNpZ25hbCBzdWJzY3JpYmVzIGxhemlseSB0byBpdHMgZGVwZW5kZW5jaWVzIHdoZW4gdGhlIGl0XG4gICAgLy8gZ2V0cyBpdHMgZmlyc3Qgc3Vic2NyaWJlci5cbiAgICBmb3IgKFxuICAgICAgbGV0IG5vZGUgPSB0aGlzLl9zb3VyY2VzO1xuICAgICAgbm9kZSAhPT0gdW5kZWZpbmVkO1xuICAgICAgbm9kZSA9IG5vZGUuX25leHRTb3VyY2VcbiAgICApIHtcbiAgICAgIG5vZGUuX3NvdXJjZS5fc3Vic2NyaWJlKG5vZGUpO1xuICAgIH1cbiAgfVxuICBTaWduYWwucHJvdG90eXBlLl9zdWJzY3JpYmUuY2FsbCh0aGlzLCBub2RlKTtcbn07XG5cbkNvbXB1dGVkLnByb3RvdHlwZS5fdW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAobm9kZSkge1xuICAvLyBPbmx5IHJ1biB0aGUgdW5zdWJzY3JpYmUgc3RlcCBpZiB0aGUgY29tcHV0ZWQgc2lnbmFsIGhhcyBhbnkgc3Vic2NyaWJlcnMuXG4gIGlmICh0aGlzLl90YXJnZXRzICE9PSB1bmRlZmluZWQpIHtcbiAgICBTaWduYWwucHJvdG90eXBlLl91bnN1YnNjcmliZS5jYWxsKHRoaXMsIG5vZGUpO1xuXG4gICAgLy8gQ29tcHV0ZWQgc2lnbmFsIHVuc3Vic2NyaWJlcyBmcm9tIGl0cyBkZXBlbmRlbmNpZXMgd2hlbiBpdCBsb3NlcyBpdHMgbGFzdCBzdWJzY3JpYmVyLlxuICAgIC8vIFRoaXMgbWFrZXMgaXQgcG9zc2libGUgZm9yIHVucmVmZXJlbmNlcyBzdWJncmFwaHMgb2YgY29tcHV0ZWQgc2lnbmFscyB0byBnZXQgZ2FyYmFnZSBjb2xsZWN0ZWQuXG4gICAgaWYgKHRoaXMuX3RhcmdldHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fZmxhZ3MgJj0gflRSQUNLSU5HO1xuXG4gICAgICBmb3IgKFxuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuX3NvdXJjZXM7XG4gICAgICAgIG5vZGUgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHRTb3VyY2VcbiAgICAgICkge1xuICAgICAgICBub2RlLl9zb3VyY2UuX3Vuc3Vic2NyaWJlKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuQ29tcHV0ZWQucHJvdG90eXBlLl9ub3RpZnkgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghKHRoaXMuX2ZsYWdzICYgTk9USUZJRUQpKSB7XG4gICAgdGhpcy5fZmxhZ3MgfD0gT1VUREFURUQgfCBOT1RJRklFRDtcblxuICAgIGZvciAoXG4gICAgICBsZXQgbm9kZSA9IHRoaXMuX3RhcmdldHM7XG4gICAgICBub2RlICE9PSB1bmRlZmluZWQ7XG4gICAgICBub2RlID0gbm9kZS5fbmV4dFRhcmdldFxuICAgICkge1xuICAgICAgbm9kZS5fdGFyZ2V0Ll9ub3RpZnkoKTtcbiAgICB9XG4gIH1cbn07XG5cbkNvbXB1dGVkLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX3JlZnJlc2goKSkge1xuICAgIGN5Y2xlRGV0ZWN0ZWQoKTtcbiAgfVxuICBpZiAodGhpcy5fZmxhZ3MgJiBIQVNfRVJST1IpIHtcbiAgICB0aHJvdyB0aGlzLl92YWx1ZTtcbiAgfVxuICByZXR1cm4gdGhpcy5fdmFsdWU7XG59O1xuXG4vLyBpbnRlcmZhY2UgUmVhZG9ubHlTaWduYWw8VCA9IGFueT4gZXh0ZW5kcyBTaWduYWw8VD4ge1xuLy8gICByZWFkb25seSB2YWx1ZTogVDtcbi8vIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVkPFQ+KGNvbXB1dGU6ICgpID0+IFQsIHNldHRlcj86ICh2OiBhbnkpID0+IHZvaWQsIHRoaXNBcmc/OiBhbnkpOiBDb21wdXRlZDxUPiB7XG4gIHJldHVybiBuZXcgQ29tcHV0ZWQoY29tcHV0ZSwgc2V0dGVyLCB0aGlzQXJnKTtcbn1cblxuZnVuY3Rpb24gY2xlYW51cEVmZmVjdChlZmZlY3Q6IEVmZmVjdCkge1xuICBjb25zdCBjbGVhbnVwID0gZWZmZWN0Ll9jbGVhbnVwO1xuICBlZmZlY3QuX2NsZWFudXAgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKHR5cGVvZiBjbGVhbnVwID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHQvKkBfX0lOTElORV9fKiovIHN0YXJ0QmF0Y2goKTtcblxuICAgIC8vIFJ1biBjbGVhbnVwIGZ1bmN0aW9ucyBhbHdheXMgb3V0c2lkZSBvZiBhbnkgY29udGV4dC5cbiAgICBjb25zdCBwcmV2Q29udGV4dCA9IGV2YWxDb250ZXh0O1xuICAgIGV2YWxDb250ZXh0ID0gdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgIGVmZmVjdC5fZmxhZ3MgJj0gflJVTk5JTkc7XG4gICAgICBlZmZlY3QuX2ZsYWdzIHw9IERJU1BPU0VEO1xuICAgICAgZGlzcG9zZUVmZmVjdChlZmZlY3QpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgIGV2YWxDb250ZXh0ID0gcHJldkNvbnRleHQ7XG4gICAgICBlbmRCYXRjaCgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNwb3NlRWZmZWN0KGVmZmVjdDogRWZmZWN0KSB7XG4gIGZvciAoXG4gICAgbGV0IG5vZGUgPSBlZmZlY3QuX3NvdXJjZXM7XG4gICAgbm9kZSAhPT0gdW5kZWZpbmVkO1xuICAgIG5vZGUgPSBub2RlLl9uZXh0U291cmNlXG4gICkge1xuICAgIG5vZGUuX3NvdXJjZS5fdW5zdWJzY3JpYmUobm9kZSk7XG4gIH1cbiAgZWZmZWN0Ll9jb21wdXRlID0gdW5kZWZpbmVkO1xuICBlZmZlY3QuX3NvdXJjZXMgPSB1bmRlZmluZWQ7XG5cbiAgY2xlYW51cEVmZmVjdChlZmZlY3QpO1xufVxuXG5mdW5jdGlvbiBlbmRFZmZlY3QodGhpczogRWZmZWN0LCBwcmV2Q29udGV4dD86IENvbXB1dGVkIHwgRWZmZWN0KSB7XG4gIGlmIChldmFsQ29udGV4dCAhPT0gdGhpcykge1xuICAgIGV2YWxDb250ZXh0ID0gaWdub3JlZC5wb3AoKTtcbiAgICBpZiAoZXZhbENvbnRleHQgIT09IHRoaXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk91dC1vZi1vcmRlciBlZmZlY3RcIik7XG4gICAgfVxuICB9XG4gIGNsZWFudXBTb3VyY2VzKHRoaXMpO1xuICBldmFsQ29udGV4dCA9IHByZXZDb250ZXh0O1xuXG4gIHRoaXMuX2ZsYWdzICY9IH5SVU5OSU5HO1xuICBpZiAodGhpcy5fZmxhZ3MgJiBESVNQT1NFRCkge1xuICAgIGRpc3Bvc2VFZmZlY3QodGhpcyk7XG4gIH1cbiAgZW5kQmF0Y2goKTtcbn1cblxuZXhwb3J0IHR5cGUgRWZmZWN0Q2xlYW51cCA9ICgpID0+IHVua25vd247XG5kZWNsYXJlIGNsYXNzIEVmZmVjdCB7XG4gIF9jb21wdXRlPzogKCkgPT4gdW5rbm93biB8IEVmZmVjdENsZWFudXA7XG4gIF9jbGVhbnVwPzogKCkgPT4gdW5rbm93bjtcbiAgX3NvdXJjZXM/OiBOb2RlO1xuICBfbmV4dEJhdGNoZWRFZmZlY3Q/OiBFZmZlY3Q7XG4gIF9mbGFnczogbnVtYmVyO1xuICBfdGhpc0FyZzogYW55XG5cbiAgY29uc3RydWN0b3IoY29tcHV0ZTogKCkgPT4gdW5rbm93biB8IEVmZmVjdENsZWFudXAsIHRoaXNBcmc/OiBhbnkpO1xuXG4gIF9jYWxsYmFjaygpOiB2b2lkO1xuICBfc3RhcnQoKTogKCkgPT4gdm9pZDtcbiAgX25vdGlmeSgpOiB2b2lkO1xuICBfZGlzcG9zZSgpOiB2b2lkO1xufVxuXG5mdW5jdGlvbiBFZmZlY3QodGhpczogRWZmZWN0LCBjb21wdXRlOiAoKSA9PiB1bmtub3duIHwgRWZmZWN0Q2xlYW51cCwgdGhpc0FyZz86IGFueSkge1xuICB0aGlzLl9jb21wdXRlID0gY29tcHV0ZTtcbiAgdGhpcy5fY2xlYW51cCA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fc291cmNlcyA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fbmV4dEJhdGNoZWRFZmZlY3QgPSB1bmRlZmluZWQ7XG4gIHRoaXMuX2ZsYWdzID0gVFJBQ0tJTkc7XG4gIHRoaXMuX3RoaXNBcmcgPSB0aGlzQXJnO1xufVxuXG5FZmZlY3QucHJvdG90eXBlLl9jYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgZmluaXNoID0gdGhpcy5fc3RhcnQoKTtcbiAgdHJ5IHtcbiAgICBpZiAodGhpcy5fZmxhZ3MgJiBESVNQT1NFRCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9jb21wdXRlID09PSB1bmRlZmluZWQpIHJldHVybjtcblxuICAgIGNvbnN0IGNsZWFudXAgPSB0aGlzLl9jb21wdXRlLmNhbGwodGhpcy5fdGhpc0FyZyk7XG4gICAgaWYgKHR5cGVvZiBjbGVhbnVwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRoaXMuX2NsZWFudXAgPSBjbGVhbnVwIGFzIEVmZmVjdENsZWFudXA7XG4gICAgfVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgaWYgKGUgPT09IE1pc3NpbmdEZXBlbmRlbmN5RXJyb3JTeW1ib2wpIHsgfVxuICAgIGVsc2UgdGhyb3cgZVxuICB9XG4gIGZpbmFsbHkge1xuICAgIGZpbmlzaCgpO1xuICB9XG59O1xuXG5FZmZlY3QucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuX2ZsYWdzICYgUlVOTklORykge1xuICAgIGN5Y2xlRGV0ZWN0ZWQoKTtcbiAgfVxuICB0aGlzLl9mbGFncyB8PSBSVU5OSU5HO1xuICB0aGlzLl9mbGFncyAmPSB+RElTUE9TRUQ7XG4gIGNsZWFudXBFZmZlY3QodGhpcyk7XG4gIHByZXBhcmVTb3VyY2VzKHRoaXMpO1xuXG5cdC8qQF9fSU5MSU5FX18qKi8gc3RhcnRCYXRjaCgpO1xuICBjb25zdCBwcmV2Q29udGV4dCA9IGV2YWxDb250ZXh0O1xuICBldmFsQ29udGV4dCA9IHRoaXM7XG4gIHJldHVybiBlbmRFZmZlY3QuYmluZCh0aGlzLCBwcmV2Q29udGV4dCk7XG59O1xuXG5FZmZlY3QucHJvdG90eXBlLl9ub3RpZnkgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghKHRoaXMuX2ZsYWdzICYgTk9USUZJRUQpKSB7XG4gICAgdGhpcy5fZmxhZ3MgfD0gTk9USUZJRUQ7XG4gICAgdGhpcy5fbmV4dEJhdGNoZWRFZmZlY3QgPSBiYXRjaGVkRWZmZWN0O1xuICAgIGJhdGNoZWRFZmZlY3QgPSB0aGlzO1xuICB9XG59O1xuXG5FZmZlY3QucHJvdG90eXBlLl9kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLl9mbGFncyB8PSBESVNQT1NFRDtcblxuICBpZiAoISh0aGlzLl9mbGFncyAmIFJVTk5JTkcpKSB7XG4gICAgZGlzcG9zZUVmZmVjdCh0aGlzKTtcbiAgfVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGVmZmVjdChjOiAoKSA9PiB1bmtub3duIHwgRWZmZWN0Q2xlYW51cCwgdGhpc0FyZz86IGFueSk6ICgpID0+IHZvaWQge1xuICBjb25zdCBlZmZlY3QgPSBuZXcgRWZmZWN0KGMsIHRoaXNBcmcpO1xuICBjb25zdCBwcmV2UG9zID0gcG9zXG4gIHRyeSB7XG4gICAgcG9zID0gRUZGRUNUXG4gICAgZWZmZWN0Ll9jYWxsYmFjaygpO1xuICAgIC8vIFJldHVybiBhIGJvdW5kIGZ1bmN0aW9uIGluc3RlYWQgb2YgYSB3cmFwcGVyIGxpa2UgYCgpID0+IGVmZmVjdC5fZGlzcG9zZSgpYCxcbiAgICAvLyBiZWNhdXNlIGJvdW5kIGZ1bmN0aW9ucyBzZWVtIHRvIGJlIGp1c3QgYXMgZmFzdCBhbmQgdGFrZSB1cCBhIGxvdCBsZXNzIG1lbW9yeS5cbiAgICByZXR1cm4gZWZmZWN0Ll9kaXNwb3NlLmJpbmQoZWZmZWN0KTtcbiAgfVxuICBjYXRjaCAoZXJyKSB7XG4gICAgLy8gaXQncyBiZXR0ZXIgdG8gc3dhbGxvdyB0aGUgZGlzcG9zZSBlcnJvciAoaWYgYW55KSBhbmQgdGhyb3cgdGhlIG9yaWdpbmFsIG9uZVxuICAgIHRyeSB7XG4gICAgICBlZmZlY3QuX2Rpc3Bvc2UoKTtcbiAgICB9IGNhdGNoIHsgfVxuICAgIHRocm93IGVycjtcbiAgfVxuICBmaW5hbGx5IHtcbiAgICBwb3MgPSBwcmV2UG9zXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVudHJhY2s8VD4oYzogKCkgPT4gVCk6IFRcbmV4cG9ydCBmdW5jdGlvbiB1bnRyYWNrKCk6IHZvaWRcbmV4cG9ydCBmdW5jdGlvbiB1bnRyYWNrKGNhbGxiYWNrPzogKCkgPT4gYW55KSB7XG4gIGlmIChjYWxsYmFjaykgcmV0dXJuIHVudHJhY2tlZChjYWxsYmFjaylcbiAgaWdub3JlZC5wdXNoKGV2YWxDb250ZXh0KVxuICBldmFsQ29udGV4dCA9IHVuZGVmaW5lZFxufVxuLy8gZnVuY3Rpb24gdW50cmFja2VkPFQ+KGNhbGxiYWNrOiAoKSA9PiBUKTogVCB7XG5cbmV4cG9ydCBjb25zdCBmbHVzaCA9IGVuZEJhdGNoLmJpbmQobnVsbCwgdHJ1ZSlcblxuZXhwb3J0IGZ1bmN0aW9uIG9mPFQgZXh0ZW5kcyBvYmplY3Q+KG9mOiBUKTogTm9uTnVsbDxUPiB7XG4gIGlmIChwb3MgPT09IEVGRkVDVCAmJiBldmFsQ29udGV4dCkge1xuICAgIHJldHVybiByZXF1aXJlZEZhc3Qob2YpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIHJlcXVpcmVkKG9mKVxuICB9XG59XG4iLCAiaW1wb3J0IHsgRGVlcFBhcnRpYWwsIGFzc2lnbiwgY2FsbGJhY2tpZnksIGRlZXBNZXJnZSwgZXJycywgZ2V0QWxsUHJvcGVydHlEZXNjcmlwdG9ycywgZ2V0UHJvcGVydHlEZXNjcmlwdG9yLCBpc0Z1bmN0aW9uLCBpc09iamVjdCwgaXRlcmlmeSwgdGlja3MsIHRpbWVvdXQsIHVuaXRlcmlmeSB9IGZyb20gJ3V0aWxzJ1xuaW1wb3J0IHsgQ29tcHV0ZWQsIHVudHJhY2ssIFNpZ25hbCwgc2lnbmFsLCBjb21wdXRlZCwgYmF0Y2gsIGVmZmVjdCwgRWZmZWN0Q2xlYW51cCwgX19zaWduYWxfXyB9IGZyb20gJy4vc2lnbmFsLWNvcmUudHMnXG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJy4vc2lnbmFsLWNvcmUudHMnXG5leHBvcnQgKiBmcm9tICcuL3NpZ25hbC1jb3JlLnRzJ1xuXG50eXBlIFNpZ25hbHM8VD4gPSB7IFtLIGluIGtleW9mIFRdOiBTaWduYWw8VFtLXT4gfVxuXG50eXBlIEN0b3IgPSB7XG4gIG5ldygpOiBhbnlcbiAgbmV3KC4uLmFyZ3M6IGFueVtdKTogYW55XG59XG5cbnR5cGUgQ3Rvckd1YXJkPFQ+ID0gVCBleHRlbmRzIEN0b3IgPyBuZXZlciA6IFRcblxudHlwZSBQcm9wczxUPiA9IERlZXBQYXJ0aWFsPFQ+XG5cbnR5cGUgRnJvbSA9IHtcbiAgaXQ6IGFueVxuICBwYXRoOiBzdHJpbmdbXVxufVxuXG50eXBlIEZ4ID0ge1xuICBbX19meF9fXT86IHRydWVcbiAgKCk6IEVmZmVjdENsZWFudXAgfCAoRWZmZWN0Q2xlYW51cCB8IHVua25vd24pW10gfCB1bmtub3duIHwgdm9pZFxuICBkaXNwb3NlPygpOiB2b2lkXG59XG5cbnR5cGUgVW53cmFwPFQ+ID0gVCBleHRlbmRzICgpID0+IEFzeW5jR2VuZXJhdG9yPGluZmVyIFUsIGFueSwgYW55PiA/IFUgfCB1bmRlZmluZWQgOiBUIGV4dGVuZHMgUHJvbWlzZTxpbmZlciBVPiA/IFUgfCB1bmRlZmluZWQgOiBUXG5cbmV4cG9ydCB0eXBlICQ8VD4gPSB7XG4gIFtLIGluIGtleW9mIFRdOiBUW0tdXG59ICYge1xuICAkOiBUXG4gIFtfX3NpZ25hbHNfX106IFNpZ25hbHM8VD5cbiAgW19fZWZmZWN0c19fXTogTWFwPEZ4LCAodW5rbm93biB8IEVmZmVjdENsZWFudXApPlxufVxuXG5leHBvcnQgY29uc3QgRXJyID0gZXJycyh7XG4gIEludmFsaWRTaWduYWxUeXBlOiBbVHlwZUVycm9yXSxcbn0pXG5cbmNvbnN0IF9fcHJvcF9fID0gU3ltYm9sKCdwcm9wJylcbmNvbnN0IF9fc3RydWN0X18gPSBTeW1ib2woJ3N0cnVjdCcpXG5jb25zdCBfX3NpZ25hbHNfXyA9IFN5bWJvbCgnc2lnbmFscycpXG5jb25zdCBfX2VmZmVjdHNfXyA9IFN5bWJvbCgnZWZmZWN0cycpXG5jb25zdCBfX2Z4X18gPSBTeW1ib2woJ2Z4JylcbmNvbnN0IF9fZm5fXyA9IFN5bWJvbCgnZm4nKVxuY29uc3QgX191bndyYXBfXyA9IFN5bWJvbCgndW53cmFwJylcblxuZnVuY3Rpb24gaXNTaWduYWwodjogYW55KTogdiBpcyBTaWduYWwge1xuICByZXR1cm4gdiAmJiB2W19fc2lnbmFsX19dXG59XG5mdW5jdGlvbiBpc1Byb3AodjogYW55KTogdiBpcyBTaWduYWwge1xuICByZXR1cm4gdiAmJiB2W19fcHJvcF9fXVxufVxuZnVuY3Rpb24gaXNTdHJ1Y3Q8VCBleHRlbmRzIG9iamVjdD4odjogVCk6IHYgaXMgJDxUPiB7XG4gIHJldHVybiB2ICYmIHZbX19zdHJ1Y3RfX11cbn1cbmZ1bmN0aW9uIGlzRngodjogYW55KTogdiBpcyBGeCB7XG4gIHJldHVybiB2ICYmIHZbX19meF9fXVxufVxuZnVuY3Rpb24gaXNVbndyYXAodjogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiB2ICYmIHZbX191bndyYXBfX11cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFsaWFzPFQsIEsgZXh0ZW5kcyBrZXlvZiBUPihvZjogVCwgZnJvbTogSyk6IFRbS10ge1xuICByZXR1cm4geyBbX19wcm9wX19dOiBmcm9tIH0gYXMgYW55XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNwb3NlKGZ4OiBFZmZlY3RDbGVhbnVwKTogdm9pZFxuZXhwb3J0IGZ1bmN0aW9uIGRpc3Bvc2UoZnhzOiAodW5rbm93biB8IEVmZmVjdENsZWFudXApW10pOiB2b2lkXG5leHBvcnQgZnVuY3Rpb24gZGlzcG9zZSgkOiAkPHVua25vd24+KTogdm9pZFxuZXhwb3J0IGZ1bmN0aW9uIGRpc3Bvc2UoZm46IEVmZmVjdENsZWFudXAgfCAodW5rbm93biB8IEVmZmVjdENsZWFudXApW10gfCAkPHVua25vd24+KTogdm9pZCB7XG4gIGlmIChpc1N0cnVjdChmbikpIHtcbiAgICBmbltfX2VmZmVjdHNfX10uZm9yRWFjaChkaXNwb3NlKVxuICB9XG4gIGVsc2UgaWYgKGlzRngoZm4pKSB7XG4gICAgZm4uZGlzcG9zZT8uKClcbiAgfVxuICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGZuKSkge1xuICAgIGZuLmZvckVhY2goZGlzcG9zZSlcbiAgfVxufVxuXG5sZXQgaW5pdERlcHRoID0gMFxuY29uc3QgZWZmZWN0czogeyBmeDogRngsIHN0YXRlOiBhbnkgfVtdID0gW11cbmNvbnN0IGZvcmJpZGRlbktleXMgPSBuZXcgU2V0KFtcbiAgJ19fcHJvdG9fXycsXG4gICdjb25zdHJ1Y3RvcicsXG5dKVxuY29uc3QgaGlkZGVuID0geyBjb25maWd1cmFibGU6IGZhbHNlLCBlbnVtZXJhYmxlOiBmYWxzZSB9XG5jb25zdCBjdG9yc1Byb3BEZWNvcyA9IG5ldyBNYXA8YW55LCBhbnk+KClcblxuY29uc3QgcyQ6IHtcbiAgPFQgZXh0ZW5kcyBDdG9yPihleHBlY3RfbmV3OiBULCBwbGVhc2VfdXNlX25ldz86IGFueSk6IEN0b3JHdWFyZDxUPlxuICA8VCBleHRlbmRzIG9iamVjdD4ob2Y6IFQsIHA/OiBQcm9wczxUPik6ICQ8VD5cbn0gPSBmdW5jdGlvbiBzdHJ1Y3QkKHN0YXRlOiBhbnksIHByb3BzPzogYW55KTogYW55IHtcbiAgaWYgKGlzU3RydWN0KHN0YXRlKSkgcmV0dXJuIGFzc2lnbihzdGF0ZSwgcHJvcHMpXG4gIGlmICghaXNPYmplY3Qoc3RhdGUpKSB0aHJvdyBuZXcgRXJyLkludmFsaWRTaWduYWxUeXBlKHR5cGVvZiBzdGF0ZSlcblxuICBjb25zdCBkZXNjcyA9IGdldEFsbFByb3BlcnR5RGVzY3JpcHRvcnMoc3RhdGUpXG4gIGNvbnN0IGFsaWFzZXM6IHsgZnJvbUtleTogc3RyaW5nLCB0b0tleTogc3RyaW5nIH1bXSA9IFtdXG4gIGNvbnN0IHNpZ25hbHM6IFJlY29yZDxzdHJpbmcsIFNpZ25hbD4gPSB7fVxuICBjb25zdCBwcm9wZXJ0aWVzOiBQcm9wZXJ0eURlc2NyaXB0b3JNYXAgPSB7XG4gICAgJDogeyAuLi5oaWRkZW4sIHZhbHVlOiBzaWduYWxzIH0sXG4gICAgW19fc3RydWN0X19dOiB7IC4uLmhpZGRlbiwgdmFsdWU6IHRydWUgfSxcbiAgICBbX19zaWduYWxzX19dOiB7IC4uLmhpZGRlbiwgdmFsdWU6IHNpZ25hbHMgfSxcbiAgICBbX19lZmZlY3RzX19dOiB7IC4uLmhpZGRlbiwgdmFsdWU6IG5ldyBNYXAoKSB9LFxuICB9XG5cbiAgcHJvcHMgPz89IHt9XG4gIC8vIHdlIG11dGF0ZSB0aGUgcHJvcHMgb2JqZWN0IHNvIGRvbid0IG1vZGlmeSBvcmlnaW5hbFxuICBwcm9wcyA9IHsgLi4ucHJvcHMgfVxuXG4gIGluaXREZXB0aCsrXG5cbiAgY29uc3QgcHJvcERlY286IGFueSA9IG5ldyBNYXAoKVxuXG4gIGxldCBwcm90byA9IHN0YXRlLl9fcHJvdG9fX1xuICB3aGlsZSAocHJvdG8pIHtcbiAgICBjdG9yc1Byb3BEZWNvcy5nZXQocHJvdG8pPy5mb3JFYWNoKCh2YWx1ZTogYW55LCBrZXk6IGFueSkgPT4ge1xuICAgICAgaWYgKCFwcm9wRGVjby5oYXMoa2V5KSkgcHJvcERlY28uc2V0KGtleSwgdmFsdWUpXG4gICAgfSlcbiAgICBwcm90byA9IHByb3RvLl9fcHJvdG9fX1xuICB9XG5cbiAgLy8gZGVmaW5lIHNpZ25hbCBhY2Nlc3NvcnMgZm9yIGV4cG9ydGVkIG9iamVjdFxuICBmb3IgKGNvbnN0IGtleSBpbiBkZXNjcykge1xuICAgIGlmIChmb3JiaWRkZW5LZXlzLmhhcyhrZXkpKSBjb250aW51ZVxuXG4gICAgY29uc3QgZGVzYyA9IGRlc2NzW2tleV1cblxuICAgIGNvbnN0IGNwID0gcHJvcERlY28/LmdldChrZXkpXG4gICAgc3dpdGNoIChjcCkge1xuICAgICAgY2FzZSBfX2ZuX186XG4gICAgICAgIGRlc2MudmFsdWUgPSB3cmFwRm4oZGVzYy52YWx1ZSlcbiAgICAgICAgcHJvcGVydGllc1trZXldID0gZGVzY1xuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIGNvbnN0IGlzUHJvcFNpZ25hbCA9IGlzU2lnbmFsKHByb3BzW2tleV0pXG5cbiAgICAvLyBnZXR0ZXIgdHVybnMgaW50byBjb21wdXRlZFxuICAgIGlmIChkZXNjLmdldCAmJiAhaXNQcm9wU2lnbmFsKSB7XG4gICAgICBjb25zdCBzOiBDb21wdXRlZCA9IGNvbXB1dGVkKFxuICAgICAgICBkZXNjLmdldCxcbiAgICAgICAgZGVzYy5zZXQsXG4gICAgICAgIHN0YXRlXG4gICAgICApXG4gICAgICBzaWduYWxzW2tleV0gPSBzXG4gICAgICBwcm9wZXJ0aWVzW2tleV0gPSB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gcy52YWx1ZVxuICAgICAgICB9LFxuICAgICAgICBzZXQodikge1xuICAgICAgICAgIHMudmFsdWUgPSB2XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gcmVndWxhciB2YWx1ZSBjcmVhdGVzIHNpZ25hbCBhY2Nlc3NvclxuICAgIGVsc2Uge1xuICAgICAgbGV0IHM6IFNpZ25hbFxuICAgICAgbGV0IHZhbHVlOiB1bmtub3duID0gZGVzYy52YWx1ZVxuXG4gICAgICBpZiAoaXNQcm9wKHByb3BzW2tleV0pKSB7XG4gICAgICAgIHZhbHVlID0gcHJvcHNba2V5XVxuICAgICAgICBkZWxldGUgcHJvcHNba2V5XVxuICAgICAgfVxuICAgICAgaWYgKGlzUHJvcFNpZ25hbCkge1xuICAgICAgICBzID0gcHJvcHNba2V5XVxuICAgICAgICBkZWxldGUgcHJvcHNba2V5XVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBzID0gc2lnbmFsKHZhbHVlKVxuICAgICAgfVxuICAgICAgZWxzZSBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgIGlmICh2YWx1ZVtfX3Byb3BfX10pIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSB2YWx1ZVtfX3Byb3BfX10gYXMgYW55XG4gICAgICAgICAgICBpZiAodHlwZW9mIHAgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIGFsaWFzZXMucHVzaCh7IGZyb21LZXk6IHAsIHRvS2V5OiBrZXkgfSlcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCdpdCcgaW4gcCkge1xuICAgICAgICAgICAgICBjb25zdCBmcm9tOiBGcm9tID0gcFxuXG4gICAgICAgICAgICAgIHMgPSBzaWduYWwodm9pZCAwKVxuXG4gICAgICAgICAgICAgIGVmZmVjdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgZng6ICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBsZXQgb2ZmXG5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IGZ4Zm4gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB7IGl0IH0gPSBmcm9tXG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwIG9mIGZyb20ucGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmICghaXRbcF0pIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgIGl0ID0gaXRbcF1cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXQgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBvZmY/LigpXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlW19fZWZmZWN0c19fXS5kZWxldGUoZnhmbilcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTaWduYWwoaXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaXQuc3Vic2NyaWJlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICBzaWduYWxzW2tleV0uc3Vic2NyaWJlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXQudmFsdWUgPSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGVba2V5XSA9IGl0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgb2ZmID0gZngoZnhmbilcbiAgICAgICAgICAgICAgICAgIHN0YXRlW19fZWZmZWN0c19fXS5zZXQoZnhmbiwgb2ZmKVxuICAgICAgICAgICAgICAgIH0pIGFzIGFueSxcbiAgICAgICAgICAgICAgICBzdGF0ZVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoX191bndyYXBfXyBpbiBwKSB7XG4gICAgICAgICAgICAgIHMgPSBzaWduYWwocC5pbml0KVxuXG4gICAgICAgICAgICAgIGxldCBnZW4gPSBwW19fdW53cmFwX19dXG5cbiAgICAgICAgICAgICAgaWYgKGdlbltTeW1ib2wuYXN5bmNJdGVyYXRvcl0pIHtcbiAgICAgICAgICAgICAgICBnZW4gPSB1bml0ZXJpZnkoZ2VuLCBwLmNiKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGdlbi5jb25zdHJ1Y3Rvci5uYW1lID09PSAnQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBlZmZlY3RzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgZng6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVmZXJyZWQgPSBjYWxsYmFja2lmeShnZW4sIHYgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHMudmFsdWUgPSB2XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5yZWplY3RcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBzdGF0ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoX19zaWduYWxfXyBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgcyA9IHZhbHVlIGFzIFNpZ25hbFxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHMgPSBzaWduYWwodmFsdWUpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWtcblxuICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgLy8gZXhjZXB0IGZvciBlZmZlY3QgZnVuY3Rpb25zIHdoaWNoIGFyZSBub24tZW51bWVyYWJsZVxuICAgICAgICAgIC8vIGFuZCBzY2hlZHVsZWQgdG8gYmUgaW5pdGlhbGl6ZWQgYXQgdGhlIGVuZCBvZiB0aGUgY29uc3RydWN0XG4gICAgICAgICAgaWYgKGlzRngodmFsdWUpKSB7XG4gICAgICAgICAgICBhc3NpZ24oZGVzYywgaGlkZGVuKVxuICAgICAgICAgICAgcHJvcGVydGllc1trZXldID0gZGVzY1xuICAgICAgICAgICAgZWZmZWN0cy5wdXNoKHsgZng6IHN0YXRlW2tleV0sIHN0YXRlIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBzID0gc2lnbmFsKHZhbHVlKVxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIHNpZ25hbHNba2V5XSA9IHNcbiAgICAgIHByb3BlcnRpZXNba2V5XSA9IHtcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgIHJldHVybiBzLnZhbHVlXG4gICAgICAgIH0sXG4gICAgICAgIHNldCh2KSB7XG4gICAgICAgICAgcy52YWx1ZSA9IHZcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHN0YXRlLCBwcm9wZXJ0aWVzKVxuXG4gIGFsaWFzZXMuZm9yRWFjaCgoeyBmcm9tS2V5LCB0b0tleSB9KSA9PiB7XG4gICAgY29uc3QgZGVzYyA9IGdldFByb3BlcnR5RGVzY3JpcHRvcihzdGF0ZSwgZnJvbUtleSlcbiAgICBpZiAoIWRlc2MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQWxpYXMgdGFyZ2V0IFwiJHt0b0tleX1cIiBmYWlsZWQsIGNvdWxkblxcJ3QgZmluZCBwcm9wZXJ0eSBkZXNjcmlwdG9yIGZvciBzb3VyY2Uga2V5IFwiJHtmcm9tS2V5fVwiLmApXG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzdGF0ZSwgdG9LZXksIGRlc2MpXG4gICAgc2lnbmFsc1t0b0tleV0gPSBzaWduYWxzW2Zyb21LZXldXG4gIH0pXG5cbiAgZGVlcE1lcmdlKHN0YXRlLCBwcm9wcylcblxuICBpZiAoIS0taW5pdERlcHRoKSB7XG4gICAgZWZmZWN0cy5zcGxpY2UoMCkuZm9yRWFjaCgoeyBmeCwgc3RhdGUgfSkgPT5cbiAgICAgIGZ4LmNhbGwoc3RhdGUpXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHN0YXRlXG59XG5cbmZ1bmN0aW9uIHdyYXBGbihmbjogYW55KSB7XG4gIGNvbnN0IHYgPSBmdW5jdGlvbiBfZm4oLi4uYXJnczogYW55W10pIHtcbiAgICByZXR1cm4gYmF0Y2goZm4sIHRoaXMsIGFyZ3MpXG4gIH1cbiAgdltfX2ZuX19dID0gdHJ1ZVxuICByZXR1cm4gdlxufVxuXG5leHBvcnQgY29uc3QgZm46IHtcbiAgPFQgZXh0ZW5kcyAoLi4uYXJnczogYW55W10pID0+IGFueT4oZm46IFQpOiBUXG4gICh0OiBhbnksIGs6IHN0cmluZywgZDogUHJvcGVydHlEZXNjcmlwdG9yKTogUHJvcGVydHlEZXNjcmlwdG9yXG4gICh0OiBhbnksIGs6IHN0cmluZyk6IHZvaWRcbn0gPSBmdW5jdGlvbiBmbkRlY29yYXRvcih0OiBhbnksIGs/OiBzdHJpbmcsIGQ/OiBQcm9wZXJ0eURlc2NyaXB0b3IpIHtcbiAgaWYgKCFrKSB7XG4gICAgcmV0dXJuIHdyYXBGbih0KSBhcyBhbnlcbiAgfVxuICBpZiAoIWQpIHtcbiAgICBsZXQgcHJvcHMgPSBjdG9yc1Byb3BEZWNvcy5nZXQodClcbiAgICBpZiAoIXByb3BzKSBjdG9yc1Byb3BEZWNvcy5zZXQodCwgcHJvcHMgPSBuZXcgTWFwKCkpXG4gICAgcHJvcHMuc2V0KGssIF9fZm5fXylcbiAgICByZXR1cm5cbiAgfVxuICBkLnZhbHVlID0gd3JhcEZuKGQudmFsdWUpXG4gIHJldHVybiBkXG59XG5cbmV4cG9ydCBjb25zdCBmeDoge1xuICAoYzogKCkgPT4gdW5rbm93biB8IEVmZmVjdENsZWFudXAsIHRoaXNBcmc/OiBhbnkpOiAoKSA9PiB2b2lkXG4gICh0OiBvYmplY3QsIGs6IHN0cmluZywgZDogUHJvcGVydHlEZXNjcmlwdG9yKTogUHJvcGVydHlEZXNjcmlwdG9yXG59ID0gZnVuY3Rpb24gZnhEZWNvcmF0b3IodDogb2JqZWN0IHwgKCgpID0+IHVua25vd24pLCBrPzogc3RyaW5nLCBkPzogUHJvcGVydHlEZXNjcmlwdG9yKTogYW55IHtcbiAgaWYgKGlzRnVuY3Rpb24odCkpIHtcbiAgICByZXR1cm4gZWZmZWN0KHQsIGspXG4gIH1cbiAgY29uc3QgZm4gPSBkLnZhbHVlXG4gIGQudmFsdWUgPSBmdW5jdGlvbiBfZngoKSB7XG4gICAgaWYgKHRoaXNbX19lZmZlY3RzX19dLmhhcyhfZngpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VmZmVjdCBjYW5ub3QgYmUgaW52b2tlZCBtb3JlIHRoYW4gb25jZS4nKVxuICAgIH1cbiAgICBjb25zdCBkaXNwb3NlID0gZWZmZWN0KGZuLCB0aGlzKVxuICAgIHRoaXNbX19lZmZlY3RzX19dLnNldChfZngsIGRpc3Bvc2UpXG4gICAgcmV0dXJuIGRpc3Bvc2VcbiAgfVxuICBkLnZhbHVlW19fZnhfX10gPSB0cnVlXG4gIHJldHVybiBkXG59XG5cbmV4cG9ydCBjb25zdCBpbml0OiB7XG4gICh0OiBvYmplY3QsIGs6IHN0cmluZywgZDogUHJvcGVydHlEZXNjcmlwdG9yKTogUHJvcGVydHlEZXNjcmlwdG9yXG59ID0gZnVuY3Rpb24gaW5pdERlY29yYXRvcih0OiBvYmplY3QgfCAoKCkgPT4gdW5rbm93biksIGs/OiBzdHJpbmcsIGQ/OiBQcm9wZXJ0eURlc2NyaXB0b3IpOiBhbnkge1xuICBjb25zdCBmbiA9IGQudmFsdWVcbiAgZC52YWx1ZSA9IGZ1bmN0aW9uIF9meCgpIHtcbiAgICBpZiAodGhpc1tfX2VmZmVjdHNfX10uaGFzKF9meCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRWZmZWN0IGNhbm5vdCBiZSBpbnZva2VkIG1vcmUgdGhhbiBvbmNlLicpXG4gICAgfVxuICAgIGNvbnN0IGRpc3Bvc2UgPSBlZmZlY3QoZnVuY3Rpb24gX2luaXQoKSB7XG4gICAgICB1bnRyYWNrKClcbiAgICAgIGZuLmNhbGwodGhpcylcbiAgICB9LCB0aGlzKVxuICAgIHRoaXNbX19lZmZlY3RzX19dLnNldChfZngsIGRpc3Bvc2UpXG4gICAgcmV0dXJuIGRpc3Bvc2VcbiAgfVxuICBkLnZhbHVlW19fZnhfX10gPSB0cnVlXG4gIHJldHVybiBkXG59XG5cbi8vIGV4cG9ydCBjb25zdCB1bndyYXA6IHtcbi8vICAgKHQ6IG9iamVjdCwgazogc3RyaW5nLCBkOiBQcm9wZXJ0eURlc2NyaXB0b3IpOiBQcm9wZXJ0eURlc2NyaXB0b3Jcbi8vIH0gPSBmdW5jdGlvbiB1bndyYXBEZWNvcmF0b3IodDogb2JqZWN0IHwgKCgpID0+IHVua25vd24pLCBrPzogc3RyaW5nLCBkPzogUHJvcGVydHlEZXNjcmlwdG9yKTogYW55IHtcbi8vICAgZC52YWx1ZVtfX3Vud3JhcF9fXSA9IHRydWVcbi8vICAgcmV0dXJuIGRcbi8vIH1cblxuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcDxULCBVPihpdDogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFU+LCBjYjogKHY6IFUpID0+IFQsIGluaXQ/OiB1bmtub3duKTogVCB8IHVuZGVmaW5lZFxuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcDxUPihvYmo6IFQsIGluaXQ/OiB1bmtub3duKTogVW53cmFwPFQ+XG5leHBvcnQgZnVuY3Rpb24gdW53cmFwPFQ+KG9iajogVCwgaW5pdD86IHVua25vd24sIGluaXQyPzogdW5rbm93bik6IFVud3JhcDxUPiB7XG4gIHJldHVybiB7XG4gICAgW19fcHJvcF9fXTogdHlwZW9mIGluaXQgPT09ICdmdW5jdGlvbidcbiAgICAgID8ge1xuICAgICAgICBbX191bndyYXBfX106IG9iaixcbiAgICAgICAgY2I6IGluaXQsXG4gICAgICAgIGluaXQ6IGluaXQyXG4gICAgICB9XG4gICAgICA6IHtcbiAgICAgICAgW19fdW53cmFwX19dOiBvYmosXG4gICAgICAgIGluaXRcbiAgICAgIH1cbiAgfSBhcyBhbnlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb208VCBleHRlbmRzIG9iamVjdD4oaXQ6IFQpOiBUIHtcbiAgY29uc3QgcGF0aDogc3RyaW5nW10gPSBbXVxuICBjb25zdCBwcm94eSA9IG5ldyBQcm94eShpdCwge1xuICAgIGdldCh0YXJnZXQ6IGFueSwga2V5OiBzdHJpbmcgfCBzeW1ib2wpIHtcbiAgICAgIGlmIChrZXkgPT09IF9fcHJvcF9fIHx8IGtleSA9PT0gU3ltYm9sLnRvUHJpbWl0aXZlKSByZXR1cm4geyBpdCwgcGF0aCB9XG4gICAgICBpZiAoa2V5ID09PSBfX3NpZ25hbF9fKSByZXR1cm5cbiAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3ltYm9sJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0F0dGVtcHQgdG8gYWNjZXNzIHVua25vd24gc3ltYm9sIGluIFwiZnJvbVwiOiAnICsga2V5LnRvU3RyaW5nKCkpXG4gICAgICB9XG4gICAgICBwYXRoLnB1c2goa2V5KVxuICAgICAgcmV0dXJuIHByb3h5XG4gICAgfVxuICB9KVxuICByZXR1cm4gcHJveHlcbn1cblxuZXhwb3J0IGNvbnN0ICQgPSBPYmplY3QuYXNzaWduKHMkLCB7XG4gIGRpc3Bvc2UsXG4gIGZuLFxuICBmeCxcbiAgaW5pdCxcbiAgYWxpYXMsXG4gIGZyb20sXG4gIHVud3JhcCxcbn0sIHV0aWwpXG5cbmV4cG9ydCBkZWZhdWx0ICRcblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RfU2lnbmFsKCkge1xuICAvLyBAZW52IGJyb3dzZXJcbiAgZGVzY3JpYmUoJ1NpZ25hbCcsICgpID0+IHtcbiAgICAvLyBpdCgnY2xhc3MgZGVjb3JhdG9yJywgKCkgPT4ge1xuICAgIC8vICAgbGV0IHJ1bnMgPSAwXG5cbiAgICAvLyAgIEByZWFjdGl2ZVxuICAgIC8vICAgY2xhc3MgRm9vIHtcbiAgICAvLyAgICAgeCA9IDBcbiAgICAvLyAgICAgZ2V0IHkoKSB7XG4gICAgLy8gICAgICAgcnVucysrXG4gICAgLy8gICAgICAgcmV0dXJuIHRoaXMueCArIDFcbiAgICAvLyAgICAgfVxuICAgIC8vICAgfVxuXG4gICAgLy8gICBjb25zdCBmb28gPSBuZXcgRm9vKClcblxuICAgIC8vICAgZXhwZWN0KGZvby55KS50b0VxdWFsKDEpXG4gICAgLy8gICBleHBlY3QocnVucykudG9FcXVhbCgxKVxuICAgIC8vICAgZXhwZWN0KGZvby55KS50b0VxdWFsKDEpXG4gICAgLy8gICBleHBlY3QocnVucykudG9FcXVhbCgxKVxuICAgIC8vICAgZm9vLnggPSAyXG4gICAgLy8gICBleHBlY3QoZm9vLnkpLnRvRXF1YWwoMylcbiAgICAvLyAgIGV4cGVjdChydW5zKS50b0VxdWFsKDIpXG4gICAgLy8gICBleHBlY3QoZm9vLnkpLnRvRXF1YWwoMylcbiAgICAvLyAgIGV4cGVjdChydW5zKS50b0VxdWFsKDIpXG4gICAgLy8gfSlcblxuICAgIC8vIGZpdCgnY2xhc3MgZGVjb3JhdG9yIHdpdGggaW5oZXJpdGFuY2UnLCAoKSA9PiB7XG4gICAgLy8gICBsZXQgcnVucyA9IDBcblxuICAgIC8vICAgQHJlYWN0aXZlXG4gICAgLy8gICBjbGFzcyBCYXIge1xuICAgIC8vICAgfVxuXG4gICAgLy8gICBAcmVhY3RpdmVcbiAgICAvLyAgIGNsYXNzIEZvbyBleHRlbmRzIEJhciB7XG4gICAgLy8gICAgIHggPSAwXG4gICAgLy8gICAgIGdldCB5KCkge1xuICAgIC8vICAgICAgIHJ1bnMrK1xuICAgIC8vICAgICAgIHJldHVybiB0aGlzLnggKyAxXG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cblxuICAgIC8vICAgY29uc3QgZm9vID0gbmV3IEZvbygpXG4gICAgLy8gICBjb25zb2xlLmxvZyhmb28pXG5cbiAgICAvLyAgIGV4cGVjdChmb28ueSkudG9FcXVhbCgxKVxuICAgIC8vICAgZXhwZWN0KHJ1bnMpLnRvRXF1YWwoMSlcbiAgICAvLyAgIGV4cGVjdChmb28ueSkudG9FcXVhbCgxKVxuICAgIC8vICAgZXhwZWN0KHJ1bnMpLnRvRXF1YWwoMSlcbiAgICAvLyAgIGZvby54ID0gMlxuICAgIC8vICAgZXhwZWN0KGZvby55KS50b0VxdWFsKDMpXG4gICAgLy8gICBleHBlY3QocnVucykudG9FcXVhbCgyKVxuICAgIC8vICAgZXhwZWN0KGZvby55KS50b0VxdWFsKDMpXG4gICAgLy8gICBleHBlY3QocnVucykudG9FcXVhbCgyKVxuICAgIC8vIH0pXG5cbiAgICBpdCgnZm4gcHJvdG8nLCAoKSA9PiB7XG4gICAgICBsZXQgcnVucyA9IDBcblxuICAgICAgY2xhc3MgRm9vIHtcbiAgICAgICAgeD86IG51bWJlclxuICAgICAgICB5PzogbnVtYmVyXG4gICAgICAgIEBmeCByZWFkKCkge1xuICAgICAgICAgIGNvbnN0IHsgeCwgeSB9ID0gJC5vZih0aGlzKVxuICAgICAgICAgIHJ1bnMrK1xuICAgICAgICB9XG4gICAgICAgIEBmbiB1cGRhdGUoKSB7XG4gICAgICAgICAgdGhpcy54KytcbiAgICAgICAgICB0aGlzLnkrK1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZvbyA9IHMkKG5ldyBGb28oKSlcblxuICAgICAgZm9vLnVwZGF0ZSgpXG4gICAgICBleHBlY3QocnVucykudG9FcXVhbCgxKVxuICAgICAgZm9vLnVwZGF0ZSgpXG4gICAgICBleHBlY3QocnVucykudG9FcXVhbCgyKVxuICAgIH0pXG4gICAgaXQoJ2ZuIHByb3AnLCAoKSA9PiB7XG4gICAgICBsZXQgcnVucyA9IDBcblxuICAgICAgY2xhc3MgRm9vIHtcbiAgICAgICAgeD86IG51bWJlclxuICAgICAgICB5PzogbnVtYmVyXG4gICAgICAgIEBmeCByZWFkKCkge1xuICAgICAgICAgIGNvbnN0IHsgeCwgeSB9ID0gJC5vZih0aGlzKVxuICAgICAgICAgIHJ1bnMrK1xuICAgICAgICB9XG4gICAgICAgIEBmbiB1cGRhdGUgPSAoKSA9PiB7XG4gICAgICAgICAgdGhpcy54KytcbiAgICAgICAgICB0aGlzLnkrK1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZvbyA9IHMkKG5ldyBGb28oKSlcblxuICAgICAgZm9vLnVwZGF0ZSgpXG4gICAgICBleHBlY3QocnVucykudG9FcXVhbCgxKVxuICAgICAgZm9vLnVwZGF0ZSgpXG4gICAgICBleHBlY3QocnVucykudG9FcXVhbCgyKVxuICAgIH0pXG4gICAgaXQoJ2Z4JywgKCkgPT4ge1xuICAgICAgY29uc3QgcyA9ICQoeyB4OiAwIH0pXG4gICAgICBsZXQgcnVucyA9IDBcbiAgICAgIGNvbnN0IHJlczogYW55W10gPSBbXVxuICAgICAgZngoKCkgPT4ge1xuICAgICAgICBydW5zKytcbiAgICAgICAgcmVzLnB1c2gocy54KVxuICAgICAgfSlcbiAgICAgIHMueCA9IDFcbiAgICAgIGV4cGVjdChydW5zKS50b0VxdWFsKDIpXG4gICAgICBleHBlY3QocmVzKS50b0VxdWFsKFswLCAxXSlcbiAgICB9KVxuXG4gICAgaXQoJ21pcnJvciBzaWduYWxzIGluIGFub3RoZXIgc3RydWN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgYSA9ICQoeyB4OiAwIH0pXG4gICAgICBjb25zdCBiID0gJCh7IHk6IGEuJC54IH0pXG4gICAgICBleHBlY3QoYS54KS50b0VxdWFsKDApXG4gICAgICBleHBlY3QoYi55KS50b0VxdWFsKDApXG5cbiAgICAgIGEueCA9IDFcbiAgICAgIGV4cGVjdChhLngpLnRvRXF1YWwoMSlcbiAgICAgIGV4cGVjdChiLnkpLnRvRXF1YWwoMSlcbiAgICB9KVxuXG4gICAgaXQoJ21pcnJvciBjb21wdXRlZCBpbiBhbm90aGVyIHN0cnVjdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGEgPSAkKHtcbiAgICAgICAgdjogMCxcbiAgICAgICAgZ2V0IHgoKSB7IHJldHVybiB0aGlzLnYgfSxcbiAgICAgICAgc2V0IHgodikgeyB0aGlzLnYgPSB2IH0sXG4gICAgICB9KVxuICAgICAgY29uc3QgYiA9ICQoeyB5OiBhLiQueCB9KVxuICAgICAgZXhwZWN0KGEueCkudG9FcXVhbCgwKVxuICAgICAgZXhwZWN0KGIueSkudG9FcXVhbCgwKVxuXG4gICAgICBhLnggPSAxXG4gICAgICBleHBlY3QoYS54KS50b0VxdWFsKDEpXG4gICAgICBleHBlY3QoYi55KS50b0VxdWFsKDEpXG4gICAgfSlcblxuICAgIGl0KCdjb21wdXRlZCBtaXJyb3IgY2FuIGJlIGluIHByb3BzJywgKCkgPT4ge1xuICAgICAgY29uc3QgYSA9ICQoe1xuICAgICAgICB2OiAwLFxuICAgICAgICBnZXQgeCgpIHsgcmV0dXJuIHRoaXMudiB9LFxuICAgICAgICBzZXQgeCh2KSB7IHRoaXMudiA9IHYgfSxcbiAgICAgIH0pXG4gICAgICBjb25zdCBiID0gJCh7IHk6IGEuJC54IH0sIHsgeTogNSB9KVxuICAgICAgZXhwZWN0KGEueCkudG9FcXVhbCg1KVxuICAgICAgZXhwZWN0KGIueSkudG9FcXVhbCg1KVxuICAgIH0pXG5cbiAgICBpdCgnY29tcHV0ZWQgYWxpYXMgbWlycm9yIGNhbiBiZSBpbiBwcm9wcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGEgPSAkKG5ldyBjbGFzcyB7XG4gICAgICAgIHYgPSAwXG4gICAgICAgIGdldCB4KCkgeyByZXR1cm4gdGhpcy52IH1cbiAgICAgICAgc2V0IHgodikgeyB0aGlzLnYgPSB2IH1cbiAgICAgICAgeiA9IGFsaWFzKHRoaXMsICd4JylcbiAgICAgIH0pXG4gICAgICBjb25zdCBiID0gJCh7IHk6IGEuJC56IH0sIHsgeTogNSB9KVxuICAgICAgZXhwZWN0KGEueCkudG9FcXVhbCg1KVxuICAgICAgZXhwZWN0KGIueSkudG9FcXVhbCg1KVxuICAgIH0pXG5cbiAgICBpdCgnY29tcHV0ZWQgYWxpYXMgbWlycm9yIHdpdGggcHJvcGVydGllcyBjYW4gYmUgaW4gcHJvcHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhMSA9ICQobmV3IGNsYXNzIHtcbiAgICAgICAgdiA9IDBcbiAgICAgICAgZ2V0IHgoKSB7IHJldHVybiB0aGlzLnYgfVxuICAgICAgICBzZXQgeCh2KSB7IHRoaXMudiA9IHYgfVxuICAgICAgICB6ID0gYWxpYXModGhpcywgJ3gnKVxuXG4gICAgICB9KVxuICAgICAgY29uc3QgYTIgPSAkKG5ldyBjbGFzcyB7XG4gICAgICAgIHYgPSAwXG4gICAgICAgIGdldCB4KCkgeyByZXR1cm4gdGhpcy52IH1cbiAgICAgICAgc2V0IHgodikgeyB0aGlzLnYgPSB2IH1cbiAgICAgICAgeiA9IGFsaWFzKHRoaXMsICd4JylcbiAgICAgIH0sIHsgeDogYTEuJC54IH0pXG4gICAgICBjb25zdCBiID0gJCh7IHk6IGExLiQueiB9LCB7IHk6IDUgfSlcbiAgICAgIGV4cGVjdChhMS54KS50b0VxdWFsKDUpXG4gICAgICBleHBlY3QoYTIueCkudG9FcXVhbCg1KVxuICAgICAgZXhwZWN0KGIueSkudG9FcXVhbCg1KVxuICAgIH0pXG5cbiAgICBpdCgnbWlycm9yIGFsaWFzIGluIGFub3RoZXIgc3RydWN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgYSA9ICQobmV3IGNsYXNzIHtcbiAgICAgICAgdiA9IDBcbiAgICAgICAgeCA9IGFsaWFzKHRoaXMsICd2JylcbiAgICAgIH0pXG4gICAgICBjb25zdCBiID0gJCh7IHk6IGEuJC54IH0pXG4gICAgICBleHBlY3QoYS54KS50b0VxdWFsKDApXG4gICAgICBleHBlY3QoYi55KS50b0VxdWFsKDApXG5cbiAgICAgIGEueCA9IDFcbiAgICAgIGV4cGVjdChhLngpLnRvRXF1YWwoMSlcbiAgICAgIGV4cGVjdChiLnkpLnRvRXF1YWwoMSlcbiAgICB9KVxuXG4gICAgLy8gaXQoJ2ludmFsaWQgc2lnbmFsIHR5cGUgZXJyb3InLCAoKSA9PiB7XG4gICAgLy8gICBleHBlY3QoKCkgPT4ge1xuICAgIC8vICAgICBjb25zdCB4ID0gJChjbGFzcyB7IH0pXG4gICAgLy8gICB9KS50b1Rocm93KEVyci5JbnZhbGlkU2lnbmFsVHlwZSlcbiAgICAvLyB9KVxuXG4gICAgZGVzY3JpYmUoJ2Z4JywgKCkgPT4ge1xuICAgICAgaXQoJ2d1YXJkJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBhID0gJCh7IGZvbzogbnVsbCB9KVxuICAgICAgICBjb25zdCByZXMgPSBbXVxuICAgICAgICBsZXQgY291bnQgPSAwXG4gICAgICAgICQuZngoKCkgPT4ge1xuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICBjb25zdCB7IGZvbyB9ID0gJC5vZihhKVxuICAgICAgICAgIHJlcy5wdXNoKGZvbylcbiAgICAgICAgfSlcbiAgICAgICAgZXhwZWN0KGNvdW50KS50b0VxdWFsKDEpXG4gICAgICAgIGV4cGVjdChyZXMpLnRvRXF1YWwoW10pXG4gICAgICAgIGEuZm9vID0gNDJcbiAgICAgICAgZXhwZWN0KGNvdW50KS50b0VxdWFsKDIpXG4gICAgICAgIGV4cGVjdChyZXMpLnRvRXF1YWwoWzQyXSlcbiAgICAgIH0pXG5cbiAgICAgIGl0KCdzdGlsbCBhbGxvd3Mgb3RoZXIgZXJyb3JzJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBhID0gJCh7IGZvbzogbnVsbCB9KVxuICAgICAgICBsZXQgY291bnQgPSAwXG4gICAgICAgICQuZngoKCkgPT4ge1xuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICBjb25zdCB7IGZvbyB9ID0gJC5vZihhKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZXJyZWQnKVxuICAgICAgICB9KVxuICAgICAgICBleHBlY3QoY291bnQpLnRvRXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICBhLmZvbyA9IDQyXG4gICAgICAgIH0pLnRvVGhyb3coJ2VycmVkJylcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGRlc2NyaWJlKCdvZicsICgpID0+IHtcbiAgICAgIGl0KCdlcnJvcnMgbm9ybWFsbHkgb3V0c2lkZSBvZiBmeCcsICgpID0+IHtcbiAgICAgICAgY29uc3QgYSA9IHsgeDogbnVsbCB9XG4gICAgICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgeyB4IH0gPSAkLm9mKGEpXG4gICAgICAgIH0pLnRvVGhyb3coJ1wieFwiJylcbiAgICAgIH0pXG5cbiAgICAgIGl0KCdlcnJvcnMgbm9ybWFsbHkgaW5zaWRlIGEgYmF0Y2ggaW5zaWRlIGFuIGZ4JywgKCkgPT4ge1xuICAgICAgICBjb25zdCBhID0gJCh7IGZvbzogbnVsbCB9KVxuICAgICAgICBjb25zdCBiID0geyB4OiBudWxsIH1cblxuICAgICAgICBsZXQgY291bnQgPSAwXG4gICAgICAgICQuZngoKCkgPT4ge1xuICAgICAgICAgIGNvdW50KytcbiAgICAgICAgICBjb25zdCB7IGZvbyB9ID0gJC5vZihhKVxuICAgICAgICAgICQuYmF0Y2goKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyB4IH0gPSAkLm9mKGIpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcblxuICAgICAgICBleHBlY3QoY291bnQpLnRvRXF1YWwoMSlcbiAgICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgICBhLmZvbyA9IDQyXG4gICAgICAgIH0pLnRvVGhyb3coJ1wieFwiJylcbiAgICAgIH0pXG5cbiAgICAgIGl0KCdvdXRlciBmeCBkb2VzIG5vdCBlcnJvciB3aGVuIGNhbGxlZCBmcm9tIHdpdGhpbiBiYXRjaCcsICgpID0+IHtcbiAgICAgICAgY29uc3QgYSA9ICQoeyBmb286IG51bGwgfSlcbiAgICAgICAgY29uc3QgYiA9ICQoeyB5OiBudWxsLCB4OiBudWxsIH0pXG5cbiAgICAgICAgbGV0IG91dCA9ICcnXG4gICAgICAgICQuZngoKCkgPT4ge1xuICAgICAgICAgIG91dCArPSAnYSdcbiAgICAgICAgICBjb25zdCB7IHksIHggfSA9ICQub2YoYilcbiAgICAgICAgICBvdXQgKz0gJ2InXG4gICAgICAgIH0pXG4gICAgICAgICQuZngoKCkgPT4ge1xuICAgICAgICAgIG91dCArPSAnYydcbiAgICAgICAgICBjb25zdCB7IGZvbyB9ID0gJC5vZihhKVxuICAgICAgICAgIG91dCArPSAnZCdcbiAgICAgICAgICAkLmJhdGNoKCgpID0+IHtcbiAgICAgICAgICAgIG91dCArPSAnZSdcbiAgICAgICAgICAgIGIueSA9IDJcbiAgICAgICAgICAgIG91dCArPSAnZidcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuXG4gICAgICAgIGEuZm9vID0gMVxuICAgICAgICBleHBlY3Qob3V0KS50b0VxdWFsKCdhY2NkZWZhJylcbiAgICAgICAgYi54ID0gM1xuICAgICAgICBleHBlY3Qob3V0KS50b0VxdWFsKCdhY2NkZWZhYWInKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgZGVzY3JpYmUoJ2dlbmVyYXRvciBzaWduYWwnLCAoKSA9PiB7XG4gICAgICBpdCgndW53cmFwIGFzeW5jIGdlbmVyYXRvcicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IHggPSAwXG4gICAgICAgIGNsYXNzIEZvbyB7XG4gICAgICAgICAgYmFyID0gdW53cmFwKGFzeW5jIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCArK3hcbiAgICAgICAgICAgIGF3YWl0IHRpbWVvdXQoMTApXG4gICAgICAgICAgICB5aWVsZCArK3hcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG8gPSAkKG5ldyBGb28pXG4gICAgICAgIGV4cGVjdChvLmJhcikudG9CZVVuZGVmaW5lZCgpXG4gICAgICAgIGF3YWl0IHRpY2tzKDIpXG4gICAgICAgIGV4cGVjdChvLmJhcikudG9FcXVhbCgxKVxuICAgICAgICBhd2FpdCB0aW1lb3V0KDIwKVxuICAgICAgICBleHBlY3Qoby5iYXIpLnRvRXF1YWwoMilcbiAgICAgIH0pXG4gICAgICBpdCgndW53cmFwIGFzeW5jIGl0ZXJhYmxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgeCA9IDBcbiAgICAgICAgbGV0IGNhbGxiYWNrOiBhbnlcbiAgICAgICAgZnVuY3Rpb24gZm9vKGNiOiAocmVzOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICAgICAgICBjYWxsYmFjayA9IGNiXG4gICAgICAgIH1cbiAgICAgICAgY2xhc3MgRm9vIHtcbiAgICAgICAgICBiYXIgPSB1bndyYXAoYXN5bmMgZnVuY3Rpb24qIGJhcnMoKSB7XG4gICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IG4gb2YgaXRlcmlmeShmb28pKSB7XG4gICAgICAgICAgICAgIHlpZWxkIG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG8gPSAkKG5ldyBGb28pXG4gICAgICAgIGV4cGVjdChvLmJhcikudG9CZVVuZGVmaW5lZCgpXG4gICAgICAgIGNhbGxiYWNrKCsreClcbiAgICAgICAgYXdhaXQgdGlja3MoMylcbiAgICAgICAgZXhwZWN0KG8uYmFyKS50b0VxdWFsKDEpXG4gICAgICAgIGNhbGxiYWNrKCsreClcbiAgICAgICAgYXdhaXQgdGlja3MoMSlcbiAgICAgICAgZXhwZWN0KG8uYmFyKS50b0VxdWFsKDEpXG4gICAgICB9KVxuICAgICAgaXQoJ3Vud3JhcCBhc3luYyBnZW5lcmF0b3Igd2l0aCBpbml0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgeCA9IDBcbiAgICAgICAgY2xhc3MgRm9vIHtcbiAgICAgICAgICBiYXIgPSB1bndyYXAoYXN5bmMgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkICsreFxuICAgICAgICAgICAgYXdhaXQgdGltZW91dCgxMClcbiAgICAgICAgICAgIHlpZWxkICsreFxuICAgICAgICAgIH0sICsreClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvID0gJChuZXcgRm9vKVxuICAgICAgICBleHBlY3Qoby5iYXIpLnRvRXF1YWwoMSlcbiAgICAgICAgYXdhaXQgdGlja3MoMilcbiAgICAgICAgZXhwZWN0KG8uYmFyKS50b0VxdWFsKDIpXG4gICAgICAgIGF3YWl0IHRpbWVvdXQoMjApXG4gICAgICAgIGV4cGVjdChvLmJhcikudG9FcXVhbCgzKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxufVxuIiwgIi8vIGxvZy5hY3RpdmVcbmltcG9ydCB7ICQsIGZuLCBmeCB9IGZyb20gJ3NpZ25hbCdcbmltcG9ydCB7IGNsYW1wIH0gZnJvbSAndXRpbHMnXG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbUl0ZW0ge1xuICBjb2VmZjogbnVtYmVyXG4gIHVwZGF0ZShkZWx0YVRpbWU6IG51bWJlcik6IG51bWJlclxuICB1cGRhdGVPbmUoZGVsdGFUaW1lOiBudW1iZXIpOiBudW1iZXJcbiAgZHJhdyh0OiBudW1iZXIpOiB2b2lkXG59XG5cbmV4cG9ydCBjbGFzcyBBbmltIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy50aWNrID0gdGhpcy50aWNrLmJpbmQodGhpcylcbiAgfVxuXG4gIGl0ZW1zOiBBbmltSXRlbVtdID0gW11cbiAgaXNBbmltYXRpbmcgPSBmYWxzZVxuXG4gIHN0YXJ0VGltZSA9IDBcbiAgdGlja1RpbWUgPSAwXG4gIGFjYyA9IDBcbiAgZnBzID0gNjBcbiAgZ2V0IGNvZWZmKCkge1xuICAgIHJldHVybiAoNjAgLyB0aGlzLmZwcykgKiAwLjI1XG4gIH1cbiAgZ2V0IHRpbWVTdGVwKCkge1xuICAgIHJldHVybiAoMTAwMCAvIHRoaXMuZnBzKSB8IDBcbiAgfVxuICBnZXQgbWF4RGVsdGFUaW1lKCkge1xuICAgIHJldHVybiB0aGlzLnRpbWVTdGVwICogNVxuICB9XG5cbiAgQGZuIHRpY2soKSB7XG4gICAgY29uc3QgeyB0aW1lU3RlcCwgbWF4RGVsdGFUaW1lLCB0aWNrVGltZSwgY29lZmYgfSA9IHRoaXNcblxuICAgIGxldCBuZWVkTmV4dEZyYW1lID0gdHJ1ZVxuXG4gICAgY29uc3Qgbm93ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICBjb25zdCBkdCA9IG5vdyAtIHRpY2tUaW1lXG4gICAgdGhpcy50aWNrVGltZSA9IG5vd1xuXG4gICAgLy8gaWYgKGR0ID4gbWF4RGVsdGFUaW1lKSB7XG4gICAgLy8gICAvLyE6IGRpc2NhcmRcbiAgICAvLyAgIHJldHVyblxuICAgIC8vIH1cblxuICAgIC8vITogdGlja1xuICAgIHRoaXMuYWNjICs9IGR0XG5cbiAgICBpZiAodGhpcy5hY2MgPiB0aW1lU3RlcCkge1xuICAgICAgdGhpcy5hY2MgLT0gdGltZVN0ZXBcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLml0ZW1zKSB7XG4gICAgICAgIGl0ZW0uY29lZmYgPSBjb2VmZlxuICAgICAgICBpZiAoaXRlbS51cGRhdGUoZHQpKSB7XG4gICAgICAgICAgbmVlZE5leHRGcmFtZSA9IHRydWVcbiAgICAgICAgfVxuICAgICAgICBpZiAobmVlZE5leHRGcmFtZSkge1xuICAgICAgICAgIGl0ZW0udXBkYXRlT25lKGR0KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgd2hpbGUgKHRoaXMuYWNjID4gdGltZVN0ZXApIHtcbiAgICAgIHRoaXMuYWNjIC09IHRpbWVTdGVwXG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy5pdGVtcykge1xuICAgICAgICBpZiAoaXRlbS51cGRhdGUoZHQpKSB7XG4gICAgICAgICAgbmVlZE5leHRGcmFtZSA9IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHQgPSBjbGFtcCgwLCAxLCB0aGlzLmFjYyAvIHRpbWVTdGVwKVxuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMuaXRlbXMpIHtcbiAgICAgIGl0ZW0uZHJhdyh0KVxuICAgIH1cblxuICAgIGlmICh0aGlzLmlzQW5pbWF0aW5nICYmIG5lZWROZXh0RnJhbWUpIHtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnRpY2spXG4gICAgfVxuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgaWYgKHRoaXMuaXNBbmltYXRpbmcpIHJldHVyblxuICAgIC8vITogc3RhcnRcbiAgICB0aGlzLmlzQW5pbWF0aW5nID0gdHJ1ZVxuICAgIHRoaXMudGlja1RpbWUgPSB0aGlzLnN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgdGhpcy50aWNrKClcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgLy8hOiBzdG9wXG4gICAgdGhpcy5pc0FuaW1hdGluZyA9IGZhbHNlXG4gIH1cbn1cbiIsICJpbXBvcnQgeyAkLCB1bndyYXAgfSBmcm9tICdzaWduYWwnXG5pbXBvcnQgeyBvbiB9IGZyb20gJ3V0aWxzJ1xuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuL3BvaW50J1xuXG5leHBvcnQgY2xhc3MgU2NyZWVuIHtcbiAgdmlld3BvcnQgPSAkKG5ldyBQb2ludClcbiAgcHIgPSB1bndyYXAoXG4gICAgb24od2luZG93LCAncmVzaXplJywgeyB1bnNhZmVJbml0aWFsOiB0cnVlIH0pLFxuICAgICgpID0+IHtcbiAgICAgIHRoaXMudmlld3BvcnQudyA9IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgICB0aGlzLnZpZXdwb3J0LmggPSB3aW5kb3cuaW5uZXJIZWlnaHRcbiAgICAgIHJldHVybiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpb1xuICAgIH0sXG4gICAgd2luZG93LmRldmljZVBpeGVsUmF0aW9cbiAgKVxufVxuIiwgImltcG9ydCB7ICQsIGZuLCBmeCwgaW5pdCB9IGZyb20gJ3NpZ25hbCdcbmltcG9ydCB7IEFuaW0gfSBmcm9tICcuL2FuaW0nXG5pbXBvcnQgeyBTY3JlZW4gfSBmcm9tICcuL3NjcmVlbidcblxuZXhwb3J0IGNsYXNzIFdvcmxkIHtcbiAgc3RhdGljIEN1cnJlbnQ6ICQ8V29ybGQ+XG4gIHNjcmVlbiA9ICQobmV3IFNjcmVlbilcbiAgYW5pbSA9ICQobmV3IEFuaW0pXG4gIGlzQW5pbWF0aW5nID0gdGhpcy5hbmltLiQuaXNBbmltYXRpbmdcbiAgQGluaXQgaW5pdCgpIHtcbiAgICBXb3JsZC5DdXJyZW50ID0gJCh0aGlzKVxuICB9XG59XG4iLCAiaW1wb3J0IHsgV29ybGQgfSBmcm9tICcuL3dvcmxkJ1xuXG5leHBvcnQgY2xhc3MgU2hhcGUge1xuICBsYWJlbD86IHN0cmluZ1xuICBzdHJva2VDb2xvciA9ICcjM2YzJ1xuICBmaWxsQ29sb3IgPSAnIzkyZSdcbiAgZ2V0IHByKCkge1xuICAgIHJldHVybiBXb3JsZC5DdXJyZW50LnNjcmVlbi5wclxuICB9XG4gIGdldCB2YWx1ZXMoKTogcmVhZG9ubHkgbnVtYmVyW10geyByZXR1cm4gW10gfVxuICBnZXQgdGV4dCgpIHtcbiAgICByZXR1cm4gKHRoaXMubGFiZWwgPyBgJHt0aGlzLmxhYmVsfTogYCA6ICcnKVxuICAgICAgKyB0aGlzLnZhbHVlcy5qb2luKCcgJylcbiAgfVxufVxuIiwgImltcG9ydCB7ICQsIGFsaWFzLCBmbiB9IGZyb20gJ3NpZ25hbCdcbmltcG9ydCB0eXBlIHsgTWF0cml4TGlrZSB9IGZyb20gJy4vbWF0cml4LnRzJ1xuaW1wb3J0IHR5cGUgeyBSZWN0IH0gZnJvbSAnLi9yZWN0LnRzJ1xuaW1wb3J0IHsgU2hhcGUgfSBmcm9tICcuL3NoYXBlLnRzJ1xuXG5leHBvcnQgdHlwZSBQb2ludExpa2UgPSBQb2ludFsnanNvbiddXG5cbmV4cG9ydCBjbGFzcyBQb2ludCBleHRlbmRzIFNoYXBlIHtcbiAgeCA9IDBcbiAgeSA9IDBcblxuICBnZXQganNvbigpIHtcbiAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXNcbiAgICByZXR1cm4geyB4LCB5IH1cbiAgfVxuICBnZXQgdmFsdWVzKCkge1xuICAgIGNvbnN0IHsgeCwgeSB9ID0gdGhpc1xuICAgIHJldHVybiBbeCwgeV0gYXMgY29uc3RcbiAgfVxuICBnZXQgd2hQeCgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IHRoaXMud2lkdGggKyAncHgnLFxuICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCArICdweCcsXG4gICAgfVxuICB9XG4gIGdldCB3aCgpIHtcbiAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHRoaXNcbiAgICByZXR1cm4geyB3aWR0aCwgaGVpZ2h0IH1cbiAgfVxuICB4eSA9IGFsaWFzKHRoaXMsICdqc29uJylcblxuICBsZWZ0ID0gYWxpYXModGhpcywgJ3gnKVxuICB0b3AgPSBhbGlhcyh0aGlzLCAneScpXG4gIHJpZ2h0ID0gYWxpYXModGhpcywgJ3knKVxuICBib3R0b20gPSBhbGlhcyh0aGlzLCAneCcpXG5cbiAgbCA9IGFsaWFzKHRoaXMsICdsZWZ0JylcbiAgciA9IGFsaWFzKHRoaXMsICdyaWdodCcpXG4gIHQgPSBhbGlhcyh0aGlzLCAndG9wJylcbiAgYiA9IGFsaWFzKHRoaXMsICdib3R0b20nKVxuXG4gIHcgPSBhbGlhcyh0aGlzLCAneCcpXG4gIGggPSBhbGlhcyh0aGlzLCAneScpXG5cbiAgd2lkdGggPSBhbGlhcyh0aGlzLCAneCcpXG4gIGhlaWdodCA9IGFsaWFzKHRoaXMsICd5JylcblxuICBjb2wgPSBhbGlhcyh0aGlzLCAneCcpXG4gIGxpbmUgPSBhbGlhcyh0aGlzLCAneScpXG4gIGdldCBsaW5lQ29sKCkge1xuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIHJlc2l6ZVRvV2luZG93KCkge1xuICAgIHRoaXMudyA9IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgdGhpcy5oID0gd2luZG93LmlubmVySGVpZ2h0XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBlcXVhbHMobzogUG9pbnRMaWtlIHwgbnVtYmVyKSB7XG4gICAgaWYgKHR5cGVvZiBvID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuIHRoaXMueCA9PT0gbyAmJiB0aGlzLnkgPT09IG9cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy54ID09PSBvLnggJiYgdGhpcy55ID09PSBvLnlcbiAgICB9XG4gIH1cbiAgc2FmZSgpIHtcbiAgICAkLmZ4KCgpID0+IHtcbiAgICAgIHRoaXMuZmluaXRlKClcbiAgICB9KVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgY29weSgpIHtcbiAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXNcbiAgICByZXR1cm4gJChuZXcgUG9pbnQsIHsgeCwgeSB9KVxuICB9XG4gIHplcm8oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KDApXG4gIH1cbiAgZ2V0IGlmTm90WmVybygpOiB0aGlzIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuZXF1YWxzKDApKSByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiBzZXQobzogUG9pbnRMaWtlIHwgbnVtYmVyKSB7XG4gICAgaWYgKHR5cGVvZiBvID09PSAnbnVtYmVyJykge1xuICAgICAgdGhpcy54ID0gb1xuICAgICAgdGhpcy55ID0gb1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMueCA9IG8ueFxuICAgICAgdGhpcy55ID0gby55XG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIHNldEZyb21FdmVudChvOiB7IHBhZ2VYOiBudW1iZXIsIHBhZ2VZOiBudW1iZXIgfSkge1xuICAgIHRoaXMueCA9IG8ucGFnZVhcbiAgICB0aGlzLnkgPSBvLnBhZ2VZXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gYWRkKG86IFBvaW50TGlrZSB8IG51bWJlcikge1xuICAgIGlmICh0eXBlb2YgbyA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMueCArPSBvXG4gICAgICB0aGlzLnkgKz0gb1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMueCArPSBvLnhcbiAgICAgIHRoaXMueSArPSBvLnlcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gc3ViKG86IFBvaW50TGlrZSB8IG51bWJlcikge1xuICAgIGlmICh0eXBlb2YgbyA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMueCAtPSBvXG4gICAgICB0aGlzLnkgLT0gb1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMueCAtPSBvLnhcbiAgICAgIHRoaXMueSAtPSBvLnlcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gZGl2KG86IFBvaW50TGlrZSB8IG51bWJlcikge1xuICAgIGlmICh0eXBlb2YgbyA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMueCAvPSBvXG4gICAgICB0aGlzLnkgLz0gb1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMueCAvPSBvLnhcbiAgICAgIHRoaXMueSAvPSBvLnlcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gbXVsKG86IFBvaW50TGlrZSB8IG51bWJlcikge1xuICAgIGlmICh0eXBlb2YgbyA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMueCAqPSBvXG4gICAgICB0aGlzLnkgKj0gb1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMueCAqPSBvLnhcbiAgICAgIHRoaXMueSAqPSBvLnlcbiAgICB9XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gcG93KG86IFBvaW50TGlrZSB8IG51bWJlcikge1xuICAgIGlmICh0eXBlb2YgbyA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMueCAqKj0gb1xuICAgICAgdGhpcy55ICoqPSBvXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy54ICoqPSBvLnhcbiAgICAgIHRoaXMueSAqKj0gby55XG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgbm9ybWFsaXplKCkge1xuICAgIHJldHVybiB0aGlzLmRpdih0aGlzLm1hZylcbiAgfVxuICBAZm4gZmluaXRlKCkge1xuICAgIGNvbnN0IHsgeCwgeSB9ID0gdGhpc1xuICAgIHRoaXMueCA9ICFpc0Zpbml0ZSh4KSA/IDAgOiB4XG4gICAgdGhpcy55ID0gIWlzRmluaXRlKHkpID8gMCA6IHlcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiBmbG9vcigpIHtcbiAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXNcbiAgICB0aGlzLnggPSBNYXRoLmZsb29yKHgpXG4gICAgdGhpcy55ID0gTWF0aC5mbG9vcih5KVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIGNlaWwoKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgdGhpcy54ID0gTWF0aC5jZWlsKHgpXG4gICAgdGhpcy55ID0gTWF0aC5jZWlsKHkpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gcm91bmQoKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgdGhpcy54ID0gTWF0aC5yb3VuZCh4KVxuICAgIHRoaXMueSA9IE1hdGgucm91bmQoeSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiBuZWcoKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgdGhpcy54ID0gLXhcbiAgICB0aGlzLnkgPSAteVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIHNxcnQoKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgdGhpcy54ID0gTWF0aC5zcXJ0KHgpXG4gICAgdGhpcy55ID0gTWF0aC5zcXJ0KHkpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBnZXQgYW5nbGUoKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgcmV0dXJuIE1hdGguYXRhbjIoeSwgeClcbiAgfVxuICBAZm4gYW5nbGVTaGlmdEJ5KGFuZ2xlOiBudW1iZXIsIGRpc3RhbmNlOiBudW1iZXIpIHtcbiAgICB0aGlzLnggKz0gZGlzdGFuY2UgKiBNYXRoLmNvcyhhbmdsZSlcbiAgICB0aGlzLnkgKz0gZGlzdGFuY2UgKiBNYXRoLnNpbihhbmdsZSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGdldCBhYnNTdW0oKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgcmV0dXJuIE1hdGguYWJzKHgpICsgTWF0aC5hYnMoeSlcbiAgfVxuICBnZXQgc3VtKCkge1xuICAgIGNvbnN0IHsgeCwgeSB9ID0gdGhpc1xuICAgIHJldHVybiB4ICsgeVxuICB9XG4gIGdldCBtYWcoKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgcmV0dXJuIE1hdGguc3FydCh4ICogeCArIHkgKiB5KVxuICB9XG4gIGNoZWJ5c2hldihvPzogUG9pbnRMaWtlKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgcmV0dXJuIE1hdGgubWF4KFxuICAgICAgTWF0aC5hYnMobz8ueCA/PyB4KSxcbiAgICAgIE1hdGguYWJzKG8/LnkgPz8geSlcbiAgICApXG4gIH1cbiAgbWFuaGF0dGFuKG8/OiBQb2ludExpa2UpIHtcbiAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXNcbiAgICByZXR1cm4gTWF0aC5hYnMobz8ueCA/PyB4KVxuICAgICAgKyBNYXRoLmFicyhvPy55ID8/IHkpXG4gIH1cbiAgZGlzdGFuY2UobzogUG9pbnRMaWtlKSB7XG4gICAgcmV0dXJuIHRlbXAuc2V0KG8pLnN1Yih0aGlzKS5tYWdcbiAgfVxuICBldWNsaWRlYW4gPSBhbGlhcyh0aGlzLCAnZGlzdGFuY2UnKVxuICBAZm4gdHJhbnNmb3JtTWF0cml4KG06IE1hdHJpeExpa2UpIHtcbiAgICBjb25zdCB7IGEsIGIsIGMsIGQsIGUsIGYgfSA9IG1cbiAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXNcbiAgICB0aGlzLnggPSBhICogeCArIGMgKiB5ICsgZVxuICAgIHRoaXMueSA9IGIgKiB4ICsgZCAqIHkgKyBmXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gdHJhbnNmb3JtTWF0cml4SW52ZXJzZShtOiBNYXRyaXhMaWtlKSB7XG4gICAgY29uc3QgeyBhLCBiLCBjLCBkLCBlLCBmIH0gPSBtXG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG5cbiAgICBjb25zdCBkZXQgPSBhICogZCAtIGIgKiBjXG5cbiAgICBpZiAoZGV0ID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNYXRyaXggaXMgbm90IGludmVydGlibGUuXCIpXG4gICAgfVxuXG4gICAgY29uc3QgaWRldCA9IDEgLyBkZXRcbiAgICBjb25zdCBpbnZBID0gZCAqIGlkZXRcbiAgICBjb25zdCBpbnZCID0gLWIgKiBpZGV0XG4gICAgY29uc3QgaW52QyA9IC1jICogaWRldFxuICAgIGNvbnN0IGludkQgPSBhICogaWRldFxuICAgIGNvbnN0IGludkUgPSAoYyAqIGYgLSBlICogZCkgKiBpZGV0XG4gICAgY29uc3QgaW52RiA9IChlICogYiAtIGEgKiBmKSAqIGlkZXRcblxuICAgIHRoaXMueCA9IGludkEgKiB4ICsgaW52QyAqIHkgKyBpbnZFXG4gICAgdGhpcy55ID0gaW52QiAqIHggKyBpbnZEICogeSArIGludkZcblxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIG5vcm1hbGl6ZU1hdHJpeChtOiBNYXRyaXhMaWtlKSB7XG4gICAgLy8gVE9ETzogbm9ybWFsaXplIHNrZXcgKGIgYylcbiAgICBjb25zdCB7IGEsIGIsIGMsIGQsIGUsIGYgfSA9IG1cbiAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXNcbiAgICB0aGlzLnggPSAoeCAtIGUpIC8gYVxuICAgIHRoaXMueSA9ICh5IC0gZikgLyBkXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gbGVycChvOiBQb2ludExpa2UsIHQ6IG51bWJlcikge1xuICAgIGNvbnN0IHsgeCwgeSB9ID0gdGhpc1xuICAgIHRoaXMueCArPSAoby54IC0geCkgKiB0XG4gICAgdGhpcy55ICs9IChvLnkgLSB5KSAqIHRcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiByYW5kKG8/OiBQb2ludExpa2UgfCBudW1iZXIsIHMgPSAxKSB7XG4gICAgaWYgKCFvKSBvID0gMVxuICAgIGlmICh0eXBlb2YgbyA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMueCA9IChNYXRoLnJhbmRvbSgpICoqIHMpICogb1xuICAgICAgdGhpcy55ID0gKE1hdGgucmFuZG9tKCkgKiogcykgKiBvXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy54ID0gKE1hdGgucmFuZG9tKCkgKiogcykgKiBvLnhcbiAgICAgIHRoaXMueSA9IChNYXRoLnJhbmRvbSgpICoqIHMpICogby55XG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgY2xlYXIoYzogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XG4gICAgY29uc3QgeyB3LCBoIH0gPSB0aGlzXG4gICAgYy5jbGVhclJlY3QoMCwgMCwgdywgaClcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIHN0cm9rZShcbiAgICBjOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsXG4gICAgY29sb3I6IHN0cmluZyA9IHRoaXMuc3Ryb2tlQ29sb3IpIHtcbiAgICBjb25zdCB7IHcsIGggfSA9IHRoaXNcbiAgICBjLnN0cm9rZVN0eWxlID0gY29sb3JcbiAgICBjLnN0cm9rZVJlY3QoMCwgMCwgdywgaClcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGZpbGwoXG4gICAgYzogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELFxuICAgIGNvbG9yOiBzdHJpbmcgPSB0aGlzLmZpbGxDb2xvcikge1xuICAgIGNvbnN0IHsgdywgaCB9ID0gdGhpc1xuICAgIGMuZmlsbFN0eWxlID0gY29sb3JcbiAgICBjLmZpbGxSZWN0KDAsIDAsIHcsIGgpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBtb3ZlVG8oYzogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XG4gICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzXG4gICAgYy5tb3ZlVG8oeCwgeSlcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGxpbmVUbyhjOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcbiAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXNcbiAgICBjLmxpbmVUbyh4LCB5KVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgd2l0aGluUmVjdChyOiBSZWN0KSB7XG4gICAgcmV0dXJuIHIuaXNQb2ludFdpdGhpbih0aGlzKVxuICB9XG4gIHRvdWNoUG9pbnQob3RoZXI6IFJlY3QsIGNlbnRlcj86IFBvaW50TGlrZSkge1xuICAgIGNlbnRlciA/Pz0gb3RoZXIuY2VudGVyXG4gICAgLy8gY29uc3Qgc2VsZiA9IHRoaXMgaW5zdGFuY2VvZiBSZWN0ID8gdGhpcyA6IG5ldyBQb2ludCgxLCAxKVxuICAgIGNvbnN0IGkgPSB0ZW1wLnNldCh0aGlzKVxuICAgICAgLmludGVyc2VjdFBvaW50KG90aGVyLCBjZW50ZXIpXG4gICAgICAuc3ViKG90aGVyLmNlbnRlcilcblxuICAgIHRoaXMueCA9IGkueCAvLy0gc2VsZi53aWR0aCAqIDAuNVxuICAgIHRoaXMueSA9IGkueSAvLy0gc2VsZi5oZWlnaHQgKiAwLjVcblxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgaW50ZXJzZWN0UG9pbnQob3RoZXI6IFJlY3QsIGNlbnRlcj86IFBvaW50TGlrZSkge1xuICAgIGNlbnRlciA/Pz0gb3RoZXIuY2VudGVyXG5cbiAgICBjb25zdCB3ID0gb3RoZXIudyAqIDAuNVxuICAgIGNvbnN0IGggPSBvdGhlci5oICogMC41XG4gICAgY29uc3QgZDogUG9pbnQgPSB0ZW1wLnNldChjZW50ZXIpLmFkZChvdGhlci5jZW50ZXIpXG5cbiAgICAvLyBpZiBBPUIgcmV0dXJuIEIgaXRzZWxmXG4gICAgY29uc3QgdGFuX3BoaSA9IGggLyB3XG4gICAgY29uc3QgdGFuX3RoZXRhID0gTWF0aC5hYnMoZC55IC8gZC54KVxuXG4gICAgLy8gdGVsbCBtZSBpbiB3aGljaCBxdWFkcmFudCB0aGUgQSBwb2ludCBpc1xuICAgIGNvbnN0IHF4ID0gTWF0aC5zaWduKGQueClcbiAgICBjb25zdCBxeSA9IE1hdGguc2lnbihkLnkpXG5cbiAgICBsZXQgeEksIHlJXG5cbiAgICBpZiAodGFuX3RoZXRhID4gdGFuX3BoaSkge1xuICAgICAgeEkgPSAoaCAvIHRhbl90aGV0YSkgKiBxeFxuICAgICAgeUkgPSBoICogcXlcbiAgICB9IGVsc2Uge1xuICAgICAgeEkgPSB3ICogcXhcbiAgICAgIHlJID0gdyAqIHRhbl90aGV0YSAqIHF5XG4gICAgfVxuXG4gICAgdGhpcy54ID0geElcbiAgICB0aGlzLnkgPSB5SVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxufVxuXG5jb25zdCB0ZW1wID0gJChuZXcgUG9pbnQpXG5cbi8vICAgICByYW5kb21JbkNpcmNsZSA9ICQuZm4oZnVuY3Rpb24gcG9pbnRfcmFuZG9tSW5DaXJjbGUoXG4vLyAgICAgICAkLCBjZW50ZXI6IFBvaW50TGlrZSwgcmFkaXVzOiBudW1iZXIpOiBQb2ludCB7XG4vLyAgICAgICBjb25zdCBkaWFtZXRlciA9IHJhZGl1cyAqIDJcbi8vICAgICAgICQueCA9IGNlbnRlci54IC0gcmFkaXVzICsgTWF0aC5yYW5kb20oKSAqIGRpYW1ldGVyXG4vLyAgICAgICAkLnkgPSBjZW50ZXIueSAtIHJhZGl1cyArIE1hdGgucmFuZG9tKCkgKiBkaWFtZXRlclxuLy8gICAgICAgcmV0dXJuICQuX1xuLy8gICAgIH0pXG4vLyAgICAgZHJhd1RleHQgPSAkLmZuKGZ1bmN0aW9uIHBvaW50X2RyYXdUZXh0KFxuLy8gICAgICAgJCxcbi8vICAgICAgIGM6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCxcbi8vICAgICAgIHRleHQ6IHN0cmluZyxcbi8vICAgICAgIGNvbG9yPzogc3RyaW5nLFxuLy8gICAgICAgb3V0bGluZVdpZHRoPzogbnVtYmVyLFxuLy8gICAgICAgb3V0bGluZUNvbG9yPzogc3RyaW5nKTogUG9pbnQge1xuLy8gICAgICAgZHJhd1RleHQoYywgJCwgdGV4dCwgY29sb3IsIG91dGxpbmVXaWR0aCwgb3V0bGluZUNvbG9yKVxuLy8gICAgICAgcmV0dXJuICQuX1xuLy8gICAgIH0pXG4vLyAgIH0pXG4vLyAgIC5sb2NhbCgkID0+IGNsYXNzIHtcblxuLy8gICB9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdF9wb2ludCgpIHtcbiAgLy8gQGVudiBicm93c2VyXG4gIGRlc2NyaWJlKCdQb2ludCcsICgpID0+IHtcbiAgICBpdCgnd29ya3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwID0gJChuZXcgUG9pbnQpXG4gICAgICBleHBlY3QocC54KS50b0VxdWFsKDApXG4gICAgICBleHBlY3QocC55KS50b0VxdWFsKDApXG4gICAgICBleHBlY3QocC53aWR0aCkudG9FcXVhbCgwKVxuICAgICAgcC54ID0gMlxuICAgICAgZXhwZWN0KHAud2lkdGgpLnRvRXF1YWwoMilcbiAgICB9KVxuICB9KVxufVxuIiwgImltcG9ydCB7ICQsIGZuLCBhbGlhcywgZnggfSBmcm9tICdzaWduYWwnXG5pbXBvcnQgeyBSZWN0IH0gZnJvbSAnLi9yZWN0LnRzJ1xuaW1wb3J0IHsgUG9pbnQsIFBvaW50TGlrZSB9IGZyb20gJy4vcG9pbnQudHMnXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4vc2hhcGUudHMnXG5cbmV4cG9ydCBlbnVtIEludGVyc2VjdCB7XG4gIE5vbmUgPSAwLFxuICBMZWZ0ID0gMSxcbiAgVG9wID0gMSA8PCAxLFxuICBSaWdodCA9IDEgPDwgMixcbiAgQm90dG9tID0gMSA8PCAzLFxuICBJbnNpZGUgPSAxIDw8IDQsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGluZUxpa2Uge1xuICBwMTogUG9pbnRMaWtlXG4gIHAyOiBQb2ludExpa2Vcbn1cblxuZXhwb3J0IGNsYXNzIExpbmUgZXh0ZW5kcyBTaGFwZSB7XG4gIHAxID0gJChuZXcgUG9pbnQpXG4gIHAyID0gJChuZXcgUG9pbnQpXG4gIGRlbHRhUG9pbnQgPSAkKG5ldyBQb2ludClcbiAgbGVycFBvaW50ID0gJChuZXcgUG9pbnQpXG5cbiAgZ2V0IGpzb24oKSB7XG4gICAgY29uc3QgeyBwMSwgcDIgfSA9IHRoaXNcbiAgICByZXR1cm4geyBwMTogcDEuanNvbiwgcDI6IHAyLmpzb24gfVxuICB9XG5cbiAgZ2V0IF9jZW50ZXIoKSB7IHJldHVybiAkKG5ldyBQb2ludCkgfVxuICBnZXQgY2VudGVyKCkge1xuICAgIGNvbnN0IHsgcDEsIHAyLCBfY2VudGVyOiBjIH0gPSB0aGlzXG4gICAgYy54ID0gKHAxLnggKyBwMi54KSAqIDAuNVxuICAgIGMueSA9IChwMS55ICsgcDIueSkgKiAwLjVcbiAgICByZXR1cm4gY1xuICB9XG5cbiAgc3RhcnQgPSBhbGlhcyh0aGlzLCAncDEnKVxuICBlbmQgPSBhbGlhcyh0aGlzLCAncDInKVxuXG4gIHRvcCA9IGFsaWFzKHRoaXMsICdwMScpXG4gIGJvdHRvbSA9IGFsaWFzKHRoaXMsICdwMicpXG5cbiAgc2V0KGxpbmU6IExpbmVMaWtlKSB7XG4gICAgY29uc3QgeyBwMSwgcDIgfSA9IHRoaXNcbiAgICBwMS5zZXQobGluZS5wMSlcbiAgICBwMi5zZXQobGluZS5wMilcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGdldCBtYWcoKSB7XG4gICAgY29uc3QgeyBwMSwgcDIgfSA9IHRoaXNcbiAgICByZXR1cm4gcDEuZGlzdGFuY2UocDIpXG4gIH1cbiAgZ2V0IGRvdCgpIHtcbiAgICBjb25zdCB7IHAxLCBwMiB9ID0gdGhpc1xuICAgIHJldHVybiAoXG4gICAgICBwMS54ICogcDIueCArXG4gICAgICBwMS55ICogcDIueVxuICAgIClcbiAgfVxuICBnZXQgYW5nbGUoKSB7XG4gICAgY29uc3QgeyBwMSwgcDIgfSA9IHRoaXNcbiAgICByZXR1cm4gTWF0aC5hdGFuMihcbiAgICAgIHAyLnggLSBwMS54LFxuICAgICAgcDIueSAtIHAxLnlcbiAgICApXG4gIH1cbiAgQGZuIGxlcnAodDogbnVtYmVyKSB7XG4gICAgY29uc3QgeyBwMSwgcDIsIGRlbHRhUG9pbnQsIGxlcnBQb2ludCB9ID0gdGhpc1xuICAgIGxlcnBQb2ludFxuICAgICAgLnNldChwMSlcbiAgICAgIC5hZGQoXG4gICAgICAgIGRlbHRhUG9pbnRcbiAgICAgICAgICAuc2V0KHAyKVxuICAgICAgICAgIC5zdWIocDEpLm11bCh0KSlcbiAgICByZXR1cm4gbGVycFBvaW50XG4gIH1cbiAgaXNQb2ludFdpdGhpbihwOiBQb2ludExpa2UpIHtcbiAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IHRoaXNcbiAgICByZXR1cm4gcC55ID09PSBzdGFydC55XG4gICAgICA/IHAueCA+PSBzdGFydC54ICYmIChcbiAgICAgICAgcC55IDwgZW5kLnlcbiAgICAgICAgfHwgKHAueSA9PT0gZW5kLnkgJiYgcC54IDw9IGVuZC54KVxuICAgICAgKVxuICAgICAgOiBwLnkgPiBzdGFydC55ICYmIChcbiAgICAgICAgcC55IDwgZW5kLnlcbiAgICAgICAgfHwgKHAueSA9PT0gZW5kLnkgJiYgcC54IDw9IGVuZC54KVxuICAgICAgKVxuICB9XG4gIGlzTGluZVdpdGhpbih7IHAxLCBwMiB9OiBMaW5lTGlrZSkge1xuICAgIGNvbnN0IHsgc3RhcnQsIGVuZCB9ID0gdGhpc1xuICAgIHJldHVybiBwMS55ID09PSBzdGFydC55XG4gICAgICA/IHAxLnggPj0gc3RhcnQueCAmJiAoXG4gICAgICAgIHAyLnkgPCBlbmQueVxuICAgICAgICB8fCAocDIueSA9PT0gZW5kLnkgJiYgcDIueCA8PSBlbmQueClcbiAgICAgIClcbiAgICAgIDogcDEueSA+IHN0YXJ0LnkgJiYgKFxuICAgICAgICBwMi55IDwgZW5kLnlcbiAgICAgICAgfHwgKHAyLnkgPT09IGVuZC55ICYmIHAyLnggPD0gZW5kLngpXG4gICAgICApXG4gIH1cbiAgaW50ZXJzZWN0c0xpbmUob3RoZXI6IExpbmVMaWtlKSB7XG4gICAgY29uc3QgeyBwMSwgcDIgfSA9IHRoaXNcblxuICAgIGNvbnN0IGExID0gcDFcbiAgICBjb25zdCBhMiA9IHAyXG5cbiAgICBjb25zdCBiMSA9IG90aGVyLnAxXG4gICAgY29uc3QgYjIgPSBvdGhlci5wMlxuXG4gICAgbGV0IHEgPVxuICAgICAgKGExLnkgLSBiMS55KSAqIChiMi54IC0gYjEueCkgLVxuICAgICAgKGExLnggLSBiMS54KSAqIChiMi55IC0gYjEueSlcblxuICAgIGNvbnN0IGQgPVxuICAgICAgKGEyLnggLSBhMS54KSAqIChiMi55IC0gYjEueSkgLVxuICAgICAgKGEyLnkgLSBhMS55KSAqIChiMi54IC0gYjEueClcblxuICAgIGlmIChkID09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHZhciByID0gcSAvIGRcblxuICAgIHEgPSAoYTEueSAtIGIxLnkpICogKGEyLnggLSBhMS54KVxuICAgICAgLSAoYTEueCAtIGIxLngpICogKGEyLnkgLSBhMS55KVxuICAgIHZhciBzID0gcSAvIGRcblxuICAgIGlmIChyIDwgMCB8fCByID4gMSB8fCBzIDwgMCB8fCBzID4gMSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICAvLyBjb2xsaWRlIGxpbmUgdG8gcmVjdGFuZ2xlIGFuZCByZXR1cm4gYSBuZXcgbGluZVxuICAvLyB0aGF0IGlzIHBsYWNlZCBqdXN0IG91dHNpZGUgb2YgdGhlIHJlY3RhbmdsZSBhbmQgbm90IHdpdGhpblxuICBnZXRMaW5lVG9SZWN0YW5nbGVDb2xsaXNpb25SZXNwb25zZShcbiAgICBpbnRlcnNlY3Rpb246IEludGVyc2VjdCxcbiAgICByOiBSZWN0KSB7XG4gICAgaWYgKGludGVyc2VjdGlvbiA9PT0gSW50ZXJzZWN0Lk5vbmUpIHtcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgY29uc3QgeyBwMSwgcDIgfSA9IHRoaXNcblxuICAgIGExLnNldChwMSlcbiAgICBhMi5zZXQocDIpXG5cbiAgICB2YXIgYjEgPSByLmxlZnRUb3BcbiAgICB2YXIgYjIgPSByLnJpZ2h0Qm90dG9tXG5cbiAgICBpZiAoaW50ZXJzZWN0aW9uICYgSW50ZXJzZWN0LkxlZnQpIHtcbiAgICAgIGExLnggPSBiMS54IC0gMVxuICAgIH1cbiAgICBpZiAoaW50ZXJzZWN0aW9uICYgSW50ZXJzZWN0LlRvcCkge1xuICAgICAgYTEueSA9IGIxLnkgLSAxXG4gICAgfVxuICAgIGlmIChpbnRlcnNlY3Rpb24gJiBJbnRlcnNlY3QuUmlnaHQpIHtcbiAgICAgIGEyLnggPSBiMi54ICsgMVxuICAgIH1cbiAgICBpZiAoaW50ZXJzZWN0aW9uICYgSW50ZXJzZWN0LkJvdHRvbSkge1xuICAgICAgYTIueSA9IGIyLnkgKyAxXG4gICAgfVxuICAgIGlmIChpbnRlcnNlY3Rpb24gJiBJbnRlcnNlY3QuSW5zaWRlKSB7XG4gICAgICBwLnNldChwMSkubGVycChwMiwgMC41KVxuICAgICAgcC50b3VjaFBvaW50KHIpXG4gICAgICBhMS54ID0gcC54XG4gICAgICBhMS55ID0gcC55XG4gICAgICBhMi54ID0gcC54XG4gICAgICBhMi55ID0gcC55XG4gICAgfVxuXG4gICAgdGVtcC5wMSA9IGExXG4gICAgdGVtcC5wMiA9IGEyXG4gICAgcmV0dXJuIHRlbXBcbiAgfVxuICBpbnRlcnNlY3Rpb25SZWN0KHI6IFJlY3QpIHtcbiAgICBjb25zdCB7IHAxLCBwMiB9ID0gdGhpc1xuICAgIGNvbnN0IGlzOiBJbnRlcnNlY3QgPSAodGhpcy5pbnRlcnNlY3RzTGluZShyLmxlZnRMaW5lKSA/IEludGVyc2VjdC5MZWZ0IDogMClcbiAgICAgICsgKHRoaXMuaW50ZXJzZWN0c0xpbmUoci50b3BMaW5lKSA/IEludGVyc2VjdC5Ub3AgOiAwKVxuICAgICAgKyAodGhpcy5pbnRlcnNlY3RzTGluZShyLnJpZ2h0TGluZSkgPyBJbnRlcnNlY3QuUmlnaHQgOiAwKVxuICAgICAgKyAodGhpcy5pbnRlcnNlY3RzTGluZShyLmJvdHRvbUxpbmUpID8gSW50ZXJzZWN0LkJvdHRvbSA6IDApXG4gICAgICArICgocDEud2l0aGluUmVjdChyKSAmJiBwMi53aXRoaW5SZWN0KHIpKSA/IEludGVyc2VjdC5JbnNpZGUgOiAwKVxuICAgIHJldHVybiBpc1xuICB9XG59XG5cbi8vIGhlbHBlcnMsIHVzZWQgZm9yIGNhbGN1bGF0aW9uc1xuY29uc3QgdGVtcCA9ICQobmV3IExpbmUpXG5jb25zdCBhMSA9ICQobmV3IFBvaW50KVxuY29uc3QgYTIgPSAkKG5ldyBQb2ludClcbmNvbnN0IHAgPSAkKG5ldyBQb2ludClcbiIsICJpbXBvcnQgeyAkLCBhbGlhcywgZm4gfSBmcm9tICdzaWduYWwnXG5pbXBvcnQgeyBNYXRyaXhMaWtlIH0gZnJvbSAnLi9tYXRyaXgudHMnXG5pbXBvcnQgeyBQb2ludCwgUG9pbnRMaWtlIH0gZnJvbSAnLi9wb2ludC50cydcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSAnLi9zaGFwZS50cydcbmltcG9ydCB7IExpbmUgfSBmcm9tICcuL2xpbmUudHMnXG5cbmV4cG9ydCB0eXBlIFJlY3RMaWtlID0gUmVjdFsnanNvbiddXG5cbmV4cG9ydCBjbGFzcyBSZWN0IGV4dGVuZHMgU2hhcGUge1xuICBwb3MgPSAkKG5ldyBQb2ludClcbiAgc2l6ZSA9ICQobmV3IFBvaW50KVxuXG4gIHggPSB0aGlzLnBvcy4kLnhcbiAgeSA9IHRoaXMucG9zLiQueVxuICB3ID0gdGhpcy5zaXplLiQud1xuICBoID0gdGhpcy5zaXplLiQuaFxuXG4gIGdldCBqc29uKCkge1xuICAgIGNvbnN0IHsgeCwgeSwgdywgaCB9ID0gdGhpc1xuICAgIHJldHVybiB7IHgsIHksIHcsIGggfVxuICB9XG4gIGdldCB2YWx1ZXMoKSB7XG4gICAgY29uc3QgeyB4LCB5LCB3LCBoIH0gPSB0aGlzXG4gICAgcmV0dXJuIFt4LCB5LCB3LCBoXSBhcyBjb25zdFxuICB9XG5cbiAgY29sID0gYWxpYXModGhpcywgJ3gnKVxuICBsaW5lID0gYWxpYXModGhpcywgJ3knKVxuICBsaW5lQ29sID0gYWxpYXModGhpcywgJ3BvcycpXG5cbiAgd2lkdGggPSBhbGlhcyh0aGlzLCAndycpXG4gIGhlaWdodCA9IGFsaWFzKHRoaXMsICdoJylcblxuICBsZWZ0ID0gYWxpYXModGhpcywgJ3gnKVxuICB0b3AgPSBhbGlhcyh0aGlzLCAneScpXG4gIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMudyB9XG4gIHNldCByaWdodChyOiBudW1iZXIpIHsgdGhpcy54ID0gciAtIHRoaXMudyB9XG4gIGdldCBib3R0b20oKSB7IHJldHVybiB0aGlzLnkgKyB0aGlzLmggfVxuICBzZXQgYm90dG9tKGI6IG51bWJlcikgeyB0aGlzLnkgPSBiIC0gdGhpcy5oIH1cblxuICBsID0gYWxpYXModGhpcywgJ3gnKVxuICB0ID0gYWxpYXModGhpcywgJ3knKVxuICByID0gYWxpYXModGhpcywgJ3JpZ2h0JylcbiAgYiA9IGFsaWFzKHRoaXMsICdib3R0b20nKVxuXG4gIGxlZnRUb3AgPSBhbGlhcyh0aGlzLCAncG9zJylcbiAgZ2V0IHJpZ2h0VG9wKCkge1xuICAgIGNvbnN0IHsgcmlnaHQ6IHgsIHRvcDogeSB9ID0gJCh0aGlzKS4kXG4gICAgcmV0dXJuICQobmV3IFBvaW50LCB7IHgsIHkgfSlcbiAgfVxuICBnZXQgbGVmdEJvdHRvbSgpIHtcbiAgICBjb25zdCB7IGxlZnQ6IHgsIGJvdHRvbTogeSB9ID0gJCh0aGlzKS4kXG4gICAgcmV0dXJuICQobmV3IFBvaW50LCB7IHgsIHkgfSlcbiAgfVxuICBnZXQgcmlnaHRCb3R0b20oKSB7XG4gICAgY29uc3QgeyByaWdodDogeCwgYm90dG9tOiB5IH0gPSAkKHRoaXMpLiRcbiAgICByZXR1cm4gJChuZXcgUG9pbnQsIHsgeCwgeSB9KVxuICB9XG4gIGx0ID0gYWxpYXModGhpcywgJ2xlZnRUb3AnKVxuICBydCA9IGFsaWFzKHRoaXMsICdyaWdodFRvcCcpXG4gIGxiID0gYWxpYXModGhpcywgJ2xlZnRCb3R0b20nKVxuICByYiA9IGFsaWFzKHRoaXMsICdyaWdodEJvdHRvbScpXG5cbiAgLy8gY3JlYXRlIGxpbmVzIG1vdmluZyBjbG9ja3dpc2Ugc3RhcnRpbmcgbGVmdCBib3R0b21cbiAgZ2V0IGxlZnRMaW5lKCkge1xuICAgIGNvbnN0IHsgbGVmdEJvdHRvbTogcDEsIGxlZnRUb3A6IHAyIH0gPSB0aGlzXG4gICAgcmV0dXJuICQobmV3IExpbmUsIHsgcDEsIHAyIH0pXG4gIH1cbiAgZ2V0IHRvcExpbmUoKSB7XG4gICAgY29uc3QgeyBsZWZ0VG9wOiBwMSwgcmlnaHRUb3A6IHAyIH0gPSB0aGlzXG4gICAgcmV0dXJuICQobmV3IExpbmUsIHsgcDEsIHAyIH0pXG4gIH1cbiAgZ2V0IHJpZ2h0TGluZSgpIHtcbiAgICBjb25zdCB7IHJpZ2h0VG9wOiBwMSwgcmlnaHRCb3R0b206IHAyIH0gPSB0aGlzXG4gICAgcmV0dXJuICQobmV3IExpbmUsIHsgcDEsIHAyIH0pXG4gIH1cbiAgZ2V0IGJvdHRvbUxpbmUoKSB7XG4gICAgY29uc3QgeyByaWdodEJvdHRvbTogcDEsIGxlZnRCb3R0b206IHAyIH0gPSB0aGlzXG4gICAgcmV0dXJuICQobmV3IExpbmUsIHsgcDEsIHAyIH0pXG4gIH1cbiAgbGwgPSBhbGlhcyh0aGlzLCAnbGVmdExpbmUnKVxuICB0bCA9IGFsaWFzKHRoaXMsICd0b3BMaW5lJylcbiAgcmwgPSBhbGlhcyh0aGlzLCAncmlnaHRMaW5lJylcbiAgYmwgPSBhbGlhcyh0aGlzLCAnYm90dG9tTGluZScpXG5cbiAgZ2V0IGh3KCkgeyByZXR1cm4gdGhpcy53IC8gMiB9XG4gIGdldCBoaCgpIHsgcmV0dXJuIHRoaXMuaCAvIDIgfVxuXG4gIGdldCBjZW50ZXJYKCkgeyByZXR1cm4gdGhpcy54ICsgdGhpcy5odyB9XG4gIHNldCBjZW50ZXJYKHg6IG51bWJlcikgeyB0aGlzLnggPSB4IC0gdGhpcy5odyB9XG5cbiAgZ2V0IGNlbnRlclkoKSB7IHJldHVybiB0aGlzLnkgKyB0aGlzLmhoIH1cbiAgc2V0IGNlbnRlclkoeTogbnVtYmVyKSB7IHRoaXMueSA9IHkgLSB0aGlzLmhoIH1cblxuICBjeCA9IGFsaWFzKHRoaXMsICdjZW50ZXJYJylcbiAgY3kgPSBhbGlhcyh0aGlzLCAnY2VudGVyWScpXG5cbiAgZ2V0IGNlbnRlcigpIHtcbiAgICBjb25zdCB7IGN4OiB4LCBjeTogeSB9ID0gJCh0aGlzKS4kXG4gICAgcmV0dXJuICQobmV3IFBvaW50LCB7IHgsIHkgfSlcbiAgfVxuICBnZXQgY2VudGVyVG9wKCkge1xuICAgIGNvbnN0IHsgY3g6IHgsIHRvcDogeSB9ID0gJCh0aGlzKS4kXG4gICAgcmV0dXJuICQobmV3IFBvaW50LCB7IHgsIHkgfSlcbiAgfVxuICBnZXQgY2VudGVyQm90dG9tKCkge1xuICAgIGNvbnN0IHsgY3g6IHgsIGJvdHRvbTogeSB9ID0gJCh0aGlzKS4kXG4gICAgcmV0dXJuICQobmV3IFBvaW50LCB7IHgsIHkgfSlcbiAgfVxuICBnZXQgY2VudGVyTGVmdCgpIHtcbiAgICBjb25zdCB7IGxlZnQ6IHgsIGN5OiB5IH0gPSAkKHRoaXMpLiRcbiAgICByZXR1cm4gJChuZXcgUG9pbnQsIHsgeCwgeSB9KVxuICB9XG4gIGdldCBjZW50ZXJSaWdodCgpIHtcbiAgICBjb25zdCB7IHJpZ2h0OiB4LCBjeTogeSB9ID0gJCh0aGlzKS4kXG4gICAgcmV0dXJuICQobmV3IFBvaW50LCB7IHgsIHkgfSlcbiAgfVxuICBzYWZlKCkge1xuICAgICQuZngoKCkgPT4ge1xuICAgICAgdGhpcy5maW5pdGUoKVxuICAgIH0pXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICB6ZXJvKCkge1xuICAgIHJldHVybiB0aGlzLnNldCgwKVxuICB9XG4gIGdldCB3aGVuU2l6ZWQoKTogdGhpcyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMudyAmJiB0aGlzLmgpIHJldHVybiB0aGlzXG4gIH1cbiAgZ2V0IGhhc1NpemUoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy53IHx8IHRoaXMuaClcbiAgfVxuICBAZm4gZmluaXRlKCkge1xuICAgIGNvbnN0IHsgeCwgeSwgdywgaCB9ID0gdGhpc1xuICAgIHRoaXMueCA9ICFpc0Zpbml0ZSh4KSA/IDAgOiB4XG4gICAgdGhpcy55ID0gIWlzRmluaXRlKHkpID8gMCA6IHlcbiAgICB0aGlzLncgPSAhaXNGaW5pdGUodykgPyAwIDogd1xuICAgIHRoaXMuaCA9ICFpc0Zpbml0ZShoKSA/IDAgOiBoXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gc2V0KG86IFJlY3RMaWtlIHwgbnVtYmVyKSB7XG4gICAgaWYgKHR5cGVvZiBvID09PSAnbnVtYmVyJykge1xuICAgICAgdGhpcy54ID0gb1xuICAgICAgdGhpcy55ID0gb1xuICAgICAgdGhpcy53ID0gb1xuICAgICAgdGhpcy5oID0gb1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMueCA9IG8ueFxuICAgICAgdGhpcy55ID0gby55XG4gICAgICB0aGlzLncgPSBvLndcbiAgICAgIHRoaXMuaCA9IG8uaFxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiBzZXRQb3MoeyB4LCB5IH06IFBvaW50TGlrZSkge1xuICAgIHRoaXMueCA9IHhcbiAgICB0aGlzLnkgPSB5XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gc2V0U2l6ZSh7IHcsIGggfTogeyB3OiBudW1iZXIsIGg6IG51bWJlciB9KSB7XG4gICAgdGhpcy53ID0gd1xuICAgIHRoaXMuaCA9IGhcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGNvcHkoKSB7XG4gICAgY29uc3QgeyB4LCB5LCB3LCBoIH0gPSB0aGlzXG4gICAgcmV0dXJuICQobmV3IFJlY3QsIHsgeCwgeSwgdywgaCB9KVxuICB9XG4gIEBmbiBzY2FsZShmYWN0b3I6IG51bWJlcikge1xuICAgIHRoaXMueCAqPSBmYWN0b3JcbiAgICB0aGlzLnkgKj0gZmFjdG9yXG4gICAgdGhpcy53ICo9IGZhY3RvclxuICAgIHRoaXMuaCAqPSBmYWN0b3JcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiB0cmFuc2xhdGUobzogUG9pbnRMaWtlIHwgbnVtYmVyKSB7XG4gICAgaWYgKHR5cGVvZiBvID09PSAnbnVtYmVyJykge1xuICAgICAgdGhpcy54ICs9IG9cbiAgICAgIHRoaXMueSArPSBvXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy54ICs9IG8ueFxuICAgICAgdGhpcy55ICs9IG8ueVxuICAgIH1cbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiBzY2FsZVNpemVMaW5lYXIobjogbnVtYmVyKSB7XG4gICAgdGhpcy53ICs9IG5cbiAgICB0aGlzLmggKz0gblxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIHNjYWxlU2l6ZShmYWN0b3I6IG51bWJlcikge1xuICAgIHRoaXMudyAqPSBmYWN0b3JcbiAgICB0aGlzLmggKj0gZmFjdG9yXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gc2NhbGVXaWR0aChmYWN0b3I6IG51bWJlcikge1xuICAgIHRoaXMudyAqPSBmYWN0b3JcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiBzY2FsZUhlaWdodChmYWN0b3I6IG51bWJlcikge1xuICAgIHRoaXMuaCAqPSBmYWN0b3JcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiBmbG9vcigpIHtcbiAgICBjb25zdCB7IHgsIHksIHcsIGggfSA9IHRoaXNcbiAgICB0aGlzLnggPSBNYXRoLmZsb29yKHgpXG4gICAgdGhpcy55ID0gTWF0aC5mbG9vcih5KVxuICAgIHRoaXMudyA9IE1hdGguZmxvb3IodylcbiAgICB0aGlzLmggPSBNYXRoLmZsb29yKGgpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gY2VpbCgpIHtcbiAgICBjb25zdCB7IHgsIHksIHcsIGggfSA9IHRoaXNcbiAgICB0aGlzLnggPSBNYXRoLmNlaWwoeClcbiAgICB0aGlzLnkgPSBNYXRoLmNlaWwoeSlcbiAgICB0aGlzLncgPSBNYXRoLmNlaWwodylcbiAgICB0aGlzLmggPSBNYXRoLmNlaWwoaClcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIEBmbiByb3VuZCgpIHtcbiAgICBjb25zdCB7IHgsIHksIHcsIGggfSA9IHRoaXNcbiAgICB0aGlzLnggPSBNYXRoLnJvdW5kKHgpXG4gICAgdGhpcy55ID0gTWF0aC5yb3VuZCh5KVxuICAgIHRoaXMudyA9IE1hdGgucm91bmQodylcbiAgICB0aGlzLmggPSBNYXRoLnJvdW5kKGgpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gZmxvb3JDZWlsKCkge1xuICAgIGNvbnN0IHsgeCwgeSwgdywgaCB9ID0gdGhpc1xuICAgIHRoaXMueCA9IE1hdGguZmxvb3IoeClcbiAgICB0aGlzLnkgPSBNYXRoLmZsb29yKHkpXG4gICAgdGhpcy53ID0gTWF0aC5jZWlsKHcpXG4gICAgdGhpcy5oID0gTWF0aC5jZWlsKGgpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBjbGVhcihjOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcbiAgICBjb25zdCB7IHgsIHksIHcsIGggfSA9IHRoaXNcbiAgICBjLmNsZWFyUmVjdCh4LCB5LCB3LCBoKVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgc3Ryb2tlKFxuICAgIGM6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCxcbiAgICBjb2xvcjogc3RyaW5nID0gdGhpcy5zdHJva2VDb2xvcikge1xuICAgIGNvbnN0IHsgeCwgeSwgdywgaCB9ID0gdGhpc1xuICAgIGMuc3Ryb2tlU3R5bGUgPSBjb2xvclxuICAgIGMuc3Ryb2tlUmVjdCh4LCB5LCB3LCBoKVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgZmlsbChcbiAgICBjOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsXG4gICAgY29sb3I6IHN0cmluZyA9IHRoaXMuZmlsbENvbG9yKSB7XG4gICAgY29uc3QgeyB4LCB5LCB3LCBoIH0gPSB0aGlzXG4gICAgYy5maWxsU3R5bGUgPSBjb2xvclxuICAgIGMuZmlsbFJlY3QoeCwgeSwgdywgaClcbiAgICByZXR1cm4gdGhpc1xuICB9XG4gIGRyYXdJbWFnZShcbiAgICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxuICAgIGM6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCxcbiAgICBwciA9IDEsXG4gICAgbm9ybWFsaXplID0gZmFsc2UpIHtcbiAgICBjb25zdCB7IHgsIHksIHcsIGggfSA9IHRoaXNcbiAgICBsZXQgbiA9ICFub3JtYWxpemUgPyAxIDogMFxuICAgIGMuZHJhd0ltYWdlKFxuICAgICAgY2FudmFzLFxuICAgICAgeCAqIHByICogbixcbiAgICAgIHkgKiBwciAqIG4sXG4gICAgICB3ICogcHIsXG4gICAgICBoICogcHIsXG4gICAgICB4LFxuICAgICAgeSxcbiAgICAgIHcsXG4gICAgICBoXG4gICAgKVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIHJlc2l6ZVRvV2luZG93KCkge1xuICAgIHRoaXMudyA9IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgdGhpcy5oID0gd2luZG93LmlubmVySGVpZ2h0XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBpc1BvaW50V2l0aGluKG86IFBvaW50TGlrZSkge1xuICAgIGNvbnN0IHsgeCwgeSwgciwgYiB9ID0gdGhpc1xuICAgIHJldHVybiAoXG4gICAgICBvLnggPj0geCAmJiBvLnggPD0gciAmJlxuICAgICAgby55ID49IHkgJiYgby55IDw9IGJcbiAgICApXG4gIH1cbiAgQGZuIHRyYW5zZm9ybU1hdHJpeChtOiBNYXRyaXhMaWtlKSB7XG4gICAgY29uc3QgeyBhLCBiLCBjLCBkLCBlLCBmIH0gPSBtXG4gICAgY29uc3QgeyB4LCB5LCB3LCBoIH0gPSB0aGlzXG4gICAgdGhpcy54ID0gYSAqIHggKyBjICogeSArIGVcbiAgICB0aGlzLnkgPSBiICogeCArIGQgKiB5ICsgZlxuICAgIHRoaXMudyA9IGEgKiB3ICsgYyAqIGhcbiAgICB0aGlzLmggPSBiICogdyArIGQgKiBoXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuICBAZm4gdHJhbnNmb3JtTWF0cml4U2NhbGVkKFxuICAgIG06IE1hdHJpeExpa2UsXG4gICAgcHIgPSAxKSB7XG4gICAgaWYgKHByID09PSAxKSByZXR1cm4gdGhpcy50cmFuc2Zvcm1NYXRyaXgobSlcbiAgICBlbHNlIHJldHVybiB0aGlzLnNjYWxlKHByKS50cmFuc2Zvcm1NYXRyaXgobSkuc2NhbGUoMSAvIHByKVxuICB9XG4gIEBmbiBjb21iaW5lKG86IFJlY3RMaWtlKSB7XG4gICAgaWYgKCF0aGlzLmhhc1NpemUpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldChvKVxuICAgIH1cblxuICAgIGxldCB7IGxlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbSB9ID0gdGhpc1xuXG4gICAgY29uc3Qgb19sZWZ0ID0gby54XG4gICAgY29uc3Qgb190b3AgPSBvLnlcbiAgICBjb25zdCBvX3JpZ2h0ID0gby54ICsgby53XG4gICAgY29uc3Qgb19ib3R0b20gPSBvLnkgKyBvLmhcblxuICAgIGlmIChvX2xlZnQgPCBsZWZ0KSBsZWZ0ID0gb19sZWZ0XG4gICAgaWYgKG9fdG9wIDwgdG9wKSB0b3AgPSBvX3RvcFxuICAgIGlmIChvX3JpZ2h0ID4gcmlnaHQpIHJpZ2h0ID0gb19yaWdodFxuICAgIGlmIChvX2JvdHRvbSA+IGJvdHRvbSkgYm90dG9tID0gb19ib3R0b21cblxuICAgIHRoaXMueCA9IGxlZnRcbiAgICB0aGlzLnkgPSB0b3BcbiAgICB0aGlzLncgPSByaWdodCAtIGxlZnRcbiAgICB0aGlzLmggPSBib3R0b20gLSB0b3BcblxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIGNvbWJpbmVSZWN0cyhyZWN0czogUmVjdExpa2VbXSkge1xuICAgIGZvciAoY29uc3QgciBvZiByZWN0cykge1xuICAgICAgdGhpcy5jb21iaW5lKHIpXG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cbiAgQGZuIGludGVyc2VjdGlvblJlY3QoXG4gICAgcjE6IFJlY3QsXG4gICAgcjI6IFJlY3QpIHtcbiAgICBjb25zdCB4MSA9IE1hdGgubWF4KHIxLmxlZnQsIHIyLmxlZnQpXG4gICAgY29uc3QgeTEgPSBNYXRoLm1heChyMS50b3AsIHIyLnRvcClcbiAgICBjb25zdCB4MiA9IE1hdGgubWluKHIxLnJpZ2h0LCByMi5yaWdodClcbiAgICBjb25zdCB5MiA9IE1hdGgubWluKHIxLmJvdHRvbSwgcjIuYm90dG9tKVxuXG4gICAgaWYgKHgxIDwgeDIgJiYgeTEgPCB5Mikge1xuICAgICAgdGVtcC54ID0geDFcbiAgICAgIHRlbXAueSA9IHkxXG4gICAgICB0ZW1wLncgPSB4MiAtIHgxXG4gICAgICB0ZW1wLmggPSB5MiAtIHkxXG4gICAgICByZXR1cm4gdGVtcFxuICAgIH1cbiAgfVxuICBAZm4gem9vbUxpbmVhcihuOiBudW1iZXIpIHtcbiAgICBjb25zdCB0ID0gLW4gLyAyXG4gICAgcmV0dXJuIHRoaXMuc2NhbGVTaXplTGluZWFyKG4pLnRyYW5zbGF0ZSh7IHg6IHQsIHk6IHQgfSlcbiAgfVxuICBAZm4gY29udGFpbihvOiBSZWN0KSB7XG4gICAgY29uc3QgeyBsLCB0LCByLCBiIH0gPSB0aGlzXG4gICAgaWYgKHQgPCBvLnQpIHRoaXMudCA9IG8udFxuICAgIGVsc2UgaWYgKGIgPiBvLmIpIHRoaXMuYiA9IG8uYlxuXG4gICAgaWYgKHIgPiBvLnIpIHRoaXMuciA9IG8uclxuICAgIGVsc2UgaWYgKGwgPCBvLmwpIHRoaXMubCA9IG8ubFxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxufVxuXG5jb25zdCB0ZW1wID0gJChuZXcgUmVjdClcbiIsICJpbXBvcnQgeyAkLCBhbGlhcywgZngsIGluaXQgfSBmcm9tICdzaWduYWwnXG5pbXBvcnQgeyBSZWN0IH0gZnJvbSAnLi9yZWN0LnRzJ1xuaW1wb3J0IHsgUG9pbnQsIFBvaW50TGlrZSB9IGZyb20gJy4vcG9pbnQudHMnXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gJy4vc2hhcGUudHMnXG5pbXBvcnQgeyBMaW5lIH0gZnJvbSAnLi9saW5lLnRzJ1xuXG5jb25zdCBkID0gJChuZXcgUG9pbnQpXG5jb25zdCB2ID0gJChuZXcgUG9pbnQpXG5cbmV4cG9ydCBjbGFzcyBDaXJjbGUgZXh0ZW5kcyBTaGFwZSB7XG4gIHN0YXRpYyB0b0NpcmNsZUNvbGxpc2lvbihjMTogQ2lyY2xlICYgeyB2ZWw6IFBvaW50LCBtYXNzOiBudW1iZXIgfSwgYzI6IENpcmNsZSAmIHsgdmVsOiBQb2ludCwgbWFzczogbnVtYmVyIH0sIHRvbGVyYW5jZSA9IDApIHtcbiAgICBjb25zdCB7IHBvczogcDEsIHJhZGl1czogcjEgfSA9IGMxXG4gICAgY29uc3QgeyBwb3M6IHAyLCByYWRpdXM6IHIyIH0gPSBjMlxuICAgIGNvbnN0IHJhZGl1cyA9IHIxICsgcjJcbiAgICBkLnNldChwMSkuc3ViKHAyKVxuICAgIGNvbnN0IGRpc3QgPSBkLm1hZ1xuICAgIGNvbnN0IGRpZmYgPSAocmFkaXVzICsgdG9sZXJhbmNlKSAtIGRpc3RcbiAgICBpZiAoZGlmZiA+IDApIHtcbiAgICAgIC8vIG5vcm1hbGl6ZVxuICAgICAgZC5kaXYoZGlzdClcblxuICAgICAgLy8gcmVsYXRpdmUgdmVsb2NpdHlcbiAgICAgIHYuc2V0KGMxLnZlbCkuc3ViKGMyLnZlbClcblxuICAgICAgLy8gQ2FsY3VsYXRlIHJlbGF0aXZlIHNwZWVkIGFsb25nIHRoZSBub3JtYWwgdmVjdG9yXG4gICAgICBjb25zdCByZWxTcGVlZCA9IHYueCAqIGQueCArIHYueSAqIGQueVxuXG4gICAgICAvLyBJZiB0aGUgY2lyY2xlcyBhcmUgbW92aW5nIGF3YXkgZnJvbSBlYWNoIG90aGVyLCBkbyBub3RoaW5nXG4gICAgICBpZiAocmVsU3BlZWQgPiAwKSByZXR1cm5cblxuICAgICAgLy8gQ2FsY3VsYXRlIGltcHVsc2UgKGNoYW5nZSBpbiBtb21lbnR1bSlcbiAgICAgIGNvbnN0IGltcHVsc2UgPSAoKDIgKiByZWxTcGVlZCkgLyAoYzEubWFzcyArIGMyLm1hc3MpKSAqIDAuOThcblxuICAgICAgLy8gQXBwbHkgdGhlIGltcHVsc2UgdG8gdXBkYXRlIHZlbG9jaXRpZXNcbiAgICAgIGMxLnZlbC54IC09IGltcHVsc2UgKiBjMi5tYXNzICogZC54XG4gICAgICBjMS52ZWwueSAtPSBpbXB1bHNlICogYzIubWFzcyAqIGQueVxuICAgICAgYzIudmVsLnggKz0gaW1wdWxzZSAqIGMxLm1hc3MgKiBkLnhcbiAgICAgIGMyLnZlbC55ICs9IGltcHVsc2UgKiBjMS5tYXNzICogZC55XG5cbiAgICAgIC8vIFNlcGFyYXRlIHRoZSBjaXJjbGVzIHRvIGF2b2lkIG92ZXJsYXBcbiAgICAgIGNvbnN0IHN4ID0gZGlmZiAqIGQueCAqIDAuNVxuICAgICAgY29uc3Qgc3kgPSBkaWZmICogZC55ICogMC41XG5cbiAgICAgIGMxLnBvcy54ICs9IHN4XG4gICAgICBjMS5wb3MueSArPSBzeVxuXG4gICAgICBjMi5wb3MueCAtPSBzeFxuICAgICAgYzIucG9zLnkgLT0gc3lcbiAgICB9XG4gIH1cbiAgc3RhdGljIHRvQ2lyY2xlQ29sbGlzaW9uUmV2ZXJzZShjMTogQ2lyY2xlLCBjMjogQ2lyY2xlLCB0b2xlcmFuY2UgPSAwKSB7XG4gICAgY29uc3QgeyBwb3M6IHAxLCByYWRpdXM6IHIxIH0gPSBjMVxuICAgIGNvbnN0IHsgcG9zOiBwMiwgcmFkaXVzOiByMiB9ID0gYzJcbiAgICBjb25zdCByYWRpdXMgPSByMSArIHIyXG4gICAgZC5zZXQocDIpLnN1YihwMSlcbiAgICBjb25zdCBkaWZmID0gKGQubWFnICsgdG9sZXJhbmNlKSAtIHJhZGl1c1xuICAgIGlmIChkaWZmID4gMCkge1xuICAgICAgZC5tdWwoZGlmZiAvIHJhZGl1cylcbiAgICAgIHJldHVybiBkXG4gICAgfVxuICB9XG5cbiAgcmVjdCA9ICQobmV3IFJlY3QpXG4gIHJhZGl1cyA9IDEwXG4gIHBvcyA9IHRoaXMucmVjdC4kLmNlbnRlclxuICBwcmV2UG9zID0gJChuZXcgUG9pbnQpXG4gIGxlcnBQb3MgPSAkKG5ldyBMaW5lKVxuICBjZW50ZXIgPSBhbGlhcyh0aGlzLCAncG9zJylcblxuICBAaW5pdCBpbml0UmVjdFNpemUoKSB7XG4gICAgdGhpcy5yZWN0LndpZHRoID0gdGhpcy5yZWN0LmhlaWdodCA9IE1hdGguY2VpbCh0aGlzLnJhZGl1cyAqIDIpXG4gIH1cbiAgLy8gZ2V0IHJlY3QoKSB7XG4gIC8vICAgJC5pZ25vcmUoKVxuICAvLyAgIGNvbnN0IHIgPSAkKG5ldyBSZWN0LCB7XG4gIC8vICAgICBwb3M6ICQodGhpcykuJC5wb3NcbiAgLy8gICB9KVxuICAvLyAgIC8vIHIucG9zID1cbiAgLy8gICByZXR1cm4gclxuICAvLyB9XG4gIGlzUG9pbnRXaXRoaW4ocDogUG9pbnRMaWtlKSB7XG4gICAgY29uc3QgeyBwb3MsIHJhZGl1cyB9ID0gdGhpc1xuICAgIHJldHVybiBwb3MuZGlzdGFuY2UocCkgPCByYWRpdXNcbiAgfVxuICBmaWxsKGM6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCk6IHZvaWQge1xuICAgIGNvbnN0IHsgZmlsbENvbG9yOiBjb2xvciwgbGVycFBvczogeyBsZXJwUG9pbnQ6IHBvcyB9LCByYWRpdXMgfSA9IHRoaXNcbiAgICBjLmJlZ2luUGF0aCgpXG4gICAgYy5maWxsU3R5bGUgPSBjb2xvclxuICAgIGMuYXJjKHBvcy54LCBwb3MueSwgcmFkaXVzLCAwLCBNYXRoLlBJICogMiwgdHJ1ZSlcbiAgICBjLmZpbGwoKVxuICB9XG59XG4iLCAiaW1wb3J0IHsgJCwgZnggfSBmcm9tICdzaWduYWwnXG5pbXBvcnQgeyBhc3NpZ24sIGRvbSB9IGZyb20gJ3V0aWxzJ1xuaW1wb3J0IHsgUG9pbnQgfSBmcm9tICcuL3BvaW50J1xuaW1wb3J0IHsgV29ybGQgfSBmcm9tICcuL3dvcmxkJ1xuXG5jb25zdCBwID0gJChuZXcgUG9pbnQpXG5cbmV4cG9ydCBjbGFzcyBDYW52YXMge1xuICB3b3JsZCA9IFdvcmxkLkN1cnJlbnRcbiAgc2l6ZSA9ICQobmV3IFBvaW50KVxuICB3aWR0aCA9IHRoaXMuc2l6ZS4kLndcbiAgaGVpZ2h0ID0gdGhpcy5zaXplLiQuaFxuICBsZWZ0ID0gMFxuICByaWdodCA9IHRoaXMuc2l6ZS4kLndcbiAgYm90dG9tID0gdGhpcy5zaXplLiQuaFxuICBmdWxsV2luZG93PzogYm9vbGVhblxuXG4gIHN0eWxlPzogQ1NTU3R5bGVEZWNsYXJhdGlvblxuXG4gIGVsID0gZG9tLmVsPEhUTUxDYW52YXNFbGVtZW50PignY2FudmFzJywge1xuICAgIHN0eWxlOiB7XG4gICAgICBjc3NUZXh0OiAvKmNzcyovYFxuICAgICAgdG91Y2gtYWN0aW9uOiBub25lO1xuICAgICAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gICAgICBgXG4gICAgfVxuICB9KVxuXG4gIGdldCBjKCkge1xuICAgIHJldHVybiB0aGlzLmVsLmdldENvbnRleHQoJzJkJykhXG4gIH1cblxuICBAZnggYXV0b1Jlc2l6ZVRvRml0V2luZG93KCkge1xuICAgIGNvbnN0IHsgZnVsbFdpbmRvdywgd29ybGQ6IHsgc2NyZWVuOiB7IHZpZXdwb3J0OiB7IHgsIHkgfSB9IH0gfSA9ICQub2YodGhpcylcbiAgICBpZiAoZnVsbFdpbmRvdykgdGhpcy5zaXplLnJlc2l6ZVRvV2luZG93KClcbiAgfVxuXG4gIEBmeCBpbml0KCkge1xuICAgIGNvbnN0IHsgc2l6ZSwgZWwsIGMgfSA9IHRoaXNcbiAgICBjb25zdCB7IGlmTm90WmVybywgdywgaCB9ID0gJC5vZihzaXplKVxuICAgIGNvbnN0IHsgcHIgfSA9ICQub2YodGhpcy53b3JsZC5zY3JlZW4pXG5cbiAgICAkLnVudHJhY2soKCkgPT4ge1xuICAgICAgYXNzaWduKGVsLCBwLnNldChzaXplKS5tdWwocHIpLndoKVxuICAgICAgYy5zY2FsZShwciwgcHIpXG4gICAgfSlcblxuICAgIGNvbnN0IHsgc3R5bGUgfSA9ICQub2Y8Q2FudmFzPih0aGlzKVxuICAgICQudW50cmFjaygoKSA9PiB7XG4gICAgICBhc3NpZ24oc3R5bGUsIHAuc2V0KHNpemUpLndoUHgpXG4gICAgfSlcbiAgfVxuXG4gIGFwcGVuZFRvKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIGVsLmFwcGVuZCh0aGlzLmVsKVxuICAgIHRoaXMuc3R5bGUgPSB0aGlzLmVsLnN0eWxlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuc2l6ZS5jbGVhcih0aGlzLmMpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIGZpbGwoY29sb3I/OiBzdHJpbmcpIHtcbiAgICB0aGlzLnNpemUuZmlsbCh0aGlzLmMsIGNvbG9yKVxuICAgIHJldHVybiB0aGlzXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RfY2FudmFzKCkge1xuICAvLyBAZW52IGJyb3dzZXJcbiAgZGVzY3JpYmUoJ0NhbnZhcycsICgpID0+IHtcbiAgICBpdCgnd29ya3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCB3b3JsZCA9ICQobmV3IFdvcmxkKVxuICAgICAgY29uc3QgY2FudmFzID0gJChuZXcgQ2FudmFzKVxuICAgICAgY2FudmFzLnNpemUuc2V0KHsgeDogMTAwLCB5OiAxMDAgfSlcbiAgICAgIGNhbnZhcy5hcHBlbmRUbyhkb20uYm9keSlcbiAgICAgIGZ4KCgpID0+IHtcbiAgICAgICAgLy8gY29uc3QgeyBwciB9ID0gY2FudmFzLnNpemVcbiAgICAgICAgY2FudmFzLmZpbGwoKVxuICAgICAgfSlcbiAgICB9KVxuICB9KVxufVxuIiwgImltcG9ydCB7ICQsIGZuLCBmeCB9IGZyb20gJ3NpZ25hbCdcbmltcG9ydCB7IFBvaW50ZXJMaWtlRXZlbnQsIGRvbSwgb24gfSBmcm9tICd1dGlscydcbmltcG9ydCB7IFBvaW50IH0gZnJvbSAnLi4vc3JjL3BvaW50LnRzJ1xuaW1wb3J0IHsgV29ybGQgfSBmcm9tICcuL3dvcmxkLnRzJ1xuaW1wb3J0IHsgQ2FudmFzIH0gZnJvbSAnLi9jYW52YXMudHMnXG5cbnR5cGUgUG9pbnRlckV2ZW50VHlwZSA9XG4gIHwgJ3doZWVsJ1xuICB8ICdwb2ludGVybW92ZSdcbiAgfCAncG9pbnRlcmRvd24nXG4gIHwgJ3BvaW50ZXJ1cCdcbiAgfCAncG9pbnRlcmxlYXZlJ1xuXG5jb25zdCByZW1hcCA9IHtcbiAgbW91c2Vtb3ZlOiAncG9pbnRlcm1vdmUnLFxuICBtb3VzZWRvd246ICdwb2ludGVyZG93bicsXG4gIG1vdXNldXA6ICdwb2ludGVydXAnLFxuICBwb2ludGVyY2FuY2VsOiAncG9pbnRlcmxlYXZlJyxcbn1cblxuZXhwb3J0IGNsYXNzIFBvaW50ZXIge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgY2FudmFzOiBDYW52YXMpIHsgfVxuXG4gIHdvcmxkID0gV29ybGQuQ3VycmVudFxuXG4gIC8qKiBUaGUgbGF0ZXN0IHJlYWwgRE9NIGV2ZW50IG9iamVjdCByZWNlaXZlZCBmcm9tIGFueSBsaXN0ZW5lci4gKi9cbiAgcmVhbD86IFBvaW50ZXJMaWtlRXZlbnRcblxuICAvKiogTm9ybWFsaXplZCBET00tbGlrZSBwb2ludGVyIGV2ZW50LiAqL1xuICBldmVudCA9ICQoe1xuICAgIHR5cGU6ICdwb2ludGVybW92ZScgYXMgUG9pbnRlckV2ZW50VHlwZSxcbiAgICBwYWdlWDogMCxcbiAgICBwYWdlWTogMCxcbiAgICBkZWx0YVg6IDAsXG4gICAgZGVsdGFZOiAwLFxuICAgIGJ1dHRvbnM6IDAsXG4gICAgYWx0S2V5OiB2b2lkIDAgYXMgdHJ1ZSB8IHVuZGVmaW5lZCxcbiAgICBjdHJsS2V5OiB2b2lkIDAgYXMgdHJ1ZSB8IHVuZGVmaW5lZCxcbiAgICBzaGlmdEtleTogdm9pZCAwIGFzIHRydWUgfCB1bmRlZmluZWQsXG4gICAgdGltZVN0YW1wOiAwLFxuICB9KVxuXG4gIHBvcyA9ICQobmV3IFBvaW50LCB7XG4gICAgeDogdGhpcy5ldmVudC4kLnBhZ2VYLFxuICAgIHk6IHRoaXMuZXZlbnQuJC5wYWdlWVxuICB9KVxuXG4gIGFsdCA9IHRoaXMuZXZlbnQuJC5hbHRLZXlcbiAgY3RybCA9IHRoaXMuZXZlbnQuJC5jdHJsS2V5XG4gIHNoaWZ0ID0gdGhpcy5ldmVudC4kLnNoaWZ0S2V5XG5cbiAgQGZ4IGluaXQoKSB7XG4gICAgY29uc3QgeyBjYW52YXM6IHsgZWwgfSwgaGFuZGxlciB9ID0gdGhpc1xuICAgIGNvbnN0IGggPSBoYW5kbGVyLmJpbmQodGhpcylcbiAgICByZXR1cm4gW1xuICAgICAgb24oZWwsICd3aGVlbCcsIGgsIHsgcGFzc2l2ZTogdHJ1ZSB9KSxcbiAgICAgIG9uKGVsLCAnbW91c2Vkb3duJywgaCksXG4gICAgICBvbihlbCwgJ3BvaW50ZXJjYW5jZWwnLCBoKSxcbiAgICAgIG9uKHdpbmRvdywgJ21vdXNldXAnLCBoKSxcbiAgICAgIG9uKHdpbmRvdywgJ21vdXNlbW92ZScsIGgpLFxuICAgICAgb24od2luZG93LCAncG9pbnRlcm1vdmUnLCBoKSxcbiAgICAgIG9uKGRvY3VtZW50LCAnbW91c2VsZWF2ZScsIGgpLFxuICAgIF1cbiAgfVxuXG4gIEBmbiBoYW5kbGVyKHJlYWw6IFBvaW50ZXJMaWtlRXZlbnQpIHtcbiAgICBkb20uc3RvcChyZWFsKVxuXG4gICAgaWYgKHRoaXMud29ybGQuaXNBbmltYXRpbmcpIHtcbiAgICAgIGlmIChyZWFsLnR5cGUgPT09ICdtb3VzZW1vdmUnKSByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnJlYWwgPSByZWFsXG5cbiAgICBjb25zdCB7IGV2ZW50IH0gPSB0aGlzXG5cbiAgICBldmVudC50eXBlID0gcmVtYXBbcmVhbC50eXBlXVxuICAgIGV2ZW50LnBhZ2VYID0gcmVhbC5wYWdlWFxuICAgIGV2ZW50LnBhZ2VZID0gcmVhbC5wYWdlWVxuICAgIGV2ZW50LmFsdEtleSA9IHJlYWwuYWx0S2V5IHx8IHZvaWQgMFxuICAgIGV2ZW50LmN0cmxLZXkgPSAocmVhbC5jdHJsS2V5IHx8IHJlYWwubWV0YUtleSkgfHwgdm9pZCAwXG4gICAgZXZlbnQuc2hpZnRLZXkgPSByZWFsLnNoaWZ0S2V5IHx8IHZvaWQgMFxuICAgIGV2ZW50LnRpbWVTdGFtcCA9IHJlYWwudGltZVN0YW1wIHx8IHBlcmZvcm1hbmNlLm5vdygpXG5cbiAgICBzd2l0Y2ggKHJlYWwudHlwZSkge1xuICAgICAgY2FzZSAnd2hlZWwnOlxuICAgICAgICBldmVudC5kZWx0YVggPSByZWFsLmRlbHRhWFxuICAgICAgICBldmVudC5kZWx0YVkgPSByZWFsLmRlbHRhWVxuICAgICAgICBicmVha1xuXG4gICAgICBjYXNlICdtb3VzZW1vdmUnOlxuICAgICAgY2FzZSAnbW91c2Vkb3duJzpcbiAgICAgIGNhc2UgJ21vdXNldXAnOlxuICAgICAgY2FzZSAnbW91c2VsZWF2ZSc6XG5cbiAgICAgIGNhc2UgJ3BvaW50ZXJtb3ZlJzpcbiAgICAgIGNhc2UgJ3BvaW50ZXJkb3duJzpcbiAgICAgIGNhc2UgJ3BvaW50ZXJ1cCc6XG4gICAgICBjYXNlICdwb2ludGVybGVhdmUnOlxuICAgICAgY2FzZSAncG9pbnRlcmNhbmNlbCc6XG4gICAgICAgIGV2ZW50LmJ1dHRvbnMgPSByZWFsLmJ1dHRvbnNcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyAkLCBmbiwgZnggfSBmcm9tICdzaWduYWwnXG5pbXBvcnQgeyBXb3JsZCB9IGZyb20gJy4vd29ybGQnXG5pbXBvcnQgeyBDYW52YXMgfSBmcm9tICcuL2NhbnZhcydcbmltcG9ydCB7IFBvaW50ZXIgfSBmcm9tICcuL3BvaW50ZXInXG5cbmV4cG9ydCBjbGFzcyBTY2VuZSB7XG4gIHdvcmxkID0gV29ybGQuQ3VycmVudFxuICBjYW52YXMgPSAkKG5ldyBDYW52YXMsIHsgZnVsbFdpbmRvdzogdHJ1ZSB9KVxuICBwb2ludGVyID0gJChuZXcgUG9pbnRlcih0aGlzLmNhbnZhcykpXG59XG4iLCAiaW1wb3J0IHsgJCwgZm4sIGZ4LCBpbml0IH0gZnJvbSAnc2lnbmFsJ1xuaW1wb3J0IHsgYXJyYXksIGJlbmNoLCBkb20sIG9uLCByYW5kb21IZXggfSBmcm9tICd1dGlscydcbmltcG9ydCB7IENpcmNsZSB9IGZyb20gJy4uL3NyYy9jaXJjbGUudHMnXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gJy4uL3NyYy9wb2ludC50cydcbmltcG9ydCB7IFdvcmxkIH0gZnJvbSAnLi4vc3JjL3dvcmxkLnRzJ1xuaW1wb3J0IHsgU2NlbmUgfSBmcm9tICcuLi9zcmMvc2NlbmUudHMnXG5pbXBvcnQgeyBMaW5lIH0gZnJvbSAnLi4vc3JjL2xpbmUudHMnXG5pbXBvcnQgeyBDYW52YXMgfSBmcm9tICcuLi9zcmMvY2FudmFzLnRzJ1xuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4uL3NyYy9yZWN0LnRzJ1xuXG5jb25zdCBwID0gJChuZXcgUG9pbnQpXG5jb25zdCBjcCA9ICQobmV3IFBvaW50KVxuY29uc3QgY3YgPSAkKG5ldyBQb2ludClcblxuY2xhc3MgTW90aW9uIHtcbiAgY29lZmYgPSAxXG4gIEBmbiB1cGRhdGUoaXQ6IHsgdmVsOiBQb2ludCwgcG9zOiBQb2ludCB9KSB7XG4gICAgY29uc3QgeyB2ZWwsIHBvcyB9ID0gaXRcbiAgICB2ZWwubXVsKDAuOTgpXG4gICAgLy8gaWYgKHZlbC5hYnNTdW0gPD0gMSkgcmV0dXJuXG4gICAgcG9zLmFkZChwLnNldCh2ZWwpLm11bCh0aGlzLmNvZWZmKSlcbiAgfVxufVxuXG5jbGFzcyBHcmF2aXR5IHtcbiAgY29lZmYgPSAxXG4gIGdyYXZpdHkgPSA5LjggKiAoMSAvIDYwKSAqICg4MCAvIDUpXG5cbiAgQGZuIHVwZGF0ZShpdDogeyB2ZWw6IFBvaW50IH0pIHtcbiAgICBpdC52ZWwueSArPSB0aGlzLmdyYXZpdHkgKiB0aGlzLmNvZWZmXG4gIH1cbn1cblxuY2xhc3MgV2FsbHMge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdGhhdDogeyBsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXIsIGJvdHRvbTogbnVtYmVyIH0pIHsgfVxuXG4gIEBmbiB1cGRhdGUoaXQ6IHsgdmVsOiBQb2ludCwgaW1wYWN0QWJzb3JiOiBudW1iZXIsIGxlZnQ6IG51bWJlciwgcmlnaHQ6IG51bWJlciwgYm90dG9tOiBudW1iZXIsIG1hc3M6IG51bWJlciB9KSB7XG4gICAgY29uc3QgeyB0aGF0IH0gPSB0aGlzXG5cbiAgICBpZiAoaXQudmVsLnkgPCAxICYmIGl0LmJvdHRvbSA9PT0gdGhhdC5ib3R0b20pIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgbGV0IGQgPSBpdC5ib3R0b20gLSB0aGF0LmJvdHRvbVxuXG4gICAgaWYgKGQgPiAwKSB7XG4gICAgICBpdC5ib3R0b20gPSB0aGF0LmJvdHRvbVxuICAgICAgaXQudmVsLnkgPSAtaXQudmVsLnkgKiBpdC5pbXBhY3RBYnNvcmJcbiAgICB9XG4gICAgLy8gZWxzZSBpZiAoZCA+IC0xLjUgJiYgTWF0aC5hYnMoaXQudmVsLnkpIDwgMS41KSB7XG4gICAgLy8gICBpdC52ZWwueSA9IDBcbiAgICAvLyAgIGl0LmJvdHRvbSA9IHRoYXQuYm90dG9tXG4gICAgLy8gfVxuXG4gICAgZCA9IHRoYXQubGVmdCAtIGl0LmxlZnRcblxuICAgIGlmIChkID4gMCkge1xuICAgICAgaXQubGVmdCA9IHRoYXQubGVmdFxuICAgICAgaXQudmVsLnggPSAtaXQudmVsLnggKiBpdC5pbXBhY3RBYnNvcmJcbiAgICB9XG4gICAgZWxzZSB7XG5cbiAgICAgIGQgPSBpdC5yaWdodCAtIHRoYXQucmlnaHRcblxuICAgICAgaWYgKGQgPiAwKSB7XG4gICAgICAgIGl0LnJpZ2h0ID0gdGhhdC5yaWdodFxuICAgICAgICBpdC52ZWwueCA9IC1pdC52ZWwueCAqIGl0LmltcGFjdEFic29yYlxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBCYWxsIGV4dGVuZHMgQ2lyY2xlIHtcbiAgY29lZmYgPSAxXG4gIGdldCBtYXNzKCkgeyByZXR1cm4gMS4zICsgKHRoaXMucmVjdC5zaXplLm1hZyAqIDAuMDI1KSAqIHRoaXMuY29lZmYgfVxuICBnZXQgaW1wYWN0QWJzb3JiKCkgeyByZXR1cm4gKCgxIC8gdGhpcy5tYXNzKSAqKiAwLjI1KSAqIDAuOTE5IH1cbiAgdmVsID0gJChuZXcgUG9pbnQpXG4gIGxlZnQgPSB0aGlzLnJlY3QuJC5sZWZ0XG4gIHJpZ2h0ID0gdGhpcy5yZWN0LiQucmlnaHRcbiAgYm90dG9tID0gdGhpcy5yZWN0LiQuYm90dG9tXG4gIGdyaWRDZWxsczogW1xuICAgIHgweTA6IG51bWJlciwgeDF5MDogbnVtYmVyLCB4MnkwOiBudW1iZXIsXG4gICAgeDB5MTogbnVtYmVyLCB4MXkxOiBudW1iZXIsIHgyeTE6IG51bWJlcixcbiAgICB4MHkyOiBudW1iZXIsIHgxeTI6IG51bWJlciwgeDJ5MjogbnVtYmVyLFxuICBdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogOSB9LCAoKSA9PiAwKSBhcyBhbnlcbiAgY29sbHMgPSBuZXcgU2V0PEJhbGw+KClcbiAgY2FudmFzID0gJChuZXcgQ2FudmFzKVxuICBsZXJwUmVjdD86ICQ8UmVjdD5cblxuICBAaW5pdCBzZXR1cExlcnAoKSB7XG4gICAgY29uc3QgeyBjYW52YXMgfSA9ICQub2YodGhpcylcbiAgICBjYW52YXMuc2l6ZS5zZXQodGhpcy5yZWN0LnNpemUpXG4gICAgJC5mbHVzaCgpXG4gICAgdGhpcy5sZXJwUmVjdCA9ICQobmV3IFJlY3QsIHtcbiAgICAgIHNpemU6IHRoaXMucmVjdC5zaXplXG4gICAgfSlcbiAgICAvLyB0aGlzLmxlcnBSZWN0LnNpemUuc2V0KHRoaXMucmVjdC5zaXplKVxuICAgIHRoaXMubGVycFBvcy5wMS5zZXQodGhpcy5wb3MpXG4gICAgdGhpcy5sZXJwUG9zLnAyLnNldCh0aGlzLnBvcylcbiAgICB0aGlzLnJlbmRlcihjYW52YXMuYylcbiAgfVxuXG4gIEBmbiByZW5kZXIodGM6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xuICAgIGNvbnN0IGMgPSB0YyA/PyAkLm9mKHRoaXMpLmNhbnZhcy5jXG4gICAgY29uc3QgciA9IHRoaXMucmFkaXVzXG4gICAgYy5zYXZlKClcbiAgICBjLnRyYW5zbGF0ZShyLCByKVxuICAgIHRoaXMuZmlsbChjKVxuICAgIGMucmVzdG9yZSgpXG4gIH1cblxuICBAZm4gZHJhdyhjOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcbiAgICBjb25zdCB7IGxlcnBSZWN0LCBwciB9ID0gJC5vZih0aGlzKVxuICAgIGxlcnBSZWN0LmNlbnRlci5zZXQodGhpcy5sZXJwUG9zLmxlcnBQb2ludClcbiAgICAvLyB0aGlzLmZpbGwoYylcbiAgICBsZXJwUmVjdC5kcmF3SW1hZ2UoJC5vZih0aGlzKS5jYW52YXMuZWwsIGMsIHByLCB0cnVlKVxuICB9XG59XG5cbmNvbnN0IEJBTExfQ09VTlQgPSAxMjBcbmNvbnN0IEJBTExfVE9MRVJBTkNFID0gNVxuY29uc3QgQkFMTF9IT0xEX1RPTEVSQU5DRSA9IDhcbmNvbnN0IEdSSURfQ0VMTF9CSVRTID0gMlxuXG5mdW5jdGlvbiBhcmVOZWFyKGMxOiBCYWxsLCBjMjogQmFsbCkge1xuICByZXR1cm4gKFxuICAgIGMxICE9PSBjMlxuICAgICYmIGMxLmdyaWRDZWxscy5pbmNsdWRlcyhjMi5ncmlkQ2VsbHNbNF0pXG4gIClcbn1cblxuY2xhc3MgQmFsbFNjZW5lIGV4dGVuZHMgU2NlbmUge1xuICBjb2VmZiA9IDFcbiAgZ3Jhdml0eSA9ICQobmV3IEdyYXZpdHkpXG4gIG1vdGlvbiA9ICQobmV3IE1vdGlvbilcbiAgd2FsbHMgPSAkKG5ldyBXYWxscyh0aGlzLmNhbnZhcykpXG5cbiAgYmFsbHM/OiAkPEJhbGw+W11cblxuICB4U29ydGVkPzogJDxCYWxsPltdXG4gIHlTb3J0ZWQ/OiAkPEJhbGw+W11cblxuICBiYWxsUHJvcHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBvczogcC5yYW5kKHRoaXMuY2FudmFzLnNpemUpLnN1Yih7IHg6IDAsIHk6IHRoaXMuY2FudmFzLnNpemUuaCAvIDIgfSksXG4gICAgICByYWRpdXM6IDEyICsgKE1hdGgucmFuZG9tKCkgKiogMi41KSAqIDQyLFxuICAgICAgZmlsbENvbG9yOiAnIycgKyByYW5kb21IZXgoKVxuICAgIH1cbiAgfVxuXG4gIEBpbml0IGNyZWF0ZUJhbGxzKCkge1xuICAgIHRoaXMuYmFsbHMgPSBhcnJheShCQUxMX0NPVU5ULCAoKSA9PlxuICAgICAgJChuZXcgQmFsbCwgdGhpcy5iYWxsUHJvcHMoKSkpXG4gIH1cbiAgQGZ4IGNyZWF0ZVNvcnRlZCgpIHtcbiAgICBjb25zdCB7IGJhbGxzIH0gPSAkLm9mKHRoaXMpXG4gICAgJC51bnRyYWNrKClcbiAgICB0aGlzLnhTb3J0ZWQgPSBbLi4uYmFsbHNdXG4gICAgdGhpcy55U29ydGVkID0gWy4uLmJhbGxzXVxuICB9XG4gIEBmbiBhZGRCYWxsKHBvcz86IFBvaW50KSB7XG4gICAgY29uc3QgYmFsbCA9ICQobmV3IEJhbGwsIHRoaXMuYmFsbFByb3BzKCkpXG4gICAgdGhpcy5iYWxscyA9IFtiYWxsLCAuLi4kLm9mKHRoaXMpLmJhbGxzXVxuICAgIGlmIChwb3MpIGJhbGwucG9zLnNldChwb3MpXG4gIH1cbiAgQGZ4IGFzc2lnbkNvZWZmKCkge1xuICAgIGNvbnN0IHsgY29lZmYsIGdyYXZpdHksIG1vdGlvbiwgYmFsbHMgfSA9ICQub2YodGhpcylcbiAgICBncmF2aXR5LmNvZWZmXG4gICAgICA9IG1vdGlvbi5jb2VmZlxuICAgICAgPSBjb2VmZlxuICAgIGJhbGxzLmZvckVhY2goYmFsbCA9PiB7XG4gICAgICBiYWxsLmNvZWZmID0gY29lZmZcbiAgICB9KVxuICB9XG5cbiAgLy9cbiAgLy8gQmVoYXZpb3JzLlxuICAvL1xuXG4gIEBmeCBvbkNsaWNrQWRkQmFsbCgpIHtcbiAgICByZXR1cm4gb24od2luZG93LCAnY2xpY2snLCAoKSA9PlxuICAgICAgdGhpcy5hZGRCYWxsKHRoaXMucG9pbnRlci5wb3MpXG4gICAgKVxuICB9XG5cbiAgQGZ4IGJhbGxGb2xsb3dzUG9pbnRlcigpIHtcbiAgICBjb25zdCB7IHBvcyB9ID0gdGhpcy5wb2ludGVyXG4gICAgY29uc3QgeyB4LCB5IH0gPSBwb3NcbiAgICAkLnVudHJhY2soKVxuICAgIGNvbnN0IFtiYWxsXSA9ICQub2YodGhpcykuYmFsbHNcbiAgICBiYWxsLnZlbC5zZXQoY3Yuc2V0KHBvcykuc3ViKGJhbGwucG9zKS5tdWwoMykpXG4gICAgYmFsbC5wb3Muc2V0KHBvcylcbiAgICAvLyBiYWxsLnZlbC56ZXJvKClcbiAgICAvLyB0aGlzLnVwZGF0ZUJhbGxHcmlkKGJhbGwpXG4gICAgLy8gdGhpcy5iYWxsQ29sbGlzaW9uT25lKGJhbGwsIEJBTExfSE9MRF9UT0xFUkFOQ0UpXG4gIH1cblxuICAvLyBFbmQgQmVoYXZpb3JzLlxuXG4gIGJhbGxDb2xsaXNpb24odG9sZXJhbmNlPzogbnVtYmVyKSB7XG4gICAgY29uc3QgeyBiYWxscyB9ID0gJC5vZih0aGlzKVxuICAgIGJhbGxzLmZvckVhY2goYiA9PiBiLmNvbGxzLmNsZWFyKCkpXG4gICAgZm9yIChsZXQgaSA9IDAsIGMxOiBCYWxsOyBpIDwgYmFsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGMxID0gYmFsbHNbaV1cbiAgICAgIGZvciAobGV0IGogPSBpICsgMSwgYzI6IEJhbGw7IGogPCBiYWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICBjMiA9IGJhbGxzW2pdXG4gICAgICAgIGlmIChjMS5jb2xscy5oYXMoYzIpIHx8IGMyLmNvbGxzLmhhcyhjMSkpIGNvbnRpbnVlXG4gICAgICAgIGMxLmNvbGxzLmFkZChjMilcbiAgICAgICAgYzIuY29sbHMuYWRkKGMxKVxuICAgICAgICBpZiAoIWFyZU5lYXIoYzEsIGMyKSkgY29udGludWVcblxuICAgICAgICBDaXJjbGUudG9DaXJjbGVDb2xsaXNpb24oYzEsIGMyLCB0b2xlcmFuY2UpXG4gICAgICAgIC8vIGNvbnN0IHJlc3AgPVxuICAgICAgICAvLyBpZiAocmVzcCkge1xuICAgICAgICAvLyAgIGlmIChjMS52ZWwubWFnID4gLjc1IHx8IGMyLnZlbC5tYWcgPiAuNzUpIHtcbiAgICAgICAgLy8gICAgIGMxLnZlbC5hZGQocmVzcClcbiAgICAgICAgLy8gICAgIGMxLnBvcy5hZGQocmVzcClcblxuICAgICAgICAvLyAgICAgYzIudmVsLmFkZChyZXNwLm5lZygpKVxuICAgICAgICAvLyAgICAgYzIucG9zLmFkZChyZXNwKVxuXG4gICAgICAgIC8vICAgICBjMS52ZWwubXVsKEJBTExfUkVTUE9OU0UpXG4gICAgICAgIC8vICAgICBjMi52ZWwubXVsKEJBTExfUkVTUE9OU0UpXG4gICAgICAgIC8vICAgfVxuICAgICAgICAvLyAgIGVsc2Uge1xuICAgICAgICAvLyAgICAgLy8gYzEudmVsLnplcm8oKVxuICAgICAgICAvLyAgICAgLy8gYzIudmVsLnplcm8oKVxuICAgICAgICAvLyAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGJhbGxDb2xsaXNpb25PbmUoYzE6IEJhbGwsIHRvbGVyYW5jZT86IG51bWJlcikge1xuICAgIGNvbnN0IHsgYmFsbHMgfSA9ICQub2YodGhpcylcbiAgICBmb3IgKGxldCBqID0gMCwgYzI6IEJhbGw7IGogPCBiYWxscy5sZW5ndGg7IGorKykge1xuICAgICAgYzIgPSBiYWxsc1tqXVxuICAgICAgaWYgKGMxLmNvbGxzLmhhcyhjMikgfHwgYzIuY29sbHMuaGFzKGMxKSkgY29udGludWVcbiAgICAgIGlmICghYXJlTmVhcihjMSwgYzIpKSBjb250aW51ZVxuICAgICAgQ2lyY2xlLnRvQ2lyY2xlQ29sbGlzaW9uKGMxLCBjMiwgdG9sZXJhbmNlKVxuICAgICAgLy8gY29uc3QgcmVzcCA9XG4gICAgICAvLyBpZiAocmVzcCkge1xuICAgICAgLy8gICBpZiAoYzEudmVsLm1hZyA+IC43NSB8fCBjMi52ZWwubWFnID4gLjc1KSB7XG4gICAgICAvLyAgICAgYzEudmVsLmFkZChyZXNwKVxuICAgICAgLy8gICAgIGMyLnZlbC5hZGQocmVzcC5uZWcoKSlcbiAgICAgIC8vICAgICBjMi5wb3MuYWRkKHJlc3ApXG5cbiAgICAgIC8vICAgICBjMS52ZWwubXVsKEJBTExfUkVTUE9OU0UpXG4gICAgICAvLyAgICAgYzIudmVsLm11bChCQUxMX1JFU1BPTlNFKVxuICAgICAgLy8gICB9XG4gICAgICAvLyAgIGVsc2Uge1xuICAgICAgLy8gICAgIC8vIGMxLnZlbC56ZXJvKClcbiAgICAgIC8vICAgICAvLyBjMi52ZWwuemVybygpXG4gICAgICAvLyAgIH1cbiAgICAgIC8vIH1cbiAgICB9XG4gIH1cblxuICBAZm4gcmVzZXQoKSB7XG4gICAgY29uc3QgeyBiYWxscywgY2FudmFzIH0gPSAkLm9mKHRoaXMpXG4gICAgYmFsbHMuZm9yRWFjaChiYWxsID0+IHtcbiAgICAgIGJhbGwucG9zLnJhbmQoY2FudmFzLnNpemUpXG4gICAgfSlcbiAgfVxuXG4gIEBmbiB1cGRhdGUoZHQ6IG51bWJlcikge1xuICAgIGNvbnN0IHsgYmFsbHMsIGdyYXZpdHksIG1vdGlvbiwgd2FsbHMgfSA9ICQub2YodGhpcylcbiAgICBsZXQgY291bnQgPSAwXG4gICAgY3Auc2V0KGJhbGxzWzBdLnBvcylcbiAgICBiYWxscy5mb3JFYWNoKGJhbGwgPT4ge1xuICAgICAgZ3Jhdml0eS51cGRhdGUoYmFsbClcbiAgICAgIG1vdGlvbi51cGRhdGUoYmFsbClcbiAgICAgIGlmICh3YWxscy51cGRhdGUoYmFsbCkpIHJldHVyblxuICAgICAgY291bnQrK1xuICAgIH0pXG4gICAgaWYgKHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5wb2ludGVyLmV2ZW50LnRpbWVTdGFtcCA8IDIwMDApIHtcbiAgICAgIGJhbGxzWzBdLnBvcy5zZXQoY3ApXG4gICAgfVxuICAgIHJldHVybiBjb3VudFxuICB9XG5cbiAgQGZuIHVwZGF0ZUJhbGxHcmlkKGJhbGw6IEJhbGwpIHtcbiAgICBjb25zdCBncmlkU2l6ZSA9ICgyICoqIEdSSURfQ0VMTF9CSVRTKVxuICAgIGNvbnN0IHcgPSB0aGlzLmNhbnZhcy5zaXplLncgLyBncmlkU2l6ZVxuICAgIGNvbnN0IGggPSB0aGlzLmNhbnZhcy5zaXplLmggLyBncmlkU2l6ZVxuICAgIGNvbnN0IHggPSAoYmFsbC5wb3MueCAvIHcpIHwgMFxuICAgIGNvbnN0IHkgPSAoYmFsbC5wb3MueSAvIGgpIHwgMFxuXG4gICAgY29uc3QgeTAgPSB5IC0gMVxuICAgIGNvbnN0IHkyID0geSArIDFcbiAgICBjb25zdCB4MCA9ICh4IC0gMSkgPDwgR1JJRF9DRUxMX0JJVFNcbiAgICBjb25zdCB4MSA9IHggPDwgR1JJRF9DRUxMX0JJVFNcbiAgICBjb25zdCB4MiA9ICh4ICsgMSkgPDwgR1JJRF9DRUxMX0JJVFNcblxuICAgIGJhbGwuZ3JpZENlbGxzWzBdID0geDAgfCB5MFxuICAgIGJhbGwuZ3JpZENlbGxzWzFdID0geDEgfCB5MFxuICAgIGJhbGwuZ3JpZENlbGxzWzJdID0geDIgfCB5MFxuXG4gICAgYmFsbC5ncmlkQ2VsbHNbM10gPSB4MCB8IHlcbiAgICBiYWxsLmdyaWRDZWxsc1s0XSA9IHgxIHwgeVxuICAgIGJhbGwuZ3JpZENlbGxzWzVdID0geDIgfCB5XG5cbiAgICBiYWxsLmdyaWRDZWxsc1s2XSA9IHgwIHwgeTJcbiAgICBiYWxsLmdyaWRDZWxsc1s3XSA9IHgxIHwgeTJcbiAgICBiYWxsLmdyaWRDZWxsc1s4XSA9IHgyIHwgeTJcbiAgfVxuXG4gIEBmbiB1cGRhdGVPbmUoZHQ6IG51bWJlcikge1xuICAgIGNvbnN0IHsgYmFsbHMsIHhTb3J0ZWQ6IHhzLCB5U29ydGVkOiB5cyB9ID0gJC5vZih0aGlzKVxuXG4gICAgYmFsbHMuZm9yRWFjaChiID0+IGIuY29sbHMuY2xlYXIoKSlcblxuICAgIGNwLnNldChiYWxsc1swXS5wb3MpXG5cbiAgICB4cy5zb3J0KChhLCBiKSA9PiBhLnBvcy54IC0gYi5wb3MueClcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHhzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29uc3QgYzEgPSB4c1tpXVxuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgeHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgYzIgPSB4c1tqXVxuICAgICAgICBpZiAoYzEuY29sbHMuaGFzKGMyKSB8fCBjMi5jb2xscy5oYXMoYzEpKSBjb250aW51ZVxuICAgICAgICBjMS5jb2xscy5hZGQoYzIpXG4gICAgICAgIGMyLmNvbGxzLmFkZChjMSlcbiAgICAgICAgaWYgKGMxLnJlY3QucmlnaHQgPCBjMi5yZWN0LmxlZnQpIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgQ2lyY2xlLnRvQ2lyY2xlQ29sbGlzaW9uKGMxLCBjMiwgQkFMTF9UT0xFUkFOQ0UpXG4gICAgICB9XG4gICAgfVxuXG4gICAgeXMuc29ydCgoYSwgYikgPT4gYS5wb3MueSAtIGIucG9zLnkpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB5cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGNvbnN0IGMxID0geXNbaV1cbiAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGMyID0geXNbal1cbiAgICAgICAgaWYgKGMxLmNvbGxzLmhhcyhjMikgfHwgYzIuY29sbHMuaGFzKGMxKSkgY29udGludWVcbiAgICAgICAgYzEuY29sbHMuYWRkKGMyKVxuICAgICAgICBjMi5jb2xscy5hZGQoYzEpXG4gICAgICAgIGlmIChjMS5yZWN0LmJvdHRvbSA8IGMyLnJlY3QudG9wKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBDaXJjbGUudG9DaXJjbGVDb2xsaXNpb24oYzEsIGMyLCBCQUxMX1RPTEVSQU5DRSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLnBvaW50ZXIuZXZlbnQudGltZVN0YW1wIDwgMjAwMCkge1xuICAgICAgYmFsbHNbMF0ucG9zLnNldChjcClcbiAgICB9XG5cbiAgICBiYWxscy5mb3JFYWNoKGJhbGwgPT4ge1xuICAgICAgYmFsbC5sZXJwUG9zLnAxLnNldChiYWxsLmxlcnBQb3MucDIpXG4gICAgICBiYWxsLmxlcnBQb3MucDIuc2V0KGJhbGwucG9zKVxuICAgIH0pXG5cbiAgICByZXR1cm4gMVxuICB9XG4gIC8vIEBmbiB1cGRhdGVPbmUoZHQ6IG51bWJlcikge1xuICAvLyAgIGNvbnN0IHsgYmFsbHMgfSA9ICQub2YodGhpcylcbiAgLy8gICAvLyB1cGRhdGUgZ3JpZFxuICAvLyAgIGJhbGxzLmZvckVhY2goYmFsbCA9PiB7XG4gIC8vICAgICB0aGlzLnVwZGF0ZUJhbGxHcmlkKGJhbGwpXG4gIC8vICAgfSlcbiAgLy8gICBjcC5zZXQoYmFsbHNbMF0ucG9zKVxuICAvLyAgIHRoaXMuYmFsbENvbGxpc2lvbihCQUxMX1RPTEVSQU5DRSlcbiAgLy8gICBpZiAocGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLnBvaW50ZXIuZXZlbnQudGltZVN0YW1wIDwgMjAwMCkge1xuICAvLyAgICAgYmFsbHNbMF0ucG9zLnNldChjcClcbiAgLy8gICB9XG4gIC8vICAgYmFsbHMuZm9yRWFjaChiYWxsID0+IHtcbiAgLy8gICAgIGJhbGwubGVycFBvcy5wMS5zZXQoYmFsbC5sZXJwUG9zLnAyKVxuICAvLyAgICAgYmFsbC5sZXJwUG9zLnAyLnNldChiYWxsLnBvcylcbiAgLy8gICB9KVxuICAvLyAgIHJldHVybiAxXG4gIC8vIH1cblxuICBAZm4gZHJhdyh0OiBudW1iZXIpIHtcbiAgICBjb25zdCB7IGNhbnZhcywgYmFsbHMsIHdvcmxkIH0gPSAkLm9mKHRoaXMpXG4gICAgY29uc3QgeyBwciB9ID0gJC5vZih3b3JsZC5zY3JlZW4pXG4gICAgY29uc3QgeyBjIH0gPSBjYW52YXNcbiAgICBjYW52YXMuY2xlYXIoKVxuICAgIGJhbGxzLmZvckVhY2goYmFsbCA9PiB7XG4gICAgICBiYWxsLmxlcnBQb3MubGVycCh0KVxuICAgICAgYmFsbC5kcmF3KGMpXG4gICAgICAvLyBiYWxsLmZpbGwoYylcbiAgICB9KVxuICB9XG59XG5cbmNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuZG9tLmhlYWQuYXBwZW5kKHN0eWxlKVxuc3R5bGUudGV4dENvbnRlbnQgPSAvKmNzcyovYFxuaHRtbCwgYm9keSB7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbn1cbmBcblxuZnVuY3Rpb24gYW5pbSgpIHtcbiAgY29uc3Qgd29ybGQgPSAkKG5ldyBXb3JsZClcbiAgY29uc3Qgc2NlbmUgPSAkKG5ldyBCYWxsU2NlbmUpXG5cbiAgc2NlbmUuY2FudmFzLmFwcGVuZFRvKGRvbS5ib2R5KVxuICB3b3JsZC5hbmltLml0ZW1zLnB1c2goc2NlbmUpXG4gIHdvcmxkLmFuaW0uc3RhcnQoKVxuICAvLyBsZXQgYW5pbUZyYW1lOiBudW1iZXJcbiAgLy8gY29uc3QgdGljayA9ICgpID0+IHtcbiAgLy8gICBpZiAoIXNjZW5lLnVwZGF0ZSgpKSB7XG4gIC8vICAgICBhbmltRnJhbWUgPSAtMVxuICAvLyAgICAgcmV0dXJuXG4gIC8vICAgfVxuICAvLyAgIHNjZW5lLmRyYXcoKVxuICAvLyAgIGFuaW1GcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKVxuICAvLyAgIC8vIGNvbnNvbGUubG9nKCdhbmltJylcbiAgLy8gfVxuXG4gIC8vIGZ4KCgpID0+IHtcbiAgLy8gICBpZiAoc2NlbmUuY2FudmFzLnNpemUuc3VtICYmIGFuaW1GcmFtZSA9PT0gLTEpIHtcbiAgLy8gICAgIGFuaW1GcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKVxuICAvLyAgIH1cbiAgLy8gfSlcblxuICAvLyB0aWNrKClcblxuICAvLyBvbih3aW5kb3csICdtb3VzZWRvd24nLCAoKSA9PiB7XG4gIC8vICAgaWYgKGFuaW1GcmFtZSA+PSAwKSB7XG4gIC8vICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShhbmltRnJhbWUpXG4gIC8vICAgICBhbmltRnJhbWUgPSAtMVxuICAvLyAgIH1cbiAgLy8gICBlbHNlIHtcbiAgLy8gICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKVxuICAvLyAgIH1cbiAgLy8gfSlcbn1cblxuZnVuY3Rpb24gYmVuY2htYXJrMSgpIHtcbiAgY29uc3Qgc2NlbmUgPSAkKG5ldyBCYWxsU2NlbmUpXG5cbiAgYmVuY2goJ3NjZW5lJywgNSwgMTAwMCwgKCkgPT4ge1xuICAgIHNjZW5lLnVwZGF0ZSgxKVxuICB9LCAoKSA9PiB7XG4gICAgc2NlbmUucmVzZXQoKVxuICB9KVxufVxuXG5mdW5jdGlvbiBiZW5jaG1hcmsyKCkge1xuICBsZXQgc2NlbmVcbiAgYmVuY2goJ3NjZW5lJywgMywgMzAsICgpID0+IHtcbiAgICBzY2VuZSA9ICQobmV3IEJhbGxTY2VuZSlcbiAgICAkLmRpc3Bvc2Uoc2NlbmUpXG4gIH0pXG59XG5cbmFuaW0oKVxuLy8gYmVuY2htYXJrMSgpXG5cbi8vIGJlbmNobWFyazIoKVxuLy8gMTlcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFPLFdBQVMsTUFDZCxLQUNBQSxLQUEyQjtBQUMzQixXQUFPLE1BQU07QUFBQSxNQUFLLEVBQUUsUUFBUSxJQUFJO0FBQUEs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YU4sTUFBTSxRQUFRLFNBQVMsY0FBYyxPQUFPO0FBQzVDLE1BQUksS0FBSyxPQUFPLEtBQUs7QUFDckIsUUFBTSxjQUFxQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFVM0IsV0FBUyxPQUFPO0FBQ2QsVUFBTSxRQUFRLEVBQUUsSUFBSSxPQUFLO0FBQ3pCLFVBQU0sUUFBUSxFQUFFLElBQUksV0FBUztBQUU3QixVQUFNLE9BQU8sU0FBUyxJQUFJLElBQUk7QUFDOUIsVUFBTSxLQUFLLE1BQU0sS0FBSyxLQUFLO0FBQzNCLFVBQU0sS0FBSyxNQUFNO0FBQUEsRUE2Qm5CO0FBb0JBLE9BQUs7IiwKICAibmFtZXMiOiBbIm9mIiwgInYiLCAiZm4iLCAiZXJyb3IiLCAiZm4iLCAiZm4iLCAidiIsICJpc0N0b3IiLCAidiIsICJmbiIsICJsaXN0ZW5lcnMiLCAiZm4iLCAiZCIsICJkaXNwb3NlIiwgImVycm9yIiwgInAiLCAiZW50cmllcyIsICJlIiwgIml0IiwgImZuIiwgIm9mIiwgImZuIiwgIml0IiwgInYiLCAidmFsaWRhdGVUeXBlIiwgImVycm9yIiwgImVmZmVjdCIsICJzaWduYWwiLCAidiIsICJmbiIsICJub2RlIiwgIm9mIiwgInYiLCAib2YiLCAiZnJvbSIsICJmbiIsICJjcCIsICJ2IiwgInAiLCAiaXQiLCAidmFsdWUiLCAiZngiLCAic3RhdGUiLCAiZCIsICJkaXNwb3NlIiwgImluaXQiLCAiaW5pdDIiLCAiZCIsICJwMiIsICJwIiwgImExIiwgImEyIiwgImQiLCAidGVtcCIsICJwMiIsICJkIiwgInRlbXAiLCAicDIiLCAicCIsICJwb3MiLCAicCIsICJzdHlsZSIsICJwIiwgIml0IiwgInBvcyIsICJkIiwgInAiLCAicG9zIl0KfQo=
