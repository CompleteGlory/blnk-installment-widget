import { Injectable } from "@nestjs/common";

export type ApplicationStatus = "approved" | "declined" | "pending";

export interface ApplicationRecord {
  id: string;
  merchantId: string;
  months: number;
  amount: number;
  finalStatus: Exclude<ApplicationStatus, "pending">;
  resolveAt: number;
  createdAt: number;
}

/**
 * In-memory stand-in for the Postgres `applications` table the design doc
 * calls for. Same read/write shape a TypeORM repository would expose
 * (`save`, `findById`) — swapping the backing store later shouldn't need to
 * touch the service that calls it.
 */
@Injectable()
export class ApplicationsStore {
  private records = new Map<string, ApplicationRecord>();

  save(record: ApplicationRecord): ApplicationRecord {
    this.records.set(record.id, record);
    return record;
  }

  findById(id: string): ApplicationRecord | undefined {
    return this.records.get(id);
  }
}
