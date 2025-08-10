### 3.2. Correção na Instanciação do Controller nas Rotas

**Problema:** O módulo de clientes (`CustomerModule`) não estava corretamente configurando a injeção de dependência para o `CustomerController`, resultando em erros ao tentar instanciar o controller e suas dependências.

**Solução:**
1.  No `CustomerModule`, o `CustomerController` foi adicionado ao array `controllers`.
2.  Os Use Cases (`CreateCustomerUseCase` e `FindAllCustomersUseCase`) foram adicionados ao array `providers`, garantindo que o NestJS possa instanciá-los e injetá-los no controller.

**Validação:** Com as alterações no `CustomerModule`, o NestJS consegue instanciar corretamente o `CustomerController` e suas dependências, permitindo que as rotas de clientes funcionem conforme o esperado.

```typescript
// src/customer/customer.module.ts

import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CreateCustomerUseCase } from '../domain/usecases/customer/create-customer.usecase';
import { FindAllCustomersUseCase } from '../domain/usecases/customer/find-all-customers.usecase';
import { CustomerRepository } from '../domain/repositories/customer.repository';
// Removed repository dependency - domain entities should not import infrastructure

@Module({
  controllers: [CustomerController],
  providers: [
    CreateCustomerUseCase,
    FindAllCustomersUseCase,
    {
      provide: CustomerRepository,
      useClass: DrizzleCustomerRepository,
    },
  ],
})
export class CustomerModule {}
```

### 3.3. Removendo Dependência do Drizzle das Entidades de Domínio

**Problema:** As entidades de domínio estavam diretamente acopladas à biblioteca `drizzle-orm`. Isso viola o princípio de independência de frameworks da Clean Architecture, dificultando a troca de ORM ou a testabilidade das entidades de domínio isoladamente.

**Solução:**
1.  Removida a importação e qualquer referência direta ao `drizzle-orm` das definições das entidades de domínio (ex: `Customer`, `Schedule`).
2.  Utilizadas interfaces TypeScript para definir a estrutura dos dados e contratos, em vez de classes ou tipos específicos do ORM. Isso permite que as entidades de domínio sejam puras e agnósticas em relação à infraestrutura.

**Validação:** As entidades de domínio agora são independentes do Drizzle ORM. As interfaces definem a estrutura esperada, e a implementação concreta (como o `DrizzleCustomerRepository`) é responsável por mapear os dados do banco de dados para essas interfaces.

```typescript
// src/domain/entities/customer.entity.ts

// Domain entity - no infrastructure dependencies

export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/domain/entities/schedule.entity.ts

// Domain entities should be framework-agnostic

export interface ScheduleProps {
  id: string;
  userId: string;
  customerId?: string;
  startTime: Date;
  endTime: Date;
  title: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Schedule {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly customerId: string | undefined,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    public readonly location: string | undefined,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(props: Omit<ScheduleProps, 'id' | 'createdAt' | 'updatedAt'>): Schedule {
    if (props.endTime <= props.startTime) {
      throw new Error('End time must be after start time');
    }

    return new Schedule(
      crypto.randomUUID(),
      props.userId,
      props.customerId,
      props.startTime,
      props.endTime,
      props.title,
      props.description,
      props.status,
      props.location
    );
  }

  static reconstruct(props: ScheduleProps): Schedule {
    return new Schedule(
      props.id,
      props.userId,
      props.customerId,
      props.startTime,
      props.endTime,
      props.title,
      props.description,
      props.status,
      props.location,
      props.createdAt,
      props.updatedAt
    );
  }

  start(): Schedule {
    if (this.status !== 'scheduled') {
      throw new Error('Only scheduled appointments can be started');
    }

    return new Schedule(
      this.id,
      this.userId,
      this.customerId,
      this.startTime,
      this.endTime,
      this.title,
      this.description,
      'in_progress',
      this.location,
      this.createdAt,
      new Date()
    );
  }

  complete(): Schedule {
    if (this.status !== 'in_progress') {
      throw new Error('Only in-progress appointments can be completed');
    }

    return new Schedule(
      this.id,
      this.userId,
      this.customerId,
      this.startTime,
      this.endTime,
      this.title,
      this.description,
      'completed',
      this.location,
      this.createdAt,
      new Date()
    );
  }

  cancel(): Schedule {
    if (this.status === 'completed') {
      throw new Error('Completed appointments cannot be cancelled');
    }

    return new Schedule(
      this.id,
      this.userId,
      this.customerId,
      this.startTime,
      this.endTime,
      this.title,
      this.description,
      'cancelled',
      this.location,
      this.createdAt,
      new Date()
    );
  }
}

// src/domain/entities/appointment.entity.ts

// Domain entities should be framework-agnostic

export interface Appointment {
  id: string;
  scheduleId: string;
  customerId: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}