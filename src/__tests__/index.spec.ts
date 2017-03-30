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


import {
  cache,
  fcache,
  CacheScope,
  CacheType
} from '../index';
import {
  expect
} from 'chai';


describe('cache-decorator', () => {
  describe('cache', () => {
    it('cache method.', done => {
      class X {
        @cache()
        static test() {
          return Date.now();
        }
      }
      const firstValue = X.test();
      setTimeout(() => {
        expect(X.test()).to.be.eq(firstValue);
        expect(X.test()).to.be.eq(firstValue);
        expect(X.test()).to.be.eq(firstValue);
        done();
      }, 10);
    });


    it('cache in instance.', done => {
      class X {
        @cache({scope: CacheScope.INSTANCE})
        test() {
          return Date.now();
        }
      }
      const x = new X();
      const firstValue = x.test();
      setTimeout(() => {
        expect(x.test()).to.be.eq(firstValue);
        expect(x.test()).to.be.eq(firstValue);
        expect(x.test()).to.be.eq(firstValue);
        const y = new X();
        expect(y.test()).to.be.not.equal(firstValue);
        done();
      }, 10);
    });


    it('cache in global.', done => {
      class X {
        @cache({scope: CacheScope.GLOABL})
        test() {
          return Date.now();
        }
      }
      const x = new X();
      const firstValue = x.test();
      setTimeout(() => {
        expect(x.test()).to.be.eq(firstValue);
        expect(x.test()).to.be.eq(firstValue);
        expect(x.test()).to.be.eq(firstValue);
        const y = new X();
        expect(y.test()).to.be.equal(firstValue);
        done();
      }, 10);
    });

    it('cache type SINGLETON always return same value.', done => {
      class X {
        @cache({type: CacheType.SINGLETON})
        test(a: number) {
          return Date.now() + a;
        }
      }
      const x = new X();
      const firstValue = x.test(1);
      setTimeout(() => {
        expect(x.test(2)).to.be.eq(firstValue);
        expect(x.test(3)).to.be.eq(firstValue);
        expect(x.test(4)).to.be.eq(firstValue);
        done();
      }, 10);
    });

    it('cache type MEMO compare arguments and return matched value.', done => {
      class X {
        @cache({type: CacheType.MEMO})
        test(a: number, b: number) {
          return Date.now() + a + b;
        }
      }
      const x = new X();
      const firstValue = x.test(1, 2);
      setTimeout(() => {
        expect(x.test(1, 2)).to.be.eq(firstValue);
        expect(x.test(1, 3)).to.be.not.eq(firstValue);
        expect(x.test(2, 1)).to.be.not.eq(firstValue);
        done();
      }, 10);
    });

    it('cache type MEMO compare function customizable.', done => {
      interface Value {id: number};
      class X {
        @cache({type: CacheType.MEMO, compare(prev, next) {return prev.length === next.length && prev.every(({id}, i) => id === next[i].id)}})
        test(a: Value, b: Value) {
          return Date.now() + a.id + b.id;
        }
      }
      const x = new X();
      const firstValue = x.test({id: 1}, {id: 2});
      setTimeout(() => {
        expect(x.test({id: 1}, {id: 2})).to.be.eq(firstValue);
        expect(x.test({id: 1}, {id: 3})).to.be.not.eq(firstValue);
        expect(x.test({id: 3}, {id: 1})).to.be.not.eq(firstValue);
        done();
      }, 10);
    })
  });

  describe('fcache', () => {
    it('cache function.', done => {
      const test = fcache(() => {
        return Date.now();
      });
      
      const firstValue = test();
      setTimeout(() => {
        expect(test()).to.be.eq(firstValue);
        expect(test()).to.be.eq(firstValue);
        expect(test()).to.be.eq(firstValue);
        done();
      }, 10);
    });

    it('cache type SINGLETON always return same value.', done => {
      const test = fcache((a: number) => {
        return Date.now() + a;
      }, {type: CacheType.SINGLETON});
      const firstValue = test(1);
      setTimeout(() => {
        expect(test(2)).to.be.eq(firstValue);
        expect(test(3)).to.be.eq(firstValue);
        expect(test(4)).to.be.eq(firstValue);
        done();
      }, 10);
    });

    it('cache type MEMO compare arguments and return matched value.', done => {
      const test = fcache((a: number, b: number) => {
        return Date.now() + a;
      }, {type: CacheType.MEMO});
      const firstValue = test(1, 2);
      setTimeout(() => {
        expect(test(1, 2)).to.be.eq(firstValue);
        expect(test(1, 3)).to.be.not.eq(firstValue);
        expect(test(2, 1)).to.be.not.eq(firstValue);
        done();
      }, 10);
    });

    it('cache type MEMO compare function customizable.', done => {
      interface Value {id: number};
      const test = fcache((a: Value, b: Value) => {
        return Date.now() + a.id + b.id;
      }, {type: CacheType.MEMO, compare(prev, next) {return prev.length === next.length && prev.every(({id}, i) => id === next[i].id)}});
      const firstValue = test({id: 1}, {id: 2});
      setTimeout(() => {
        expect(test({id: 1}, {id: 2})).to.be.eq(firstValue);
        expect(test({id: 1}, {id: 3})).to.be.not.eq(firstValue);
        expect(test({id: 3}, {id: 1})).to.be.not.eq(firstValue);
        done();
      }, 10);
    })
  })
});
