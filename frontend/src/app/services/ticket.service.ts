import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Status   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' ;

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  category?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name?: string; email?: string };
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private base = 'http://localhost:4000/api/tickets';

  constructor(private http: HttpClient) {}

  /** Agent creates a ticket */
 create(body: {
  title: string;
  description: string;
  category: 'hardware' | 'software' | 'network' | 'other';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}) {
  return this.http.post<Ticket>(`${this.base}`, body); // JSON by default
}

  /** ✅ Agent’s tickets */
  listMine() {
    return this.http.get<Ticket[]>(`${this.base}/mine`);
  }

  /** ✅ Cadre: all tickets */
  listAll() {
    return this.http.get<Ticket[]>(`${this.base}`);
  }

  /** ✅ Cadre updates status */
  updateStatus(id: string, status: Status) {
    return this.http.patch<Ticket>(`${this.base}/${id}/status`, { status });
  }

  /** ✅ Cadre adds a note */
// Angular TicketService
addNote(id: string, note: string) {
  return this.http.post(`${this.base}/${id}/notes`, { text: note });
}

}
