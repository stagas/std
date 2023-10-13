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
    for await (const v of gen) {
      cb(v);
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
  function isObject(v) {
    return typeof v === "object" && v !== null && !Array.isArray(v);
  }
  function isFunction(x) {
    return typeof x === "function";
  }
  var isCtor = memoizeByRef(function isCtor2(v) {
    return isFunction(v) && v.toString().startsWith("class");
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
  function assign(o, p3) {
    return Object.assign(o, p3);
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
      for await (const v of fn4) {
        yield it2(v);
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
    set(v) {
      this.set(v);
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
    set(v) {
      this.set(v);
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
  Computed.prototype.set = function(v) {
    this._setter?.call(this._thisArg, v);
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
  function isSignal(v) {
    return v && v[__signal__];
  }
  function isProp(v) {
    return v && v[__prop__];
  }
  function isStruct(v) {
    return v && v[__struct__];
  }
  function isFx(v) {
    return v && v[__fx__];
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
    for (const key in descs) {
      if (forbiddenKeys.has(key))
        continue;
      const desc = descs[key];
      if (desc.get) {
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
          set(v) {
            s.value = v;
          }
        };
      } else {
        let s;
        let value = desc.value;
        if (isProp(props[key])) {
          value = props[key];
          delete props[key];
        }
        if (isSignal(props[key])) {
          s = props[key];
          delete props[key];
        } else if (value == null) {
          s = signal(value);
        } else
          switch (typeof value) {
            case "object":
              if (value[__prop__]) {
                const p3 = value[__prop__];
                if (typeof p3 === "string") {
                  aliases.push({ fromKey: p3, toKey: key });
                  continue;
                } else if ("it" in p3) {
                  const from2 = p3;
                  s = signal(void 0);
                  console.log(p3);
                  effects.push({
                    fx: () => {
                      let off;
                      const fxfn = () => {
                        let { it: it2 } = from2;
                        for (const p4 of from2.path) {
                          if (!it2[p4])
                            return;
                          it2 = it2[p4];
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
                } else if (__unwrap__ in p3) {
                  s = signal(p3.init);
                  let gen = p3[__unwrap__];
                  if (gen[Symbol.asyncIterator]) {
                    gen = uniterify(gen, p3.cb);
                  }
                  if (gen.constructor.name === "AsyncGeneratorFunction") {
                    effects.push({
                      fx: () => {
                        const deferred = callbackify(gen, (v) => {
                          s.value = v;
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
          set(v) {
            s.value = v;
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
        ({ fx: fx5, state: state2 }) => fx5.call(state2)
      );
    }
    return state;
  };
  var fn = function fnDecorator(t, k, d2) {
    const fn4 = d2.value;
    d2.value = function _fn(...args) {
      return batch(fn4, this, args);
    };
    d2.value[__fn__] = true;
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
      const dispose2 = effect(() => {
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

  // src/shape.ts
  var Shape = class {
    label;
    strokeColor = "#3f3";
    fillColor = "#92e";
    get values() {
      return [];
    }
    get text() {
      return (this.label ? `${this.label}: ` : "") + this.values.join(" ");
    }
    get temp() {
      return $(Object.getPrototypeOf(this).constructor);
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
    pr = 1;
    get prX() {
      return this.x * this.pr;
    }
    get prY() {
      return this.y * this.pr;
    }
    get prScaled() {
      const { prX: x, prY: y } = $(this).$;
      return $(new _Point(), { x, y });
    }
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
      return this.temp.set(o).sub(this).mag;
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
    isPointWithin(p3) {
      const { start, end } = this;
      return p3.y === start.y ? p3.x >= start.x && (p3.y < end.y || p3.y === end.y && p3.x <= end.x) : p3.y > start.y && (p3.y < end.y || p3.y === end.y && p3.x <= end.x);
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
      if (intersection & 2 /* Left */) {
        a1.x = b1.x - 1;
      }
      if (intersection & 4 /* Top */) {
        a1.y = b1.y - 1;
      }
      if (intersection & 8 /* Right */) {
        a2.x = b2.x + 1;
      }
      if (intersection & 16 /* Bottom */) {
        a2.y = b2.y + 1;
      }
      if (intersection & 32 /* Inside */) {
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
      const is = (this.intersectsLine(r.leftLine) ? 2 /* Left */ : 0) + (this.intersectsLine(r.topLine) ? 4 /* Top */ : 0) + (this.intersectsLine(r.rightLine) ? 8 /* Right */ : 0) + (this.intersectsLine(r.bottomLine) ? 16 /* Bottom */ : 0) + (p1.withinRect(r) && p22.withinRect(r) ? 32 /* Inside */ : 0);
      return is;
    }
  };
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
    pr;
    syncPr() {
      const { pr } = $.of(this);
      $.untrack();
      this.pos.pr = this.size.pr = pr;
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
      const { temp: temp3 } = this;
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
    fx
  ], Rect.prototype, "syncPr", 1);
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
  ], Rect.prototype, "isPointWithin", 1);
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

  // src/circle.ts
  var d = $(new Point());
  var Circle = class extends Shape {
    static toCircleCollision(c1, c2, tolerance = 0) {
      const { pos: p1, radius: r1 } = c1;
      const { pos: p22, radius: r2 } = c2;
      const radius = r1 + r2;
      d.set(p1).sub(p22);
      const diff = radius + tolerance - d.mag;
      if (diff > 0) {
        d.mul(diff / radius);
        return d;
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
    center = alias(this, "pos");
    init() {
      this.rect.width = this.rect.height = this.radius * 2;
    }
    isPointWithin(p3) {
      const { pos: pos2, radius } = this;
      return pos2.distance(p3) < radius;
    }
    fill(c) {
      const { fillColor: color, pos: pos2, radius } = this;
      c.beginPath();
      c.fillStyle = color;
      c.arc(pos2.x, pos2.y, radius, 0, Math.PI * 2, true);
      c.fill();
    }
  };
  __decorateClass([
    fx
  ], Circle.prototype, "init", 1);

  // src/anim.ts
  var Anim = class {
    constructor() {
      this.tick = this.tick.bind(this);
    }
    items = [];
    isAnimating = false;
    startTime = 0;
    tickTime = 0;
    fps = 60;
    acc = 0;
    get timeStep() {
      return 1e3 / this.fps | 0;
    }
    get maxDeltaTime() {
      return this.timeStep * 5;
    }
    tick() {
      const { timeStep, maxDeltaTime, tickTime } = this;
      let needNextFrame = true;
      const now = performance.now();
      const dt = now - tickTime;
      this.tickTime = now;
      if (dt > this.maxDeltaTime) {
        return;
      }
      this.acc += dt;
      while (this.acc > this.timeStep) {
        this.acc -= this.timeStep;
        for (const item of this.items) {
          if (!item.update(dt)) {
            needNextFrame = false;
          }
        }
      }
      for (const item of this.items) {
        item.draw();
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
      }
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

  // src/canvas.ts
  var Canvas = class {
    world = World.Current;
    size = $($(new Point(), { pr: this.world.screen.$.pr }).resizeToWindow());
    width = this.size.$.w;
    height = this.size.$.h;
    left = 0;
    right = this.size.$.w;
    bottom = this.size.$.h;
    fullWindow;
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
      const { fullWindow, size: { pr }, world: { screen: { viewport: { x, y } } } } = $.of(this);
      if (fullWindow)
        this.size.resizeToWindow();
    }
    style;
    init() {
      const { size, el, c } = this;
      const { ifNotZero, pr, prScaled: { wh } } = $.of(size);
      assign(el, wh);
      c.scale(pr, pr);
      const { style: style2 } = $.of(this);
      assign(style2, size.whPx);
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
  var p2 = $(new Point());
  var Motion = class {
    update(it2) {
      const { vel, pos: pos2 } = it2;
      vel.mul(0.99);
      if (vel.absSum <= 1)
        return;
      pos2.add(vel);
    }
  };
  __decorateClass([
    fn
  ], Motion.prototype, "update", 1);
  var Gravity = class {
    gravity = 9.8 * (1 / 60) * (20 / 5);
    update(it2) {
      it2.vel.y += this.gravity;
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
      } else if (d2 > -1.5 && Math.abs(it2.vel.y) < 1.5) {
        it2.vel.y = 0;
        it2.bottom = that.bottom;
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
    get mass() {
      return 1.3 + this.rect.size.mag * 0.025;
    }
    get impactAbsorb() {
      return (1 / this.mass) ** 0.25 * 0.999;
    }
    vel = $(new Point());
    left = this.rect.$.left;
    right = this.rect.$.right;
    bottom = this.rect.$.bottom;
  };
  var BallScene = class extends Scene {
    gravity = $(new Gravity());
    motion = $(new Motion());
    walls = $(new Walls(this.canvas));
    balls = array(250, () => $(new Ball(), {
      pos: p2.rand(this.canvas.size).sub({ x: 0, y: this.canvas.size.h / 2 }).xy,
      radius: 5 + Math.random() ** 5 * 30,
      fillColor: "#" + randomHex()
    }));
    ballFollowsPointer() {
      const { pos: pos2 } = this.pointer;
      const { x, y } = pos2;
      $.untrack();
      const [ball] = this.balls;
      ball.pos.set(pos2);
      ball.vel.zero();
    }
    ballCollision() {
      const { balls } = this;
      for (let i = 0, c1; i < balls.length; i++) {
        c1 = balls[i];
        for (let j = i + 1, c2; j < balls.length; j++) {
          c2 = balls[j];
          if (c1 === c2)
            continue;
          const resp = Circle.toCircleCollision(c1, c2);
          if (resp) {
            if (c1.vel.mag > 0.75 || c2.vel.mag > 0.75) {
              c1.vel.mul(0.85).add(resp);
              c2.vel.mul(0.85).add(resp.neg());
            } else {
              c1.vel.zero();
              c2.vel.zero();
            }
          }
        }
      }
    }
    reset() {
      const { balls, canvas } = this;
      balls.forEach((ball) => {
        ball.pos.rand(canvas.size);
      });
    }
    update() {
      const { balls, gravity, motion, walls } = $.of(this);
      let count = 0;
      balls.forEach((ball) => {
        motion.update(ball);
        gravity.update(ball);
        if (walls.update(ball))
          return;
        count++;
      });
      return count;
    }
    draw() {
      const { canvas, balls } = $.of(this);
      const { c } = canvas;
      canvas.clear();
      balls.forEach((ball) => {
        ball.fill(c);
      });
    }
  };
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
//!: discard
//!: start
//!: stop
//!: tick
