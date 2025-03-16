export interface LandingSession {
  sessionId: string;
  deviceInfo: any;
  lastSectionViewed?: number;
  totalSectionsViewed?: number;
  selectedTheme?: string;
  clickedHowItWorks?: boolean;
  clickedSignup?: boolean;
  completedSignup?: boolean;
  startedPartnerForm?: boolean;
  submittedPartnerForm?: boolean;
  lastSidebarViewed?: string;
  totalSidebarViews?: number;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
}