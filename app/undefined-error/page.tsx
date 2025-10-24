"use client";
import React from "react";

export default function UndefinedErrorPage() {
  // Trigger an undefined function error on mount
  React.useEffect(() => {
    // @ts-ignore
    myUndefinedFunction();
  }, []);

  return (
    <div style={{padding:40}}>
      <h1>Undefined Error Test Page</h1>
    </div>
  );
}  