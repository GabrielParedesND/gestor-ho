import { apiClient } from '../lib/api';
import { fallbackPeriods } from '../lib/fallbackData';
import type { Period, Vote, Tally, User, HomeOfficeGrant } from '@prisma/client';

export const periodService = {
  async getCurrentPeriod(): Promise<Period | null> {
    try {
      return await apiClient.getCurrentPeriod();
    } catch (error) {
      console.warn('Usando datos de respaldo para período actual');
      return fallbackPeriods[0] || null;
    }
  },

  async getPeriods(limit = 10): Promise<Period[]> {
    try {
      const periods = await apiClient.getPeriods();
      return periods.slice(0, limit);
    } catch (error) {
      console.warn('Usando datos de respaldo para períodos');
      return fallbackPeriods.slice(0, limit);
    }
  },

  async createPeriod(weekLabel: string, startDate: string, endDate: string): Promise<Period> {
    try {
      return await apiClient.createPeriod({
        weekLabel,
        startDate,
        endDate,
      });
    } catch (error) {
      throw new Error('Creación de períodos no disponible en modo de respaldo');
    }
  },

  async closePeriod(periodId: string): Promise<void> {
    try {
      await apiClient.closePeriod(periodId);
    } catch (error) {
      throw new Error('Cierre de períodos no disponible en modo de respaldo');
    }
  },
};