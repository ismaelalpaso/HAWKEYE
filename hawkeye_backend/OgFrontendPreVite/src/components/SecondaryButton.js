import { useState } from "react";

export default function SecondaryButton({
  onClick,
  label = "Cancelar",
  workingMessage = "Procesando...",
  successMessage = "Hecho ✅",
}) {
  const [status, setStatus] = useState("idle");

  const handleClick = async () => {
    setStatus("working");
    await onClick();
    setStatus("success");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === "working"}
      className={`px-4 py-1.5 rounded transition ${
        status === "working"
          ? "bg-gray-300 text-gray-600"
          : status === "success"
          ? "bg-green-100 text-green-700 border border-green-400"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {status === "working"
        ? workingMessage
        : status === "success"
        ? successMessage
        : label}
    </button>
  );
}
