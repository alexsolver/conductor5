
// Application Layer - Use Case
import { Customer } from "../../domain/entities/Customer";
import { ICustomerRepository } from "../../domain/repositories/ICustomerRepository";
import { CustomerCreated } from "../../domain/events/CustomerEvents";
import { IDomainEventPublisher } from "../../../shared/events/IDomainEventPublisher";
import { randomUUID } from "crypto";

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
    const customer = new Customer(
      randomUUID(),
      request.tenantId,
      request.customerType as 'PF' | 'PJ' || "PF",
      'Ativo',
      request.email,
      null, // description
      null, // internalCode
      request.firstName,
      request.lastName,
      request.cpf,
      request.companyName,
      request.cnpj,
      request.contactPerson,
      null, // responsible
      request.phone,
      request.mobilePhone,
      null, // position
      null, // supervisor
      null, // coordinator
      null, // manager
      [], // tags
      {}, // metadata
      false, // verified
      true, // active
      false, // suspended
      null, // lastLogin
      'UTC', // timezone
      'pt-BR', // locale
      'pt', // language
      null, // externalId
      'customer', // role
      null, // notes
      null, // avatar
      null, // signature
      new Date(), // createdAt
      new Date() // modifiedAt
    );

    // Save to repository
    const savedCustomer = await this.customerRepository.create(customer);

    // Publish domain event
    const event = new CustomerCreated(savedCustomer);

    await this.eventPublisher.publish(event);

    return savedCustomer;
  }
}
