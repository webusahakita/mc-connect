export type EventStatus = 'tentative' | 'confirmed' | 'dp_paid' | 'completed' | 'cancelled';

export interface UserMC {
  id: number;
  name: string;
  email: string;
  phone?: string;
  stage_name?: string;
  bio?: string;
  instagram_handle?: string;
  youtube_showreel?: string;
  token_ai_tersisa?: number;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  instagram?: string;
  notes?: string;
}

export interface RundownItem {
  id: number;
  event_id: number;
  time_start: string;
  time_end: string;
  duration_minutes: number;
  title: string;
  description?: string;
  speaker_host?: string;
  cue_music?: string;
  cue_notes?: string;
  is_completed: boolean;
  order_index: number;
}

export interface EventItem {
  id: number;
  user_mc_id: number;
  event_name: string;
  event_category: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_city: string;
  client: Client;
  status: EventStatus;
  total_amount: number;
  dp_amount: number;
  remaining_amount: number;
  is_locked: boolean;
  rundowns?: RundownItem[];
}

export interface CashflowItem {
  id: number;
  event_id?: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  proof_url?: string;
}
