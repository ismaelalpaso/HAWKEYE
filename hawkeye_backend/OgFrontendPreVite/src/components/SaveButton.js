import { useState } from "react";

export default function SaveButton({
  onSave,
  label = "Guardar",
  savingMessage = "Guardando...",
  successMessage = "Guardado ✅",
  errorMessage = "Error ❌",
}) {
  const [status, setStatus] = useState("idle");

  const handleClick = async () => {
    setStatus("saving");
    try {
      await onSave();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const getText = () => {
    switch (status) {
      case "saving":
        return savingMessage;
      case "success":
        return successMessage;
      case "error":
        return errorMessage;
      default:
        return label;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === "saving"}
      className={`px-4 py-1.5 rounded text-white transition ${
        status === "saving"
          ? "bg-blue-400"
          : status === "success"
          ? "bg-green-600"
          : status === "error"
          ? "bg-red-500"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {getText()}
    </button>
  );
}
