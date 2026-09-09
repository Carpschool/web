/**
 * API Client for Carpschool Federated Architecture
 * 
 * Manages communication with:
 * 1. Central Authority Server (listing schools, obtaining Ed25519 tickets)
 * 2. School Server (homes, applications, matching, negotiation, carpools)
 */

export const CENTRAL_SERVER_URL =
  process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || 'http://localhost:4000';

export interface School {
  _id: string;
  schoolCode: string;
  officialName: string;
  allowedEmailDomains: string[];
  baseUrl: string;
  isTrusted: boolean;
}

export interface FederationTicketResponse {
  ticket: string;
  schoolBaseUrl: string;
  isTrusted: boolean;
  expiresAt: string;
}

export const CentralAPI = {
  async getSchools(): Promise<School[]> {
    const res = await fetch(`${CENTRAL_SERVER_URL}/api/v1/schools`);
    if (!res.ok) throw new Error('Failed to fetch school directory');
    return res.json();
  },

  async getTicket(
    clerkToken: string,
    schoolCode: string,
    customBaseUrl?: string,
  ): Promise<FederationTicketResponse> {
    const res = await fetch(`${CENTRAL_SERVER_URL}/api/v1/schools/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({ schoolCode, customBaseUrl }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to obtain Federation Ticket');
    }

    return res.json();
  },
};

export const createSchoolAPI = (schoolBaseUrl: string, federationTicket: string) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${federationTicket}`,
  };

  return {
    async getProfile() {
      const res = await fetch(`${schoolBaseUrl}/api/v1/auth/me`, { headers });
      return res.json();
    },

    async sendEduCode(eduEmail: string) {
      const res = await fetch(`${schoolBaseUrl}/api/v1/auth/edu/send-code`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ eduEmail }),
      });
      return res.json();
    },

    async verifyEduCode(code: string) {
      const res = await fetch(`${schoolBaseUrl}/api/v1/auth/edu/verify-code`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      });
      return res.json();
    },

    async listHomes() {
      const res = await fetch(`${schoolBaseUrl}/api/v1/homes`, { headers });
      return res.json();
    },

    async createHome(data: {
      label: string;
      address: string;
      latitude: number;
      longitude: number;
      walkingRadiusMeters: number;
    }) {
      const res = await fetch(`${schoolBaseUrl}/api/v1/homes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return res.json();
    },

    async listMyApplications() {
      const res = await fetch(`${schoolBaseUrl}/api/v1/applications/my`, { headers });
      return res.json();
    },

    async createApplication(data: any) {
      const res = await fetch(`${schoolBaseUrl}/api/v1/applications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return res.json();
    },

    async getMatchingRiders(direction: string, driverHomeId: string) {
      const res = await fetch(
        `${schoolBaseUrl}/api/v1/matching/riders?direction=${direction}&driverHomeId=${driverHomeId}`,
        { headers },
      );
      return res.json();
    },

    async startNegotiation(applicationId: string) {
      const res = await fetch(
        `${schoolBaseUrl}/api/v1/negotiations/start/${applicationId}`,
        {
          method: 'POST',
          headers,
        },
      );
      return res.json();
    },

    async getNegotiation(id: string) {
      const res = await fetch(`${schoolBaseUrl}/api/v1/negotiations/${id}`, {
        headers,
      });
      return res.json();
    },

    async sendMessage(id: string, text: string) {
      const res = await fetch(`${schoolBaseUrl}/api/v1/negotiations/${id}/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      return res.json();
    },

    async proposePickupPoint(id: string, data: any) {
      const res = await fetch(
        `${schoolBaseUrl}/api/v1/negotiations/${id}/propose-pickup`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        },
      );
      return res.json();
    },

    async respondProposal(id: string, proposalId: string, action: 'CONFIRM' | 'DENY') {
      const res = await fetch(
        `${schoolBaseUrl}/api/v1/negotiations/${id}/proposals/${proposalId}/respond`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ action }),
        },
      );
      return res.json();
    },

    async lockInCarpool(id: string) {
      const res = await fetch(
        `${schoolBaseUrl}/api/v1/negotiations/${id}/lock-in`,
        {
          method: 'POST',
          headers,
        },
      );
      return res.json();
    },
  };
};
