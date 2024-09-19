import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from 'src/entities';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ServiceResult } from 'src/common/types';
import { EventLevel, EventType } from 'src/common/enums';
import { EventContext } from './types/event-context.interface';
import { CreateEventDto } from './dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(event);
  }
}
