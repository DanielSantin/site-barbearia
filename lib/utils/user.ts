export const getTextColorByRole = (role: string | null | undefined) => {
  if (!role) {
    return "text-green-500";
  }

  switch (role) {
      case "Parceiro":
          return "text-blue-500";
      case "Cliente":
          return "text-green-500";
      case "Calouro":
          return "text-yellow-500";
      default:
          return "text-green-500";
      }
};