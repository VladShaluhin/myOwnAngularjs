/* jshint globalstrict: true */
'use strict';

var EXCAPES = {
  'n' : '\n',
  'f' : '\f',
  'r' : '\r',
  't' : '\t',
  'v' : '\v',
  '\'': '\'',
  '"' : '"'
};

var CONSTANTS = {
  'null': _.constant(null),
  'true': _.constant(true),
  'false': _.constant(false)
};

_.forEach(CONSTANTS, function(fn, constantName) {
  fn.constant = fn.literal = true;
});

function parse(expr) {
  var laxer = new Lexer();
  var parser = new Parser(laxer);
  return parser.parse(expr);
}

function Lexer() {}

Lexer.prototype.lex = function(text) {
  this.text = text;
  this.index = 0;
  this.ch = undefined;
  this.tokens = [];

  while (this.index < this.text.length) {
    this.ch = this.text.charAt(this.index);
    if (this.isNumber(this.ch) ||
        (this.is('.') && this.isNumber(this.peek()))) {
      this.readNumber();
    } else if(this.is('\'"')) {
      this.readString(this.ch);
    } else if(this.is('[],{}:')) {
      this.tokens.push({
        text: this.ch
      });
      this.index++;
    } else if(this.isIdent(this.ch)) {
      this.readIdent();
    } else if(this.isWhitespace(this.ch)) {
      this.index++;
    } else {
      throw 'Unexpected next character: ' + this.ch;
    }
  }

  return this.tokens;
};

Lexer.prototype.is = function(chs) {
  return chs.indexOf(this.ch) >= 0;
};

Lexer.prototype.isNumber = function(ch) {
  return '0' <= ch && ch <= '9';
};

Lexer.prototype.isExpOperator = function(ch) {
  return ch === '-' || ch === '+' || this.isNumber(ch);
};

Lexer.prototype.isIdent = function(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
    ch === '_' || ch === '$';
};

Lexer.prototype.isWhitespace = function(ch) {
  return (ch === ' ' || ch === '\r' || ch === '\t' ||
    ch === '\n' || ch === '\v' || ch === '\u00A0');
};

Lexer.prototype.peek = function() {
  return this.index < this.text.length - 1 ?
    this.text.charAt(this.index + 1) :
    false;
};

Lexer.prototype.readString = function(quote) {
  this.index++;
  var string = '';
  var rawString = quote;
  var escape = false;

  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index);
    rawString += ch;
    if (escape) {
      if (ch === 'u') {
        var hex = this.text.substring(this.index + 1, this.index + 5);
        if (!hex.match(/[\da-f]{4}/i)) {
          throw 'Invalid unicode escape';
        }
        rawString += hex;
        this.index += 4;
        string += String.fromCharCode(parseInt(hex, 16));
      } else {
        var replacement = EXCAPES[ch];
        if (replacement) {
          string += replacement;
        } else {
          string += ch;
        }
      }
      escape = false;
    } else if (ch === quote) {
      this.index++;
      this.tokens.push({
        text: rawString,
        string: string,
        constant: true,
        fn: _.constant(string)
      });
      return;
    } else if (ch === '\\') {
      escape = true;
    } else {
      string += ch;
    }
    this.index++;
  }

  throw 'Unmatched quote';
};

Lexer.prototype.readNumber = function() {
  var number = '';
  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index).toLowerCase();
    if (ch === '.' || this.isNumber(ch)) {
      number += ch;
    } else {
      var nextCh = this.peek();
      var prevCh = number.charAt(number.length - 1);
      if (ch === 'e' && this.isExpOperator(nextCh)) {
        number += ch;
      } else if (this.isExpOperator(ch) && prevCh === 'e' &&
                  nextCh && this.isNumber(nextCh)) {
        number += ch;
      } else if (this.isExpOperator(ch) && prevCh === 'e' &&
                  (!nextCh || !this.isNumber(nextCh))) {
        throw "Invalid exponent";
      } else {
        break;
      }
    }
    this.index++;
  }

  number = 1 * number;

  this.tokens.push({
    text: number,
    fn: _.constant(number),
    constant: true
  });
};

Lexer.prototype.readIdent = function() {
  var text = '';
  while(this.index < this.text.length) {
    var ch = this.text.charAt(this.index);
    if(this.isIdent(ch) || this.isNumber(ch)) {
      text += ch;
    } else {
      break;
    }
    this.index++;
  }

  var token = {
    text: text,
    fn: CONSTANTS[text]
  };

  this.tokens.push(token);
};


function Parser(laxer) {
  this.laxer = laxer;
}

Parser.prototype.parse = function(expr) {
  this.tokens = this.laxer.lex(expr);
  // var tokens = JSON.parse(JSON.stringify(this.tokens));
  // console.log(tokens);
  return this.primary();
};

Parser.prototype.primary = function() {
  var primary;

  if (this.expect('[')) {
    primary = this.arrayDeclaration();
  } else if (this.expect('{')) {
    primary = this.object();
  } else {
    var token = this.expect();
    primary = token.fn;
    if(token.constant) {
      primary.constant = true;
      primary.literal = true;
    }
  }

  return primary;
};


Parser.prototype.arrayDeclaration = function() {
  var elementsFn = [];

  if (!this.peek(']')) {
    do {
      if(this.peek(']')) {
        break;
      }
      elementsFn.push(this.primary());
    } while (this.expect(','));
  }

  this.consume(']');

  var arrayFn = function() {
    return _.map(elementsFn, function(elementFn) {
      return elementFn();
    });
  };

  arrayFn.literal = arrayFn.constant = true;

  return arrayFn;
};

Parser.prototype.object = function(e) {
  var keyValues = [];

  if(!this.peek('}')) {
    do {
      var keyToken = this.expect();
      this.consume(':');
      var valueExpr = this.primary();
      keyValues.push({
        key: keyToken.string || keyToken.text,
        value: valueExpr
      });

    } while(this.expect(','));
  }

  this.consume('}');

  var objectFn = function() {
    return _.reduce(keyValues, function(obj, kv) {
      obj[kv.key] = kv.value();
      return obj;
    }, {});
  };

  return objectFn;
};

Parser.prototype.consume = function(e) {
  if(!this.expect(e)) {
    throw 'Unexpected. Expecting ' + e;
  }
};

Parser.prototype.expect = function(e) {
  var token = this.peek(e);
  if(token) {
    return this.tokens.shift();
  }
};

Parser.prototype.peek = function(e) {
  if(this.tokens.length) {
    var text = this.tokens[0].text;
    if(text === e || !e) {
      return this.tokens[0];
    }
  }
};