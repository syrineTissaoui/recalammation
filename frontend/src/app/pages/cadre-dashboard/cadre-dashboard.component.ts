import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.services';
import { TicketService } from '../../services/ticket.service';

export type Status   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';

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

@Component({
  selector: 'app-cadre-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cadre-dashboard.component.html',
})
export class CadreDashboardComponent {
  
  loading = false;

  // 🔁 filters as signals
  q = signal('');
  statusFilter = signal<Status | ''>('');
  priorityFilter = signal<Priority | ''>('');

  statuses: Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
  priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'];

  noteFor: string | null = null;
  noteText = '';

  // Debounce for search
  private searchTimer?: any;

  onSearchChange(val: string) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.q.set(val), 250);
  }

  onFiltersChange() {
    // nothing needed; computed re-runs when signals change
  }

  resetFilters() {
    this.q.set('');
    this.statusFilter.set('');
    this.priorityFilter.set('');
  }

  // Data
  tickets = signal<Ticket[]>([]);
 userName = signal<string | null>(null);

  filtered = computed(() => {
    const q = this.q().toLowerCase().trim();
    const sf = this.statusFilter();
    const pf = this.priorityFilter();

    return this.tickets().filter(t =>
      (!q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.createdBy?.name && t.createdBy.name.toLowerCase().includes(q)) ||
        (t.createdBy?.email && t.createdBy.email.toLowerCase().includes(q))) &&
      (!sf || t.status === sf) &&
      (!pf || t.priority === pf)
    );
  });
  constructor(
    private auth: AuthService,
    private api: TicketService,
    private router: Router
  ) {
    const u = this.auth.getUser?.();
    this.userName.set(this.auth.getUser()?.name || this.auth.getUser()?.email || null);
    this.load();
  }

  badgeClass(s: Status) {
    return {
      'border-[#3B6CF0] text-[#3B6CF0]': s === 'OPEN',
      'border-amber-500 text-amber-600': s === 'IN_PROGRESS',
      'border-emerald-600 text-emerald-700': s === 'RESOLVED',
    };
  }

  load() {
    this.loading = true;
    this.api.listAll().subscribe({
      next: (rows) => { this.tickets.set(rows); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  updateStatus(t: Ticket) {
    console.log('[updateStatus] going to send', { id: t._id, status: t.status });
    this.api.updateStatus(t._id, t.status).subscribe({
      next: (res) => console.log('[updateStatus] ok', res),
      error: (err) => {
        console.error('[updateStatus] error', err);
        alert(`Failed to update status: ` + (err?.error?.message ?? err?.message ?? 'unknown'));
      }
    });
  }

  openComment(id: string) { this.noteFor = id; this.noteText = ''; }
  cancelNote() { this.noteFor = null; this.noteText = ''; }
  saveNote(id: string) {
    const n = this.noteText.trim();
    if (n.length < 2) { alert('La note est trop courte'); return; }
    this.api.addNote(id, n).subscribe({
      next: () => this.cancelNote(),
      error: (err) => alert(err?.error?.message ?? 'Failed to save note')
    });
  }

  logout() { this.auth.logout?.(); this.router.navigate(['/login']); }
}
