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
  userName = '';
  loading = false;

  // 🔁 Filters as signals (so computed(...) reacts)
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
  onFiltersChange() {}
  resetFilters() {
    this.q.set('');
    this.statusFilter.set('');
    this.priorityFilter.set('');
  }

  // Data
  tickets = signal<Ticket[]>([]);

  // Filtered view (reactive)
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

  // ============================
  // 📊 STATISTICS (reactive)
  // ============================

  // Helpers
  private countBy<T extends string>(items: Ticket[], key: (t: Ticket) => T): Record<T, number> {
    return items.reduce((acc, cur) => {
      const k = key(cur);
     
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {} as Record<T, number>);
  }
  percent(part: number, total: number) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  // Overall stats (all tickets)
  totalAll      = computed(() => this.tickets().length);
  byStatusAll   = computed(() => this.countBy(this.tickets(), t => t.status));
  byPriorityAll = computed(() => this.countBy(this.tickets(), t => t.priority));
  resolvedAll   = computed(() => this.tickets().filter(t => t.status === 'RESOLVED').length);
  resolutionRateAll = computed(() => this.percent(this.resolvedAll(), this.totalAll()));

  // Filtered stats (current view)
  totalView      = computed(() => this.filtered().length);
  byStatusView   = computed(() => this.countBy(this.filtered(), t => t.status));
  byPriorityView = computed(() => this.countBy(this.filtered(), t => t.priority));
  resolvedView   = computed(() => this.filtered().filter(t => t.status === 'RESOLVED').length);
  resolutionRateView = computed(() => this.percent(this.resolvedView(), this.totalView()));

  // Mini “last 7 days” (based on createdAt)
  private isInLastNDays(dateISO: string, n = 7) {
    const d = new Date(dateISO);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
    return diff <= n;
  }
  createdLast7All  = computed(() => this.tickets().filter(t => this.isInLastNDays(t.createdAt, 7)).length);
  createdLast7View = computed(() => this.filtered().filter(t => this.isInLastNDays(t.createdAt, 7)).length);

  constructor(
    private auth: AuthService,
    private api: TicketService,
    private router: Router
  ) {
    const u = this.auth.getUser?.();
    this.userName = u?.name || 'Cadre';
    this.load();
  }

  badgeClass(s: Status) {
    return {
      'border-[#3B6CF0] text-[#3B6CF0]': s === 'OPEN',
      'border-amber-500 text-amber-600': s === 'IN_PROGRESS',
      'border-emerald-600 text-emerald-700': s === 'RESOLVED',
    };
  }

  barWidth(count: number, total: number) {
    const pct = this.percent(count, total);
    return `${pct}%`;
  }

  load() {
    this.loading = true;
    this.api.listAll().subscribe({
      next: (rows) => { this.tickets.set(rows); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  updateStatus(t: Ticket) {
    this.api.updateStatus(t._id, t.status).subscribe({
      next: () => {},
      error: (err) => {
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
