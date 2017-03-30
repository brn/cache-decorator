export declare enum CacheScope {
    GLOABL = 1,
    INSTANCE = 2,
}
export declare enum CacheType {
    SINGLETON = 1,
    MEMO = 2,
    TTL = 3,
}
export declare type Comparator = (newVal: any, oldVal: any) => boolean;
export declare const DEFAULT_COMPARE_FN: (a: any, b: any) => any;
export declare type FunctionCacheOption = {
    type?: CacheType;
    ttl?: number;
    compare?: Comparator;
};
export declare type CacheOption = {
    scope?: CacheScope;
    type?: CacheType;
    ttl?: number;
    compare?: Comparator;
};
/**
 * Cache decorator.
 */
export declare function cache(param?: CacheOption): (target: Object, propertyKey: string | symbol) => PropertyDescriptor;
export declare function fcache<T extends Function>(fn: T, param?: FunctionCacheOption): T;
