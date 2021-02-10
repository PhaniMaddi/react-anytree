interface LooseKeyValue {
  [key: string]: string;
}

export interface TagTreeNode {
  name: string;
  depth: number;
  attributes: any;
  xpath: string;
  children: TagTreeNode[];
  value: string;
  checked: boolean;
}

declare global {
  interface Node {
    isLeafNode(): boolean;
    isParentOfLeafNode(): boolean;
    isTag(): boolean;
    getXPathFragment(): string;
    getXPathAttributesPredicate(): string;
    getValue(): string;
  }
}

Node.prototype.isTag = function (): boolean {
  return (this as HTMLElement).tagName !== undefined;
};

Node.prototype.isLeafNode = function (): boolean {
  let isLeafNode = true;
  const it = this.childNodes.values();
  let done: boolean | undefined = false;
  do {
    const result = it.next();
    done = result.done;
    if (result.value && (result.value as Node).isTag()) {
      isLeafNode = false;
      break;
    }
  } while (!done);

  return isLeafNode;
};

Node.prototype.isParentOfLeafNode = function (): boolean {
  let isParentOfLeafNode: boolean = true;
  const it = this.childNodes.values();
  let done: boolean | undefined = false;
  do {
    const result = it.next();
    done = result.done;
    if (result.value) {
      (result.value as Node).childNodes.forEach((child) => {
        isParentOfLeafNode = isParentOfLeafNode && child.isLeafNode();
      });
    }
  } while (!done);

  return isParentOfLeafNode;
};

Node.prototype.getXPathFragment = function (): string {
  const isLeafNode = this.isLeafNode();
  const isParentOfLeafNode = this.isParentOfLeafNode();
  const attributesPlaceholder = "@";
  if (!this || !(this as HTMLElement).tagName) return "";
  let xpath: string = `//${(this as HTMLElement).tagName.replace("wd", "*")}`;

  if (isParentOfLeafNode) {
    xpath = `//${(this as HTMLElement).tagName.replace("wd", "*")}`;
    // const attributesPredicate = this.getXPathAttributesPredicate();
    // xpath = `${xpath}${attributesPredicate}`;
  }

  if (isLeafNode) {
    xpath = `//${(this as HTMLElement).tagName.replace(
      "wd",
      "*"
    )}${attributesPlaceholder}/text()`;
    const attributesPredicate = this.getXPathAttributesPredicate();
    xpath = xpath.replace(attributesPlaceholder, attributesPredicate);
  }

  return xpath;
};

Node.prototype.getXPathAttributesPredicate = function (): string {
  let attributesPredicate = "";
  const numAttributes = (this as HTMLElement).attributes.length;
  for (let i = 0; i < numAttributes; i++) {
    const { name, value } = (this as HTMLElement).attributes.item(i) as Attr;
    attributesPredicate = `${attributesPredicate}@${name.replace(
      "wd",
      "*"
    )}='${value}' and`;
  }

  if (attributesPredicate.length === 0) {
    return "";
  } else {
    attributesPredicate = attributesPredicate.substring(
      0,
      attributesPredicate.length - 4
    );
    return `[${attributesPredicate}]`;
  }
};

Node.prototype.getValue = function (): string {
  return (this as HTMLElement).innerHTML;
};

function constructXPathFragment(
  node: Node,
  xpathContext: string,
  index: string
): string {
  let xpath = "";

  if (index.length > 0) {
    xpath = `${xpathContext}${node.getXPathFragment()}[${index ? index : ""}]`;
  } else {
    xpath = `${xpathContext}${node.getXPathFragment()}`;
  }
  return xpath;
}

function getAttributesMap(node: any): Map<string, string> {
  const map1: Map<string, string> = new Map<string, string>();
  let map: any = {};
  if (!node || !(node as HTMLElement).attributes) return map;
  for (let i = 0; i < (node as HTMLElement)?.attributes.length; i++) {
    // @ts-ignore

    map1.set(node.attributes[i].name, node.attributes[i].value);
    map[node.attributes[i].name] = node.attributes[i].value;
  }

  return map;
}

function buildTagTreeFromDocument(
  root: TagTreeNode,
  node: Node,
  depth: number,
  xpath: string,
  index: string
) {
  root.depth = depth;
  root.name = (node as HTMLElement).tagName;
  root.children = [];
  root.attributes = getAttributesMap(node);
  root.xpath = constructXPathFragment(node, xpath, index);
  root.value = node.getValue();
  root.checked = false;

  // node.childNodes.forEach((child, i) => {
  //   if (child.isTag()) {
  //     root.children.push(
  //       buildTagTreeFromDocument(
  //         {} as TagTreeNode,
  //         child,
  //         depth + 1,
  //         root.xpath,
  //         i.toString()
  //       )
  //     );
  //   }
  // });

  for (let i = 0; i < node.childNodes.length; i++) {
    const prevChild = node.childNodes[i - 1];
    const child = node.childNodes[i];

    if (child.isTag()) {
      let indexRequired = false;
      if (
        child &&
        prevChild &&
        (child as HTMLElement).tagName === (prevChild as HTMLElement).tagName &&
        !child.isLeafNode && !child.isLeafNode
      ) {
        indexRequired = true;
      }

      root.children.push(
        buildTagTreeFromDocument(
          {} as TagTreeNode,
          child,
          depth + 1,
          root.xpath,
          indexRequired ? `${i}` : ""
        )
      );
    }
  }

  return root;
}

export function getTagTreeFromXML(xmlString: string) {
  if (xmlString.length === 0) return {} as TagTreeNode;
  let root: TagTreeNode = {} as TagTreeNode;

  try {
    const xParser = new DOMParser();
    const xDOM = xParser.parseFromString(xmlString, "application/xml");
    const walker = xDOM.createTreeWalker(xDOM);
    let node = walker.firstChild();
    root = buildTagTreeFromDocument(
      {} as TagTreeNode,
      node as Node,
      1,
      "",
      ""
    );
  } catch (error) {
    console.error(error);
  }

  return root as TagTreeNode;
}

/**
 * extract FieldsXpathMap from tree checked fileds
 * @param root
 */

export const constructFieldsXpathMap = (
  root: TagTreeNode,
  customXpath: any
) => {
  let fieldsXpathMap: Map<string, string> = new Map();

  function helper(tree: TagTreeNode, customXpath: any) {
    if (!tree || Object.keys(tree).length === 0) return;

    if (tree.checked) {
      let key = constructXPathKey(tree.xpath, tree.attributes);
      let xpath: string = tree.xpath;

      // need append attribute type incase of attribute selection

      if (customXpath !== undefined) {
        if (typeof customXpath === "string") {
          customXpath = JSON.parse(customXpath);
          if (customXpath[tree.name] !== undefined) {
            key = tree.name;
          }
        }
      }
      if (tree.children.length > 0 && tree.attributes.length > 0) {
        let firstAttr: string = tree.attributes.keys().next().value;
        xpath = xpath.concat(`/${firstAttr.replace("wd", "@*")}`);
      }
      fieldsXpathMap.set(key, xpath);
    }

    for (let i = 0; i < tree.children.length; i++) {
      helper(tree.children[i], customXpath);
    }
  }

  // helper invocation
  helper(root, customXpath);
  return Object.fromEntries(fieldsXpathMap);
};

/**
 * keep parent nodes of checked leaf nodes
 * @param root
 */
export function markRequiredNodes(root: TagTreeNode) {
  function helper(tree: TagTreeNode): boolean {
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
export function reduceTree(root: TagTreeNode) {
  if (!root) return null;

  if (root.checked) {
    let newObj: TagTreeNode = {
      name: root.name,
      value: root.value,
      depth: root.depth,
      xpath: root.xpath,
      children: [],
      attributes: root.attributes,
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

            let cloned = reduceTree(el);
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

export const constructXPathKey = (key: string, attributes: any): string => {
  let result: string = "";
  let re = /\/\/\*:/gi;

  key = key.replace(re, ".");
  key = key.replace(/\/text\(\)/gi, "");
  if (key.includes("/@*:")) {
    key = key.replace("/@*:", ".");
  }

  if (key.includes(".ID")) {
    result = key.substring(0, key.indexOf(".ID"));

    if (attributes !== undefined && Object.keys(attributes).length > 0) {
      result = result.concat(`.${attributes["wd:type"]}`);
    }
  } else {
    result = key;
  }

  return result;
};

export const getDisplayName = (str: string): string => {
  str = str.replace(/[_]+/gi, " ");
  str = str.replace(/(wd:ID)/gi, "");
  str = str.replace(/(wd:)/gi, "");
  return str;
};

function stripXpathIndex(xpath: string) {
  return xpath.replace(/(\[[0-9]+\])/g, "");
}

export function treeDefaultSelections(
  tree: TagTreeNode,
  defaultKeys: string[]
): LooseKeyValue {
  let defaultMap: LooseKeyValue = {};

  function helper(node: TagTreeNode) {
    if (!node || !node.xpath || defaultKeys.length === 0) return;
    let key: string = constructXPathKey(node.xpath, node.attributes);
    if (defaultKeys.includes(key)) {
      node.checked = true;
      defaultMap[key] = node.xpath;
    }

    node.children.forEach((child) => {
      helper(child);
    });
  }

  helper(tree);

  return defaultMap;
}
