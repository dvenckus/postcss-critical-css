"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCriticalFromAtRule = getCriticalFromAtRule;
var _postcss = _interopRequireDefault(require("postcss"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**
 * Get critical CSS from an at-rule.
 *
 * @param {Object} args Function args. See flow type alias.
 */
function getCriticalFromAtRule(args) {
  var result = {};
  var options = _objectSpread({
    defaultDest: "critical.css",
    css: _postcss["default"].root()
  }, args);
  options.css.walkAtRules("critical", function (atRule) {
    var targets = atRule.params ? atRule.params : options.defaultDest;
    // Handle multiple targets for the same rule.
    var targetList = targets.split(options.destDelim);

    // If rule has no nodes, all the nodes of the parent will be critical.
    var rule = atRule;
    if (!atRule.nodes) {
      rule = atRule.root();
    }
    targetList.forEach(function (name) {
      rule.clone().each(function (node) {
        if (node.name !== "critical") {
          result[name] = result[name] ? result[name].append(node) : _postcss["default"].root().append(node);
        }
      });
    });
  });
  return result;
}