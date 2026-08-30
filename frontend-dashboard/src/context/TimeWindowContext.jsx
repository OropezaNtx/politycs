"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const TimeWindowContext = createContext(null);
const STORAGE_KEY = "politycs-intelligence-window-hours";
const DEFAULT_WINDOW = 24;

export const TIME_WINDOWS = [
  { hours: 24, label: "24h" },
  { hours: 168, label: "7d" },
  { hours: 720, label: "30d" },
];

export function TimeWindowProvider({ children }) {
  const [windowHours, setWindowHours] = useState(DEFAULT_WINDOW);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    if (TIME_WINDOWS.some((item) => item.hours === stored)) {
      setWindowHours(stored);
    }
  }, []);

  function updateWindow(hours) {
    setWindowHours(hours);
    window.localStorage.setItem(STORAGE_KEY, String(hours));
  }

  const value = useMemo(() => ({ windowHours, setWindowHours: updateWindow, options: TIME_WINDOWS }), [windowHours]);
  return <TimeWindowContext.Provider value={value}>{children}</TimeWindowContext.Provider>;
}

export function useTimeWindow() {
  const value = useContext(TimeWindowContext);
  if (!value) throw new Error("useTimeWindow must be used inside TimeWindowProvider");
  return value;
}
