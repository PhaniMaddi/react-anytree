import React from "react";
import { TreeNode } from "../utils/getTreeFromJson";
import { LeafNode } from "./LeafNode";

interface Props {
  root: TreeNode;
}

export const NonLeafNode: React.FC<Props> = (props: Props) => {
  const { root } = props;
  const padding: number = root.depth * 5;
  const onSelection = () => {};

  return (
    <>
      {root.children.length === 0 ? (
        <LeafNode
          name={root.name}
          onSelection={onSelection}
          checked={root.checked}
        />
      ) : (
        root.children.map((n: TreeNode, i: number) => {
          return (
            <div>Accordian</div>
            // {/* <NonLeafNode root={n} /> */}
          );
        })
      )}
    </>
  );
};
