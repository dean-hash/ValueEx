// Common type definitions to replace {} and any types

// Replace {} with this type when you need a generic object type
export type GenericObject = Record<string, unknown>;

// Replace {} with this type when you need an empty object type
export type EmptyObject = Record<string, never>;

// Use this instead of any for unknown data
export type UnknownData = unknown;

// Use this for function parameters that can be any value
export type AnyValue = unknown;

// Use this for objects with string keys and any value
export type StringKeyedObject = Record<string, unknown>;

// Use this for objects that might have nested properties
export type NestedObject = {
  [key: string]: unknown | NestedObject;
};

// Use this for API responses that might have any shape
export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T;
  error?: string;
};

// Use this for configuration objects
export type Config = {
  [key: string]: unknown;
};

// Use this for event handlers
export type EventHandler<T = unknown> = (event: T) => void;

// Use this for async functions that return unknown data
export type AsyncFunction<T = unknown> = () => Promise<T>;

// Use this for callback functions
export type Callback<T = void> = (error?: Error | null, result?: T) => void;
