export const formatTelefone = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  
  if (v.length <= 10) {
    // (XX) XXXX-XXXX
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    // (XX) XXXXX-XXXX
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
  }
  
  return v.substring(0, 15);
};

export const formatCurrencyInput = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  if (v === "") return "";
  
  const numberValue = parseInt(v, 10) / 100;
  
  return numberValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  const v = value.replace(/\D/g, "");
  if (v === "") return 0;
  return parseInt(v, 10) / 100;
};
