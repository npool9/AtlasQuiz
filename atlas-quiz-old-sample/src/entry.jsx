import React from "react";
import { createRoot } from "react-dom/client";
import AtlasQuiz from "./AtlasQuiz.jsx";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(React.createElement(AtlasQuiz));
