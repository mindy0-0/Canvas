import { Route, Routes } from "react-router-dom";

import { Home } from "@/pages/home";
// import { Home } from "@/pages/home/aaa";

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
};
