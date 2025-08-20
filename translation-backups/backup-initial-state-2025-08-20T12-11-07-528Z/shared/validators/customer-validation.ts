
import { z } from "zod";
import { validateCPF, validateCNPJ } from "./brazilian-documents";

export const customerValidationSchema = z.object({
  customerType: z.enum(['PF', 'PJ']),
  cpf: z.string().optional().refine((val) => {
    if (!val) return true;
    return validateCPF(val);
  }, "CPF inválido"),
  cnpj: z.string().optional().refine((val) => {
    if (!val) return true;
    return validateCNPJ(val);
  }, "CNPJ inválido"),
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
}).refine((data) => {
  if (data.customerType === 'PF' && !data.cpf) {
    return false;
  }
  if (data.customerType === 'PJ' && !data.cnpj) {
    return false;
  }
  return true;
}, {
  message: "CPF é obrigatório para PF e CNPJ é obrigatório para PJ",
  path: ["customerType"]
});
