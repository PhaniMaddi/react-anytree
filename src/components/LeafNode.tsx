import React from "react";
import { TreeNode } from "../utils/getTreeFromJson";

interface Props {
  name: string;
  onSelection(node: TreeNode): void;
  checked: boolean;
}

export const LeafNode: React.FC<Props> = (props) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  let { checked } = props;

  const open = Boolean(anchorEl);
  const id = open ? "data-popover" : undefined;

  const getThisNode = (node: TreeNode) => {
    props.onSelection(node);
  };

  return (
    <div>
      <input
        type="checkbox"
        // onClick={(event) => getThisNode(props.root)}
        defaultChecked={checked}
      />{" "}
      <span>{`${props.name}`}</span>
    </div>
  );
};
