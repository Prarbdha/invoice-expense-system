import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { ICreateClientRequest, IUpdateClientRequest } from '../types/client.types';

export const getClients = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { search } = req.query;

    let where: any = { userId };

    // Add search filter if provided
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 200, 'Clients fetched successfully', clients);
  } catch (error) {
    console.error('Get clients error:', error);
    sendError(res, 500, 'Error fetching clients', error);
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!client) {
      return sendError(res, 404, 'Client not found');
    }

    sendSuccess(res, 200, 'Client fetched successfully', client);
  } catch (error) {
    console.error('Get client error:', error);
    sendError(res, 500, 'Error fetching client', error);
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, email, phone, address, taxId }: ICreateClientRequest = req.body;

    // Validation
    if (!name || !email) {
      return sendError(res, 400, 'Name and email are required');
    }

    // Check if client with same email already exists for this user
    const existingClient = await prisma.client.findFirst({
      where: {
        userId,
        email,
      },
    });

    if (existingClient) {
      return sendError(res, 400, 'Client with this email already exists');
    }

    const client = await prisma.client.create({
      data: {
        userId,
        name,
        email,
        phone: phone || null,
        address: address || null,
        taxId: taxId || null,
      },
    });

    sendSuccess(res, 201, 'Client created successfully', client);
  } catch (error) {
    console.error('Create client error:', error);
    sendError(res, 500, 'Error creating client', error);
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const updateData: IUpdateClientRequest = req.body;

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingClient) {
      return sendError(res, 404, 'Client not found');
    }

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== existingClient.email) {
      const duplicateEmail = await prisma.client.findFirst({
        where: {
          userId,
          email: updateData.email,
          id: { not: id },
        },
      });

      if (duplicateEmail) {
        return sendError(res, 400, 'Client with this email already exists');
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, 200, 'Client updated successfully', client);
  } catch (error) {
    console.error('Update client error:', error);
    sendError(res, 500, 'Error updating client', error);
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingClient) {
      return sendError(res, 404, 'Client not found');
    }

    // Check if client has any invoices
    const invoiceCount = await prisma.invoice.count({
      where: { clientId: id },
    });

    if (invoiceCount > 0) {
      return sendError(
        res,
        400,
        'Cannot delete client with existing invoices. Please delete invoices first.'
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    sendSuccess(res, 200, 'Client deleted successfully', null);
  } catch (error) {
    console.error('Delete client error:', error);
    sendError(res, 500, 'Error deleting client', error);
  }
};