export interface TreeNode {
  name: string;
  depth: number;
  jsonpath: string;
  children: TreeNode[];
  value: string;
  checked?: boolean;
}

class JsonTree {
  constructor() {}

  buildTreeFromJson(
    json: object,
    name: string,
    jsonpath: string,
    depth: number
  ): TreeNode {
    let tree: TreeNode = {
      name,
      value: "",
      depth: depth,
      jsonpath,
      children: [],
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
              this.getTreeNode(key, element, `${jsonpath}.${key}`, depth)
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
            this.getTreeNode(key, element, `${jsonpath}.${key}`, depth)
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
    newNode.jsonpath = jsonpath;

    return newNode;
  }
}

export function buildTreeFromJsonStr(jsonString: string) {
  let json = JSON.parse(jsonString);
  let jsonTree = new JsonTree();
  let tree: TreeNode = jsonTree.buildTreeFromJson(json, "root", "$.root", 0);

  return tree;
}

const data: string = `{
  "firstname" : "Shannon",
  "test": [1,2,3,4],
  "addresses" : [ {
    "addresscity" : "Mazomanie",
    "entry" : 108918,
    "addresszip" : "53560",
    "addressstate" : {
      "id" : "D41001053",
      "abbrev" : "WI",
      "value" : "Wisconsin"
    },
    "addresscountry" : {
      "id" : "D41001",
      "abbrev" : "US",
      "value" : "United States"
    },
    "addresstype" : {
      "id" : "D84002",
      "formattedvalue" : "Home",
      "value" : "Home"
    },
    "addressstreet1" : "9227 Katzenbuechel Road",
    "primary" : true
  } ],
  "folder" : {
    "id" : "D32013",
    "formattedvalue" : "Current Employee",
    "value" : "Current Employee"
  },
  "phones" : [ {
    "phonetype" : {
      "id" : "D83004",
      "formattedvalue" : "Mobile",
      "value" : "Mobile"
    },
    "entry" : 175534,
    "phonenumber" : "608-280-1341",
    "primary" : true
  }, {
    "phonetype" : {
      "id" : "D83001",
      "formattedvalue" : "Work",
      "value" : "Work"
    },
    "entry" : 319153,
    "phonenumber" : "608/310-2591"
  } ],
  "links" : [ {
    "rel" : "self",
    "title" : "The current profile being viewed.",
    "url" : "https://api.icims.com/customers/6212/people/197846"
  } ],
  "email" : "shannon.droessler@covance.com",
  "lastname" : "Droessler"
}`;

let tree = buildTreeFromJsonStr(data);
console.log(JSON.stringify(tree, undefined, 2));
