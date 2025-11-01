import { createContext, useContext, useState } from "react";

export const DbContext = createContext();
export const DbProvider = ({ children }) => {
  const [dbServer, setdbServer] = useState("MongoDB");

  return (
    <DbContext.Provider value={{ dbServer, setdbServer }}>
      {children}
    </DbContext.Provider>
  );
};

export const usedbContext = () => useContext(DbContext);
