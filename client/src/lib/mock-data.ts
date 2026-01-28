import { useState, useEffect } from "react";

export interface Log {
  id: string;
  name: string;
  action: 'IN' | 'OUT' | 'DENIED';
  timestamp: string; // ISO string for serialization safety
}

export interface Employee {
  name: string;
  entryTime: string;
}

// Singleton state to persist across navigation
class MockStore {
  private employees: Map<string, string> = new Map(); // Name -> EntryTime
  private logs: Log[] = [];
  private listeners: Set<() => void> = new Set();
  public readonly CAPACITY = 50;

  constructor() {
    // Seed some data for demo
    // this.scan("Alice Johnson");
    // this.scan("Bob Smith");
    // this.scan("Charlie Brown");
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getEmployees(): Employee[] {
    return Array.from(this.employees.entries()).map(([name, entryTime]) => ({
      name,
      entryTime
    }));
  }

  getLogs(): Log[] {
    return [...this.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getCount(): number {
    return this.employees.size;
  }

  scan(name: string): { success: boolean; message: string; type: 'IN' | 'OUT' | 'DENIED' } {
    const normalizedName = name.trim();
    if (!normalizedName) return { success: false, message: "Invalid name", type: 'DENIED' };

    // The logic already handles toggle (IN -> OUT, OUT -> IN)
    // We just need to ensure the user understands this behavior
    if (this.employees.has(normalizedName)) {
      // If already in the room, checking them OUT
      this.employees.delete(normalizedName);
      this.log(normalizedName, 'OUT');
      this.notify();
      return { success: true, message: `Goodbye, ${normalizedName}. Checked out.`, type: 'OUT' };
    } else {
      // If not in the room, checking them IN
      if (this.employees.size >= this.CAPACITY) {
        this.log(normalizedName, 'DENIED');
        this.notify();
        return { success: false, message: "Room is at full capacity.", type: 'DENIED' };
      }
      this.employees.set(normalizedName, new Date().toISOString());
      this.log(normalizedName, 'IN');
      this.notify();
      return { success: true, message: `Welcome, ${normalizedName}. Checked in.`, type: 'IN' };
    }
  }

  private log(name: string, action: 'IN' | 'OUT' | 'DENIED') {
    this.logs.push({
      id: Math.random().toString(36).substr(2, 9),
      name,
      action,
      timestamp: new Date().toISOString()
    });
  }
}

export const store = new MockStore();

// Hook for React components
export function useStore() {
  const [version, setVersion] = useState(0);
  
  useEffect(() => {
    return store.subscribe(() => setVersion(v => v + 1));
  }, []);

  return store;
}
