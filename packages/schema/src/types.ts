// pattern: Functional Core
// TypeBox-based schema type constructors for Relish primitives

import { Type, type TSchema } from "@sinclair/typebox";
import { TypeCode } from "@grounds/core";
import { RelishKind, RelishTypeCode } from "./symbols.js";

// Base Relish schema type with metadata
export type TRelishSchema<T = unknown> = TSchema & {
  [RelishKind]: string;
  [RelishTypeCode]: TypeCode;
  static: T;
};

// Null schema
export type TRNull = TRelishSchema<null> & { [RelishKind]: "RNull" };

export function RNull(): TRNull {
  return {
    ...Type.Null(),
    [RelishKind]: "RNull",
    [RelishTypeCode]: TypeCode.Null,
  } as TRNull;
}

// Bool schema
export type TRBool = TRelishSchema<boolean> & { [RelishKind]: "RBool" };

export function RBool(): TRBool {
  return {
    ...Type.Boolean(),
    [RelishKind]: "RBool",
    [RelishTypeCode]: TypeCode.Bool,
  } as TRBool;
}

// Unsigned integers
export type TRU8 = TRelishSchema<number> & { [RelishKind]: "RU8" };
export type TRU16 = TRelishSchema<number> & { [RelishKind]: "RU16" };
export type TRU32 = TRelishSchema<number> & { [RelishKind]: "RU32" };
export type TRU64 = TRelishSchema<bigint> & { [RelishKind]: "RU64" };
export type TRU128 = TRelishSchema<bigint> & { [RelishKind]: "RU128" };

export function RU8(): TRU8 {
  return {
    ...Type.Integer({ minimum: 0, maximum: 255 }),
    [RelishKind]: "RU8",
    [RelishTypeCode]: TypeCode.U8,
  } as TRU8;
}

export function RU16(): TRU16 {
  return {
    ...Type.Integer({ minimum: 0, maximum: 65535 }),
    [RelishKind]: "RU16",
    [RelishTypeCode]: TypeCode.U16,
  } as TRU16;
}

export function RU32(): TRU32 {
  return {
    ...Type.Integer({ minimum: 0, maximum: 0xFFFFFFFF }),
    [RelishKind]: "RU32",
    [RelishTypeCode]: TypeCode.U32,
  } as TRU32;
}

export function RU64(): TRU64 {
  return {
    ...Type.BigInt(),
    [RelishKind]: "RU64",
    [RelishTypeCode]: TypeCode.U64,
  } as TRU64;
}

export function RU128(): TRU128 {
  return {
    ...Type.BigInt(),
    [RelishKind]: "RU128",
    [RelishTypeCode]: TypeCode.U128,
  } as TRU128;
}

// Signed integers
export type TRI8 = TRelishSchema<number> & { [RelishKind]: "RI8" };
export type TRI16 = TRelishSchema<number> & { [RelishKind]: "RI16" };
export type TRI32 = TRelishSchema<number> & { [RelishKind]: "RI32" };
export type TRI64 = TRelishSchema<bigint> & { [RelishKind]: "RI64" };
export type TRI128 = TRelishSchema<bigint> & { [RelishKind]: "RI128" };

export function RI8(): TRI8 {
  return {
    ...Type.Integer({ minimum: -128, maximum: 127 }),
    [RelishKind]: "RI8",
    [RelishTypeCode]: TypeCode.I8,
  } as TRI8;
}

export function RI16(): TRI16 {
  return {
    ...Type.Integer({ minimum: -32768, maximum: 32767 }),
    [RelishKind]: "RI16",
    [RelishTypeCode]: TypeCode.I16,
  } as TRI16;
}

export function RI32(): TRI32 {
  return {
    ...Type.Integer({ minimum: -0x80000000, maximum: 0x7FFFFFFF }),
    [RelishKind]: "RI32",
    [RelishTypeCode]: TypeCode.I32,
  } as TRI32;
}

export function RI64(): TRI64 {
  return {
    ...Type.BigInt(),
    [RelishKind]: "RI64",
    [RelishTypeCode]: TypeCode.I64,
  } as TRI64;
}

export function RI128(): TRI128 {
  return {
    ...Type.BigInt(),
    [RelishKind]: "RI128",
    [RelishTypeCode]: TypeCode.I128,
  } as TRI128;
}

// Floats
export type TRF32 = TRelishSchema<number> & { [RelishKind]: "RF32" };
export type TRF64 = TRelishSchema<number> & { [RelishKind]: "RF64" };

export function RF32(): TRF32 {
  return {
    ...Type.Number(),
    [RelishKind]: "RF32",
    [RelishTypeCode]: TypeCode.F32,
  } as TRF32;
}

export function RF64(): TRF64 {
  return {
    ...Type.Number(),
    [RelishKind]: "RF64",
    [RelishTypeCode]: TypeCode.F64,
  } as TRF64;
}
