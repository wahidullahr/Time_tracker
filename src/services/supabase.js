import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '../config/supabase.config';

// Initialize Supabase
let supabase;

try {
  supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
} catch (error) {
  console.error("Supabase initialization error:", error);
  throw new Error("Failed to initialize Supabase. Check your configuration.");
}

// Supabase Tables
export const TABLES = {
  USERS: 'users',
  COMPANIES: 'companies',
  TIME_ENTRIES: 'time_entries'
};

// Auth Functions
export const signInAnonymous = async () => {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error("Anonymous sign-in error:", error);
    throw error;
  }
};

// User Functions
export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert([{
        name: userData.name || '',
        title: userData.title || '',
        role: userData.role || 'employee',
        access_code: userData.accessCode || '',
        assigned_company_ids: userData.assignedCompanyIds || [],
        is_blocked: false,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    return data[0].id;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUserByAccessCode = async (accessCode) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('access_code', accessCode)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      title: data.title,
      role: data.role,
      accessCode: data.access_code,
      assignedCompanyIds: data.assigned_company_ids,
      isBlocked: data.is_blocked,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error("Error fetching user by access code:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(user => ({
      id: user.id,
      name: user.name,
      title: user.title,
      role: user.role,
      accessCode: user.access_code,
      assignedCompanyIds: user.assigned_company_ids,
      isBlocked: user.is_blocked,
      createdAt: user.created_at
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const updateData = {};
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.title !== undefined) updateData.title = userData.title;
    if (userData.role !== undefined) updateData.role = userData.role;
    if (userData.accessCode !== undefined) updateData.access_code = userData.accessCode;
    if (userData.assignedCompanyIds !== undefined) updateData.assigned_company_ids = userData.assignedCompanyIds;
    if (userData.isBlocked !== undefined) updateData.is_blocked = userData.isBlocked;
    
    const { error } = await supabase
      .from(TABLES.USERS)
      .update(updateData)
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase
      .from(TABLES.USERS)
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Company Functions
export const createCompany = async (companyData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.COMPANIES)
      .insert([{
        name: companyData.name || '',
        client_reference: companyData.clientReference || null,
        client_email: companyData.clientEmail || null,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    return data[0].id;
  } catch (error) {
    console.error("Error creating company:", error);
    throw error;
  }
};

export const getAllCompanies = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.COMPANIES)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(company => ({
      id: company.id,
      name: company.name,
      clientReference: company.client_reference,
      clientEmail: company.client_email,
      createdAt: company.created_at
    }));
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const updateCompany = async (companyId, companyData) => {
  try {
    const updateData = {};
    if (companyData.name !== undefined) updateData.name = companyData.name;
    if (companyData.clientReference !== undefined) updateData.client_reference = companyData.clientReference;
    if (companyData.clientEmail !== undefined) updateData.client_email = companyData.clientEmail;
    
    const { error } = await supabase
      .from(TABLES.COMPANIES)
      .update(updateData)
      .eq('id', companyId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error updating company:", error);
    throw error;
  }
};

export const deleteCompany = async (companyId) => {
  try {
    const { error } = await supabase
      .from(TABLES.COMPANIES)
      .delete()
      .eq('id', companyId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting company:", error);
    throw error;
  }
};

// Time Entry Functions
export const createTimeEntry = async (entryData) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.TIME_ENTRIES)
      .insert([{
        user_id: entryData.userId || '',
        user_name: entryData.userName || '',
        user_title: entryData.userTitle || '',
        company_name: entryData.companyName || '',
        description: entryData.description || '',
        seconds: entryData.seconds || 0,
        date: entryData.date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    return data[0].id;
  } catch (error) {
    console.error("Error creating time entry:", error);
    throw error;
  }
};

export const getAllTimeEntries = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.TIME_ENTRIES)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(entry => ({
      id: entry.id,
      userId: entry.user_id,
      userName: entry.user_name,
      userTitle: entry.user_title,
      companyName: entry.company_name,
      description: entry.description,
      seconds: entry.seconds,
      date: entry.date,
      createdAt: entry.created_at
    }));
  } catch (error) {
    console.error("Error fetching time entries:", error);
    throw error;
  }
};

export const getTimeEntriesByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.TIME_ENTRIES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(entry => ({
      id: entry.id,
      userId: entry.user_id,
      userName: entry.user_name,
      userTitle: entry.user_title,
      companyName: entry.company_name,
      description: entry.description,
      seconds: entry.seconds,
      date: entry.date,
      createdAt: entry.created_at
    }));
  } catch (error) {
    console.error("Error fetching user time entries:", error);
    throw error;
  }
};

export const updateTimeEntry = async (entryId, entryData) => {
  try {
    const updateData = {};
    if (entryData.description !== undefined) updateData.description = entryData.description;
    if (entryData.seconds !== undefined) updateData.seconds = entryData.seconds;
    
    const { error } = await supabase
      .from(TABLES.TIME_ENTRIES)
      .update(updateData)
      .eq('id', entryId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error updating time entry:", error);
    throw error;
  }
};

export const deleteTimeEntry = async (entryId) => {
  try {
    const { error } = await supabase
      .from(TABLES.TIME_ENTRIES)
      .delete()
      .eq('id', entryId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Error deleting time entry:", error);
    throw error;
  }
};

// Export Supabase client
export { supabase };
