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
        const errorData = await response.json().catch(() => ({ error: 'Error en la petición' }));
        const error = new Error(errorData.error || 'Error en la petición') as any;
        // Agregar la estructura de respuesta similar a axios
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
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

  async closePeriod(periodId: string, force: boolean = false) {
    return this.request(`/periods/${periodId}/close`, {
      method: 'POST',
      body: JSON.stringify({ force }),
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
      console.warn('Error al cargar grants');
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
      console.warn('Error al redimir grant');
      throw error;
    }
  }

  async getPeriodResults(periodId: string) {
    try {
      return await this.request(`/periods/${periodId}/results`);
    } catch (error) {
      console.warn('Error al cargar resultados');
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

  // Nominations
  async createNomination(nominationData: any) {
    return this.request('/nominations', {
      method: 'POST',
      body: JSON.stringify(nominationData),
    });
  }

  async getNominations(periodId: string) {
    return this.request(`/periods/${periodId}/nominations`);
  }

  async deleteNomination(id: string) {
    return this.request(`/nominations/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(projectData: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: any) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
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
      console.warn('Error al guardar configuraciones');
      throw error;
    }
  }

  // Leaderboard
  async getPointsLeaderboard() {
    try {
      return await this.request('/leaderboard/points');
    } catch (error) {
      console.warn('Error al cargar leaderboard de puntos');
      return [];
    }
  }

  async getGrantsLeaderboard() {
    try {
      return await this.request('/leaderboard/grants');
    } catch (error) {
      console.warn('Error al cargar leaderboard de grants');
      return [];
    }
  }

  // Special Mentions
  async getSpecialMentions() {
    try {
      return await this.request('/special-mentions');
    } catch (error) {
      console.warn('Error al cargar menciones especiales');
      return [];
    }
  }

  async getActiveSpecialMentions() {
    try {
      return await this.request('/special-mentions/active');
    } catch (error) {
      console.warn('Error al cargar menciones especiales activas');
      return [];
    }
  }

  async uploadSpecialMentionImage(file: File) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/special-mentions/upload`, {
        method: 'POST',
        body: formData, // No agregar Content-Type para FormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error en la petición' }));
        const error = new Error(errorData.error || 'Error en la petición') as any;
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('No se puede conectar al servidor. Asegúrate de que esté ejecutándose en http://localhost:3001');
      }
      throw error;
    }
  }

  async createSpecialMention(mentionData: any) {
    return this.request('/special-mentions', {
      method: 'POST',
      body: JSON.stringify(mentionData),
    });
  }

  async updateSpecialMention(id: string, mentionData: any) {
    return this.request(`/special-mentions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mentionData),
    });
  }

  async deleteSpecialMention(id: string, userId: string) {
    return this.request(`/special-mentions/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }
}

export const apiClient = new ApiClient();