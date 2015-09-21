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

	it("looks up on attribute from the scope", function() {
		var fn = parse('aKey');
		expect(fn({aKey: 42})).toBe(42);
		expect(fn({})).toBeUndefined();
		expect(fn()).toBeUndefined();
	});

	it("looks un on 2-part identifire path from the scope", function() {
		var fn = parse('aKey.anotherKey');
		expect(fn({aKey: {anotherKey: 42}})).toBe(42);
		expect(fn({aKey: {}})).toBeUndefined();
		expect(fn({})).toBeUndefined();
	});

	it("looks un on 4-part identifire path from the scope", function() {
		var fn = parse('aKey.secondKey.thirdKey.fourthKey');
		expect(fn({aKey: {secondKey: {thirdKey: {fourthKey: 42}}}})).toBe(42);
		expect(fn({aKey: {secondKey: {thirdKey: {}}}})).toBeUndefined();
		expect(fn({aKey: {}})).toBeUndefined();
		expect(fn()).toBeUndefined();
	});

	it("uses lokals insted of scope when there is a mismatching key", function() {
		var fn = parse('aKey');
		expect(fn({aKey: 42}, {aKey: 43})).toBe(43);
	});

	it("dose not uses lokals insted of scope when no mismatching key", function() {
		var fn = parse('aKey');
		expect(fn({aKey: 42}, {otherKey: 43})).toBe(42);
	});

	it("uses lokals when a 2-part key matches in lokals", function() {
		var fn = parse('aKey.anotherKey');
		expect(fn(
			{aKey: {anotherKey: 42}}, 
			{aKey: {anotherKey: 43}}
		)).toBe(43);
	});

	it("dose not uses lokals when a 2-part key dose not match", function() {
		var fn = parse('aKey.anotherKey');
		expect(fn(
			{aKey: {anotherKey: 42}}, 
			{otherKey: {anotherKey: 43}}
		)).toBe(42);
	});

	it("use locals insted of scope when the first part matches", function() {
		var fn = parse('aKey.anotherKey');
		expect(fn(
			{aKey: {anotherKey: 42}}, 
			{aKey: {}}
		)).toBeUndefined();
	});

	it("uses lokals when there is a mismatching locals 4-part key", function() {
		var fn = parse('aKey.key2.key3.key4');
		expect(fn(
			{aKey: {key2: {key3: {key4: 42}}}}, 
			{aKey: {key2: {key3: {key4: 43}}}}
		)).toBe(43);
	});

	it("uses lokals when there is a first part in the locals key", function() {
		var fn = parse('aKey.key2.key3.key4');
		expect(fn(
			{aKey: {key2: {key3: {key4: 42}}}}, 
			{aKey: {}}
		)).toBeUndefined();
	});

	it("dose not uses lokals when there is no mismatching 4-part key", function() {
		var fn = parse('aKey.key2.key3.key4');
		expect(fn(
			{aKey: {key2: {key3: {key4: 42}}}},
			{otherKey: {anotherKey: 43}}
		)).toBe(42);
	});

	it("parses a simple string property access", function() {
		var fn = parse('aKey["anotherKey"]');
		expect(fn({aKey: {anotherKey: 42}})).toBe(42);
	});

	it("parses a numerick array access", function() {
		var fn = parse('anArray[1]');
		expect(fn({anArray: [1, 2, 3]})).toBe(2);
	});

	it("parses a property access with another key as property", function() {
		var fn = parse('lock[key]');
		expect(fn({key: 'theKey', lock: {theKey: 42}})).toBe(42);
	});

	it("parses property access with another access as property", function() {
		var fn = parse('lock[keys["aKey"]]');
		expect(fn({keys: { aKey: 'theKey' }, lock: { theKey: 42 }})).toBe(42);
	});

	it("parses several field access back to back", function() {
		var fn = parse('lock["anotherKey"]["aThirdKey"]');
		expect(fn({lock: { anotherKey: {aThirdKey: 42} }})).toBe(42);
	});

	it("parses a field access after property access", function() {
		var fn = parse('lock["anotherKey"].aThirdKey');
		expect(fn({lock: { anotherKey: {aThirdKey: 42} }})).toBe(42);
	});

	it("parses a chain of property and field access", function() {
		var fn = parse('aKey["anotherKey"].aThirdKey["aFourthKey"]');
		expect(fn({aKey: { anotherKey: {aThirdKey: {aFourthKey: 42}} }})).toBe(42);
	});

	it("parses a function call", function() {
		var fn = parse('aFunction()');
		expect(fn({aFunction: function() { return 42; }})).toBe(42);
	});

	it("parses a function call with a single number argument", function() {
		var fn = parse('aFunction(42)');
		expect(fn({aFunction: function(n) { return n; }})).toBe(42);
	});

	it("parses a function call", function() {
		var fn = parse('aFunction(argFn())');
		expect(fn({
			argFn: _.constant(42),
			aFunction: function(n) { return n; }
		})).toBe(42);
	});

	it("parses a function call with a multiple arguments", function() {
		var fn = parse('aFunction(37, n, argFn())');
		expect(fn({
			n: 3,
			argFn: _.constant(2),
			aFunction: function(a1, a2, a3) { return a1 + a2 + a3; }
		})).toBe(42);
	});

	it("dose not allow calling the function constructor", function() {
		expect(function() {
			var fn = parse('aFunction.constructor("return window;")()');
			fn({aFunction: _.noop});
		}).toThrow();
	});

	it("dose not allow accessing __proto__", function() {
		expect(function() {
			var fn = parse('obj.__proto__');
			fn({obj: {}});
		}).toThrow();
	});

	it("dose not allow calling __difineGetter__", function() {
		expect(function() {
			var fn = parse('obj.__difineGetter__("evil", fn)');
			fn({obj: {}, fn: _.noop});
		}).toThrow();
	});
	it("dose not allow calling __difineSetter__", function() {
		expect(function() {
			var fn = parse('obj.__difineSetter__("evil", fn)');
			fn({obj: {}, fn: _.noop});
		}).toThrow();
	});

	it("dose not allow calling __lookupGetter__", function() {
		expect(function() {
			var fn = parse('obj.__lookupGetter__("evil")');
			fn({obj: {}});
		}).toThrow();
	});

	it("dose not allow calling __lookupSetter__", function() {
		expect(function() {
			var fn = parse('obj.__lookupSetter__("evil")');
			fn({obj: {}});
		}).toThrow();
	});

	it("calls function accessed as property with the correct this", function() {
		var scope = {
			anObject: {
				aMember: 42,
				aFunction: function() {
					return this.aMember;
				}
			}
		};
		var fn = parse('anObject["aFunction"]()');
		expect(fn(scope)).toBe(42);
	});

	it("calls function accessed as field with the correct this", function() {
		var scope = {
			anObject: {
				aMember: 42,
				aFunction: function() {
					return this.aMember;
				}
			}
		};
		var fn = parse('anObject.aFunction()');
		expect(fn(scope)).toBe(42);
	});

	it("calls methods with whitespace before function call", function() {
		var scope = {
			anObject: {
				aMember: 42,
				aFunction: function() {
					return this.aMember;
				}
			}
		};
		var fn = parse('anObject.aFunction    ()');
		expect(fn(scope)).toBe(42);
	});

	it("clears this context on function call", function() {
		var scope = {
			anObject: {
				aMember: 42,
				aFunction: function() {
					return function() {
						return this.aMember;
					};
				}
			}
		};
		var fn = parse('anObject.aFunction()()');
		expect(fn(scope)).toBeUndefined();
	});

	it("dose not allow accessing window as property", function() {
		var fn = parse('anObject["wnd"]');
		expect(function(){
			fn({ anObject: {wnd: window }});
		}).toThrow();
	});

	it("dose not allow calling function of window", function() {
		var fn = parse('wnd.scrollTo(500, 0)');
		expect(function(){
			fn({wnd: window });
		}).toThrow();
	});

	it("dose not allow function to return window", function() {
		var fn = parse('getWnd()');
		expect(function(){
			fn({getWnd: _.constant(window) });
		}).toThrow();
	});

	it("dose not allow calling functions on DOM element", function() {
		var fn = parse('el.setAttribute("evil", "true")');
		expect(function(){
			fn({el: document.documentElement});
		}).toThrow();
	});

	it("dose not allow calling the aliased functions constructor", function() {
		var fn = parse('fnConstructor("return window;")');
		expect(function(){
			fn({fnConstructor: (function(){}).constructor});
		}).toThrow();
	});

	it("dose not allow calling functions on Object", function() {
		var fn = parse('obj.create({})');
		expect(function(){
			fn({obj: Object});
		}).toThrow();
	});

	it("dose not allow calling call", function() {
		var fn = parse('fub.call({})');
		expect(function(){
			fn({fub: function() {}});
		}).toThrow();
	});

	it("dose not allow calling apply", function() {
		var fn = parse('fub.apply({})');
		expect(function(){
			fn({fub: function() {}});
		}).toThrow();
	});

	it("dose not allow calling bind", function() {
		var fn = parse('fub.bind({})');
		expect(function(){
			fn({fub: function() {}});
		}).toThrow();
	});

	it("parses a simple attribute assignment", function() {
		var fn = parse('anAttr = 42');
		var scope = {};
		fn(scope);
		expect(scope.anAttr).toBe(42);
	});

	it("can assign any primary expression", function() {
		var fn = parse('anAttr = anFunction()');
		var scope = {anFunction: _.constant(42)};
		fn(scope);
		expect(scope.anAttr).toBe(42);
	});

	it("parses a nested attribute assignment", function() {
		var fn = parse('anObj.anAttr = 42');
		var scope = {anObj: {}};
		fn(scope);
		expect(scope.anObj.anAttr).toBe(42);
	});

	it("creates the object in the setter path do no exist", function() {
		var fn = parse('some.nested.path = 42');
		var scope = {};
		fn(scope);
		expect(scope.some.nested.path).toBe(42);
	});

	// TODO: resolve this case
	// it("parses an assignment through attribute access", function() {
	//   var fn = parse('anObject["anAttribute"] = 42');
	//   var scope = {};
	//   fn(scope);
	//   expect(scope.anObject.anAttribute).toBe(42);
	// });

	it("parses an assignment through attribute access", function() {
		var fn = parse('anObject["anAttribute"] = 42');
		var scope = {anObject: {}};
		fn(scope);
		expect(scope.anObject.anAttribute).toBe(42);
	});

	it("parses assignment through field access after something else", function() {
		var fn = parse('anObject["otherObject"].nested = 42');
		var scope = {anObject: {otherObject: {}}};
		fn(scope);
		expect(scope.anObject.otherObject.nested).toBe(42);
	});

	it("parses an array with non-literals", function() {
		var fn = parse('[a, b, c()]');
		var scope = {a: 1, b: 2, c: _.constant(3)};
		expect(fn(scope)).toEqual([1, 2, 3]);
	});

	it("parses an object with non-literals", function() {
		var fn = parse('{a: a, b: obj.c()}');
		var scope = {
			a: 1,
			obj: {
				b: _.constant(3),
				c: function() {
					return this.b();
				}
			}
		};
		expect(fn(scope)).toEqual({a: 1, b: 3});
	});

	it("makes arrays constant when they only contain constants", function() {
		var fn = parse('[1, 2, [3, 4]]');
		expect(fn.constant).toBe(true);
	});

	it("makes arrays non-constant when they contain non-constants", function() {
		expect(parse('[1, 2, a]').constant).toBe(false);
		expect(parse('[1, 2, [[[[a]]]]]').constant).toBe(false);
	});

	it("makes objects non-constant when they contain non-constants", function() {
		expect(parse('{a: 1, b: c}').constant).toBe(false);
		expect(parse('{a: 1, b: {c: d}}').constant).toBe(false);
	});

	it("allows an array element to be an assignment", function() {
		var fn = parse('[a = 1]');
		var scope = {};
		expect(fn(scope)).toEqual([1]);
		expect(scope.a).toBe(1);
	});

	it("allows an object value to be an assignment", function() {
		var fn = parse('{a: b = 1}');
		var scope = {};
		expect(fn(scope)).toEqual({a: 1});
		expect(scope.b).toBe(1);
	});

	it("parses a unary +", function() {
		expect(parse('+42')()).toBe(42);
		expect(parse('+a')({a: 42})).toBe(42);
	});

	it("parses a unary !", function() {
		expect(parse('!true')()).toBe(false);
		expect(parse('!42')()).toBe(false);
		expect(parse('!a')({a: false})).toBe(true);
		expect(parse('!!a')({a: false})).toBe(false);
	});

	it("parses negated value as constant if value is constant", function() {
		expect(parse('!true').constant).toBe(true);
		expect(parse('!!true').constant).toBe(true);
		expect(parse('!a').constant).toBeFalsy(false);
	});

	it("parses a unary -", function() {
		expect(parse('-42')()).toBe(-42);
		expect(parse('-a')({a: -42})).toBe(42);
		expect(parse('--a')({a: -42})).toBe(-42);
	});

	it("parses a unary -", function() {
		expect(parse('-42')()).toBe(-42);
		expect(parse('-a')({a: -42})).toBe(42);
		expect(parse('--a')({a: -42})).toBe(-42);
	});

	it("fills missin value in unary with zero", function() {
		expect(parse('-a')()).toBe(0);
	});

	it("parses a multiplication", function() {
		expect(parse('21 * 2')()).toBe(42);
	});

	it("parses a division", function() {
		expect(parse('84 / 2')()).toBe(42);
	});

	it("parses a remainder", function() {
		expect(parse('85 % 43')()).toBe(42);
	});

	it("parses a multiplicatives", function() {
		expect(parse('36 * 2 % 5')()).toBe(2);
	});

	it("parses an addition", function() {
		expect(parse('20 + 22')()).toBe(42);
	});

	it("parses an subtraction", function() {
		expect(parse('42 - 22')()).toBe(20);
	});

	it("parses multiplicatives with a higher precedence than additives", function() {
		expect(parse('2 + 3 * 5')()).toBe(17);
		expect(parse('2 + 3 * 2 + 3')()).toBe(11);
	});

	it('treats a missing subtraction operand as zero', function() {
		expect(parse('a - b')({a: 20})).toBe(20);
		expect(parse('a - b')({b: 20})).toBe(-20);
		expect(parse('a - b')({})).toBe(0);
	});

	it('treats a missing addition operand as zero', function() {
		expect(parse('a + b')({a: 20})).toBe(20);
		expect(parse('a + b')({b: 20})).toBe(20);
	});

	it('returns undefined from addition when both operands missing', function() {
		expect(parse('a + b')()).toBeUndefined();
	});

	it('parses relational operators', function() {
		expect(parse('1 < 2')()).toBe(true);
		expect(parse('1 > 2')()).toBe(false);
		expect(parse('1 <= 2')()).toBe(true);
		expect(parse('2 <= 2')()).toBe(true);
		expect(parse('1 >= 2')()).toBe(false);
		expect(parse('2 >= 2')()).toBe(true);
	});

	it('parses equality operators', function() {
		expect(parse('42 == 42')()).toBe(true);
		expect(parse('42 == "42"')()).toBe(true);
		expect(parse('42 != 42')()).toBe(false);
		expect(parse('42 === 42')()).toBe(true);
		expect(parse('42 === "42"')()).toBe(false);
		expect(parse('42 !== 42')()).toBe(false);
	});

	it('parses relationals on a higher precedence than equality', function() {
		expect(parse('2 == "2" > 2 === "2"')()).toBe(false);
	});

	it('parses additives on a higher precedence than relationals', function() {
		expect(parse('2 + 3 < 6 - 2')()).toBe(false);
	});

	it('parses logical AND', function() {
		expect(parse('true && true')()).toBe(true);
		expect(parse('true && false')()).toBe(false);
	});

	it('parses logical OR', function() {
		expect(parse('true || true')()).toBe(true);
		expect(parse('true || false')()).toBe(true);
		expect(parse('fales || false')()).toBe(false);
	});

	it('parses multiple ANDs', function() {
		expect(parse('true && true && true')()).toBe(true);
		expect(parse('true && true && false')()).toBe(false);
	});

	it('parses multiple ORs', function() {
		expect(parse('true || true || true')()).toBe(true);
		expect(parse('true || true || false')()).toBe(true);
		expect(parse('false || false || true')()).toBe(true);
		expect(parse('false || false || false')()).toBe(false);
	});

	it('short-circuits AND', function() {
		var invoked;
		var scope = {fn: function() { invoked = true; }};
		parse('false && fn()')(scope);
		expect(invoked).toBeUndefined();
	});

	it('short-circuits OR', function() {
		var invoked;
		var scope = {fn: function() { invoked = true; }};
		parse('true || fn()')(scope);
		expect(invoked).toBeUndefined();
	});

	it('parses AND with a higher precedence than OR', function() {
		expect(parse('false && true || true')()).toBe(true);
	});

	it('parses OR with a lower precedence than equality', function() {
		expect(parse('1 === 2 || 2 === 2')()).toBeTruthy();
	});

	it('parses the ternary expression', function() {
		expect(parse('a === 42 ? true : false')({a: 42})).toBe(true);
		expect(parse('a === 42 ? true : false')({a: 43})).toBe(false);
	});

	it('parses OR with a higher precedence than ternary', function() {
		expect(parse('0 || 1 ? 0 || 2 : 0 || 3')()).toBe(2);
	});

	it('parses nested ternaries', function() {
		expect(
			parse('a === 42 ? b === 42 ? "a and b" : "a" : c === 42 ? "c" : "none"')({
				a: 44,
				b: 43,
				c: 42
		})).toEqual('c');
	});

	it('makes ternaries constants if their operands are', function() {
		expect(parse('true ? 42 : 43').constant).toBeTruthy();
		expect(parse('true ? 42 : a').constant).toBeFalsy();
	});

	it('parses parentheses altering precedence order', function() {
		expect(parse('21 * (3 - 1)')()).toBe(42);
		expect(parse('false && (true || true)')()).toBe(false);
		expect(parse('-((a % 2) === 0 ? 1 : 2)')({a: 42})).toBe(-1);
	});

	it('parses several statements', function() {
		var fn = parse('a = 1; b = 2; c = 3');
		var scope = {};
		fn(scope);
		expect(scope).toEqual({a: 1, b: 2, c: 3});
	});

	it('returns the value of the last statement', function() {
		expect(parse('a = 1; b = 2; a + b')({})).toBe(3);
	});

	it('returns the function itself when given one', function() {
		var fn = function() { };
		expect(parse(fn)).toBe(fn);
	});

	it('still returns a function when given no argument', function() {
		expect(parse()).toEqual(jasmine.any(Function));
	});
});