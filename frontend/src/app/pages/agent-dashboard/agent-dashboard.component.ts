import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TicketService, Ticket, Priority, Status } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe, NgClass],
  templateUrl: './agent-dashboard.component.html',
})
export class AgentDashboardComponent {
  mobileOpen = false;

  // form model
  form: {
    title: string;
    description: string;
    category: 'hardware' | 'software' | 'network' | 'other' | '';
    priority: Priority | '';
  } = { title: '', description: '', category: '', priority: '' };

  file?: File;
  loading = false;

  // data
  tickets = signal<Ticket[]>([]);
  selected = signal<Ticket | null>(null);
  modalOpen = signal(false);

  // derived stats
  stats = computed(() => {
    const rows = this.tickets();
    const total = rows.length;
    const open = rows.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length;
    const resolved = rows.filter(r => r.status === 'RESOLVED' ).length;
    const urgent = rows.filter(r => r.priority === 'URGENT' || r.priority === 'HIGH').length; // CRITICAL -> URGENT
    return { total, open, resolved, urgent };
  });

  userName = signal<string | null>(null);

  constructor(private api: TicketService, private auth: AuthService) {
    this.userName.set(this.auth.getUser()?.name || this.auth.getUser()?.email || null);
    this.refresh();
  }

  refresh() {
    this.loading = true;
    this.api.listMine().subscribe({
      next: (rows) => { this.tickets.set(rows); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  submit() {
    if (!this.form.title || !this.form.description || !this.form.category || !this.form.priority) return;
    this.loading = true;

    // Normalize values to match backend Zod schema
    const payload = {
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      category: (this.form.category || '').toLowerCase() as 'hardware'|'software'|'network'|'other',
      priority: (this.form.priority || '').toUpperCase() as Priority, // LOW|MEDIUM|HIGH|URGENT
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.form = { title: '', description: '', category: '', priority: '' };
        this.file = undefined;
        this.refresh();
        setTimeout(() => this.scrollTo('reclamations'), 100);
        this.loading = false;
      },
      error: (e) => {
        console.error(e);
        alert(e?.error?.message || 'Failed to submit');
        this.loading = false;
      }
    });
  }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.file = input.files && input.files[0] ? input.files[0] : undefined;
  }

  // modal
  open(rec: Ticket) { this.selected.set(rec); this.modalOpen.set(true); }
  close() { this.modalOpen.set(false); this.selected.set(null); }

  setStatus(rec: Ticket, status: Status) {
    // local optimistic update; call backend here if you add a status endpoint
    const updated = this.tickets().map(r => r._id === rec._id ? { ...r, status } : r);
    this.tickets.set(updated);
    this.open(updated.find(r => r._id === rec._id)!);
  }

  // helpers
  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  logout() { this.auth.logout(); location.href = '/login'; }

  // UI labels/badges aligned with Priority = 'LOW'|'MEDIUM'|'HIGH'|'URGENT'
  priorityLabel(p: Priority) {
    return p === 'URGENT' ? 'Urgent'
         : p === 'HIGH'   ? 'High'
         : p === 'MEDIUM' ? 'Medium'
         : 'Low';
  }
  statusLabel(s: Status) {
    return s === 'OPEN' ? 'Open'
         : s === 'IN_PROGRESS' ? 'In Progress'
         : s === 'RESOLVED' ? 'Resolved'
         : 'Closed';
  }

  priorityBadge(p: Priority) {
    return {
      'bg-red-100 text-red-800'     : p === 'URGENT',
      'bg-red-200 text-red-900'     : p === 'HIGH',
      'bg-yellow-100 text-yellow-800': p === 'MEDIUM',
      'bg-green-100 text-green-800' : p === 'LOW'
    };
  }
  statusBadge(s: Status) {
    return {
      'bg-yellow-100 text-yellow-800': s === 'OPEN' || s === 'IN_PROGRESS',
      'bg-green-100 text-green-800'  : s === 'RESOLVED',
      
    };
  }
}
