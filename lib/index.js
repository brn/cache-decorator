/**
 * The MIT License (MIT)
 * Copyright (c) Taketoshi Aono
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * @fileoverview
 * @author Taketoshi Aono
 */
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var g = typeof global === 'object' ? global : typeof window === 'object' ? window : this || {};
var Symbol = typeof g.Symbol === 'function' ? g.Symbol : (function () {
    var map = {};
    function Symbol(sym) {
        return "@@" + sym;
    }
    Symbol['for'] = function (sym) {
        if (map[sym]) {
            return map[sym];
        }
        return map[sym] = Symbol(sym);
    };
})();
var CacheScope;
(function (CacheScope) {
    CacheScope[CacheScope["GLOABL"] = 1] = "GLOABL";
    CacheScope[CacheScope["INSTANCE"] = 2] = "INSTANCE";
})(CacheScope = exports.CacheScope || (exports.CacheScope = {}));
var CacheType;
(function (CacheType) {
    CacheType[CacheType["SINGLETON"] = 1] = "SINGLETON";
    CacheType[CacheType["MEMO"] = 2] = "MEMO";
    CacheType[CacheType["TTL"] = 3] = "TTL";
})(CacheType = exports.CacheType || (exports.CacheType = {}));
exports.DEFAULT_COMPARE_FN = function (a, b) { return a.length === b.length && a.every(function (v, i) { return v === b[i]; }); };
var GLOBAL_CACHE = {};
/**
 * Controll caches lifetime.
 */
var Cache = (function () {
    function Cache(scope, type, compare, ttl) {
        this.scope = scope;
        this.type = type;
        this.compare = compare;
        this.ttl = ttl;
    }
    Cache.prototype.set = function (val, args, context, key) {
        if (this.scope === CacheScope.INSTANCE) {
            this.setCache(context, key, val, args);
        }
        else {
            this.setCache(GLOBAL_CACHE, key, val, args);
        }
        return val;
    };
    Cache.prototype.setCache = function (cacheContext, key, value, args) {
        var _this = this;
        if (cacheContext[key]) {
            var result = cacheContext[key].filter(function (_a) {
                var value = _a[0], cachedArgs = _a[1];
                return _this.compare(cachedArgs, args);
            });
            if (!result.length) {
                cacheContext[key].push([value, args]);
            }
        }
        else {
            cacheContext[key] = [[value, args]];
        }
        if (this.type === CacheType.TTL) {
            if (!this.ttl) {
                throw new Error('ttl required in CacheType.TTL');
            }
            setTimeout(function () { return cacheContext[key] = null; }, this.ttl);
        }
    };
    Cache.prototype.get = function (context, key, args) {
        var _this = this;
        if (this.type === CacheType.MEMO) {
            if (this.scope === CacheScope.INSTANCE) {
                var caches_1 = context[key] || [];
                return caches_1.filter(function (_a) {
                    var value = _a[0], cachedArgs = _a[1];
                    return _this.compare(cachedArgs, args);
                })[0];
            }
            var caches_2 = GLOBAL_CACHE[key] || [];
            return caches_2.filter(function (_a) {
                var value = _a[0], cachedArgs = _a[1];
                return _this.compare(cachedArgs, args);
            })[0];
        }
        return this.scope === CacheScope.INSTANCE ? (context[key] || [])[0] : (GLOBAL_CACHE[key] || [])[0];
    };
    return Cache;
}());
/**
 * Cache decorator.
 */
function cache(param) {
    if (param === void 0) { param = {}; }
    var _a = param.scope, scope = _a === void 0 ? CacheScope.INSTANCE : _a, _b = param.type, type = _b === void 0 ? CacheType.SINGLETON : _b, _c = param.compare, compare = _c === void 0 ? exports.DEFAULT_COMPARE_FN : _c, _d = param.ttl, ttl = _d === void 0 ? null : _d;
    var cache = new Cache(scope, type, compare, ttl);
    return function (target, propertyKey) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(target, "" + propertyKey);
        var symbolKey = Symbol("__cache_key__" + (typeof target === 'function' ? '__static:' : '') + propertyKey);
        if (propertyDescriptor.set) {
            throw new Error('Setter function can\'t be memozied.');
        }
        var memoizedFn = function (context, type, args) {
            var cachedValue = cache.get(context, symbolKey, args);
            if (cachedValue && cachedValue.length) {
                return cachedValue[0];
            }
            return cache.set(propertyDescriptor[type].apply(context, args), args, context, symbolKey);
        };
        if (propertyDescriptor.get) {
            var descriptor = {
                configurable: propertyDescriptor.configurable,
                enumerable: propertyDescriptor.enumerable,
                get: function () {
                    return memoizedFn(this, 'get', []);
                }
            };
            if (propertyDescriptor.set) {
                descriptor['set'] = propertyDescriptor.set;
            }
            return descriptor;
        }
        if (typeof propertyDescriptor.value !== 'function') {
            throw new Error("Cacheable only a function.");
        }
        return {
            configurable: propertyDescriptor.configurable,
            writable: propertyDescriptor.writable,
            enumerable: propertyDescriptor.enumerable,
            value: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return memoizedFn(this, 'value', args);
            }
        };
    };
}
exports.cache = cache;
function fcache(fn, param) {
    if (param === void 0) { param = {}; }
    var name = fn.name || "" + (Date.now() + Math.round(Math.random() * 10000));
    var CacheWrapper = (function () {
        function CacheWrapper() {
        }
        CacheWrapper[_a = name] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return fn.apply(void 0, args);
        };
        return CacheWrapper;
    }());
    __decorate([
        cache(param)
    ], CacheWrapper, _a, null);
    return (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return CacheWrapper[name].apply(CacheWrapper, args);
    });
    var _a;
}
exports.fcache = fcache;
