interface LooseKeyValue {
  [key: string]: string;
}

export interface TreeNode {
  name: string;
  depth: number;
  path: string;
  value: string;
  children: TreeNode[];
  checked: boolean;
}

export interface XMLTreeNode extends TreeNode {
  attributes: Map<string, string>;
}

class JsonTree {
  constructor() { }

  buildTreeFromJson(
    json: any,
    name: string,
    jsonpath: string,
    depth: number
  ): TreeNode {
    // temp
    let path = jsonpath;

    let tree: TreeNode = {
      name,
      value: "",
      depth: depth,
      path,
      children: [],
      // attributes: new Map(),
      checked: false,
    };

    if (!json) return tree;

    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        const element = json[key];

        if (Array.isArray(element)) {
          for (let i = 0; i < element.length; i++) {
            const el = element[i];
            // TODO: check for array type
            if (typeof el === "object") {
              tree.children.push(
                this.buildTreeFromJson(
                  el,
                  "",
                  `${jsonpath}.${key}[:${i}]`,
                  depth + 1
                )
              );
            }
          }

          if (typeof element[0] !== "object") {
            tree.children.push(
              this.getTreeNode(
                key,
                element,
                `${jsonpath}.${key}`,
                depth
              )
            );
          }
        } else if (typeof element === "object") {
          tree.children.push(
            this.buildTreeFromJson(
              element,
              key,
              `${jsonpath}.${key}`,
              depth + 1
            )
          );
        } else {
          tree.children.push(
            this.getTreeNode(
              key,
              element,
              `${jsonpath}.${key}`,
              depth
            )
          );
        }
      }
    }

    return tree;
  }

  getTreeNode(
    name: string,
    value: any,
    jsonpath: string,
    depth: number
  ): TreeNode {
    let newNode = {} as TreeNode;

    newNode.name = name;
    newNode.value = value;
    newNode.depth = depth;
    newNode.children = [];
    newNode.path = jsonpath;
    newNode.checked = false;

    return newNode;
  }
}

export function getTreeFromJson(jsonString: string) {
  let json = JSON.parse(jsonString);
  let jsonTree = new JsonTree();

  let tree: TreeNode = jsonTree.buildTreeFromJson(json, "", "$", 0);

  return tree;
}

/**
 * keep parent nodes of checked leaf nodes
 * @param root
 */
export function markRequiredProperties(root: TreeNode) {
  // TODO: improve buggyness. neighbours are marked as checked
  function helper(tree: TreeNode): boolean {
    if (tree && tree.children.length > 0) {
      for (const child of tree.children) {
        tree.checked = helper(child) || tree.checked;
      }
    }

    return tree.checked;
  }

  root.checked = helper(root);

  return root;
}

/**
 * remove unchecked elements from the tree
 * @param root
 */
export function reduceJsonTree(root: TreeNode) {
  if (!root) return null;

  if (root.checked) {
    let newObj: TreeNode = {
      name: root.name,
      value: root.value,
      depth: root.depth,
      path: root.path,
      children: [],
      checked: root.checked,
    };

    for (const key in root) {
      if (Object.prototype.hasOwnProperty.call(root, key)) {
        // @ts-ignore
        if (Array.isArray(root[key])) {
          // @ts-ignore
          for (let i = 0; i < root[key].length; i++) {
            // @ts-ignore
            let el = root[key][i];

            let cloned = reduceJsonTree(el);
            if (cloned) {
              newObj.children.push(cloned);
            }
          }
        }
      }
    }
    return newObj;
  }

  return null;
}

export function treeDefaultSelections(
  tree: TreeNode,
  defaultKeys: string[]
): LooseKeyValue {
  let defaultMap: LooseKeyValue = {};

  function helper(node: TreeNode) {
    if (!node || !node.path || defaultKeys.length === 0) return;
    let key: string = constructJsonPathKey(node.path);
    if (defaultKeys.includes(key)) {
      node.checked = true;
      defaultMap[key] = node.path;
    }

    node.children.forEach((child) => {
      helper(child);
    });
  }

  helper(tree);

  return defaultMap;
}

export const constructJsonPathKey = (key: string): string => {
  let result: string = "";
  result = key.replace("$", "");
  return result;
};
/*
export function treeDefaultSelections(
  tree: TreeNode,
  defaultKeys: string[]
): LooseKeyValue {
  let defaultMap: LooseKeyValue = {};

  function helper(node: TreeNode) {
    if (!node || !node.path || defaultKeys.length === 0) return;
    let key: string = constructJsonPathKey(node.path);
    if (defaultKeys.includes(key)) {
      node.checked = true;
      defaultMap[key] = node.path;
    }

    node.children.forEach((child) => {
      helper(child);
    });
  }

  helper(tree);

  return defaultMap;
}
*/
