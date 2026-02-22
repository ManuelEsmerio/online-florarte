
// src/services/auth.service.ts
'use client';

import { allUsers } from '@/lib/data/user-data';
import type { User, LoginCredentials, RegisterData } from '@/lib/definitions';
import { v4 as uuidv4 } from 'uuid';

const USER_STORAGE_KEY = 'florarte_user_session';

/**
 * Simula el inicio de sesión de un usuario.
 * Valida email y contraseña contra los datos en user-data.ts.
 */
export const login = (credentials: LoginCredentials): User => {
  const { email, password } = credentials;
  
  // Buscar usuario por email y contraseña coincidente
  const user = allUsers.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password && 
    !u.is_deleted
  );

  if (!user) {
    throw new Error('Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
  }

  // Guardar sesión en localStorage para persistencia en el cliente
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
  return user;
};

/**
 * Simula el registro de un nuevo usuario.
 * Añade el usuario a la lista en memoria y lo guarda en localStorage.
 */
export const register = (data: RegisterData): User => {
  const { email, name, password } = data;
  
  const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  const newUser: User = {
    id: allUsers.length + 1,
    uid: uuidv4(),
    name,
    email,
    password, // Guardamos la contraseña en la demo
    role: 'customer',
    loyalty_points: 0,
    created_at: new Date().toISOString(),
  };

  // Añadir a la lista en memoria (se pierde al reiniciar el servidor en dev)
  allUsers.push(newUser);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
  }
  return newUser;
};

/**
 * Cierra la sesión del usuario.
 */
export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

/**
 * Obtiene el usuario actual desde localStorage.
 */
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (!userJson) {
    return null;
  }
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
};
