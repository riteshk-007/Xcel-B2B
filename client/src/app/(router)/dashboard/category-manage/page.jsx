import React from "react";
import Categories from "../_components/Categories";

const TestCase = () => {
  return (
    <div>
      <Categories allowCreate={true} allowDelete={true} allowEdit={true} />
    </div>
  );
};

export default TestCase;
