import api from './api';

export interface UpdateProfileDto {
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const settingsService = {
  async updateProfile(data: UpdateProfileDto): Promise<unknown> {
    const response = await api.put('/settings/profile', data);
    return response.data.data;
  },

  async changePassword(data: ChangePasswordDto): Promise<void> {
    await api.put('/settings/password', data);
  },

  async uploadLogo(file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};