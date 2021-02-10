export interface TagTreeNode {
  name: string;
  depth: number;
  attributes: Map<string, string>;
  xpath: string;
  children: TagTreeNode[];
  value: string;
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

function constructXPathFragment(node: Node, xpathContext: string): string {
  let xpath = `${xpathContext}${node.getXPathFragment()}`;
  return xpath;
}

function getAttributesMap(node: Node): Map<string, string> {
  const map: Map<string, string> = new Map<string, string>();
  if (!node || !(node as HTMLElement).attributes) return map;
  for (let i = 0; i < (node as HTMLElement)?.attributes.length; i++) {
    // @ts-ignore
    map.set(node.attributes[i].name, node.attributes[i].value);
  }

  return map;
}

function buildTagTreeFromDocument(
  root: TagTreeNode,
  node: Node,
  depth: number,
  xpath: string
) {
  root.depth = depth;
  root.name = (node as HTMLElement).tagName;
  root.children = [];
  root.attributes = getAttributesMap(node);
  root.xpath = constructXPathFragment(node, xpath);
  root.value = node.getValue();

  node.childNodes.forEach((child) => {
    if (child.isTag()) {
      root.children.push(
        buildTagTreeFromDocument(
          {} as TagTreeNode,
          child,
          depth + 1,
          root.xpath
        )
      );
    }
  });

  return root;
}

export function getTagTreeFromXML(xmlString: string) {
  const xParser = new DOMParser();
  const xDOM = xParser.parseFromString(xmlString, "application/xml");
  const walker = xDOM.createTreeWalker(xDOM);
  let node = walker.firstChild();
  const root = buildTagTreeFromDocument({} as TagTreeNode, node as Node, 1, "");
  return root as TagTreeNode;
}

export const constructXPathKey = (key: string, attributes: any): string => {
  let result: string = "";
  let re = /\/\/\*:/gi;
  key = key.replace(re, ".");
  key = key.replace(/\/text\(\)/gi, "");

  if (key.includes(".ID")) {
    result = key.substring(0, key.indexOf(".ID"));

    if (attributes.size > 0) {
      result = result.concat(`.${attributes.get("wd:type")}`);
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
