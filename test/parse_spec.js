/* jshint globalstrict: true */
/* global parse: false */
'use strict';

describe("parse", function() {
  it("can parse an integer", function() {
    var fn = parse('42');
    expect(fn).toBeDefined();
    expect(fn()).toBe(42);
  });

  it("makes integer both constant and literal", function() {
    var fn = parse('42');
    expect(fn.constant).toBe(true);
    expect(fn.literal).toBe(true);
  });

  it("can parse floating point number", function() {
    var fn = parse('4.2');
    expect(fn()).toBe(4.2);
  });

  it("can parse floating point number without any integer", function() {
    var fn = parse('.42');
    expect(fn()).toBe(0.42);
  });

  it("can parse a number in scientific notation", function() {
    var fn = parse('42e3');
    expect(fn()).toBe(42000);
  });

  it("can parse scientific notation with a float coefficient", function() {
    var fn = parse('.42e2');
    expect(fn()).toBe(42);
  });

  it("can parse scientific notation with a negative exponents", function() {
    var fn = parse('4200e-2');
    expect(fn()).toBe(42);
  });
  
  it("can parse scientific notation with a the + signe", function() {
    var fn = parse('.42e+2');
    expect(fn()).toBe(42);
  });
  
  it("can parse upcase scientific notation", function() {
    var fn = parse('.42E2');
    expect(fn()).toBe(42);
  });

  it("will not parse invali scientific notation", function() {
    expect(function() { parse('42e-'); }).toThrow();
    expect(function() { parse('42e-a'); }).toThrow();
  });

  it("can parse a strict in signe quotes", function() {
    var fn = parse("'abc'");
    expect(fn()).toBe('abc');
  });

  it("can parse a strict in double quotes", function() {
    var fn = parse('"abc"');
    expect(fn()).toBe('abc');
  });

  it("will not parse string with mismatching quotes", function() {
    expect(function() { parse('"abc\''); }).toThrow();
  });

  it("mark string as literal and constant", function() {
    var fn = parse('"abc"');
    expect(fn.literal).toBe(true);
    expect(fn.constant).toBe(true);
  });

  it("will parse a string with character escapes", function() {
    var fn = parse('"\\n\\r\\\\"');
    expect(fn()).toBe('\n\r\\');
  });

  it("will parse a string with unicode escapes", function() {
    var fn = parse('"\\u00A0"');
    expect(fn()).toBe('\u00A0');
  });

  it("will not parse a string with invalid unicode escapes", function() {
    expect(function() {
      parse('"\\u00T0"');
    }).toThrow();
  });

  it("will parse null", function() {
    var fn = parse('null');
    expect(fn()).toBe(null);
  });

  it("will parse true", function() {
    var fn = parse('true');
    expect(fn()).toBe(true);
  });

  it("will parse false", function() {
    var fn = parse('false');
    expect(fn()).toBe(false);
  });

  it("marks boolens as literal and constant", function() {
    var fn = parse('true');
    expect(fn.literal).toBe(true);
    expect(fn.constant).toBe(true);
  });

  it("marks null as literal and constant", function() {
    var fn = parse('null');
    expect(fn.literal).toBe(true);
    expect(fn.constant).toBe(true);
  });

  it("ignore whitespace", function() {
    var fn = parse(' \n42\u00A0');
    expect(fn()).toBe(42);
  });

  it("will parse an empty array", function() {
    var fn = parse('[]');
    expect(fn()).toEqual([]);
  });

  it("will parse a non-empty array", function() {
    var fn = parse('[1, "two", [3]]');
    expect(fn()).toEqual([1, "two", [3]]);
  });

  it("will parse an array with trailing commas", function() {
    var fn = parse('[1, 2, 3, ]');
    expect(fn()).toEqual([1, 2, 3]);
  });

  it("marks array as literal and constant", function() {
    var fn = parse('[1, 2, 3]');
    expect(fn.literal).toBe(true);
    expect(fn.constant).toBe(true);
  });

  it("will parse an empty object", function() {
    var fn = parse('{}');
    expect(fn()).toEqual({});
  });

  it("will parse a non-empty object", function() {
    var fn = parse('{a: 1, b: [2, 2], c: {d: 4}}');
    expect(fn()).toEqual({a: 1, b: [2, 2], c: {d: 4}});
  });

  it("will parse an object with string key", function() {
    var fn = parse('{"a key": 1, \'another-key\': 2 }');
    expect(fn()).toEqual({'a key': 1, 'another-key': 2});
  });

});