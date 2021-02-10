import React from "react";
import ReactDOM from "react-dom";
import { TreeViewer } from "../src/index";

interface Props {}

const App: React.FC<Props> = (props: Props) => {
  return (
    <>
      <TreeViewer />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
