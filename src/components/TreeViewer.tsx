import React from "react";
import { TreeNode } from "../utils/getTreeFromJson";
import { LeafNode } from "./LeafNode";
import { NonLeafNode } from "./NonLeafNode";

interface Props {
  root: TreeNode;
  onSelection(node: TreeNode): void;
}

export const TreeViewer: React.FC<Props> = (props: Props) => {
  const { root, onSelection } = props;
  const isLeafNode = root.children.length === 0;

  return (
    <div style={{ paddingLeft: `${5 * root.depth}px` }}>
      {isLeafNode ? (
        <LeafNode
          name={root.name}
          onSelection={onSelection}
          checked={root.checked}
        />
      ) : (
        <React.Fragment>
          <NonLeafNode root={root} />
          {root.children.map((child: TreeNode, index: number) => (
            <TreeViewer
              key={`${child.name}-${child.depth}`}
              root={child}
              onSelection={props.onSelection}
              // checked={root.checked}
            />
          ))}
        </React.Fragment>
      )}
    </div>
  );
};
