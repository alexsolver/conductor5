
import { z } from "zod";
import { validateCPF } from "./brazilian-documents";

export const customerValidationSchema = z.object({
  cpf: z.string().optional().refine((val) => {
    if (!val) return true;
    return validateCPF(val);
  }, "CPF inválido"),
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
});
