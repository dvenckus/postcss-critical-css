"use strict";

var _chalk = require("chalk");
var _postcss = _interopRequireDefault(require("postcss"));
var _cssnano = _interopRequireDefault(require("cssnano"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _path = _interopRequireDefault(require("path"));
var _getCriticalRules = require("./getCriticalRules");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**
 * Append to an existing critical CSS file?
 */
var append = false;

/**
 * Clean the original root node passed to the plugin, removing custom atrules,
 * properties. Will additionally delete nodes as appropriate if
 * `preserve === false`.
 *
 * @param {Object} root The root PostCSS object.
 * @param {boolean} preserve Preserve identified critical CSS in the root?
 */
function clean(root, preserve) {
  root.walkAtRules("critical", function (atRule) {
    if (preserve === false) {
      if (atRule.nodes && atRule.nodes.length) {
        atRule.remove();
      } else {
        root.removeAll();
      }
    } else {
      if (atRule.nodes && atRule.nodes.length) {
        atRule.replaceWith(atRule.nodes);
      } else {
        atRule.remove();
      }
    }
  });
  // @TODO `scope` Makes this kind of gnarly. This could be cleaned up a bit.
  root.walkDecls(/critical-(selector|filename)/, function (decl) {
    if (preserve === false) {
      if (decl.value === "scope") {
        root.walk(function (node) {
          if (node.selector && node.selector.indexOf(decl.parent.selector) === 0) {
            if (node.parent && hasNoOtherChildNodes(node.parent.nodes, node)) {
              node.parent.remove();
            } else {
              node.remove();
            }
          }
        });
      }
      var wrapper = {};
      if (decl && decl.parent) {
        wrapper = decl.parent.parent;
        decl.parent.remove();
      }
      // If the wrapper has no valid child nodes, remove it entirely.
      if (wrapper && hasNoOtherChildNodes(wrapper.nodes, decl)) {
        wrapper.remove();
      }
    } else {
      decl.remove();
    }
  });
}

/**
 * Do a dry run, console.log the output.
 *
 * @param {string} css CSS to output.
 */
function doDryRun(css) {
  console.log(
  // eslint-disable-line no-console
  (0, _chalk.green)("Critical CSS result is: ".concat((0, _chalk.yellow)(css))));
}

/**
 * Do a dry run, or write a file.
 *
 * @param {bool} dryRun Do a dry run?
 * @param {string} filePath Path to write file to.
 * @param {Object} result PostCSS root object.
 * @return {Promise} Resolves with writeCriticalFile or doDryRun function call.
 */
function dryRunOrWriteFile(dryRun, filePath, result) {
  var css = result.css;
  return new Promise(function (resolve) {
    return resolve(dryRun ? doDryRun(css) : writeCriticalFile(filePath, css));
  });
}

/**
 * Confirm a node has no child nodes other than a specific node.
 *
 * @param {array} nodes Nodes array to check.
 * @param {Object} node Node to check.
 * @return {boolean} Whether or not the node has no other children.
 */
function hasNoOtherChildNodes() {
  var nodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var node = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _postcss["default"].root();
  return nodes.filter(function (child) {
    return child !== node;
  }).length === 0;
}

/**
 * Write a file containing critical CSS.
 *
 * @param {string} filePath Path to write file to.
 * @param {string} css CSS to write to file.
 */
function writeCriticalFile(filePath, css) {
  _fsExtra["default"].outputFile(filePath, css, {
    flag: append ? "a" : "w"
  }, function (err) {
    append = true;
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

/**
 * Main plugin function.
 * @param {Object} opts
 * @returns {Function}
 */
module.exports = function (opts) {
  var filteredOptions = Object.keys(opts).reduce(function (acc, key) {
    return typeof opts[key] !== "undefined" ? _objectSpread(_objectSpread({}, acc), {}, _defineProperty({}, key, opts[key])) : acc;
  }, {});
  var args = _objectSpread({
    outputPath: process.cwd(),
    outputDest: "critical.css",
    preserve: true,
    minify: true,
    dryRun: false,
    destDelim: " "
  }, filteredOptions);
  append = false;
  return {
    postcssPlugin: "postcss-critical-css",
    Once: function Once(root, opts) {
      var dryRun = args.dryRun,
        preserve = args.preserve,
        minify = args.minify,
        outputPath = args.outputPath,
        outputDest = args.outputDest,
        destDelim = args.destDelim;
      dryRun = dryRun === true;
      preserve = preserve === true;
      minify = minify === true;
      var criticalOutput = (0, _getCriticalRules.getCriticalRules)(root, outputDest, destDelim);
      return Object.keys(criticalOutput).reduce(function (init, cur) {
        var criticalCSS = _postcss["default"].root();
        var filePath = _path["default"].join(outputPath, cur);
        criticalOutput[cur].each(function (rule) {
          return criticalCSS.append(rule.clone());
        });
        return (0, _postcss["default"])(minify === true ? [_cssnano["default"]] : [])
        // @TODO Use from/to correctly.
        .process(criticalCSS, {
          from: undefined
        }).then(dryRunOrWriteFile.bind(null, dryRun, filePath)).then(clean.bind(null, root, preserve));
      }, {});
    }
  };
};
module.exports.postcss = true;