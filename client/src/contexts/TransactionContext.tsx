import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction } from '@/lib/types';
import { useAuth } from './AuthContext';

export interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByUser: (userId: string) => Transaction[];
  getTransactionsByDateRange: (userId: string, startDate: string, endDate: string) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const API_URL = '/vps-api'; // Menggunakan proxy Vercel untuk menghindari Mixed Content

  // Load transactions from VPS backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${API_URL}/transactions`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        // Fallback to localStorage if server fails
        const stored = localStorage.getItem('transactions');
        if (stored) setTransactions(JSON.parse(stored));
      }
    };
    fetchTransactions();
  }, []);

  // Save transactions to VPS backend whenever they change
  useEffect(() => {
    const syncTransactions = async () => {
      try {
        await fetch(`${API_URL}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactions),
        });
        localStorage.setItem('transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error('Failed to sync transactions:', error);
        localStorage.setItem('transactions', JSON.stringify(transactions));
      }
    };
    if (transactions.length > 0) syncTransactions();
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setTransactions([...transactions, newTransaction]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(transactions.map(tx => (tx.id === id ? { ...tx, ...updates } : tx)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
  };

  const getTransactionsByUser = (userId: string) => {
    return transactions.filter(tx => tx.userId === userId);
  };

  const getTransactionsByDateRange = (userId: string, startDate: string, endDate: string) => {
    return transactions.filter(tx => {
      if (tx.userId !== userId) return false;
      const txDate = new Date(tx.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return txDate >= start && txDate <= end;
    });
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionsByUser,
        getTransactionsByDateRange,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
};
