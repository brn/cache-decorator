# What's this?

cache-decorator is function/method cache implementation of ES decorator.

## Installation

```
npm install cache-decorator --save
```

or

```
yarn add cache-decorator --save
```

## Usage

### Method cache.

For javascript/babel

```javascript
import {
  cache,
  CacheType,
  CacheScope
} from 'cache-decorator';

class Example {
  @cache({type: CacheType.MEMO, scope: CacheScope.INSTANCE})
  expensiveCalc(args) {...}
}
```

For typescript

tsconfig.json
```json
{
  "compilerOptions": {
    ...
    paths: {
      "cache-decorator": ["node_modules/cache-decorator/lib/index.d.ts"]
    }
  },
}
```

```typescript
import {
  cache,
  CacheType,
  CacheScope
} from 'cache-decorator';

class Example {
  @cache({type: CacheType.MEMO, scope: CacheScope.INSTANCE})
  public expensiveCalc(args) {...}
}
```

### Function cache

For javascript/babel

```javascript
import {
  fcache,
  CacheType
} from 'cache-decorator';

const cachedFn = fcache((args) => {
  ...
}, {type: CacheType.MEMO})
```

For typescript

tsconfig.json
```json
{
  "compilerOptions": {
    ...
    paths: {
      "cache-decorator": ["node_modules/cache-decorator/lib/index.d.ts"]
    }
  },
}
```

```typescript
import {
  cache,
  CacheType,
  CacheScope
} from 'cache-decorator';

const cachedFn = fcache((args: Object) => {
  ...
}, {type: CacheType.MEMO})
```

## Cache Options


```
interface CacheOption {
  type?: CacheType;
  scope?: CacheScope;
  ttl?: number;
  compare?: (prev: any, next: any) => boolean;
}
```


### `type: CacheType`

*default value:* `CacheType.SINGLETON`

**`SINGLETON`**

* 1. Search caches.
* 2. If found, return cache value, otherwise call function and set result to cache.
* 3. Return result.


**`MEMO`**

* 1. Search caches with passed arguments and compare them with other cached arguments.
* 2. If value is found, return it otherwise call function and set pair of return value and arguments to cache.
* 3. Return result.


### `scope: CacheScope`

*default value:* `CacheScope.INSTANCE`

**`INSTANCE`**

Cache value is reserved in class instance, so new instance will be created, that instance has't have any cache value.  
Every instance has self cache.

**`GLOBAL`**

Reserve cache value to global area, so new instance will be created, but that instance return same cached value.


### `ttl: number`

*default value*: `null`

If ttl was specified, cached value was removed after specified milliseconds.


### `compare: Function`

*default value*: `(a, b) => a.length === b.length && a.every((v, i) => v === b[i])`

Arguments comparison function used if type is `MEMO`.  
Default value of this options is compare `===`.


## Contribute

Fork!
```
yarn run ut
yarn run minify
```
Send PR!

