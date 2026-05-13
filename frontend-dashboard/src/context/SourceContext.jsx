"use client";

import { createContext, useContext, useState } from "react";

const SourceContext = createContext();

export function SourceProvider({ children }) {
  const [source, setSource] = useState("all");

  return (
    <SourceContext.Provider
      value={{
        source,
        setSource,
      }}
    >
      {children}
    </SourceContext.Provider>
  );
}

export function useSource() {
  return useContext(SourceContext);
}