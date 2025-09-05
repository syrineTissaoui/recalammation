import { Schema, model, Types } from 'mongoose';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ITicket {
  title: string;
  description: string;
  category: 'hardware' | 'software' | 'network' | 'other';
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: Types.ObjectId; // User
  notes?: { by: Types.ObjectId; text: string; at: Date }[];
}

const TicketSchema = new Schema<ITicket>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['hardware', 'software', 'network', 'other'], required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'LOW' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: [{
      by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true },
      at: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export const Ticket = model<ITicket>('Ticket', TicketSchema);
