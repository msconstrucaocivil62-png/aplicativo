export type UserRole = 'client' | 'pro' | 'admin';
export type PlanStatus = 'active' | 'expired';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  categories?: string[];
  avatar?: string;
  planStatus?: PlanStatus;
  planDueDate?: string;
  bio?: string;
  location?: string;
  rating?: number;
  ratingsCount?: number;
  clientRating?: number;
  clientRatingsCount?: number;
  completedJobs?: number;
  latitude?: number;
  longitude?: number;
  accountStatus?: 'active' | 'pending_review' | 'blocked';
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  activeProsCount?: number;
}

export interface ServiceOrder {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string; // Sanitized by backend if Pro plan is expired
  category: string;
  title: string;
  description: string;
  location: string;
  urgency: 'baixa' | 'media' | 'alta' | 'imediato';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  assignedProId?: string;
  assignedProName?: string;
  clientRating?: number; // Avaliação de 1 a 5 estrelas do cliente dada pelo pro
  clientRatingComment?: string; // Feedback ou comentário
  clientRatedAt?: string;
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
  attachments?: Array<{ id: string; name: string; type: string; dataUrl: string }>;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  reply?: string;
}

export interface SubscriptionPlan {
  id: 'monthly' | 'semiannual' | 'annual';
  title: string;
  price: number;
  days: number;
  description: string;
  savings?: string;
  badge?: string;
  installmentText?: string;
}

export interface PaymentTransaction {
  id: string;
  proId: string;
  proName: string;
  planId: 'monthly' | 'semiannual' | 'annual';
  amount: number;
  paymentMethod: 'pix' | 'credit_card';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  qrCode?: string;
  qrCodeBase64?: string;
  initPoint?: string;
}

export interface AppConfig {
  mercadoPagoAccessToken: string;
  pixReceiverKey: string;
  pixReceiverName?: string; // Nome do Titular / Beneficiário da Conta
  pixReceiverBank?: string; // Instituição Financeira / Banco
  pixReceiverCnpjCpf?: string; // CNPJ ou CPF do Titular
  pixInstructions?: string; // Instruções e Regras de Comprovante ou Depósito
  platformFeePercentage: number;
  autoApprovePaymentsSimulated: boolean;
}
