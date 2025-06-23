import { useState, useEffect } from "react";

const toastReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return [...state, { ...action.toast, id: Math.random().toString(36).slice(2) }];
    case "REMOVE_TOAST":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
};

let listeners = [];
let toasts = [];

const dispatch = (action) => {
  toasts = toastReducer(toasts, action);
  listeners.forEach((listener) => listener(toasts));
};

export function toast({ duration = 5000, ...props }) {
  const id = Math.random().toString(36).slice(2);
  dispatch({ type: "ADD_TOAST", toast: { ...props, id } });
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), duration);
}

export function useToast() {
  const [state, setState] = useState(toasts);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return { toast, toasts: state };
}