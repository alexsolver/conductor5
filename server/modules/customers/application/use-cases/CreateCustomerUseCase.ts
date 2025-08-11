
// Application Layer - Use Case
import { Customer } from "../../../domain/entities/Customer";
import { ICustomerRepository } from "../../../domain/repositories/ICustomerRepository";
import { CustomerCreated } from "../../../domain/events/CustomerEvents";
import { IDomainEventPublisher } from "../../../../shared/events/IDomainEventPublisher";

export interface CreateCustomerRequest {
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  mobilePhone?: string | null;
  customerType?: string;
  cpf?: string | null;
  cnpj?: string | null;
  companyName?: string | null;
  contactPerson?: string | null;
  state?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  zipCode?: string | null;
}

export class CreateCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(request: CreateCustomerRequest): Promise<Customer> {
    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findByEmail(
      request.email,
      request.tenantId
    );

    if (existingCustomer) {
      throw new Error('Customer with this email already exists');
    }

    // Additional business validations
    if (request.customerType === "PJ" && !request.companyName) {
      throw new Error('Company name is required for PJ customers');
    }

    if (request.customerType === "PF" && request.cpf) {
      const cpfDigits = request.cpf.replace(/\D/g, '');
      if (cpfDigits.length !== 11) {
        throw new Error('CPF must have exactly 11 digits');
      }
    }

    if (request.customerType === "PJ" && request.cnpj) {
      const cnpjDigits = request.cnpj.replace(/\D/g, '');
      if (cnpjDigits.length !== 14) {
        throw new Error('CNPJ must have exactly 14 digits');
      }
    }

    // Create customer entity
    const customer = Customer.create({
      tenantId: request.tenantId,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
      mobilePhone: request.mobilePhone,
      customerType: request.customerType || "PF",
      cpf: request.cpf,
      cnpj: request.cnpj,
      companyName: request.companyName,
      contactPerson: request.contactPerson,
      state: request.state,
      address: request.address,
      addressNumber: request.addressNumber,
      complement: request.complement,
      neighborhood: request.neighborhood,
      city: request.city,
      zipCode: request.zipCode,
    });

    // Save to repository
    const savedCustomer = await this.customerRepository.save(customer);

    // Publish domain event
    const event = new CustomerCreated(
      savedCustomer.id,
      savedCustomer.tenantId,
      {
        email: savedCustomer.email,
        fullName: savedCustomer.fullName,
        customerType: savedCustomer.customerType,
        companyName: savedCustomer.companyName || undefined,
      }
    );

    await this.eventPublisher.publish(event);

    return savedCustomer;
  }
}
