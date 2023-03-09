// @flow
import postcss from "postcss";
/**
 * Get critical CSS from an at-rule.
 *
 * @param {Object} args Function args. See flow type alias.
 */
export function getCriticalFromAtRule(args: Object): Object {
  const result: Object = {};
  const options = {
    defaultDest: "critical.css",
    css: postcss.root(),
    ...args,
  };

  options.css.walkAtRules("critical", (atRule: Object) => {
    const targets = atRule.params ? atRule.params : options.defaultDest;
    // Handle multiple targets for the same rule.
    const targetList = targets.split(options.destDelim);

    // If rule has no nodes, all the nodes of the parent will be critical.
    let rule = atRule;
    if (!atRule.nodes) {
      rule = atRule.root();
    }
    targetList.forEach((name: string) => {
      rule.clone().each((node: Object) => {
        if (node.name !== "critical") {
          result[name] = result[name]
            ? result[name].append(node)
            : postcss.root().append(node);
        }
      });
    });
  });
  return result;
}
