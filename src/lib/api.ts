const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error en la petición' }));
        throw new Error(error.error || 'Error en la petición');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('No se puede conectar al servidor. Asegúrate de que esté ejecutándose en http://localhost:3001');
      }
      throw error;
    }
  }

  // Auth
  async signIn(email: string, password: string) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async deactivateUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Periods
  async getPeriods() {
    return this.request('/periods');
  }

  async getCurrentPeriod() {
    return this.request('/periods/current');
  }

  async createPeriod(periodData: any) {
    return this.request('/periods', {
      method: 'POST',
      body: JSON.stringify(periodData),
    });
  }

  async closePeriod(periodId: string) {
    return this.request(`/periods/${periodId}/close`, {
      method: 'POST',
    });
  }

  // Voting
  async getVotesForPeriod(periodId: string) {
    return this.request(`/periods/${periodId}/votes`);
  }

  async getCandidatesForPeriod(periodId: string) {
    return this.request(`/periods/${periodId}/candidates`);
  }

  async castVote(voteData: any) {
    return this.request('/votes', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  // Grants
  async getUserGrants(userId: string, available?: boolean) {
    try {
      const query = available !== undefined ? `?available=${available}` : '';
      return await this.request(`/users/${userId}/grants${query}`);
    } catch (error) {
      console.warn('Usando datos de respaldo para grants');
      return [];
    }
  }

  async redeemGrant(grantId: string, requestedDate: string, userId: string) {
    try {
      return await this.request(`/grants/${grantId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ requestedDate, userId }),
      });
    } catch (error) {
      console.warn('Redención de grant no disponible en modo de respaldo');
      throw error;
    }
  }

  async getPeriodResults(periodId: string) {
    try {
      return await this.request(`/periods/${periodId}/results`);
    } catch (error) {
      console.warn('Usando datos de respaldo para resultados');
      return [];
    }
  }

  // Initiatives
  async getUserInitiatives(userId: string) {
    return this.request(`/users/${userId}/initiatives`);
  }

  async getAllInitiatives() {
    return this.request('/initiatives');
  }

  async createInitiative(initiativeData: any) {
    return this.request('/initiatives', {
      method: 'POST',
      body: JSON.stringify(initiativeData),
    });
  }

  async approveInitiative(id: string, approverId: string, points: number = 5) {
    return this.request(`/initiatives/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approverId, points }),
    });
  }

  async updateInitiativeStatus(id: string, status: string, userId: string) {
    return this.request(`/initiatives/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, userId }),
    });
  }

  async redeemPoints(userId: string, points: number) {
    return this.request('/points/redeem', {
      method: 'POST',
      body: JSON.stringify({ userId, points }),
    });
  }

  async rejectInitiative(id: string, rejectedBy: string) {
    return this.request(`/initiatives/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectedBy }),
    });
  }

  // Audit
  async createAuditLog(logData: any) {
    return this.request('/audit', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  async getAuditLogs() {
    return this.request('/audit');
  }

  // Settings
  async getSettings() {
    try {
      return await this.request('/settings');
    } catch (error) {
      console.warn('Usando configuraciones por defecto');
      return [];
    }
  }

  async saveSettings(settings: any, userId: string) {
    try {
      return await this.request('/settings', {
        method: 'POST',
        body: JSON.stringify({ settings, userId }),
      });
    } catch (error) {
      console.warn('Guardado de configuraciones no disponible en modo de respaldo');
      throw error;
    }
  }

  // Leaderboard
  async getPointsLeaderboard() {
    try {
      return await this.request('/leaderboard/points');
    } catch (error) {
      console.warn('Usando datos de respaldo para leaderboard de puntos');
      return [];
    }
  }

  async getGrantsLeaderboard() {
    try {
      return await this.request('/leaderboard/grants');
    } catch (error) {
      console.warn('Usando datos de respaldo para leaderboard de grants');
      return [];
    }
  }
}

export const apiClient = new ApiClient();