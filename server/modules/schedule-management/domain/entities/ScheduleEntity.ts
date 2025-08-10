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

// Domain entities should not import infrastructure dependencies

export class ScheduleEntity {
  constructor(
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

  static create(props: Omit<ScheduleProps, 'id' | 'createdAt' | 'updatedAt'>): ScheduleEntity {
    if (props.endTime <= props.startTime) {
      throw new Error('End time must be after start time');
    }

    return new ScheduleEntity(
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

  static reconstruct(props: ScheduleProps): ScheduleEntity {
    return new ScheduleEntity(
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

  start(): ScheduleEntity {
    if (this.status !== 'scheduled') {
      throw new Error('Only scheduled appointments can be started');
    }

    return new ScheduleEntity(
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

  complete(): ScheduleEntity {
    if (this.status !== 'in_progress') {
      throw new Error('Only in-progress appointments can be completed');
    }

    return new ScheduleEntity(
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

  cancel(): ScheduleEntity {
    if (this.status === 'completed') {
      throw new Error('Completed appointments cannot be cancelled');
    }

    return new ScheduleEntity(
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

// src/domain/entities/schedule.entity.ts

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