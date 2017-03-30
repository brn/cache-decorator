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


declare var global: any;
const g = typeof global === 'object'? global: typeof window === 'object'? window: this || {};

const Symbol = typeof g.Symbol === 'function'? g.Symbol: (() => {
  const map = {};
  function Symbol(sym: string) {
    return `@@${sym}`;
  }
  Symbol['for'] = (sym: string) => {
    if (map[sym]) {
      return map[sym];
    }
    return map[sym] = Symbol(sym);
  }
})();


export enum CacheScope {
  GLOABL = 1,
  INSTANCE
}


export enum CacheType {
  SINGLETON = 1,
  MEMO,
  TTL
}


export type Comparator = (newVal: any, oldVal: any) => boolean;
export const DEFAULT_COMPARE_FN = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);


export type FunctionCacheOption = {
  type?: CacheType;
  ttl?: number;
  compare?: Comparator;
}


export type CacheOption = {
  scope?: CacheScope;
  type?: CacheType;
  ttl?: number;
  compare?: Comparator;
}


/**
 * Controll caches lifetime.
 */
class Cache {
  constructor(
    private scope: CacheScope,
    private type: CacheType,
    private compare: Comparator,
    private ttl: number) {}


  public set(val: any, args: any[], context: any, key: symbol): any {
    if (context[key]) {
      const result = context[key].filter(([value, cachedArgs]) => this.compare(cachedArgs, args));
      if (!result.length) {
        context[key].push([val, args])
      }
    } else {
      context[key] = [[val, args]];
    }
    if (this.type === CacheType.TTL) {
      if (!this.ttl) {
        throw new Error('ttl required in CacheType.TTL');
      }
      setTimeout(() => context[key] = null, this.ttl);
    }
    return val;
  }


  public get(context: any, key: symbol, args: any[]): any {
    if (this.type === CacheType.MEMO) {
      const caches = context[key] || [];
      return caches.filter(([value, cachedArgs]) => this.compare(cachedArgs, args))[0];
    }
    return (context[key] || [])[0];
  }
}


const GLOBAL_SYMBOL = Symbol('__global_cache');


/**
 * Cache decorator.
 */
export function cache(param: CacheOption = {}) {
  const {
    scope = CacheScope.INSTANCE,
    type = CacheType.SINGLETON,
    compare = DEFAULT_COMPARE_FN,
    ttl = null
  } = param;

  const cache = new Cache(scope, type, compare, ttl);

  return (target: Object, propertyKey: string | symbol): PropertyDescriptor => {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(target, `${propertyKey}`);
    const symbolKey = Symbol(`__cache_key__${typeof target === 'function'? '__static:': ''}${propertyKey}`);

    if (scope === CacheScope.GLOABL) {
      target[GLOBAL_SYMBOL] = {};
    }
    
    if (propertyDescriptor.set) {
      throw new Error('Setter function can\'t be memozied.');
    }

    const memoizedFn = (context: any, type: string, args) => {
      const cachedValue = cache.get(context, symbolKey, args);
      if (cachedValue && cachedValue.length) {
        return cachedValue[0];
      }
      return cache.set(propertyDescriptor[type].apply(context, args), args, context, symbolKey);
    }
    
    if (propertyDescriptor.get) {
      const descriptor = {
        configurable: propertyDescriptor.configurable,
        enumerable: propertyDescriptor.enumerable,
        get() {
          return memoizedFn(scope === CacheScope.INSTANCE? this: target[GLOBAL_SYMBOL], 'get', []);
        }
      };
      if (propertyDescriptor.set) {
        descriptor['set'] = propertyDescriptor.set;
      }
      return descriptor;
    }

    if (typeof propertyDescriptor.value !== 'function') {
      throw new Error(`Cacheable only a function.`);
    }

    return {
      configurable: propertyDescriptor.configurable,
      writable: propertyDescriptor.writable,
      enumerable: propertyDescriptor.enumerable,
      value(...args) {
        return memoizedFn(scope === CacheScope.INSTANCE? this: target[GLOBAL_SYMBOL], 'value', args);
      }
    };
  }
}

export function fcache<T extends Function>(fn: T, param: FunctionCacheOption = {}): T {
  const name = fn.name || `${Date.now() + Math.round(Math.random() * 10000)}`;
  class CacheWrapper {
    @cache(param)
    static [name](...args) {
      return fn(...args);
    }
  }

  return ((...args) => CacheWrapper[name](...args)) as any;
}
